"""
WhatsApp Cloud API adapter (Meta direct).

  GET  /whatsapp/webhook  → Meta verification handshake
  POST /whatsapp/webhook  → inbound → language picker → lesson → quiz → assignment

Learning flow (state persisted per phone in whatsapp_sessions):
  1. First contact → interactive LIST of 6 languages.
  2. Pick language → deliver Lesson 1 video + "Start quiz" button.
  3. Quiz → 5 MCQs as interactive lists; 3/5 to pass, retake on fail.
  4. Pass → deliver assignment; learner types their answer.
  5. Answer graded by Claude (75/100 to pass); resubmit on fail.
  6. Pass → lesson complete; free text routes to the Teacher agent.
"""
import json
import re
from collections import deque
from datetime import datetime

import anthropic
import httpx
from fastapi import APIRouter, BackgroundTasks, Request, Response, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from core.config import settings
from db.database import async_session_factory
from db.models import (
    WhatsAppSession, Course, CourseModule, Section, Video,
    QuizQuestion, AssignmentPrompt,
)
from agents.base import LearnerState
from agents.teacher import run_teacher
from api.whatsapp_content import (
    LESSON_VIDEOS, QUIZ, QUIZ_PASS, ASSIGNMENT, ASSIGN_PASS, CONTENT, tr,
    INTRO_VIDEO_ID, intro_video_for, LANG_NAME, COURSE_FACTS, ONBOARD, ob,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

GRAPH = "https://graph.facebook.com"
NUM_EMOJI = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"]

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


async def _download(url: str) -> bytes | None:
    try:
        async with httpx.AsyncClient(timeout=180, follow_redirects=True) as h:
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
    text = await transcribe_audio(media_id)
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

    Downloads the compressed (<16 MB) Cloudinary derivative, uploads it to
    WhatsApp for a media_id, and sends by id — this avoids Meta's short
    link-fetch timeout. Falls back to a link, then a text link, if needed.
    """
    url = _video_url(public_id)
    data = await _download(url)
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


# ── Inbound messages ─────────────────────────────────────────────────────────
@router.post("/webhook")
async def receive(request: Request, background_tasks: BackgroundTasks):
    # ACK Meta immediately, then handle each message in the background. The
    # Teacher/grading calls can take 10-30s; if we blocked the response Meta
    # would time out and re-deliver, causing duplicate replies.
    data = await request.json()
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


async def _begin_onboarding(db, session, frm: str, lang: str) -> None:
    """Greeting + brief + intro video, then the first profile question."""
    session.stage = "welcome"
    await db.commit()
    await send_text(frm, ob(lang, "brief").format(name=session.name or "friend"))
    intro_id = intro_video_for(lang)
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
                                    "cloud_id": cloud_id})
    if not lessons:
        # DB not populated in this environment — fall back to the built-in lesson
        # so the flow never dead-ends. (video_id=None → quiz/assignment fall back too.)
        base = LESSON_VIDEOS[0]
        cloud_id = base.get(lang) or base.get("en")
        if cloud_id:
            lessons.append({"video_id": None,
                            "title": "The 10 AI Words Every Fresher Must Know",
                            "cloud_id": cloud_id})
    return lessons


async def _lesson_at(db, lang: str, idx: int) -> dict | None:
    lessons = await _db_lessons(db, lang)
    return lessons[idx] if 0 <= idx < len(lessons) else None


async def _quiz_items(db, video_id: str | None) -> list[dict]:
    """This lesson's quiz from the DB bank (deterministic order → stable across
    the 5-question flow without extra state). Falls back to the built-in quiz
    for lessons whose bank hasn't been filled in yet."""
    if video_id:
        res = await db.execute(
            select(QuizQuestion).where(QuizQuestion.video_id == video_id)
            .order_by(QuizQuestion.order_index, QuizQuestion.created_at)
        )
        rows = res.scalars().all()
        if rows:
            return [{"q": r.question, "opts": r.options, "correct": r.correct_index}
                    for r in rows[:5]]
    return [{"q": it["q"], "opts": it["opts"], "correct": it["correct"]} for it in QUIZ]


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
    """Localized 'watch then tap Start quiz' instruction with the real DB title."""
    full = tr(lang, "lesson_caption")
    instr = full.split("\n\n", 1)[1] if "\n\n" in full else full
    return f"📚 {title}\n\n{instr}"


async def _send_lesson(db, to: str, lang: str, name: str = "friend", idx: int = 0) -> None:
    lesson = await _lesson_at(db, lang, idx)
    if lesson is None:
        await send_text(to, tr(lang, "no_more"))
        return
    await send_video(to, lesson["cloud_id"], _lesson_caption(lang, lesson["title"]))
    await send_buttons(to, tr(lang, "after_text").format(name=name),
                       [("quiz", tr(lang, "quiz_btn")), ("menu", tr(lang, "menu_btn"))])


async def _send_quiz_question(to: str, lang: str, qidx: int, items: list[dict]) -> None:
    if qidx >= len(items):
        return
    item = items[qidx]
    q = item["q"].get(lang, item["q"]["en"])
    opts = item["opts"].get(lang, item["opts"]["en"])
    numbered = "\n".join(f"{NUM_EMOJI[i]} {opt}" for i, opt in enumerate(opts))
    body = f"{tr(lang, 'quiz_progress').format(n=qidx + 1)}\n\n{q}\n\n{numbered}"
    rows = [(f"ans_{i}", NUM_EMOJI[i], opts[i]) for i in range(len(opts))]
    await send_list(to, header="Quiz", body=body, button=tr(lang, "answer_btn"),
                    rows=rows, section_title=tr(lang, "answer_btn"))


async def _send_assignment(to: str, lang: str, assignment: dict) -> None:
    q = assignment["question"].get(lang, assignment["question"]["en"])
    await send_text(to, tr(lang, "assignment_intro").format(q=q))


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
    if st == "quiz":
        await db.commit()
        vid = await _current_video_id(db, session, lang)
        items = await _quiz_items(db, vid)
        await _send_quiz_question(frm, lang, session.quiz_index or 0, items)
    elif st == "assignment":
        await db.commit()
        vid = await _current_video_id(db, session, lang)
        assignment = await _assignment_for(db, vid)
        await _send_assignment(frm, lang, assignment)
    else:
        session.stage = "lesson"
        await db.commit()
        await _send_lesson(db, frm, lang, session.name or "friend", session.lesson_index or 0)


async def _start_quiz(db, session, frm: str, lang: str) -> None:
    session.stage = "quiz"
    session.quiz_index = 0
    session.quiz_correct = 0
    await db.commit()
    vid = await _current_video_id(db, session, lang)
    items = await _quiz_items(db, vid)
    await _send_quiz_question(frm, lang, 0, items)


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

        # Explicit reset → back to the language picker, fresh state
        if reply_id is None and low in ("restart", "reset", "start over", "restart course"):
            session.language = None
            session.stage = "new"
            session.quiz_index = 0
            session.quiz_correct = 0
            await db.commit()
            await _send_language_picker(frm)
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
        nm = (session.name or "").strip() or "friend"

        # "Language" button/command → re-show picker anytime
        if reply_id == "menu" or low in ("menu", "language", "lang", "change language", "भाषा", "மொழி", "ಭಾಷೆ", "భాష"):
            await db.commit()
            await _send_language_picker(frm)
            return

        # Onboarding: capture the learner's name → then begin the funnel
        if session.stage == "ask_name":
            candidate = (text or "").strip()
            if not candidate:
                await db.commit()
                await send_text(frm, ob(lang, "name_q"))
                return
            session.name = candidate[:40]
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
            pitch = await generate_pitch(lang, label, nm)
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
            await send_buttons(frm, ob(lang, "start_prompt").format(name=nm),
                               [("start_lesson", ob(lang, "start_btn"))])
            return

        # Start the (free) lesson from the onboarding CTA
        if reply_id == "start_lesson":
            session.stage = "lesson"
            await db.commit()
            await _send_lesson(db, frm, lang, nm, session.lesson_index or 0)
            return

        # Start / retake quiz
        if reply_id in ("quiz", "retake"):
            await _start_quiz(db, session, frm, lang)
            return

        # In the middle of the quiz
        if session.stage == "quiz":
            vid = await _current_video_id(db, session, lang)
            items = await _quiz_items(db, vid)
            if reply_id and reply_id.startswith("ans_"):
                qidx = session.quiz_index or 0
                chosen = int(reply_id.split("_", 1)[1])
                item = items[qidx] if qidx < len(items) else items[-1]
                if chosen == item["correct"]:
                    session.quiz_correct = (session.quiz_correct or 0) + 1
                    await send_text(frm, tr(lang, "correct"))
                else:
                    correct_opt = item["opts"].get(lang, item["opts"]["en"])[item["correct"]]
                    await send_text(frm, tr(lang, "wrong").format(a=correct_opt))

                qidx += 1
                session.quiz_index = qidx
                if qidx < len(items):
                    await db.commit()
                    await _send_quiz_question(frm, lang, qidx, items)
                else:
                    score = session.quiz_correct or 0
                    if score >= QUIZ_PASS:
                        session.stage = "assignment"
                        await db.commit()
                        await send_text(frm, tr(lang, "score_pass").format(s=score, name=nm))
                        assignment = await _assignment_for(db, vid)
                        await _send_assignment(frm, lang, assignment)
                    else:
                        session.stage = "quiz_failed"
                        await db.commit()
                        await send_buttons(
                            frm, tr(lang, "score_fail").format(s=score, p=QUIZ_PASS, name=nm),
                            [("retake", tr(lang, "retake_btn"))],
                        )
                return
            # Nudge: they typed instead of tapping — resend the current question
            await db.commit()
            await _send_quiz_question(frm, lang, session.quiz_index or 0, items)
            return

        # Awaiting an assignment answer
        if session.stage == "assignment":
            vid = await _current_video_id(db, session, lang)
            assignment = await _assignment_for(db, vid)
            if not text or len(text.strip()) < 10:
                await db.commit()
                await _send_assignment(frm, lang, assignment)
                return
            await db.commit()
            await send_text(frm, tr(lang, "grading"))
            q = assignment["question"].get(lang, assignment["question"]["en"])
            score, feedback = await grade_answer(q, assignment["rubric"], text, lang)
            if score >= ASSIGN_PASS:
                session.stage = "done"
                await db.commit()
                await send_text(frm, tr(lang, "assign_pass").format(s=score, f=feedback, name=nm))
                await send_text(frm, tr(lang, "done").format(name=nm))
            else:
                await db.commit()
                await send_text(frm, tr(lang, "assign_fail").format(s=score, p=ASSIGN_PASS, f=feedback, name=nm))
            return

        # Otherwise (stage lesson/done/quiz_failed with free text) → Teacher agent
        await db.commit()
        state = LearnerState(
            learner_id=f"wa:{frm}",
            name=session.name or "there",
            language=lang,
            current_module_id="m1",
            messages=[{"role": "user", "content": text or ""}],
            last_agent="teacher",
        )
        reply = await run_teacher(state, text or "")
        await send_text(frm, reply)
