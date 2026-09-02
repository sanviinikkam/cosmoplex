"""Admin-flippable runtime settings, stored in the DB.

Read on demand rather than cached: these are checked at low-frequency moments
(a quiz pass, an admin save), and a cache would mean a toggle appearing to do
nothing until the next restart — the exact confusion a runtime toggle exists to
avoid.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AppSetting

# key -> default. Assignments ship DISABLED: the WhatsApp flow is video -> quiz ->
# next lesson, and the assignment step is opt-in.
DEFAULTS: dict[str, bool] = {
    "assignments_enabled": False,
}


def _as_bool(raw: str | None, default: bool) -> bool:
    if raw is None:
        return default
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


async def get_flag(db: AsyncSession, key: str) -> bool:
    """Current value of a boolean setting, falling back to its default."""
    default = DEFAULTS.get(key, False)
    try:
        row = (await db.execute(select(AppSetting).where(AppSetting.key == key))).scalars().first()
    except Exception as e:      # never let a settings read break a learner's flow
        print(f"WARN settings read failed for {key}: {type(e).__name__}: {e}")
        return default
    return _as_bool(row.value if row else None, default)


async def set_flag(db: AsyncSession, key: str, value: bool) -> bool:
    row = (await db.execute(select(AppSetting).where(AppSetting.key == key))).scalars().first()
    if row is None:
        row = AppSetting(key=key, value="true" if value else "false")
        db.add(row)
    else:
        row.value = "true" if value else "false"
    await db.commit()
    return value


async def all_flags(db: AsyncSession) -> dict[str, bool]:
    return {k: await get_flag(db, k) for k in DEFAULTS}
