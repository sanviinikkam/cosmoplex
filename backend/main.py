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
        # Seed the course on startup. seed() is idempotent — it checks for an
        # existing course and skips if already seeded, so this is safe to run
        # on every boot (and works around free-tier hosts having no shell).
        from db.seed_course import seed
        await seed(force=False)
    except Exception as e:
        print(f"⚠ Database setup/seed issue: {e}")
        print("  Server starting anyway.")
    yield


app = FastAPI(
    title="Cosmoplexx API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    # Accept any Vercel deployment URL for this project (production alias +
    # per-deploy preview URLs all end in .vercel.app).
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(auth_router)
app.include_router(learner_router)
app.include_router(course_router)
app.include_router(admin_router)
app.include_router(onboarding_router)
app.include_router(whatsapp_router)

# Serve generated certificates
certs_dir = Path("certificates")
certs_dir.mkdir(exist_ok=True)
app.mount("/certificates", StaticFiles(directory="certificates"), name="certificates")


# WebSocket
@app.websocket("/ws/learn/{learner_id}")
async def learn_ws(websocket: WebSocket, learner_id: str):
    await handle_learn_websocket(websocket, learner_id)


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.environment}
