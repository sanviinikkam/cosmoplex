const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  // Don't set Content-Type when body is FormData — browser must set the multipart boundary
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: isFormData
      ? options?.headers
      : { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function getWebSocketUrl(learnerId: string): string {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/ws/learn/${learnerId}`;
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; name: string; language: string }) =>
      apiFetch<{ access_token: string; learner: { id: string; name: string } }>(
        "/auth/signup",
        { method: "POST", body: JSON.stringify(data) }
      ),
    login: (data: { email: string; password: string }) =>
      apiFetch<{ access_token: string; learner: { id: string; name: string } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(data) }
      ),
  },
  learner: {
    profile: (token: string) =>
      apiFetch<import("./types").LearnerProfile>("/learner/profile", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    progress: (token: string) =>
      apiFetch<import("./types").CourseProgress>("/learner/progress", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    modules: (token: string) =>
      apiFetch<import("./types").Module[]>("/learner/modules", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    tasks: (token: string) =>
      apiFetch<import("./types").TaskAssignment[]>("/learner/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    certificate: (token: string) =>
      apiFetch<{ url: string; issuedAt: string }>("/learner/certificate", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    updateLanguage: (token: string, language: string) =>
      apiFetch<{ preferredLanguage: string }>("/learner/language", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language }),
      }),
  },

  onboarding: {
    status: (token: string) =>
      apiFetch<{
        completed: boolean;
        enrollment: { courseId: string; persona: string; paymentStatus: string } | null;
      }>("/onboarding/status", { headers: { Authorization: `Bearer ${token}` } }),

    submit: (
      token: string,
      data: {
        employment_status: string;
        job_role?: string;
        target_job_role?: string;
        industry?: string;
        learning_objective: string;
        daily_time_mins: number;
        college?: string;
        graduation_year?: number;
        hometown?: string;
        prior_ai_exposure?: string;
      }
    ) =>
      apiFetch<{ persona: string; courseId: string | null; moduleSequence: unknown[] }>(
        "/onboarding/submit",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        }
      ),
  },

  courses: {
    list: (token: string) =>
      apiFetch<import("./types").CourseSummary[]>("/courses", {
        headers: { Authorization: `Bearer ${token}` },
      }),

    get: (token: string, courseId: string) =>
      apiFetch<import("./types").CourseDetail>(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    continueWatching: (token: string, courseId: string) =>
      apiFetch<import("./types").ContinueWatching | null>(
        `/courses/${courseId}/continue`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),

    updateProgress: (
      token: string,
      videoId: string,
      body: { watched_seconds: number; duration_seconds: number }
    ) =>
      apiFetch<{ completed: boolean; watchedSeconds: number }>(
        `/courses/videos/${videoId}/progress`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      ),

    evaluateAssignment: (
      token: string,
      payload: {
        file: File;
        lesson_title: string;
        assignment_id: string;
        question: string;
        rubric: string;
        lang: string;
      }
    ) => {
      const form = new FormData();
      form.append("file", payload.file);
      form.append("lesson_title", payload.lesson_title);
      form.append("assignment_id", payload.assignment_id);
      form.append("question", payload.question);
      form.append("rubric", payload.rubric);
      form.append("lang", payload.lang);
      return apiFetch<{ score: number; feedback: string }>(
        "/courses/assignments/evaluate",
        {
          method: "POST",
          // No Content-Type header — browser sets multipart boundary automatically
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );
    },
  },
};
