"""
Records the most recent AI-call failure per provider, so the admin health check
can surface silent degradation — e.g. Anthropic/Groq running out of credits, which
otherwise only shows up as learners quietly not getting tutor/grading replies.

There's no public "remaining balance" API for Anthropic/Groq, so the reliable
signal is an actual call failing. Providers' console alerts + auto-reload remain
the proactive safety net; this is the in-app reactive one.

In-memory, per-process (same caveat as core/rate_limit.py / core/spend_guard.py).
"""
import time

_last_error: dict[str, dict] = {}   # provider -> {"at": epoch, "error": str}

# Substrings that indicate a billing/credit/quota problem (vs a transient blip).
_BILLING_HINTS = ("credit", "billing", "quota", "insufficient", "payment",
                  "balance", "402", "429", "rate limit", "exceeded")


def record_ai_error(provider: str, error: str) -> None:
    _last_error[provider] = {"at": time.time(), "error": str(error)[:200]}


def record_ai_ok(provider: str) -> None:
    """A success clears the provider's recent-error flag."""
    _last_error.pop(provider, None)


def recent_errors(within_seconds: int = 3600) -> dict:
    """Providers that failed within the window, with how long ago + whether the
    error looks billing/quota-related."""
    now = time.time()
    out = {}
    for provider, rec in _last_error.items():
        age = now - rec["at"]
        if age <= within_seconds:
            low = rec["error"].lower()
            out[provider] = {
                "minutesAgo": round(age / 60, 1),
                "error": rec["error"],
                "billingLikely": any(h in low for h in _BILLING_HINTS),
            }
    return out
