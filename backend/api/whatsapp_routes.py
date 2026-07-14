"""
WhatsApp Cloud API adapter (Meta direct).

  GET  /whatsapp/webhook  → Meta verification handshake
  POST /whatsapp/webhook  → inbound messages → language picker → lesson delivery

Flow:
  1. First contact → send an interactive LIST so the user picks a language.
  2. On language pick → save it (per phone) and deliver the first lesson video
     in that language, with "Next lesson" / "Language" buttons.
  3. "Next" advances lessons; any free text goes to the Teacher agent, which
     replies in the chosen language.

State is persisted per phone number in the whatsapp_sessions table.
"""
import httpx
from fastapi import APIRouter, Request, Response, Query

from core.config import settings
from db.database import async_session_factory
from db.models import WhatsAppSession
from agents.base import LearnerState
from agents.teacher import run_teacher

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

GRAPH = "https://graph.facebook.com"

# ── Languages offered in the picker ──────────────────────────────────────────
LANGS = {
    "en": "English",
    "hi": "हिंदी (Hindi)",
    "mr": "मराठी (Marathi)",
    "te": "తెలుగు (Telugu)",
    "ta": "தமிழ் (Tamil)",
    "kn": "ಕನ್ನಡ (Kannada)",
}

# ── Course content: lessons that have a video in every language ──────────────
# Each lesson maps a language code → Cloudinary public ID. Add more dicts here
# as more localized lesson videos are recorded.
LESSONS = [
    {
        "video": {
            "en": "2.1_English_compressed_s6vhdd",
            "hi": "2.1_hindi_sixgnf",
            "mr": "2.1_Marathi_cws5fc",
            "te": "2.1_Telugu_qloes6",
            "ta": "2.1_tamil_tl4rf2",
            "kn": "2.1_Kannada_azgabe",
        },
    },
]

# ── Localized UI strings (one dict per language) ─────────────────────────────
CONTENT = {
    "en": {
        "picker_done": "Great! We'll learn in English. 🎉",
        "lesson_caption": "📚 Lesson {n}: The 10 AI Words Every Fresher Must Know\n\nWatch the video, then tap “Next lesson”.",
        "after_text": "What next?",
        "next_btn": "▶️ Next lesson",
        "menu_btn": "🌐 Language",
        "no_more": "🎉 That's every lesson for now — more are coming soon! Meanwhile, ask me anything about what you learned.",
        "watch_here": "▶️ Watch the lesson here:",
    },
    "hi": {
        "picker_done": "बढ़िया! अब हम हिंदी में सीखेंगे। 🎉",
        "lesson_caption": "📚 पाठ {n}: हर फ्रेशर को पता होने चाहिए ये 10 AI शब्द\n\nवीडियो देखें, फिर “अगला पाठ” दबाएँ।",
        "after_text": "आगे क्या करें?",
        "next_btn": "▶️ अगला पाठ",
        "menu_btn": "🌐 भाषा",
        "no_more": "🎉 फ़िलहाल इतने ही पाठ हैं — और जल्द आ रहे हैं! तब तक, आपने जो सीखा उसके बारे में मुझसे कुछ भी पूछें।",
        "watch_here": "▶️ पाठ यहाँ देखें:",
    },
    "mr": {
        "picker_done": "छान! आता आपण मराठीत शिकूया. 🎉",
        "lesson_caption": "📚 धडा {n}: प्रत्येक फ्रेशरला माहिती हवे असे 10 AI शब्द\n\nव्हिडिओ पाहा, मग “पुढील धडा” दाबा.",
        "after_text": "पुढे काय करायचे?",
        "next_btn": "▶️ पुढील धडा",
        "menu_btn": "🌐 भाषा",
        "no_more": "🎉 सध्या एवढेच धडे आहेत — अजून लवकरच येत आहेत! तोपर्यंत, तुम्ही जे शिकलात त्याबद्दल मला काहीही विचारा.",
        "watch_here": "▶️ धडा इथे पाहा:",
    },
    "te": {
        "picker_done": "అద్భుతం! ఇక తెలుగులో నేర్చుకుందాం. 🎉",
        "lesson_caption": "📚 పాఠం {n}: ప్రతి ఫ్రెషర్ తెలుసుకోవలసిన 10 AI పదాలు\n\nవీడియో చూసి, తర్వాత “తదుపరి పాఠం” నొక్కండి.",
        "after_text": "తర్వాత ఏం చేద్దాం?",
        "next_btn": "▶️ తదుపరి పాఠం",
        "menu_btn": "🌐 భాష",
        "no_more": "🎉 ప్రస్తుతానికి ఇవే పాఠాలు — మరిన్ని త్వరలో వస్తున్నాయి! అప్పటివరకు, మీరు నేర్చుకున్నదాని గురించి నన్ను ఏదైనా అడగండి.",
        "watch_here": "▶️ పాఠాన్ని ఇక్కడ చూడండి:",
    },
    "ta": {
        "picker_done": "அருமை! இனி தமிழில் கற்போம். 🎉",
        "lesson_caption": "📚 பாடம் {n}: ஒவ்வொரு ஃப்ரெஷரும் தெரிந்திருக்க வேண்டிய 10 AI சொற்கள்\n\nவீடியோவைப் பாருங்கள், பிறகு “அடுத்த பாடம்” அழுத்துங்கள்.",
        "after_text": "அடுத்து என்ன செய்யலாம்?",
        "next_btn": "▶️ அடுத்த பாடம்",
        "menu_btn": "🌐 மொழி",
        "no_more": "🎉 தற்போதைக்கு இத்துடன் பாடங்கள் முடிந்தன — விரைவில் மேலும் வரும்! அதுவரை, நீங்கள் கற்றது பற்றி என்னிடம் எதையும் கேளுங்கள்.",
        "watch_here": "▶️ பாடத்தை இங்கே பாருங்கள்:",
    },
    "kn": {
        "picker_done": "ಅದ್ಭುತ! ಇನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕಲಿಯೋಣ. 🎉",
        "lesson_caption": "📚 ಪಾಠ {n}: ಪ್ರತಿ ಫ್ರೆಶರ್ ತಿಳಿದಿರಬೇಕಾದ 10 AI ಪದಗಳು\n\nವೀಡಿಯೊ ನೋಡಿ, ನಂತರ “ಮುಂದಿನ ಪಾಠ” ಒತ್ತಿ.",
        "after_text": "ಮುಂದೆ ಏನು ಮಾಡೋಣ?",
        "next_btn": "▶️ ಮುಂದಿನ ಪಾಠ",
        "menu_btn": "🌐 ಭಾಷೆ",
        "no_more": "🎉 ಸದ್ಯಕ್ಕೆ ಇಷ್ಟೇ ಪಾಠಗಳು — ಶೀಘ್ರದಲ್ಲೇ ಇನ್ನಷ್ಟು ಬರಲಿವೆ! ಅಲ್ಲಿಯವರೆಗೆ, ನೀವು ಕಲಿತದ್ದರ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ.",
        "watch_here": "▶️ ಪಾಠವನ್ನು ಇಲ್ಲಿ ನೋಡಿ:",
    },
}


def _configured() -> bool:
    return bool(settings.whatsapp_token and settings.whatsapp_phone_number_id)


def _messages_url() -> str:
    return f"{GRAPH}/{settings.graph_api_version}/{settings.whatsapp_phone_number_id}/messages"


def _video_url(public_id: str) -> str:
    return f"https://res.cloudinary.com/{settings.cloudinary_cloud_name}/video/upload/{public_id}.mp4"


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
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body[:4096]},
    })


async def send_buttons(to: str, text: str, buttons: list[tuple[str, str]]) -> None:
    """Send up to 3 reply buttons. `buttons` = list of (id, title)."""
    await _post({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": text[:1024]},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": bid, "title": title[:20]}}
                    for bid, title in buttons[:3]
                ]
            },
        },
    })


async def send_list(to: str, header: str, body: str, button: str,
                    rows: list[tuple[str, str, str]]) -> None:
    """Interactive list menu. `rows` = list of (id, title, description)."""
    await _post({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "header": {"type": "text", "text": header[:60]},
            "body": {"text": body[:1024]},
            "action": {
                "button": button[:20],
                "sections": [{
                    "title": "Languages",
                    "rows": [
                        {"id": rid, "title": title[:24], "description": desc[:72]}
                        for rid, title, desc in rows[:10]
                    ],
                }],
            },
        },
    })


async def send_video(to: str, link: str, caption: str) -> None:
    """Send a video by link; fall back to a clickable link in text if Meta
    rejects it (e.g. file too large to fetch, or an unsupported host)."""
    resp = await _post({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "video",
        "video": {"link": link, "caption": caption[:1024]},
    })
    if resp is None or resp.status_code >= 400:
        await send_text(to, f"{caption}\n\n{link}")


# ── Webhook verification (Meta calls this once when you set the URL) ──────────
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


# ── Subscribe THIS app to a WABA's webhooks (the commonly-missed step) ───────
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


# ── Inbound messages ─────────────────────────────────────────────────────────
@router.post("/webhook")
async def receive(request: Request):
    data = await request.json()
    try:
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                contacts = value.get("contacts", [])
                name = None
                if contacts:
                    name = contacts[0].get("profile", {}).get("name")
                for msg in value.get("messages", []):
                    frm = msg.get("from")
                    reply_id, text = _extract(msg)
                    if frm and (reply_id or text):
                        await _handle_message(frm, reply_id, text, name)
    except Exception as e:  # never fail the webhook — Meta retries aggressively
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


async def _send_language_picker(to: str) -> None:
    rows = [(f"lang_{code}", label.split(" (")[0], label) for code, label in LANGS.items()]
    await send_list(
        to,
        header="Cosmoplex",
        body="👋 Welcome to Cosmoplex — learn AI in your own language!\n\nFirst, choose the language you'd like to learn in:",
        button="Choose language",
        rows=rows,
    )


async def _send_lesson(to: str, lang: str, index: int) -> None:
    c = CONTENT[lang]
    lesson = LESSONS[index]
    public_id = lesson["video"].get(lang) or lesson["video"]["en"]
    caption = c["lesson_caption"].format(n=index + 1)
    await send_video(to, _video_url(public_id), caption)
    await send_buttons(to, c["after_text"], [("next", c["next_btn"]), ("menu", c["menu_btn"])])


async def _handle_message(frm: str, reply_id: str | None, text: str | None, name: str | None) -> None:
    async with async_session_factory() as db:
        session = await db.get(WhatsAppSession, frm)
        if session is None:
            session = WhatsAppSession(phone=frm, stage="new")
            db.add(session)
        if name and not session.name:
            session.name = name

        # 1) Language selection from the list
        if reply_id and reply_id.startswith("lang_"):
            lang = reply_id.split("_", 1)[1]
            if lang in LANGS:
                session.language = lang
                session.stage = "learning"
                session.lesson_index = 0
                await db.commit()
                await send_text(frm, CONTENT[lang]["picker_done"])
                await _send_lesson(frm, lang, 0)
                return

        # 2) No language chosen yet → show the picker
        if not session.language:
            await db.commit()
            await _send_language_picker(frm)
            return

        lang = session.language
        c = CONTENT[lang]
        low = (text or "").strip().lower()

        # 3) "Language" button / command → re-show the picker
        if reply_id == "menu" or low in ("menu", "language", "lang", "भाषा", "மொழி", "ಭಾಷೆ", "భాష"):
            await db.commit()
            await _send_language_picker(frm)
            return

        # 4) "Next" button / command → advance to the next lesson
        if reply_id == "next" or low in ("next", "अगला", "पुढील", "தொடர்", "ముందుకు"):
            idx = (session.lesson_index or 0) + 1
            if idx < len(LESSONS):
                session.lesson_index = idx
                await db.commit()
                await _send_lesson(frm, lang, idx)
            else:
                await db.commit()
                await send_text(frm, c["no_more"])
            return

        # 5) Otherwise → route to the Teacher agent, replying in their language
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
