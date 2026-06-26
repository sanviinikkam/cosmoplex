"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CheckCircle, ArrowRight, VideoCamera } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { VideoItem } from "@/lib/types";
import type { AppI18n } from "@/lib/app-i18n";
import Link from "next/link";
import { VideoQuiz } from "./VideoQuiz";
import { pickQuestionsForLesson } from "@/lib/quiz-data";
import type { MCQ } from "@/lib/quiz-data";
import { VideoAssignment } from "./VideoAssignment";
import { pickAssignmentForLesson } from "@/lib/assignment-data";
import type { Assignment } from "@/lib/assignment-data";
import { useLang } from "@/lib/use-lang";

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "your_cloud_name";

// Maps video title → language → Cloudinary public ID override.
// Used when a dubbed version exists for a language other than the default.
const LANG_VIDEO_OVERRIDES: Record<string, Partial<Record<string, string>>> = {
  "The 10 AI Words Every Fresher Must Know": {
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

function resolvePublicId(videoTitle: string, defaultId: string, lang: string): string {
  return LANG_VIDEO_OVERRIDES[videoTitle]?.[lang] ?? defaultId;
}

function cloudinaryVideoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}`;
}

function cloudinaryThumbUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_800,h_450,c_fill,so_0/${publicId}.jpg`;
}

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
  courseId,
  nextVideoId,
  nextVideoTitle,
  onCompleted,
  t,
}: Props) {
  const lang = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quizTriggeredRef = useRef(false);
  const [completed, setCompleted] = useState(video.completed);
  const [showNext, setShowNext] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<MCQ[] | null>(null);
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

  // Resolve public ID here (before effects) so it can be a dependency
  const resolvedPublicId = video.cloudinaryPublicId
    ? resolvePublicId(video.title, video.cloudinaryPublicId, lang)
    : (LANG_VIDEO_OVERRIDES[video.title]?.[lang] ?? null);

  // Reset quiz trigger when navigating to a different video
  useEffect(() => {
    quizTriggeredRef.current = false;
  }, [video.id]);

  // Restore saved position
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (video.watchedSeconds > 5 && !video.completed) {
      el.currentTime = video.watchedSeconds;
    }
  }, [video.watchedSeconds, video.completed]);

  // Save progress every 10s while playing
  // resolvedPublicId is a dep so this re-runs when lang switches and the video element appears
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

    function triggerQuizOrNext() {
      if (quizTriggeredRef.current) return;
      quizTriggeredRef.current = true;
      const questions = pickQuestionsForLesson(video.title);
      if (questions) {
        setQuizQuestions(questions);
      } else {
        setShowNext(true);
      }
    }

    function onEnded() {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (el) saveProgress(el.duration, el.duration);
      triggerQuizOrNext();
    }

    // Also track 90% threshold + fallback quiz trigger at ≥99% in case `ended` doesn't fire
    function onTimeUpdate() {
      if (!el) return;
      const pct = el.duration > 0 ? el.currentTime / el.duration : 0;
      if (pct >= 0.9 && !completed) {
        saveProgress(el.currentTime, el.duration);
      }
      if (pct >= 0.99) {
        triggerQuizOrNext();
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
  }, [saveProgress, completed, resolvedPublicId]);

  // ── No video uploaded yet ──────────────────────────────────────────────────
  if (!resolvedPublicId) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-3">
        <VideoCamera size={40} className="text-zinc-600" />
        <p className="text-zinc-500 text-sm">{t.videoComingSoon}</p>
      </div>
    );
  }

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

        {/* Completed badge */}
        {completed && !showNext && !quizQuestions && !activeAssignment && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
            <CheckCircle size={13} weight="fill" />
            {t.completed}
          </div>
        )}

        {/* Next video overlay — only after quiz is dismissed */}
        {showNext && nextVideoId && !quizQuestions && !activeAssignment && (
          <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
            <CheckCircle size={48} weight="fill" className="text-emerald-400" />
            <p className="text-white font-semibold text-lg">
              {t.sectionComplete}
            </p>
            {nextVideoTitle && (
              <p className="text-zinc-400 text-sm">
                {t.nextLabel(nextVideoTitle)}
              </p>
            )}
            <Link
              href={`/course/${courseId}/learn/${nextVideoId}`}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              {t.continueBtn}
              <ArrowRight size={14} weight="bold" />
            </Link>
            <button
              onClick={() => setShowNext(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              {t.replay}
            </button>
          </div>
        )}
      </div>

      {/* Quiz — appears below the video after completion */}
      {quizQuestions && (
        <VideoQuiz
          questions={quizQuestions}
          lang={lang}
          onFinish={() => {
            setQuizQuestions(null);
            // Move to assignment if one exists for this lesson
            const assignment = pickAssignmentForLesson(video.title);
            if (assignment) {
              setActiveAssignment(assignment);
            } else {
              setShowNext(true);
            }
          }}
        />
      )}

      {/* Assignment — appears after quiz */}
      {activeAssignment && (
        <VideoAssignment
          assignment={activeAssignment}
          lessonTitle={video.title}
          lang={lang}
          onFinish={() => {
            setActiveAssignment(null);
            setShowNext(true);
          }}
        />
      )}
    </div>
  );
}
