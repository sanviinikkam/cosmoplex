"""
Lightweight profanity/abuse filter for learner free-text input.

Cheap keyword/regex check applied BEFORE text reaches the AI or gets stored
(assignment answers, open tutor chat) — per the go-live checklist. This is
intentionally simple (word-boundary matching against a moderate list covering
English plus common Latin-transliterated Hindi/Marathi/Telugu/Tamil/Kannada
profanity, since most learners type in Latin script even for Indian
languages) and will have both false positives and false negatives. It is a
first line of defense, not a complete solution — upgrade to a moderation
model/API later if abuse turns out to be a real problem in practice.
"""
import re

_WORDS = [
    # English
    "fuck", "fucker", "fucking", "shit", "bullshit", "bitch", "asshole",
    "bastard", "slut", "whore", "cunt", "dick", "pussy", "nigger", "faggot",
    "retard", "rape", "molest",
    # Hindi / Marathi (Latin transliteration; also common in Telugu/Tamil/Kannada chat)
    "chutiya", "chutiye", "madarchod", "behenchod", "bhenchod", "bsdk",
    "randi", "gandu", "gaand", "harami", "kutte", "kamina", "saala kutta",
    "lund", "lauda", "chodu", "bhosdi", "bhosda",
    # Telugu
    "lanja", "dengey", "pooku",
    # Tamil
    "punda", "otha", "thevidiya",
    # Kannada
    "swalpa nalli", "hendthi",
]

# Word-boundary, case-insensitive. \b works fine here since these are Latin-script
# tokens; native-script slurs aren't covered by this list (see module docstring).
_PATTERN = re.compile(r"(?<![a-zA-Z])(" + "|".join(re.escape(w) for w in _WORDS) + r")(?![a-zA-Z])",
                     re.IGNORECASE)


def is_abusive(text: str | None) -> bool:
    """True if `text` contains a flagged word. Cheap and imperfect by design —
    see module docstring."""
    if not text:
        return False
    return bool(_PATTERN.search(text))
