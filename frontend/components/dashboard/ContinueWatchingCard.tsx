"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Play } from "@phosphor-icons/react";
import Link from "next/link";
import type { ContinueWatching, CourseSummary } from "@/lib/types";
import { useLang } from "@/lib/use-lang";
import { getAppI18n } from "@/lib/app-i18n";
import { getTitleTranslation } from "@/lib/title-i18n";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface Props {
  continueData: ContinueWatching | null;
  courses: CourseSummary[];
  userName: string;
}

export function ContinueWatchingCard({ continueData, courses, userName }: Props) {
  const firstName = userName.split(" ")[0];
  const lang = useLang();
  const t = getAppI18n(lang);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] pb-0">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t.welcomeBack(firstName)}
        </h1>
      </motion.div>

      {/* Continue Watching hero — only shown when there's a video to watch */}
      {continueData && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease }}
          className="mb-6"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
            {t.continueWatching}
          </p>
          <Link
            href={`/course/${continueData.courseId}/learn/${continueData.videoId}`}
            className="group block"
          >
            <div className="bg-zinc-900 rounded-2xl p-6 flex items-center gap-5 hover:bg-zinc-800 transition-colors">
              {/* Play icon */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                <Play
                  size={22}
                  weight="fill"
                  className="text-emerald-400 translate-x-0.5"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 mb-1">
                  {continueData.moduleTitle}
                  {getTitleTranslation(continueData.moduleTitle, lang) && (
                    <span className="text-zinc-500"> · {getTitleTranslation(continueData.moduleTitle, lang)}</span>
                  )}
                </p>
                <p className="text-white font-semibold text-lg leading-snug truncate">
                  {continueData.videoTitle}
                </p>
                {getTitleTranslation(continueData.videoTitle, lang) && (
                  <p className="text-zinc-300 font-semibold text-sm leading-snug truncate">
                    {getTitleTranslation(continueData.videoTitle, lang)}
                  </p>
                )}
                <p className="text-zinc-500 text-sm mt-0.5">
                  {continueData.sectionTitle}
                  {getTitleTranslation(continueData.sectionTitle, lang) && (
                    <span> · {getTitleTranslation(continueData.sectionTitle, lang)}</span>
                  )}
                </p>

                {/* Progress bar */}
                {continueData.watchedSeconds > 0 &&
                  continueData.durationSeconds > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 max-w-[180px] h-1 bg-zinc-700 rounded-full overflow-hidden">
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
                      <span className="text-xs text-zinc-500 font-mono">
                        {Math.round(
                          (continueData.watchedSeconds /
                            continueData.durationSeconds) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  )}
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
                <ArrowRight size={16} weight="bold" className="text-white" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* My Courses */}
      {courses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease }}
          className="mb-6"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
            {t.myCourses}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="group bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-zinc-200 transition-colors">
                  <BookOpen size={18} className="text-zinc-600" />
                </div>
                <p className="font-semibold text-zinc-900 leading-snug text-sm">
                  {course.title}
                </p>
                {getTitleTranslation(course.title, lang) && (
                  <p className="font-bold text-zinc-900 leading-snug text-sm">
                    {getTitleTranslation(course.title, lang)}
                  </p>
                )}
                {course.description && (
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
                    {getTitleTranslation(course.description, lang) ?? course.description}
                  </p>
                )}
                <div className="mt-3 text-xs text-zinc-400 font-mono">
                  {t.modules(course.moduleCount)}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
