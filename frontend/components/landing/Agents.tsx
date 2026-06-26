"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Books,
  Image,
  ClipboardText,
  ListChecks,
  Seal,
} from "@phosphor-icons/react";
import { useLang } from "@/lib/use-lang";
import { getLanding, headingSpacing } from "@/lib/landing-i18n";

const AGENTS = [
  {
    icon: Books,
    name: "Teacher",
    color: "emerald",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    description:
      "Breaks down AI literacy concepts into digestible modules. Detects your language and adapts accordingly.",
    capability: "Multi-language delivery",
  },
  {
    icon: Image,
    name: "Illustrator",
    color: "violet",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    description:
      "Generates diagrams and visual analogies when a concept benefits from seeing, not just reading.",
    capability: "AI-generated visuals",
  },
  {
    icon: ClipboardText,
    name: "Examiner",
    color: "amber",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    description:
      "Constructs questions tied to what you've learned. Scores multiple-choice deterministically; grades open-ended with a structured rubric.",
    capability: "Rubric-based grading",
  },
  {
    icon: ListChecks,
    name: "Task Assigner",
    color: "sky",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    description:
      "Assigns real-world AI literacy exercises after each module. Tracks your submission and feeds it into your certification record.",
    capability: "Real-world exercises",
  },
  {
    icon: Seal,
    name: "Certifier",
    color: "rose",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    description:
      "Generates and delivers a verified PDF certificate — but only after deterministic code confirms every module is passed and every task is submitted.",
    capability: "Fraud-proof certification",
  },
];

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function Agents() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const lang = useLang();
  const t = getLanding(lang);

  return (
    <section ref={ref} className="py-16 md:py-24 px-6 sm:px-8 md:px-16 max-w-[1400px] mx-auto">
      <div className="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16 items-start">
        {/* Left: header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="md:sticky md:top-24"
        >
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-widest mb-4">
            {t.agentsEyebrow}
          </p>
          <h2 className={`text-4xl md:text-5xl font-semibold ${headingSpacing(lang)} text-zinc-900 mb-5`}>
            {t.agentsTitle1}
            <br />
            {t.agentsTitle2}
          </h2>
          <p className="text-zinc-500 leading-relaxed max-w-[36ch]">
            {t.agentsIntro}
          </p>
        </motion.div>

        {/* Right: agent cards */}
        <div className="flex flex-col gap-4">
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="group bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-10 h-10 rounded-xl ${agent.bg} ${agent.border} border flex items-center justify-center shrink-0`}
                  >
                    <Icon
                      size={20}
                      className={agent.text}
                      weight="duotone"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-zinc-900">
                        {agent.name}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${agent.bg} ${agent.text}`}
                      >
                        {t.agentCapabilities[i]}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {t.agentDescriptions[i]}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
