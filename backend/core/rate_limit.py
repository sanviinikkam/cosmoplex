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
# Taps and typing are not the same act and should not share a budget. Tapping
# through a quiz is half a dozen buttons in under a minute and must never be
# throttled; typing six separate free-text messages in the same minute is either
# a script or another bot, and each one costs a router call and often a Teacher
# call on top. So the expensive stream gets the tight limit and the cheap one
# keeps the generous one.
TAP_WINDOW_MAX = 20
TEXT_WINDOW_MAX = 5
DAY_MAX = 500       # generous daily cap per phone, both kinds together
NOTICE_COOLDOWN = 300   # only send the "slow down" notice at most once per 5 min

# Escalating lockout: tripping the per-minute limit blocks the phone entirely for
# a growing period, so flooding has teeth — an abuser can't just resume at 20/min.
# Consecutive offenses step up; good behaviour for OFFENSE_DECAY forgives them.
COOLDOWN_STEPS = [600, 1800, 3600]   # 10 min → 30 min → 60 min (then stays at 60)
OFFENSE_DECAY = 21600                # forget prior offenses after 6h without one

# Tripping the TYPING limit does not lock the phone. At 5/min that limit is
# reachable by a real, impatient person — six short messages in under a minute is
# a normal human — and locking them out of the whole course, buttons included,
# for ten minutes is a worse outcome than the flood. So typing gets a short
# typing-only pause: lessons and quizzes keep working throughout. The full
# lockout is kept for the tap limit (20/min, which no human reaches) and for
# confirmed automation, where it costs nothing because bots do not tap.
TEXT_PAUSE = 300                     # 5 min of typing only

_hits: dict[str, deque] = defaultdict(deque)          # (timestamp, kind)
_last_notice: dict[str, float] = {}
_cooldown_until: dict[str, float] = {}
_text_pause_until: dict[str, float] = {}
_offense_count: dict[str, int] = {}
_last_offense: dict[str, float] = {}


def check_rate_limit(phone: str, kind: str = "text",
                     now: float | None = None) -> str | None:
    """Record this inbound message. Returns None if allowed, else a reason string
    ('cooldown' | 'day' | 'window') — the caller should skip all processing.

    `kind` is "tap" for a button or list reply and "text" for anything the
    learner typed or spoke. They are counted separately against different
    per-minute limits; the daily cap and the lockout are shared, because a
    lockout is about the phone, not about how it was flooding.
    """
    now = now if now is not None else time.time()

    # In an active lockout → drop without even recording (so it doesn't count).
    if now < _cooldown_until.get(phone, 0):
        return "cooldown"
    # Typing paused, but taps still welcome — they can carry on with the course.
    if kind == "text" and now < _text_pause_until.get(phone, 0):
        return "cooldown"

    dq = _hits[phone]
    dq.append((now, kind))
    while dq and now - dq[0][0] > 86400:
        dq.popleft()
    if not dq:
        _hits.pop(phone, None)
        return None
    day_count = len(dq)
    window_count = sum(1 for t, k in dq
                       if k == kind and now - t <= WINDOW_SECONDS)
    ceiling = TAP_WINDOW_MAX if kind == "tap" else TEXT_WINDOW_MAX
    if day_count > DAY_MAX:
        return "day"
    if window_count > ceiling:
        if kind == "text":
            # Typing only. They keep every button.
            _text_pause_until[phone] = now + TEXT_PAUSE
            return "text_window"
        _start_lockout(phone, now)
        return "window"
    return None


def _start_lockout(phone: str, now: float) -> None:
    """Block this phone entirely, for longer each time it happens."""
    if now - _last_offense.get(phone, 0) > OFFENSE_DECAY:
        _offense_count[phone] = 0       # forgiven — behaved for a while
    n = _offense_count.get(phone, 0)
    _cooldown_until[phone] = now + COOLDOWN_STEPS[min(n, len(COOLDOWN_STEPS) - 1)]
    _offense_count[phone] = n + 1
    _last_offense[phone] = now


def should_notify(phone: str, now: float | None = None) -> bool:
    """At most one 'you're going too fast' notice per cooldown window, so a
    flood doesn't turn into an equally spammy reply flood back at them."""
    now = now if now is not None else time.time()
    last = _last_notice.get(phone, 0)
    if now - last >= NOTICE_COOLDOWN:
        _last_notice[phone] = now
        return True
    return False


# ── Bot-to-bot loop breaker ───────────────────────────────────────────────────
# A learner on the other end of another company's WhatsApp bot sent us its
# auto-reply — "Apologies, your last message didn't come through clearly on my
# end" — 25 times in 90 seconds. Our reply triggered their auto-reply, which
# triggered ours. It cost 25 router calls, ~50 outbound messages, and filled the
# feedback table with 25 identical rows.
#
# The rate limiter is the wrong tool for this: it eventually trips, but only
# after dozens of exchanges, and it cannot tell a loop from an eager learner.
# Byte-identical text arriving three times in three minutes can: a person does
# not send the same sentence three times in a row, and a bot does nothing else.
#
# The response is SILENCE. Any reply — even "you seem to be repeating yourself"
# — is another message for the other bot to answer, which is the loop.
LOOP_WINDOW = 180
LOOP_REPEATS = 3        # the third identical message is where we stop replying
LOOP_MIN_LEN = 8        # "hi", "ok", "haan" repeated is a person, not a machine

_recent_texts: dict[str, deque] = defaultdict(deque)


def _normalise(text: str) -> str:
    return " ".join((text or "").lower().split())[:200]


def check_repeat_loop(phone: str, text: str | None,
                      now: float | None = None) -> bool:
    """True if this exact message has already arrived LOOP_REPEATS times inside
    LOOP_WINDOW — meaning stop replying to it, silently."""
    now = now if now is not None else time.time()
    norm = _normalise(text or "")
    if len(norm) < LOOP_MIN_LEN:
        return False

    dq = _recent_texts[phone]
    dq.append((norm, now))
    while dq and now - dq[0][1] > LOOP_WINDOW:
        dq.popleft()
    if not dq:
        _recent_texts.pop(phone, None)
        return False
    if len(_recent_texts) > 5000:        # never grows without bound
        _recent_texts.clear()
    return sum(1 for t, _ in dq if t == norm) >= LOOP_REPEATS


# ── Ping-pong detector: automation whose wording changes ─────────────────────
# The loop breaker above needs identical text. A bot that varies its auto-reply
# slips past it, and past the per-minute limit too if it paces itself — 5 typed
# messages a minute, forever, is 7200 router calls a day.
#
# What a varying bot cannot hide is WHEN it replies. Measured over 892 phones and
# ~2350 typed messages in this deployment:
#
#     real learners        median 30.7s after our message, only 3.7% under 4s
#     the bot that looped  median  1.5s,                     75.5% under 4s
#
# One fast reply proves nothing — humans do send them. A RUN of them does. With a
# 12-character floor (so four-letter gibberish typed fast by a bored human does
# not count) no real learner in the whole history has ever exceeded a run of 1,
# while the bot reached 9. Tripping at 3 leaves a threefold margin.
#
# A phone caught here gets a LONG typing pause, not a full lockout. The number
# that looped here belongs to a real, engaged learner — 20 lessons completed by
# tapping, quizzes passed 3/3 — whose phone also runs a business auto-responder.
# Locking the phone out would have taken the course away from the person to
# punish the software sharing their number. A text-only pause is also sufficient:
# the loop is fed entirely by our replies to text, so silencing text ends it,
# while their buttons keep working.
PING_PONG_GAP = 4.0      # seconds after our message
PING_PONG_RUN = 3        # consecutive fast substantial replies
PING_PONG_MIN_LEN = 12   # characters — below this it is a person being silly
PING_PONG_PAUSE = 1800   # 30 min of typing; taps unaffected

_last_outbound: dict[str, float] = {}
_fast_streak: dict[str, int] = {}


def note_outbound(phone: str, now: float | None = None) -> None:
    """Record that we just messaged this learner, so the next inbound can be
    timed against it."""
    if not phone:
        return
    if len(_last_outbound) > 5000:
        _last_outbound.clear()
        _fast_streak.clear()
    _last_outbound[phone] = now if now is not None else time.time()


def check_ping_pong(phone: str, text: str | None,
                    now: float | None = None) -> bool:
    """True once this phone has answered us instantly, at length, several times
    in a row — meaning stop replying and lock it out."""
    now = now if now is not None else time.time()
    body = (text or "").strip()
    if len(body) < PING_PONG_MIN_LEN:
        return False                    # too short to judge; leave the streak be

    last = _last_outbound.get(phone)
    if last is None or (now - last) >= PING_PONG_GAP:
        _fast_streak[phone] = 0         # they took time to read — human pace
        return False

    streak = _fast_streak.get(phone, 0) + 1
    _fast_streak[phone] = streak
    if streak >= PING_PONG_RUN:
        _fast_streak[phone] = 0
        _text_pause_until[phone] = now + PING_PONG_PAUSE
        return True
    return False
