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

# (level number, module order_indexes, whether learners can reach it yet)
#
# A closed level is part of the plan, not a gap: Role-Specific Applications is
# Level 3, which is written down here so the structure is explicit, and simply
# not open. Opening it later is one flag, not a redesign.
#
# The catalogue is ordered to match: Role-Specific Applications was sitting at
# position 6, between the Level 2 modules, purely because that is where it
# happened to be written. It moved to the end, where a Level 3 module belongs,
# so the levels are contiguous and a learner walks straight through them.
LEVELS: list[dict] = [
    {"level": 1, "modules": (0, 1, 2), "open": True},
    {"level": 2, "modules": (3, 4, 5, 6), "open": True},
    {"level": 3, "modules": (7,), "open": False},
]

# The levels a learner can actually earn today. Everything that issues a
# certificate, counts a requirement or describes the course to a learner reads
# this, never LEVELS — otherwise a closed level would be promised and never
# arrive.
OPEN_LEVELS: list[dict] = [lv for lv in LEVELS if lv.get("open")]

# The modules a learner may reach: exactly those in an open level. Membership
# rather than a ceiling, which costs nothing now that the ordering is tidy and
# keeps the rule honest if a level is ever opened out of sequence.
CERTIFIED_MODULES = frozenset(m for lv in OPEN_LEVELS for m in lv["modules"])
LEARNER_MAX_MODULE_ORDER = max(CERTIFIED_MODULES)

# Highest level that can currently be earned.
MAX_LEVEL = max(lv["level"] for lv in OPEN_LEVELS)


def level_for_module(order_index: int) -> int | None:
    """Which level a module belongs to, open or not — this is the taxonomy, and
    the admin badge reads it. Use CERTIFIED_MODULES to ask what a learner can
    actually reach."""
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


def modules_up_to_level(level: int) -> tuple[int, ...]:
    """Every open module from the start through this level.

    Built from the level map rather than a range: the two agree today, and a
    range would quietly start counting a closed level's lessons the moment the
    ordering changed again.
    """
    out: list[int] = []
    for lv in OPEN_LEVELS:
        if lv["level"] <= level:
            out.extend(lv["modules"])
    return tuple(sorted(out))
