"""Passwords for the content and marketing admin roles.

Stored as bcrypt hashes in app_settings, NOT as environment variables:
- a password in Render is visible to anyone with dashboard access and changing
  it restarts the service
- a default password in the repo would be a published credential

So these are set by the super admin from the admin UI and only ever stored
hashed. Nothing here can return a password — there is no code path that reads
one back, because a hash cannot be reversed.

The super admin password stays in ADMIN_PASSWORD. It is the bootstrap
credential: it must work before anyone can log in to set the others, and keeping
it where it already is means no window where nobody can get in.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import ADMIN_CONTENT, ADMIN_MARKETING, hash_password, verify_password
from db.models import AppSetting

# Roles whose password lives in the DB. Super is deliberately absent.
DB_ROLES = (ADMIN_CONTENT, ADMIN_MARKETING)

# Short enough to be memorable, long enough that the login throttle is not the
# only thing standing between a guesser and learner phone numbers and chat
# transcripts. Three ordinary words clear this easily.
MIN_PASSWORD_LEN = 12


def _key(role: str) -> str:
    return f"pw_{role}"


async def get_hash(db: AsyncSession, role: str) -> str | None:
    if role not in DB_ROLES:
        return None
    row = (await db.execute(
        select(AppSetting).where(AppSetting.key == _key(role)))).scalars().first()
    return (row.value or None) if row else None


async def set_password(db: AsyncSession, role: str, password: str) -> None:
    if role not in DB_ROLES:
        raise ValueError(f"role has no DB password: {role}")
    if len(password or "") < MIN_PASSWORD_LEN:
        raise ValueError(f"password must be at least {MIN_PASSWORD_LEN} characters")
    digest = hash_password(password)
    row = (await db.execute(
        select(AppSetting).where(AppSetting.key == _key(role)))).scalars().first()
    if row is None:
        db.add(AppSetting(key=_key(role), value=digest))
    else:
        row.value = digest
    await db.commit()


async def clear_password(db: AsyncSession, role: str) -> None:
    """Remove a role's password, which disables that login entirely."""
    row = (await db.execute(
        select(AppSetting).where(AppSetting.key == _key(role)))).scalars().first()
    if row is not None:
        row.value = ""
        await db.commit()


async def check(db: AsyncSession, role: str, password: str) -> bool:
    digest = await get_hash(db, role)
    if not digest:
        return False        # no password set = that role cannot log in
    try:
        return verify_password(password, digest)
    except Exception:
        return False        # corrupt hash must not 500 the login endpoint


async def which_roles_configured(db: AsyncSession) -> dict[str, bool]:
    """Whether each role has a password — never the password or its hash."""
    return {r: bool(await get_hash(db, r)) for r in DB_ROLES}
