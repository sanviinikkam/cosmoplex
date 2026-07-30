# Cosmoplex — Go-Live Checklist (Security, Reliability, Privacy, Abuse)

> Pre-launch hardening + operational readiness. Priorities: **P0** = must fix before launch,
> **P1** = within the first days, **P2** = soon after. Status reflects the code as of 2026-07-30.
> Pair with `HANDOVER.md` (ops) and `CLAUDE.md` (project context).

---

## 1. Security

- [ ] **P0 — WhatsApp token is permanent.** Confirm `WHATSAPP_TOKEN` is a System User token set to
  never expire. A temporary token silently kills the whole bot. (See HANDOVER §5.)
- [ ] **P0 — Rotate any secret shared informally** during handover; set new values in Render/Vercel.
- [x] Secrets are gitignored (`.env`, `.env.*`); only `.env.example` is committed. ✅
- [ ] **P1 — Verify the inbound WhatsApp webhook signature** (`X-Hub-Signature-256` using the Meta
  App Secret). Right now `POST /whatsapp/webhook` trusts any JSON it receives — an attacker who
  learns the URL could POST fake "messages" and burn Anthropic/Groq spend. Validate the HMAC.
- [ ] **P0 — Strong `ADMIN_PASSWORD`.** The whole admin portal is one shared password. Use a long
  random value; change the default; consider per-person accounts later.
- [x] Admin API routes are auth-guarded (`require_admin`), Cloudinary upload is signed server-side. ✅
- [x] Diagnostic/ops endpoints (`/run-drip`, `/diag`) require the verify-token key. ✅
- [ ] **P1 — Restrict CORS** on the FastAPI backend to your Vercel domain(s) only (verify it isn't `*`).
- [ ] **P1 — Remove or keep-gated the temporary `/whatsapp/diag`** endpoint (debug tool).
- [x] SQL uses SQLAlchemy parameterized queries (no string-built SQL → injection-safe). ✅
- [x] TLS everywhere: HTTPS (Vercel/Render) + SSL to Neon. ✅
- [ ] **P2 — Prompt-injection hardening.** Users can try to make the tutor/grader go off-topic or
  inflate their own grade. Keep the grader's rubric authoritative and never let user text override
  system instructions (treat learner input as data, not commands).
- [ ] **P2 — Never log secrets/PII.** Audit `print`/logs for tokens, phone numbers, answers.

## 2. Abuse & rate limiting (flood / cost protection)

- [ ] **P0 — Per-user rate limit on WhatsApp.** Today there is **no throttle** — one person (or a
  script) can send hundreds of messages, each potentially triggering a paid Claude call
  (grading/tutor). Add: max N messages/min and a daily cap per phone; beyond it, a polite
  "you're going too fast" reply with no AI call.
- [ ] **P1 — Global spend circuit-breaker.** A daily ceiling on Anthropic/Groq calls; when hit, fall
  back to canned replies instead of unbounded spend.
- [ ] **P1 — Cap AI work per action.** Assignment answers are capped at 8k chars (✅ done); also cap
  tutor-chat length and how many gradings/tutor calls one user can trigger per day.
- [x] Inbound message-ID dedupe prevents Meta retries from double-charging. ✅
- [ ] **P1 — Bulk-import guardrails (admin).** The doc→Claude import is admin-only (✅) but add a
  size/question-count cap so a huge upload can't run away on tokens.
- [ ] **P2 — Bot-detection / suspicious-pattern alerts** (e.g., one number blasting the webhook).

## 3. Content moderation & profanity

- [ ] **P0 — Filter abusive/profane learner input** before it hits the AI or gets stored. Add a
  moderation step on assignment answers + free-text: if abusive, respond with a warning and skip
  grading/tutor. (Cheap keyword/regex list per language now; upgrade to a moderation model later.)
- [ ] **P1 — Guard the AI's output.** Instruct all agents to refuse off-topic / unsafe requests and
  stay on AI-literacy; verify the grader can't be talked into a passing score by the answer text.
- [ ] **P2 — Profanity in names.** The onboarding name is echoed back in every message — filter it so
  a slur can't become "{name}".
- [ ] **P2 — Report/appeal path** for a learner who thinks grading was wrong.

## 4. Reliability

- [ ] **P0 — Render off the sleeping free tier** (or an uptime cron pinging `/health` every ~10 min).
  Otherwise: slow first reply, Meta timeouts, and the hourly nudge scheduler won't fire.
- [ ] **P0 — Anthropic credit auto-reload + low-balance alert.** Empty credits = all AI dead.
- [ ] **P1 — Database backups.** Neon free has limited history; enable/verify backups (or schedule a
  daily `pg_dump`) so learner progress is recoverable.
- [ ] **P1 — Uptime + error monitoring.** External uptime check on `/health`; alerting on 5xx / drip
  errors (e.g., an error tracker or a simple log alert).
- [x] Webhook fast-ACKs then processes in the background (no Meta timeouts from slow AI). ✅
- [x] Graceful degradation: grading + voice have fallbacks; startup DB errors don't crash boot. ✅
- [x] `/health` reports build marker + live DB check (connectivity + counts). ✅
- [ ] **P1 — Quota monitoring:** Cloudinary bandwidth, WhatsApp messaging tier, Groq/Anthropic usage.
- [ ] **P2 — Deploy safety.** You push straight to `main` → prod. Consider a staging branch/preview
  before big changes; keep the ability to roll back (Render/Vercel keep prior deploys).

## 5. Data privacy & compliance

- [ ] **P0 — Privacy Policy + Terms (public URLs).** Required for a real product **and** by Meta for
  WhatsApp. Must state what you collect (phone, name, goal, answers), why, retention, and contact.
- [ ] **P0 — WhatsApp opt-in.** Meta requires users to have opted in to receive messages; nudges to
  users who didn't opt in risk your number's quality rating / ban. Log how each user opted in.
- [ ] **P1 — India DPDP alignment.** You store PII of Indian users (phone, name, goal, submissions).
  Have a lawful basis, a deletion/"forget me" path, and note data location (Neon region).
- [ ] **P1 — Data deletion flow.** A way to delete a learner's data on request (WhatsApp session +
  profile + submissions).
- [x] Data encrypted in transit (TLS) and at rest (Neon/Cloudinary managed). ✅
- [ ] **P2 — Data minimization + retention.** Don't keep chat transcripts you don't need; set a
  retention window; prune old `agent_events`/logs.
- [ ] **P2 — Access control review.** Confirm a learner's JWT can only read/write their **own** data.

## 6. System-flow integrity

- [ ] **P0 — Content gaps: upload missing lesson videos.** Only **Hindi is complete (10/10)**. English
  = 1/10, Telugu/Marathi = 3/10, Tamil/Kannada = 8/10. Launch only the languages that are ready, or
  fill the gaps in the admin portal. (See the per-language matrix from the diagnostic.)
- [x] Lessons/quizzes/assignments are one DB source of truth for web + WhatsApp. ✅
- [x] Quiz option positions are shuffled (correct answer not always in slot 2). ✅
- [x] Assignment pass = 60/100; multi-message answer + Submit button. ✅
- [x] Lesson progression (next-lesson choice / auto-resume) works. ✅
- [ ] **P1 — Certificate integrity.** Verify the completion gate is deterministic (DB-checked, not
  AI-decided) and the verify URL can't be forged/guessed.
- [ ] **P1 — Payment (if enabling).** Course is free now; if you add Razorpay, never handle card data
  yourself — use their hosted checkout, verify webhooks/signatures.

## 7. WhatsApp / Meta specifics

- [ ] **P0 — Business verification** submitted (needed to raise messaging limits past the low tier).
- [ ] **P0 — Message templates approved** (only needed if you enable out-of-window nudges;
  `WHATSAPP_TEMPLATES_ENABLED` is currently `false` → free in-window only).
- [ ] **P1 — Monitor number quality rating** in WhatsApp Manager; spammy nudges can get it flagged.
- [x] Nudges are in-window free-text, capped (~3/day + one repeat), no food refs. ✅

## 8. Launch-day runbook

- [ ] Final env-var check on Render + Vercel (all keys present, `WHATSAPP_TEMPLATES_ENABLED=false`).
- [ ] `curl /health` → `db.connected: true`, expected build marker.
- [ ] One full dry-run per **ready** language: web (signup→lesson→quiz→assignment→certificate) and
  WhatsApp (language→signup→lesson→quiz→assignment→next-lesson).
- [ ] Send yourself a nudge test (`/run-drip?...&to=<you>&force_key=start_lesson`).
- [ ] Confirm the shareable `wa.me` link opens with the right prefilled text.
- [ ] Watch Render logs live for the first real users.

---

### Suggested order for the code-level P0/P1s I can implement
1. **Per-user rate limiting** on the WhatsApp webhook (flood + cost protection).
2. **Profanity/abuse filter** on learner input (skip AI, warn politely) — all 6 languages.
3. **Meta webhook signature verification** (reject spoofed POSTs).
4. **Global daily spend circuit-breaker** on AI calls.

The rest (privacy policy, Meta verification, Render tier, backups, content uploads) are
account/business actions for you + your coworker.
