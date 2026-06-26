"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Books,
  ChartBar,
  Certificate,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";

import { useLang } from "@/lib/use-lang";
import { getLanding, headingSpacing } from "@/lib/landing-i18n";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STAT_VALUES = ["5", "12+", "4.8k"];

type DemoMsg = {
  role: "assistant" | "user";
  agent?: string;
  text: string;
  color: string;
};

function DemoMessage({ msg, index }: { msg: DemoMsg; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.35, ease }}
      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
    >
      {msg.role === "assistant" && (
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            msg.color === "emerald"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {msg.agent === "Teacher" ? (
            <Books size={14} weight="bold" />
          ) : (
            <CheckCircle size={14} weight="bold" />
          )}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          msg.role === "user"
            ? "bg-zinc-900 text-white rounded-tr-sm"
            : "bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm"
        }`}
      >
        {msg.role === "assistant" && (
          <span
            className={`text-xs font-semibold block mb-1 ${
              msg.color === "emerald" ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {msg.agent}
          </span>
        )}
        {msg.text}
      </div>
    </motion.div>
  );
}

export function Hero() {
  const lang = useLang();
  const t = getLanding(lang);
  const demoMessages: DemoMsg[] = [
    { role: "assistant", agent: "Teacher", text: t.demoTeacher1, color: "emerald" },
    { role: "user", text: t.demoUser1, color: "zinc" },
    { role: "assistant", agent: "Teacher", text: t.demoTeacher2, color: "emerald" },
    { role: "assistant", agent: "Examiner", text: t.demoExaminer1, color: "amber" },
  ];
  return (
    <section className="min-h-[100dvh] grid md:grid-cols-2">
      {/* Left: Content */}
      <div className="flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-24 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-8">
            <Sparkle size={12} weight="fill" />
            {t.heroBadge}
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold ${headingSpacing(lang)} text-zinc-900 mb-6`}
        >
          {t.heroTitle1}
          <br />
          <span className="text-emerald-600">{t.heroTitle2}</span>
          <br />
          {t.heroTitle3}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease }}
          className="text-lg text-zinc-500 leading-relaxed max-w-[42ch] mb-10"
        >
          {t.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          className="flex flex-wrap gap-3 mb-16"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-zinc-700 transition-colors duration-200 active:scale-[0.98]"
          >
            {t.startLearning}
            <ArrowRight size={16} weight="bold" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium px-5 py-3 rounded-xl hover:bg-zinc-50 transition-colors duration-200 active:scale-[0.98]"
          >
            {t.signIn}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="flex gap-6 sm:gap-8"
        >
          {STAT_VALUES.map((value, i) => (
            <div key={i}>
              <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono">
                {value}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{t.statLabels[i]}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right: Demo chat preview */}
      <div className="hidden md:flex items-center justify-center bg-zinc-100 relative overflow-hidden px-8 lg:px-16">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #d4d4d8 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#059669]" />
            <span className="text-sm font-medium text-zinc-700">
              Cosmoplex
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Books size={15} className="text-zinc-400" />
              <ChartBar size={15} className="text-zinc-400" />
              <Certificate size={15} className="text-zinc-400" />
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 flex flex-col gap-4 min-h-[360px]">
            {demoMessages.map((msg, i) => (
              <DemoMessage key={i} msg={msg} index={i} />
            ))}
          </div>

          {/* Input area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, ease }}
            className="px-4 pb-4"
          >
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="text-sm text-zinc-400 flex-1">
                {t.inputPlaceholder}
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
                <ArrowRight size={13} className="text-white" weight="bold" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
