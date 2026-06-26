"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useLang } from "@/lib/use-lang";
import { getLanding, headingSpacing } from "@/lib/landing-i18n";

export function CtaSection() {
  const lang = useLang();
  const t = getLanding(lang);
  return (
    <section className="py-16 md:py-24 px-6 sm:px-8 md:px-16">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-zinc-900 rounded-3xl px-6 sm:px-10 md:px-20 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className={`text-3xl md:text-4xl font-semibold ${headingSpacing(lang)} text-white mb-3`}>
              {t.ctaTitle}
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed max-w-[46ch]">
              {t.ctaBody}
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-colors duration-200 active:scale-[0.98]"
          >
            {t.ctaButton}
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
