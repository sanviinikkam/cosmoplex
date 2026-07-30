# Cosmoplex — Master Handover & Operations Guide

> Owner handover doc. Everything needed to run, pay for, and scale Cosmoplex.
> Last updated: **2026-07-30**. Keep this file current as things change.
>
> ⚠️ **Secrets are NOT in this doc.** Real API keys/passwords/tokens live only in the
> Render and Vercel dashboards (Environment tabs). This doc references them by name.

---

## 1. What Cosmoplex is

A multilingual (6 Indian languages: **English, Hindi, Marathi, Telugu, Tamil, Kannada**)
AI-literacy course platform for freshers. Delivered on **two channels that share one backend**:

- **Web app** — sign up → learn (video lessons) → quiz → assignment → certificate.
- **WhatsApp bot** — onboarding → sign-up → lesson video → quiz → assignment → nudges.
- **Admin portal** (`/admin`) — manage courses, lessons, videos, quiz/assignment banks, intro videos.

Learning content, quizzes, assignments, and video IDs live in the database and are
edited from the admin portal — **one source of truth for both web and WhatsApp.**

---

## 2. Architecture & tech stack

| Layer | Tech | Hosted on |
|---|---|---|
| Frontend | Next.js 16 (App Router), React, Tailwind v4 | **Vercel** |
| Backend API | FastAPI (async), SQLAlchemy + asyncpg | **Render** (web service) |
| Database | PostgreSQL | **Neon** (serverless Postgres) |
| AI (tutor, grading, translation) | Anthropic Claude | Anthropic API |
| Voice → text | OpenAI Whisper (`whisper-large-v3`) | **Groq** API |
| Video hosting/streaming | Cloudinary (cloud: `dlpl4inio`) | Cloudinary |
| WhatsApp channel | Meta WhatsApp Cloud API | Meta / Facebook |
| Daily nudges | APScheduler (in-process, hourly) | runs inside the Render backend |

**Claude models in use** (change in `backend/agents/*` and `backend/api/*`):
- Tutor / grading / onboarding pitch / lesson-title translation → `claude-haiku-4-5` (cheap)
- Examiner / illustrator / task-assigner / admin bulk-import → `claude-sonnet-4-6`
- ⚠️ Never use the dated snapshot `claude-haiku-4-5-20251001` — it does not resolve.

**Live URLs**
- Web: `https://cosmoplex-kappa.vercel.app`
- API: `https://cosmoplex-api.onrender.com` (health check: `/health`)
- Admin: `https://cosmoplex-kappa.vercel.app/admin`
- Repo: GitHub `sanviinikkam/cosmoplex` (branch `main`; push → auto-deploys web + API)

---

## 3. Accounts & where everything lives

Fill in the **login owner / email** for each so your coworker can get access.

| Service | Used for | Dashboard | Account owner (FILL IN) |
|---|---|---|---|
| Vercel | Web hosting | vercel.com | |
| Render | Backend + scheduler | dashboard.render.com | |
| Neon | Database | console.neon.tech | |
| Anthropic | Claude AI | console.anthropic.com | |
| Groq | Voice transcription | console.groq.com | |
| Cloudinary | Video hosting | cloudinary.com (cloud `dlpl4inio`) | |
| Meta / WhatsApp | WhatsApp bot | business.facebook.com | |
| GitHub | Code | github.com/sanviinikkam/cosmoplex | |
| Domain registrar (if any) | Custom domain | (FILL IN) | |

> **Action for handover:** add your coworker as a member/collaborator on each of these,
> or transfer ownership. Then rotate any secrets that were shared informally.

---

## 4. 💰 Billing, renewals & expiry — THE KEY TABLE

Costs shown are current plan assumptions. **Signup/renewal dates only you know — fill them in.**

| Service | Current plan | Cost | Billing cadence | Signed up (FILL IN) | Next renewal / expiry (FILL IN) | Notes |
|---|---|---|---|---|---|---|
| **Vercel** | Hobby or Pro | Hobby $0 / **Pro $20/mo** | Monthly | | | ⚠️ Hobby is **non-commercial** — a paid product should be on **Pro**. |
| **Render** (web) | Free / Starter / Standard | Free $0 / Starter ~$7/mo / Standard ~$25/mo | Monthly | | | ⚠️ Free tier **sleeps** → slow first reply + hourly nudges won't run. Use paid for launch. |
| **Neon** (DB) | Free | $0 (paid ~$19/mo at scale) | Monthly (if paid) | | (free doesn't expire) | Free tier auto-sleeps but auto-wakes. **Migrated here after Render's free Postgres expired.** |
| **Anthropic** | Pay-as-you-go | Usage-based (see §6) | Prepaid credits / auto-reload | | (credits — watch balance!) | ⚠️ If credits run out, **all AI features stop**. Set auto-reload. |
| **Groq** | Free tier | $0 (pennies/hr if paid) | Usage-based | | (no expiry) | Rate-limited free tier; voice is tiny cost even paid. |
| **Cloudinary** | Free | $0 (Plus **$89/mo** at scale) | Monthly (if paid) | | (monthly credit resets) | ⚠️ Video streaming bandwidth is the **first thing to blow the free tier** at scale. |
| **Meta WhatsApp** | Cloud API | Free in-window; templates ~₹0.11 each | Per-message (templates only) | | ⚠️ **ACCESS TOKEN EXPIRY — see §5** | Service conversations (user messages first) are free. |
| **Domain** (if bought) | — | ~₹800–1,200/yr | **Annual** | | | Currently on free `*.vercel.app`. If you buy a domain, it renews yearly. |
| **GitHub** | Free | $0 | — | | | Private repo on free plan is fine. |

---

## 5. ⚠️ Things that will SILENTLY BREAK if not renewed

Read this section first. These are the traps.

1. **WhatsApp access token (`WHATSAPP_TOKEN` on Render) — HIGHEST PRIORITY.**
   - Meta's *temporary* tokens expire in **24 hours**; a *System User* token can be set to
     expire in **60 days** or **never**.
   - If it expires, **the entire WhatsApp bot goes dead** (no replies, no lessons, no nudges) with no obvious error.
   - **Action:** confirm you're using a **permanent System User token** (Meta Business Settings →
     System Users → generate token with `whatsapp_business_messaging` + `whatsapp_business_management`,
     set expiry **Never**). Document the generation date and how to regenerate.

2. **Anthropic credit balance.** Pay-as-you-go — if the balance hits zero, tutor, grading,
   translations, and pitches all fail. **Set up auto-reload** and a low-balance alert.

3. **Neon** — free tier does *not* expire (unlike the old Render Postgres that died), but it
   **auto-suspends after inactivity**; it auto-wakes on the next query (brief cold start). No action
   needed unless you exceed free storage/compute (see §6).

4. **Domain** (if you buy one) — renews **annually**. A lapsed domain takes the whole site down.
   Turn on auto-renew.

5. **WhatsApp message templates** — if you enable paid templates (`WHATSAPP_TEMPLATES_ENABLED=true`),
   each template must stay **approved** in WhatsApp Manager; Meta can pause low-quality templates.
   (Currently **off** — nudges are free, in-window only.)

---

## 6. Capacity — how many users can it handle & when you pay more

The database stores **text only** (videos are on Cloudinary), so it stays small. The real limits,
in the order you'll hit them as you grow:

| Users (active/mo) | What's fine | What needs upgrading | Approx. total cost/mo |
|---|---|---|---|
| **~100** | Everything (all free/starter tiers) | — | **~₹4,300** |
| **~500** | Neon free, Groq free | Vercel Pro, Render Starter | ~₹8–12k |
| **~1,000** | Neon free | Render **Standard**, **Cloudinary Plus ($89)** kicks in | **~₹22,000** |
| **~5,000** | Neon still free-ish | Bigger Render, more Cloudinary/CDN | ~₹80k–1L |
| **~10,000** | — | Render large + **Neon paid (~$19)** + CDN | ~₹40k+ variable + fixed |
| **~20,000** | — | Neon paid (storage ~0.5 GB free ≈ 20k users of text) | scales linearly |

**Bottleneck order (what forces the next payment):**
1. **Cloudinary bandwidth** (video streaming) — first to exhaust the free tier. → Plus $89/mo.
2. **Render compute** (concurrent WhatsApp + web traffic) — upgrade instance.
3. **Anthropic usage** — grows *linearly* with active learners (see cost model). No cliff, just adds up.
4. **Neon storage** — only around ~10–20k users, since it's text (~15–25 KB/user).

**Per-user cost** (from the Haiku cost model): roughly **₹9–13 per active learner per month**, dominated
by the Claude tutor + grading calls — **not** voice (voice ≈ ₹0.39/user) and **not** the database.

📊 **Full cost model:** `Cosmoplex_CostModel_v1_explained_fixed_haiku_voice.xlsx` (in Downloads).
Edit the blue cells (active learners, USD→INR rate) and every number recalculates.

---

## 7. Future purchases checklist (in likely order)

1. **Vercel Pro ($20/mo)** — required the moment this is a commercial product (Hobby forbids it).
2. **Render Starter → Standard ($7 → $25/mo)** — do Starter now for launch (stops sleeping); Standard at ~1k users.
3. **Custom domain (~₹1,000/yr)** — for a professional URL instead of `*.vercel.app`.
4. **Anthropic credits** — prepay + auto-reload; scales with users.
5. **Cloudinary Plus ($89/mo)** — when free video bandwidth runs out (~1k active users).
6. **Neon paid (~$19/mo)** — around 10k+ users.
7. **Meta Business Verification** — required to raise WhatsApp messaging limits (see §11).

---

## 8. Secrets & environment variables (names only — values in dashboards)

**Render (backend)** — Environment tab:
`ANTHROPIC_API_KEY`, `DATABASE_URL` (→ Neon), `GROQ_API_KEY`, `SECRET_KEY`,
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `GRAPH_API_VERSION`,
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`WHATSAPP_TEMPLATES_ENABLED` (currently `false`), `ADMIN_PASSWORD`, `ENVIRONMENT=production`,
`FRONTEND_URL`. (Optional/unused: `REDIS_URL`, `FAL_API_KEY`, `OPENAI_API_KEY`.)

**Vercel (frontend)** — Environment Variables:
`NEXT_PUBLIC_API_URL` (→ the Render API URL), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (`dlpl4inio`).

**WhatsApp identifiers** (not secret, useful for reference):
- Business number: **+91 72044 19938**
- Phone number ID: `1280178535171503`
- WhatsApp Business Account (WABA) ID: `1687271549060074`
- Webhook URL (set in Meta): `https://cosmoplex-api.onrender.com/whatsapp/webhook`
- Webhook verify token: the value of `WHATSAPP_VERIFY_TOKEN` (must match in Meta + Render).

> **Rule:** never commit secrets to git (`.env` is gitignored). If a key is ever exposed, rotate it
> in the provider dashboard immediately.

---

## 9. Deploy & release process

- **Everything auto-deploys from the `main` branch** on GitHub:
  - Push to `main` → **Render** rebuilds the API, **Vercel** rebuilds the web app (~1–5 min each).
- **Verify a backend deploy landed:** `GET /health` returns a `build` marker (a short string bumped
  on each backend change) plus a live **DB check** (`db.connected`, course/intro-video counts).
  Example: `curl https://cosmoplex-api.onrender.com/health`
- Local dev: backend `uvicorn main:app --reload` (from `backend/`), frontend `npm run dev` (from `frontend/`).
  Local uses a local Postgres; production uses Neon (driver + SSL handled automatically).

---

## 10. Managing content (admin portal)

Go to `/admin`, log in with `ADMIN_PASSWORD`.

- **Courses → Modules → Sections → Lessons** hierarchy. Add/edit/delete each.
- **Lesson videos:** upload a **Default video** and/or **per-language** videos (uploads go straight to
  Cloudinary). Click any video's Cloudinary ID to **preview** it.
- **Quiz & assignment banks per lesson:** add manually, or **Bulk add** — upload a `.docx`/`.txt`
  (or paste) and AI extracts every question and **translates it into all 6 languages**.
- **Intro videos** (WhatsApp onboarding): set a **Default** + optional per-language versions.
- **"Sync existing content"** button: re-imports known video IDs + legacy quiz/assignment banks
  (useful after a DB reset).

> WhatsApp and web both read this DB, so an admin change shows on **both** channels.
> WhatsApp delivers lessons **in course order**, skipping any lesson that has no video in the
> learner's language (so upload every language you want live).

---

## 11. WhatsApp specifics

- **Flow:** language pick → name → brief + intro video → profile + goal questions → ₹499 limited-time
  free offer → **Sign up → confirm number → Start course** → lesson video → quiz (pass 3/5) →
  assignment (submit button, multi-message answer, pass **60/100**) → done.
- **Voice notes** work (Groq Whisper) — transcribed then handled like text. Needs `GROQ_API_KEY`.
- **Nudges (drip):** run **hourly** (in-process scheduler). Currently **free-text, in-window only**
  (`WHATSAPP_TEMPLATES_ENABLED=false`) → ₹0. They fire 2–6h after a learner goes quiet, capped at
  ~3/day with one repeat. To re-engage learners idle **>24h**, you must enable approved **templates**
  (paid ~₹0.11 each) and set the flag `true`.
- **If Render sleeps** (free tier), the hourly scheduler won't fire — add a **Render Cron Job** hitting
  `GET /whatsapp/run-drip?key=<WHATSAPP_VERIFY_TOKEN>` hourly, or upgrade Render.
- **Meta messaging limits (scaling):** new numbers start at **250–1,000 unique users/day**. They rise
  (1K → 10K → 100K → unlimited) automatically with good "quality rating," **but you must complete
  Meta Business Verification** to go past the low tiers. Do this before a big push.

**Useful endpoints (all guarded by `WHATSAPP_VERIFY_TOKEN` as `?key=`):**
- `GET /health` — status, build marker, DB health.
- `GET /whatsapp/run-drip?key=…` — run the nudge pass now (`&to=<num>&force_key=<nudge>` to test one).
- `GET /whatsapp/diag?key=…&lang=hi` — check a language's intro + Lesson-1 video (resolves, downloads, uploads).

---

## 12. Common tasks & troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| WhatsApp bot totally silent | `WHATSAPP_TOKEN` expired | Regenerate a permanent System User token in Meta; update Render env. |
| AI replies/grading fail | Anthropic credits empty, or bad model ID | Top up credits; check model IDs (§2). |
| Voice notes get no reply | `GROQ_API_KEY` missing/limited | Set/verify key on Render; check Render logs for `⚠ voice:`. |
| A language shows the wrong Lesson 1 | No video for that language on the earlier lesson | Upload that lesson's video for that language in `/admin`. |
| Videos won't play in WhatsApp | Cloudinary ID missing, or file >16 MB after transform | Check `/whatsapp/diag`; re-upload; videos auto-compress on send. |
| Web shows old data | Vercel cache / deploy not finished | Wait for Vercel deploy; hard refresh. |
| DB errors after any DB change | Wrong `DATABASE_URL` | Must be the Neon **direct** connection string; `/health` shows `db.connected`. |
| Nudges not sending | Templates off + everyone idle >24h, or Render asleep | Expected for free mode; add cron / upgrade Render; or enable templates. |

**Logs:** Render dashboard → the service → **Logs**. The code prints clear `✓`/`⚠` lines for video,
voice, grading, and drip.

---

## 13. Known gaps / to-do

- [ ] Upload **English + Marathi** "Welcome" (Lesson 1.1) videos — those two languages currently skip it.
- [ ] Confirm **WhatsApp token is permanent** (§5.1) — do this first.
- [ ] Move Render off the **sleeping free tier** for reliable nudges + fast replies.
- [ ] Set up **Anthropic auto-reload** + low-balance alert.
- [ ] Decide on **custom domain** (update `SITE_URL` in `frontend/app/layout.tsx` and `FRONTEND_URL` if so).
- [ ] Complete **Meta Business Verification** before scaling WhatsApp volume.
- [ ] Landing page still shows "12+ languages" / "4.8k learners certified" — update when convenient
  (`frontend/app/page.tsx`).
- [ ] Temporary `/whatsapp/diag` endpoint is deployed for debugging — safe (token-guarded) but can be removed later.

---

## 14. Repo map (where to change what)

```
backend/
  main.py                     app startup, migrations, /health, hourly scheduler
  core/config.py              all settings / env var names (+ DB URL normalization)
  db/models.py                database tables (SQLAlchemy)
  db/seed_course.py           seeds the base course on startup
  api/whatsapp_routes.py      WhatsApp webhook + full conversation flow
  api/whatsapp_content.py     all WhatsApp copy in 6 languages (offer, buttons, quiz, etc.)
  api/whatsapp_drip.py        nudge/drip engine (rules + copy)
  api/admin_routes.py         admin portal API (CRUD, bulk import, intro videos)
  api/course_routes.py        web course delivery API
  agents/                     Claude agents (teacher, examiner, grader, etc.)
frontend/
  app/layout.tsx              site metadata / SEO / social share
  app/page.tsx                marketing landing page
  app/(app)/course/...        the learning experience (video, quiz, assignment)
  app/admin/page.tsx          admin portal UI
  lib/admin-api.ts            admin API client
```

---

*Questions during handover: read `/health` first, then the Render logs. Most issues trace back to
§5 (something expired) or a missing env var.*
