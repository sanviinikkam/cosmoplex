"use client";

import Link from "next/link";
import { useLang } from "@/lib/use-lang";
import { getLanding } from "@/lib/landing-i18n";

export function Footer() {
  const lang = useLang();
  const t = getLanding(lang);
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 sm:px-8 md:px-16 py-12">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="text-base font-semibold tracking-tight text-zinc-900 mb-1">
            Cosmoplex
          </div>
          <div className="text-sm text-zinc-500">{t.footerTagline}</div>
        </div>

        <nav className="flex flex-wrap gap-6 text-sm text-zinc-500">
          <Link href="/signup" className="hover:text-zinc-900 transition-colors">
            {t.getStarted}
          </Link>
          <Link href="/login" className="hover:text-zinc-900 transition-colors">
            {t.signIn}
          </Link>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-400 text-xs self-center">{t.builtWith}</span>
        </nav>
      </div>
    </footer>
  );
}
