"""
Records the most recent AI-call failure per provider, so the admin health check
can surface silent degradation — e.g. Anthropic/Groq running out of credits, which
otherwise only shows up as learners quietly not getting tutor/grading replies.

There's no public "remaining balance" API for Anthropic/Groq, so the reliable
signal is an actual call failing. Providers' console alerts + auto-reload remain
the proactive safety net; this is the in-app reactive one.

In-memory, per-process (same caveat as core/rate_limit.py / core/spend_guard.py).
"""
import functools
import time

_last_error: dict[str, dict] = {}   # provider -> {"at": epoch, "error": str}

# Substrings that indicate a billing/credit/quota problem (vs a transient blip).
_BILLING_HINTS = ("credit", "billing", "quota", "insufficient", "payment",
                  "balance", "402", "429", "rate limit", "exceeded")


def _readable(error) -> str:
    """The provider's own explanation, not the SDK's repr.

    str() on an SDK exception gives 'Error code: 400 - {...nested dict...}', and
    the health panel truncates that long before the part a human needs — the
    admin saw a mangled dict where it should have said the balance was empty.
    The SDKs carry the parsed body, so read the message out of it."""
    body = getattr(error, "body", None)
    if isinstance(body, dict):
        inner = body.get("error")
        if isinstance(inner, dict) and inner.get("message"):
            return str(inner["message"])[:200]
        if body.get("message"):
            return str(body["message"])[:200]
    return str(error)[:200]


def record_ai_error(provider: str, error) -> None:
    _last_error[provider] = {"at": time.time(), "error": _readable(error)}


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


# ── Instrumentation ───────────────────────────────────────────────────────────
# Recording outcomes at each call site did not work: only two of the ten
# Anthropic calls in the codebase ever did it, so when the Teacher and the intent
# router went dark on an empty balance nothing was written down, and the admin
# health check stayed green right through the outage. Any call site added later
# would have had the same problem — remembering to instrument is exactly the kind
# of thing that gets forgotten.
#
# So the SDK method itself is wrapped, once, at startup. Every Anthropic call is
# covered no matter which module or client instance makes it, including ones
# written later. The wrapper only observes: it re-raises whatever it caught, so
# callers' own error handling is untouched.
_instrumented = False


def _wrap_method(cls, name: str, provider: str) -> bool:
    original = getattr(cls, name)
    if getattr(original, "_ai_health_wrapped", False):
        return False

    @functools.wraps(original)
    async def wrapper(*args, **kwargs):
        try:
            result = await original(*args, **kwargs)
        except Exception as e:
            record_ai_error(provider, e)
            raise
        record_ai_ok(provider)
        return result

    wrapper._ai_health_wrapped = True
    setattr(cls, name, wrapper)
    return True


def instrument_providers() -> None:
    """Wrap the provider SDKs so every call records its own outcome. Idempotent;
    call once at startup. A failure here is never fatal — losing the health
    signal must not take the app down with it."""
    global _instrumented
    if _instrumented:
        return
    _instrumented = True
    try:
        from anthropic.resources.messages import AsyncMessages
        if _wrap_method(AsyncMessages, "create", "anthropic"):
            print("✓ ai_health: Anthropic calls instrumented")
    except Exception as e:
        print(f"⚠ ai_health: could not instrument Anthropic ({type(e).__name__}: {e})")
