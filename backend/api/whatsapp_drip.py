"""
Daily WhatsApp drip engine.

Runs once a day (APScheduler in main.py, or a Render Cron Job hitting
GET /whatsapp/run-drip). For each learner it looks at where they are in the
flow and how long they've been idle, and sends ONE appropriate nudge —
deduped so the same nudge never repeats and at most one nudge lands per ~day.

Outside WhatsApp's 24-hour window a nudge legally needs a pre-approved Meta
template. Until those are approved, set whatsapp_templates_enabled=False and the
engine sends free-form text (delivers only to learners still inside the 24h
window — enough to test end-to-end). Flip the flag on once templates are live.
"""
import random
from datetime import datetime, timedelta

from sqlalchemy import select

from db.database import async_session_factory
from db.models import WhatsAppSession
from core.config import settings

# ── Which nudge for which stage, and how many HOURS idle before it fires ─────
# Checked top-to-bottom; first match wins.
#
# Thresholds are in HOURS and kept well under 24 on purpose: a free-form (non-
# template) WhatsApp message only delivers inside the 24-hour window since the
# learner's last message. Firing at a few hours idle means the nudge lands while
# that window is still open, so free-text nudges actually reach people. (Anyone
# already past 24h idle is skipped in free-text mode — see run_drip — because
# only an approved template can reach them.)
WINDOW_HOURS = 24.0

# Pacing (all inside the free 24h window):
#   MIN_GAP_HOURS   — minimum time between ANY two nudges → caps volume (~3/day).
#   REPEAT_GAP_HOURS— a SAME nudge waits this long before repeating (once/day).
#   MAX_PER_KEY     — a given nudge fires at most this many times, ever.
MIN_GAP_HOURS = 6
REPEAT_GAP_HOURS = 20
MAX_PER_KEY = 2

# Stages that mean "reached WhatsApp but hasn't finished signup". These get the
# day-based pre-sale MARKETING sequence below (media uploaded in the admin portal),
# NOT the generic hourly nudges.
SIGNUP_STAGES = {"new", "welcome", "ask_name", "ask_profile", "ask_goal"}

# The pre-sale marketing drip: (idle-DAYS threshold, nudge key). One touch each,
# fired once, in order. Each sends the admin-uploaded photo/video for that
# (day, language) if present — otherwise falls back to the finish_signup text.
SIGNUP_TIERS = [
    (1, "signup_d1"),
    (2, "signup_d2"),
    (3, "signup_d3"),
    (7, "signup_d7"),
]

NUDGE_RULES = [
    ("start_lesson",      {"onboarded"},                                             2),
    ("resume_lesson",     {"lesson"},                                                3),
    ("finish_quiz",       {"quiz", "quiz_failed"},                                   3),
    ("submit_assignment", {"assignment"},                                            3),
    ("keep_learning",     {"done"},                                                  6),
]

# Meta template name per nudge (create + get these approved in WhatsApp Manager)
NUDGE_TEMPLATE = {
    "finish_signup": "cosmoplex_finish_signup",
    "start_lesson": "cosmoplex_start_lesson",
    "resume_lesson": "cosmoplex_resume_lesson",
    "finish_quiz": "cosmoplex_finish_quiz",
    "submit_assignment": "cosmoplex_submit_assignment",
    "keep_learning": "cosmoplex_keep_learning",
}

# Media-header templates for the pre-sales signup drip (photo/video attached as the
# template header). These must be created + approved in WhatsApp Manager, per
# language, with a text body containing {{1}} = the learner's name. Once approved,
# set WHATSAPP_TEMPLATES_ENABLED=true and the day-1/2/3/7 media goes out even
# outside the 24h window.
PRESALE_IMAGE_TEMPLATE = "cosmoplex_presale_image"
PRESALE_VIDEO_TEMPLATE = "cosmoplex_presale_video"

# Free-form fallback text (used while templates aren't approved), per language.
NUDGE_TEXT = {
    "finish_signup": {
        "en": "{name}, you left us on 'seen' 👀 your AI glow-up is one reply away — and the first lesson's on us 🎓 slide back in?",
        "hi": "{name}, आपने हमें 'seen' पर छोड़ दिया 👀 आपका AI glow-up बस एक reply दूर है — और पहला पाठ बिल्कुल free 🎓 वापस आओ ना?",
        "mr": "{name}, तुम्ही आम्हाला 'seen' वर सोडलंत 👀 तुमचा AI glow-up फक्त एक reply दूर आहे — आणि पहिला धडा अगदी free 🎓 परत या ना?",
        "te": "{name}, మమ్మల్ని 'seen'లో వదిలేశారు 👀 మీ AI glow-up కేవలం ఒక్క reply దూరం — పైగా మొదటి పాఠం పూర్తిగా free 🎓 తిరిగి రండి?",
        "ta": "{name}, எங்களை 'seen'-ல விட்டுட்டீங்க 👀 உங்க AI glow-up ஒரே ஒரு reply தூரம்தான் — முதல் பாடம் முழுசா free 🎓 திரும்பி வாங்களேன்?",
        "kn": "{name}, ನಮ್ಮನ್ನ 'seen' ನಲ್ಲಿ ಬಿಟ್ಟುಬಿಟ್ರಿ 👀 ನಿಮ್ಮ AI glow-up ಒಂದೇ reply ದೂರ — ಮೊದಲ ಪಾಠ ಸಂಪೂರ್ಣ free 🎓 ವಾಪಸ್ ಬನ್ನಿ?",
    },
    "start_lesson": {
        "en": "{name}, your first lesson is just sitting here waiting 🎬 2 mins and you'll have 10 AI words to casually drop in any conversation 💬 shall we?",
        "hi": "{name}, आपका पहला पाठ यहीं बैठा इंतज़ार कर रहा है 🎬 2 मिनट में 10 AI शब्द जो किसी भी बातचीत में casually डाल सको 💬 चलें?",
        "mr": "{name}, तुमचा पहिला धडा इथेच वाट बघत बसलाय 🎬 2 मिनिटांत 10 AI शब्द जे कोणत्याही गप्पांमध्ये सहज टाकता येतील 💬 सुरू करूया?",
        "te": "{name}, మీ మొదటి పాఠం ఇక్కడే వేచి ఉంది 🎬 2 నిమిషాల్లో ఏ సంభాషణలోనైనా casualగా చెప్పగలిగే 10 AI పదాలు 💬 మొదలుపెడదామా?",
        "ta": "{name}, உங்க முதல் பாடம் இங்கயே காத்திருக்கு 🎬 2 நிமிஷத்துல எந்த பேச்சிலயும் casual-ஆ சொல்ற 10 AI வார்த்தைகள் 💬 ஆரம்பிக்கலாமா?",
        "kn": "{name}, ನಿಮ್ಮ ಮೊದಲ ಪಾಠ ಇಲ್ಲೇ ಕಾಯ್ತಾ ಇದೆ 🎬 2 ನಿಮಿಷದಲ್ಲಿ ಯಾವ ಮಾತುಕತೆಯಲ್ಲೂ casual ಆಗಿ ಹೇಳಬಹುದಾದ 10 AI ಪದಗಳು 💬 ಶುರುಮಾಡೋಣ್ವಾ?",
    },
    "resume_lesson": {
        "en": "{name}, you paused mid-lesson like it's a web-series cliffhanger 😅 the quiz is right there — finish the last few mins? 💪",
        "hi": "{name}, आपने पाठ बीच में ही pause कर दिया जैसे web-series का cliffhanger 😅 quiz बस सामने है — आख़िरी कुछ मिनट पूरे कर लो? 💪",
        "mr": "{name}, तुम्ही धडा मधेच pause केलात जसं web-series चा cliffhanger 😅 quiz अगदी समोर आहे — शेवटची काही मिनिटं पूर्ण करूया? 💪",
        "te": "{name}, పాఠాన్ని మధ్యలో pause చేశారు web-series cliffhanger లా 😅 quiz ఇదిగో ఎదురుగా ఉంది — చివరి కొన్ని నిమిషాలు పూర్తి చేద్దామా? 💪",
        "ta": "{name}, பாடத்த பாதியில pause பண்ணீட்டீங்க web-series cliffhanger மாதிரி 😅 quiz இதோ முன்னாடி — கடைசி சில நிமிஷம் முடிச்சிடலாமா? 💪",
        "kn": "{name}, ಪಾಠವನ್ನ ಮಧ್ಯದಲ್ಲೇ pause ಮಾಡಿದ್ರಿ web-series cliffhanger ತರ 😅 quiz ಇಲ್ಲೇ ಮುಂದೆ ಇದೆ — ಕೊನೆ ಕೆಲ ನಿಮಿಷ ಮುಗಿಸೋಣ್ವಾ? 💪",
    },
    "finish_quiz": {
        "en": "{name}, one quiz stands between you and 'certified smart' 🧠 come back and bully it a little ✅",
        "hi": "{name}, बस एक quiz और आप बन जाओगे 'certified smart' 🧠 वापस आकर उसे थोड़ा हरा दो ✅",
        "mr": "{name}, फक्त एक quiz आणि तुम्ही व्हाल 'certified smart' 🧠 परत येऊन त्याला थोडं हरवा ✅",
        "te": "{name}, ఒక్క quiz దాటితే మీరు 'certified smart' 🧠 తిరిగి వచ్చి దాన్ని కొంచెం ఓడించండి ✅",
        "ta": "{name}, ஒரே ஒரு quiz தாண்டினா நீங்க 'certified smart' 🧠 திரும்பி வந்து அத கொஞ்சம் ஜெயிச்சிடுங்க ✅",
        "kn": "{name}, ಒಂದೇ quiz ದಾಟಿದ್ರೆ ನೀವು 'certified smart' 🧠 ವಾಪಸ್ ಬಂದು ಅದನ್ನ ಸ್ವಲ್ಪ ಸೋಲಿಸಿ ✅",
    },
    "submit_assignment": {
        "en": "{name}, your assignment is sitting there tapping its foot ✍️ type your answer, I'll grade it, we end on a high 🎯",
        "hi": "{name}, आपका assignment वहीं बैठा आपका इंतज़ार कर रहा है ✍️ अपना जवाब type करो, मैं grade कर दूँगा, ज़बरदस्त ending करते हैं 🎯",
        "mr": "{name}, तुमचं assignment तिथेच तुमची वाट बघत बसलंय ✍️ उत्तर type करा, मी तपासतो, दणक्यात शेवट करूया 🎯",
        "te": "{name}, మీ assignment అక్కడే మీ కోసం ఎదురుచూస్తోంది ✍️ మీ సమాధానం type చేయండి, నేను grade చేస్తా, అదిరిపోయేలా ముగిద్దాం 🎯",
        "ta": "{name}, உங்க assignment அங்கயே உங்களுக்காக காத்திருக்கு ✍️ பதில type பண்ணுங்க, நான் grade பண்றேன், அசத்தலா முடிப்போம் 🎯",
        "kn": "{name}, ನಿಮ್ಮ assignment ಅಲ್ಲೇ ನಿಮಗಾಗಿ ಕಾಯ್ತಿದೆ ✍️ ನಿಮ್ಮ ಉತ್ತರ type ಮಾಡಿ, ನಾನು grade ಮಾಡ್ತೀನಿ, ಜೋರಾಗಿ ಮುಗಿಸೋಣ 🎯",
    },
    "keep_learning": {
        "en": "{name}, you finished Lesson 1 like a pro 😎 more coming soon — got AI questions? my DMs are always open 🌟",
        "hi": "{name}, पाठ 1 को चुटकी में निपटा दिया 😎 और पाठ आ रहे हैं — AI का कोई सवाल हो तो DM खुला है 🌟",
        "mr": "{name}, धडा 1 चुटकीसरशी संपवला 😎 अजून धडे येतायत — AI बद्दल काही प्रश्न? DM नेहमी खुला आहे 🌟",
        "te": "{name}, పాఠం 1ని చిటికెలో ముగించారు 😎 ఇంకా పాఠాలు వస్తున్నాయి — AI గురించి ఏ doubt అయినా? నా DM ఎప్పుడూ open 🌟",
        "ta": "{name}, பாடம் 1-ஐ நொடியில முடிச்சிட்டீங்க 😎 இன்னும் பாடங்க வருது — AI பத்தி ஏதாவது doubt? என் DM எப்பவும் open 🌟",
        "kn": "{name}, ಪಾಠ 1 ನ್ನ ಚಿಟಿಕೆಯಲ್ಲಿ ಮುಗಿಸಿದ್ರಿ 😎 ಇನ್ನೂ ಪಾಠಗಳು ಬರ್ತಿವೆ — AI ಬಗ್ಗೆ ಯಾವ doubt ಇದ್ರೂ? ನನ್ DM ಯಾವಾಗ್ಲೂ open 🌟",
    },
}


def _idle_hours(s: WhatsAppSession, now: datetime) -> float:
    last = s.last_active_at or s.updated_at or s.created_at or now
    return (now - last).total_seconds() / 3600


def _parse_iso(v: str | None) -> datetime | None:
    try:
        return datetime.fromisoformat(v) if v else None
    except (ValueError, TypeError):
        return None


def _pick_nudge(s: WhatsAppSession, now: datetime):
    """Return (nudge_key, idle_hours, day) for this learner, or None.
    `day` is the marketing-tier day for signup nudges, else None."""
    idle_hours = _idle_hours(s, now)
    # Signup-incomplete → the day-based pre-sale marketing sequence. Send the tier
    # for the CURRENT idle window (highest threshold reached), once. We deliberately
    # don't backfill lower tiers if an earlier window was missed — just send the
    # one that fits where they are now.
    if s.stage in SIGNUP_STAGES:
        idle_days = idle_hours / 24.0
        tier = None
        for day, key in SIGNUP_TIERS:   # ascending → ends on highest reached
            if idle_days >= day:
                tier = (day, key)
        if tier:
            day, key = tier
            already = (s.nudge_log or {}).get(key, {}).get("n", 0)
            if not already:
                return key, idle_hours, day
        return None
    for key, stages, threshold_hours in NUDGE_RULES:
        if s.stage in stages and idle_hours >= threshold_hours:
            return key, idle_hours, None
    return None


def _text_key(key: str) -> str:
    """Signup marketing tiers all share the finish_signup copy (used as the media
    caption, or the message when no media is uploaded for that day/language)."""
    return "finish_signup" if key.startswith("signup_") else key


def _tier_day(key: str) -> int | None:
    """'signup_d3' → 3; anything else → None."""
    if key.startswith("signup_d"):
        try:
            return int(key[len("signup_d"):])
        except ValueError:
            return None
    return None


async def run_drip(force_to: str | None = None, force_key: str | None = None) -> dict:
    """Send due nudges. `force_to`/`force_key` bypass idle+dedupe for testing."""
    # Lazy import to avoid a circular import with whatsapp_routes.
    from api.whatsapp_routes import (send_text, send_template, send_image, send_video,
                                     _image_url, _video_url)
    from db.models import MarketingAsset

    now = datetime.utcnow()
    report = {"checked": 0, "sent": [], "skipped": 0, "errors": []}

    async with async_session_factory() as db:
        res = await db.execute(select(WhatsAppSession))
        sessions = list(res.scalars().all())
        report["checked"] = len(sessions)

        for s in sessions:
            if force_to and s.phone != force_to:
                continue

            if force_key:
                key = force_key
                day = _tier_day(key)
            else:
                pick = _pick_nudge(s, now)
                if not pick:
                    report["skipped"] += 1
                    continue
                key = pick[0]
                day = pick[2]
                rec = (s.nudge_log or {}).get(key) or {}
                sent_count = rec.get("n", 0)
                # This nudge has already been shown the max number of times.
                if sent_count >= MAX_PER_KEY:
                    report["skipped"] += 1
                    continue
                # Space out ALL nudges so a learner gets at most ~3/day.
                if s.last_nudge_at and (now - s.last_nudge_at) < timedelta(hours=MIN_GAP_HOURS):
                    report["skipped"] += 1
                    continue
                # A repeat of the SAME nudge waits longer (at most once/day).
                if sent_count >= 1:
                    last_same = _parse_iso(rec.get("at"))
                    if last_same and (now - last_same) < timedelta(hours=REPEAT_GAP_HOURS):
                        report["skipped"] += 1
                        continue
                # Free-text can't reach a closed 24h window — skip rather than fire
                # a send Meta will reject. (Templates can, so only gate when off.)
                if not settings.whatsapp_templates_enabled and _idle_hours(s, now) >= WINDOW_HOURS:
                    report["skipped"] += 1
                    continue

            text_key = _text_key(key)   # signup tiers reuse the finish_signup copy
            if text_key not in NUDGE_TEXT:
                report["errors"].append(f"unknown nudge key {key}")
                continue

            lang = s.language or "en"
            name = (s.name or "").strip() or "there"
            text = NUDGE_TEXT[text_key].get(lang, NUDGE_TEXT[text_key]["en"]).format(name=name)
            try:
                # Pre-sales tiers carry admin-uploaded photo/video/text for (day, lang).
                asset = await db.get(MarketingAsset, f"{day}_{lang}") if day is not None else None
                custom_text = asset.text.strip() if (asset and asset.text and asset.text.strip()) else None
                in_window = _idle_hours(s, now) < WINDOW_HOURS

                # Randomly pick ONE content kind from whatever the admin actually
                # uploaded for this (day, language) — never combine them. Falls back
                # to the default nudge copy when nothing is uploaded.
                opts = []
                if custom_text:
                    opts.append("text")
                if asset and asset.image_public_id:
                    opts.append("image")
                if asset and asset.video_public_id:
                    opts.append("video")
                pick = random.choice(opts) if opts else "default"

                async def _send_freeform() -> str:
                    # In-window free-form: send just the one picked item (no combining).
                    if pick == "video":
                        await send_video(s.phone, asset.video_public_id, ""); return "media:video"
                    if pick == "image":
                        await send_image(s.phone, asset.image_public_id, ""); return "media:image"
                    if pick == "text":
                        await send_text(s.phone, custom_text); return "text:custom"
                    await send_text(s.phone, text); return "text:default"

                if settings.whatsapp_templates_enabled:
                    # Templates are the ONLY thing that delivers outside the 24h window.
                    try:
                        if pick == "video":
                            resp = await send_template(s.phone, PRESALE_VIDEO_TEMPLATE, lang, [name],
                                                       header_media={"type": "video", "link": _video_url(asset.video_public_id)})
                            sent_as = "template:video"
                        elif pick == "image":
                            resp = await send_template(s.phone, PRESALE_IMAGE_TEMPLATE, lang, [name],
                                                       header_media={"type": "image", "link": _image_url(asset.image_public_id)})
                            sent_as = "template:image"
                        else:  # text / default → the approved text template ({{1}} = name)
                            resp = await send_template(s.phone, NUDGE_TEMPLATE.get(text_key, NUDGE_TEMPLATE["finish_signup"]), lang, [name])
                            sent_as = "template:text"
                        if resp is None or getattr(resp, "status_code", 500) >= 400:
                            raise RuntimeError(f"template rejected (HTTP {getattr(resp, 'status_code', '?')})")
                    except Exception as te:
                        # Template failed (often: not yet approved). Inside the window we
                        # can still free-form; outside, nothing else can reach them.
                        if not in_window:
                            raise
                        report["errors"].append(f"template fallback {s.phone[-4:]}: {te}")
                        sent_as = (await _send_freeform()) + "(fb)"
                else:
                    # Free-form (in-window only; the >=24h skip above already gated this).
                    sent_as = await _send_freeform()
                s.last_nudge_at = now
                s.last_nudge_key = key
                # Bump the per-nudge count (build a NEW dict so SQLAlchemy sees the change).
                log = dict(s.nudge_log or {})
                prev = log.get(key) or {}
                log[key] = {"n": prev.get("n", 0) + 1, "at": now.isoformat()}
                s.nudge_log = log
                report["sent"].append({"phone": "…" + s.phone[-4:], "key": key, "lang": lang, "as": sent_as})
            except Exception as e:  # never let one bad send kill the run
                report["errors"].append(f"{s.phone[-4:]}: {e}")

        await db.commit()
    print(f"✓ Drip run: checked {report['checked']}, sent {len(report['sent'])}, "
          f"skipped {report['skipped']}, errors {len(report['errors'])}")
    return report
