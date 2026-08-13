"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminApi, uploadVideoToCloudinary, getAdminToken, clearAdminToken,
  LANGUAGES, type AdminCourse, type AdminVideo, type QuizItem, type AssignmentItem,
  type IntroVideoItem, type AdminDashboard, type WaDetail, type WebDetail, type ReferralsData,
  type WebLearnerRow, type WaSessionRow,
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
function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await adminApi.login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-semibold">Cosmoplex Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Enter the admin password to continue.</p>
        </div>
        <input
          type="password" value={password} autoFocus
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(""); setWa(null); setWeb(null);
      try {
        if (sel.kind === "wa") { const d = await adminApi.whatsappDetail(sel.id); if (alive) setWa(d); }
        else { const d = await adminApi.learnerDetail(sel.id); if (alive) setWeb(d); }
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
                      <tr key={i} onClick={() => setSel({ kind: "wa", id: r.id })}
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
                      <tr key={i} onClick={() => setSel({ kind: "web", id: r.id })}
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

function UserDirectory() {
  const [channel, setChannel] = useState<"web" | "whatsapp">("web");
  const [q, setQ] = useState("");
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
      const res = await adminApi.users(ch, { q: query, limit: PAGE_SIZE, offset: off });
      setTotal(res.total);
      setOffset(off);
      setRows((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load users");
    } finally { setLoading(false); }
  }, []);

  // Reload from the top whenever the channel changes.
  useEffect(() => { fetchPage(channel, "", 0, false); setQ(""); }, [channel, fetchPage]);

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

      {err && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{err}</div>}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm">
          {channel === "web" ? (
            <>
              <thead className="bg-zinc-50 text-zinc-500 text-xs sticky top-0">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Learner</th>
                  <th className="text-left font-medium px-3 py-2">Lang</th>
                  <th className="text-center font-medium px-3 py-2">Score</th>
                  <th className="text-center font-medium px-3 py-2">Cert</th>
                  <th className="text-right font-medium px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(rows as WebLearnerRow[]).map((r, i) => (
                  <tr key={r.id ?? i} onClick={() => setSel({ kind: "web", id: r.id })}
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
                  <th className="text-left font-medium px-3 py-2">User</th>
                  <th className="text-left font-medium px-3 py-2">Stage</th>
                  <th className="text-center font-medium px-3 py-2">Lesson</th>
                  <th className="text-left font-medium px-3 py-2">Lang</th>
                  <th className="text-right font-medium px-3 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {(rows as WaSessionRow[]).map((r, i) => (
                  <tr key={r.id ?? i} onClick={() => setSel({ kind: "wa", id: r.id })}
                    className="border-t border-zinc-100 cursor-pointer hover:bg-zinc-50">
                    <td className="px-3 py-2"><span className="font-medium">{r.name}</span> <span className="text-zinc-400 text-xs">{r.phone}</span></td>
                    <td className="px-3 py-2"><span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{r.stage}</span></td>
                    <td className="px-3 py-2 text-center text-zinc-600">{r.lesson != null ? r.lesson + 1 : "—"}</td>
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
        {([["content", "Content"], ["analytics", "Analytics"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "analytics" && (<>
        <SystemStatus />
        <UserDirectory />
        <ReferralsPanel />
      </>)}

      {tab === "content" && (<>
      <IntroVideosManager />

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
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
      </div>
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
function UploadButton({ label, onUploaded, small }: {
  label: string;
  onUploaded: (publicId: string, durationSeconds: number | null) => void;
  small?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setPct(0);
    try {
      const { publicId, durationSeconds } = await uploadVideoToCloudinary(file, setPct);
      onUploaded(publicId, durationSeconds);
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
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFile} disabled={pct !== null} />
      </label>
      {err && <span className="text-[11px] text-red-500" title={err}>⚠</span>}
    </span>
  );
}
