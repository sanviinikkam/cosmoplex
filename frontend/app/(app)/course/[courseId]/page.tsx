"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Play,
  Seal,
} from "@phosphor-icons/react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CourseStructure } from "@/components/course/CourseStructure";
import type { ContinueWatching, CourseDetail } from "@/lib/types";
import { useLang } from "@/lib/use-lang";
import { getAppI18n } from "@/lib/app-i18n";
import { getTitleTranslation } from "@/lib/title-i18n";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const lang = useLang();
  const t = getAppI18n(lang);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [continueData, setContinueData] = useState<ContinueWatching | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    async function load() {
      if (!token) return;
      try {
        const [c, cw] = await Promise.all([
          api.courses.get(token, courseId),
          api.courses.continueWatching(token, courseId),
        ]);
        setCourse(c);
        setContinueData(cw);
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  const totalVideos = course.modules.reduce(
    (acc, m) => acc + m.sections.reduce((a, s) => a + s.videos.length, 0),
    0
  );
  const completedVideos = course.modules.reduce(
    (acc, m) =>
      acc +
      m.sections.reduce(
        (a, s) => a + s.videos.filter((v) => v.completed).length,
        0
      ),
    0
  );
  const pct = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
  const allDone = completedVideos === totalVideos && totalVideos > 0;

  return (
    <div className="p-6 md:p-8 max-w-[960px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
              {t.course}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {course.title}
            </h1>
            {getTitleTranslation(course.title, lang) && (
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
                {getTitleTranslation(course.title, lang)}
              </h2>
            )}
            {course.description && (
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed max-w-2xl">
                {getTitleTranslation(course.description, lang) ?? course.description}
              </p>
            )}
          </div>

          {/* Certificate badge */}
          {allDone && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2 rounded-xl">
              <Seal size={16} weight="fill" />
              {t.readyForCertificate}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease }}
            />
          </div>
          <span className="text-sm font-mono text-zinc-500 shrink-0">
            {t.videosProgress(completedVideos, totalVideos)}
          </span>
        </div>
      </motion.div>

      {/* Continue Watching hero */}
      {continueData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease }}
          className="mb-8"
        >
          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Play size={20} weight="fill" className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                  {continueData.watchedSeconds > 0 ? t.continueWatching : t.startHere}
                </p>
                <p className="text-white font-medium leading-snug">
                  {continueData.videoTitle}
                </p>
                {getTitleTranslation(continueData.videoTitle, lang) && (
                  <p className="text-zinc-200 font-bold text-sm leading-snug">
                    {getTitleTranslation(continueData.videoTitle, lang)}
                  </p>
                )}
                <p className="text-zinc-500 text-sm mt-0.5">
                  {continueData.moduleTitle}
                  {getTitleTranslation(continueData.moduleTitle, lang) && ` · ${getTitleTranslation(continueData.moduleTitle, lang)}`}
                </p>
                {continueData.watchedSeconds > 0 && continueData.durationSeconds > 0 && (
                  <div className="mt-2 w-40 h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (continueData.watchedSeconds /
                              continueData.durationSeconds) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <Link
              href={`/course/${courseId}/learn/${continueData.videoId}`}
              className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors active:scale-[0.98]"
            >
              {continueData.watchedSeconds > 0 ? t.resume : t.start}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {[
          {
            label: t.statModules,
            value: course.modules.length,
            icon: <BookOpen size={16} className="text-blue-600" />,
          },
          {
            label: t.statCompleted,
            value: `${pct}%`,
            icon: <CheckCircle size={16} className="text-emerald-600" />,
          },
          {
            label: t.statVideos,
            value: `${completedVideos}/${totalVideos}`,
            icon: <Play size={16} weight="fill" className="text-violet-600" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-zinc-200 p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-zinc-900 font-mono leading-none">
                {stat.value}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Course structure */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18, ease }}
      >
        <CourseStructure course={course} />
      </motion.div>
    </div>
  );
}
