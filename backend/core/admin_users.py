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

import hmac
import time

from core.auth import (ADMIN_SUPER, ADMIN_CONTENT, ADMIN_MARKETING,
                       hash_password, verify_password)
from core.config import settings
from db.models import AppSetting

# All three passwords live here now. ADMIN_PASSWORD remains the BOOTSTRAP
# credential for super: it is used only while no super hash has been set, so a
# fresh deploy is never locked out, and it stops working the moment a password
# is set from the panel.
DB_ROLES = (ADMIN_SUPER, ADMIN_CONTENT, ADMIN_MARKETING)

# Tokens issued before this unix timestamp are refused. Changing a password
# bumps it, which is what actually signs existing sessions out — a JWT is
# stateless, so without this a changed password would leave every open session
# working until its own expiry.
TOKEN_EPOCH_KEY = "admin_token_epoch"

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
    # Anyone holding a token minted with the old password is signed out.
    await bump_token_epoch(db)


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
        if role == ADMIN_SUPER and settings.admin_password:
            # Bootstrap only: no super password has been set from the panel yet.
            return hmac.compare_digest(
                (password or "").encode("utf-8"), settings.admin_password.encode("utf-8"))
        return False        # no password set = that role cannot log in
    try:
        return verify_password(password, digest)
    except Exception:
        return False        # corrupt hash must not 500 the login endpoint


async def get_token_epoch(db: AsyncSession) -> int:
    """Tokens issued before this are refused. 0 = never invalidated."""
    try:
        row = (await db.execute(
            select(AppSetting).where(AppSetting.key == TOKEN_EPOCH_KEY))).scalars().first()
        return int(row.value) if row and row.value else 0
    except Exception:
        return 0            # a read failure must not lock every admin out


async def bump_token_epoch(db: AsyncSession) -> int:
    """Sign every existing session out, now."""
    now = int(time.time())
    row = (await db.execute(
        select(AppSetting).where(AppSetting.key == TOKEN_EPOCH_KEY))).scalars().first()
    if row is None:
        db.add(AppSetting(key=TOKEN_EPOCH_KEY, value=str(now)))
    else:
        row.value = str(now)
    await db.commit()
    return now


async def which_roles_configured(db: AsyncSession) -> dict[str, bool]:
    """Whether each role has a password — never the password or its hash."""
    return {r: bool(await get_hash(db, r)) for r in DB_ROLES}
