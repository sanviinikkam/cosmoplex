"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { setLang } from "@/lib/use-lang";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface LangOption {
  code: string;
  name: string;
  native: string;
  flag: string;
  hint: string;
}

const LANGUAGES: LangOption[] = [
  {
    code: "en",
    name: "English",
    native: "English",
    flag: "🇬🇧",
    hint: "Course content in English",
  },
  {
    code: "hi",
    name: "Hindi",
    native: "हिंदी",
    flag: "🇮🇳",
    hint: "हिंदी में कोर्स देखें",
  },
  {
    code: "mr",
    name: "Marathi",
    native: "मराठी",
    flag: "🇮🇳",
    hint: "मराठीत कोर्स पाहा",
  },
  {
    code: "te",
    name: "Telugu",
    native: "తెలుగు",
    flag: "🇮🇳",
    hint: "తెలుగులో కోర్సు చూడండి",
  },
  {
    code: "ta",
    name: "Tamil",
    native: "தமிழ்",
    flag: "🇮🇳",
    hint: "தமிழில் படிப்பை பாருங்கள்",
  },
  {
    code: "kn",
    name: "Kannada",
    native: "ಕನ್ನಡ",
    flag: "🇮🇳",
    hint: "ಕನ್ನಡದಲ್ಲಿ ಕೋರ್ಸ್ ನೋಡಿ",
  },
];

export function LanguageSelect() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError("");

    // Save to localStorage immediately so quiz can read it
    setLang(selected as "en" | "hi" | "mr" | "te" | "ta" | "kn");

    // Try to persist to backend (non-blocking — don't fail on error)
    const token = getToken();
    if (token) {
      try {
        await api.learner.updateLanguage(token, selected);
      } catch {
        // Not fatal — localStorage is the source of truth for the quiz
      }
    }

    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center">
          <span className="text-white text-sm font-bold font-mono">Cx</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-900">Cosmoplex</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="w-full max-w-3xl"
      >
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900 mb-1">
            Choose your language
          </h2>
          <p className="text-sm text-zinc-500 mb-7">
            Select the language you'd like to learn in. You can change this later.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelected(lang.code)}
                  className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl border-2 transition-all duration-150 text-left
                    ${isSelected
                      ? "border-zinc-900 bg-zinc-900"
                      : "border-zinc-200 bg-white hover:border-zinc-400"
                    }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-zinc-900"}`}>
                      {lang.native}
                      {lang.native !== lang.name && (
                        <span className={`ml-2 font-normal text-xs ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                          {lang.name}
                        </span>
                      )}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? "text-zinc-400" : "text-zinc-400"}`}>
                      {lang.hint}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait…" : "Continue"}
            {!loading && <ArrowRight size={15} weight="bold" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
