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
from datetime import datetime, timedelta

from sqlalchemy import select

from db.database import async_session_factory
from db.models import WhatsAppSession
from core.config import settings

# ── Which nudge for which stage, and how long idle before it fires ───────────
# Checked top-to-bottom; first match wins.
NUDGE_RULES = [
    ("finish_signup",     {"new", "welcome", "ask_name", "ask_profile", "ask_goal"}, 1),
    ("start_lesson",      {"onboarded"},                                             1),
    ("resume_lesson",     {"lesson"},                                                2),
    ("finish_quiz",       {"quiz", "quiz_failed"},                                   2),
    ("submit_assignment", {"assignment"},                                            2),
    ("keep_learning",     {"done"},                                                  3),
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

# Free-form fallback text (used while templates aren't approved), per language.
NUDGE_TEXT = {
    "finish_signup": {
        "en": "👋 Hi {name}! You started with Cosmoplex AI School but didn't finish signing up. Reply here to pick up where you left off — your first lesson is free. 🎓",
        "hi": "👋 नमस्ते {name}! आपने Cosmoplex AI School शुरू किया था पर साइन-अप पूरा नहीं किया। जहाँ छोड़ा था वहीं से जारी रखने के लिए यहाँ जवाब दें — पहला पाठ मुफ़्त है। 🎓",
        "mr": "👋 नमस्कार {name}! तुम्ही Cosmoplex AI School सुरू केलं पण साइन-अप पूर्ण केलं नाही. जिथे थांबलात तिथून सुरू ठेवायला इथे उत्तर द्या — पहिला धडा मोफत आहे. 🎓",
        "te": "👋 హాయ్ {name}! మీరు Cosmoplex AI School మొదలుపెట్టారు కానీ సైన్-అప్ పూర్తి చేయలేదు. ఆగిన చోటు నుంచి కొనసాగించడానికి ఇక్కడ రిప్లై చేయండి — మొదటి పాఠం ఉచితం. 🎓",
        "ta": "👋 வணக்கம் {name}! நீங்கள் Cosmoplex AI School-ஐ தொடங்கினீர்கள் ஆனால் பதிவை முடிக்கவில்லை. நிறுத்திய இடத்திலிருந்து தொடர இங்கே பதிலளியுங்கள் — முதல் பாடம் இலவசம். 🎓",
        "kn": "👋 ನಮಸ್ಕಾರ {name}! ನೀವು Cosmoplex AI School ಆರಂಭಿಸಿದಿರಿ ಆದರೆ ಸೈನ್-ಅಪ್ ಪೂರ್ಣಗೊಳಿಸಲಿಲ್ಲ. ನಿಲ್ಲಿಸಿದಲ್ಲಿಂದ ಮುಂದುವರಿಸಲು ಇಲ್ಲಿ ಉತ್ತರಿಸಿ — ಮೊದಲ ಪಾಠ ಉಚಿತ. 🎓",
    },
    "start_lesson": {
        "en": "🎬 {name}, your first lesson is ready! Learn the 10 AI words every fresher must know — just a few minutes. Tap in whenever you're ready. 🚀",
        "hi": "🎬 {name}, आपका पहला पाठ तैयार है! हर फ्रेशर को पता होने चाहिए ये 10 AI शब्द सीखें — बस कुछ मिनट। जब तैयार हों, शुरू करें। 🚀",
        "mr": "🎬 {name}, तुमचा पहिला धडा तयार आहे! प्रत्येक फ्रेशरला माहिती हवे असे 10 AI शब्द शिका — फक्त काही मिनिटं. तयार असाल तेव्हा सुरू करा. 🚀",
        "te": "🎬 {name}, మీ మొదటి పాఠం సిద్ధం! ప్రతి ఫ్రెషర్ తెలుసుకోవలసిన 10 AI పదాలు నేర్చుకోండి — కొన్ని నిమిషాలే. సిద్ధమైనప్పుడు మొదలుపెట్టండి. 🚀",
        "ta": "🎬 {name}, உங்கள் முதல் பாடம் தயார்! ஒவ்வொரு ஃப்ரெஷரும் தெரிந்திருக்க வேண்டிய 10 AI சொற்களைக் கற்றுக்கொள்ளுங்கள் — சில நிமிடங்களே. 🚀",
        "kn": "🎬 {name}, ನಿಮ್ಮ ಮೊದಲ ಪಾಠ ಸಿದ್ಧ! ಪ್ರತಿ ಫ್ರೆಶರ್ ತಿಳಿದಿರಬೇಕಾದ 10 AI ಪದಗಳನ್ನು ಕಲಿಯಿರಿ — ಕೆಲವೇ ನಿಮಿಷಗಳು. 🚀",
    },
    "resume_lesson": {
        "en": "📚 {name}, you're partway through Lesson 1 — want to finish it? Only a few minutes to go, then the quiz. 💪",
        "hi": "📚 {name}, आप पाठ 1 के बीच में हैं — इसे पूरा करना चाहेंगे? बस कुछ मिनट बाकी हैं, फिर क्विज़। 💪",
        "mr": "📚 {name}, तुम्ही धडा 1 च्या मध्यावर आहात — पूर्ण करायचा आहे का? फक्त काही मिनिटं बाकी, मग क्विझ. 💪",
        "te": "📚 {name}, మీరు పాఠం 1 మధ్యలో ఉన్నారు — పూర్తి చేద్దామా? కొన్ని నిమిషాలే మిగిలాయి, తర్వాత క్విజ్. 💪",
        "ta": "📚 {name}, நீங்கள் பாடம் 1-இன் நடுவில் இருக்கிறீர்கள் — முடிக்கலாமா? சில நிமிடங்களே, பிறகு வினாடி வினா. 💪",
        "kn": "📚 {name}, ನೀವು ಪಾಠ 1 ರ ಮಧ್ಯದಲ್ಲಿದ್ದೀರಿ — ಪೂರ್ಣಗೊಳಿಸೋಣವೇ? ಕೆಲವೇ ನಿಮಿಷಗಳು, ನಂತರ ಕ್ವಿಜ್. 💪",
    },
    "finish_quiz": {
        "en": "📝 {name}, you're one quiz away from the assignment! Come back and give it a try — you've got this. ✅",
        "hi": "📝 {name}, असाइनमेंट से बस एक क्विज़ दूर हैं! वापस आकर कोशिश करें — आप कर सकते हैं। ✅",
        "mr": "📝 {name}, असाइनमेंटपासून फक्त एक क्विझ दूर आहात! परत येऊन प्रयत्न करा — तुम्ही करू शकता. ✅",
        "te": "📝 {name}, అసైన్‌మెంట్‌కి ఒక్క క్విజ్ దూరంలో ఉన్నారు! తిరిగి వచ్చి ప్రయత్నించండి — మీరు చేయగలరు. ✅",
        "ta": "📝 {name}, பணிக்கு ஒரே ஒரு வினாடி வினா தூரம்தான்! திரும்பி வந்து முயற்சியுங்கள் — உங்களால் முடியும். ✅",
        "kn": "📝 {name}, ನಿಯೋಜನೆಗೆ ಒಂದೇ ಕ್ವಿಜ್ ದೂರದಲ್ಲಿದ್ದೀರಿ! ಮತ್ತೆ ಬಂದು ಪ್ರಯತ್ನಿಸಿ — ನಿಮ್ಮಿಂದ ಸಾಧ್ಯ. ✅",
    },
    "submit_assignment": {
        "en": "✍️ {name}, your assignment is waiting — just type your answer here and I'll grade it. Finish strong! 🎯",
        "hi": "✍️ {name}, आपका असाइनमेंट इंतज़ार कर रहा है — बस अपना जवाब यहाँ लिखें, मैं जाँच लूँगा। ज़ोरदार अंत करें! 🎯",
        "mr": "✍️ {name}, तुमचं असाइनमेंट वाट पाहतंय — फक्त तुमचं उत्तर इथे लिहा, मी तपासतो. जोरदार शेवट करा! 🎯",
        "te": "✍️ {name}, మీ అసైన్‌మెంట్ ఎదురుచూస్తోంది — మీ సమాధానం ఇక్కడ టైప్ చేయండి, నేను గ్రేడ్ చేస్తా. బలంగా ముగించండి! 🎯",
        "ta": "✍️ {name}, உங்கள் பணி காத்திருக்கிறது — உங்கள் பதிலை இங்கே எழுதுங்கள், நான் மதிப்பிடுகிறேன். வலுவாக முடியுங்கள்! 🎯",
        "kn": "✍️ {name}, ನಿಮ್ಮ ನಿಯೋಜನೆ ಕಾಯುತ್ತಿದೆ — ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ, ನಾನು ಗ್ರೇಡ್ ಮಾಡುತ್ತೇನೆ. ಬಲವಾಗಿ ಮುಗಿಸಿ! 🎯",
    },
    "keep_learning": {
        "en": "🎉 {name}, great job finishing Lesson 1! More lessons are on the way — reply anytime to ask me anything about AI. 🌟",
        "hi": "🎉 {name}, पाठ 1 पूरा करने के लिए शाबाश! और पाठ जल्द आ रहे हैं — AI के बारे में कुछ भी पूछने के लिए कभी भी जवाब दें। 🌟",
        "mr": "🎉 {name}, धडा 1 पूर्ण केल्याबद्दल छान! आणखी धडे लवकरच — AI बद्दल काहीही विचारायला केव्हाही उत्तर द्या. 🌟",
        "te": "🎉 {name}, పాఠం 1 పూర్తి చేసినందుకు అభినందనలు! మరిన్ని పాఠాలు వస్తున్నాయి — AI గురించి ఏదైనా అడగడానికి ఎప్పుడైనా రిప్లై చేయండి. 🌟",
        "ta": "🎉 {name}, பாடம் 1-ஐ முடித்ததற்கு வாழ்த்துகள்! மேலும் பாடங்கள் வரும் — AI பற்றி எதையும் கேட்க எப்போது வேண்டுமானாலும் பதிலளியுங்கள். 🌟",
        "kn": "🎉 {name}, ಪಾಠ 1 ಪೂರ್ಣಗೊಳಿಸಿದ್ದಕ್ಕೆ ಅಭಿನಂದನೆಗಳು! ಇನ್ನಷ್ಟು ಪಾಠಗಳು ಬರಲಿವೆ — AI ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಲು ಯಾವಾಗ ಬೇಕಾದರೂ ಉತ್ತರಿಸಿ. 🌟",
    },
}


def _pick_nudge(s: WhatsAppSession, now: datetime):
    """Return (nudge_key, idle_days) for this learner, or None."""
    last = s.last_active_at or s.updated_at or s.created_at or now
    idle_days = (now - last).total_seconds() / 86400
    for key, stages, threshold in NUDGE_RULES:
        if s.stage in stages and idle_days >= threshold:
            return key, idle_days
    return None


async def run_drip(force_to: str | None = None, force_key: str | None = None) -> dict:
    """Send due nudges. `force_to`/`force_key` bypass idle+dedupe for testing."""
    # Lazy import to avoid a circular import with whatsapp_routes.
    from api.whatsapp_routes import send_text, send_template

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
            else:
                pick = _pick_nudge(s, now)
                if not pick:
                    report["skipped"] += 1
                    continue
                key = pick[0]
                # Never send the same nudge twice; at most one nudge per ~20h.
                if s.last_nudge_key == key:
                    report["skipped"] += 1
                    continue
                if s.last_nudge_at and (now - s.last_nudge_at) < timedelta(hours=20):
                    report["skipped"] += 1
                    continue

            if key not in NUDGE_TEXT:
                report["errors"].append(f"unknown nudge key {key}")
                continue

            lang = s.language or "en"
            name = (s.name or "").strip() or "there"
            text = NUDGE_TEXT[key].get(lang, NUDGE_TEXT[key]["en"]).format(name=name)
            try:
                if settings.whatsapp_templates_enabled:
                    await send_template(s.phone, NUDGE_TEMPLATE[key], lang, [name])
                else:
                    await send_text(s.phone, text)
                s.last_nudge_at = now
                s.last_nudge_key = key
                report["sent"].append({"phone": "…" + s.phone[-4:], "key": key, "lang": lang})
            except Exception as e:  # never let one bad send kill the run
                report["errors"].append(f"{s.phone[-4:]}: {e}")

        await db.commit()
    print(f"✓ Drip run: checked {report['checked']}, sent {len(report['sent'])}, "
          f"skipped {report['skipped']}, errors {len(report['errors'])}")
    return report
