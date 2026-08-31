"use client";

// Admin portal API client. Separate token from the learner session.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ADMIN_TOKEN_KEY = "cosmoplex_admin_token";

export type Variant = { language: string; cloudinaryPublicId: string; durationSeconds: number | null };
export type AdminVideo = {
  id: string; title: string; orderIndex: number;
  baseCloudinaryId: string | null; durationSeconds: number | null; variants: Variant[];
};
export type AdminSection = { id: string; title: string; orderIndex: number; videos: AdminVideo[] };
export type AdminModule = {
  id: string; title: string; outcome: string | null; orderIndex: number; level: number;
  hasContentDoc: boolean; contentDocPreview: string;
  sections: AdminSection[];
};
export type AdminCourse = {
  id: string; title: string; description: string | null;
  thumbnailCloudinaryId: string | null; modules: AdminModule[];
};

export type QuizItem = {
  id: string;
  question: Record<string, string>;
  options: Record<string, string[]>;
  correctIndex: number;
};
export type QuizPayload = { question: Record<string, string>; options: Record<string, string[]>; correct_index: number };
export type AssignmentItem = { id: string; question: Record<string, string>; rubric: string };
export type AssignmentPayload = { question: Record<string, string>; rubric: string };
export type IntroVideoItem = { language: string; cloudinaryPublicId: string; durationSeconds: number | null };

export type WebLearnerRow = {
  id: string;
  name: string | null; email: string; language: string;
  certificate: boolean; isTest: boolean; score: number | null; joined: string | null;
};
export type WaSessionRow = {
  id: string;
  name: string; phone: string; language: string | null;
  stage: string; lesson: number | null; lastActive: string | null;
  campaign: string | null; sourceType: string | null;
};

export type WaDetail = {
  type: "whatsapp"; name: string; phone: string; language: string; stage: string;
  currentStatus: string | null; goal: string | null;
  lesson: { index: number; completed: number; total: number; percent: number; label: string | null; title: string | null };
  quiz: { index: number; correct: number }; nudgesSent: number;
  createdAt: string | null; lastActive: string | null;
};
export type WaMessage = { role: "user" | "bot"; type: string | null; content: string | null; at: string | null };
export type WaTranscript = { phone: string; total: number; shown: number; messages: WaMessage[] };

export type WebDetail = {
  type: "web"; name: string | null; email: string; language: string; isTest: boolean;
  enrolledAt: string | null; currentModule: string | null; totalScore: number | null; certificate: boolean;
  lesson: { completed: number; total: number; percent: number; label: string | null; title: string | null; lastWatched: string | null };
  exams: { attempts: number; passed: number; bestScore: number | null; recent: { module: string; score: number | null; passed: boolean; at: string | null }[] };
  assignments: { submitted: number; recent: { lesson: string | null; score: number | null; at: string | null }[] };
};
export type ReferralRow = {
  id: string; code: string; referrerKind: string; referrerContact: string;
  referredKind: string; status: string; reward: number; payoutRef: string | null; createdAt: string | null;
};
export type ReferralsData = {
  total: number; paid: number; payoutTotal: number; demoMode: boolean; rewardEach: number; items: ReferralRow[];
};

export type MarketingAssetRow = {
  day: number; language: string;
  imagePublicId: string | null;
  videoPublicId: string | null;
  videoDurationSeconds: number | null;
  text: string | null;
};
export type MarketingAssetPatch = {
  image_public_id?: string | null;
  video_public_id?: string | null;
  video_duration_seconds?: number | null;
  text?: string | null;
};
export type MarketingAssetsData = {
  days: number[]; languages: string[]; items: MarketingAssetRow[];
};

export type SystemCheckItem = { key: string; label: string; status: "ok" | "warn" | "error"; detail: string };
export type SystemCheck = {
  generatedAt: string; environment: string;
  overall: "ok" | "warn" | "error"; checks: SystemCheckItem[];
};

export type UsersPage<Row> = {
  channel: string; total: number; offset: number; limit: number; count: number; items: Row[];
  facets?: UserFacets;
};

export type AdminDashboard = {
  generatedAt: string;
  content: { error?: string; courses?: number; modules?: number; sections?: number; videos?: number; quizzes?: number; assignments?: number };
  web: { error?: string; total?: number; testAccounts?: number; certificates?: number; withProgress?: number; byLanguage?: Record<string, number>; recent?: WebLearnerRow[] };
  whatsapp: { error?: string; total?: number; active24h?: number; active7d?: number; completed?: number; byStage?: Record<string, number>; byLanguage?: Record<string, number>; recent?: WaSessionRow[] };
};

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(t: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, t);
}
export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    let detail = await res.text();
    try { detail = JSON.parse(detail).detail ?? detail; } catch { /* keep text */ }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Multipart POST (file upload or pasted text). Lets the browser set the
 *  multipart boundary — so we must NOT send a JSON Content-Type here. */
async function adminUpload<T>(path: string, input: { file?: File; text?: string; replace?: boolean }): Promise<T> {
  const token = getAdminToken();
  const form = new FormData();
  if (input.file) form.append("file", input.file);
  if (input.text) form.append("text", input.text);
  if (input.replace) form.append("replace", "true");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    let detail = await res.text();
    try { detail = JSON.parse(detail).detail ?? detail; } catch { /* keep text */ }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export type CampaignRow = {
  campaign: string;
  source_type: string;
  headline: string | null;
  ad_id: string | null;
  arrived: number;
  picked_language: number;
  signed_up: number;
  started_lesson: number;
  completed: number;
  opted_out: number;
  signup_rate: number;
  completion_rate: number;
};
export type CampaignsData = { campaigns: CampaignRow[]; total_users: number };

// Distinct values actually present in the data, per filterable column. The column
// dropdowns are built from this so they can never offer a value that matches nothing.
export type UserFacets = {
  stage?: string[];
  language?: string[];
  source_type?: string[];
  campaign?: string[];
  lesson?: number[];
  certificate?: string[];
};

export type UserFilters = {
  q?: string;
  from_date?: string;
  to_date?: string;
  language?: string;
  stage?: string;
  campaign?: string;
  source_type?: string;
  lesson?: number;
  active_within_days?: number;
  certificate?: string;
  limit?: number;
  offset?: number;
};

export const adminApi = {
  login: async (password: string) => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error("Incorrect password");
    const data = (await res.json()) as { access_token: string };
    setAdminToken(data.access_token);
    return data;
  },

  dashboard: () => adminFetch<AdminDashboard>("/admin/dashboard"),
  systemCheck: () => adminFetch<SystemCheck>("/admin/system-check"),
  users: (channel: "web" | "whatsapp", opts?: UserFilters) => {
    const p = new URLSearchParams({ channel });
    // Only send keys that carry a value, so an empty filter box never turns into
    // ?language= and filters everything out.
    Object.entries(opts ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, String(v));
    });
    return adminFetch<UsersPage<WebLearnerRow | WaSessionRow>>(`/admin/users?${p.toString()}`);
  },
  referrals: () => adminFetch<ReferralsData>("/admin/referrals"),
  campaigns: (range?: { from_date?: string; to_date?: string }) => {
    const p = new URLSearchParams();
    if (range?.from_date) p.set("from_date", range.from_date);
    if (range?.to_date) p.set("to_date", range.to_date);
    const qs = p.toString();
    return adminFetch<CampaignsData>(`/admin/campaigns${qs ? `?${qs}` : ""}`);
  },
  whatsappDetail: (phone: string) => adminFetch<WaDetail>(`/admin/whatsapp/${encodeURIComponent(phone)}`),
  whatsappMessages: (phone: string) => adminFetch<WaTranscript>(`/admin/whatsapp/${encodeURIComponent(phone)}/messages`),
  learnerDetail: (id: string) => adminFetch<WebDetail>(`/admin/learner/${encodeURIComponent(id)}`),

  listCourses: () => adminFetch<AdminCourse[]>("/admin/courses"),
  createCourse: (b: { title: string; description?: string }) =>
    adminFetch<AdminCourse>("/admin/courses", { method: "POST", body: JSON.stringify(b) }),
  updateCourse: (id: string, b: { title: string; description?: string | null }) =>
    adminFetch<AdminCourse>(`/admin/courses/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteCourse: (id: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/courses/${id}`, { method: "DELETE" }),

  createModule: (b: { course_id: string; title: string; outcome?: string; level: number }) =>
    adminFetch<AdminCourse>("/admin/modules", { method: "POST", body: JSON.stringify(b) }),
  updateModule: (id: string, b: { title: string; outcome?: string | null; level: number }) =>
    adminFetch<AdminCourse>(`/admin/modules/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteModule: (id: string) =>
    adminFetch<AdminCourse>(`/admin/modules/${id}`, { method: "DELETE" }),

  getModuleContentDoc: (moduleId: string) =>
    adminFetch<{ moduleId: string; contentDoc: string }>(`/admin/modules/${moduleId}/content-doc`),
  uploadModuleContentDoc: (moduleId: string, input: { file?: File; text?: string }) =>
    adminUpload<{ moduleId: string; length: number }>(`/admin/modules/${moduleId}/content-doc`, input),
  deleteModuleContentDoc: (moduleId: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/modules/${moduleId}/content-doc`, { method: "DELETE" }),

  createSection: (b: { module_id: string; title: string }) =>
    adminFetch<AdminCourse>("/admin/sections", { method: "POST", body: JSON.stringify(b) }),
  updateSection: (id: string, b: { title: string }) =>
    adminFetch<AdminCourse>(`/admin/sections/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteSection: (id: string) =>
    adminFetch<AdminCourse>(`/admin/sections/${id}`, { method: "DELETE" }),

  createVideo: (b: { section_id: string; title: string }) =>
    adminFetch<AdminCourse>("/admin/videos", { method: "POST", body: JSON.stringify(b) }),
  updateVideo: (id: string, b: { title: string; cloudinary_public_id?: string | null; duration_seconds?: number | null }) =>
    adminFetch<AdminCourse>(`/admin/videos/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteVideo: (id: string) =>
    adminFetch<AdminCourse>(`/admin/videos/${id}`, { method: "DELETE" }),

  upsertVariant: (videoId: string, b: { language: string; cloudinary_public_id: string; duration_seconds?: number | null }) =>
    adminFetch<{ ok: boolean }>(`/admin/videos/${videoId}/variant`, { method: "PUT", body: JSON.stringify(b) }),
  deleteVariant: (videoId: string, language: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/videos/${videoId}/variant/${language}`, { method: "DELETE" }),

  listQuizzes: (videoId: string) =>
    adminFetch<QuizItem[]>(`/admin/videos/${videoId}/quizzes`),
  createQuiz: (videoId: string, b: QuizPayload) =>
    adminFetch<QuizItem>(`/admin/videos/${videoId}/quizzes`, { method: "POST", body: JSON.stringify(b) }),
  updateQuiz: (quizId: string, b: QuizPayload) =>
    adminFetch<QuizItem>(`/admin/quizzes/${quizId}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteQuiz: (quizId: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/quizzes/${quizId}`, { method: "DELETE" }),

  listAssignments: (videoId: string) =>
    adminFetch<AssignmentItem[]>(`/admin/videos/${videoId}/assignments`),
  createAssignment: (videoId: string, b: AssignmentPayload) =>
    adminFetch<AssignmentItem>(`/admin/videos/${videoId}/assignments`, { method: "POST", body: JSON.stringify(b) }),
  updateAssignment: (id: string, b: AssignmentPayload) =>
    adminFetch<AssignmentItem>(`/admin/assignments/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteAssignment: (id: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/assignments/${id}`, { method: "DELETE" }),

  bulkQuizzes: (videoId: string, input: { file?: File; text?: string; replace?: boolean }) =>
    adminUpload<{ added: number; replaced: boolean; items: QuizItem[] }>(`/admin/videos/${videoId}/quizzes/bulk`, input),
  bulkAssignments: (videoId: string, input: { file?: File; text?: string; replace?: boolean }) =>
    adminUpload<{ added: number; replaced: boolean; items: AssignmentItem[] }>(`/admin/videos/${videoId}/assignments/bulk`, input),

  listMarketingAssets: () =>
    adminFetch<MarketingAssetsData>("/admin/marketing-assets"),
  setMarketingAsset: (day: number, language: string, b: MarketingAssetPatch) =>
    adminFetch<MarketingAssetRow>(`/admin/marketing-assets/${day}/${language}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteMarketingAsset: (day: number, language: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/marketing-assets/${day}/${language}`, { method: "DELETE" }),

  listIntroVideos: () =>
    adminFetch<IntroVideoItem[]>("/admin/intro-videos"),
  setIntroVideo: (language: string, b: { cloudinary_public_id: string; duration_seconds?: number | null }) =>
    adminFetch<IntroVideoItem>(`/admin/intro-videos/${language}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteIntroVideo: (language: string) =>
    adminFetch<{ deleted: boolean }>(`/admin/intro-videos/${language}`, { method: "DELETE" }),

  syncVideos: () =>
    adminFetch<{ videosSynced: number; quizzesAdded: number; assignmentsAdded: number }>(
      "/admin/sync-videos", { method: "POST" }),

  uploadSignature: (folder?: string, resourceType: "video" | "image" | "auto" = "video") =>
    adminFetch<{ timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string; uploadUrl: string }>(
      "/admin/cloudinary/signature", { method: "POST", body: JSON.stringify({ folder: folder ?? null, resource_type: resourceType }) }),
};

/** Direct browser → Cloudinary signed upload. `resourceType` picks the endpoint
 *  (video for lessons/intros, image for photos, auto to detect). Returns the new
 *  public_id, duration (videos), and the resource_type Cloudinary reported. */
export async function uploadMediaToCloudinary(
  file: File,
  resourceType: "video" | "image" | "auto" = "video",
  onProgress?: (pct: number) => void
): Promise<{ publicId: string; durationSeconds: number | null; resourceType: "image" | "video" }> {
  const sig = await adminApi.uploadSignature(undefined, resourceType);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          publicId: data.public_id,
          durationSeconds: data.duration ? Math.round(data.duration) : null,
          resourceType: data.resource_type === "image" ? "image" : "video",
        });
      } else {
        let msg = xhr.responseText;
        try { msg = JSON.parse(xhr.responseText).error?.message ?? msg; } catch { /* keep */ }
        reject(new Error(`Cloudinary upload failed: ${msg}`));
      }
    };
    xhr.onerror = () => reject(new Error("Cloudinary upload failed (network error)"));
    xhr.send(form);
  });
}

/** Back-compat helper for video-only uploads. */
export async function uploadVideoToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ publicId: string; durationSeconds: number | null }> {
  const { publicId, durationSeconds } = await uploadMediaToCloudinary(file, "video", onProgress);
  return { publicId, durationSeconds };
}
