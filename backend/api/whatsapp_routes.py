"""
WhatsApp Cloud API adapter (Meta direct).

  GET  /whatsapp/webhook  → Meta verification handshake
  POST /whatsapp/webhook  → inbound → language picker → lesson → quiz → assignment

Learning flow (state persisted per phone in whatsapp_sessions):
  1. First contact → interactive LIST of 6 languages.
  2. Pick language → deliver Lesson 1 video + "Start quiz" button.
  3. Quiz → 5 MCQs as interactive lists; 3/5 to pass, retake on fail.
  4. Pass → deliver assignment; learner types their answer.
  5. Answer graded by Claude (60/100 to pass); resubmit on fail.
  6. Pass → lesson complete; free text routes to the Teacher agent.
"""
import asyncio
import hashlib
import hmac
import json
import random
import re
from collections import deque
from datetime import datetime

import anthropic
import httpx
from fastapi import APIRouter, BackgroundTasks, Request, Response, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from core.config import settings
from core.moderation import is_abusive
from core.rate_limit import check_rate_limit, should_notify
from core.spend_guard import allow_ai_call
from db.database import async_session_factory
from db.models import (
    WhatsAppSession, Course, CourseModule, Section, Video,
    VideoLanguageVariant, QuizQuestion, AssignmentPrompt, IntroVideo,
)
from agents.base import LearnerState
from agents.progress import build_teacher_context
from agents.teacher import run_teacher
from api.whatsapp_content import (
    LESSON_VIDEOS, QUIZ, QUIZ_PASS, ASSIGNMENT, ASSIGN_PASS, CONTENT, tr,
    INTRO_VIDEO_ID, intro_video_for, LANG_NAME, COURSE_FACTS, ONBOARD, ob,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

GRAPH = "https://graph.facebook.com"
NUM_EMOJI = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"]
# Delay after a lesson video before the "Start quiz" prompt, so the (slower to
# render) video shows above the prompt on the learner's phone.
LESSON_BUTTON_DELAY_SEC = 4

# De-dupe inbound message IDs. Meta re-delivers a webhook if we don't ACK fast
# enough; combined with the fast-ACK below this prevents double replies.
_seen_ids: set[str] = set()
_seen_order: deque[str] = deque()


def _seen_before(mid: str | None) -> bool:
    if not mid:
        return False
    if mid in _seen_ids:
        return True
    _seen_ids.add(mid)
    _seen_order.append(mid)
    if len(_seen_order) > 500:
        _seen_ids.discard(_seen_order.popleft())
    return False

LANGS = {
    "en": "English",
    "hi": "हिंदी (Hindi)",
    "mr": "मराठी (Marathi)",
    "te": "తెలుగు (Telugu)",
    "ta": "தமிழ் (Tamil)",
    "kn": "ಕನ್ನಡ (Kannada)",
}

# ── Quiz/assignment language switch ──────────────────────────────────────────
# A separate language JUST for quizzes + assignments (the video/course/UI stays
# in `session.language`). Reply-button labels must stay ≤ 20 chars.
QLANG_BTN = {  # button under the lesson video
    "en": "🌐 Quiz language", "hi": "🌐 क्विज़ भाषा", "mr": "🌐 क्विझ भाषा",
    "te": "🌐 క్విజ్ భాష", "ta": "🌐 வினா மொழி", "kn": "🌐 ಕ್ವಿಜ್ ಭಾಷೆ",
}
QLANG_CHOOSE = {  # list-open button (≤20 chars)
    "en": "Choose language", "hi": "भाषा चुनें", "mr": "भाषा निवडा",
    "te": "భాష ఎంచుకోండి", "ta": "மொழியைத் தேர்வு", "kn": "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
}
QLANG_PROMPT = {  # picker body
    "en": "Pick the language for quizzes & assignments 👇\n(your lessons stay the same)",
    "hi": "क्विज़ और असाइनमेंट के लिए भाषा चुनें 👇\n(आपके पाठ वैसे ही रहेंगे)",
    "mr": "क्विझ आणि असाइनमेंटसाठी भाषा निवडा 👇\n(तुमचे धडे तसेच राहतील)",
    "te": "క్విజ్‌లు & అసైన్‌మెంట్‌ల కోసం భాషను ఎంచుకోండి 👇\n(మీ పాఠాలు అలాగే ఉంటాయి)",
    "ta": "வினாடி வினா & பணிகளுக்கான மொழியைத் தேர்வுசெய்யவும் 👇\n(உங்கள் பாடங்கள் அப்படியே இருக்கும்)",
    "kn": "ಕ್ವಿಜ್ & ಅಸೈನ್‌ಮೆಂಟ್‌ಗಳಿಗೆ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ 👇\n(ನಿಮ್ಮ ಪಾಠಗಳು ಹಾಗೇ ಇರುತ್ತವೆ)",
}
QLANG_SET = {  # confirmation after switching
    "en": "✅ Quizzes & assignments will now be in {label}.",
    "hi": "✅ अब क्विज़ और असाइनमेंट {label} में होंगे।",
    "mr": "✅ आता क्विझ आणि असाइनमेंट {label} मध्ये असतील.",
    "te": "✅ ఇప్పుడు క్విజ్‌లు & అసైన్‌మెంట్‌లు {label}లో ఉంటాయి.",
    "ta": "✅ இனி வினாடி வினா & பணிகள் {label} மொழியில் இருக்கும்.",
    "kn": "✅ ಇನ್ನು ಕ್ವಿಜ್ & ಅಸೈನ್‌ಮೆಂಟ್‌ಗಳು {label}ನಲ್ಲಿ ಇರುತ್ತವೆ.",
}


def _qlang(session) -> str:
    """The language for quiz + assignment content — the per-user override if set,
    otherwise the course language."""
    return session.quiz_language or session.language or "en"


# ── Change the WHOLE course language (videos + quizzes + assignments + UI) ──────
CLANG_BTN = {  # lesson-prompt button (≤20 chars)
    "en": "🎬 Course language", "hi": "🎬 कोर्स भाषा", "mr": "🎬 कोर्स भाषा",
    "te": "🎬 కోర్సు భాష", "ta": "🎬 பாட மொழி", "kn": "🎬 ಕೋರ್ಸ್ ಭಾಷೆ",
}
CLANG_WARN = {  # warning shown as the picker body
    "en": "⚠️ This changes your *whole course* to the new language — videos, quizzes AND assignments. Choose the language 👇",
    "hi": "⚠️ यह आपके *पूरे कोर्स* को नई भाषा में बदल देगा — videos, quizzes और assignments सब कुछ। भाषा चुनें 👇",
    "mr": "⚠️ हे तुमचा *संपूर्ण कोर्स* नवीन भाषेत बदलेल — videos, quizzes आणि assignments सगळं. भाषा निवडा 👇",
    "te": "⚠️ ఇది మీ *మొత్తం కోర్సును* కొత్త భాషలోకి మారుస్తుంది — videos, quizzes మరియు assignments అన్నీ. భాషను ఎంచుకోండి 👇",
    "ta": "⚠️ இது உங்கள் *முழு பாடத்தையும்* புதிய மொழிக்கு மாற்றும் — videos, quizzes மற்றும் assignments அனைத்தும். மொழியைத் தேர்வுசெய்யுங்கள் 👇",
    "kn": "⚠️ ಇದು ನಿಮ್ಮ *ಸಂಪೂರ್ಣ ಕೋರ್ಸ್* ಅನ್ನು ಹೊಸ ಭಾಷೆಗೆ ಬದಲಾಯಿಸುತ್ತದೆ — videos, quizzes ಮತ್ತು assignments ಎಲ್ಲವೂ. ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ 👇",
}
CLANG_APPLY_PROMPT = {  # after a language is picked → restart vs resume
    "en": "Switch to *{label}*. Start from the beginning, or continue from your current lesson — in {label}?",
    "hi": "*{label}* में बदलें। शुरू से शुरू करें, या अपने current lesson से आगे बढ़ें — {label} में?",
    "mr": "*{label}* मध्ये बदला. सुरुवातीपासून सुरू करा, की तुमच्या current lesson पासून पुढे जा — {label} मध्ये?",
    "te": "*{label}*కి మారండి. మొదటి నుండి ప్రారంభించాలా, లేదా మీ ప్రస్తుత lesson నుండి కొనసాగించాలా — {label}లో?",
    "ta": "*{label}*க்கு மாறுங்கள். ஆரம்பத்திலிருந்து தொடங்கவா, அல்லது தற்போதைய lesson-ல் இருந்து தொடரவா — {label}-ல்?",
    "kn": "*{label}*ಗೆ ಬದಲಿಸಿ. ಮೊದಲಿನಿಂದ ಪ್ರಾರಂಭಿಸಬೇಕೆ, ಅಥವಾ ನಿಮ್ಮ ಪ್ರಸ್ತುತ lesson ನಿಂದ ಮುಂದುವರಿಸಬೇಕೆ — {label}ನಲ್ಲಿ?",
}
CLANG_RESTART_BTN = {"en": "🔁 From the start", "hi": "🔁 शुरू से", "mr": "🔁 सुरुवातीपासून", "te": "🔁 మొదటి నుండి", "ta": "🔁 ஆரம்பம்", "kn": "🔁 ಮೊದಲಿನಿಂದ"}
CLANG_RESUME_BTN = {"en": "▶️ Continue here", "hi": "▶️ यहीं से आगे", "mr": "▶️ इथूनच पुढे", "te": "▶️ ఇక్కడి నుండి", "ta": "▶️ இங்கிருந்து", "kn": "▶️ ಇಲ್ಲಿಂದ ಮುಂದೆ"}


def _configured() -> bool:
    return bool(settings.whatsapp_token and settings.whatsapp_phone_number_id)


def _messages_url() -> str:
    return f"{GRAPH}/{settings.graph_api_version}/{settings.whatsapp_phone_number_id}/messages"


# Cloudinary transform: shrink the lesson video to a WhatsApp-friendly MP4
# (H.264/AAC, ~10 MB) so it plays inline. WhatsApp rejects videos over 16 MB;
# the originals are 60-100 MB.
VIDEO_TRANSFORM = "w_480,br_400k,vc_h264,ac_aac,q_auto:low"


def _video_url(public_id: str) -> str:
    return (f"https://res.cloudinary.com/{settings.cloudinary_cloud_name}"
            f"/video/upload/{VIDEO_TRANSFORM}/{public_id}.mp4")


def _image_url(public_id: str) -> str:
    # Auto format/quality, capped width — small and fast for WhatsApp.
    return (f"https://res.cloudinary.com/{settings.cloudinary_cloud_name}"
            f"/image/upload/f_auto,q_auto,w_1080/{public_id}")


async def send_image(to: str, public_id: str, caption: str = "") -> None:
    """Send a Cloudinary image inline on WhatsApp (by link — images are small and
    Cloudinary serves them instantly, so no upload-by-id dance is needed)."""
    url = _image_url(public_id)
    resp = await _post({
        "messaging_product": "whatsapp", "to": to, "type": "image",
        "image": {"link": url, "caption": caption[:1024]},
    })
    if resp is None or resp.status_code >= 400:
        # Fallback: caption + clickable link so something still lands.
        await send_text(to, f"{caption}\n\n🖼️ {url}" if caption else f"🖼️ {url}")


async def _post(payload: dict) -> httpx.Response | None:
    if not _configured():
        print("⚠ WhatsApp not configured — skipping send")
        return None
    try:
        async with httpx.AsyncClient(timeout=60) as h:
            resp = await h.post(
                _messages_url(),
                headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
                json=payload,
            )
            if resp.status_code >= 400:
                print(f"⚠ WhatsApp send failed {resp.status_code}: {resp.text[:400]}")
            return resp
    except httpx.HTTPError as e:
        print(f"⚠ WhatsApp send error: {e}")
        return None


async def send_text(to: str, body: str) -> None:
    await _post({
        "messaging_product": "whatsapp", "to": to, "type": "text",
        "text": {"body": body[:4096]},
    })


async def send_buttons(to: str, text: str, buttons: list[tuple[str, str]]) -> None:
    """Up to 3 reply buttons. `buttons` = list of (id, title)."""
    await _post({
        "messaging_product": "whatsapp", "to": to, "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": text[:1024]},
            "action": {"buttons": [
                {"type": "reply", "reply": {"id": bid, "title": title[:20]}}
                for bid, title in buttons[:3]
            ]},
        },
    })


async def send_list(to: str, header: str, body: str, button: str,
                    rows: list[tuple[str, str, str]], section_title: str = "Options") -> None:
    """Interactive list menu. `rows` = list of (id, title, description)."""
    await _post({
        "messaging_product": "whatsapp", "to": to, "type": "interactive",
        "interactive": {
            "type": "list",
            "header": {"type": "text", "text": header[:60]},
            "body": {"text": body[:1024]},
            "action": {
                "button": button[:20],
                "sections": [{
                    "title": section_title[:24],
                    "rows": [
                        {"id": rid, "title": title[:24], "description": desc[:72]}
                        for rid, title, desc in rows[:10]
                    ],
                }],
            },
        },
    })


async def _download(url: str, timeout: int = 60) -> bytes | None:
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as h:
            r = await h.get(url)
            if r.status_code < 400:
                return r.content
            print(f"⚠ video fetch failed {r.status_code}")
    except httpx.HTTPError as e:
        print(f"⚠ video fetch error: {e}")
    return None


async def _upload_media(data: bytes) -> str | None:
    """Upload video bytes to WhatsApp; returns a reusable media_id."""
    if not _configured():
        return None
    url = f"{GRAPH}/{settings.graph_api_version}/{settings.whatsapp_phone_number_id}/media"
    try:
        async with httpx.AsyncClient(timeout=120) as h:
            r = await h.post(
                url,
                headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
                data={"messaging_product": "whatsapp", "type": "video/mp4"},
                files={"file": ("lesson.mp4", data, "video/mp4")},
            )
            if r.status_code < 400:
                return r.json().get("id")
            print(f"⚠ media upload failed {r.status_code}: {r.text[:300]}")
    except httpx.HTTPError as e:
        print(f"⚠ media upload error: {e}")
    return None


# Localized fallback when a voice note can't be transcribed.
VOICE_FAIL = {
    "en": "🎙️ Sorry, I couldn't quite catch that voice note — could you type it instead?",
    "hi": "🎙️ माफ़ करें, मैं वह वॉइस नोट समझ नहीं पाया — क्या आप इसे टाइप कर सकते हैं?",
    "mr": "🎙️ माफ करा, मला तो व्हॉइस नोट नीट समजला नाही — कृपया टाइप करून पाठवाल का?",
    "te": "🎙️ క్షమించండి, ఆ వాయిస్ నోట్ నాకు సరిగ్గా అర్థం కాలేదు — దయచేసి టైప్ చేయగలరా?",
    "ta": "🎙️ மன்னிக்கவும், அந்த குரல் குறிப்பு எனக்கு சரியாகப் புரியவில்லை — தயவுசெய்து தட்டச்சு செய்ய முடியுமா?",
    "kn": "🎙️ ಕ್ಷಮಿಸಿ, ಆ ಧ್ವನಿ ಟಿಪ್ಪಣಿ ನನಗೆ ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ — ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಬಹುದೇ?",
}


async def transcribe_audio(media_id: str) -> str | None:
    """Download a WhatsApp voice note and transcribe it to text via Groq Whisper."""
    if not settings.groq_api_key:
        print("⚠ voice: GROQ_API_KEY not set — can't transcribe")
        return None
    ver = settings.graph_api_version
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}"}
    try:
        async with httpx.AsyncClient(timeout=60) as h:
            meta = await h.get(f"{GRAPH}/{ver}/{media_id}", headers=headers)
            if meta.status_code >= 400:
                print(f"⚠ voice: media lookup failed {meta.status_code}: {meta.text[:200]}")
                return None
            url = meta.json().get("url")
            if not url:
                return None
            audio = await h.get(url, headers=headers)
            if audio.status_code >= 400:
                print(f"⚠ voice: media download failed {audio.status_code}")
                return None
            data = audio.content
    except httpx.HTTPError as e:
        print(f"⚠ voice: download error: {e}")
        return None
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)
        resp = await client.audio.transcriptions.create(
            file=("voice.ogg", data),
            model="whisper-large-v3",
        )
        text = (resp.text or "").strip()
        print(f"✓ voice transcribed ({len(data)} bytes) -> {text[:80]!r}")
        return text or None
    except Exception as e:
        print(f"⚠ voice: transcription error: {e}")
        return None


async def _handle_audio(frm: str, media_id: str, name: str | None) -> None:
    """Transcribe a voice note, then run it through the normal text handler."""
    text = await transcribe_audio(media_id) if allow_ai_call() else None
    if text:
        await _handle_message(frm, None, text, name)
        return
    # Couldn't transcribe → nudge them to type, in their language if we know it.
    lang = "en"
    try:
        async with async_session_factory() as db:
            s = await db.get(WhatsAppSession, frm)
            if s and s.language:
                lang = s.language
    except Exception:
        pass
    await send_text(frm, VOICE_FAIL.get(lang, VOICE_FAIL["en"]))


async def send_template(to: str, name: str, lang_code: str, body_params: list[str] | None = None) -> httpx.Response | None:
    """Send a pre-approved WhatsApp template (for messages outside the 24h window)."""
    template: dict = {"name": name, "language": {"code": lang_code}}
    if body_params:
        template["components"] = [{
            "type": "body",
            "parameters": [{"type": "text", "text": p} for p in body_params],
        }]
    return await _post({
        "messaging_product": "whatsapp", "to": to, "type": "template", "template": template,
    })


async def send_video(to: str, public_id: str, caption: str) -> None:
    """Deliver a lesson video so it plays inline in WhatsApp.

    Downloads the compressed (<16 MB) video, uploads it to WhatsApp for a media_id,
    and sends by id — this avoids Meta's short link-fetch timeout. Falls back to a
    clickable link if the video can't be fetched/uploaded.
    """
    url = _video_url(public_id)
    # A cold Cloudinary derivative (first-ever request for a video) is still
    # transcoding — the first fetch triggers generation but may 4xx/hang, so a
    # single attempt would silently drop the video and jump straight to the quiz.
    # Retry a few times (pausing for the transcode the first attempt kicked off)
    # so the video sends on the first "next lesson" instead of needing a manual retry.
    data = None
    for attempt in range(3):
        # Short per-attempt timeout so a stuck/cold fetch fails fast and we fall
        # back to a link in seconds, not minutes. Warm-on-upload makes the derivative
        # ready ahead of time, so this path is mostly a safety net now.
        data = await _download(url, timeout=30)
        if data:
            break
        if attempt < 2:
            await asyncio.sleep(6)
    if data:
        print(f"✓ video fetched {len(data)} bytes for {public_id}")
        media_id = await _upload_media(data)
        if media_id:
            resp = await _post({
                "messaging_product": "whatsapp", "to": to, "type": "video",
                "video": {"id": media_id, "caption": caption[:1024]},
            })
            if resp is not None and resp.status_code < 400:
                print(f"✓ video sent by media_id for {public_id}")
                return
            print(f"⚠ video send by media_id failed for {public_id}")
    # Reliable fallback: a clickable link in text. We deliberately do NOT retry
    # video-by-link here — Meta returns 200 but often silently fails to fetch it,
    # so the learner would get nothing at all.
    print(f"⚠ video falling back to text link for {public_id}")
    await send_text(to, f"{caption}\n\n▶️ {url}")


# ── Assignment grading (Claude Haiku, text answer) ───────────────────────────
async def grade_answer(question: str, rubric: str, answer: str, lang: str) -> tuple[int, str]:
    lang_instruction = {
        "hi": "Respond entirely in Hindi (Devanagari script).",
        "mr": "Respond entirely in Marathi (Devanagari script).",
        "te": "Respond entirely in Telugu.",
        "ta": "Respond entirely in Tamil.",
        "kn": "Respond entirely in Kannada.",
    }.get(lang, "Respond in English.")

    prompt = f"""You are an expert educational evaluator for an AI literacy course for Indian freshers.

Assignment question:
{question}

Rubric (use this to assign the score):
{rubric}

{lang_instruction}

Learner's answer:
{answer}

Respond ONLY with valid JSON in this exact shape — no markdown, no extra text:
{{"score": <integer 0-100>, "feedback": "<2-3 sentence feedback string>"}}"""

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        message = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        result = json.loads(m.group()) if m else {}
        score = max(0, min(100, int(result.get("score", 0))))
        feedback = result.get("feedback", "")
        return score, feedback
    except Exception as e:
        print(f"⚠ WhatsApp grading error: {e}")
        return 0, "Sorry — I couldn't evaluate that just now. Please send your answer again."


async def generate_pitch(lang: str, status_label: str, name: str = "friend") -> str:
    """A short, personalized 'why this course is for you' message, in-language."""
    prompt = f"""You are a warm, concise counsellor for Cosmoplex AI School.

Course facts:
{COURSE_FACTS}

The person you're messaging is named {name} and is: {status_label}.

Write a short WhatsApp message in {LANG_NAME.get(lang, 'English')} (5-7 short lines max).
- Address them warmly by their name ({name}) at least once, naturally.
- Give a quick, concrete taste of what they'll learn (name 2-3 real topics).
- Give 2 specific reasons it's beneficial and relevant for someone who is {status_label}.
- Warm and motivating, not salesy. Use *bold* sparingly (WhatsApp uses *single asterisks*).
- Plain lines with the occasional emoji are fine. Do NOT use markdown headings or bullet lists.
- Do NOT ask any question at the end."""
    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        message = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
    except Exception as e:
        print(f"⚠ WhatsApp pitch error: {e}")
        return ""


# ── Webhook verification ──────────────────────────────────────────────────────
@router.get("/webhook")
async def verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return Response(content=hub_challenge or "", media_type="text/plain")
    return Response(status_code=403, content="verification failed")


# ── One-time helper: register a phone number on the Cloud API ────────────────
@router.get("/register")
async def register_number(phone_number_id: str, pin: str, key: str):
    if key != settings.whatsapp_verify_token:
        return Response(status_code=403, content="forbidden")
    if not settings.whatsapp_token:
        return {"ok": False, "error": "WHATSAPP_TOKEN is not set on the server."}
    url = f"{GRAPH}/{settings.graph_api_version}/{phone_number_id}/register"
    try:
        async with httpx.AsyncClient(timeout=30) as h:
            resp = await h.post(
                url,
                headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
                json={"messaging_product": "whatsapp", "pin": pin},
            )
        return {"ok": resp.status_code < 400, "status_code": resp.status_code, "body": resp.text}
    except httpx.HTTPError as e:
        return {"ok": False, "error": str(e)}


# ── One-shot setup: find the real Phone Number ID for a WABA and register it ──
@router.get("/setup")
async def setup_number(waba_id: str, key: str, pin: str = "000111"):
    if key != settings.whatsapp_verify_token:
        return Response(status_code=403, content="forbidden — 'key' must equal WHATSAPP_VERIFY_TOKEN")
    if not settings.whatsapp_token:
        return {"ok": False, "error": "WHATSAPP_TOKEN is not set on the server."}
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}"}
    ver = settings.graph_api_version
    try:
        async with httpx.AsyncClient(timeout=30) as h:
            listing = await h.get(f"{GRAPH}/{ver}/{waba_id}/phone_numbers", headers=headers)
            if listing.status_code >= 400:
                return {"ok": False, "step": "list_numbers", "status": listing.status_code, "body": listing.text}
            numbers = listing.json().get("data", [])
            if not numbers:
                return {"ok": False, "step": "list_numbers", "error": "No phone numbers on this WABA.", "body": listing.text}
            num = numbers[0]
            phone_number_id = num.get("id")
            display = num.get("display_phone_number")
            reg = await h.post(
                f"{GRAPH}/{ver}/{phone_number_id}/register",
                headers=headers,
                json={"messaging_product": "whatsapp", "pin": pin},
            )
            return {
                "ok": reg.status_code < 400,
                "found_number": display,
                "phone_number_id": phone_number_id,
                "register_status": reg.status_code,
                "register_body": reg.text,
                "all_numbers": [{"id": n.get("id"), "number": n.get("display_phone_number")} for n in numbers],
            }
    except httpx.HTTPError as e:
        return {"ok": False, "error": str(e)}


# ── Subscribe THIS app to a WABA's webhooks ──────────────────────────────────
@router.get("/subscribe")
async def subscribe_app(waba_id: str, key: str):
    if key != settings.whatsapp_verify_token:
        return Response(status_code=403, content="forbidden — 'key' must equal WHATSAPP_VERIFY_TOKEN")
    if not settings.whatsapp_token:
        return {"ok": False, "error": "WHATSAPP_TOKEN is not set on the server."}
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}"}
    ver = settings.graph_api_version
    try:
        async with httpx.AsyncClient(timeout=30) as h:
            sub = await h.post(f"{GRAPH}/{ver}/{waba_id}/subscribed_apps", headers=headers)
            check = await h.get(f"{GRAPH}/{ver}/{waba_id}/subscribed_apps", headers=headers)
        return {
            "ok": sub.status_code < 400,
            "subscribe_status": sub.status_code,
            "subscribe_body": sub.text,
            "currently_subscribed": check.text,
        }
    except httpx.HTTPError as e:
        return {"ok": False, "error": str(e)}


# ── Drip engine trigger (call daily via Render Cron Job, or the in-app scheduler) ─
@router.get("/run-drip")
async def run_drip_endpoint(key: str, to: str | None = None, force_key: str | None = None):
    """Run the nudge pass (call hourly via Render Cron Job, or the in-app scheduler).
    Guarded by the verify token. Optional ?to=<phone>&force_key=<nudge> bypasses
    idle/dedupe for a test send to one number."""
    if key != settings.whatsapp_verify_token:
        return Response(status_code=403, content="forbidden — 'key' must equal WHATSAPP_VERIFY_TOKEN")
    from api.whatsapp_drip import run_drip
    return await run_drip(force_to=to, force_key=force_key)


@router.get("/diag")
async def diag_video(key: str, lang: str = "hi", idx: int = 0):
    """Diagnose the lesson pipeline for a language: how many lessons resolve, their
    titles/order, and whether the lesson at `idx` downloads + uploads to WhatsApp."""
    if key != settings.whatsapp_verify_token:
        return Response(status_code=403, content="forbidden")
    out: dict = {"lang": lang, "configured": _configured(), "idx": idx}
    async with async_session_factory() as db:
        try:
            lessons = await _db_lessons(db, lang)
            out["lesson_count"] = len(lessons)
            out["lessons"] = [{"i": i, "title": l["title"], "cloud_id": l["cloud_id"]}
                              for i, l in enumerate(lessons)]
            if 0 <= idx < len(lessons):
                data = await _download(_video_url(lessons[idx]["cloud_id"]))
                out["download_bytes"] = len(data) if data else 0
                if data:
                    out["upload_ok"] = bool(await _upload_media(data))
            else:
                out["note"] = f"no lesson at index {idx}"
        except Exception as e:
            out["error"] = f"{type(e).__name__}: {str(e)[:200]}"
    return out


@router.get("/diag-teacher")
async def diag_teacher_context(key: str, lang: str = "en", completed: int = 0):
    """Diagnose the Teacher agent's progress-scoped knowledge for a language,
    simulating `completed` lessons done. Read-only — builds the same context
    _teacher_answer would, without sending anything or calling the AI."""
    if key != settings.whatsapp_verify_token:
        return Response(status_code=403, content="forbidden")
    out: dict = {"lang": lang, "completed": completed}
    async with async_session_factory() as db:
        try:
            lessons = await _db_lessons(db, lang)
            out["lesson_count"] = len(lessons)
            out["lesson_titles"] = [l["title"] for l in lessons]
            out["module_titles_in_order"] = [l["module_title"] for l in lessons]
            out["modules_with_content_doc"] = [l["module_title"] for l in lessons if l.get("content_doc")]
            completed_ids = {l["video_id"] for l in lessons[:completed] if l["video_id"]}
            ctx = build_teacher_context(lessons, lambda l: l["video_id"] in completed_ids)
            out["knowledge_text_length"] = len(ctx["knowledge_text"])
            out["knowledge_text_preview"] = ctx["knowledge_text"][:500]
            out["not_yet_covered"] = ctx["not_yet_covered"]
            out["has_any_progress"] = ctx["has_any_progress"]
        except Exception as e:
            out["error"] = f"{type(e).__name__}: {str(e)[:300]}"
    return out


async def _send_rate_limit_notice(frm: str) -> None:
    """Politely tell a flooding/fast sender to slow down, in their known language
    if we have one. Only called at most once per cooldown (see should_notify)."""
    lang = "en"
    try:
        async with async_session_factory() as db:
            s = await db.get(WhatsAppSession, frm)
            if s and s.language:
                lang = s.language
    except Exception:
        pass
    await send_text(frm, tr(lang, "rate_limited"))


def _verify_webhook_signature(raw_body: bytes, header_sig: str | None) -> bool:
    """Verify Meta's X-Hub-Signature-256 (HMAC-SHA256 of the raw body, keyed
    with the Meta App Secret) so a spoofed POST can't burn AI/voice spend.
    Skipped (returns True) if WHATSAPP_APP_SECRET isn't configured, so existing
    setups don't break — but this should be set before real go-live."""
    if not settings.whatsapp_app_secret:
        return True
    if not header_sig or not header_sig.startswith("sha256="):
        return False
    expected = hmac.new(settings.whatsapp_app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_sig.split("=", 1)[1])


# ── Inbound messages ─────────────────────────────────────────────────────────
@router.post("/webhook")
async def receive(request: Request, background_tasks: BackgroundTasks):
    # ACK Meta immediately, then handle each message in the background. The
    # Teacher/grading calls can take 10-30s; if we blocked the response Meta
    # would time out and re-deliver, causing duplicate replies.
    raw_body = await request.body()
    if not _verify_webhook_signature(raw_body, request.headers.get("x-hub-signature-256")):
        print("⚠ WhatsApp webhook: signature verification failed — rejecting")
        return Response(status_code=403, content="invalid signature")
    data = json.loads(raw_body)
    try:
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                contacts = value.get("contacts", [])
                name = contacts[0].get("profile", {}).get("name") if contacts else None
                for msg in value.get("messages", []):
                    if _seen_before(msg.get("id")):
                        continue
                    frm = msg.get("from")
                    if not frm:
                        continue
                    # Per-phone rate limit — bounds flood/cost abuse before any AI
                    # or DB work is even queued. Generous limits, real users never hit it.
                    if check_rate_limit(frm):
                        if should_notify(frm):
                            background_tasks.add_task(_send_rate_limit_notice, frm)
                        continue
                    # Voice notes: transcribe, then treat as a typed message.
                    if msg.get("type") == "audio":
                        media_id = (msg.get("audio") or {}).get("id")
                        if media_id:
                            background_tasks.add_task(_handle_audio, frm, media_id, name)
                        continue
                    reply_id, text = _extract(msg)
                    if reply_id or text:
                        background_tasks.add_task(_handle_message, frm, reply_id, text, name)
    except Exception as e:
        print(f"⚠ WhatsApp webhook error: {e}")
    return {"status": "ok"}


def _extract(msg: dict) -> tuple[str | None, str | None]:
    """Return (interactive_reply_id, text)."""
    mtype = msg.get("type")
    if mtype == "text":
        return None, msg.get("text", {}).get("body")
    if mtype == "interactive":
        inter = msg.get("interactive", {})
        if inter.get("type") == "button_reply":
            r = inter["button_reply"]
            return r.get("id"), r.get("title")
        if inter.get("type") == "list_reply":
            r = inter["list_reply"]
            return r.get("id"), r.get("title")
    return None, None


# ── Senders for each step ─────────────────────────────────────────────────────
async def _send_language_picker(to: str) -> None:
    rows = [(f"lang_{code}", label.split(" (")[0], label) for code, label in LANGS.items()]
    await send_list(
        to,
        header="Cosmoplex",
        body="👋 Welcome to Cosmoplex — learn AI in your own language!\n\nFirst, choose the language you'd like to learn in:",
        button="Choose language",
        rows=rows,
        section_title="Languages",
    )


async def _send_quiz_language_picker(to: str, lang: str) -> None:
    """Picker that switches ONLY the quiz + assignment language (rows carry a
    distinct `qlang_` id so this never restarts onboarding)."""
    rows = [(f"qlang_{code}", label.split(" (")[0], label) for code, label in LANGS.items()]
    await send_list(
        to, header="Cosmoplex",
        body=QLANG_PROMPT.get(lang, QLANG_PROMPT["en"]),
        button=QLANG_CHOOSE.get(lang, QLANG_CHOOSE["en"]),
        rows=rows, section_title="Languages",
    )


async def _send_course_language_picker(to: str, lang: str) -> None:
    """Picker that changes the WHOLE course language. Body carries the warning;
    rows use a distinct `clang_` id → then the learner chooses restart vs resume."""
    rows = [(f"clang_{code}", label.split(" (")[0], label) for code, label in LANGS.items()]
    await send_list(
        to, header="Cosmoplex",
        body=CLANG_WARN.get(lang, CLANG_WARN["en"]),
        button=QLANG_CHOOSE.get(lang, QLANG_CHOOSE["en"]),
        rows=rows, section_title="Languages",
    )


# ── Onboarding (pre-sale funnel) ─────────────────────────────────────────────
STATUS_MAP = {
    "prof_student": "student",
    "prof_graduate": "graduate",
    "prof_working": "working",
    "prof_jobseeker": "jobseeker",
}
STATUS_PITCH = {
    "student": "a student",
    "graduate": "a recent graduate",
    "working": "a working professional",
    "jobseeker": "someone actively looking for a job",
}
GOAL_MAP = {
    "goal_job": "Land an AI/tech job",
    "goal_grow": "Grow in current job",
    "goal_build": "Build my own project",
    "goal_explore": "Just exploring AI",
}


async def _send_profile_question(to: str, lang: str) -> None:
    rows = [(oid, label, "") for oid, label in ob(lang, "profile_opts")]
    await send_list(to, header="Cosmoplex", body=ob(lang, "profile_q"),
                    button=ob(lang, "select_btn"), rows=rows, section_title=ob(lang, "select_btn"))


async def _send_goal_question(to: str, lang: str) -> None:
    rows = [(oid, label, "") for oid, label in ob(lang, "goal_opts")]
    await send_list(to, header="Cosmoplex", body=ob(lang, "goal_q"),
                    button=ob(lang, "select_btn"), rows=rows, section_title=ob(lang, "select_btn"))


# ── "How the course works" walkthrough (shown once, right after signup) ────────
# A skippable, multi-step primer. Each step is one message with buttons; the
# button carries the NEXT step index (stateless — no stored progress needed).
HOWTO_STEPS = {
    "en": [
        "Here's how this works 👇\n\n📹 *Short video lessons* — about 2 minutes each, in your language. Watch anytime, anywhere.",
        "📝 *A quick quiz after every lesson* — just tap the right option. Clear it to unlock the next lesson.",
        "✍️ *Mini assignments* on some lessons — type or send a voice note, and I'll grade it instantly. And after any lesson, tap *❓ I have a doubt* to ask me anything you're unsure about. 💬",
        "🎁 *Bonus:* invite friends and earn *₹50* for each one who joins! Reply *refer* anytime to get your personal invite link.",
        "🎓 *Finish all lessons → earn your certificate.* That's the whole journey. Ready to start?",
    ],
    "hi": [
        "ये ऐसे काम करता है 👇\n\n📹 *छोटे video lessons* — हर एक करीब 2 मिनट का, आपकी भाषा में। कभी भी, कहीं भी देखें।",
        "📝 *हर lesson के बाद एक quick quiz* — बस सही option पर tap करें। पास करके अगला lesson unlock करें।",
        "✍️ *कुछ lessons में छोटे assignments* — type करें या voice note भेजें, मैं तुरंत grade कर दूँगा। और किसी भी lesson के बाद *❓ मुझे सवाल है* पर tap करके जो समझ न आए वो पूछें। 💬",
        "🎁 *बोनस:* दोस्तों को बुलाएँ और हर एक के जॉइन करने पर *₹50* कमाएँ! अपना invite link पाने के लिए कभी भी *refer* लिखें।",
        "🎓 *सारे lessons पूरे करें → अपना certificate पाएँ।* बस इतना ही सफर है। शुरू करें?",
    ],
    "mr": [
        "हे असं चालतं 👇\n\n📹 *छोटे video lessons* — प्रत्येक साधारण 2 मिनिटांचा, तुमच्या भाषेत. कधीही, कुठेही बघा.",
        "📝 *प्रत्येक lesson नंतर एक quick quiz* — फक्त योग्य option वर tap करा. पास करून पुढचा lesson unlock करा.",
        "✍️ *काही lessons मध्ये छोटे assignments* — type करा किंवा voice note पाठवा, मी लगेच grade करतो. आणि कोणत्याही lesson नंतर *❓ मला शंका आहे* वर tap करून न समजलेलं विचारा. 💬",
        "🎁 *बोनस:* मित्रांना बोलवा आणि प्रत्येक जॉइन झाल्यावर *₹50* कमवा! तुमचा invite link मिळवण्यासाठी कधीही *refer* लिहा.",
        "🎓 *सर्व lessons पूर्ण करा → तुमचं certificate मिळवा.* एवढाच प्रवास आहे. सुरू करूया?",
    ],
    "te": [
        "ఇది ఇలా పనిచేస్తుంది 👇\n\n📹 *చిన్న video lessons* — ఒక్కొక్కటి సుమారు 2 నిమిషాలు, మీ భాషలో. ఎప్పుడైనా, ఎక్కడైనా చూడండి.",
        "📝 *ప్రతి lesson తర్వాత ఒక quick quiz* — సరైన option పై tap చేయండి. పాస్ అయితే తదుపరి lesson unlock అవుతుంది.",
        "✍️ *కొన్ని lessonsలో చిన్న assignments* — type చేయండి లేదా voice note పంపండి, నేను వెంటనే grade చేస్తా. మరియు ఏదైనా lesson తర్వాత *❓ నాకు సందేహం ఉంది* పై tap చేసి తెలియనిది అడగండి. 💬",
        "🎁 *బోనస్:* స్నేహితులను ఆహ్వానించి, చేరిన ప్రతి ఒక్కరికీ *₹50* సంపాదించండి! మీ invite link పొందడానికి ఎప్పుడైనా *refer* అని పంపండి.",
        "🎓 *అన్ని lessons పూర్తి చేయండి → మీ certificate పొందండి.* ఇదే మొత్తం ప్రయాణం. మొదలుపెడదామా?",
    ],
    "ta": [
        "இது இப்படி வேலை செய்யும் 👇\n\n📹 *குறுகிய video lessons* — ஒவ்வொன்றும் சுமார் 2 நிமிடம், உங்கள் மொழியில். எப்போது வேண்டுமானாலும் பாருங்கள்.",
        "📝 *ஒவ்வொரு lesson-க்கும் பிறகு ஒரு quick quiz* — சரியான option-ஐ tap செய்யுங்கள். pass செய்தால் அடுத்த lesson unlock ஆகும்.",
        "✍️ *சில lessons-ல் சிறிய assignments* — type செய்யுங்கள் அல்லது voice note அனுப்புங்கள், நான் உடனே grade செய்கிறேன். மேலும் எந்த lesson-க்கும் பிறகு *❓ எனக்கு சந்தேகம்* tap செய்து புரியாததைக் கேளுங்கள். 💬",
        "🎁 *போனஸ்:* நண்பர்களை அழையுங்கள், சேரும் ஒவ்வொருவருக்கும் *₹50* சம்பாதியுங்கள்! உங்கள் invite link பெற எப்போது வேண்டுமானாலும் *refer* எனச் சொல்லுங்கள்.",
        "🎓 *எல்லா lessons-ஐயும் முடியுங்கள் → உங்கள் certificate பெறுங்கள்.* இதுதான் முழு பயணம். ஆரம்பிக்கலாமா?",
    ],
    "kn": [
        "ಇದು ಹೀಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ 👇\n\n📹 *ಚಿಕ್ಕ video lessons* — ಪ್ರತಿಯೊಂದೂ ಸುಮಾರು 2 ನಿಮಿಷ, ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ. ಯಾವಾಗ ಬೇಕಾದರೂ ನೋಡಿ.",
        "📝 *ಪ್ರತಿ lesson ನಂತರ ಒಂದು quick quiz* — ಸರಿಯಾದ option ಮೇಲೆ tap ಮಾಡಿ. ಪಾಸ್ ಆದರೆ ಮುಂದಿನ lesson unlock ಆಗುತ್ತದೆ.",
        "✍️ *ಕೆಲವು lessons ನಲ್ಲಿ ಚಿಕ್ಕ assignments* — type ಮಾಡಿ ಅಥವಾ voice note ಕಳುಹಿಸಿ, ನಾನು ತಕ್ಷಣ grade ಮಾಡ್ತೀನಿ. ಮತ್ತು ಯಾವುದೇ lesson ನಂತರ *❓ ನನಗೆ ಸಂದೇಹವಿದೆ* tap ಮಾಡಿ ಗೊತ್ತಾಗದಿರುವುದನ್ನು ಕೇಳಿ. 💬",
        "🎁 *ಬೋನಸ್:* ಸ್ನೇಹಿತರನ್ನು ಆಹ್ವಾನಿಸಿ, ಸೇರುವ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ *₹50* ಗಳಿಸಿ! ನಿಮ್ಮ invite link ಪಡೆಯಲು ಯಾವಾಗ ಬೇಕಾದರೂ *refer* ಎಂದು ಕಳುಹಿಸಿ.",
        "🎓 *ಎಲ್ಲಾ lessons ಮುಗಿಸಿ → ನಿಮ್ಮ certificate ಪಡೆಯಿರಿ.* ಇಷ್ಟೇ ಪೂರ್ತಿ ಪ್ರಯಾಣ. ಶುರುಮಾಡೋಣ್ವಾ?",
    ],
}
HOWTO_NEXT = {"en": "Next ▶️", "hi": "आगे ▶️", "mr": "पुढे ▶️", "te": "తదుపరి ▶️", "ta": "அடுத்து ▶️", "kn": "ಮುಂದೆ ▶️"}
HOWTO_SKIP = {"en": "Skip Tutorial ⏭️", "hi": "Tutorial छोड़ें ⏭️", "mr": "Tutorial वगळा ⏭️", "te": "Tutorial దాటు ⏭️", "ta": "Tutorial தவிர் ⏭️", "kn": "Tutorial ಬಿಡಿ ⏭️"}
HOWTO_START = {"en": "Let's start 🚀", "hi": "चलिए शुरू करें 🚀", "mr": "चला सुरू करूया 🚀", "te": "మొదలుపెడదాం 🚀", "ta": "ஆரம்பிக்கலாம் 🚀", "kn": "ಶುರುಮಾಡೋಣ 🚀"}


async def _send_howto_step(to: str, lang: str, idx: int) -> None:
    """Send one walkthrough step. Middle steps get Next+Skip; the last gets a
    single 'Let's start' (reuses reply_id 'start_lesson' → delivers lesson 1)."""
    steps = HOWTO_STEPS.get(lang, HOWTO_STEPS["en"])
    idx = max(0, min(idx, len(steps) - 1))
    if idx < len(steps) - 1:
        buttons = [(f"howto_{idx + 1}", HOWTO_NEXT.get(lang, HOWTO_NEXT["en"])),
                   ("howto_skip", HOWTO_SKIP.get(lang, HOWTO_SKIP["en"]))]
    else:
        buttons = [("start_lesson", HOWTO_START.get(lang, HOWTO_START["en"]))]
    await send_buttons(to, steps[idx], buttons)


async def _intro_video_for(db, lang: str) -> str:
    """Intro video for this language, from the admin-managed DB. A specific
    language row wins over 'default'; falls back to the built-in intro if the
    admin hasn't set one."""
    res = await db.execute(select(IntroVideo).where(IntroVideo.language.in_([lang, "default"])))
    rows = {iv.language: iv.cloudinary_public_id for iv in res.scalars().all()}
    return rows.get(lang) or rows.get("default") or intro_video_for(lang)


async def _begin_onboarding(db, session, frm: str, lang: str) -> None:
    """Greeting + brief + intro video, then the first profile question."""
    session.stage = "welcome"
    await db.commit()
    await send_text(frm, ob(lang, "brief").format(name=session.name or "friend"))
    intro_id = await _intro_video_for(db, lang)
    if intro_id:
        await send_video(frm, intro_id, ob(lang, "intro_caption"))
    await _send_profile_question(frm, lang)
    session.stage = "ask_profile"
    await db.commit()


# ── DB-backed course (single source of truth, shared with the web + admin) ──────
# WhatsApp used to serve a hardcoded lesson; now it reads the same course tree the
# web platform and admin portal use, so uploads/edits in the admin portal reflect
# on both surfaces and Lesson N is the same lesson everywhere.

def _variant_public_id(video: Video, lang: str) -> str | None:
    """Cloudinary ID for a lang. Same priority as course_routes._pick_cloudinary_id:
    exact language → 'en' → base video field."""
    by_lang = {v.language: v.cloudinary_public_id for v in (video.language_variants or [])}
    return by_lang.get(lang) or by_lang.get("en") or video.cloudinary_public_id


async def _db_lessons(db, lang: str) -> list[dict]:
    """Ordered playable lessons from the DB — the same course the web serves,
    in the same order (module → section → video, all by order_index).
    Only lessons that actually have an uploaded video for this learner are
    included, so nobody gets an empty 'coming soon' lesson over chat."""
    res = await db.execute(
        select(Course).order_by(Course.created_at).options(
            selectinload(Course.modules)
            .selectinload(CourseModule.sections)
            .selectinload(Section.videos)
            .selectinload(Video.language_variants)
        )
    )
    course = res.scalars().first()
    if not course:
        return []
    lessons: list[dict] = []
    for module in course.modules:            # relationships already order_by order_index
        for section in module.sections:
            for video in section.videos:
                cloud_id = _variant_public_id(video, lang)
                if cloud_id:
                    lessons.append({"video_id": video.id, "title": video.title,
                                    "cloud_id": cloud_id,
                                    "label": f"{module.order_index + 1}.{section.order_index + 1}",
                                    "module_id": module.id,
                                    "module_title": module.title, "content_doc": module.content_doc})
    if not lessons:
        # DB not populated in this environment — fall back to the built-in lesson
        # so the flow never dead-ends. (video_id=None → quiz/assignment fall back too.)
        base = LESSON_VIDEOS[0]
        cloud_id = base.get(lang) or base.get("en")
        if cloud_id:
            lessons.append({"video_id": None,
                            "title": "The 10 AI Words Every Fresher Must Know",
                            "cloud_id": cloud_id, "module_id": None,
                            "module_title": None, "content_doc": None})
    return lessons


async def _lesson_at(db, lang: str, idx: int) -> dict | None:
    lessons = await _db_lessons(db, lang)
    return lessons[idx] if 0 <= idx < len(lessons) else None


# Test accounts (see TEST_PHONES) can jump straight to a lesson by messaging
# "lesson 2.3" / "2.3" — handy for QA without playing through the whole course.
TEST_PHONES = {"919482593764"}


async def _jump_index(db, lang: str, mod: int, sec: int) -> int | None:
    """Index in the language's playable list for lesson 'mod.sec', or None if that
    lesson has no video in this language (so it isn't in the list)."""
    label = f"{mod}.{sec}"
    lessons = await _db_lessons(db, lang)
    for i, lesson in enumerate(lessons):
        if lesson.get("label") == label:
            return i
    return None


QUIZ_PER_ATTEMPT = 5   # how many questions we ask per quiz


async def _all_quiz(db, video_id: str | None) -> list[dict]:
    """The lesson's FULL quiz bank (all 20), each with a stable id. Falls back to
    the built-in quiz for lessons whose bank hasn't been filled in yet."""
    if video_id:
        res = await db.execute(
            select(QuizQuestion).where(QuizQuestion.video_id == video_id)
            .order_by(QuizQuestion.order_index, QuizQuestion.created_at)
        )
        rows = res.scalars().all()
        if rows:
            return [{"id": r.id, "q": r.question, "opts": r.options, "correct": r.correct_index}
                    for r in rows]
    return [{"id": f"builtin-{i}", "q": it["q"], "opts": it["opts"], "correct": it["correct"]}
            for i, it in enumerate(QUIZ)]


async def _select_quiz(db, session, video_id: str | None) -> list[dict]:
    """Pick a fresh random set of questions the learner hasn't seen this lesson.
    When the pool is exhausted, reset and start over. Stores the picked set on the
    session so the multi-message flow stays consistent, and records them as seen."""
    bank = await _all_quiz(db, video_id)
    seen = set(json.loads(session.quiz_seen or "[]"))
    pool = [q for q in bank if q["id"] not in seen]
    if len(pool) < QUIZ_PER_ATTEMPT:      # not enough fresh ones left → start the pool over
        seen = set()
        pool = bank
    picked = random.sample(pool, min(QUIZ_PER_ATTEMPT, len(pool)))
    session.quiz_seen = json.dumps(list(seen | {q["id"] for q in picked}))
    session.quiz_current = json.dumps(picked)
    return picked


def _current_quiz(session) -> list[dict]:
    """The set chosen for the current attempt (stored on the session)."""
    try:
        return json.loads(session.quiz_current or "[]")
    except (json.JSONDecodeError, TypeError):
        return []


async def _assignment_for(db, video_id: str | None) -> dict:
    """This lesson's assignment from the DB bank (first by order_index — stable
    between showing it and grading it). Falls back to the built-in assignment."""
    if video_id:
        res = await db.execute(
            select(AssignmentPrompt).where(AssignmentPrompt.video_id == video_id)
            .order_by(AssignmentPrompt.order_index, AssignmentPrompt.created_at)
        )
        row = res.scalars().first()
        if row:
            return {"question": row.question, "rubric": row.rubric}
    return {"question": ASSIGNMENT["question"], "rubric": ASSIGNMENT["rubric"]}


def _lesson_caption(lang: str, title: str) -> str:
    """Localized 'watch then tap Start quiz' instruction with the lesson title."""
    full = tr(lang, "lesson_caption")
    instr = full.split("\n\n", 1)[1] if "\n\n" in full else full
    return f"📚 {title}\n\n{instr}"


async def _translate_title(text: str, lang: str) -> str:
    """Translate a short lesson title into the learner's language (Haiku)."""
    text = (text or "").strip()
    if lang == "en" or not text:
        return text
    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        msg = await client.messages.create(
            model="claude-haiku-4-5", max_tokens=120,
            messages=[{"role": "user", "content": (
                f"Translate this course lesson title into {LANG_NAME.get(lang, 'English')}. "
                "Keep technical AI terms recognizable. Return ONLY the translated title — "
                f"no quotes, no extra text.\n\n{text}")}],
        )
        return (msg.content[0].text or "").strip() or text
    except Exception as e:
        print(f"⚠ title translate error: {e}")
        return text


async def _localized_title(db, video_id: str | None, english_title: str, lang: str) -> str:
    """Lesson title in the learner's language. Uses the stored per-language title
    if present; otherwise translates once and caches it on the language variant."""
    if lang == "en" or not video_id:
        return english_title
    res = await db.execute(
        select(VideoLanguageVariant).where(
            VideoLanguageVariant.video_id == video_id,
            VideoLanguageVariant.language == lang,
        )
    )
    variant = res.scalar_one_or_none()
    if variant is None:            # no localized video for this lang → keep English
        return english_title
    if variant.title:
        return variant.title
    translated = await _translate_title(english_title, lang)
    if translated and translated != english_title:
        variant.title = translated
        await db.commit()
    return translated


async def _send_lesson(db, to: str, lang: str, name: str = "friend", idx: int = 0) -> None:
    lesson = await _lesson_at(db, lang, idx)
    if lesson is None:
        await send_text(to, tr(lang, "no_more"))
        return
    title = await _localized_title(db, lesson["video_id"], lesson["title"], lang)
    await send_video(to, lesson["cloud_id"], _lesson_caption(lang, title))
    # A video takes a moment to transcode/render on the phone; a text sent right
    # after would appear ABOVE it. Pause so the video lands first, then the
    # "Start quiz" prompt.
    await asyncio.sleep(LESSON_BUTTON_DELAY_SEC)
    await send_buttons(to, tr(lang, "after_text").format(name=name),
                       [("quiz", tr(lang, "quiz_btn")),
                        ("quiz_lang", QLANG_BTN.get(lang, QLANG_BTN["en"])),
                        ("course_lang", CLANG_BTN.get(lang, CLANG_BTN["en"]))])


def _reset_quiz_state(session) -> None:
    """Clear per-lesson quiz progress + the no-repeat 'seen' pool (new lesson)."""
    session.quiz_index = 0
    session.quiz_correct = 0
    session.quiz_current = None
    session.quiz_seen = None


# "Skip for now" button labels (≤20 chars per WhatsApp) for the OPTIONAL assignment
# shown on non-last microlessons. All six languages (never English-only).
SKIP_BTN = {
    "en": "Skip for now",
    "hi": "अभी छोड़ें",
    "mr": "आत्ता वगळा",
    "te": "ఇప్పటికి వదిలేయ్",
    "ta": "இப்போதைக்கு தவிர்",
    "kn": "ಸದ್ಯಕ್ಕೆ ಬಿಡಿ",
}


def _is_last_in_module(lessons: list[dict], idx: int) -> bool:
    """True if lessons[idx] is the LAST microlesson of its module (the next lesson
    belongs to a different module, or it's the final lesson). The assignment is
    compulsory here; optional on every other microlesson."""
    if idx < 0 or idx >= len(lessons):
        return False
    if idx == len(lessons) - 1:
        return True
    return lessons[idx].get("module_id") != lessons[idx + 1].get("module_id")


async def _advance_lesson(db, session, frm: str, lang: str, nm: str) -> bool:
    """After finishing the current lesson, move to the next and auto-deliver it.
    Returns True if a next lesson was sent, False if the course is complete."""
    lessons = await _db_lessons(db, lang)
    cur = session.lesson_index or 0
    if cur + 1 < len(lessons):
        session.lesson_index = cur + 1
        _reset_quiz_state(session)          # fresh quiz pool for the new lesson
        session.stage = "lesson"
        await db.commit()
        await send_text(frm, tr(lang, "next_prompt").format(name=nm))
        await _send_lesson(db, frm, lang, nm, cur + 1)
        return True
    session.stage = "done"
    await db.commit()
    await send_text(frm, tr(lang, "done").format(name=nm))
    return False


async def _send_between_choice(db, session, frm: str, lang: str, nm: str) -> None:
    """The post-lesson menu: continue to the next lesson, practice another quiz
    (a fresh non-repeating set), or ask a doubt."""
    lessons = await _db_lessons(db, lang)
    cur = session.lesson_index or 0
    if cur + 1 < len(lessons):
        nxt = lessons[cur + 1]
        nxt_title = await _localized_title(db, nxt["video_id"], nxt["title"], lang)
        session.stage = "between_lessons"
        await db.commit()
        await send_buttons(
            frm, tr(lang, "next_choice").format(name=nm, title=nxt_title) + REFER_HINT.get(lang, REFER_HINT["en"]),
            [("next_lesson", tr(lang, "start_next_btn")),
             ("practice_quiz", tr(lang, "practice_btn")),
             ("ask_doubt", tr(lang, "doubt_btn"))],
        )
    else:
        session.stage = "done"
        await db.commit()
        await send_buttons(
            frm, tr(lang, "done_choice").format(name=nm),
            [("practice_quiz", tr(lang, "practice_btn")),
             ("get_referral", INVITE_BTN.get(lang, INVITE_BTN["en"])),
             ("ask_doubt", tr(lang, "doubt_btn"))],
        )


async def _teacher_answer(db, session, frm: str, lang: str, text: str | None) -> None:
    """Answer a free-text question via the Teacher agent, scoped to exactly what
    this learner has actually completed (admin-uploaded module content docs)."""
    if is_abusive(text):
        await send_text(frm, tr(lang, "abusive_input"))
        return
    if not allow_ai_call():
        await send_text(frm, tr(lang, "ai_busy"))
        return

    lessons = await _db_lessons(db, lang)
    idx = session.lesson_index or 0
    # Between lessons / just finished the course → the current lesson itself is done too.
    current_lesson_done = session.stage in ("between_lessons", "clarify", "done")
    completed_up_to = min(idx + 1 if current_lesson_done else idx, len(lessons))
    completed_ids = {l["video_id"] for l in lessons[:completed_up_to] if l["video_id"]}
    ctx = build_teacher_context(lessons, lambda l: l["video_id"] in completed_ids)

    state = LearnerState(
        learner_id=f"wa:{frm}",
        name=session.name or "there",
        language=lang,
        current_module_id="m1",
        messages=[{"role": "user", "content": text or ""}],
        last_agent="teacher",
        use_real_knowledge=True,
        knowledge_text=ctx["knowledge_text"],
        not_yet_covered=ctx["not_yet_covered"],
    )
    reply = await run_teacher(state, text or "")
    await send_text(frm, reply)


def _shuffle_options(item: dict, phone: str, qidx: int) -> dict:
    """Reorder a question's options so the correct answer isn't always in the same
    slot. The shuffle is DETERMINISTIC per (learner, question) — seeded with a
    stable hash — so the order shown matches the order used when grading, even
    across separate webhook calls / server processes."""
    en_opts = item["opts"].get("en") or []
    n = len(en_opts)
    if n < 2:
        return item
    seed = int(hashlib.md5(f"{phone}:{qidx}".encode()).hexdigest(), 16)
    order = list(range(n))
    random.Random(seed).shuffle(order)
    new_opts = {lg: [o[i] for i in order] for lg, o in item["opts"].items()
                if isinstance(o, list) and len(o) == n}
    try:
        new_correct = order.index(int(item["correct"]))
    except (ValueError, TypeError):
        new_correct = 0
    return {"q": item["q"], "opts": new_opts, "correct": new_correct}


async def _send_quiz_question(to: str, lang: str, qidx: int, items: list[dict]) -> None:
    if qidx >= len(items):
        return
    item = _shuffle_options(items[qidx], to, qidx)
    q = item["q"].get(lang, item["q"]["en"])
    opts = item["opts"].get(lang, item["opts"]["en"])
    numbered = "\n".join(f"{NUM_EMOJI[i]} {opt}" for i, opt in enumerate(opts))
    body = f"{tr(lang, 'quiz_progress').format(n=qidx + 1)}\n\n{q}\n\n{numbered}"
    rows = [(f"ans_{i}", NUM_EMOJI[i], opts[i]) for i in range(len(opts))]
    await send_list(to, header="Quiz", body=body, button=tr(lang, "answer_btn"),
                    rows=rows, section_title=tr(lang, "answer_btn"))


async def _send_assignment(to: str, lang: str, assignment: dict, skippable: bool = False) -> None:
    q = assignment["question"].get(lang, assignment["question"]["en"])
    buttons = [("submit_assignment", tr(lang, "submit_btn"))]
    if skippable:   # optional assignment (non-last microlesson) → offer to skip
        buttons.append(("skip_assignment", SKIP_BTN.get(lang, SKIP_BTN["en"])))
    await send_buttons(to, tr(lang, "assignment_intro").format(q=q), buttons)


# Free-typed language names → code, so "english" / "i want tamil" switches too.
LANG_KEYWORDS = {
    "english": "en", "इंग्लिश": "en", "अंग्रेजी": "en", "angrezi": "en", "इंग्रजी": "en",
    "hindi": "hi", "हिंदी": "hi", "हिन्दी": "hi",
    "marathi": "mr", "मराठी": "mr",
    "telugu": "te", "తెలుగు": "te", "telgu": "te",
    "tamil": "ta", "தமிழ்": "ta", "tamizh": "ta",
    "kannada": "kn", "ಕನ್ನಡ": "kn", "kanada": "kn",
}


def _detect_language(text: str | None) -> str | None:
    """Return a language code if a short message names a language."""
    if not text:
        return None
    low = text.strip().lower()
    if len(low.split()) > 5:  # long → likely a real question, not a switch
        return None
    for kw, code in LANG_KEYWORDS.items():
        if kw in low:
            return code
    return None


async def _current_video_id(db, session, lang: str) -> str | None:
    lesson = await _lesson_at(db, lang, session.lesson_index or 0)
    return lesson["video_id"] if lesson else None


async def _resume_stage(db, session, frm: str, lang: str) -> None:
    """Re-render the learner's current step in the (possibly new) language."""
    st = session.stage
    if st in ("quiz", "practice"):
        await db.commit()
        await _send_quiz_question(frm, lang, session.quiz_index or 0, _current_quiz(session))
    elif st == "assignment":
        await db.commit()
        vid = await _current_video_id(db, session, lang)
        assignment = await _assignment_for(db, vid)
        await _send_assignment(frm, lang, assignment)
    else:
        session.stage = "lesson"
        await db.commit()
        await _send_lesson(db, frm, lang, session.name or "friend", session.lesson_index or 0)


async def _rerender_quiz_step(db, session, frm: str, lang: str, qlang: str) -> None:
    """After a quiz-language switch, re-show the current quiz/assignment step in
    `qlang` WITHOUT changing stage or touching the video/lesson. If they're still
    on the lesson video (haven't started the quiz), just re-offer the buttons."""
    st = session.stage
    if st in ("quiz", "practice"):
        await _send_quiz_question(frm, qlang, session.quiz_index or 0, _current_quiz(session))
    elif st == "assignment":
        vid = await _current_video_id(db, session, lang)   # video_id is language-independent
        assignment = await _assignment_for(db, vid)
        if assignment:
            lessons = await _db_lessons(db, lang)
            skippable = not _is_last_in_module(lessons, session.lesson_index or 0)
            await _send_assignment(frm, qlang, assignment, skippable=skippable)
    else:
        # On the lesson video (pre-quiz) → re-offer Start-quiz + Quiz/Course language.
        nm = (session.name or "").strip() or "friend"
        await send_buttons(frm, tr(lang, "after_text").format(name=nm),
                           [("quiz", tr(lang, "quiz_btn")),
                            ("quiz_lang", QLANG_BTN.get(lang, QLANG_BTN["en"])),
                            ("course_lang", CLANG_BTN.get(lang, CLANG_BTN["en"]))])


async def _start_quiz(db, session, frm: str, lang: str, practice: bool = False) -> None:
    session.stage = "practice" if practice else "quiz"
    session.quiz_index = 0
    session.quiz_correct = 0
    vid = await _current_video_id(db, session, lang)   # video_id is language-independent
    items = await _select_quiz(db, session, vid)   # fresh non-repeating random set
    await db.commit()
    await _send_quiz_question(frm, _qlang(session), 0, items)   # render in the quiz language


# ── Referral program ────────────────────────────────────────────────────────
# Codes use the no-ambiguous-character alphabet from core/referrals.py.
def _extract_ref_code(text: str | None) -> str | None:
    """Pull a referral code from a first message like 'JOIN ABCD2345' or a bare code."""
    if not text:
        return None
    t = text.strip().upper()
    m = re.match(r"^(?:JOIN|REF|REFER|REFERRAL)\s+([A-HJ-NP-Z2-9]{8})$", t)
    if m:
        return m.group(1)
    return t if re.fullmatch(r"[A-HJ-NP-Z2-9]{8}", t) else None

REFERRAL_MSG = {
    "en": "🎁 Invite friends & earn ₹{reward} each!\n⚠️ You get ₹{reward} *only when your friend signs up and pays* for the course.\nYour code: *{code}*\nSo far: {paid} paid, ₹{earned} earned.\nShare 👇",
    "hi": "🎁 दोस्तों को बुलाएँ और हर एक पर ₹{reward} कमाएँ!\n⚠️ ₹{reward} तभी मिलेंगे *जब आपका दोस्त साइन अप करके कोर्स का payment करे*।\nआपका कोड: *{code}*\nअब तक: {paid} ने payment किया, ₹{earned} कमाए।\nशेयर करें 👇",
    "mr": "🎁 मित्रांना आमंत्रित करा, प्रत्येकी ₹{reward} कमवा!\n⚠️ ₹{reward} तेव्हाच मिळतील *जेव्हा तुमचा मित्र साइन अप करून कोर्सचे payment करेल*.\nतुमचा कोड: *{code}*\nआतापर्यंत: {paid} ने payment केले, ₹{earned} कमावले.\nशेअर करा 👇",
    "te": "🎁 స్నేహితులను ఆహ్వానించి ఒక్కొక్కరికి ₹{reward} సంపాదించండి!\n⚠️ మీ స్నేహితుడు *సైన్ అప్ చేసి కోర్సుకు payment చేసినప్పుడే* ₹{reward} వస్తాయి.\nమీ కోడ్: *{code}*\nఇప్పటివరకు: {paid} payment చేశారు, ₹{earned} సంపాదించారు.\nషేర్ చేయండి 👇",
    "ta": "🎁 நண்பர்களை அழைத்து ஒவ்வொருவருக்கும் ₹{reward} சம்பாதியுங்கள்!\n⚠️ உங்கள் நண்பர் *பதிவு செய்து பாடத்திற்குப் பணம் செலுத்தினால் மட்டுமே* ₹{reward} கிடைக்கும்.\nஉங்கள் குறியீடு: *{code}*\nஇதுவரை: {paid} பணம் செலுத்தினர், ₹{earned} சம்பாதித்தீர்கள்.\nபகிருங்கள் 👇",
    "kn": "🎁 ಸ್ನೇಹಿತರನ್ನು ಆಹ್ವಾನಿಸಿ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ₹{reward} ಗಳಿಸಿ!\n⚠️ ನಿಮ್ಮ ಸ್ನೇಹಿತ *ಸೈನ್ ಅಪ್ ಮಾಡಿ ಕೋರ್ಸ್‌ಗೆ payment ಮಾಡಿದಾಗ ಮಾತ್ರ* ₹{reward} ಸಿಗುತ್ತದೆ.\nನಿಮ್ಮ ಕೋಡ್: *{code}*\nಇಲ್ಲಿಯವರೆಗೆ: {paid} payment ಮಾಡಿದ್ದಾರೆ, ₹{earned} ಗಳಿಸಿದ್ದೀರಿ.\nಹಂಚಿಕೊಳ್ಳಿ 👇",
}

# Sent to the REFERRER when their code lands a signup.
REFERRAL_SUCCESS = {
    "en": "🎉 {name} just joined using your code! You've earned ₹{reward}. Total earned: ₹{earned}. 🙌",
    "hi": "🎉 {name} ने आपके कोड से जॉइन किया! आपने ₹{reward} कमाए। कुल कमाई: ₹{earned}। 🙌",
    "mr": "🎉 {name} ने तुमच्या कोडने जॉइन केले! तुम्ही ₹{reward} कमावले. एकूण कमाई: ₹{earned}. 🙌",
    "te": "🎉 {name} మీ కోడ్‌తో చేరారు! మీరు ₹{reward} సంపాదించారు. మొత్తం సంపాదన: ₹{earned}. 🙌",
    "ta": "🎉 {name} உங்கள் குறியீட்டில் இணைந்தார்! நீங்கள் ₹{reward} சம்பாதித்தீர்கள். மொத்தம்: ₹{earned}. 🙌",
    "kn": "🎉 {name} ನಿಮ್ಮ ಕೋಡ್‌ನಿಂದ ಸೇರಿದ್ದಾರೆ! ನೀವು ₹{reward} ಗಳಿಸಿದ್ದೀರಿ. ಒಟ್ಟು: ₹{earned}. 🙌",
}

# One-line nudge appended after a lesson so learners discover the program.
REFER_HINT = {
    "en": "\n\n🎁 Invite friends & earn ₹50 each — reply *refer*.",
    "hi": "\n\n🎁 दोस्तों को बुलाएँ, हर एक पर ₹50 — *refer* लिखें.",
    "mr": "\n\n🎁 मित्रांना बोलवा, प्रत्येकी ₹50 — *refer* लिहा.",
    "te": "\n\n🎁 స్నేహితులను ఆహ్వానించండి, ఒక్కొక్కరికి ₹50 — *refer* అని పంపండి.",
    "ta": "\n\n🎁 நண்பர்களை அழையுங்கள், தலா ₹50 — *refer* எனச் சொல்லுங்கள்.",
    "kn": "\n\n🎁 ಸ್ನೇಹಿತರನ್ನು ಆಹ್ವಾನಿಸಿ, ತಲಾ ₹50 — *refer* ಎಂದು ಕಳುಹಿಸಿ.",
}
# Reply-button label (≤20 chars) for the course-complete screen.
INVITE_BTN = {
    "en": "Invite & earn ₹50", "hi": "बुलाएँ, ₹50 पाएँ", "mr": "बोलवा, ₹50 मिळवा",
    "te": "ఆహ్వానించి ₹50", "ta": "அழைத்து ₹50 பெறு", "kn": "ಆಹ್ವಾನಿಸಿ ₹50 ಪಡೆ",
}

async def _send_referral_info(db, session, frm: str) -> None:
    from core.referrals import get_or_create_wa_code, referral_stats
    lang = session.language or "en"
    code = await get_or_create_wa_code(db, session)
    stats = await referral_stats(db, "whatsapp", session.phone)
    msg = REFERRAL_MSG.get(lang, REFERRAL_MSG["en"]).format(
        reward=settings.referral_reward_rupees, code=code,
        paid=stats["paid"], earned=stats["earned"])
    # Only the wa.me link for now — it opens WhatsApp with JOIN pre-filled and
    # actually credits the referrer. (The web ?ref= link returns once web signup
    # attribution is built.)
    num = settings.whatsapp_business_number
    if num:
        msg += f"\nhttps://wa.me/{num}?text=JOIN%20{code}"
    await send_text(frm, msg)


# ── Main handler ──────────────────────────────────────────────────────────────
async def _handle_message(frm: str, reply_id: str | None, text: str | None, name: str | None) -> None:
    async with async_session_factory() as db:
        session = await db.get(WhatsAppSession, frm)
        if session is None:
            session = WhatsAppSession(phone=frm, stage="new")
            db.add(session)
        if name and not session.name:
            session.name = name
        session.last_active_at = datetime.utcnow()  # for the drip engine's idle check

        low = (text or "").strip().lower()

        # First contact via a referral link/code ("JOIN ABCD2345") — stash it; it's
        # attributed once they finish signing up (provide their name).
        if session.stage == "new" and not session.language and not session.referred_by_code:
            ref_code = _extract_ref_code(text)
            if ref_code:
                session.referred_by_code = ref_code

        # "refer" / "invite" → the learner's own code + share link
        if reply_id is None and low in ("refer", "referral", "invite", "refer a friend", "my code"):
            await _send_referral_info(db, session, frm)
            return

        # Explicit reset → back to the language picker, fresh state
        if reply_id is None and low in ("restart", "reset", "start over", "restart course"):
            session.language = None
            session.stage = "new"
            session.quiz_index = 0
            session.quiz_correct = 0
            await db.commit()
            await _send_language_picker(frm)
            return

        # (Test accounts only) "lesson 2.3" / "2.3" → jump straight to that lesson,
        # so QA can spot-check any lesson without playing through the course.
        if frm in TEST_PHONES and reply_id is None:
            mj = re.match(r"^(?:lesson\s*)?(\d+)\.(\d+)$", low)
            if mj:
                lang = session.language or "en"
                idx = await _jump_index(db, lang, int(mj.group(1)), int(mj.group(2)))
                if idx is not None:
                    session.language = lang
                    session.stage = "lesson"
                    session.lesson_index = idx
                    _reset_quiz_state(session)
                    if not session.name:
                        session.name = name or "friend"
                    await db.commit()
                    await _send_lesson(db, frm, lang, session.name or "friend", idx)
                else:
                    await db.commit()
                    await send_text(frm, f"(test) Lesson {mj.group(1)}.{mj.group(2)} has no "
                                         f"{lang} video, so it isn't in the playable list.")
                return

        # Language selection from the list → ask the learner's name next
        if reply_id and reply_id.startswith("lang_"):
            lang = reply_id.split("_", 1)[1]
            if lang in LANGS:
                session.language = lang
                session.stage = "ask_name"
                await db.commit()
                await send_text(frm, ob(lang, "name_q"))
                return

        # Typed a language name ("english", "i want tamil") → switch + resume.
        # Skipped where free text is expected as an answer.
        if reply_id is None and session.stage not in ("assignment", "ask_profile", "ask_goal", "ask_name"):
            detected = _detect_language(text)
            if detected:
                session.language = detected
                await send_text(frm, tr(detected, "picker_done"))
                await _resume_stage(db, session, frm, detected)
                return

        # No language yet → show picker
        if not session.language:
            await db.commit()
            await _send_language_picker(frm)
            return

        lang = session.language
        qlang = session.quiz_language or lang    # quiz + assignment language (override)
        nm = (session.name or "").strip() or "friend"

        # "Language" typed command → re-show the full-course picker (changes everything)
        if reply_id == "menu" or low in ("menu", "language", "lang", "change language", "भाषा", "மொழி", "ಭಾಷೆ", "భాష"):
            await db.commit()
            await _send_language_picker(frm)
            return

        # "Quiz language" button → picker that switches ONLY quiz + assignment
        if reply_id == "quiz_lang":
            await db.commit()
            await _send_quiz_language_picker(frm, lang)
            return

        # A quiz-language pick (qlang_XX) → set the override, confirm, re-render the
        # current quiz/assignment step in the new language. Never touches onboarding.
        if reply_id and reply_id.startswith("qlang_"):
            chosen = reply_id.split("_", 1)[1]
            if chosen in LANGS:
                session.quiz_language = chosen
                await db.commit()
                await send_text(frm, QLANG_SET.get(lang, QLANG_SET["en"]).format(
                    label=LANGS[chosen].split(" (")[0]))
                await _rerender_quiz_step(db, session, frm, lang, chosen)
            return

        # "Course language" button → warn + picker (changes EVERYTHING).
        if reply_id == "course_lang":
            await db.commit()
            await _send_course_language_picker(frm, lang)
            return

        # A course-language pick (clang_XX) → ask: restart from the beginning, or
        # resume the current lesson, both in the new language.
        if reply_id and reply_id.startswith("clang_"):
            chosen = reply_id.split("_", 1)[1]
            if chosen in LANGS:
                await db.commit()
                await send_buttons(
                    frm, CLANG_APPLY_PROMPT.get(lang, CLANG_APPLY_PROMPT["en"]).format(
                        label=LANGS[chosen].split(" (")[0]),
                    [(f"cset_restart_{chosen}", CLANG_RESTART_BTN.get(lang, CLANG_RESTART_BTN["en"])),
                     (f"cset_resume_{chosen}", CLANG_RESUME_BTN.get(lang, CLANG_RESUME_BTN["en"]))])
            return

        # Apply the course-language switch (cset_restart_XX / cset_resume_XX).
        if reply_id and reply_id.startswith("cset_"):
            parts = reply_id.split("_")   # ["cset", "restart"|"resume", "<lang>"]
            mode = parts[1] if len(parts) > 1 else ""
            newlang = parts[2] if len(parts) > 2 else ""
            if newlang in LANGS and mode in ("restart", "resume"):
                session.language = newlang
                session.quiz_language = None   # whole course is now newlang
                if mode == "restart":
                    session.lesson_index = 0
                    _reset_quiz_state(session)
                    session.assignment_draft = None
                else:  # resume — clamp the index to the new language's lesson count
                    lessons = await _db_lessons(db, newlang)
                    session.lesson_index = min(session.lesson_index or 0, max(0, len(lessons) - 1))
                session.stage = "lesson"
                await db.commit()
                nm2 = (session.name or "").strip() or "friend"
                await send_text(frm, tr(newlang, "picker_done"))
                await _send_lesson(db, frm, newlang, nm2, session.lesson_index or 0)
            return

        # Onboarding: capture the learner's name → then begin the funnel
        if session.stage == "ask_name":
            candidate = (text or "").strip()
            if not candidate:
                await db.commit()
                await send_text(frm, ob(lang, "name_q"))
                return
            session.name = candidate[:40]
            # Signed up → credit the referrer (if they arrived via a code). Demo payout.
            if session.referred_by_code:
                from core.referrals import attribute_signup
                await attribute_signup(db, session.referred_by_code, "whatsapp", frm)
            await db.commit()
            await _begin_onboarding(db, session, frm, lang)
            return

        # ── Onboarding: profile question answered ────────────────────────────
        if session.stage == "ask_profile":
            status, label = None, None
            if reply_id in STATUS_MAP:
                status = STATUS_MAP[reply_id]
                label = STATUS_PITCH[status]
            elif text and reply_id is None:
                status = text.strip()[:50]
                label = status
            if not status:
                await db.commit()
                await _send_profile_question(frm, lang)
                return
            session.current_status = status
            await db.commit()
            # Personalized "why this course is for you", then ask their goal
            pitch = await generate_pitch(lang, label, nm) if allow_ai_call() else ""
            if pitch:
                await send_text(frm, pitch)
            await _send_goal_question(frm, lang)
            session.stage = "ask_goal"
            await db.commit()
            return

        # ── Onboarding: goal answered → save everything, offer the free lesson ─
        if session.stage == "ask_goal":
            goal = GOAL_MAP.get(reply_id) if reply_id in GOAL_MAP else (text or "").strip()
            if not goal:
                await db.commit()
                await _send_goal_question(frm, lang)
                return
            session.goal = goal[:1000]
            session.stage = "onboarded"
            await db.commit()
            print(f"✓ WhatsApp onboarded {frm}: lang={lang} status={session.current_status} goal={goal[:60]!r}")
            await send_text(frm, ob(lang, "saved").format(name=nm))
            await send_text(frm, ob(lang, "free_offer").format(name=nm))
            await send_buttons(frm, ob(lang, "signup_prompt").format(name=nm),
                               [("signup", ob(lang, "signup_btn"))])
            return

        # Sign-up: tapped "Sign up" → reconfirm their WhatsApp number
        if reply_id == "signup":
            await db.commit()
            number = "+" + frm
            await send_buttons(frm, ob(lang, "confirm_number").format(number=number),
                               [("confirm_number", ob(lang, "confirm_btn"))])
            return

        # Sign-up: number confirmed → run the "how the course works" walkthrough,
        # which ends in a "Let's start" button that launches lesson 1.
        if reply_id == "confirm_number":
            session.stage = "howto"
            await db.commit()
            await _send_howto_step(frm, lang, 0)
            return

        # "How it works" walkthrough navigation (skippable, stateless via reply_id).
        if reply_id and reply_id.startswith("howto_"):
            if reply_id == "howto_skip":
                session.stage = "lesson"
                await db.commit()
                await _send_lesson(db, frm, lang, nm, session.lesson_index or 0)
                return
            try:
                idx = int(reply_id.split("_", 1)[1])
            except ValueError:
                idx = 0
            await db.commit()
            await _send_howto_step(frm, lang, idx)
            return

        # Typed a message mid-walkthrough → re-show the first step.
        if reply_id is None and session.stage == "howto" and (text or "").strip():
            await db.commit()
            await _send_howto_step(frm, lang, 0)
            return

        # Start the (free) lesson from the onboarding CTA
        if reply_id == "start_lesson":
            session.stage = "lesson"
            await db.commit()
            await _send_lesson(db, frm, lang, nm, session.lesson_index or 0)
            return

        # Between lessons: "Start next lesson" → advance + deliver it
        if reply_id == "next_lesson":
            await _advance_lesson(db, session, frm, lang, nm)
            return

        # "Invite & earn ₹50" button (course-complete screen) → send code + link
        if reply_id == "get_referral":
            await _send_referral_info(db, session, frm)
            return

        # Between lessons: "I have a doubt" → clarify previous lesson first
        if reply_id == "ask_doubt":
            session.stage = "clarify"
            await db.commit()
            await send_buttons(frm, tr(lang, "clarify_prompt").format(name=nm),
                               [("next_lesson", tr(lang, "start_next_btn"))])
            return

        # Start / retake the graded quiz, or a practice quiz (fresh non-repeating set)
        if reply_id in ("quiz", "retake"):
            await _start_quiz(db, session, frm, lang)
            return
        if reply_id == "practice_quiz":
            await _start_quiz(db, session, frm, lang, practice=True)
            return

        # In the middle of a quiz (graded) or practice quiz
        if session.stage in ("quiz", "practice"):
            practice = session.stage == "practice"
            items = _current_quiz(session)
            if reply_id and reply_id.startswith("ans_"):
                qidx = session.quiz_index or 0
                chosen = int(reply_id.split("_", 1)[1])
                base = items[qidx] if qidx < len(items) else items[-1]
                item = _shuffle_options(base, frm, qidx)   # same order the learner saw
                if chosen == item["correct"]:
                    session.quiz_correct = (session.quiz_correct or 0) + 1
                    await send_text(frm, tr(qlang, "correct"))
                else:
                    correct_opt = item["opts"].get(qlang, item["opts"]["en"])[item["correct"]]
                    await send_text(frm, tr(qlang, "wrong").format(a=correct_opt))

                qidx += 1
                session.quiz_index = qidx
                if qidx < len(items):
                    await db.commit()
                    await _send_quiz_question(frm, qlang, qidx, items)
                    return
                score = session.quiz_correct or 0
                if practice:
                    # Practice doesn't gate progress — show the score, back to the menu
                    await send_text(frm, tr(qlang, "practice_result").format(s=score, n=len(items), name=nm))
                    await _send_between_choice(db, session, frm, lang, nm)
                elif score >= QUIZ_PASS:
                    session.stage = "assignment"
                    session.assignment_draft = None
                    await db.commit()
                    await send_text(frm, tr(qlang, "score_pass").format(s=score, name=nm))
                    vid = await _current_video_id(db, session, lang)
                    assignment = await _assignment_for(db, vid)
                    lessons = await _db_lessons(db, lang)
                    # Assignment is optional except on a module's last microlesson.
                    skippable = not _is_last_in_module(lessons, session.lesson_index or 0)
                    await _send_assignment(frm, qlang, assignment, skippable=skippable)
                else:
                    session.stage = "quiz_failed"
                    await db.commit()
                    await send_buttons(
                        frm, tr(qlang, "score_fail").format(s=score, p=QUIZ_PASS, name=nm),
                        [("retake", tr(qlang, "retake_btn"))],
                    )
                return
            # Nudge: they typed instead of tapping — resend the current question
            await db.commit()
            await _send_quiz_question(frm, qlang, session.quiz_index or 0, items)
            return

        # Assignment: collect answer across multiple messages (text or voice),
        # grade only when they tap Submit.
        if session.stage == "assignment":
            # Skip → only allowed on non-last microlessons (assignment is optional
            # there). On a module's last microlesson it's compulsory, so re-show it.
            if reply_id == "skip_assignment":
                lessons = await _db_lessons(db, lang)
                if not _is_last_in_module(lessons, session.lesson_index or 0):
                    session.assignment_draft = None
                    await _send_between_choice(db, session, frm, lang, nm)
                else:
                    vid = await _current_video_id(db, session, lang)
                    assignment = await _assignment_for(db, vid)
                    await _send_assignment(frm, qlang, assignment, skippable=False)
                return
            # Submit → grade the accumulated draft
            if reply_id == "submit_assignment":
                draft = (session.assignment_draft or "").strip()
                if len(draft) < 10:
                    await db.commit()
                    await send_buttons(frm, tr(qlang, "submit_empty"),
                                       [("submit_assignment", tr(qlang, "submit_btn"))])
                    return
                if not allow_ai_call():
                    # Leave the draft untouched so they can hit Submit again later
                    # without retyping — this isn't a fail, grading just didn't run.
                    await db.commit()
                    await send_text(frm, tr(qlang, "ai_busy"))
                    return
                vid = await _current_video_id(db, session, lang)
                assignment = await _assignment_for(db, vid)
                await send_text(frm, tr(qlang, "grading"))
                q = assignment["question"].get(qlang, assignment["question"]["en"])
                # Grade in the quiz language so feedback comes back in the same language.
                score, feedback = await grade_answer(q, assignment["rubric"], draft, qlang)
                session.assignment_draft = None
                if score >= ASSIGN_PASS:
                    await send_text(frm, tr(qlang, "assign_pass").format(s=score, f=feedback, name=nm))
                    await _send_between_choice(db, session, frm, lang, nm)
                else:
                    await db.commit()   # stays in "assignment" so they can redo + resubmit
                    await send_text(frm, tr(qlang, "assign_fail").format(s=score, p=ASSIGN_PASS, f=feedback, name=nm))
                return
            # A typed/voice message → append to the draft, don't grade yet
            if text and text.strip():
                if is_abusive(text):
                    await db.commit()
                    await send_text(frm, tr(qlang, "abusive_input"))
                    return
                session.assignment_draft = ((session.assignment_draft or "") + "\n" + text.strip()).strip()[:8000]
                await db.commit()
                await send_buttons(frm, tr(qlang, "answer_added"),
                                   [("submit_assignment", tr(qlang, "submit_btn"))])
                return
            # Anything else → re-show the assignment + Submit button
            vid = await _current_video_id(db, session, lang)
            assignment = await _assignment_for(db, vid)
            await db.commit()
            await _send_assignment(frm, qlang, assignment)
            return

        # Between lessons / clarifying: answer the doubt via the Teacher, then keep
        # offering the "next lesson" button so they can continue when ready.
        if session.stage in ("between_lessons", "clarify"):
            session.stage = "clarify"
            await db.commit()
            await _teacher_answer(db, session, frm, lang, text)
            await send_buttons(frm, tr(lang, "clarify_more"),
                               [("next_lesson", tr(lang, "start_next_btn"))])
            return

        # On the video lesson (e.g. paused, or asking for the video) → re-deliver
        # the lesson video + Start-quiz buttons rather than dropping into chat.
        if session.stage == "lesson":
            await db.commit()
            await _send_lesson(db, frm, lang, nm, session.lesson_index or 0)
            return

        # Finished the current lesson but more lessons exist (e.g. older sessions,
        # or lessons added later) → continue automatically instead of chatting.
        if session.stage == "done":
            lessons = await _db_lessons(db, lang)
            if (session.lesson_index or 0) + 1 < len(lessons):
                await _advance_lesson(db, session, frm, lang, nm)
                return

        # Otherwise (stage done/quiz_failed with free text) → Teacher agent
        await db.commit()
        await _teacher_answer(db, session, frm, lang, text)
