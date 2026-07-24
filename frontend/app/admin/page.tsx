"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminApi, uploadVideoToCloudinary, getAdminToken, clearAdminToken,
  LANGUAGES, type AdminCourse, type AdminVideo, type QuizItem, type AssignmentItem,
} from "@/lib/admin-api";

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
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setError("");
    try { await fn(); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
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
          <button
            onClick={() => run(async () => {
              const r = await adminApi.syncVideos();
              window.alert(`Synced existing content:\n• ${r.videosSynced} lesson video set(s)\n• ${r.quizzesAdded} quiz question(s) added\n• ${r.assignmentsAdded} assignment(s) added`);
            })}
            className="text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50">
            ⟳ Sync existing content
          </button>
          <button onClick={onLogout} className="text-sm text-zinc-500 hover:text-zinc-800">Log out</button>
        </div>
      </header>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded-2xl border border-zinc-200 p-3 h-fit">
          <button onClick={newCourse}
            className="w-full mb-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 transition-colors">
            + New course
          </button>
          {loading ? <p className="text-sm text-zinc-400 px-2 py-4">Loading…</p> : (
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

      {course.modules.map((m) => <ModuleCard key={m.id} m={m} run={run} />)}
      {course.modules.length === 0 && <p className="text-sm text-zinc-400">No modules yet — add one above.</p>}
    </div>
  );
}

// ── Module (collapsible) ─────────────────────────────────────────────────────
function ModuleCard({ m, run }: { m: AdminCourse["modules"][number]; run: (fn: () => Promise<unknown>) => Promise<void> }) {
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
                  {s.videos.map((v) => <LessonRow key={v.id} video={v} run={run} />)}
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

// ── Lesson row (title + base video + per-language variants) ──────────────────────
function LessonRow({ video, run }: { video: AdminVideo; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const langsSet = video.variants.length;
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <button className="flex items-center gap-2 min-w-0 text-left" onClick={() => setOpen((o) => !o)}>
          <span className={`text-zinc-400 text-xs transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
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
          ? <code className="text-xs bg-white border border-zinc-200 rounded px-1.5 py-0.5">{video.baseCloudinaryId}</code>
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
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{variant ? variant.cloudinaryPublicId : "not set"}</p>
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
  onUpload: (input: { file?: File; text?: string }) => Promise<{ added: number }>;
  onDone: () => void;
}) {
  const [showPaste, setShowPaste] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const noun = kind === "quiz" ? "question(s)" : "assignment(s)";

  async function run(input: { file?: File; text?: string }) {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await onUpload(input);
      setMsg(`✓ Added ${r.added} ${noun} in all languages.`);
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
        <label className={`text-xs rounded px-2 py-1 ${busy ? "bg-zinc-200 text-zinc-400 cursor-default" : "bg-sky-600 text-white hover:bg-sky-500 cursor-pointer"}`}>
          {busy ? "Working…" : "⤴ Upload doc"}
          <input type="file" accept=".docx,.txt,.md,.csv" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) run({ file: f }); e.currentTarget.value = ""; }} />
        </label>
        <button type="button" disabled={busy} className="text-xs text-sky-700 hover:underline disabled:text-zinc-400"
          onClick={() => setShowPaste((s) => !s)}>{showPaste ? "hide paste" : "or paste text"}</button>
      </div>
      {showPaste && (
        <div className="flex flex-col gap-1.5">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} disabled={busy}
            placeholder={kind === "quiz"
              ? "Paste MCQs, e.g.\n1. What is an LLM?\n  a) ...\n  b) ...  (correct)\n  c) ..."
              : "Paste assignment prompts (one per line or numbered)."}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1.5" />
          <button type="button" disabled={busy || !text.trim()}
            className="self-start text-xs bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded px-3 py-1"
            onClick={() => run({ text })}>{busy ? "Working…" : "Extract & add"}</button>
        </div>
      )}
      {busy && <p className="text-[11px] text-zinc-500">Extracting &amp; translating — can take 20–40s for many {noun}.</p>}
      {msg && <p className="text-[11px] text-emerald-700">{msg}</p>}
      {err && <p className="text-[11px] text-red-600">{err}</p>}
    </div>
  );
}

function QuizManager({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [editing, setEditing] = useState<null | { id?: string; draft: typeof EMPTY_QUIZ }>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { setItems(await adminApi.listQuizzes(videoId)); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
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
          {items.map((q, i) => (
            <div key={q.id} className="flex items-center justify-between gap-2 text-xs bg-zinc-50 rounded px-2 py-1.5">
              <span className="truncate">{i + 1}. {q.question.en ?? "(no English)"}</span>
              <span className="flex gap-2 shrink-0">
                <button className="text-zinc-500 hover:text-zinc-800" onClick={() => setEditing({ id: q.id, draft: { question: q.question, options: q.options, correctIndex: q.correctIndex } })}>Edit</button>
                <button className="text-red-500 hover:text-red-700" onClick={async () => { if (window.confirm("Delete this question?")) { await adminApi.deleteQuiz(q.id); load(); } }}>Delete</button>
              </span>
            </div>
          ))}
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
  const [editing, setEditing] = useState<null | { id?: string; question: Record<string, string>; rubric: string }>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { setItems(await adminApi.listAssignments(videoId)); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
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
          {items.map((a, i) => (
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
    <span className="inline-flex items-center gap-1">
      <label className={cls}>
        {pct !== null ? `Uploading ${pct}%` : label}
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFile} disabled={pct !== null} />
      </label>
      {err && <span className="text-[11px] text-red-500" title={err}>⚠</span>}
    </span>
  );
}
