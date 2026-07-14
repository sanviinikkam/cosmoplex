"""
WhatsApp Cloud API adapter (Meta direct).

  GET  /whatsapp/webhook  → Meta verification handshake
  POST /whatsapp/webhook  → inbound messages → route to the Teacher agent → reply

This is a thin channel adapter: it reuses the same agent logic as the web chat.
Identity is by phone number and state is transient for now (persistent phone↔learner
linking + full quiz/lesson flow are the next steps).
"""
import httpx
from fastapi import APIRouter, Request, Response, Query

from core.config import settings
from agents.base import LearnerState
from agents.teacher import run_teacher

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

GRAPH = "https://graph.facebook.com"


def _configured() -> bool:
    return bool(settings.whatsapp_token and settings.whatsapp_phone_number_id)


def _messages_url() -> str:
    return f"{GRAPH}/{settings.graph_api_version}/{settings.whatsapp_phone_number_id}/messages"


async def send_text(to: str, body: str) -> None:
    if not _configured():
        print("⚠ WhatsApp not configured — skipping send")
        return
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body[:4096]},
    }
    await _post(payload)


async def send_buttons(to: str, text: str, buttons: list[tuple[str, str]]) -> None:
    """Send up to 3 reply buttons. `buttons` = list of (id, title)."""
    if not _configured():
        return
    payload = {
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
    }
    await _post(payload)


async def _post(payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=30) as h:
            resp = await h.post(
                _messages_url(),
                headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
                json=payload,
            )
            if resp.status_code >= 400:
                print(f"⚠ WhatsApp send failed {resp.status_code}: {resp.text[:300]}")
    except httpx.HTTPError as e:
        print(f"⚠ WhatsApp send error: {e}")


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
# Opening this URL registers the number (creates its Cloud API account + sets the
# 2-step PIN) using the server-side token, so no terminal/curl is needed.
# Guarded by the verify token so it isn't public.
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


# ── Inbound messages ─────────────────────────────────────────────────────────
@router.post("/webhook")
async def receive(request: Request):
    data = await request.json()
    try:
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    frm = msg.get("from")
                    text = _extract_text(msg)
                    if frm and text:
                        await _handle_message(frm, text)
    except Exception as e:  # never fail the webhook — Meta will retry aggressively
        print(f"⚠ WhatsApp webhook error: {e}")
    # Acknowledge fast so Meta doesn't retry.
    return {"status": "ok"}


def _extract_text(msg: dict) -> str | None:
    mtype = msg.get("type")
    if mtype == "text":
        return msg.get("text", {}).get("body")
    if mtype == "interactive":
        inter = msg.get("interactive", {})
        if inter.get("type") == "button_reply":
            return inter["button_reply"].get("title")
        if inter.get("type") == "list_reply":
            return inter["list_reply"].get("title")
    return None


async def _handle_message(frm: str, text: str) -> None:
    # Transient learner state keyed by phone number. Language defaults to English
    # until we persist a phone↔learner link and their chosen language.
    state = LearnerState(
        learner_id=f"wa:{frm}",
        name="there",
        language="en",
        current_module_id="m1",
        messages=[{"role": "user", "content": text}],
        last_agent="teacher",
    )
    reply = await run_teacher(state, text)
    await send_text(frm, reply)
