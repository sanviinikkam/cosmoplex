"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminApi, uploadMediaToCloudinary, getAdminToken, clearAdminToken,
  LANGUAGES, type AdminCourse, type AdminVideo, type QuizItem, type AssignmentItem,
  type IntroVideoItem, type AdminDashboard, type WaDetail, type WebDetail, type ReferralsData,
  type WaTranscript,
  type WebLearnerRow, type WaSessionRow, type MarketingAssetRow, type SystemCheck,
  type CampaignRow, type UserFilters, type UserFacets,
  getAdminRole, type AdminRole,
} from "@/lib/admin-api";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dlpl4inio";
function cloudinaryVideoUrl(publicId: string): string {
  // Downscaled for a quick preview; the original stays untouched.
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_640,q_auto/${publicId}.mp4`;
}

// Modal that plays an uploaded Cloudinary video.
function VideoPreviewModal({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-3 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs text-zinc-500 truncate">{publicId}</span>
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-800 shrink-0">✕ Close</button>
        </div>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={cloudinaryVideoUrl(publicId)} controls autoPlay
          className="w-full rounded-lg bg-black max-h-[70vh]" />
        <a href={cloudinaryVideoUrl(publicId)} target="_blank" rel="noreferrer"
          className="text-xs text-emerald-700 hover:underline mt-2 inline-block">Open in new tab ↗</a>
      </div>
    </div>
  );
}

// A Cloudinary public ID rendered as a clickable link that previews the video.
function PreviewableId({ publicId, className }: { publicId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" title="Click to preview the video" onClick={() => setOpen(true)}
        className={`text-left text-emerald-700 hover:underline ${className ?? ""}`}>
        {publicId}
      </button>
      {open && <VideoPreviewModal publicId={publicId} onClose={() => setOpen(false)} />}
    </>
  );
}

// Small spinner used everywhere something is loading/saving, so it's never silent.
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthed(!!getAdminToken());
    setChecking(false);
  }, []);

  if (checking) return null;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { clearAdminToken(); setAuthed(false); }} />;
}

// ── Login ────────────────────────────────────────────────────────────────────
const LOGIN_ROLES: { key: AdminRole; label: string; blurb: string }[] = [
  { key: "super", label: "Super admin", blurb: "Everything, including settings and team logins" },
  { key: "content", label: "Content admin", blurb: "Courses, videos, quizzes and all uploads" },
  { key: "marketing", label: "Marketing admin", blurb: "Campaigns, learners and referrals" },
];

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [role, setRole] = useState<AdminRole>("super");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      // The chosen role goes to the server, which checks only that role's
      // password. Picking the wrong one fails even with a valid password —
      // deliberate, so you always get the account you asked for.
      await adminApi.login(password, role);
      onSuccess();
    } catch {
      setError("Incorrect password for this login.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-semibold">Cosmoplex Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Choose your login, then enter its password.</p>
        </div>

        <div className="flex flex-col gap-2">
          {LOGIN_ROLES.map((r) => {
            const on = role === r.key;
            return (
              <button
                key={r.key} type="button" onClick={() => { setRole(r.key); setError(""); }}
                aria-pressed={on}
                className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  on ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30"
                     : "border-zinc-200 hover:border-zinc-300"}`}>
                <div className={`text-sm font-medium ${on ? "text-emerald-800" : "text-zinc-800"}`}>{r.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{r.blurb}</div>
              </button>
            );
          })}
        </div>

        <input
          type="password" value={password} autoFocus
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`${LOGIN_ROLES.find((r) => r.key === role)?.label} password`}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy || !password}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors inline-flex items-center justify-center gap-2">
          {busy && <Spinner className="w-4 h-4" />}
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ── System status ─────────────────────────────────────────────────────────────
function StatTile({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className={`text-2xl font-semibold tabular-nums ${accent ?? "text-zinc-800"}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function Pills({ data }: { data?: Record<string, number> }) {
  const entries = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <span className="text-xs text-zinc-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="text-xs rounded-md bg-zinc-100 text-zinc-700 px-2 py-0.5">
          {k} <span className="font-semibold tabular-nums">{v}</span>
        </span>
      ))}
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  // The backend stores UTC (datetime.utcnow) and serializes with a naive
  // isoformat() — no trailing "Z" or offset. A bare timestamp is parsed as
  // *local* time by the browser, which skews "ago" by the local UTC offset
  // (e.g. −5:30 in IST). Treat a marker-less timestamp as UTC.
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const t = new Date(hasTz ? iso : iso + "Z").getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
      <div className={`h-full ${color ?? "bg-emerald-500"}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="text-sm text-zinc-800 mt-0.5">{value === null || value === undefined || value === "" ? "—" : value}</div>
    </div>
  );
}

function UserDetailModal({ sel, onClose }: { sel: { kind: "wa" | "web"; id: string }; onClose: () => void }) {
  const [wa, setWa] = useState<WaDetail | null>(null);
  const [web, setWeb] = useState<WebDetail | null>(null);
  const [tx, setTx] = useState<WaTranscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(""); setWa(null); setWeb(null); setTx(null);
      try {
        if (sel.kind === "wa") {
          const d = await adminApi.whatsappDetail(sel.id); if (alive) setWa(d);
          // Transcript is best-effort — don't fail the whole modal if it errors.
          try { const t = await adminApi.whatsappMessages(sel.id); if (alive) setTx(t); } catch { /* ignore */ }
        } else { const d = await adminApi.learnerDetail(sel.id); if (alive) setWeb(d); }
      } catch (e) { if (alive) setErr(e instanceof Error ? e.message : "Failed to load user"); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [sel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 sticky top-0 bg-white">
          <h3 className="font-semibold">Learner detail</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400 py-6"><Spinner className="w-4 h-4" /> Loading…</div>
          ) : err ? (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{err}</div>
          ) : wa ? (
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold">{wa.name}</span>
                  <span className="text-sm text-zinc-400">{wa.phone}</span>
                  <span className="text-xs rounded bg-emerald-50 text-emerald-700 px-2 py-0.5">WhatsApp</span>
                  <span className="text-xs rounded bg-zinc-100 text-zinc-700 px-2 py-0.5">stage: {wa.stage}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-zinc-500">Course progress</span>
                  <span className="font-semibold tabular-nums">{wa.lesson.percent}%</span>
                </div>
                <Bar pct={wa.lesson.percent} />
                <div className="text-xs text-zinc-500 mt-1.5">
                  {wa.lesson.completed} of {wa.lesson.total} lessons completed
                  {wa.lesson.label && <> · currently on <span className="font-medium text-zinc-700">{wa.lesson.label} {wa.lesson.title}</span></>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Language" value={wa.language} />
                <Field label="Profile" value={wa.currentStatus} />
                <Field label="Quiz (this attempt)" value={`${wa.quiz.correct}/${wa.quiz.index || 0} correct`} />
                <Field label="Nudges sent" value={wa.nudgesSent} />
                <Field label="Joined" value={wa.createdAt ? new Date(wa.createdAt).toLocaleDateString() : null} />
                <Field label="Last active" value={timeAgo(wa.lastActive)} />
              </div>
              {wa.goal && <Field label="Their goal" value={wa.goal} />}

              {/* Full conversation transcript */}
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5">
                  Conversation{tx && tx.total > tx.shown ? ` · showing last ${tx.shown} of ${tx.total}` : tx ? ` · ${tx.total} messages` : ""}
                </div>
                {!tx ? (
                  <div className="text-xs text-zinc-400">Loading transcript…</div>
                ) : tx.messages.length === 0 ? (
                  <div className="text-xs text-zinc-400">No messages logged yet.</div>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 max-h-72 overflow-y-auto flex flex-col gap-2">
                    {tx.messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                          m.role === "user" ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm"}`}>
                          {m.content || <span className="italic opacity-60">[{m.type}]</span>}
                          <div className={`text-[9px] mt-0.5 ${m.role === "user" ? "text-emerald-100" : "text-zinc-400"}`}>
                            {m.at ? new Date(m.at + "Z").toLocaleString() : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : web ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold">{web.name ?? "—"}</span>
                <span className="text-xs rounded bg-indigo-50 text-indigo-700 px-2 py-0.5">Web</span>
                {web.isTest && <span className="text-xs rounded bg-amber-100 text-amber-700 px-2 py-0.5">test</span>}
                {web.certificate && <span className="text-xs rounded bg-emerald-50 text-emerald-700 px-2 py-0.5">certified ✓</span>}
              </div>
              <div className="text-sm text-zinc-500 -mt-2">{web.email}</div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-zinc-500">Course progress</span>
                  <span className="font-semibold tabular-nums">{web.lesson.percent}%</span>
                </div>
                <Bar pct={web.lesson.percent} color="bg-indigo-500" />
                <div className="text-xs text-zinc-500 mt-1.5">
                  {web.lesson.completed} of {web.lesson.total} lessons completed
                  {web.lesson.label && <> · currently on <span className="font-medium text-zinc-700">{web.lesson.label} {web.lesson.title}</span></>}
                  {web.lesson.lastWatched && <> · last watched {timeAgo(web.lesson.lastWatched)}</>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Language" value={web.language} />
                <Field label="Current module" value={web.currentModule} />
                <Field label="Exams passed" value={`${web.exams.passed}/${web.exams.attempts}`} />
                <Field label="Best exam score" value={web.exams.bestScore} />
                <Field label="Assignments submitted" value={web.assignments.submitted} />
                <Field label="Total score" value={web.totalScore} />
              </div>
              {web.exams.recent.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5">Recent exams</div>
                  <ul className="flex flex-col gap-1 text-sm">
                    {web.exams.recent.map((e, i) => (
                      <li key={i} className="flex justify-between border-b border-zinc-100 pb-1">
                        <span className="text-zinc-700">{e.module}</span>
                        <span className="tabular-nums text-zinc-500">{e.score ?? "—"} {e.passed ? "✓" : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {web.assignments.recent.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5">Recent assignments</div>
                  <ul className="flex flex-col gap-1 text-sm">
                    {web.assignments.recent.map((a, i) => (
                      <li key={i} className="flex justify-between border-b border-zinc-100 pb-1">
                        <span className="text-zinc-700">{a.lesson ?? "—"}</span>
                        <span className="tabular-nums text-zinc-500">{a.score ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── One-click health check across all systems ────────────────────────────────
function SystemCheckPanel() {
  const [data, setData] = useState<SystemCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true); setErr("");
    try { setData(await adminApi.systemCheck()); }
    catch (e) { setErr(e instanceof Error ? e.message : "Health check failed"); }
    finally { setLoading(false); }
  }

  const dot = (s: string) => s === "ok" ? "bg-emerald-500" : s === "warn" ? "bg-amber-500" : "bg-red-500";

  return (
    <section className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Health check</h2>
          <p className="text-sm text-zinc-500">Verify every system — DB, Claude, Groq, WhatsApp, Cloudinary, scheduler.</p>
        </div>
        <button onClick={run} disabled={loading}
          className="text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0">
          {loading ? <Spinner className="w-3.5 h-3.5" /> : "🩺"} Run health check
        </button>
      </div>

      {err && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{err}</div>}

      {data && (
        <div className="flex flex-col gap-3">
          <div className={`rounded-lg px-4 py-2 text-sm font-medium border ${
            data.overall === "ok" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : data.overall === "warn" ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-red-50 text-red-700 border-red-200"}`}>
            {data.overall === "ok" ? "✅ All systems operational"
              : data.overall === "warn" ? "⚠️ Operational — with warnings"
              : "❌ Problems detected — action needed"}
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
            {data.checks.map((c) => (
              <div key={c.key} className="flex items-start gap-3 px-4 py-2.5">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot(c.status)}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-800">{c.label}</div>
                  <div className="text-xs text-zinc-500">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-zinc-400">
            Checked {data.generatedAt ? new Date(data.generatedAt + "Z").toLocaleString() : "—"} · env: {data.environment}
          </div>
        </div>
      )}
      {!data && !loading && !err && (
        <p className="text-sm text-zinc-400">Tap “Run health check” to test every connected system.</p>
      )}
    </section>
  );
}

function SystemStatus() {
  const [sel, setSel] = useState<{ kind: "wa" | "web"; id: string } | null>(null);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { setData(await adminApi.dashboard()); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load status"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const wa = data?.whatsapp ?? {};
  const web = data?.web ?? {};
  const c = data?.content ?? {};

  return (
    <section className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">System status</h2>
          <p className="text-sm text-zinc-500">Live snapshot of users, activity, and content.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-white disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Spinner className="w-3.5 h-3.5" /> : "⟳"} Refresh
        </button>
      </div>

      {err && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{err}</div>}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-6"><Spinner className="w-4 h-4" /> Loading…</div>
      ) : data ? (
        <div className="flex flex-col gap-5">
          {/* WhatsApp */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700 mb-2">WhatsApp learners</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Total users" value={wa.total ?? 0} accent="text-emerald-700" />
              <StatTile label="Active · 24h" value={wa.active24h ?? 0} />
              <StatTile label="Active · 7d" value={wa.active7d ?? 0} />
              <StatTile label="Completed course" value={wa.completed ?? 0} />
            </div>
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div><div className="text-xs text-zinc-500 mb-1.5">By stage</div><Pills data={wa.byStage} /></div>
              <div><div className="text-xs text-zinc-500 mb-1.5">By language</div><Pills data={wa.byLanguage} /></div>
            </div>
          </div>

          {/* Web */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-indigo-700 mb-2">Web learners</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Total learners" value={web.total ?? 0} accent="text-indigo-700" />
              <StatTile label="Started learning" value={web.withProgress ?? 0} />
              <StatTile label="Certificates" value={web.certificates ?? 0} />
              <StatTile label="Test accounts" value={web.testAccounts ?? 0} />
            </div>
            <div className="mt-3"><div className="text-xs text-zinc-500 mb-1.5">By language</div><Pills data={web.byLanguage} /></div>
          </div>

          {/* Content */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">Content in the system</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <StatTile label="Courses" value={c.courses ?? 0} />
              <StatTile label="Modules" value={c.modules ?? 0} />
              <StatTile label="Sections" value={c.sections ?? 0} />
              <StatTile label="Videos" value={c.videos ?? 0} />
              <StatTile label="Quizzes" value={c.quizzes ?? 0} />
              <StatTile label="Assignments" value={c.assignments ?? 0} />
            </div>
          </div>

          {/* Recent activity */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <div className="text-xs text-zinc-500 mb-2">Recent WhatsApp activity</div>
              <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">User</th>
                      <th className="text-left font-medium px-3 py-2">Stage</th>
                      <th className="text-left font-medium px-3 py-2">Lang</th>
                      <th className="text-right font-medium px-3 py-2">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(wa.recent ?? []).map((r, i) => (
                      <tr key={i} onClick={() => { if (canOpenLearner()) setSel({ kind: "wa", id: r.id }); }}
                        className="border-t border-zinc-100 cursor-pointer hover:bg-zinc-50">
                        <td className="px-3 py-2"><span className="font-medium">{r.name}</span> <span className="text-zinc-400 text-xs">{r.phone}</span></td>
                        <td className="px-3 py-2"><span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{r.stage}</span></td>
                        <td className="px-3 py-2 text-zinc-600">{r.language ?? "—"}</td>
                        <td className="px-3 py-2 text-right text-zinc-500 text-xs whitespace-nowrap">{timeAgo(r.lastActive)}</td>
                      </tr>
                    ))}
                    {!(wa.recent ?? []).length && <tr><td colSpan={4} className="px-3 py-4 text-center text-zinc-400 text-sm">No sessions yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-2">Recent web signups</div>
              <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Learner</th>
                      <th className="text-left font-medium px-3 py-2">Lang</th>
                      <th className="text-center font-medium px-3 py-2">Cert</th>
                      <th className="text-right font-medium px-3 py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(web.recent ?? []).map((r, i) => (
                      <tr key={i} onClick={() => { if (canOpenLearner()) setSel({ kind: "web", id: r.id }); }}
                        className="border-t border-zinc-100 cursor-pointer hover:bg-zinc-50">
                        <td className="px-3 py-2">
                          <span className="font-medium">{r.name ?? "—"}</span>
                          {r.isTest && <span className="ml-1.5 rounded bg-amber-100 text-amber-700 px-1 py-0.5 text-[10px]">test</span>}
                          <div className="text-zinc-400 text-xs">{r.email}</div>
                        </td>
                        <td className="px-3 py-2 text-zinc-600">{r.language}</td>
                        <td className="px-3 py-2 text-center">{r.certificate ? "✓" : "—"}</td>
                        <td className="px-3 py-2 text-right text-zinc-500 text-xs whitespace-nowrap">{timeAgo(r.joined)}</td>
                      </tr>
                    ))}
                    {!(web.recent ?? []).length && <tr><td colSpan={4} className="px-3 py-4 text-center text-zinc-400 text-sm">No signups yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400">Snapshot at {data.generatedAt ? new Date(data.generatedAt + "Z").toLocaleString() : "—"} · click any user for detail</div>
        </div>
      ) : null}
      {sel && <UserDetailModal sel={sel} onClose={() => setSel(null)} />}
    </section>
  );
}

// ── Full user directory (every user, searchable, paginated) ────────────────────
const PAGE_SIZE = 50;



// NOTE: filter options are NOT hardcoded here. They come from the server's
// `facets` — the distinct values actually present in the data — so a dropdown can
// never offer a stage nobody is in, and never miss a new one either.

const fieldCls =
  "rounded-lg border border-zinc-300 px-2 py-1 text-xs bg-white " +
  "focus:outline-none focus:ring-1 focus:ring-emerald-500";

// from/to date pair. Shown as plain date inputs so a range is two clicks, and
// "today only" is the same control with both halves equal.
function DateRange({
  from, to, onFrom, onTo, onClear,
}: {
  from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void; onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="uppercase tracking-wider text-[10px] text-zinc-400">From</span>
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={fieldCls} />
      <span className="uppercase tracking-wider text-[10px] text-zinc-400">To</span>
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={fieldCls} />
      {(from || to) && (
        <button onClick={onClear} className="text-zinc-400 hover:text-zinc-700 px-1" title="Clear dates">
          &#10005;
        </button>
      )}
    </div>
  );
}


// A column header with its own filter. Options come from the server's facets —
// the values actually present in the data — so a pick can never return zero rows
// for a value nobody has. Uses a native <select> so it works on mobile and with
// a keyboard without hand-rolled click-outside handling.
function FilterHeader({
  label, align = "left", options, value, onChange,
}: {
  label: string;
  align?: "left" | "center" | "right";
  options?: (string | number)[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  // No options (or only one) means there is nothing to choose between.
  const filterable = !!onChange && !!options && options.length > 1;
  const active = !!value;
  return (
    <th className={`${alignCls} font-medium px-3 py-2 align-top`}>
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
        <span>{label}</span>
        {filterable && (
          <span className="relative inline-flex items-center">
            <select
              aria-label={`Filter by ${label}`}
              value={value ?? ""}
              onChange={(e) => onChange!(e.target.value)}
              className={`appearance-none bg-transparent border-0 cursor-pointer pr-3 text-[11px] focus:outline-none ${
                active ? "text-emerald-700 font-semibold" : "text-zinc-400"}`}
              style={{ width: active ? "auto" : "1.1rem" }}
            >
              <option value="">All</option>
              {options!.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
            </select>
            <span className={`pointer-events-none absolute right-0 text-[9px] ${active ? "text-emerald-700" : "text-zinc-400"}`}>&#9662;</span>
          </span>
        )}
      </div>
    </th>
  );
}



// Team logins. Super admin sets the content and marketing passwords here, so
// they never live in Render (visible to anyone with dashboard access, and a
// change restarts the service) and never in the repo. Stored bcrypt-hashed —
// there is no endpoint that can read one back.
function TeamLoginsPanel() {
  const [roles, setRoles] = useState<Record<string, boolean>>({});
  const [minLen, setMinLen] = useState(12);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await adminApi.team();
      setRoles(r.roles); setMinLen(r.minLength);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (role: string) => {
    const pw = draft[role] ?? "";
    if (pw.length < minLen) { setErr(`Password must be at least ${minLen} characters.`); return; }
    setBusy(role); setErr(""); setMsg("");
    try {
      await adminApi.setTeamPassword(role, pw);
      setDraft((d) => ({ ...d, [role]: "" }));
      setMsg(`${role} password updated.`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to save"); }
    finally { setBusy(null); }
  };

  const disable = async (role: string) => {
    setBusy(role); setErr(""); setMsg("");
    try {
      await adminApi.clearTeamPassword(role);
      setMsg(`${role} login disabled.`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  const LABEL: Record<string, string> = {
    content: "Content admin", marketing: "Marketing admin",
  };
  const HELP: Record<string, string> = {
    content: "Courses, videos, quizzes, assignments, plus read-only analytics. No phone numbers or chat transcripts.",
    marketing: "Campaigns, marketing assets, referrals, and full learner access including transcripts.",
  };

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
      <h2 className="text-sm font-semibold text-zinc-900 mb-1">Team logins</h2>
      <p className="text-xs text-zinc-500 mb-4">
        Your own login is the super admin and is not managed here. Passwords are stored
        hashed — they cannot be read back, only replaced. Three ordinary words make a
        password that is both easy to remember and hard to guess.
      </p>
      {err && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-3">{err}</div>}
      {msg && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 mb-3">{msg}</div>}
      <div className="space-y-3">
        {["content", "marketing"].map((role) => (
          <div key={role} className="rounded-xl border border-zinc-200 px-4 py-3">
            <div className="flex items-center justify-between gap-4 mb-1">
              <div className="text-sm font-medium text-zinc-900">{LABEL[role]}</div>
              <span className={`text-xs rounded px-1.5 py-0.5 ${
                roles[role] ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                {roles[role] ? "login active" : "no password — login disabled"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-2 max-w-[70ch]">{HELP[role]}</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password" autoComplete="new-password"
                placeholder={roles[role] ? "Set a new password" : `At least ${minLen} characters`}
                value={draft[role] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [role]: e.target.value }))}
                className="flex-1 min-w-[220px] rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button onClick={() => save(role)} disabled={busy === role}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 disabled:opacity-50">
                {busy === role ? "Saving…" : roles[role] ? "Change" : "Set password"}
              </button>
              {roles[role] && (
                <button onClick={() => disable(role)} disabled={busy === role}
                  className="rounded-lg border border-zinc-300 text-zinc-600 hover:text-zinc-900 text-sm px-3 py-1.5 disabled:opacity-50">
                  Disable
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Runtime feature toggles. Saved to the DB, so a change takes effect on the very
// next learner message — no redeploy, no env var, no Render login.
function SettingsPanel() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { setFlags((await adminApi.settings()).settings); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load settings"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (key: string, next: boolean) => {
    setSaving(key); setErr("");
    // Optimistic, then reconciled from the server response, so a failed save
    // cannot leave the switch showing a state the backend does not hold.
    setFlags((f) => ({ ...f, [key]: next }));
    try {
      const res = await adminApi.setSetting(key, next);
      setFlags((f) => ({ ...f, [key]: res.value }));
    } catch (e) {
      setFlags((f) => ({ ...f, [key]: !next }));
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(null); }
  };

  const LABELS: Record<string, { title: string; help: string }> = {
    assignments_enabled: {
      title: "Assignments",
      help: "When off, the WhatsApp flow is video → quiz → next lesson. Learners already sitting on an assignment are moved forward on their next message, and nobody is nudged to finish one.",
    },
  };

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
      <h2 className="text-sm font-semibold text-zinc-900 mb-1">Course settings</h2>
      <p className="text-xs text-zinc-500 mb-4">Takes effect on the next learner message.</p>
      {err && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-3">{err}</div>}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-3"><Spinner className="w-4 h-4" /> Loading…</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(flags).map(([key, on]) => {
            const meta = LABELS[key] ?? { title: key, help: "" };
            return (
              <div key={key} className="flex items-start justify-between gap-6 rounded-xl border border-zinc-200 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-zinc-900">{meta.title}</div>
                  {meta.help && <p className="text-xs text-zinc-500 mt-0.5 max-w-[62ch]">{meta.help}</p>}
                </div>
                <button
                  role="switch" aria-checked={on} aria-label={meta.title}
                  disabled={saving === key}
                  onClick={() => toggle(key, !on)}
                  className={`shrink-0 mt-0.5 relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    on ? "bg-emerald-600" : "bg-zinc-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    on ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


/** Can this admin open a learner's detail (phone + full chat transcript)?
 *
 * Content admin gets read-only analytics but not transcripts, so their rows are
 * inert. This mirrors the server, which returns 403 for those endpoints — the
 * check here only avoids showing an error the person can do nothing about. */
function canOpenLearner(): boolean {
  const r = getAdminRole();
  return r === "super" || r === "marketing";
}

// Where learners actually come from. Deliberately a funnel, not a click count:
// a campaign that sends 500 people who never reply is worth less than one that
// sends 50 who finish, and only the funnel makes that visible.
function CampaignsPanel() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const res = await adminApi.campaigns({ from_date: from, to_date: to });
      setRows(res.campaigns);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const badge = (t: string) =>
    t === "ad" ? "bg-blue-50 text-blue-700 border-blue-200"
    : t === "link" ? "bg-violet-50 text-violet-700 border-violet-200"
    : t === "post" ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Campaigns</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Where learners came from, and how far they got. <span className="text-zinc-400">Arrived = sent a message (not clicks). Signed up = finished onboarding.</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo}
            onClear={() => { setFrom(""); setTo(""); }} />
          <button onClick={load} disabled={loading}
            className="text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-50 inline-flex items-center gap-1.5">
            {loading ? <Spinner className="w-3.5 h-3.5" /> : "⟳"} Refresh
          </button>
        </div>
      </div>

      {err && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-3">{err}</div>}

      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-6"><Spinner className="w-4 h-4" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4">
          {from || to ? "No learners arrived in this date range. " : "No learners yet. "}
          Tag your ad links as
          <code className="mx-1 px-1.5 py-0.5 bg-zinc-100 rounded text-[11px]">/start?c=your_campaign</code>
          — Click-to-WhatsApp ads are tracked automatically.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-200">
                <th className="py-2 pr-3 font-medium">Campaign</th>
                <th className="py-2 px-3 font-medium">Source</th>
                <th className="py-2 px-3 font-medium text-right">Arrived</th>
                <th className="py-2 px-3 font-medium text-right">Picked lang</th>
                <th className="py-2 px-3 font-medium text-right">Signed up</th>
                <th className="py-2 px-3 font-medium text-right">Started</th>
                <th className="py-2 px-3 font-medium text-right">Completed</th>
                <th className="py-2 px-3 font-medium text-right">Opted out</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.campaign} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-zinc-900">{r.campaign}</div>
                    {r.headline && <div className="text-xs text-zinc-500 truncate max-w-[240px]">{r.headline}</div>}
                    {r.ad_id && <div className="text-[11px] text-zinc-400 font-mono">ad {r.ad_id}</div>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge(r.source_type)}`}>
                      {r.source_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-zinc-900">{r.arrived}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-700">
                    {r.picked_language}
                    <span className="text-zinc-400 text-xs ml-1">
                      {Math.round((100 * r.picked_language) / (r.arrived || 1))}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-700">
                    {r.signed_up}<span className="text-zinc-400 text-xs ml-1">{r.signup_rate}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-700">{r.started_lesson}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-medium text-emerald-700">{r.completed}</span>
                    <span className="text-zinc-400 text-xs ml-1">{r.completion_rate}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-500">{r.opted_out || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UserDirectory() {
  const [channel, setChannel] = useState<"web" | "whatsapp">("web");
  const [q, setQ] = useState("");
  // One object rather than a state hook per column: the fetch takes it whole, and
  // "clear all" is a single reset.
  const EMPTY_F: UserFilters = {};
  const [f, setF] = useState<UserFilters>(EMPTY_F);
  const [facets, setFacets] = useState<UserFacets>({});
  const setFilter = (k: keyof UserFilters, v: string) =>
    setF((prev) => {
      const next = { ...prev };
      if (v === "" || v === undefined) delete next[k];
      else if (k === "active_within_days") next[k] = Number(v);
      else (next as Record<string, unknown>)[k] = v;
      return next;
    });
  const activeCount = Object.keys(f).length;
  const [rows, setRows] = useState<(WebLearnerRow | WaSessionRow)[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<{ kind: "wa" | "web"; id: string } | null>(null);

  // Fetch a page. append=true keeps existing rows (Load more); otherwise replaces.
  const fetchPage = useCallback(async (ch: "web" | "whatsapp", query: string, off: number, append: boolean) => {
    setLoading(true); setErr("");
    try {
      // Filters go to the server, not the loaded page: filtering client-side would
      // show "3 results" out of one 200-row page and read as the whole total.
      const res = await adminApi.users(ch, { ...f, q: query, limit: PAGE_SIZE, offset: off });
      setTotal(res.total);
      setOffset(off);
      setRows((prev) => (append ? [...prev, ...res.items] : res.items));
      if (res.facets) setFacets(res.facets);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load users");
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);

  // Reload from the top whenever the channel changes.
  useEffect(() => { setF(EMPTY_F); setQ(""); }, [channel]);
  useEffect(() => { fetchPage(channel, q, 0, false); }, [channel, f, fetchPage]);

  // Debounced search — refetch from the top 350ms after the last keystroke.
  useEffect(() => {
    const t = setTimeout(() => fetchPage(channel, q, 0, false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const loaded = rows.length;
  const hasMore = loaded < total;

  return (
    <section className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">All users</h2>
          <p className="text-sm text-zinc-500">Full directory — search, browse, click any row for detail.</p>
        </div>
        <div className="inline-flex rounded-lg border border-zinc-300 overflow-hidden text-sm">
          {(["web", "whatsapp"] as const).map((ch) => (
            <button key={ch} onClick={() => setChannel(ch)}
              className={`px-3 py-1.5 capitalize ${channel === ch ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
              {ch === "web" ? "Web" : "WhatsApp"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={channel === "web" ? "Search by name or email…" : "Search by name or phone digits…"}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        <span className="text-xs text-zinc-500 whitespace-nowrap">
          {loading && !loaded ? "…" : `${loaded} of ${total}`}
        </span>
      </div>

      {/* Only the date range lives here now — every other filter is a dropdown on
          its own column header, so the control sits where the data it filters is. */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <DateRange
          from={f.from_date ?? ""} to={f.to_date ?? ""}
          onFrom={(v) => setFilter("from_date", v)}
          onTo={(v) => setFilter("to_date", v)}
          onClear={() => setF((p) => { const n = { ...p }; delete n.from_date; delete n.to_date; return n; })}
        />
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">joined</span>
        {activeCount > 0 && (
          <button onClick={() => setF(EMPTY_F)}
            className="text-xs text-zinc-500 hover:text-zinc-900 underline decoration-dotted">
            Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {err && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{err}</div>}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm">
          {channel === "web" ? (
            <>
              <thead className="bg-zinc-50 text-zinc-500 text-xs sticky top-0">
                <tr>
                  <FilterHeader label="Learner" />
                  <FilterHeader label="Lang" options={facets.language}
                    value={f.language} onChange={(v) => setFilter("language", v)} />
                  <FilterHeader label="Score" align="center" />
                  <FilterHeader label="Cert" align="center" options={facets.certificate}
                    value={f.certificate} onChange={(v) => setFilter("certificate", v)} />
                  <FilterHeader label="Joined" align="right" />
                </tr>
              </thead>
              <tbody>
                {(rows as WebLearnerRow[]).map((r, i) => (
                  <tr key={r.id ?? i} onClick={() => { if (canOpenLearner()) setSel({ kind: "web", id: r.id }); }}
                    className="border-t border-zinc-100 cursor-pointer hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <span className="font-medium">{r.name ?? "—"}</span>
                      {r.isTest && <span className="ml-1.5 rounded bg-amber-100 text-amber-700 px-1 py-0.5 text-[10px]">test</span>}
                      <div className="text-zinc-400 text-xs">{r.email}</div>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{r.language}</td>
                    <td className="px-3 py-2 text-center text-zinc-600">{r.score ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{r.certificate ? "✓" : "—"}</td>
                    <td className="px-3 py-2 text-right text-zinc-500 text-xs whitespace-nowrap">{timeAgo(r.joined)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead className="bg-zinc-50 text-zinc-500 text-xs sticky top-0">
                <tr>
                  <FilterHeader label="User" />
                  <FilterHeader label="Stage" options={facets.stage}
                    value={f.stage} onChange={(v) => setFilter("stage", v)} />
                  <FilterHeader label="Signup" options={facets.signup_state}
                    value={f.signup_state} onChange={(v) => setFilter("signup_state", v)} />
                  <FilterHeader label="Campaign" options={facets.campaign}
                    value={f.campaign} onChange={(v) => setFilter("campaign", v)} />
                  <FilterHeader label="Lesson" align="center" options={facets.lesson}
                    value={f.lesson ?? ""} onChange={(v) => setFilter("lesson", v)} />
                  <FilterHeader label="Lang" options={facets.language}
                    value={f.language} onChange={(v) => setFilter("language", v)} />
                  <FilterHeader label="Active" align="right" />
                </tr>
              </thead>
              <tbody>
                {(rows as WaSessionRow[]).map((r, i) => (
                  <tr key={r.id ?? i} onClick={() => { if (canOpenLearner()) setSel({ kind: "wa", id: r.id }); }}
                    className="border-t border-zinc-100 cursor-pointer hover:bg-zinc-50">
                    <td className="px-3 py-2"><span className="font-medium">{r.name}</span> <span className="text-zinc-400 text-xs">{r.phone}</span></td>
                    <td className="px-3 py-2"><span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{r.stage}</span></td>
                    <td className="px-3 py-2">
                      {/* Colour-coded: at a glance, who is still in the funnel vs
                          who actually became a learner. */}
                      <span className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${
                        r.signupState === "Post sign-up"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"}`}>
                        {r.signupState ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{r.campaign ?? "—"}</td>
                    <td className="px-3 py-2 text-center text-zinc-600">{r.lesson ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-600">{r.language ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-zinc-500 text-xs whitespace-nowrap">{timeAgo(r.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
        {!loading && !loaded && (
          <div className="px-3 py-6 text-center text-zinc-400 text-sm">
            {q ? "No users match that search." : "No users yet."}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-3 text-center">
          <button onClick={() => fetchPage(channel, q, offset + PAGE_SIZE, true)} disabled={loading}
            className="text-sm rounded-lg border border-zinc-300 px-4 py-1.5 hover:bg-white disabled:opacity-50 inline-flex items-center gap-1.5">
            {loading ? <Spinner className="w-3.5 h-3.5" /> : null} Load more ({total - loaded} left)
          </button>
        </div>
      )}

      {sel && <UserDetailModal sel={sel} onClose={() => setSel(null)} />}
    </section>
  );
}

// ── Referrals ─────────────────────────────────────────────────────────────────
function ReferralsPanel() {
  const [data, setData] = useState<ReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { setData(await adminApi.referrals()); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load referrals"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold">Referrals</h2>
          {data?.demoMode && <span className="text-xs rounded bg-amber-100 text-amber-700 px-2 py-0.5">DEMO — no real payouts</span>}
        </div>
        <button onClick={load} disabled={loading}
          className="text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-white disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Spinner className="w-3.5 h-3.5" /> : "⟳"} Refresh
        </button>
      </div>

      {err && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{err}</div>}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-6"><Spinner className="w-4 h-4" /> Loading…</div>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Total referrals" value={data.total} />
            <StatTile label="Rewarded" value={data.paid} accent="text-emerald-700" />
            <StatTile label={`Paid out (₹${data.rewardEach} each)`} value={`₹${data.payoutTotal}`} accent="text-emerald-700" />
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Code</th>
                  <th className="text-left font-medium px-3 py-2">Referrer</th>
                  <th className="text-left font-medium px-3 py-2">Via</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-right font-medium px-3 py-2">Reward</th>
                  <th className="text-right font-medium px-3 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-100">
                    <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                    <td className="px-3 py-2">{r.referrerContact} <span className="text-zinc-400 text-xs">({r.referrerKind})</span></td>
                    <td className="px-3 py-2 text-zinc-600">{r.referredKind}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${
                        r.status === "paid" ? "bg-emerald-50 text-emerald-700"
                        : r.status === "rejected" ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"}`}>
                        {r.status}{r.payoutRef ? ` · ${r.payoutRef}` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">₹{r.reward}</td>
                    <td className="px-3 py-2 text-right text-zinc-500 text-xs whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                  </tr>
                ))}
                {!data.items.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-zinc-400 text-sm">No referrals yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"content" | "analytics">("content");
  // Presentation only — the server enforces the real permissions. See getAdminRole.
  const [role, setRole] = useState<AdminRole>("super");
  useEffect(() => {
    const r = getAdminRole();
    setRole(r);
    // Marketing has no Content tab; don't leave them staring at nothing.
    if (r === "marketing") setTab("analytics");
    // Dashboard only mounts after a successful login, so once is enough.
  }, []);
  const canContent = role === "super" || role === "content";
  const canMarketing = role === "super" || role === "marketing";
  const isSuper = role === "super";

  const refresh = useCallback(async () => {
    try {
      const data = await adminApi.listCourses();
      setCourses(data);
      setSelectedId((prev) => prev && data.some((c) => c.id === prev) ? prev : (data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
      if (err instanceof Error && err.message.includes("log in")) onLogout();
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => { refresh(); }, [refresh]);

  async function run(fn: () => Promise<unknown>) {
    setError(""); setSaving(true);
    try { await fn(); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  }

  async function newCourse() {
    const title = window.prompt("New course title:");
    if (!title?.trim()) return;
    const description = window.prompt("Short description (optional):") ?? undefined;
    await run(() => adminApi.createCourse({ title: title.trim(), description }));
  }

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Cosmoplex Admin</h1>
          <p className="text-sm text-zinc-500">Manage courses, lessons, and videos</p>
        </div>
        <div className="flex items-center gap-4">
          {saving && (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Spinner className="w-3.5 h-3.5" /> Saving…
            </span>
          )}
          <button
            disabled={saving}
            onClick={() => run(async () => {
              const r = await adminApi.syncVideos();
              window.alert(`Synced existing content:\n• ${r.videosSynced} lesson video set(s)\n• ${r.quizzesAdded} quiz question(s) added\n• ${r.assignmentsAdded} assignment(s) added`);
            })}
            className="text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving ? <Spinner className="w-3.5 h-3.5" /> : "⟳"} Sync existing content
          </button>
          <button onClick={onLogout} className="text-sm text-zinc-500 hover:text-zinc-800">Log out</button>
        </div>
      </header>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{error}</div>}

      <div className="flex gap-1 mb-6 border-b border-zinc-200">
        {(([["content", "Content"], ["analytics", "Analytics"]] as const)).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "analytics" && (<>
        {/* Infrastructure state: super only. */}
        {isSuper && <SystemCheckPanel />}
        <SystemStatus />
        <CampaignsPanel />
        <UserDirectory />
        {/* Referral payouts are a marketing surface. */}
        {canMarketing && <ReferralsPanel />}
      </>)}

      {tab === "content" && (<>
      {/* These change the product for every learner (and gate certificates), so
          they stay with the super admin. */}
      {isSuper && <SettingsPanel />}
      {isSuper && <TeamLoginsPanel />}
      {canContent && <IntroVideosManager />}
      {/* Pre-sale campaign assets. Content admin does the uploading; marketing
          owns the campaigns — so both need it, and marketing can only reach it
          from this tab. */}
      <MarketingAssetsManager />

      {canContent && (<div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded-2xl border border-zinc-200 p-3 h-fit">
          <button onClick={newCourse}
            className="w-full mb-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 transition-colors">
            + New course
          </button>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400 px-2 py-4">
              <Spinner className="w-4 h-4" /> Loading courses…
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {courses.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                      c.id === selectedId ? "bg-emerald-50 text-emerald-800 font-medium" : "hover:bg-zinc-100"}`}>
                    {c.title}
                  </button>
                </li>
              ))}
              {courses.length === 0 && <p className="text-sm text-zinc-400 px-2 py-4">No courses yet.</p>}
            </ul>
          )}
        </aside>

        {/* Editor */}
        <main>
          {selected ? <CourseEditor course={selected} run={run} /> : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center text-zinc-500">
              Select or create a course to begin.
            </div>
          )}
        </main>
      </div>)}
      </>)}
    </div>
  );
}

// ── WhatsApp intro videos (onboarding) ───────────────────────────────────────
function IntroVideosManager() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<IntroVideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.listIntroVideos()); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const [saving, setSaving] = useState(false);
  async function save(fn: () => Promise<unknown>) {
    setErr(""); setSaving(true);
    try { await fn(); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  const rows = [{ code: "default", label: "Default — plays for every language" }, ...LANGUAGES];
  const idFor = (code: string) => items.find((i) => i.language === code)?.cloudinaryPublicId ?? null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 mb-6">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div>
          <h2 className="font-semibold">🎬 WhatsApp intro video</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            The onboarding video shown when someone first messages you on WhatsApp. Set a default,
            and optionally a per-language version.
          </p>
        </div>
        <span className="text-zinc-400 shrink-0 ml-3">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
          {saving && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <Spinner className="w-3.5 h-3.5" /> Saving…
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-3">
              <Spinner className="w-4 h-4" /> Loading intro videos…
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {!loading && rows.map((r) => {
              const id = idFor(r.code);
              return (
                <div key={r.code} className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{r.label}</span>
                    {id && (
                      <button className="text-[11px] text-red-500 hover:text-red-700"
                        onClick={() => { if (window.confirm(`Remove the ${r.label} intro video?`)) save(() => adminApi.deleteIntroVideo(r.code)); }}>✕</button>
                    )}
                  </div>
                  {id
                    ? <PreviewableId publicId={id} className="block text-[11px] truncate mt-0.5 max-w-full" />
                    : <p className="text-[11px] text-zinc-400 truncate mt-0.5">not set</p>}
                  <UploadButton
                    label={id ? "Replace" : "Upload"} small
                    onUploaded={(pid, dur) =>
                      save(() => adminApi.setIntroVideo(r.code, { cloudinary_public_id: pid, duration_seconds: dur }))}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            A specific language overrides the default for that language. Uploads are compressed automatically when sent over WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Pre-sale marketing assets (signup drip) ──────────────────────────────────
const MARKETING_DAYS = [1, 2, 3, 7];

// Full image (uncropped) — what actually gets sent on WhatsApp too.
function marketingImgFull(pid: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${pid}`;
}

// One (day, language) cell with three independent fields: Photo, Video, Text.
function MarketingCell({ day, label, asset, onPatch }: {
  day: number;
  label: string;
  asset: MarketingAssetRow | undefined;
  onPatch: (patch: { image_public_id?: string | null; video_public_id?: string | null; video_duration_seconds?: number | null; text?: string | null }) => void;
}) {
  const [draft, setDraft] = useState(asset?.text ?? "");
  // Keep the text box in sync when the underlying data reloads.
  useEffect(() => { setDraft(asset?.text ?? ""); }, [asset?.text]);
  const textDirty = draft !== (asset?.text ?? "");

  return (
    <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
      <span className="text-xs font-medium">{label}</span>

      {/* Photo */}
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400">Photo</span>
          {asset?.imagePublicId && (
            <button className="text-[11px] text-red-500 hover:text-red-700"
              onClick={() => onPatch({ image_public_id: null })}>✕</button>
          )}
        </div>
        {asset?.imagePublicId
          ? <a href={marketingImgFull(asset.imagePublicId)} target="_blank" rel="noreferrer" title="Click to open full image"
              className="block text-[11px] text-emerald-700 hover:underline truncate max-w-full">{asset.imagePublicId}</a>
          : <p className="text-[11px] text-zinc-400">not set</p>}
        <UploadButton label={asset?.imagePublicId ? "Replace photo" : "Upload photo"} small
          accept="image/*" resourceType="image"
          onUploaded={(pid) => onPatch({ image_public_id: pid })} />
      </div>

      {/* Video */}
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400">Video</span>
          {asset?.videoPublicId && (
            <button className="text-[11px] text-red-500 hover:text-red-700"
              onClick={() => onPatch({ video_public_id: null, video_duration_seconds: null })}>✕</button>
          )}
        </div>
        {asset?.videoPublicId
          ? <PreviewableId publicId={asset.videoPublicId} className="block text-[11px] truncate max-w-full" />
          : <p className="text-[11px] text-zinc-400">not set</p>}
        <UploadButton label={asset?.videoPublicId ? "Replace video" : "Upload video"} small
          accept="video/*" resourceType="video"
          onUploaded={(pid, dur) => onPatch({ video_public_id: pid, video_duration_seconds: dur })} />
      </div>

      {/* Text — auto-saves on click-away (blur); explicit Save button too. */}
      <div className="mt-2">
        <span className="text-[10px] uppercase tracking-wide text-zinc-400">Text</span>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
          placeholder="Marketing copy…"
          onBlur={() => { if (draft !== (asset?.text ?? "")) onPatch({ text: draft.trim() || null }); }}
          className="mt-0.5 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-y" />
        {textDirty ? (
          <div className="mt-1 flex items-center gap-2">
            <button className="text-[11px] rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5"
              onClick={() => onPatch({ text: draft.trim() || null })}>Save</button>
            <span className="text-[10px] text-zinc-400">also saves when you click away</span>
          </div>
        ) : (
          asset?.text ? <span className="mt-1 inline-block text-[10px] text-emerald-600">✓ saved</span> : null
        )}
      </div>
    </div>
  );
}

function MarketingAssetsManager() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MarketingAssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await adminApi.listMarketingAssets()).items); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  async function save(fn: () => Promise<unknown>) {
    setErr(""); setSaving(true);
    try { await fn(); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  const assetFor = (day: number, lang: string) =>
    items.find((i) => i.day === day && i.language === lang);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 mb-6">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div>
          <h2 className="font-semibold">📣 Pre-sale marketing (signup drip)</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            A photo or video sent on WhatsApp to people who started but haven&apos;t finished signup —
            after 1, 2, 3 and 7 days of inactivity. One per day, per language.
          </p>
        </div>
        <span className="text-zinc-400 shrink-0 ml-3">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
          {saving && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <Spinner className="w-3.5 h-3.5" /> Saving…
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-3">
              <Spinner className="w-4 h-4" /> Loading assets…
            </div>
          )}
          {!loading && MARKETING_DAYS.map((day) => (
            <div key={day} className="mb-4">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-700 mb-2">
                Day {day} <span className="text-zinc-400 font-normal normal-case">· sent after {day} day{day === 1 ? "" : "s"} idle</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {LANGUAGES.map((l) => (
                  <MarketingCell key={l.code} day={day} label={l.label}
                    asset={assetFor(day, l.code)}
                    onPatch={(patch) => save(() => adminApi.setMarketingAsset(day, l.code, patch))} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-zinc-400 mt-1">
            Each cell has three independent fields — photo, video and text. Fill any or all; how each is used is decided later.
            ⚠️ WhatsApp only lets us message a user for free within 24 hours of their last message; days 2/3/7 land outside that
            window and need approved Meta templates to actually deliver.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Course editor ──────────────────────────────────────────────────────────────
function CourseEditor({ course, run }: { course: AdminCourse; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{course.title}</h2>
            {course.description && <p className="text-sm text-zinc-500 mt-1">{course.description}</p>}
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="text-sm text-zinc-500 hover:text-zinc-800"
              onClick={async () => {
                const title = window.prompt("Course title:", course.title);
                if (!title?.trim()) return;
                const description = window.prompt("Description:", course.description ?? "") ?? undefined;
                await run(() => adminApi.updateCourse(course.id, { title: title.trim(), description }));
              }}>Edit</button>
            <button className="text-sm text-red-500 hover:text-red-700"
              onClick={async () => {
                if (!window.confirm(`Delete course "${course.title}" and everything in it?`)) return;
                await run(() => adminApi.deleteCourse(course.id));
              }}>Delete</button>
          </div>
        </div>
        <button className="mt-4 text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
          onClick={async () => {
            const title = window.prompt("Module title:");
            if (!title?.trim()) return;
            const level = parseInt(window.prompt("Level (1=Beginner, 2=Intermediate, 3=Advanced):", "1") ?? "1", 10) || 1;
            const outcome = window.prompt("Learning outcome (optional):") ?? undefined;
            await run(() => adminApi.createModule({ course_id: course.id, title: title.trim(), level, outcome }));
          }}>+ Add module</button>
      </div>

      {course.modules.map((m, i) => <ModuleCard key={m.id} m={m} moduleNo={i + 1} run={run} />)}
      {course.modules.length === 0 && <p className="text-sm text-zinc-400">No modules yet — add one above.</p>}
    </div>
  );
}

// ── Module (collapsible) ─────────────────────────────────────────────────────
function ModuleCard({ m, moduleNo, run }: { m: AdminCourse["modules"][number]; moduleNo: number; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  // 1-based lesson number within the module (running across its sections)
  const lessonNum = new Map<string, number>();
  m.sections.forEach((s) => s.videos.forEach((v) => lessonNum.set(v.id, lessonNum.size + 1)));
  const [open, setOpen] = useState(false);
  const videoCount = m.sections.reduce((n, s) => n + s.videos.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4 hover:bg-zinc-50 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <span className={`text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        <div className="flex-1 min-w-0">
          <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 mb-1">
            Level {m.level}
          </span>
          <h3 className="font-semibold truncate">{m.title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {m.sections.length} section{m.sections.length === 1 ? "" : "s"} · {videoCount} lesson{videoCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button className="text-sm text-zinc-500 hover:text-zinc-800"
            onClick={async () => {
              const title = window.prompt("Module title:", m.title);
              if (!title?.trim()) return;
              const outcome = window.prompt("Outcome:", m.outcome ?? "") ?? undefined;
              const level = parseInt(window.prompt("Level (1-3):", String(m.level)) ?? String(m.level), 10) || m.level;
              await run(() => adminApi.updateModule(m.id, { title: title.trim(), outcome, level }));
            }}>Edit</button>
          <button className="text-sm text-red-500 hover:text-red-700"
            onClick={async () => { if (window.confirm("Delete this module?")) await run(() => adminApi.deleteModule(m.id)); }}>Delete</button>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5">
          {m.outcome && <p className="text-sm text-zinc-500 mb-3">{m.outcome}</p>}
          <ModuleContentDoc moduleId={m.id} hasDoc={m.hasContentDoc} preview={m.contentDocPreview} onChanged={() => run(async () => {})} />
          <div className="pl-4 border-l-2 border-zinc-100 flex flex-col gap-4">
            {m.sections.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium text-zinc-700">{s.title}</h4>
                  <div className="flex gap-3 shrink-0">
                    <button className="text-xs text-zinc-500 hover:text-zinc-800"
                      onClick={async () => {
                        const title = window.prompt("Section title:", s.title);
                        if (title?.trim()) await run(() => adminApi.updateSection(s.id, { title: title.trim() }));
                      }}>Edit</button>
                    <button className="text-xs text-red-500 hover:text-red-700"
                      onClick={async () => { if (window.confirm("Delete this section?")) await run(() => adminApi.deleteSection(s.id)); }}>Delete</button>
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {s.videos.map((v) => <LessonRow key={v.id} video={v} num={`${moduleNo}.${lessonNum.get(v.id)}`} run={run} />)}
                  <button className="self-start text-xs rounded-lg border border-zinc-300 px-2.5 py-1 hover:bg-zinc-50"
                    onClick={async () => {
                      const title = window.prompt("Lesson title:");
                      if (title?.trim()) await run(() => adminApi.createVideo({ section_id: s.id, title: title.trim() }));
                    }}>+ Add lesson</button>
                </div>
              </div>
            ))}
            <button className="self-start text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
              onClick={async () => {
                const title = window.prompt("Section title:");
                if (title?.trim()) await run(() => adminApi.createSection({ module_id: m.id, title: title.trim() }));
              }}>+ Add section</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module content doc (detailed sub-lesson content — the Teacher agent's
// knowledge source for this module) ───────────────────────────────────────────
function ModuleContentDoc({ moduleId, hasDoc, preview, onChanged }: {
  moduleId: string; hasDoc: boolean; preview: string; onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function loadFull() {
    setLoading(true);
    try { setFullText((await adminApi.getModuleContentDoc(moduleId)).contentDoc); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }

  async function doUpload(input: { file?: File; text?: string }) {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await adminApi.uploadModuleContentDoc(moduleId, input);
      setMsg(`✓ Saved (${r.length.toLocaleString()} characters).`);
      setPasteText(""); setShowPaste(false);
      onChanged();
      if (open) await loadFull();
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  async function doDelete() {
    if (!window.confirm("Remove this module's content doc? The Teacher agent will lose this knowledge source.")) return;
    setBusy(true); setErr("");
    try { await adminApi.deleteModuleContentDoc(moduleId); setFullText(""); onChanged(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Delete failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 mb-4">
      <button type="button" className="w-full flex items-center justify-between px-3 py-2 text-left"
        onClick={() => { const next = !open; setOpen(next); if (next && fullText === null) loadFull(); }}>
        <span className="text-sm font-medium">
          📄 Module content doc {hasDoc ? <span className="text-emerald-700">(uploaded)</span> : <span className="text-zinc-400">(not set)</span>}
        </span>
        <span className="text-zinc-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <p className="text-[11px] text-zinc-600">
            Detailed content for every sub-lesson in this module — this is what the Teacher agent uses to
            answer learner questions for this module. Uploading replaces the existing doc.
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
              <Spinner className="w-4 h-4" /> Loading…
            </div>
          )}
          {!loading && fullText !== null && (
            fullText ? (
              <textarea readOnly value={fullText} rows={8}
                className="w-full text-xs font-mono border border-zinc-300 rounded px-2 py-1.5 bg-white" />
            ) : (
              <p className="text-xs text-zinc-400">{preview || "No content doc set for this module yet."}</p>
            )
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className={`inline-flex items-center gap-1.5 text-xs rounded px-2 py-1 ${busy ? "bg-zinc-200 text-zinc-400 cursor-default" : "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"}`}>
              {busy && <Spinner className="w-3.5 h-3.5" />}
              {busy ? "Working…" : (hasDoc || fullText ? "⤴ Replace doc" : "⤴ Upload doc")}
              <input type="file" accept=".docx,.txt,.md,.csv" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload({ file: f }); e.currentTarget.value = ""; }} />
            </label>
            <button type="button" disabled={busy} className="text-xs text-indigo-700 hover:underline disabled:text-zinc-400"
              onClick={() => setShowPaste((s) => !s)}>{showPaste ? "hide paste" : "or paste text"}</button>
            {(hasDoc || fullText) && (
              <button type="button" disabled={busy} onClick={doDelete}
                className="text-xs text-red-500 hover:text-red-700 disabled:text-zinc-400">Clear doc</button>
            )}
          </div>
          {showPaste && (
            <div className="flex flex-col gap-1.5">
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} disabled={busy}
                placeholder="Paste the detailed content for every sub-lesson in this module…"
                className="w-full text-xs border border-zinc-300 rounded px-2 py-1.5" />
              <button type="button" disabled={busy || !pasteText.trim()}
                className="self-start text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded px-3 py-1"
                onClick={() => doUpload({ text: pasteText })}>{busy ? "Working…" : "Save"}</button>
            </div>
          )}
          {msg && <p className="text-[11px] text-emerald-700">{msg}</p>}
          {err && <p className="text-[11px] text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}

// ── Lesson row (title + base video + per-language variants) ──────────────────────
function LessonRow({ video, num, run }: { video: AdminVideo; num: string; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const langsSet = video.variants.length;
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <button className="flex items-center gap-2 min-w-0 text-left" onClick={() => setOpen((o) => !o)}>
          <span className={`text-zinc-400 text-xs transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          <span className="text-xs font-semibold text-emerald-700 shrink-0">{num}</span>
          <span className="text-sm font-medium truncate">🎬 {video.title}</span>
          <span className="text-[11px] text-zinc-400 shrink-0">{langsSet}/6 languages</span>
        </button>
        <div className="flex gap-3 shrink-0">
          <button className="text-xs text-zinc-500 hover:text-zinc-800"
            onClick={async () => {
              const title = window.prompt("Lesson title:", video.title);
              if (title?.trim()) await run(() => adminApi.updateVideo(video.id, { title: title.trim() }));
            }}>Rename</button>
          <button className="text-xs text-red-500 hover:text-red-700"
            onClick={async () => { if (window.confirm("Delete this lesson?")) await run(() => adminApi.deleteVideo(video.id)); }}>Delete</button>
        </div>
      </div>

      {open && (<>
      {/* Base video */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">Default video:</span>
        {video.baseCloudinaryId
          ? <PreviewableId publicId={video.baseCloudinaryId} className="text-xs bg-white border border-zinc-200 rounded px-1.5 py-0.5" />
          : <span className="text-xs text-zinc-400">none</span>}
        <UploadButton
          label={video.baseCloudinaryId ? "Replace" : "Upload"}
          onUploaded={(pid, dur) =>
            run(() => adminApi.updateVideo(video.id, { title: video.title, cloudinary_public_id: pid, duration_seconds: dur }))}
        />
      </div>

      {/* Per-language variants */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LANGUAGES.map((lang) => {
          const variant = video.variants.find((v) => v.language === lang.code);
          return (
            <div key={lang.code} className="rounded-lg bg-white border border-zinc-200 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{lang.label}</span>
                {variant && (
                  <button className="text-[11px] text-red-500 hover:text-red-700"
                    onClick={async () => { if (window.confirm(`Remove ${lang.label} video?`)) await run(() => adminApi.deleteVariant(video.id, lang.code)); }}>✕</button>
                )}
              </div>
              {variant
                ? <PreviewableId publicId={variant.cloudinaryPublicId} className="block text-[11px] truncate mt-0.5 max-w-full" />
                : <p className="text-[11px] text-zinc-400 truncate mt-0.5">not set</p>}
              <UploadButton
                label={variant ? "Replace" : "Upload"}
                small
                onUploaded={(pid, dur) =>
                  run(() => adminApi.upsertVariant(video.id, { language: lang.code, cloudinary_public_id: pid, duration_seconds: dur }))}
              />
            </div>
          );
        })}
      </div>

      {/* Quiz + assignment banks */}
      <div className="mt-3 border-t border-zinc-200 pt-3 flex flex-col gap-2">
        <QuizManager videoId={video.id} />
        <AssignmentManager videoId={video.id} />
      </div>
      </>)}
    </div>
  );
}

// ── Quiz bank manager ────────────────────────────────────────────────────────
const EMPTY_QUIZ = { question: {} as Record<string, string>, options: {} as Record<string, string[]>, correctIndex: 0 };

// Bulk add: upload a .docx/.txt (or paste), AI extracts every question and
// translates it into all 6 languages, then appends to the lesson's bank.
function BulkUpload({ kind, onUpload, onDone }: {
  kind: "quiz" | "assignment";
  onUpload: (input: { file?: File; text?: string; replace?: boolean }) => Promise<{ added: number }>;
  onDone: () => void;
}) {
  const [showPaste, setShowPaste] = useState(false);
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const noun = kind === "quiz" ? "question(s)" : "assignment(s)";

  async function run(input: { file?: File; text?: string }) {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await onUpload({ ...input, replace });
      setMsg(`✓ ${replace ? "Replaced with" : "Added"} ${r.added} ${noun} in all languages.`);
      setText(""); setShowPaste(false);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-2.5 flex flex-col gap-2">
      <p className="text-[11px] text-zinc-600">
        Bulk add — upload a .docx or .txt (or paste); AI extracts every{" "}
        {kind === "quiz" ? "MCQ" : "assignment"} and translates it into all 6 languages.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className={`inline-flex items-center gap-1.5 text-xs rounded px-2 py-1 ${busy ? "bg-zinc-200 text-zinc-400 cursor-default" : "bg-sky-600 text-white hover:bg-sky-500 cursor-pointer"}`}>
          {busy && <Spinner className="w-3.5 h-3.5" />}
          {busy ? "Working…" : "⤴ Upload doc"}
          <input type="file" accept=".docx,.txt,.md,.csv" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) run({ file: f }); e.currentTarget.value = ""; }} />
        </label>
        <button type="button" disabled={busy} className="text-xs text-sky-700 hover:underline disabled:text-zinc-400"
          onClick={() => setShowPaste((s) => !s)}>{showPaste ? "hide paste" : "or paste text"}</button>
      </div>
      <label className="flex items-center gap-1.5 text-[11px] text-zinc-600">
        <input type="checkbox" checked={replace} disabled={busy} onChange={(e) => setReplace(e.target.checked)} />
        Replace existing {noun} for this lesson (clears the current bank first)
      </label>
      {showPaste && (
        <div className="flex flex-col gap-1.5">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} disabled={busy}
            placeholder={kind === "quiz"
              ? "Paste MCQs, e.g.\n1. What is an LLM?\n  a) ...\n  b) ...  (correct)\n  c) ..."
              : "Paste assignment prompts (one per line or numbered)."}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1.5" />
          <button type="button" disabled={busy || !text.trim()}
            className="self-start inline-flex items-center gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded px-3 py-1"
            onClick={() => run({ text })}>{busy && <Spinner className="w-3.5 h-3.5" />}{busy ? "Working…" : "Extract & add"}</button>
        </div>
      )}
      {busy && (
        <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <Spinner className="w-3 h-3" /> Extracting &amp; translating — can take 20–40s for many {noun}.
        </p>
      )}
      {msg && <p className="text-[11px] text-emerald-700">{msg}</p>}
      {err && <p className="text-[11px] text-red-600">{err}</p>}
    </div>
  );
}

function QuizManager({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<null | { id?: string; draft: typeof EMPTY_QUIZ }>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.listQuizzes(videoId)); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [videoId]);
  useEffect(() => { if (open) load(); }, [open, load]);

  async function save(draft: typeof EMPTY_QUIZ, id?: string) {
    setErr("");
    if (!draft.question.en?.trim()) { setErr("English question is required"); return; }
    const payload = { question: draft.question, options: draft.options, correct_index: draft.correctIndex };
    try {
      if (id) await adminApi.updateQuiz(id, payload); else await adminApi.createQuiz(videoId, payload);
      setEditing(null); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to save"); }
  }

  return (
    <div className="rounded-lg bg-white border border-zinc-200">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium">
        <span>📝 Quiz questions {items.length ? `(${items.length})` : ""}</span>
        <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {err && <p className="text-xs text-red-600">{err}</p>}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
              <Spinner className="w-4 h-4" /> Loading quiz questions…
            </div>
          )}
          {!loading && items.map((q, i) => {
            const opts = q.options?.en ?? Object.values(q.options ?? {})[0] ?? [];
            return (
              <div key={q.id} className="text-xs bg-zinc-50 rounded px-2 py-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">{i + 1}. {q.question.en ?? "(no English)"}</span>
                  <span className="flex gap-2 shrink-0">
                    <button className="text-zinc-500 hover:text-zinc-800" onClick={() => setEditing({ id: q.id, draft: { question: q.question, options: q.options, correctIndex: q.correctIndex } })}>Edit</button>
                    <button className="text-red-500 hover:text-red-700" onClick={async () => { if (window.confirm("Delete this question?")) { await adminApi.deleteQuiz(q.id); load(); } }}>Delete</button>
                  </span>
                </div>
                {opts.length > 0 && (
                  <ul className="mt-1 ml-4 flex flex-col gap-0.5 text-[11px]">
                    {opts.map((o, idx) => (
                      <li key={idx} className={idx === q.correctIndex ? "text-emerald-700 font-medium" : "text-zinc-500"}>
                        {String.fromCharCode(97 + idx)}) {o}{idx === q.correctIndex ? "  ✓" : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {editing ? (
            <QuizEditor initial={editing.draft} onCancel={() => setEditing(null)} onSave={(d) => save(d, editing.id)} />
          ) : (
            <>
              <BulkUpload kind="quiz" onUpload={(i) => adminApi.bulkQuizzes(videoId, i)} onDone={load} />
              <button className="self-start text-xs rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-50"
                onClick={() => setEditing({ draft: { question: {}, options: {}, correctIndex: 0 } })}>+ Add question manually</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function QuizEditor({ initial, onSave, onCancel }: {
  initial: typeof EMPTY_QUIZ; onSave: (d: typeof EMPTY_QUIZ) => void; onCancel: () => void;
}) {
  const [lang, setLang] = useState("en");
  const [draft, setDraft] = useState(initial);
  const opts = draft.options[lang] ?? ["", "", "", ""];

  const setQ = (val: string) => setDraft((d) => ({ ...d, question: { ...d.question, [lang]: val } }));
  const setOpt = (i: number, val: string) => setDraft((d) => {
    const cur = [...(d.options[lang] ?? ["", "", "", ""])]; cur[i] = val;
    return { ...d, options: { ...d.options, [lang]: cur } };
  });

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500">Language:</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-xs border border-zinc-300 rounded px-2 py-1">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}{l.code === "en" ? " (required)" : ""}</option>)}
        </select>
      </div>
      <input value={draft.question[lang] ?? ""} onChange={(e) => setQ(e.target.value)} placeholder={`Question (${lang})`}
        className="w-full text-sm border border-zinc-300 rounded px-2 py-1.5" />
      {[0, 1, 2, 3].map((i) => (
        <label key={i} className="flex items-center gap-2">
          <input type="radio" name="correct" checked={draft.correctIndex === i} onChange={() => setDraft((d) => ({ ...d, correctIndex: i }))} />
          <input value={opts[i] ?? ""} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1} (${lang})`}
            className="flex-1 text-sm border border-zinc-300 rounded px-2 py-1" />
        </label>
      ))}
      <p className="text-[11px] text-zinc-500">Radio marks the correct answer (same across languages).</p>
      <div className="flex gap-2">
        <button className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1" onClick={() => onSave(draft)}>Save</button>
        <button className="text-xs text-zinc-500 hover:text-zinc-800" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Assignment bank manager ──────────────────────────────────────────────────
function AssignmentManager({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<null | { id?: string; question: Record<string, string>; rubric: string }>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.listAssignments(videoId)); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [videoId]);
  useEffect(() => { if (open) load(); }, [open, load]);

  async function save(question: Record<string, string>, rubric: string, id?: string) {
    setErr("");
    if (!question.en?.trim()) { setErr("English question is required"); return; }
    if (!rubric.trim()) { setErr("Rubric is required"); return; }
    try {
      if (id) await adminApi.updateAssignment(id, { question, rubric }); else await adminApi.createAssignment(videoId, { question, rubric });
      setEditing(null); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to save"); }
  }

  return (
    <div className="rounded-lg bg-white border border-zinc-200">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium">
        <span>📌 Assignments {items.length ? `(${items.length})` : ""}</span>
        <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {err && <p className="text-xs text-red-600">{err}</p>}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
              <Spinner className="w-4 h-4" /> Loading assignments…
            </div>
          )}
          {!loading && items.map((a, i) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-xs bg-zinc-50 rounded px-2 py-1.5">
              <span className="truncate">{i + 1}. {a.question.en ?? "(no English)"}</span>
              <span className="flex gap-2 shrink-0">
                <button className="text-zinc-500 hover:text-zinc-800" onClick={() => setEditing({ id: a.id, question: a.question, rubric: a.rubric })}>Edit</button>
                <button className="text-red-500 hover:text-red-700" onClick={async () => { if (window.confirm("Delete this assignment?")) { await adminApi.deleteAssignment(a.id); load(); } }}>Delete</button>
              </span>
            </div>
          ))}
          {editing ? (
            <AssignmentEditor initial={editing} onCancel={() => setEditing(null)} onSave={(q, r) => save(q, r, editing.id)} />
          ) : (
            <>
              <BulkUpload kind="assignment" onUpload={(i) => adminApi.bulkAssignments(videoId, i)} onDone={load} />
              <button className="self-start text-xs rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-50"
                onClick={() => setEditing({ question: {}, rubric: "" })}>+ Add assignment manually</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentEditor({ initial, onSave, onCancel }: {
  initial: { question: Record<string, string>; rubric: string };
  onSave: (question: Record<string, string>, rubric: string) => void; onCancel: () => void;
}) {
  const [lang, setLang] = useState("en");
  const [question, setQuestion] = useState<Record<string, string>>(initial.question);
  const [rubric, setRubric] = useState(initial.rubric);

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500">Language:</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-xs border border-zinc-300 rounded px-2 py-1">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}{l.code === "en" ? " (required)" : ""}</option>)}
        </select>
      </div>
      <textarea value={question[lang] ?? ""} onChange={(e) => setQuestion((q) => ({ ...q, [lang]: e.target.value }))}
        placeholder={`Assignment question (${lang})`} rows={3} className="w-full text-sm border border-zinc-300 rounded px-2 py-1.5" />
      <textarea value={rubric} onChange={(e) => setRubric(e.target.value)}
        placeholder="Grading rubric (used by the AI grader — English, language-neutral)" rows={4}
        className="w-full text-sm border border-zinc-300 rounded px-2 py-1.5" />
      <div className="flex gap-2">
        <button className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1" onClick={() => onSave(question, rubric)}>Save</button>
        <button className="text-xs text-zinc-500 hover:text-zinc-800" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Upload button (direct → Cloudinary, with progress) ───────────────────────────
function UploadButton({ label, onUploaded, small, resourceType = "video", accept = "video/*" }: {
  label: string;
  onUploaded: (publicId: string, durationSeconds: number | null, resourceType: "image" | "video") => void;
  small?: boolean;
  resourceType?: "video" | "image" | "auto";
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setPct(0);
    try {
      const res = await uploadMediaToCloudinary(file, resourceType, setPct);
      onUploaded(res.publicId, res.durationSeconds, res.resourceType);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed");
    } finally {
      setPct(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const cls = small
    ? "mt-1 text-[11px] text-emerald-700 hover:text-emerald-900 cursor-pointer"
    : "text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-0.5 cursor-pointer";

  return (
    <span className="inline-flex items-center gap-1.5">
      <label className={`${cls} inline-flex items-center gap-1.5`}>
        {pct !== null && <Spinner className="w-3 h-3" />}
        {pct !== null ? `Uploading ${pct}%` : label}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onFile} disabled={pct !== null} />
      </label>
      {err && <span className="text-[11px] text-red-500" title={err}>⚠</span>}
    </span>
  );
}
