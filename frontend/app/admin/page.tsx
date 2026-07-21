"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminApi, uploadVideoToCloudinary, getAdminToken, clearAdminToken,
  LANGUAGES, type AdminCourse, type AdminVideo,
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
              window.alert(r.count ? `Synced ${r.count} lesson(s) from Cloudinary.` : "No matching lessons to sync.");
            })}
            className="text-sm rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50">
            ⟳ Sync from Cloudinary
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

      {course.modules.map((m) => (
        <div key={m.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 mb-1">
                Level {m.level}
              </span>
              <h3 className="font-semibold">{m.title}</h3>
              {m.outcome && <p className="text-sm text-zinc-500 mt-0.5">{m.outcome}</p>}
            </div>
            <div className="flex gap-3 shrink-0">
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

          <div className="mt-4 pl-4 border-l-2 border-zinc-100 flex flex-col gap-4">
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
      ))}
      {course.modules.length === 0 && <p className="text-sm text-zinc-400">No modules yet — add one above.</p>}
    </div>
  );
}

// ── Lesson row (title + base video + per-language variants) ──────────────────────
function LessonRow({ video, run }: { video: AdminVideo; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">🎬 {video.title}</p>
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
