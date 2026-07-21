// One-off: extract existing quiz + assignment content into JSON for the backend
// to import into the DB. Run: npx tsx scripts/dump-content.ts
import { writeFileSync } from "fs";
import { MCQ_POOL } from "../lib/quiz-data";
import { LESSON_ASSIGNMENTS } from "../lib/assignment-data";

const LANGS = ["en", "hi", "mr", "te", "ta", "kn"] as const;

function pick(obj: Record<string, unknown>, base: string) {
  const out: Record<string, unknown> = {};
  for (const l of LANGS) {
    const key = l === "en" ? base : `${base}_${l}`;
    const v = obj[key];
    if (v !== undefined && v !== null) out[l] = v;
  }
  return out;
}

const quizzes = MCQ_POOL.map((q) => ({
  question: pick(q as unknown as Record<string, unknown>, "question"),
  options: pick(q as unknown as Record<string, unknown>, "options"),
  correct_index: q.correctIndex,
}));

const assignmentsByLesson: Record<string, { question: Record<string, unknown>; rubric: string }[]> = {};
for (const [title, list] of Object.entries(LESSON_ASSIGNMENTS)) {
  assignmentsByLesson[title] = list.map((a) => ({
    question: pick(a as unknown as Record<string, unknown>, "question"),
    rubric: a.rubric,
  }));
}

// The MCQ pool is the beginner quiz for the "10 AI Words" lesson.
const out = {
  quizzesByLesson: { "The 10 AI Words Every Fresher Must Know": quizzes },
  assignmentsByLesson,
};

const target = "../../backend/api/legacy_content.json";
writeFileSync(new URL(target, import.meta.url), JSON.stringify(out, null, 2));
console.log(`Wrote ${quizzes.length} quizzes and assignments for ${Object.keys(assignmentsByLesson).length} lesson(s).`);
