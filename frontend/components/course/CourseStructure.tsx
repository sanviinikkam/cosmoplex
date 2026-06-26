"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Lock,
  Play,
  VideoCamera,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { CourseDetail, CourseSection, VideoItem } from "@/lib/types";
import { useLang } from "@/lib/use-lang";
import { getAppI18n, type AppI18n } from "@/lib/app-i18n";
import { getTitleTranslation } from "@/lib/title-i18n";
import type { Lang } from "@/lib/quiz-i18n";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

function LocalTitle({
  title,
  lang,
  className,
}: {
  title: string;
  lang: Lang;
  className?: string;
}) {
  const translated = getTitleTranslation(title, lang);
  return (
    <span className="flex flex-col gap-0.5">
      <span className={className}>{title}</span>
      {translated && (
        <span className={`${className} font-bold`}>{translated}</span>
      )}
    </span>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function progressPct(video: VideoItem): number {
  const dur = video.durationSavedSeconds || video.durationSeconds;
  if (!dur || dur === 0) return 0;
  return Math.min(100, Math.round((video.watchedSeconds / dur) * 100));
}

// ── Single video row ──────────────────────────────────────────────────────────
function VideoRow({
  video,
  courseId,
  active,
  lang,
}: {
  video: VideoItem;
  courseId: string;
  active?: boolean;
  lang: Lang;
}) {
  const pct = progressPct(video);
  const isLocked = !video.unlocked;
  const isComplete = video.completed;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : isLocked
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-zinc-50 cursor-pointer"
      }`}
    >
      {/* Status icon */}
      <div className="shrink-0 w-7 h-7 flex items-center justify-center">
        {isLocked ? (
          <Lock size={15} className="text-zinc-400" />
        ) : isComplete ? (
          <CheckCircle size={18} weight="fill" className="text-emerald-500" />
        ) : active ? (
          <Play size={14} weight="fill" className="text-white" />
        ) : (
          <VideoCamera size={15} className="text-zinc-500" />
        )}
      </div>

      {/* Title + progress */}
      <div className="flex-1 min-w-0">
        {isLocked ? (
          <LocalTitle
            title={video.title}
            lang={lang}
            className={`text-sm leading-snug ${active ? "text-white font-medium" : "text-zinc-700"}`}
          />
        ) : (
          <Link
            href={`/course/${courseId}/learn/${video.id}`}
            className="text-sm text-zinc-700 hover:text-zinc-900 leading-snug block"
          >
            <LocalTitle title={video.title} lang={lang} className={`text-sm ${active ? "text-white font-medium" : "text-zinc-700"}`} />
          </Link>
        )}
        {pct > 0 && !isComplete && (
          <div className="mt-1.5 h-0.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Duration — prefer the real measured duration over the seeded estimate */}
      {(video.durationSavedSeconds || video.durationSeconds) && (
        <span
          className={`text-xs font-mono shrink-0 ${
            active ? "text-zinc-300" : "text-zinc-400"
          }`}
        >
          {formatDuration(video.durationSavedSeconds || video.durationSeconds)}
        </span>
      )}
    </div>
  );
}

// ── Section accordion ─────────────────────────────────────────────────────────
function SectionAccordion({
  section,
  courseId,
  activeVideoId,
  defaultOpen,
  t,
  lang,
}: {
  section: CourseSection;
  courseId: string;
  activeVideoId?: string;
  defaultOpen?: boolean;
  t: AppI18n;
  lang: Lang;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const hasActive = section.videos.some((v) => v.id === activeVideoId);
  const isOpen = open || hasActive;

  const completedCount = section.videos.filter((v) => v.completed).length;

  return (
    <div className="border border-zinc-100 rounded-2xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        <div className="shrink-0">
          {section.completed ? (
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
          ) : !section.unlocked ? (
            <Lock size={15} className="text-zinc-300" />
          ) : isOpen ? (
            <CaretDown size={14} className="text-zinc-500" />
          ) : (
            <CaretRight size={14} className="text-zinc-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <LocalTitle
            title={section.title}
            lang={lang}
            className={`text-sm font-medium leading-snug ${!section.unlocked ? "text-zinc-400" : "text-zinc-800"}`}
          />
          <div style={{ display: "none" }} />
          {section.videos.length > 0 && (
            <div className="text-xs text-zinc-400 mt-0.5">
              {t.sectionProgress(completedCount, section.videos.length)}
            </div>
          )}
        </div>
      </button>

      {/* Video list */}
      <AnimatePresence initial={false}>
        {isOpen && section.unlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden border-t border-zinc-100 bg-white"
          >
            <div className="p-2 flex flex-col gap-0.5">
              {section.videos.map((video) => (
                <VideoRow
                  key={video.id}
                  video={video}
                  courseId={courseId}
                  active={video.id === activeVideoId}
                  lang={lang}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Module accordion ──────────────────────────────────────────────────────────
function ModuleAccordion({
  module,
  courseId,
  activeVideoId,
  index,
  t,
  lang,
}: {
  module: CourseDetail["modules"][number];
  courseId: string;
  activeVideoId?: string;
  index: number;
  t: AppI18n;
  lang: Lang;
}) {
  const isLocked = !module.unlocked;
  const hasActive = module.sections.some((s) =>
    s.videos.some((v) => v.id === activeVideoId)
  );
  const [open, setOpen] = useState(!isLocked && (hasActive || index === 0));

  const totalVideos = module.sections.reduce(
    (acc, s) => acc + s.videos.length,
    0
  );
  const completedVideos = module.sections.reduce(
    (acc, s) => acc + s.videos.filter((v) => v.completed).length,
    0
  );
  const allComplete = totalVideos > 0 && completedVideos === totalVideos;

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Module header */}
      <button
        onClick={() => !isLocked && setOpen((o) => !o)}
        disabled={isLocked}
        className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left disabled:cursor-not-allowed disabled:hover:bg-zinc-50"
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
            isLocked
              ? "bg-zinc-100 border border-zinc-200 text-zinc-400"
              : allComplete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-white border border-zinc-200 text-zinc-500"
          }`}
        >
          {isLocked ? (
            <Lock size={14} className="text-zinc-400" />
          ) : allComplete ? (
            <CheckCircle size={16} weight="fill" />
          ) : (
            index + 1
          )}
        </div>

        <div className="flex-1 min-w-0">
          <LocalTitle
            title={module.title}
            lang={lang}
            className="text-sm font-semibold text-zinc-900 leading-snug"
          />
          {module.outcome && (
            <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-1">
              {module.outcome}
            </div>
          )}
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            {t.moduleVideos(completedVideos, totalVideos)}
          </div>
        </div>

        <div className="shrink-0">
          {open ? (
            <CaretDown size={14} className="text-zinc-400" />
          ) : (
            <CaretRight size={14} className="text-zinc-400" />
          )}
        </div>
      </button>

      {/* Sections */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden border-t border-zinc-200 bg-white"
          >
            <div className="p-3 flex flex-col gap-2">
              {module.sections.map((section, si) => (
                <SectionAccordion
                  key={section.id}
                  section={section}
                  courseId={courseId}
                  activeVideoId={activeVideoId}
                  defaultOpen={si === 0 && index === 0}
                  t={t}
                  lang={lang}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Level group header ────────────────────────────────────────────────────────
function LevelHeader({
  level,
  unlocked,
  t,
}: {
  level: number;
  unlocked: boolean;
  t: AppI18n;
}) {
  const colors: Record<number, string> = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200",
    2: "bg-blue-50 text-blue-700 border-blue-200",
    3: "bg-violet-50 text-violet-700 border-violet-200",
  };
  const cls = colors[level] ?? "bg-zinc-50 text-zinc-600 border-zinc-200";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cls}`}>
      {unlocked ? null : <Lock size={13} className="shrink-0 opacity-60" />}
      <span className="text-xs font-semibold tracking-wide">{t.levelLabel(level)}</span>
      {!unlocked && (
        <span className="ml-auto text-xs opacity-70">{t.levelLocked(level)}</span>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function CourseStructure({
  course,
  activeVideoId,
  compact = false,
}: {
  course: CourseDetail;
  activeVideoId?: string;
  compact?: boolean;
}) {
  const lang = useLang();
  const t = getAppI18n(lang);

  const totalVideos = course.modules.reduce(
    (acc, m) => acc + m.sections.reduce((a, s) => a + s.videos.length, 0),
    0
  );

  // Group modules by level
  const levels = [1, 2, 3];
  const modulesByLevel: Record<number, CourseDetail["modules"]> = { 1: [], 2: [], 3: [] };
  for (const mod of course.modules) {
    const lv = mod.level ?? 1;
    if (!modulesByLevel[lv]) modulesByLevel[lv] = [];
    modulesByLevel[lv].push(mod);
  }

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <div className="mb-1">
          <h2 className="text-base font-semibold text-zinc-900">
            {t.courseContent}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t.modulesSummary(course.modules.length, totalVideos)}
          </p>
        </div>
      )}

      {levels.map((level) => {
        const mods = modulesByLevel[level];
        if (!mods || mods.length === 0) return null;
        const levelUnlocked = mods[0].unlocked;

        return (
          <div key={level} className="flex flex-col gap-2">
            <LevelHeader level={level} unlocked={levelUnlocked} t={t} />
            <div className={`flex flex-col gap-2 ${!levelUnlocked ? "opacity-50 pointer-events-none" : ""}`}>
              {mods.map((mod, i) => (
                <ModuleAccordion
                  key={mod.id}
                  module={mod}
                  courseId={course.id}
                  activeVideoId={activeVideoId}
                  index={i}
                  t={t}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
