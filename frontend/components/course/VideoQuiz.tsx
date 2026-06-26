"use client";

import { useState, useEffect, type ReactNode } from "react";
import { CheckCircle, XCircle, ArrowRight, Trophy, Clock, ArrowClockwise } from "@phosphor-icons/react";
import type { MCQ } from "@/lib/quiz-data";
import { qText, qOptions } from "@/lib/quiz-data";
import type { Lang } from "@/lib/use-lang";

interface Props {
  questions: MCQ[];
  lang: Lang;
  onFinish: () => void;
}

type Phase = "intro" | "quiz" | "results";

// UI label translations
const ui = {
  en: {
    title: "Quick Quiz",
    introHeading: "Ready for a quick quiz?",
    introQuestions: (n: number) => `${n} multiple-choice questions`,
    introTime: (m: number) => `${m} minutes to complete`,
    introNote: "The timer starts as soon as you begin.",
    start: "Start Quiz",
    seeResults: "See Results",
    next: "Next",
    continue: "Continue",
    result: "Quiz Result",
    correct: "Correct:",
    retake: "Retake Quiz",
    failMsg: (need: number, total: number) => `You need at least ${need}/${total} to continue. Give it another go.`,
  },
  hi: {
    title: "त्वरित प्रश्नोत्तरी",
    introHeading: "एक त्वरित प्रश्नोत्तरी के लिए तैयार हैं?",
    introQuestions: (n: number) => `${n} बहुविकल्पीय प्रश्न`,
    introTime: (m: number) => `पूरा करने के लिए ${m} मिनट`,
    introNote: "शुरू करते ही टाइमर चालू हो जाएगा।",
    start: "प्रश्नोत्तरी शुरू करें",
    seeResults: "नतीजे देखें",
    next: "अगला",
    continue: "जारी रखें",
    result: "प्रश्नोत्तरी परिणाम",
    correct: "सही उत्तर:",
    retake: "फिर से प्रश्नोत्तरी दें",
    failMsg: (need: number, total: number) => `जारी रखने के लिए आपको कम से कम ${need}/${total} चाहिए। फिर से कोशिश करें।`,
  },
  mr: {
    title: "त्वरित प्रश्नमंजुषा",
    introHeading: "एका झटपट प्रश्नमंजुषेसाठी तयार आहात?",
    introQuestions: (n: number) => `${n} बहुपर्यायी प्रश्न`,
    introTime: (m: number) => `पूर्ण करण्यासाठी ${m} मिनिटे`,
    introNote: "सुरू करताच टाइमर सुरू होईल.",
    start: "प्रश्नमंजुषा सुरू करा",
    seeResults: "निकाल पाहा",
    next: "पुढे",
    continue: "सुरू ठेवा",
    result: "प्रश्नमंजुषा निकाल",
    correct: "बरोबर उत्तर:",
    retake: "पुन्हा प्रश्नमंजुषा द्या",
    failMsg: (need: number, total: number) => `पुढे जाण्यासाठी तुम्हाला किमान ${need}/${total} हवे. पुन्हा प्रयत्न करा.`,
  },
  te: {
    title: "శీఘ్ర క్విజ్",
    introHeading: "శీఘ్ర క్విజ్‌కు సిద్ధంగా ఉన్నారా?",
    introQuestions: (n: number) => `${n} బహుళైచ్ఛిక ప్రశ్నలు`,
    introTime: (m: number) => `పూర్తి చేయడానికి ${m} నిమిషాలు`,
    introNote: "మీరు ప్రారంభించగానే టైమర్ మొదలవుతుంది.",
    start: "క్విజ్ ప్రారంభించండి",
    seeResults: "ఫలితాలు చూడండి",
    next: "తదుపరి",
    continue: "కొనసాగించు",
    result: "క్విజ్ ఫలితం",
    correct: "సరైన సమాధానం:",
    retake: "క్విజ్ మళ్ళీ రాయండి",
    failMsg: (need: number, total: number) => `కొనసాగడానికి మీకు కనీసం ${need}/${total} కావాలి. మళ్ళీ ట్రై చేయండి.`,
  },
  ta: {
    title: "விரைவு வினாடி வினா",
    introHeading: "விரைவு வினாடி வினாவுக்கு தயாரா?",
    introQuestions: (n: number) => `${n} பல்தேர்வு கேள்விகள்`,
    introTime: (m: number) => `முடிக்க ${m} நிமிடங்கள்`,
    introNote: "நீங்கள் தொடங்கியதும் டைமர் ஆரம்பமாகும்.",
    start: "வினாடி வினாவை தொடங்கு",
    seeResults: "முடிவுகளை பாருங்கள்",
    next: "அடுத்து",
    continue: "தொடரவும்",
    result: "வினாடி வினா முடிவு",
    correct: "சரியான பதில்:",
    retake: "வினாடி வினாவை மீண்டும் எழுதுங்கள்",
    failMsg: (need: number, total: number) => `தொடர குறைந்தது ${need}/${total} தேவை. மீண்டும் முயற்சிக்கவும்.`,
  },
  kn: {
    title: "ತ್ವರಿತ ರಸಪ್ರಶ್ನೆ",
    introHeading: "ತ್ವರಿತ ರಸಪ್ರಶ್ನೆಗೆ ಸಿದ್ಧವಾಗಿದ್ದೀರಾ?",
    introQuestions: (n: number) => `${n} ಬಹು ಆಯ್ಕೆ ಪ್ರಶ್ನೆಗಳು`,
    introTime: (m: number) => `ಪೂರ್ಣಗೊಳಿಸಲು ${m} ನಿಮಿಷಗಳು`,
    introNote: "ನೀವು ಪ್ರಾರಂಭಿಸಿದ ತಕ್ಷಣ ಟೈಮರ್ ಆರಂಭವಾಗುತ್ತದೆ.",
    start: "ರಸಪ್ರಶ್ನೆ ಪ್ರಾರಂಭಿಸಿ",
    seeResults: "ಫಲಿತಾಂಶ ನೋಡಿ",
    next: "ಮುಂದಿನದು",
    continue: "ಮುಂದುವರಿಸಿ",
    result: "ರಸಪ್ರಶ್ನೆ ಫಲಿತಾಂಶ",
    correct: "ಸರಿಯಾದ ಉತ್ತರ:",
    retake: "ರಸಪ್ರಶ್ನೆ ಮತ್ತೆ ಬರೆಯಿರಿ",
    failMsg: (need: number, total: number) => `ಮುಂದುವರಿಯಲು ನಿಮಗೆ ಕನಿಷ್ಠ ${need}/${total} ಬೇಕು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.`,
  },
} as const;

const QUIZ_DURATION = 180; // seconds — 3-minute timer for the whole quiz

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoQuiz({ questions, lang, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);

  // Countdown ticks once per second while the quiz is active
  useEffect(() => {
    if (phase !== "quiz") return;
    const id = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Time's up — lock in any current selection and jump to results
  useEffect(() => {
    if (phase === "quiz" && timeLeft === 0) {
      setAnswers((prev) => (selected !== null ? [...prev, selected] : prev));
      setPhase("results");
    }
  }, [timeLeft, phase, selected]);

  const t = ui[lang] ?? ui.en;
  const q = questions[current];
  const isLast = current === questions.length - 1;

  function handleOptionClick(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
  }

  function handleNext() {
    const newAnswers = [...answers, selected!];
    if (isLast) {
      setAnswers(newAnswers);
      setPhase("results");
    } else {
      setAnswers(newAnswers);
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  const score =
    phase === "results"
      ? answers.filter((ans, i) => ans === questions[i].correctIndex).length
      : 0;
  const passMark = Math.ceil(questions.length * 0.6); // 3 of 5
  const passed = score >= passMark;

  function handleRetake() {
    setAnswers([]);
    setSelected(null);
    setCurrent(0);
    setTimeLeft(QUIZ_DURATION);
    setPhase("quiz");
  }

  let inner: ReactNode;

  if (phase === "intro") {
    // ── Intro / "get ready" screen ──
    inner = (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
          <Clock size={30} weight="fill" className="text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
            {t.title}
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">
            {t.introHeading}
          </h2>
          <div className="flex flex-col gap-1.5 text-sm text-zinc-600">
            <span>{t.introQuestions(questions.length)}</span>
            <span className="inline-flex items-center justify-center gap-1.5 font-medium text-zinc-800">
              <Clock size={14} weight="bold" />
              {t.introTime(Math.round(QUIZ_DURATION / 60))}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-3">{t.introNote}</p>
        </div>
        <button
          onClick={() => setPhase("quiz")}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
        >
          {t.start}
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    );
  } else if (phase === "results") {
    const pct = Math.round((score / questions.length) * 100);
    inner = (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col items-center gap-6 text-center">
        <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <Trophy size={32} weight="fill" className={passed ? "text-emerald-500" : "text-amber-500"} />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">
            {t.result}
          </p>
          <p className="text-4xl font-semibold font-mono text-zinc-900">
            {score}/{questions.length}
          </p>
          <p className="text-zinc-500 text-sm mt-1">{pct}%</p>
        </div>

        {/* Per-question breakdown */}
        <div className="w-full text-left space-y-3">
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            const opts = qOptions(q, lang);
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 ${
                  correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {correct ? (
                    <CheckCircle size={18} weight="fill" className="text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={18} weight="fill" className="text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{qText(q, lang)}</p>
                    {!correct && (
                      <p className="text-xs text-emerald-700 mt-1">
                        {t.correct} {opts[q.correctIndex]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {passed ? (
          <button
            onClick={onFinish}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            {t.continue}
            <ArrowRight size={14} weight="bold" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-amber-700">
              {t.failMsg(passMark, questions.length)}
            </p>
            <button
              onClick={handleRetake}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              <ArrowClockwise size={14} weight="bold" />
              {t.retake}
            </button>
          </div>
        )}
      </div>
    );
  } else {
    const opts = qOptions(q, lang);
    inner = (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
            {t.title}
          </p>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums ${
                timeLeft <= 30 ? "text-red-500" : "text-zinc-400"
              }`}
            >
              <Clock size={13} weight={timeLeft <= 30 ? "fill" : "regular"} />
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {current + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < current ? "bg-emerald-500" : i === current ? "bg-zinc-900" : "bg-zinc-100"
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <p className="text-zinc-900 font-medium leading-snug">{qText(q, lang)}</p>

        {/* Options */}
        <div className="grid gap-2.5">
          {opts.map((opt, idx) => {
            let style = "border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700";
            if (selected !== null) {
              if (idx === q.correctIndex) {
                style = "border border-emerald-400 bg-emerald-50 text-emerald-800";
              } else if (idx === selected && selected !== q.correctIndex) {
                style = "border border-red-400 bg-red-50 text-red-700";
              } else {
                style = "border border-zinc-200 bg-zinc-50 text-zinc-400";
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={selected !== null}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${style} ${
                  selected === null ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-xs font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next / See Results */}
        {selected !== null && (
          <button
            onClick={handleNext}
            className="self-end inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {isLast ? t.seeResults : t.next}
            <ArrowRight size={14} weight="bold" />
          </button>
        )}
      </div>
    );
  }

  // Everything renders inside a centered modal popup over the page
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {inner}
      </div>
    </div>
  );
}
