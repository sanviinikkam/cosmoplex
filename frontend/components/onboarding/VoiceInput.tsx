"use client";

import { useEffect, useRef, useState } from "react";
import { Microphone } from "@phosphor-icons/react";
import type { Lang } from "@/lib/use-lang";

// Map the learner's language to a BCP-47 locale for speech recognition.
const LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
};

const TOOLTIP: Record<Lang, string> = {
  en: "Speak your answer",
  hi: "बोलकर जवाब दें",
  mr: "बोलून उत्तर द्या",
  te: "మాట్లాడి సమాధానం చెప్పండి",
  ta: "பேசி பதிலளியுங்கள்",
  kn: "ಮಾತನಾಡಿ ಉತ್ತರಿಸಿ",
};

interface Props {
  lang: Lang;
  /** Called with each finalized chunk of recognized text. */
  onText: (text: string) => void;
  className?: string;
}

/** A mic button that dictates speech into text using the browser's Web Speech API. */
export function VoiceInput({ lang, onText, className }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<unknown>(null);

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) setSupported(false);
    return () => {
      try {
        (recRef.current as { stop?: () => void } | null)?.stop?.();
      } catch {
        /* no-op */
      }
    };
  }, []);

  function toggle() {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      (recRef.current as { stop?: () => void } | null)?.stop?.();
      return;
    }

    const rec = new SR() as {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
      stop: () => void;
    };
    rec.lang = LOCALE[lang] ?? "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={TOOLTIP[lang] ?? TOOLTIP.en}
      aria-label={TOOLTIP[lang] ?? TOOLTIP.en}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        listening
          ? "bg-red-50 text-red-500 animate-pulse"
          : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
      } ${className ?? ""}`}
    >
      <Microphone size={16} weight={listening ? "fill" : "regular"} />
    </button>
  );
}
