"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { CourseStructure } from "@/components/course/CourseStructure";
import type { CourseDetail, VideoItem } from "@/lib/types";
import { useLang } from "@/lib/use-lang";
import { getAppI18n } from "@/lib/app-i18n";
import { getTitleTranslation } from "@/lib/title-i18n";
import { getScript } from "@/lib/video-scripts";

export default function VideoLearnPage() {
  const { courseId, videoId } = useParams<{
    courseId: string;
    videoId: string;
  }>();
  const router = useRouter();
  const lang = useLang();
  const t = getAppI18n(lang);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [nextVideo, setNextVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadCourse = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      const c = await api.courses.get(token, courseId);
      setCourse(c);

      // Find active video and the next unlocked/unwatched one
      const allVideos: VideoItem[] = [];
      for (const mod of c.modules) {
        for (const sec of mod.sections) {
          for (const v of sec.videos) {
            allVideos.push(v);
          }
        }
      }

      const idx = allVideos.findIndex((v) => v.id === videoId);
      if (idx !== -1) {
        setActiveVideo(allVideos[idx]);
        // Find next video: first unlocked, not completed, after current index
        const next = allVideos
          .slice(idx + 1)
          .find((v) => v.unlocked || !v.completed);
        setNextVideo(next ?? null);
      }
    } catch {
      router.push(`/course/${courseId}`);
    } finally {
      setLoading(false);
    }
  }, [courseId, videoId, router]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // When video is completed, reload course to update unlock states
  const handleCompleted = useCallback(() => {
    loadCourse();
  }, [loadCourse]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course || !activeVideo) return null;

  // Find section/module for current video
  let moduleTitle = "";
  let sectionTitle = "";
  for (const mod of course.modules) {
    for (const sec of mod.sections) {
      const found = sec.videos.find((v) => v.id === videoId);
      if (found) {
        moduleTitle = mod.title;
        sectionTitle = sec.title;
      }
    }
  }

  const script = getScript(activeVideo.title, lang);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <Link
            href={`/course/${courseId}`}
            className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors shrink-0"
          >
            <ArrowLeft size={15} className="text-zinc-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 truncate">
              {moduleTitle}
              {getTitleTranslation(moduleTitle, lang) && (
                <span className="text-zinc-400"> · {getTitleTranslation(moduleTitle, lang)}</span>
              )}
            </p>
            <p className="text-sm font-medium text-zinc-900 truncate">
              {activeVideo.title}
            </p>
            {getTitleTranslation(activeVideo.title, lang) && (
              <p className="text-xs text-zinc-400 truncate">
                {getTitleTranslation(activeVideo.title, lang)}
              </p>
            )}
          </div>
          {/* Sidebar toggle (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
          >
            <List size={15} className="text-zinc-600" />
          </button>
        </div>

        {/* Video + script + description */}
        <div className="flex-1 p-6 md:p-8">
          <motion.div
            key={videoId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Lesson title — above the video */}
            <div className={`mb-6 ${script ? "" : "max-w-4xl"}`}>
              <h1 className="text-xl font-semibold text-zinc-900">
                {activeVideo.title}
              </h1>
              {getTitleTranslation(activeVideo.title, lang) && (
                <p className="text-base text-zinc-500 mt-0.5">
                  {getTitleTranslation(activeVideo.title, lang)}
                </p>
              )}
              <p className="text-sm text-zinc-400 mt-1">
                {moduleTitle}
                {getTitleTranslation(moduleTitle, lang) && ` · ${getTitleTranslation(moduleTitle, lang)}`}
              </p>
            </div>

            {/* Video + script side-by-side */}
            <div className={script ? "flex flex-col lg:flex-row gap-6 lg:items-start" : "max-w-4xl"}>
              {/* Video column */}
              <div className={script ? "flex-1 min-w-0" : "w-full"}>
                <VideoPlayer
                  video={activeVideo}
                  courseId={courseId}
                  nextVideoId={nextVideo?.id}
                  nextVideoTitle={nextVideo?.title}
                  onCompleted={handleCompleted}
                  t={t}
                />
              </div>

              {/* Script panel */}
              {script && (
                <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
                    {lang === "hi" ? "वीडियो स्क्रिप्ट" : lang === "mr" ? "व्हिडिओ स्क्रिप्ट" : "Video Script"}
                  </p>
                  <div className="h-[calc(56.25vw*0.45)] max-h-[420px] min-h-[240px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5">
                    <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {script}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next section CTA — only after the current video is finished */}
            {activeVideo.completed && nextVideo && nextVideo.unlocked && (
              <div className={`mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 ${script ? "" : "max-w-4xl"}`}>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 mb-0.5">{t.upNext}</p>
                  <p className="text-sm font-medium text-zinc-800 truncate">
                    {nextVideo.title}
                  </p>
                </div>
                <Link
                  href={`/course/${courseId}/learn/${nextVideo.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  {t.next}
                  <ArrowLeft
                    size={13}
                    weight="bold"
                    className="rotate-180"
                  />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-zinc-200 bg-white overflow-y-auto">
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            {t.courseContent}
          </p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <CourseStructure
            course={course}
            activeVideoId={videoId}
            compact
          />
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-0 h-full w-80 bg-white border-l border-zinc-200 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Course content
              </p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-zinc-600" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <CourseStructure
                course={course}
                activeVideoId={videoId}
                compact
              />
            </div>
          </motion.aside>
        </div>
      )}
    </div>
  );
}
