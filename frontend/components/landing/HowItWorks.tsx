"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowDown,
  BookOpenText,
  CheckFat,
  Confetti,
  ListMagnifyingGlass,
  PencilLine,
} from "@phosphor-icons/react";
import { useLang } from "@/lib/use-lang";
import { getLanding, headingSpacing } from "@/lib/landing-i18n";

const STEP_META = [
  { step: "01", icon: BookOpenText },
  { step: "02", icon: PencilLine },
  { step: "03", icon: ListMagnifyingGlass },
  { step: "04", icon: CheckFat },
  { step: "05", icon: Confetti },
];

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const lang = useLang();
  const t = getLanding(lang);

  return (
    <section
      ref={ref}
      className="py-16 md:py-24 bg-white border-y border-zinc-100 px-6 sm:px-8 md:px-16"
    >
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="mb-16"
        >
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-widest mb-4">
            {t.howEyebrow}
          </p>
          <h2 className={`text-4xl md:text-5xl font-semibold ${headingSpacing(lang)} text-zinc-900`}>
            {t.howTitle}
          </h2>
        </motion.div>

        <div className="flex flex-col gap-0 max-w-2xl">
          {STEP_META.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEP_META.length - 1;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="flex gap-6"
              >
                {/* Step indicator column */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                    <Icon size={18} weight="bold" />
                  </div>
                  {!isLast && (
                    <div className="w-px h-full min-h-[48px] bg-zinc-200 my-2 flex items-center justify-center">
                      <ArrowDown
                        size={12}
                        className="text-zinc-400 absolute"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
                  <span className="text-xs font-mono text-zinc-400 mb-1 block">
                    {step.step}
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    {t.stepTitles[i]}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-[50ch]">
                    {t.stepBodies[i]}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
