"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { getQuizI18n } from "@/lib/quiz-i18n";
import { useLang } from "@/lib/use-lang";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  employment_status: string;
  job_role: string;
  target_job_role: string;
  industry: string;
  learning_objective: string;
  daily_time_mins: number;
  // optional
  college: string;
  graduation_year: string;
  hometown: string;
  prior_ai_exposure: string;
}

const EMPTY: FormData = {
  employment_status: "",
  job_role: "",
  target_job_role: "",
  industry: "",
  learning_objective: "",
  daily_time_mins: 30,
  college: "",
  graduation_year: "",
  hometown: "",
  prior_ai_exposure: "",
};

// ── Step definitions ──────────────────────────────────────────────────────────

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

type StepId = "status" | "role" | "goal" | "time" | "optional" | "done";

interface Step {
  id: StepId;
  optional?: boolean;
}

const STEPS: Step[] = [
  { id: "status" },
  { id: "role" },
  { id: "goal" },
  { id: "time" },
  { id: "optional", optional: true },
  { id: "done" },
];

// ── Option button ─────────────────────────────────────────────────────────────

function OptionBtn({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all duration-150
        ${selected
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
        }`}
    >
      {label}
    </button>
  );
}

// ── Main quiz ────────────────────────────────────────────────────────────────

export function OnboardingQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("");
  const [error, setError] = useState("");
  const lang = useLang();

  const t = getQuizI18n(lang);
  const current = STEPS[step];

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function next() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function buildPayload(includeOptional: boolean) {
    return {
      employment_status: form.employment_status,
      job_role: form.employment_status === "working" ? form.job_role : undefined,
      target_job_role: form.employment_status !== "working" ? form.target_job_role : undefined,
      industry: form.industry || undefined,
      learning_objective: form.learning_objective,
      daily_time_mins: form.daily_time_mins,
      ...(includeOptional && {
        college: form.college || undefined,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
        hometown: form.hometown || undefined,
        prior_ai_exposure: form.prior_ai_exposure || undefined,
      }),
    };
  }

  // Skip — always proceeds to done, never shows an error
  async function skip() {
    setLoading(true);
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      const result = await api.onboarding.submit(token, buildPayload(false));
      setPersona(result.persona);
    } catch {
      // Optional step — proceed to done even if backend fails
    }
    setDirection(1);
    setStep(STEPS.length - 1);
    setLoading(false);
  }

  // Finish — submits with optional data, shows error on failure
  async function submit() {
    setLoading(true);
    setError("");
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      const result = await api.onboarding.submit(token, buildPayload(true));
      setPersona(result.persona);
      setDirection(1);
      setStep(STEPS.length - 1);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const canProceed = (() => {
    switch (current.id) {
      case "status":   return !!form.employment_status;
      case "role":     return !!(form.job_role || form.target_job_role);
      case "goal":     return form.learning_objective.trim().length > 5;
      case "time":     return form.daily_time_mins > 0;
      case "optional": return true;
      default:         return true;
    }
  })();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center">
          <span className="text-white text-sm font-bold font-mono">Cx</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-900">Cosmoplex</span>
      </div>

      {/* Progress dots */}
      {current.id !== "done" && (
        <div className="flex gap-2 mb-8">
          {STEPS.slice(0, -1).map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? "w-6 bg-zinc-900" : i === step ? "w-6 bg-zinc-400" : "w-3 bg-zinc-200"
              }`}
            />
          ))}
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease }}
            className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm"
          >

            {/* ── Step: Status ── */}
            {current.id === "status" && (
              <div>
                <p className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-widest">
                  {t.stepOf(1, 4)}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 mb-6">
                  {t.status.question}
                </h2>
                <div className="flex flex-col gap-3">
                  {t.status.options.map(({ val, label }) => (
                    <OptionBtn
                      key={val}
                      label={label}
                      selected={form.employment_status === val}
                      onClick={() => set("employment_status", val)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Step: Role ── */}
            {current.id === "role" && (
              <div>
                <p className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-widest">
                  {t.stepOf(2, 4)}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                  {form.employment_status === "working"
                    ? t.role.questionWorking
                    : t.role.questionStudent}
                </h2>
                <p className="text-sm text-zinc-500 mb-6">{t.role.hint}</p>
                <input
                  type="text"
                  placeholder={
                    form.employment_status === "working"
                      ? t.role.placeholderWorking
                      : t.role.placeholderStudent
                  }
                  value={form.employment_status === "working" ? form.job_role : form.target_job_role}
                  onChange={(e) =>
                    form.employment_status === "working"
                      ? set("job_role", e.target.value)
                      : set("target_job_role", e.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 mb-4"
                />
                <input
                  type="text"
                  placeholder={t.role.industryPlaceholder}
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
                />
              </div>
            )}

            {/* ── Step: Goal ── */}
            {current.id === "goal" && (
              <div>
                <p className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-widest">
                  {t.stepOf(3, 4)}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                  {t.goal.question}
                </h2>
                <p className="text-sm text-zinc-500 mb-6">{t.goal.hint}</p>
                <textarea
                  placeholder={t.goal.placeholder}
                  value={form.learning_objective}
                  onChange={(e) => set("learning_objective", e.target.value)}
                  rows={4}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 resize-none"
                />
              </div>
            )}

            {/* ── Step: Time ── */}
            {current.id === "time" && (
              <div>
                <p className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-widest">
                  {t.stepOf(4, 4)}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 mb-6">
                  {t.time.question}
                </h2>
                <div className="flex flex-col gap-3">
                  {t.time.options.map(({ val, label }) => (
                    <OptionBtn
                      key={val}
                      label={label}
                      selected={form.daily_time_mins === val}
                      onClick={() => set("daily_time_mins", val)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Step: Optional ── */}
            {current.id === "optional" && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
                    {t.optional}
                  </p>
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                    {t.skipIfYouWant}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                  {t.optional_step.question}
                </h2>
                <p className="text-sm text-zinc-500 mb-6">{t.optional_step.hint}</p>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder={t.optional_step.collegePlaceholder}
                    value={form.college}
                    onChange={(e) => set("college", e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder={t.optional_step.hometownPlaceholder}
                    value={form.hometown}
                    onChange={(e) => set("hometown", e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
                  />
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">
                      {t.optional_step.aiLevelLabel}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {t.optional_step.aiLevels.map(({ val, label }) => (
                        <OptionBtn
                          key={val}
                          label={label}
                          selected={form.prior_ai_exposure === val}
                          onClick={() => set("prior_ai_exposure", val)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step: Done ── */}
            {current.id === "done" && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-5">
                  <Sparkle size={26} weight="fill" className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                  {t.done.heading}
                </h2>
                {persona && (
                  <p className="text-sm text-zinc-500 mb-4">
                    {t.done.personaLine(persona)}
                  </p>
                )}
                <p className="text-sm text-zinc-400 mb-8">
                  {t.done.subline}
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-medium px-6 py-3 rounded-2xl hover:bg-zinc-800 transition-colors"
                >
                  {t.done.cta}
                  <ArrowRight size={15} weight="bold" />
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      {/* Navigation */}
      {current.id !== "done" && (
        <div className="mt-6 flex items-center gap-3 w-full max-w-md">
          {step > 0 && (
            <button
              onClick={back}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft size={14} />
              {t.back}
            </button>
          )}
          <div className="flex-1" />

          {current.id === "optional" ? (
            <>
              <button
                onClick={skip}
                disabled={loading}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-40"
              >
                {t.skip}
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {loading ? t.saving : t.finish}
                {!loading && <CheckCircle size={15} weight="bold" />}
              </button>
            </>
          ) : (
            <button
              onClick={next}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.continue}
              <ArrowRight size={15} weight="bold" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
