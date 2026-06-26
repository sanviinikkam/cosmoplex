"use client";

import { useLang, setLang } from "@/lib/use-lang";
import type { Lang } from "@/lib/use-lang";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

export function LanguageBar() {
  const lang = useLang();
  return (
    <div className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-[1400px] mx-auto flex items-center gap-2 px-4 sm:px-8 md:px-16 py-2 overflow-x-auto">
        <span className="text-xs font-medium text-zinc-400 shrink-0 mr-1 hidden sm:inline">
          🌐
        </span>
        {LANGS.map((l) => {
          const active = lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`shrink-0 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
