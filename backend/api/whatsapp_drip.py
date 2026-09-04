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
#   MAX_PER_KEY     — a given nudge fires at most this many times PER LESSON
#                     (pre-sale tiers remain once each, ever).
MIN_GAP_HOURS = 6
# 14h, not 20h: nudge #2 fires REPEAT_GAP after #1, and #1 can already be ~1h
# late because the drip runs hourly on the hour. At 20h the second touch landed at
# 24h+ for four of the five nudges — outside the free window, where only a paid
# template can deliver. At 14h the worst case (keep_learning, 6h threshold) lands
# at ~21h, so BOTH touches stay free.
REPEAT_GAP_HOURS = 14
MAX_PER_KEY = 2

# A template Meta keeps rejecting (not approved for that language, bad params)
# used to be retried EVERY hour forever: the send failed, so the success state was
# never written, so the next run saw a fresh learner and tried again. One learner
# accumulated 147 such attempts. Give up on a key after this many failures.
MAX_FAILURES_PER_KEY = 3

# Removing the lifetime cap removes the only long-run bound on volume, so keep a
# generous backstop: across a 14-lesson course a normal learner sees a handful of
# nudges, and this only ever catches someone who stalls at nearly every step.
MAX_TOTAL_NUDGES = 40


def _log_key(key: str, session) -> str:
    """Storage key for nudge_log.

    Pre-sale tiers stay LIFETIME — one touch each, ever.

    Course nudges are scoped to the LESSON they refer to. 'resume_lesson' is not
    'resume lesson 3', it is the resume nudge for every lesson, so a lifetime cap
    of 2 meant a learner who stalled twice on lesson 1 was never re-engaged again
    for the remaining 13 lessons. Measured: 40 of 114 learners were already sitting
    in a stage whose nudge they had permanently exhausted.
    """
    if key.startswith("signup_") or key == "finish_signup":
        return key
    return f"{key}:{session.lesson_index or 0}"

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
    # A learner between lessons (or mid-doubt) has finished a lesson and is being
    # offered the next one. These two stages previously matched NO rule, so this
    # group — everyone who completes a lesson and pauses — was never re-engaged.
    ("next_lesson",       {"between_lessons", "clarify"},                            3),
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
# The pre-sales media templates carry the correct-language photo/video in the
# HEADER (passed at send time), so ONE approved template serves every language —
# always sent in this fixed language. The body carries {{1}} = the admin's
# per-language caption for that day (single line), plus fixed brand text so Meta
# approves it (a body that is ONLY a variable is rejected).
PRESALE_TEMPLATE_LANG = "en"

# Free-form fallback text (used while templates aren't approved), per language.
# key -> language -> either one string, or a LIST of variations.
#
# A repeat nudge that is word-for-word the first one reads as a bug, so every
# stage nudge has two, alternated by how many times that key has already fired
# for that learner. finish_signup stays a single string: the pre-sale drip
# already varies by tier and carries its own admin-uploaded creative.
NUDGE_TEXT = {
    "finish_signup": {
        "en": "{name}, you left us on 'seen' 👀 your AI glow-up is one reply away — and the first lesson's on us 🎓 slide back in?",
        "hi": "{name}, आपने हमें 'seen' पर छोड़ दिया 👀 आपका AI glow-up बस एक reply दूर है — और पहला पाठ बिल्कुल free 🎓 वापस आओ ना?",
        "mr": "{name}, तुम्ही आम्हाला 'seen' वर सोडलंत 👀 तुमचा AI glow-up फक्त एक reply दूर आहे — आणि पहिला धडा अगदी free 🎓 परत या ना?",
        "te": "{name}, మమ్మల్ని 'seen'లో వదిలేశారు 👀 మీ AI glow-up కేవలం ఒక్క reply దూరం — పైగా మొదటి పాఠం పూర్తిగా free 🎓 తిరిగి రండి?",
        "ta": "{name}, எங்களை 'seen'-ல விட்டுட்டீங்க 👀 உங்க AI glow-up ஒரே ஒரு reply தூரம்தான் — முதல் பாடம் முழுசா free 🎓 திரும்பி வாங்களேன்?",
        "kn": "{name}, ನಮ್ಮನ್ನ 'seen' ನಲ್ಲಿ ಬಿಟ್ಟುಬಿಟ್ರಿ 👀 ನಿಮ್ಮ AI glow-up ಒಂದೇ reply ದೂರ — ಮೊದಲ ಪಾಠ ಸಂಪೂರ್ಣ free 🎓 ವಾಪಸ್ ಬನ್ನಿ?",
    },
    "next_lesson": {
        "en": [
            "{name}, one lesson down 🎉 the next one's already queued up — 2 minutes and you're ahead of where you were yesterday. Carry on?",
            "{name}, your next lesson is still on read 👀 two minutes is all it takes — want to keep the streak alive? 🔥",
        ],
        "hi": [
            "{name}, एक पाठ पूरा 🎉 अगला पहले से तैयार है — 2 मिनट और आप कल से आगे निकल जाओगे। चलें आगे?",
            "{name}, अगला पाठ अब भी इंतज़ार में है 👀 सिर्फ़ दो मिनट लगेंगे — streak बचा लें? 🔥",
        ],
        "mr": [
            "{name}, एक धडा पूर्ण 🎉 पुढचा आधीच तयार आहे — 2 मिनिटं आणि तुम्ही कालपेक्षा पुढे. पुढे जाऊया?",
            "{name}, पुढचा धडा अजूनही वाट बघतोय 👀 फक्त दोन मिनिटं — streak वाचवूया? 🔥",
        ],
        "te": [
            "{name}, ఒక పాఠం పూర్తి 🎉 తర్వాతిది ఇప్పటికే సిద్ధం — 2 నిమిషాలు, నిన్నటి కంటే ముందుంటారు. కొనసాగిద్దామా?",
            "{name}, తర్వాతి పాఠం ఇంకా ఎదురుచూస్తోంది 👀 కేవలం రెండు నిమిషాలు — streak నిలబెడదామా? 🔥",
        ],
        "ta": [
            "{name}, ஒரு பாடம் முடிந்தது 🎉 அடுத்தது ஏற்கனவே தயார் — 2 நிமிடம், நேற்றை விட முன்னேறிடுவீங்க. தொடரலாமா?",
            "{name}, அடுத்த பாடம் இன்னும் காத்திருக்கு 👀 வெறும் இரண்டு நிமிடம் — streak-ஐ காப்பாத்தலாமா? 🔥",
        ],
        "kn": [
            "{name}, ಒಂದು ಪಾಠ ಮುಗಿತು 🎉 ಮುಂದಿನದು ಈಗಾಗಲೇ ಸಿದ್ಧ — 2 ನಿಮಿಷ, ನಿನ್ನೆಗಿಂತ ಮುಂದೆ ಇರುತ್ತೀರಿ. ಮುಂದುವರಿಸೋಣವೇ?",
            "{name}, ಮುಂದಿನ ಪಾಠ ಇನ್ನೂ ಕಾಯುತ್ತಿದೆ 👀 ಕೇವಲ ಎರಡು ನಿಮಿಷ — streak ಉಳಿಸೋಣವೇ? 🔥",
        ],
    },
    "start_lesson": {
        "en": [
            "{name}, your first lesson is just sitting here waiting 🎬 2 mins and you'll have 10 AI words to casually drop in any conversation 💬 shall we?",
            "{name}, lesson one is still unopened 🎬 everyone starts at zero — two minutes and you won't be there any more. Shall we? 🚀",
        ],
        "hi": [
            "{name}, आपका पहला पाठ यहीं बैठा इंतज़ार कर रहा है 🎬 2 मिनट में 10 AI शब्द जो किसी भी बातचीत में casually डाल सको 💬 चलें?",
            "{name}, पहला पाठ अब तक खुला ही नहीं 🎬 शुरुआत सब शून्य से करते हैं — दो मिनट और आप वहाँ नहीं रहोगे। शुरू करें? 🚀",
        ],
        "mr": [
            "{name}, तुमचा पहिला धडा इथेच वाट बघत बसलाय 🎬 2 मिनिटांत 10 AI शब्द जे कोणत्याही गप्पांमध्ये सहज टाकता येतील 💬 सुरू करूया?",
            "{name}, पहिला धडा अजून उघडलाच नाही 🎬 सुरुवात सगळेच शून्यापासून करतात — दोन मिनिटं आणि तुम्ही तिथे नसाल. सुरू करूया? 🚀",
        ],
        "te": [
            "{name}, మీ మొదటి పాఠం ఇక్కడే వేచి ఉంది 🎬 2 నిమిషాల్లో ఏ సంభాషణలోనైనా casualగా చెప్పగలిగే 10 AI పదాలు 💬 మొదలుపెడదామా?",
            "{name}, మొదటి పాఠం ఇంకా తెరవనే లేదు 🎬 అందరూ సున్నా నుంచే మొదలు — రెండు నిమిషాలు, మీరు అక్కడ ఉండరు. మొదలుపెడదామా? 🚀",
        ],
        "ta": [
            "{name}, உங்க முதல் பாடம் இங்கயே காத்திருக்கு 🎬 2 நிமிஷத்துல எந்த பேச்சிலயும் casual-ஆ சொல்ற 10 AI வார்த்தைகள் 💬 ஆரம்பிக்கலாமா?",
            "{name}, முதல் பாடம் இன்னும் திறக்கவே இல்லை 🎬 எல்லாரும் பூஜ்ஜியத்தில் இருந்துதான் ஆரம்பிக்கிறாங்க — இரண்டு நிமிடம், நீங்க அங்க இருக்க மாட்டீங்க. ஆரம்பிக்கலாமா? 🚀",
        ],
        "kn": [
            "{name}, ನಿಮ್ಮ ಮೊದಲ ಪಾಠ ಇಲ್ಲೇ ಕಾಯ್ತಾ ಇದೆ 🎬 2 ನಿಮಿಷದಲ್ಲಿ ಯಾವ ಮಾತುಕತೆಯಲ್ಲೂ casual ಆಗಿ ಹೇಳಬಹುದಾದ 10 AI ಪದಗಳು 💬 ಶುರುಮಾಡೋಣ್ವಾ?",
            "{name}, ಮೊದಲ ಪಾಠ ಇನ್ನೂ ತೆರೆದೇ ಇಲ್ಲ 🎬 ಎಲ್ಲರೂ ಸೊನ್ನೆಯಿಂದಲೇ ಶುರು — ಎರಡು ನಿಮಿಷ, ನೀವು ಅಲ್ಲಿ ಇರಲ್ಲ. ಶುರು ಮಾಡೋಣವೇ? 🚀",
        ],
    },
    "resume_lesson": {
        "en": [
            "{name}, you paused mid-lesson like it's a web-series cliffhanger 😅 the quiz is right there — finish the last few mins? 💪",
            "{name}, that lesson is still paused right where you left it ⏸️ pick it up from there — you're closer to the end than the start 💪",
        ],
        "hi": [
            "{name}, आपने पाठ बीच में ही pause कर दिया जैसे web-series का cliffhanger 😅 quiz बस सामने है — आख़िरी कुछ मिनट पूरे कर लो? 💪",
            "{name}, वो पाठ अब भी वहीं रुका है जहाँ आपने छोड़ा ⏸️ वहीं से उठा लीजिए — आप शुरुआत से ज़्यादा अंत के करीब हैं 💪",
        ],
        "mr": [
            "{name}, तुम्ही धडा मधेच pause केलात जसं web-series चा cliffhanger 😅 quiz अगदी समोर आहे — शेवटची काही मिनिटं पूर्ण करूया? 💪",
            "{name}, तो धडा अजूनही तिथेच थांबलाय जिथे तुम्ही सोडलात ⏸️ तिथूनच पुढे — तुम्ही सुरुवातीपेक्षा शेवटाच्या जवळ आहात 💪",
        ],
        "te": [
            "{name}, పాఠాన్ని మధ్యలో pause చేశారు web-series cliffhanger లా 😅 quiz ఇదిగో ఎదురుగా ఉంది — చివరి కొన్ని నిమిషాలు పూర్తి చేద్దామా? 💪",
            "{name}, ఆ పాఠం మీరు ఆపిన చోటే ఆగి ఉంది ⏸️ అక్కడి నుంచే కొనసాగించండి — మీరు మొదలు కంటే చివరికే దగ్గర 💪",
        ],
        "ta": [
            "{name}, பாடத்த பாதியில pause பண்ணீட்டீங்க web-series cliffhanger மாதிரி 😅 quiz இதோ முன்னாடி — கடைசி சில நிமிஷம் முடிச்சிடலாமா? 💪",
            "{name}, அந்தப் பாடம் நீங்க நிறுத்தின இடத்திலேயே இருக்கு ⏸️ அங்கிருந்தே தொடருங்க — ஆரம்பத்தை விட முடிவுக்குத்தான் நெருக்கம் 💪",
        ],
        "kn": [
            "{name}, ಪಾಠವನ್ನ ಮಧ್ಯದಲ್ಲೇ pause ಮಾಡಿದ್ರಿ web-series cliffhanger ತರ 😅 quiz ಇಲ್ಲೇ ಮುಂದೆ ಇದೆ — ಕೊನೆ ಕೆಲ ನಿಮಿಷ ಮುಗಿಸೋಣ್ವಾ? 💪",
            "{name}, ಆ ಪಾಠ ನೀವು ನಿಲ್ಲಿಸಿದಲ್ಲೇ ಇದೆ ⏸️ ಅಲ್ಲಿಂದಲೇ ಮುಂದುವರಿಸಿ — ಶುರುವಿಗಿಂತ ಕೊನೆಗೇ ಹತ್ತಿರ 💪",
        ],
    },
    "finish_quiz": {
        "en": [
            "{name}, one quiz stands between you and 'certified smart' 🧠 come back and bully it a little ✅",
            "{name}, the quiz is still open and it is not getting any harder ✅ a few taps and that lesson is properly done 🧠",
        ],
        "hi": [
            "{name}, बस एक quiz और आप बन जाओगे 'certified smart' 🧠 वापस आकर उसे थोड़ा हरा दो ✅",
            "{name}, क्विज़ अब भी खुला है और मुश्किल नहीं होने वाला ✅ कुछ tap और वो पाठ पूरा हो जाएगा 🧠",
        ],
        "mr": [
            "{name}, फक्त एक quiz आणि तुम्ही व्हाल 'certified smart' 🧠 परत येऊन त्याला थोडं हरवा ✅",
            "{name}, क्विझ अजूनही उघडी आहे आणि अवघड होणार नाही ✅ काही tap आणि तो धडा पूर्ण 🧠",
        ],
        "te": [
            "{name}, ఒక్క quiz దాటితే మీరు 'certified smart' 🧠 తిరిగి వచ్చి దాన్ని కొంచెం ఓడించండి ✅",
            "{name}, క్విజ్ ఇంకా తెరిచే ఉంది, కష్టం అవదు ✅ కొన్ని tap-లు, ఆ పాఠం పూర్తి 🧠",
        ],
        "ta": [
            "{name}, ஒரே ஒரு quiz தாண்டினா நீங்க 'certified smart' 🧠 திரும்பி வந்து அத கொஞ்சம் ஜெயிச்சிடுங்க ✅",
            "{name}, குவிஸ் இன்னும் திறந்தே இருக்கு, கஷ்டமாகப் போவதில்லை ✅ சில tap, அந்தப் பாடம் முழுசா முடியும் 🧠",
        ],
        "kn": [
            "{name}, ಒಂದೇ quiz ದಾಟಿದ್ರೆ ನೀವು 'certified smart' 🧠 ವಾಪಸ್ ಬಂದು ಅದನ್ನ ಸ್ವಲ್ಪ ಸೋಲಿಸಿ ✅",
            "{name}, ಕ್ವಿಜ್ ಇನ್ನೂ ತೆರೆದಿದೆ, ಕಷ್ಟ ಆಗಲ್ಲ ✅ ಕೆಲವು tap, ಆ ಪಾಠ ಪೂರ್ಣ 🧠",
        ],
    },
    "submit_assignment": {
        "en": [
            "{name}, your assignment is sitting there tapping its foot ✍️ type your answer, I'll grade it, we end on a high 🎯",
            "{name}, your assignment is still half-written in your head ✍️ send it as it is — I'll grade it and tell you what to fix 🎯",
        ],
        "hi": [
            "{name}, आपका assignment वहीं बैठा आपका इंतज़ार कर रहा है ✍️ अपना जवाब type करो, मैं grade कर दूँगा, ज़बरदस्त ending करते हैं 🎯",
            "{name}, आपका असाइनमेंट अब भी दिमाग़ में आधा लिखा है ✍️ जैसा है वैसा भेज दीजिए — मैं जाँच कर बता दूँगा क्या सुधारना है 🎯",
        ],
        "mr": [
            "{name}, तुमचं assignment तिथेच तुमची वाट बघत बसलंय ✍️ उत्तर type करा, मी तपासतो, दणक्यात शेवट करूया 🎯",
            "{name}, तुमचं असाइनमेंट अजून डोक्यातच अर्धं लिहिलंय ✍️ जसं आहे तसं पाठवा — मी तपासून काय सुधारायचं ते सांगतो 🎯",
        ],
        "te": [
            "{name}, మీ assignment అక్కడే మీ కోసం ఎదురుచూస్తోంది ✍️ మీ సమాధానం type చేయండి, నేను grade చేస్తా, అదిరిపోయేలా ముగిద్దాం 🎯",
            "{name}, మీ అసైన్‌మెంట్ ఇంకా మనసులోనే సగం రాసి ఉంది ✍️ ఉన్నదున్నట్టు పంపండి — నేను చూసి ఏం సరిచేయాలో చెప్తాను 🎯",
        ],
        "ta": [
            "{name}, உங்க assignment அங்கயே உங்களுக்காக காத்திருக்கு ✍️ பதில type பண்ணுங்க, நான் grade பண்றேன், அசத்தலா முடிப்போம் 🎯",
            "{name}, உங்க பணி இன்னும் மனசுலயே பாதி எழுதியிருக்கு ✍️ இருக்கிறபடியே அனுப்புங்க — நான் பார்த்து என்ன சரிசெய்யணும்னு சொல்றேன் 🎯",
        ],
        "kn": [
            "{name}, ನಿಮ್ಮ assignment ಅಲ್ಲೇ ನಿಮಗಾಗಿ ಕಾಯ್ತಿದೆ ✍️ ನಿಮ್ಮ ಉತ್ತರ type ಮಾಡಿ, ನಾನು grade ಮಾಡ್ತೀನಿ, ಜೋರಾಗಿ ಮುಗಿಸೋಣ 🎯",
            "{name}, ನಿಮ್ಮ ಅಸೈನ್‌ಮೆಂಟ್ ಇನ್ನೂ ತಲೆಯಲ್ಲೇ ಅರ್ಧ ಬರೆದಿದೆ ✍️ ಇರೋ ಹಾಗೇ ಕಳುಹಿಸಿ — ನಾನು ನೋಡಿ ಏನು ಸರಿಪಡಿಸಬೇಕು ಅಂತ ಹೇಳ್ತೀನಿ 🎯",
        ],
    },
    "keep_learning": {
        "en": [
            "{name}, you finished Lesson 1 like a pro 😎 more coming soon — got AI questions? my DMs are always open 🌟",
            "{name}, still here 👋 new lessons are on the way — in the meantime, ask me anything about what you learned 🌟",
        ],
        "hi": [
            "{name}, पाठ 1 को चुटकी में निपटा दिया 😎 और पाठ आ रहे हैं — AI का कोई सवाल हो तो DM खुला है 🌟",
            "{name}, अब भी यहीं हूँ 👋 नए पाठ रास्ते में हैं — तब तक, जो सीखा उस पर मुझसे कुछ भी पूछिए 🌟",
        ],
        "mr": [
            "{name}, धडा 1 चुटकीसरशी संपवला 😎 अजून धडे येतायत — AI बद्दल काही प्रश्न? DM नेहमी खुला आहे 🌟",
            "{name}, अजूनही इथेच आहे 👋 नवे धडे येतायत — तोपर्यंत, जे शिकलात त्याबद्दल मला काहीही विचारा 🌟",
        ],
        "te": [
            "{name}, పాఠం 1ని చిటికెలో ముగించారు 😎 ఇంకా పాఠాలు వస్తున్నాయి — AI గురించి ఏ doubt అయినా? నా DM ఎప్పుడూ open 🌟",
            "{name}, ఇంకా ఇక్కడే ఉన్నాను 👋 కొత్త పాఠాలు వస్తున్నాయి — అప్పటిదాకా, నేర్చుకున్నదాని గురించి ఏదైనా అడగండి 🌟",
        ],
        "ta": [
            "{name}, பாடம் 1-ஐ நொடியில முடிச்சிட்டீங்க 😎 இன்னும் பாடங்க வருது — AI பத்தி ஏதாவது doubt? என் DM எப்பவும் open 🌟",
            "{name}, இன்னும் இங்கதான் இருக்கேன் 👋 புதுப் பாடங்கள் வந்துட்டு இருக்கு — அதுவரை, கத்துக்கிட்டதைப் பத்தி எதுவும் கேளுங்க 🌟",
        ],
        "kn": [
            "{name}, ಪಾಠ 1 ನ್ನ ಚಿಟಿಕೆಯಲ್ಲಿ ಮುಗಿಸಿದ್ರಿ 😎 ಇನ್ನೂ ಪಾಠಗಳು ಬರ್ತಿವೆ — AI ಬಗ್ಗೆ ಯಾವ doubt ಇದ್ರೂ? ನನ್ DM ಯಾವಾಗ್ಲೂ open 🌟",
            "{name}, ಇನ್ನೂ ಇಲ್ಲೇ ಇದ್ದೀನಿ 👋 ಹೊಸ ಪಾಠಗಳು ಬರುತ್ತಿವೆ — ಅಲ್ಲಿಯವರೆಗೆ, ಕಲಿತದ್ದರ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ 🌟",
        ],
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
        # Read once per run, not per learner: it cannot change mid-run and this
        # keeps a 100-learner pass to a single settings lookup.
        from core.settings_store import get_flag
        assignments_on = await get_flag(db, "assignments_enabled")

        for s in sessions:
            if force_to and s.phone != force_to:
                continue

            # Learner texted "unsubscribe" → never send them a proactive message
            # again. Checked before force_key too, so even a manual ops run cannot
            # message someone who opted out.
            if getattr(s, "opt_out", False):
                report["skipped"] += 1
                continue

            # Assignments can be switched off by an admin. When they are, never
            # nudge someone to finish one — the step does not exist for them, and
            # the message would point at a screen they can no longer reach.
            if s.stage == "assignment" and not assignments_on:
                report["skipped"] += 1
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
                logk = _log_key(key, s)
                rec = (s.nudge_log or {}).get(logk) or {}
                sent_count = rec.get("n", 0)
                # Lifetime backstop across ALL nudges, so per-lesson scoping cannot
                # turn into an unbounded stream for a learner who stalls everywhere.
                total_sent = sum(v.get("n", 0) for v in (s.nudge_log or {}).values()
                                 if isinstance(v, dict))
                if total_sent >= MAX_TOTAL_NUDGES:
                    report["skipped"] += 1
                    continue
                # This nudge has already been shown the max number of times.
                if sent_count >= MAX_PER_KEY:
                    report["skipped"] += 1
                    continue
                # ...or it has failed too often to keep trying. Without this a
                # permanently-rejected template retries hourly for ever.
                if rec.get("fail", 0) >= MAX_FAILURES_PER_KEY:
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
                # A COURSE nudge that has drifted outside the window would need a
                # paid template. Skip it instead: the thresholds are designed to
                # land inside the window, so this is the exception, not the plan.
                # `day is None` means this is a course nudge — the pre-sale tiers
                # carry a day and are outside the window by design.
                if (day is None and not settings.paid_course_nudges
                        and _idle_hours(s, now) >= WINDOW_HOURS):
                    report["skipped"] += 1
                    continue

            text_key = _text_key(key)   # signup tiers reuse the finish_signup copy
            if text_key not in NUDGE_TEXT:
                report["errors"].append(f"unknown nudge key {key}")
                continue

            lang = s.language or "en"
            name = (s.name or "").strip() or "there"
            _copy = NUDGE_TEXT[text_key].get(lang) or NUDGE_TEXT[text_key]["en"]
            if isinstance(_copy, (list, tuple)) and _copy:
                # Alternate on how many times THIS key has already gone out to
                # THIS learner, so the second nudge is never a copy of the first.
                # Recomputed here rather than reusing sent_count, which is only
                # set on the course-nudge branch.
                _n = ((s.nudge_log or {}).get(_log_key(key, s)) or {}).get("n", 0)
                _copy = _copy[_n % len(_copy)]
            text = _copy.format(name=name)
            try:
                # Pre-sales tiers carry admin-uploaded photo/video/text for (day, lang).
                asset = await db.get(MarketingAsset, f"{day}_{lang}") if day is not None else None
                # Admin's text is the caption under the media (or a plain message if no
                # media). Falls back to the default nudge copy when text is empty.
                caption = (asset.text.strip() if (asset and asset.text and asset.text.strip()) else text)
                in_window = _idle_hours(s, now) < WINDOW_HOURS

                if in_window:
                    # Inside the 24h window → FREE-FORM, which is FREE. Media with the
                    # admin's text as caption (or text alone). Used regardless of the
                    # templates flag, so in-window nudges never cost a paid template.
                    if asset and asset.video_public_id:
                        await send_video(s.phone, asset.video_public_id, caption); sent_as = "media:video"
                    elif asset and asset.image_public_id:
                        await send_image(s.phone, asset.image_public_id, caption); sent_as = "media:image"
                    else:
                        await send_text(s.phone, caption); sent_as = "text"
                else:
                    # Outside the window → only a (paid) template can deliver. We only
                    # reach here when templates are enabled (the gate above skips
                    # outside-window sends when they're off). Correct-language media rides
                    # in the header, and the admin's per-language caption goes into the
                    # template's {{1}}. WhatsApp rejects params with newlines/tabs, so
                    # flatten to one line; fall back to a default if the admin left it empty.
                    cap = (caption or "").replace("\n", " ").replace("\t", " ").strip()[:600] \
                        or "Your free AI lessons are waiting 🎓"
                    if asset and asset.video_public_id:
                        resp = await send_template(s.phone, PRESALE_VIDEO_TEMPLATE, PRESALE_TEMPLATE_LANG, [cap],
                                                   header_media={"type": "video", "link": _video_url(asset.video_public_id)})
                        sent_as = "template:video"
                    elif asset and asset.image_public_id:
                        resp = await send_template(s.phone, PRESALE_IMAGE_TEMPLATE, PRESALE_TEMPLATE_LANG, [cap],
                                                   header_media={"type": "image", "link": _image_url(asset.image_public_id)})
                        sent_as = "template:image"
                    else:  # no media → the per-language approved text template ({{1}} = name)
                        resp = await send_template(s.phone, NUDGE_TEMPLATE.get(text_key, NUDGE_TEMPLATE["finish_signup"]), lang, [name])
                        sent_as = "template:text"
                    if resp is None or getattr(resp, "status_code", 500) >= 400:
                        raise RuntimeError(f"template rejected (HTTP {getattr(resp, 'status_code', '?')})")
                s.last_nudge_at = now
                s.last_nudge_key = key
                # Bump the per-nudge count (build a NEW dict so SQLAlchemy sees the change).
                log = dict(s.nudge_log or {})
                lk = _log_key(key, s)
                prev = log.get(lk) or {}
                log[lk] = {"n": prev.get("n", 0) + 1, "at": now.isoformat()}
                s.nudge_log = log
                report["sent"].append({"phone": "…" + s.phone[-4:], "key": key, "lang": lang, "as": sent_as})
            except Exception as e:  # never let one bad send kill the run
                report["errors"].append(f"{s.phone[-4:]}: {e}")
                # Remember the failure against this nudge, so a template that can
                # never succeed is abandoned instead of retried every hour. Stored
                # on the same record as the success count, and committed with it.
                try:
                    log = dict(s.nudge_log or {})
                    lk = _log_key(key, s)
                    prev = dict(log.get(lk) or {})
                    prev["fail"] = prev.get("fail", 0) + 1
                    prev["fail_at"] = now.isoformat()
                    prev["fail_why"] = str(e)[:120]
                    log[lk] = prev
                    s.nudge_log = log
                except Exception:
                    pass

        await db.commit()
    print(f"✓ Drip run: checked {report['checked']}, sent {len(report['sent'])}, "
          f"skipped {report['skipped']}, errors {len(report['errors'])}")
    return report
