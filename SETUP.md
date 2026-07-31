# Cosmoplex — Local Setup (from scratch)

Step-by-step to get the project running on a fresh machine. Windows commands shown;
Mac/Linux equivalents are noted inline. Pair with `HANDOVER.md` and `GO_LIVE_CHECKLIST.md`.

> You'll need **dashboard access** (Render, Vercel, Neon, Anthropic) for the real secret
> values — ask the previous owner to add you. Secrets are **not** in the repo.

---

## 0. Install prerequisites

| Tool | Version | Get it |
|---|---|---|
| **Git** | any | git-scm.com |
| **Python** | 3.12.x | python.org (tick "Add Python to PATH" on Windows) |
| **Node.js** | 20+ (LTS) | nodejs.org (includes npm) |
| **PostgreSQL** | 16+ *(optional, for a local DB)* | postgresql.org |

Verify:
```bash
git --version
python --version
node --version
npm --version
```

---

## 1. Get the code (clone — not "Download ZIP")

You're a collaborator, so clone (this keeps git history + lets you push/deploy):
```bash
git clone https://github.com/sanviinikkam/cosmoplex.git
cd cosmoplex
```

---

## 2. Backend (FastAPI + Python)

```bash
cd backend

# create + activate a virtual environment
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Mac/Linux

# install dependencies
pip install -r requirements.txt
```

### 2a. Create `backend/.env`
Copy the template and fill in values from the **Render dashboard** (Environment tab):
```bash
copy .env.example .env           # Windows   (Mac/Linux: cp .env.example .env)
```
Minimum to boot:
- `ANTHROPIC_API_KEY` — **required**, the server won't start without it.
- `DATABASE_URL` — a Postgres URL (see 2b).

Optional (features degrade gracefully if missing): `GROQ_API_KEY` (voice),
`WHATSAPP_*` (WhatsApp bot), `CLOUDINARY_*` (video uploads), `ADMIN_PASSWORD` (admin portal).

### 2b. Pick a database (do NOT point local dev at production)
Choose one:
- **Local Postgres:** create a db, set
  `DATABASE_URL=postgresql://postgres:<pwd>@localhost:5432/cosmoplex`
- **Your own free Neon project** (neon.tech) — copy its connection string. Easiest, no install.

On first run the app **auto-creates tables and seeds the base course**, so an empty DB is fine.

### 2c. Run the backend
```bash
uvicorn main:app --reload
```
- Runs at `http://localhost:8000`
- Check `http://localhost:8000/health` → should show `db.connected: true`.

---

## 3. Frontend (Next.js)

Open a **second terminal**:
```bash
cd cosmoplex/frontend
npm install
```

### 3a. Create `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dlpl4inio
```
*(Point `NEXT_PUBLIC_API_URL` at `http://localhost:8000` for local dev, or the Render API URL to use the live backend.)*

### 3b. Run the frontend
```bash
npm run dev
```
- Runs at `http://localhost:3000`
- Admin portal: `http://localhost:3000/admin` (log in with `ADMIN_PASSWORD`).

---

## 4. Verify it works
1. Backend `http://localhost:8000/health` → `status: ok`, `db.connected: true`.
2. Web app `http://localhost:3000` → landing page loads.
3. Sign up / log in → see the course.
4. Admin `http://localhost:3000/admin` → manage courses/videos/quizzes.

---

## 5. Get access to the live services (for the real values + deploys)
Ask to be added to each; the secret values live in these dashboards, not the repo:

| Service | For |
|---|---|
| Render | backend hosting + env vars + logs |
| Vercel | frontend hosting + env vars |
| Neon | production database |
| Anthropic | Claude API key + billing |
| Groq | voice transcription key |
| Cloudinary | video hosting (cloud `dlpl4inio`) |
| Meta / WhatsApp | the WhatsApp bot |

---

## 6. How deploying works
- Push to the **`main`** branch → **Render** (backend) and **Vercel** (frontend) **auto-deploy** (~1–5 min).
- Confirm a backend deploy with `GET /health` (it returns a `build` marker that changes each deploy).
- Prefer a branch + PR for big changes; both hosts keep previous deploys so you can roll back.

---

## 7. Read next
- **`HANDOVER.md`** — architecture, billing/renewals, capacity, secrets map. **Read §5 first** (things that silently expire — the WhatsApp token especially).
- **`GO_LIVE_CHECKLIST.md`** — security, abuse, privacy, reliability tasks.
- The GitHub **Wiki** — Architecture, Admin Guide, Runbook.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| Backend won't start | `ANTHROPIC_API_KEY` missing in `.env`; or the DB isn't reachable. |
| `/health` shows `db.connected: false` | Wrong/empty `DATABASE_URL`; DB not running. |
| `venv\Scripts\activate` blocked (Windows) | Run PowerShell as admin once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| Frontend can't reach API | `NEXT_PUBLIC_API_URL` wrong, or backend not running on :8000. |
| Voice/WhatsApp/uploads don't work locally | Those env vars aren't set — fine for local web dev. |
