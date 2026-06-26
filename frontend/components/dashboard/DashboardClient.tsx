"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { api } from "@/lib/api";
import type {
  Module,
  TaskAssignment,
  CourseProgress,
  ContinueWatching,
  CourseSummary,
} from "@/lib/types";
import { BentoGrid } from "./BentoGrid";
import { ContinueWatchingCard } from "./ContinueWatchingCard";
import { setLang } from "@/lib/use-lang";

// Mock data for when API is not yet connected
const MOCK_MODULES: Module[] = [
  {
    id: "m1",
    title: "What is Artificial Intelligence?",
    description: "Definitions, history, and the scope of AI",
    order: 1,
    status: "completed",
    score: 87,
  },
  {
    id: "m2",
    title: "Machine Learning Fundamentals",
    description: "Supervised, unsupervised, and reinforcement learning",
    order: 2,
    status: "completed",
    score: 91,
  },
  {
    id: "m3",
    title: "Neural Networks and Deep Learning",
    description: "How layers of neurons learn representations",
    order: 3,
    status: "in_progress",
  },
  {
    id: "m4",
    title: "Large Language Models",
    description: "Transformers, tokens, and how ChatGPT works",
    order: 4,
    status: "available",
  },
  {
    id: "m5",
    title: "AI Bias and Ethics",
    description: "Where bias enters and how to mitigate it",
    order: 5,
    status: "locked",
  },
  {
    id: "m6",
    title: "AI in the Workplace",
    description: "Automation, augmentation, and the future of work",
    order: 6,
    status: "locked",
  },
];

const MOCK_PROGRESS: CourseProgress = {
  totalModules: 6,
  completedModules: 2,
  averageScore: 89,
  tasksCompleted: 2,
  totalTasks: 6,
  certificateEligible: false,
};

const MOCK_TASKS: TaskAssignment[] = [
  {
    id: "t1",
    moduleId: "m3",
    title: "Diagram a simple neural network",
    description: "Draw and annotate a 3-layer network solving a classification problem",
    status: "assigned",
    assignedAt: new Date(),
  },
  {
    id: "t2",
    moduleId: "m4",
    title: "Identify LLM outputs in the wild",
    description: "Find 3 examples of LLM-generated text and explain how you identified them",
    status: "in_progress",
    assignedAt: new Date(),
  },
];

export function DashboardClient() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>(MOCK_MODULES);
  const [tasks, setTasks] = useState<TaskAssignment[]>(MOCK_TASKS);
  const [progress, setProgress] = useState<CourseProgress>(MOCK_PROGRESS);
  const [userName, setUserName] = useState("Learner");
  const [continueWatching, setContinueWatching] =
    useState<ContinueWatching | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.push("/login");
      return;
    }

    setUserName(user.name);

    async function fetchData() {
      if (!token) return;

      // Check onboarding — redirect if not completed
      try {
        const ob = await api.onboarding.status(token);
        if (!ob.completed) {
          router.push("/onboarding");
          return;
        }
      } catch {
        // backend down — allow through with mock data
      }

      // Sync language from backend profile → localStorage so all components render correctly
      try {
        const profile = await api.learner.profile(token);
        if (profile.preferredLanguage) {
          setLang(profile.preferredLanguage as "en" | "hi" | "mr" | "te" | "ta" | "kn");
        }
      } catch {
        // non-fatal
      }

      try {
        const [p, m, t] = await Promise.all([
          api.learner.progress(token),
          api.learner.modules(token),
          api.learner.tasks(token),
        ]);
        setProgress(p);
        setModules(m);
        setTasks(t);
      } catch {
        // keep mock data
      }

      // Load video courses (separate — non-blocking)
      try {
        const courseList = await api.courses.list(token);
        setCourses(courseList);
        if (courseList.length > 0) {
          const cw = await api.courses.continueWatching(
            token,
            courseList[0].id
          );
          setContinueWatching(cw);
        }
      } catch {
        // courses not yet seeded — silent
      }
    }

    fetchData();
  }, [router]);

  return (
    <div>
      <ContinueWatchingCard
        continueData={continueWatching}
        courses={courses}
        userName={userName}
      />
      <BentoGrid
        progress={progress}
        modules={modules}
        tasks={tasks}
        userName={userName}
        hideName
      />
    </div>
  );
}
