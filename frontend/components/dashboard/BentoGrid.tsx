"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, memo } from "react";
import {
  Books,
  CheckCircle,
  ClipboardText,
  ListChecks,
  Seal,
  ArrowRight,
  Lock,
  Play,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { Module, TaskAssignment, CourseProgress } from "@/lib/types";
import { ProgressRing } from "./ProgressRing";
import { useLang } from "@/lib/use-lang";
import { getAppI18n } from "@/lib/app-i18n";
import { getTitleTranslation } from "@/lib/title-i18n";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

// --- Typewriter card (Command Input archetype) ---
const PROMPTS = [
  "Explain how a transformer model works...",
  "What is the difference between AI and automation?",
  "How does supervised learning differ from unsupervised?",
  "What is a neural network, exactly?",
  "Can AI be biased? How does that happen?",
];

const TypewriterCard = memo(function TypewriterCard() {
  const t = getAppI18n(useLang());
  const [promptIdx, setPromptIdx] = useState(0);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const target = PROMPTS[promptIdx];
    if (typing) {
      if (text.length < target.length) {
        const t = setTimeout(() => setText(target.slice(0, text.length + 1)), 42);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 18);
        return () => clearTimeout(t);
      } else {
        setPromptIdx((i) => (i + 1) % PROMPTS.length);
        setTyping(true);
      }
    }
  }, [text, typing, promptIdx]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col justify-between min-h-[148px]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Books size={13} className="text-zinc-600" />
        </div>
        <span className="text-xs font-medium text-zinc-500">{t.askAnything}</span>
      </div>
      <div className="text-sm text-zinc-700 leading-relaxed min-h-[40px] font-mono">
        {text}
        <span className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 align-middle animate-pulse" />
      </div>
    </div>
  );
});

// --- Live status card ---
const STATUS_AGENTS = [
  { name: "Teacher", color: "bg-emerald-500", active: true },
  { name: "Examiner", color: "bg-amber-500", active: false },
  { name: "Illustrator", color: "bg-violet-500", active: false },
  { name: "Task Assigner", color: "bg-sky-500", active: false },
  { name: "Certifier", color: "bg-rose-500", active: false },
];

const LiveStatusCard = memo(function LiveStatusCard() {
  const t = getAppI18n(useLang());
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % STATUS_AGENTS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
      <div className="text-xs font-medium text-zinc-500 mb-4">{t.agentStatus}</div>
      <div className="flex flex-col gap-2.5">
        {STATUS_AGENTS.map((agent, i) => (
          <div key={agent.name} className="flex items-center gap-3">
            <div className="relative w-2 h-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  i === activeIdx ? agent.color : "bg-zinc-200"
                } transition-colors duration-500`}
              />
              {i === activeIdx && (
                <div
                  className={`absolute inset-0 rounded-full ${agent.color} animate-ping opacity-60`}
                />
              )}
            </div>
            <span
              className={`text-sm transition-colors duration-300 ${
                i === activeIdx ? "text-zinc-900 font-medium" : "text-zinc-400"
              }`}
            >
              {agent.name}
            </span>
            {i === activeIdx && (
              <span className="ml-auto text-xs text-emerald-600 font-medium">
                {t.active}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

// --- Module list card ---
const STATUS_STYLES = {
  locked: "text-zinc-400 bg-zinc-50 border-zinc-100",
  available: "text-sky-600 bg-sky-50 border-sky-100",
  in_progress: "text-emerald-600 bg-emerald-50 border-emerald-100",
  completed: "text-zinc-500 bg-zinc-50 border-zinc-100",
};

function ModuleRow({ mod, index, lang }: { mod: Module; index: number; lang: ReturnType<typeof useLang> }) {
  const translated = getTitleTranslation(mod.title, lang);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease }}
      className="flex items-center gap-3 py-3 border-b border-zinc-50 last:border-0"
    >
      <div
        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${STATUS_STYLES[mod.status]}`}
      >
        {mod.status === "completed" ? (
          <CheckCircle size={14} weight="bold" />
        ) : mod.status === "locked" ? (
          <Lock size={13} />
        ) : mod.status === "in_progress" ? (
          <Play size={12} weight="fill" />
        ) : (
          <Books size={13} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-800 truncate">{mod.title}</div>
        {translated && (
          <div className="text-sm font-bold text-zinc-800 truncate">{translated}</div>
        )}
        {mod.score !== undefined && (
          <div className="text-xs text-zinc-400 font-mono">{mod.score}%</div>
        )}
      </div>
    </motion.div>
  );
}

// --- Main dashboard grid ---
interface Props {
  progress: CourseProgress;
  modules: Module[];
  tasks: TaskAssignment[];
  userName: string;
  hideName?: boolean;
}

export function BentoGrid({ progress, modules, tasks, userName, hideName }: Props) {
  const lang = useLang();
  const t = getAppI18n(lang);
  const pct = Math.round(
    (progress.completedModules / progress.totalModules) * 100
  );
  const pendingTasks = tasks.filter(
    (task) => task.status === "assigned" || task.status === "in_progress"
  );

  return (
    <div className="p-6 md:p-8 max-w-[1200px]">
      {/* Header */}
      {!hideName && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back, {userName.split(" ")[0]}.
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {progress.completedModules} of {progress.totalModules} modules
            complete.
          </p>
        </motion.div>
      )}
      {hideName && (
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
            {t.agentProgress}
          </p>
        </div>
      )}

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {/* Progress — large card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease }}
          className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 md:p-7 flex items-center gap-5 md:gap-8"
        >
          <div className="relative">
            <ProgressRing value={pct} size={96} stroke={7} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-semibold font-mono text-zinc-900">
                {pct}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-widest">
              {t.overallProgress}
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-900 mb-1">
              {progress.completedModules}
              <span className="text-zinc-400 font-normal text-lg">
                /{progress.totalModules}
              </span>
            </div>
            <div className="text-sm text-zinc-500">
              {t.avgScore}{" "}
              <span className="font-mono text-zinc-900 font-medium">
                {progress.averageScore.toFixed(1)}%
              </span>
            </div>
            {progress.certificateEligible && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <Seal size={12} weight="fill" />
                {t.certificateAvailable}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tasks card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="bg-white rounded-2xl border border-zinc-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-sky-600" />
              <span className="text-xs font-medium text-zinc-500">{t.tasks}</span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {progress.tasksCompleted}/{progress.totalTasks}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {pendingTasks.slice(0, 3).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, ease }}
                  className="text-sm text-zinc-600 flex items-start gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <span className="truncate">{task.title}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {pendingTasks.length === 0 && (
              <div className="text-sm text-zinc-400">{t.allTasksComplete}</div>
            )}
          </div>
        </motion.div>

        {/* Live status card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
        >
          <LiveStatusCard />
        </motion.div>

        {/* Continue learning CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="md:col-span-2 bg-zinc-900 rounded-2xl p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6"
        >
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-widest mb-2">
              {t.currentModule}
            </div>
            {(() => {
              const activeModule = modules.find((m) => m.status === "in_progress") ?? modules.find((m) => m.status === "available");
              const title = activeModule?.title ?? t.allModulesComplete;
              const translated = activeModule ? getTitleTranslation(activeModule.title, lang) : null;
              return (
                <>
                  <div className="text-white font-semibold text-lg leading-snug mb-0.5">{title}</div>
                  {translated && <div className="text-white font-bold text-base leading-snug mb-1">{translated}</div>}
                  <div className="text-zinc-500 text-sm">
                    {activeModule?.description ?? t.pickUpWhereLeft}
                  </div>
                </>
              );
            })()}
          </div>
          <Link
            href="/learn"
            className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors active:scale-[0.98]"
          >
            {t.continueCta}
            <ArrowRight size={15} weight="bold" />
          </Link>
        </motion.div>

        {/* Typewriter card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease }}
          className="md:col-span-1"
        >
          <TypewriterCard />
        </motion.div>

        {/* Exam results */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.27, ease }}
          className="bg-white rounded-2xl border border-zinc-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <ClipboardText size={16} className="text-amber-600" />
            <span className="text-xs font-medium text-zinc-500">
              {t.examScores}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {modules
              .filter((m) => m.status === "completed" && m.score !== undefined)
              .slice(-4)
              .map((m, i) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${m.score}%`, maxWidth: "100%" }}
                  />
                  <span className="text-xs font-mono text-zinc-500 shrink-0">
                    {m.score}%
                  </span>
                </div>
              ))}
            {modules.filter((m) => m.status === "completed").length === 0 && (
              <div className="text-sm text-zinc-400">
                {t.noExams}
              </div>
            )}
          </div>
        </motion.div>

        {/* Module list — full width */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="md:col-span-3 lg:col-span-4 bg-white rounded-2xl border border-zinc-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-zinc-900">
              {t.allModules}
            </span>
            <Link
              href="/learn"
              className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1 transition-colors"
            >
              {t.goToLesson}
              <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-x-8">
            {modules.map((mod, i) => (
              <ModuleRow key={mod.id} mod={mod} index={i} lang={lang} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
