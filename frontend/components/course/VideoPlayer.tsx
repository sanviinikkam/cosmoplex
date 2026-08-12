"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CheckCircle, VideoCamera, Lock, Exam } from "@phosphor-icons/react";
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

// MUST stay byte-identical to the backend's VIDEO_TRANSFORM (whatsapp_routes.py):
// serving the same transform string means the web reuses the SAME cached Cloudinary
// derivative WhatsApp already generated — so no extra transformation credits, and a
// much smaller stream than the raw original. Changing this string = a new derivative.
const VIDEO_TRANSFORM = "w_480,br_400k,vc_h264,ac_aac,q_auto:low";
function cloudinaryVideoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${VIDEO_TRANSFORM}/${publicId}.mp4`;
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
const QUIZ_TITLE: Record<Lang, string> = {
  en: "Practice quiz",
  hi: "अभ्यास क्विज़",
  mr: "सराव क्विझ",
  te: "ప్రాక్టీస్ క్విజ్",
  ta: "பயிற்சி வினாடி வினா",
  kn: "ಅಭ್ಯಾಸ ಕ್ವಿಜ್",
};
const QUIZ_HINT: Record<Lang, string> = {
  en: "Optional — check your understanding. Retake it anytime.",
  hi: "वैकल्पिक — अपनी समझ जांचें। कभी भी दोबारा लें।",
  mr: "पर्यायी — तुमची समज तपासा. कधीही पुन्हा घ्या.",
  te: "ఐచ్ఛికం — మీ అవగాహనను తనిఖీ చేసుకోండి. ఎప్పుడైనా మళ్లీ తీసుకోండి.",
  ta: "விருப்பம் — உங்கள் புரிதலைச் சரிபார்க்கவும். எப்போது வேண்டுமானாலும் மீண்டும் எடுக்கலாம்.",
  kn: "ಐಚ್ಛಿಕ — ನಿಮ್ಮ ತಿಳುವಳಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ. ಯಾವಾಗ ಬೇಕಾದರೂ ಮತ್ತೆ ತೆಗೆದುಕೊಳ್ಳಿ.",
};
const QUIZ_TAKE: Record<Lang, string> = {
  en: "Take the quiz",
  hi: "क्विज़ लें",
  mr: "क्विझ घ्या",
  te: "క్విజ్ తీసుకోండి",
  ta: "வினாடி வினா எடுங்கள்",
  kn: "ಕ್ವಿಜ್ ತೆಗೆದುಕೊಳ್ಳಿ",
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
  const [quizAvailable, setQuizAvailable] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<MCQ[] | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

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

  // Find out whether this lesson has a quiz + assignment (does NOT open the quiz).
  const loadAssessments = useCallback(async () => {
    const [q, a] = await Promise.all([
      fetchQuizForVideo(video.id).catch(() => null),
      fetchAssignmentForVideo(video.id).catch(() => null),
    ]);
    setQuizAvailable(!!(q && q.length));
    setActiveAssignment(a);
  }, [video.id]);

  // Mark the lesson watched and surface the quiz card + assignment. Idempotent.
  const revealAssessments = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setCompleted(true);
    loadAssessments();
  }, [loadAssessments]);

  // Open the quiz ON DEMAND with a fresh random set (the quiz itself is a modal).
  const openQuiz = useCallback(async () => {
    const q = await fetchQuizForVideo(video.id).catch(() => null);
    if (q && q.length) {
      setQuizQuestions(q);
      setQuizOpen(true);
    }
  }, [video.id]);

  const resolvedPublicId =
    video.cloudinaryPublicId ?? LANG_VIDEO_OVERRIDES[video.title]?.[lang] ?? null;

  // Reset per-video UI state when navigating to a different video
  useEffect(() => {
    revealedRef.current = false;
    setQuizOpen(false);
    setQuizAvailable(false);
    setActiveAssignment(null);
  }, [video.id]);

  // Already completed (e.g. revisiting) → surface the quiz card + assignment
  // immediately. Note: this does NOT auto-open the quiz — it just makes it
  // available so the learner never has to replay to reach it.
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

  // Save progress every 10s while playing; surface assessments on completion.
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

      {/* Quiz card + assignment — appear below the video once it's watched, and
          persist across revisits. The quiz opens only when the learner chooses. */}
      {completed && (quizAvailable || activeAssignment) && (
        <div className="flex flex-col gap-6">
          {/* Why the next lesson is locked */}
          {needsAssignment && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock size={15} weight="bold" className="shrink-0" />
              {LOCK_NOTE[lang] ?? LOCK_NOTE.en}
            </div>
          )}

          {/* Practice quiz (optional — does not gate). Opens on click, retake anytime. */}
          {quizAvailable && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{QUIZ_TITLE[lang] ?? QUIZ_TITLE.en}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{QUIZ_HINT[lang] ?? QUIZ_HINT.en}</p>
              </div>
              <button
                onClick={openQuiz}
                className="shrink-0 inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                <Exam size={15} weight="bold" />
                {QUIZ_TAKE[lang] ?? QUIZ_TAKE.en}
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

      {/* Quiz modal — opens only on demand and closes on finish (no loop) */}
      {quizOpen && quizQuestions && (
        <VideoQuiz
          questions={quizQuestions}
          lang={lang}
          onFinish={() => setQuizOpen(false)}
        />
      )}
    </div>
  );
}
