"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CheckCircle, VideoCamera, ArrowClockwise, Lock } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { VideoItem } from "@/lib/types";
import type { AppI18n } from "@/lib/app-i18n";
import { VideoQuiz } from "./VideoQuiz";
import type { MCQ } from "@/lib/quiz-data";
import { VideoAssignment } from "./VideoAssignment";
import type { Assignment } from "@/lib/assignment-data";
import { useLang, type Lang } from "@/lib/use-lang";

// Quiz/assignment banks are admin-uploaded per lesson (same DB tables the
// WhatsApp channel reads from) — never hardcoded locally, so any lesson with
// a bank shows one and any lesson without one just continues, on both channels.
async function fetchQuizForVideo(videoId: string): Promise<MCQ[] | null> {
  const res = await api.courses.getQuiz(videoId);
  if (!res.questions.length) return null;
  return res.questions.map((q) => ({
    id: q.id,
    level: "B" as const,
    question: q.question.en ?? Object.values(q.question)[0] ?? "",
    question_hi: q.question.hi,
    question_te: q.question.te,
    question_ta: q.question.ta,
    question_kn: q.question.kn,
    question_mr: q.question.mr,
    options: q.options.en ?? Object.values(q.options)[0] ?? [],
    options_hi: q.options.hi,
    options_te: q.options.te,
    options_ta: q.options.ta,
    options_kn: q.options.kn,
    options_mr: q.options.mr,
    correctIndex: q.correctIndex,
  }));
}

async function fetchAssignmentForVideo(videoId: string): Promise<Assignment | null> {
  const a = await api.courses.getAssignment(videoId);
  if (!a) return null;
  return {
    id: a.id,
    question: a.question.en ?? Object.values(a.question)[0] ?? "",
    question_hi: a.question.hi,
    question_te: a.question.te,
    question_ta: a.question.ta,
    question_kn: a.question.kn,
    question_mr: a.question.mr,
    rubric: a.rubric,
  };
}

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "your_cloud_name";

// Legacy per-language Cloudinary IDs, used ONLY as a fallback for lessons the
// backend hasn't stored yet. The DB (edited via the admin portal) is the source
// of truth — `video.cloudinaryPublicId` already arrives language-resolved from
// the backend (variant → en → base), so admin uploads reflect here automatically.
const LANG_VIDEO_OVERRIDES: Record<string, Partial<Record<string, string>>> = {
  "The 10 AI Words Every Fresher Must Know": {
    en: "2.1_English_compressed_s6vhdd",
    hi: "2.1_hindi_sixgnf",
    mr: "2.1_Marathi_cws5fc",
    te: "2.1_Telugu_qloes6",
    ta: "2.1_tamil_tl4rf2",
    kn: "2.1_Kannada_azgabe",
  },
  "When AI Confidently Lies - Hallucination": {
    hi: "2.4_hindi_compressed_vxkloy",
  },
};

function cloudinaryVideoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}`;
}

function cloudinaryThumbUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_800,h_450,c_fill,so_0/${publicId}.jpg`;
}

// Short in-context strings, all six languages (Golden Rule: never English-only).
const LOCK_NOTE: Record<Lang, string> = {
  en: "Pass the assignment below to unlock the next lesson.",
  hi: "अगला पाठ अनलॉक करने के लिए नीचे दिया गया असाइनमेंट पास करें।",
  mr: "पुढील धडा अनलॉक करण्यासाठी खालील असाइनमेंट पास करा.",
  te: "తదుపరి పాఠాన్ని అన్‌లాక్ చేయడానికి కింది అసైన్‌మెంట్‌ను పాస్ చేయండి.",
  ta: "அடுத்த பாடத்தைத் திறக்க கீழே உள்ள அசைன்மென்ட்டில் தேர்ச்சி பெறுங்கள்.",
  kn: "ಮುಂದಿನ ಪಾಠವನ್ನು ಅನ್‌ಲಾಕ್ ಮಾಡಲು ಕೆಳಗಿನ ಅಸೈನ್‌ಮೆಂಟ್ ಪಾಸ್ ಮಾಡಿ.",
};
const TAKE_ANOTHER: Record<Lang, string> = {
  en: "Take another quiz",
  hi: "एक और क्विज़ लें",
  mr: "आणखी एक क्विझ घ्या",
  te: "మరో క్విజ్ తీసుకోండి",
  ta: "மற்றொரு வினாடி வினா எடுங்கள்",
  kn: "ಇನ್ನೊಂದು ಕ್ವಿಜ್ ತೆಗೆದುಕೊಳ್ಳಿ",
};

interface Props {
  video: VideoItem;
  courseId: string;
  nextVideoId?: string;
  nextVideoTitle?: string;
  onCompleted?: () => void;
  t: AppI18n;
}

export function VideoPlayer({
  video,
  onCompleted,
  t,
}: Props) {
  const lang = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealedRef = useRef(false);
  const [completed, setCompleted] = useState(video.completed);
  const [quizQuestions, setQuizQuestions] = useState<MCQ[] | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [quizKey, setQuizKey] = useState(0);

  const saveProgress = useCallback(
    async (watchedSeconds: number, durationSeconds: number) => {
      const token = getToken();
      if (!token || !video.id) return;
      try {
        const res = await api.courses.updateProgress(token, video.id, {
          watched_seconds: Math.floor(watchedSeconds),
          duration_seconds: Math.floor(durationSeconds),
        });
        if (res.completed && !completed) {
          setCompleted(true);
          onCompleted?.();
        }
      } catch {
        // silent — progress saved on next tick
      }
    },
    [video.id, completed, onCompleted]
  );

  // Fetch this lesson's quiz + assignment (both, in parallel) so they can be
  // shown together below the video. Either may be null (no bank for that lesson).
  const loadAssessments = useCallback(async () => {
    const [q, a] = await Promise.all([
      fetchQuizForVideo(video.id).catch(() => null),
      fetchAssignmentForVideo(video.id).catch(() => null),
    ]);
    setQuizQuestions(q);
    setActiveAssignment(a);
  }, [video.id]);

  // Reveal the quiz + assignment once the video is watched. Idempotent per video.
  const revealAssessments = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setCompleted(true);
    loadAssessments();
  }, [loadAssessments]);

  // "Take another quiz" — pull a fresh random set and remount the quiz.
  const reloadQuiz = useCallback(async () => {
    const q = await fetchQuizForVideo(video.id).catch(() => null);
    setQuizQuestions(q);
    setQuizKey((k) => k + 1);
  }, [video.id]);

  const resolvedPublicId =
    video.cloudinaryPublicId ?? LANG_VIDEO_OVERRIDES[video.title]?.[lang] ?? null;

  // Reset reveal state when navigating to a different video
  useEffect(() => {
    revealedRef.current = false;
  }, [video.id]);

  // Already completed (e.g. revisiting the lesson) → show the quiz + assignment
  // immediately, so the learner never has to replay to reach them.
  useEffect(() => {
    if (video.completed) revealAssessments();
  }, [video.id, video.completed, revealAssessments]);

  // Restore saved position
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (video.watchedSeconds > 5 && !video.completed) {
      el.currentTime = video.watchedSeconds;
    }
  }, [video.watchedSeconds, video.completed]);

  // Save progress every 10s while playing, and reveal assessments on completion.
  // resolvedPublicId is a dep so this re-runs when lang switches and the element appears.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    function onPlay() {
      saveTimerRef.current = setInterval(() => {
        if (el && !el.paused) {
          saveProgress(el.currentTime, el.duration || 0);
        }
      }, 10_000);
    }

    function onPause() {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (el) saveProgress(el.currentTime, el.duration || 0);
    }

    function onEnded() {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (el) saveProgress(el.duration, el.duration);
      revealAssessments();
    }

    function onTimeUpdate() {
      if (!el) return;
      const pct = el.duration > 0 ? el.currentTime / el.duration : 0;
      if (pct >= 0.9 && !completed) {
        saveProgress(el.currentTime, el.duration);
      }
      if (pct >= 0.99) {
        revealAssessments();
      }
    }

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [saveProgress, completed, resolvedPublicId, revealAssessments]);

  // ── No video uploaded yet ──────────────────────────────────────────────────
  if (!resolvedPublicId) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-3">
        <VideoCamera size={40} className="text-zinc-600" />
        <p className="text-zinc-500 text-sm">{t.videoComingSoon}</p>
      </div>
    );
  }

  // A lesson is "cleared" only when watched AND (if it has an assignment) passed.
  const needsAssignment = !!video.hasAssignment && !video.assignmentPassed;
  const cleared = completed && !needsAssignment;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden group">
        <video
          ref={videoRef}
          src={cloudinaryVideoUrl(resolvedPublicId)}
          controls
          className="w-full h-full object-contain"
          poster={
            video.thumbnailCloudinaryId
              ? cloudinaryThumbUrl(video.thumbnailCloudinaryId)
              : undefined
          }
          playsInline
        />

        {/* Completed badge — only when the lesson is truly cleared (not just watched) */}
        {cleared && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
            <CheckCircle size={13} weight="fill" />
            {t.completed}
          </div>
        )}
      </div>

      {/* Quiz + assignment — shown once the video is completed, always accessible
          (no replay needed), and persist across revisits. */}
      {completed && (quizQuestions?.length || activeAssignment) && (
        <div className="flex flex-col gap-6">
          {/* Why the next lesson is locked */}
          {needsAssignment && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock size={15} weight="bold" className="shrink-0" />
              {LOCK_NOTE[lang] ?? LOCK_NOTE.en}
            </div>
          )}

          {/* Quiz (practice — does not gate). Retake for a fresh set anytime. */}
          {quizQuestions && quizQuestions.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <VideoQuiz
                key={quizKey}
                questions={quizQuestions}
                lang={lang}
                onFinish={reloadQuiz}
              />
              <button
                onClick={reloadQuiz}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                <ArrowClockwise size={13} weight="bold" />
                {TAKE_ANOTHER[lang] ?? TAKE_ANOTHER.en}
              </button>
            </div>
          )}

          {/* Assignment (this is what unlocks the next lesson) */}
          {activeAssignment && (
            <VideoAssignment
              assignment={activeAssignment}
              lessonTitle={video.title}
              lang={lang}
              onFinish={() => {
                // passed → refresh course so the next lesson unlocks
                onCompleted?.();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
