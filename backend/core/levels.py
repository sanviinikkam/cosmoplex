"""Which modules make up which certification level.

The course has eight modules, but the certified path is deliberately shorter
than the catalogue: levels 1 and 2 cover modules 1-5, and modules 6-8 stay
visible to admins while being unreachable for learners. Two consequences follow
from that and are relied on elsewhere:

  • _db_lessons stops at LEARNER_MAX_MODULE_ORDER, so a learner who finishes
    module 5 gets the "more coming soon" message rather than module 6.
  • A level is earned by passing the last lesson of its last module. Because a
    missing video ends a learner's lesson list where it falls, reaching that
    lesson proves every lesson before it existed in their language and was
    completed — so no separate completeness check is needed.

Order indexes, not titles: modules can be renamed, and are, in six languages.
"""

# (level number, module order_indexes, short name for the certificate)
LEVELS: list[dict] = [
    {"level": 1, "modules": (0, 1, 2)},
    {"level": 2, "modules": (3, 4)},
]

# The last module a learner may reach. Everything above it is admin-only for now
# — module 6 (Role-Specific Applications) is deliberately excluded from
# certification, and 7-8 are not being taught yet.
LEARNER_MAX_MODULE_ORDER = max(m for lv in LEVELS for m in lv["modules"])

# Highest level that can currently be earned.
MAX_LEVEL = max(lv["level"] for lv in LEVELS)


def level_for_module(order_index: int) -> int | None:
    """Which level a module belongs to, or None if it is not certified."""
    for lv in LEVELS:
        if order_index in lv["modules"]:
            return lv["level"]
    return None


def modules_in_level(level: int) -> tuple[int, ...]:
    for lv in LEVELS:
        if lv["level"] == level:
            return lv["modules"]
    return ()


def last_module_of_level(level: int) -> int | None:
    mods = modules_in_level(level)
    return max(mods) if mods else None
