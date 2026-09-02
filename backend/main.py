from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from db.database import create_tables
from api.admin_routes import router as admin_router
from api.auth_routes import router as auth_router
from api.course_routes import router as course_router
from api.learner_routes import router as learner_router
from api.onboarding_routes import router as onboarding_router
from api.whatsapp_routes import router as whatsapp_router
from api.websocket import handle_learn_websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path("certificates").mkdir(exist_ok=True)
    try:
        await create_tables()
        print("✓ Database tables ready")
        # Lightweight migration: create_all() adds missing tables but not missing
        # columns. Add WhatsApp quiz-progress columns if the table predates them.
        from sqlalchemy import text
        from db.database import engine
        async with engine.begin() as conn:
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS quiz_index INTEGER DEFAULT 0"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS quiz_correct INTEGER DEFAULT 0"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS current_status VARCHAR(50)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS goal TEXT"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS last_nudge_at TIMESTAMP"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS last_nudge_key VARCHAR(40)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS nudge_log JSONB"))
            await conn.execute(text(
                "ALTER TABLE video_language_variants ADD COLUMN IF NOT EXISTS title VARCHAR(255)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS assignment_draft TEXT"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS quiz_current TEXT"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS quiz_seen TEXT"))
            await conn.execute(text(
                "ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS content_doc TEXT"))
            await conn.execute(text(
                "ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_compressed BOOLEAN DEFAULT FALSE"))
            await conn.execute(text(
                "ALTER TABLE video_language_variants ADD COLUMN IF NOT EXISTS is_compressed BOOLEAN DEFAULT FALSE"))
            await conn.execute(text(
                "ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE"))
            await conn.execute(text(
                "ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(12)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS quiz_language VARCHAR(10)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS certificate_pdf VARCHAR(500)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS opt_out BOOLEAN DEFAULT FALSE"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS certificate_code VARCHAR(20)"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMP"))
            await conn.execute(text(
                "ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS certificate_name VARCHAR(255)"))
            for _col, _type in (("source_type","VARCHAR(20)"), ("campaign","VARCHAR(80)"),
                                ("ad_id","VARCHAR(64)"), ("ctwa_clid","VARCHAR(256)"),
                                ("source_headline","VARCHAR(255)"), ("first_seen_at","TIMESTAMP")):
                await conn.execute(text(
                    f"ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS {_col} {_type}"))
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_wa_campaign ON whatsapp_sessions (campaign)"))
            await conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_wa_certificate_code "
                "ON whatsapp_sessions (certificate_code) WHERE certificate_code IS NOT NULL"))
            # Marketing assets: three independent fields per (day, language).
            await conn.execute(text(
                "ALTER TABLE marketing_assets ADD COLUMN IF NOT EXISTS image_public_id VARCHAR(500)"))
            await conn.execute(text(
                "ALTER TABLE marketing_assets ADD COLUMN IF NOT EXISTS video_public_id VARCHAR(500)"))
            await conn.execute(text(
                "ALTER TABLE marketing_assets ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER"))
            await conn.execute(text(
                'ALTER TABLE marketing_assets ADD COLUMN IF NOT EXISTS "text" TEXT'))
        print("✓ WhatsApp session columns ready")
        # Legacy marketing_assets schema (single media_type/cloudinary_public_id) →
        # migrate into the new per-field columns, then relax the old NOT NULLs. Guarded
        # in its own transaction so a fresh DB (no legacy columns) doesn't fail the boot.
        try:
            async with engine.begin() as conn:
                await conn.execute(text(
                    "UPDATE marketing_assets SET image_public_id = cloudinary_public_id "
                    "WHERE media_type = 'image' AND image_public_id IS NULL"))
                await conn.execute(text(
                    "UPDATE marketing_assets SET video_public_id = cloudinary_public_id, "
                    "video_duration_seconds = duration_seconds "
                    "WHERE media_type = 'video' AND video_public_id IS NULL"))
                await conn.execute(text("ALTER TABLE marketing_assets ALTER COLUMN media_type DROP NOT NULL"))
                await conn.execute(text("ALTER TABLE marketing_assets ALTER COLUMN cloudinary_public_id DROP NOT NULL"))
            print("✓ marketing_assets legacy migration done")
        except Exception as e:
            print(f"  (marketing_assets legacy migration skipped: {type(e).__name__})")
        # Seed the current hardcoded intro video as the 'default' so the admin
        # portal reflects reality (idempotent — only inserts if the table is empty).
        from sqlalchemy import select as _select
        from db.database import async_session_factory
        from db.models import IntroVideo
        from api.whatsapp_content import INTRO_VIDEO_ID
        async with async_session_factory() as _db:
            existing = (await _db.execute(_select(IntroVideo))).scalars().first()
            if existing is None and INTRO_VIDEO_ID:
                _db.add(IntroVideo(language="default", cloudinary_public_id=INTRO_VIDEO_ID))
                await _db.commit()
                print("✓ Seeded default intro video")
        # Seed the course on startup. seed() is idempotent — it checks for an
        # existing course and skips if already seeded, so this is safe to run
        # on every boot (and works around free-tier hosts having no shell).
        from db.seed_course import seed
        await seed(force=False)
    except Exception as e:
        print(f"⚠ Database setup/seed issue: {e}")
        print("  Server starting anyway.")

    # WhatsApp drip engine. Runs HOURLY so free-text nudges fire while the
    # learner is still inside WhatsApp's 24h window (idle thresholds are a few
    # hours — see whatsapp_drip.py). Runs in-process (works when the backend is
    # always-on). On the free tier the instance sleeps, so also drive it with a
    # Render Cron Job hitting GET /whatsapp/run-drip?key=<WHATSAPP_OPS_KEY> hourly
    # as the reliable path. NOTE: that endpoint now requires WHATSAPP_OPS_KEY (not
    # the old verify token) — an existing cron using the old key must be updated.
    scheduler = None
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from api.whatsapp_drip import run_drip
        scheduler = AsyncIOScheduler(timezone="UTC")
        scheduler.add_job(run_drip, "cron", minute=0, id="hourly_drip")  # top of every hour
        scheduler.start()
        app.state.scheduler = scheduler
        print("✓ Drip scheduler started (hourly, on the hour, UTC)")
    except Exception as e:
        print(f"⚠ Drip scheduler not started: {e}")

    yield

    if scheduler:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="Cosmoplexx API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # LOCKED to the single production domain (2026-08). The .vercel.app URLs and
    # every other origin are intentionally blocked — everyone uses the custom
    # domain. Hardcoded (not via FRONTEND_URL) so an env typo can't lock out the
    # one origin that must always work.
    allow_origins=["https://ailiteracy.cosmoplex.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
# The web learning channel is DISABLED (2026-08): WhatsApp is the only learner
# channel, and the web learner APIs carried unauthenticated endpoints (learn
# WebSocket, quiz answer key, client-supplied assignment rubric). Rather than
# patch each one, the whole surface is switched off at the router level — hiding
# the buttons on the site would not have stopped direct API calls.
# Set WEB_CHANNEL_ENABLED=true to bring it back (fix the auth issues first).
if settings.web_channel_enabled:
    app.include_router(auth_router)
    app.include_router(learner_router)
    app.include_router(course_router)
    app.include_router(onboarding_router)
    print("⚠ Web learner channel ENABLED")
else:
    print("✓ Web learner channel disabled (WhatsApp-only)")

app.include_router(admin_router)      # admin portal — always on
app.include_router(whatsapp_router)   # WhatsApp webhook — always on

# Serve generated certificates
certs_dir = Path("certificates")
certs_dir.mkdir(exist_ok=True)
app.mount("/certificates", StaticFiles(directory="certificates"), name="certificates")


# WebSocket — part of the web learner channel, so it follows the same flag.
# While disabled the socket is refused outright. This was the highest-risk
# endpoint: it took the learner id straight from the URL with no token, and its
# agent calls (Sonnet + image generation) bypassed the daily AI spend guard, so
# anyone could open it and burn paid AI unmetered.
if settings.web_channel_enabled:
    @app.websocket("/ws/learn/{learner_id}")
    async def learn_ws(websocket: WebSocket, learner_id: str):
        await handle_learn_websocket(websocket, learner_id)


@app.get("/verify/{code}")
async def verify_certificate(code: str):
    """PUBLIC certificate verification — the QR on every certificate points here
    (via the site's /verify/<code> page). Intentionally unauthenticated: anyone
    holding a certificate must be able to check it.

    Returns only what a verifier needs — holder name, course, issue date. Never
    the learner's phone number or any other PII. An unknown code returns
    {valid: false} rather than 404 so the page can render a clear result."""
    from sqlalchemy import select as _sel
    from db.database import async_session_factory
    from db.models import WhatsAppSession

    code = (code or "").strip().upper()[:20]
    if not code:
        return {"valid": False}
    try:
        async with async_session_factory() as db:
            row = (await db.execute(
                _sel(WhatsAppSession).where(WhatsAppSession.certificate_code == code)
            )).scalars().first()
            if row is None or not row.certificate_code:
                return {"valid": False}
            return {
                "valid": True,
                "code": row.certificate_code,
                # The name AS PRINTED on the certificate. Using the live session name would
                # let a later name change make a genuine certificate disagree with its page.
                "name": (row.certificate_name or row.name or "").strip() or "Learner",
                "course": "AI Literacy Certification",
                "issuer": "Cosmoplex",
                # Frozen at issue so it always matches the date printed on the PDF
                # (updated_at would drift every time the learner sends a message).
                "issued_at": row.certificate_issued_at.isoformat() + "Z"
                if row.certificate_issued_at else None,
            }
    except Exception as e:
        print(f"WARN verify lookup failed: {type(e).__name__}: {e}")
        return {"valid": False}


@app.get("/health")
async def health(db: int = 0):
    """Liveness check. By DEFAULT it does NOT touch the database — so routine
    health pings (Render's health check, uptime monitors) don't keep a
    scale-to-zero Neon DB awake and burn compute. Pass ?db=1 for a deep check
    that also verifies DB connectivity + counts (only exposes counts and the
    error *type* — never credentials)."""
    from api.whatsapp_content import INTRO_VIDEO_ID

    db_status: dict = {"checked": False}
    if db:
        db_status = {}
        try:
            from db.database import async_session_factory
            from db.models import Course, IntroVideo
            from sqlalchemy import select, func, text as _text
            async with async_session_factory() as session:
                await session.execute(_text("SELECT 1"))
                db_status["connected"] = True
                try:
                    db_status["courses"] = (await session.execute(select(func.count()).select_from(Course))).scalar()
                    db_status["intro_videos"] = (await session.execute(select(func.count()).select_from(IntroVideo))).scalar()
                except Exception as e:  # tables not created yet
                    db_status["tables"] = f"pending ({type(e).__name__})"
        except Exception as e:
            db_status["connected"] = False
            db_status["error"] = type(e).__name__   # e.g. InvalidPasswordError, OSError

    return {
        "status": "ok",
        "environment": settings.environment,
        "build": "assignments-toggle",
        "db": db_status,
        "whatsapp": {
            "onboarding": True,
            "intro_video": bool(INTRO_VIDEO_ID),
        },
    }
