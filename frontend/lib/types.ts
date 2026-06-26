export type AgentType =
  | "teacher"
  | "illustrator"
  | "examiner"
  | "task_assigner"
  | "certifier"
  | "orchestrator";

export interface Message {
  id: string;
  role: "user" | "assistant";
  agent?: AgentType;
  content: string;
  imageUrl?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  status: "locked" | "available" | "in_progress" | "completed";
  score?: number;
  completedAt?: Date;
}

export interface ExamAttempt {
  id: string;
  moduleId: string;
  score: number;
  passed: boolean;
  attemptedAt: Date;
}

export interface TaskAssignment {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  status: "assigned" | "in_progress" | "submitted" | "reviewed";
  assignedAt: Date;
  submittedAt?: Date;
}

export interface LearnerProfile {
  id: string;
  email: string;
  name: string;
  preferredLanguage: string;
  enrollmentDate: Date;
  currentModuleId: string;
  totalScore: number;
  certificateIssued: boolean;
}

export interface CourseProgress {
  totalModules: number;
  completedModules: number;
  averageScore: number;
  tasksCompleted: number;
  totalTasks: number;
  certificateEligible: boolean;
}

// ── Video course types ────────────────────────────────────────────────────────

export interface VideoItem {
  id: string;
  title: string;
  cloudinaryPublicId: string | null;
  durationSeconds: number | null;
  thumbnailCloudinaryId: string | null;
  orderIndex: number;
  watchedSeconds: number;
  durationSavedSeconds: number;
  completed: boolean;
  unlocked: boolean;
}

export interface CourseSection {
  id: string;
  title: string;
  orderIndex: number;
  videos: VideoItem[];
  completed: boolean;
  unlocked: boolean;
}

export interface CourseModuleDetail {
  id: string;
  title: string;
  outcome: string | null;
  orderIndex: number;
  level: number;
  unlocked: boolean;
  sections: CourseSection[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnailCloudinaryId: string | null;
  modules: CourseModuleDetail[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  thumbnailCloudinaryId: string | null;
  moduleCount: number;
}

export interface ContinueWatching {
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  sectionTitle: string;
  videoId: string;
  videoTitle: string;
  durationSeconds: number;
  watchedSeconds: number;
  thumbnailCloudinaryId: string | null;
}

export const AGENT_META: Record<
  AgentType,
  { label: string; color: string; description: string }
> = {
  teacher: {
    label: "Teacher",
    color: "emerald",
    description: "Delivers lesson content and explanations",
  },
  illustrator: {
    label: "Illustrator",
    color: "violet",
    description: "Creates visual explanations of AI concepts",
  },
  examiner: {
    label: "Examiner",
    color: "amber",
    description: "Tests your understanding with contextual questions",
  },
  task_assigner: {
    label: "Task Assigner",
    color: "sky",
    description: "Assigns and tracks real-world practice exercises",
  },
  certifier: {
    label: "Certifier",
    color: "rose",
    description: "Issues your completion certificate",
  },
  orchestrator: {
    label: "System",
    color: "zinc",
    description: "Routes your requests to the right specialist",
  },
};
