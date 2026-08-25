"""
Per-phone rate limiting for the WhatsApp webhook.

In-memory, per-process — fine for a single Render instance (this project's
current deployment). It does NOT share state across multiple instances/dynos
and resets on restart; if the service is ever scaled horizontally, move this
to Redis. Limits are intentionally generous so no real learner is ever
throttled by normal use (tapping through a quiz, multi-message assignment
answers, etc.) — this exists purely to bound a flooding script or abuser.
"""
import time
from collections import defaultdict, deque

WINDOW_SECONDS = 60
WINDOW_MAX = 20     # generous: real taps/messages rarely exceed this in a minute
DAY_MAX = 500       # generous daily cap per phone
NOTICE_COOLDOWN = 300   # only send the "slow down" notice at most once per 5 min

# Escalating lockout: tripping the per-minute limit blocks the phone entirely for
# a growing period, so flooding has teeth — an abuser can't just resume at 20/min.
# Consecutive offenses step up; good behaviour for OFFENSE_DECAY forgives them.
COOLDOWN_STEPS = [600, 1800, 3600]   # 10 min → 30 min → 60 min (then stays at 60)
OFFENSE_DECAY = 21600                # forget prior offenses after 6h without one

_hits: dict[str, deque] = defaultdict(deque)
_last_notice: dict[str, float] = {}
_cooldown_until: dict[str, float] = {}
_offense_count: dict[str, int] = {}
_last_offense: dict[str, float] = {}


def check_rate_limit(phone: str, now: float | None = None) -> str | None:
    """Record this inbound message. Returns None if allowed, else a reason string
    ('cooldown' | 'day' | 'window') — the caller should skip all processing."""
    now = now if now is not None else time.time()

    # In an active lockout → drop without even recording (so it doesn't count).
    if now < _cooldown_until.get(phone, 0):
        return "cooldown"

    dq = _hits[phone]
    dq.append(now)
    while dq and now - dq[0] > 86400:
        dq.popleft()
    if not dq:
        _hits.pop(phone, None)
        return None
    day_count = len(dq)
    window_count = sum(1 for t in dq if now - t <= WINDOW_SECONDS)
    if day_count > DAY_MAX:
        return "day"
    if window_count > WINDOW_MAX:
        # Tripped the burst limit → start (or escalate) a lockout.
        if now - _last_offense.get(phone, 0) > OFFENSE_DECAY:
            _offense_count[phone] = 0   # forgiven — behaved for a while
        n = _offense_count.get(phone, 0)
        _cooldown_until[phone] = now + COOLDOWN_STEPS[min(n, len(COOLDOWN_STEPS) - 1)]
        _offense_count[phone] = n + 1
        _last_offense[phone] = now
        return "window"
    return None


def should_notify(phone: str, now: float | None = None) -> bool:
    """At most one 'you're going too fast' notice per cooldown window, so a
    flood doesn't turn into an equally spammy reply flood back at them."""
    now = now if now is not None else time.time()
    last = _last_notice.get(phone, 0)
    if now - last >= NOTICE_COOLDOWN:
        _last_notice[phone] = now
        return True
    return False
