"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./quiz-i18n";

export type { Lang };

const VALID: Lang[] = ["en", "hi", "mr", "te", "ta", "kn"];

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("cosmoplexx_language") as Lang | null;
  return saved && VALID.includes(saved) ? saved : "en";
}

export function useLang(): Lang {
  // Always start with "en" so server HTML matches the initial client render.
  // After mount, read localStorage and switch to the real language.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(readLang());

    function onStorage(e: StorageEvent) {
      if (e.key === "cosmoplexx_language") {
        setLangState(readLang());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return lang;
}

/** Call this instead of localStorage.setItem so all useLang() hooks update */
export function setLang(lang: Lang) {
  localStorage.setItem("cosmoplexx_language", lang);
  // Dispatch a storage event so same-tab listeners fire (native storage events only fire cross-tab)
  window.dispatchEvent(new StorageEvent("storage", { key: "cosmoplexx_language", newValue: lang }));
}
