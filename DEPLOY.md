# Deploying Cosmoplex

**Architecture:** Next.js frontend on **Vercel**, FastAPI backend + Postgres on **Render**.
The backend runs as a persistent Docker service (it serves WebSockets), so it can't be serverless.

---

## Prerequisites
- Code pushed to a GitHub repo.
- An **Anthropic API key** (the agents need it).
- Your **Cloudinary cloud name** (hosts the lesson videos).
- Accounts on [Render](https://render.com) and [Vercel](https://vercel.com).

---

## 1 — Backend + Database on Render

The repo includes [`render.yaml`](render.yaml), a Blueprint that provisions the API service, a managed Postgres, and a 1 GB disk for generated certificates.

1. Render Dashboard → **New → Blueprint** → connect this repo. Render reads `render.yaml`.
2. When prompted, fill the secret env vars:
   - `ANTHROPIC_API_KEY` → your real key.
   - `FRONTEND_URL` → leave as a placeholder for now (e.g. `https://example.vercel.app`); you'll update it after step 2.
   - `SECRET_KEY` and `DATABASE_URL` are filled automatically.
3. Click **Apply**. Render builds the Dockerfile (installs WeasyPrint libs + Indic fonts), starts the API, and on boot the app auto-creates the database tables.
4. When it's live, note the URL, e.g. `https://cosmoplex-api.onrender.com`. Check `https://<that-url>/health` → should return `{"status":"ok"}`.

**Seed the course content (once):** Render → your service → **Shell**, then run the course seed script (in `backend/db/`), e.g.:
```bash
python -m db.seed_course
```

> **Plan notes:** the `free` web plan spins down when idle (breaks WebSockets) — use `starter`+ for real use. The `free` Postgres expires after ~90 days; upgrade before then.

---

## 2 — Frontend on Vercel

1. Vercel → **Add New → Project** → import the repo.
2. Set **Root Directory** to `frontend`. Framework auto-detects as Next.js.
3. Add Environment Variables (see [`frontend/.env.example`](frontend/.env.example)):
   - `NEXT_PUBLIC_API_URL` → your Render URL from step 1 (no trailing slash). The WebSocket URL (`wss://…`) is derived from this automatically.
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` → your Cloudinary cloud name.
4. **Deploy.** Note the resulting URL, e.g. `https://cosmoplex.vercel.app`.

---

## 3 — Connect the two

1. Back on Render → API service → **Environment** → set `FRONTEND_URL` to your real Vercel URL. Save (the service restarts). This is what the backend's CORS allow-list uses.
2. Reload the Vercel site, sign up, and open a lesson — the chat agents (WebSocket) and video should work end to end.

---

## Required environment variables

**Backend (Render):**
| Var | Notes |
|-----|-------|
| `ANTHROPIC_API_KEY` | required — Claude agents |
| `DATABASE_URL` | auto from Render Postgres (app rewrites it to the asyncpg driver) |
| `SECRET_KEY` | auto-generated — signs JWTs |
| `FRONTEND_URL` | your Vercel origin — CORS |
| `ENVIRONMENT` | `production` |

**Frontend (Vercel):**
| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Render backend base URL |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |

Optional (unset unless used): `GROQ_API_KEY` (voice), `FAL_API_KEY` (Illustrator images), `OPENAI_API_KEY`, `REDIS_URL`.

---

## Notes & gotchas
- **Region:** both Render services are set to `singapore` (closest low-latency region to India on Render). For Mumbai-region hosting, Fly.io is the alternative — ask and I'll generate a `fly.toml`.
- **WebSockets:** keep `numInstances: 1`. Chat sessions hold per-connection state in memory; multiple replicas would split it.
- **Certificates:** stored on the mounted disk at `/app/certificates` and served at `/certificates/...`. The disk persists them across deploys.
- **Videos:** served straight from Cloudinary, so they don't touch the backend.
