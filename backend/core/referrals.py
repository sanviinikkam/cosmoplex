"""Referral program: code generation, attribution on signup, demo payout.

Reward triggers when a referred person SIGNS UP. Payout is "automated" but runs
in DEMO mode by default (settings.referral_demo_mode) — no real money moves; the
referral is auto-marked paid with payout_ref='DEMO'. Flip demo_mode off and wire
a provider in attribute_signup() to go live.
"""
import secrets
from datetime import datetime

from sqlalchemy import select

from core.config import settings
from db.models import LearnerProfile, WhatsAppSession, Referral

# No ambiguous characters (0/O, 1/I/L) — codes get typed by hand on WhatsApp.
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


async def _code_taken(db, code: str) -> bool:
    if (await db.execute(select(LearnerProfile.id).where(LearnerProfile.referral_code == code))).first():
        return True
    return bool((await db.execute(select(WhatsAppSession.phone).where(WhatsAppSession.referral_code == code))).first())


async def gen_code(db, length: int = 8) -> str:
    for _ in range(20):
        code = "".join(secrets.choice(_ALPHABET) for _ in range(length))
        if not await _code_taken(db, code):
            return code
    return "".join(secrets.choice(_ALPHABET) for _ in range(length + 4))  # ~impossible fallback


async def get_or_create_web_code(db, learner: LearnerProfile) -> str:
    if not learner.referral_code:
        learner.referral_code = await gen_code(db)
        await db.commit()
    return learner.referral_code


async def get_or_create_wa_code(db, session: WhatsAppSession) -> str:
    if not session.referral_code:
        session.referral_code = await gen_code(db)
        await db.commit()
    return session.referral_code


async def resolve_code(db, code: str):
    """(kind, id) of the code's owner, or None."""
    code = (code or "").strip().upper()
    if not code:
        return None
    w = (await db.execute(select(LearnerProfile.id).where(LearnerProfile.referral_code == code))).scalar_one_or_none()
    if w:
        return ("web", w)
    p = (await db.execute(select(WhatsAppSession.phone).where(WhatsAppSession.referral_code == code))).scalar_one_or_none()
    if p:
        return ("whatsapp", p)
    return None


async def attribute_signup(db, code: str, referred_kind: str, referred_id: str) -> Referral | None:
    """Record + (demo) pay a referral when a new user signs up with `code`.
    Guards: valid code, no self-referral, one reward per referred person."""
    code = (code or "").strip().upper()
    owner = await resolve_code(db, code)
    if not owner:
        return None
    referrer_kind, referrer_id = owner
    if referrer_kind == referred_kind and str(referrer_id) == str(referred_id):
        return None  # no self-referral
    existing = (await db.execute(
        select(Referral).where(Referral.referred_id == str(referred_id)))).scalar_one_or_none()
    if existing:
        return existing  # already referred — one reward per person
    ref = Referral(
        code=code, referrer_kind=referrer_kind, referrer_id=str(referrer_id),
        referred_kind=referred_kind, referred_id=str(referred_id),
        reward_amount=settings.referral_reward_rupees, status="pending",
    )
    # Reward triggers on signup → process the payout now. DEMO: no real transfer.
    if settings.referral_demo_mode:
        ref.status = "paid"
        ref.payout_ref = "DEMO"
        ref.paid_at = datetime.utcnow()
    # else: wire a real payout provider here (Razorpay/Cashfree) — intentionally unwired.
    db.add(ref)
    await db.commit()
    await _notify_referrer(db, ref)   # tell the referrer they earned a reward
    return ref


async def _referred_name(db, kind: str, ident: str) -> str:
    if kind == "whatsapp":
        s = await db.get(WhatsAppSession, ident)
        return (s.name if s and s.name else "Someone")
    lp = await db.get(LearnerProfile, ident)
    return (lp.name if lp and lp.name else "Someone")


async def _notify_referrer(db, ref: Referral) -> None:
    """Tell the referrer their code landed a signup. WhatsApp referrers get a
    message now; web referrers see it in their referral card (built later)."""
    if ref.referrer_kind != "whatsapp":
        return
    try:
        from api.whatsapp_routes import send_text, REFERRAL_SUCCESS  # lazy: avoid circular import
        session = await db.get(WhatsAppSession, ref.referrer_id)
        lang = (session.language if session else None) or "en"
        stats = await referral_stats(db, "whatsapp", ref.referrer_id)
        name = await _referred_name(db, ref.referred_kind, ref.referred_id)
        msg = REFERRAL_SUCCESS.get(lang, REFERRAL_SUCCESS["en"]).format(
            name=name, reward=ref.reward_amount, earned=stats["earned"])
        await send_text(ref.referrer_id, msg)
    except Exception as e:
        print(f"⚠ referral notify error: {e}")


async def referral_stats(db, kind: str, ident: str) -> dict:
    rows = (await db.execute(select(Referral).where(
        Referral.referrer_kind == kind, Referral.referrer_id == str(ident)))).scalars().all()
    paid = [r for r in rows if r.status == "paid"]
    return {"total": len(rows), "paid": len(paid), "earned": sum(r.reward_amount for r in paid)}
