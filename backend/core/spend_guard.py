"""
Global daily circuit breaker for paid AI calls (Anthropic + Groq).

In-memory, per-process (same caveat as core/rate_limit.py — fine for a single
Render instance; move to Redis/DB if this ever scales horizontally). Bounds
worst-case spend from abuse or a runaway bug: once DAILY_AI_CALL_LIMIT calls
have been made today, further AI calls are skipped in favor of a canned reply
until the counter resets at UTC midnight. Not a precise cost tracker — a
blunt, cheap safety net.
"""
import time

from core.config import settings

_day_key: str | None = None
_count = 0


def _today() -> str:
    return time.strftime("%Y-%m-%d", time.gmtime())


def allow_ai_call() -> bool:
    """Call this immediately before each paid AI request. Returns False once
    today's ceiling is hit — the caller should skip the AI call and fall back
    to a canned reply instead."""
    global _day_key, _count
    today = _today()
    if _day_key != today:
        _day_key = today
        _count = 0
    if _count >= settings.daily_ai_call_limit:
        return False
    _count += 1
    return True
