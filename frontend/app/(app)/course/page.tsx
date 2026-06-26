"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { CourseSummary } from "@/lib/types";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function CoursesIndexPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    api.courses.list(token)
      .then((list) => {
        setCourses(list);
        // If only one course, redirect straight to it
        if (list.length === 1) {
          router.replace(`/course/${list[0].id}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[960px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          My Courses
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
        </p>
      </motion.div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">
          No courses yet. Your course will appear here once it&apos;s available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease }}
            >
              <Link
                href={`/course/${course.id}`}
                className="group flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 hover:shadow-md transition-all h-full"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5 group-hover:bg-zinc-200 transition-colors">
                  <BookOpen size={22} className="text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900 text-base leading-snug">
                    {course.title}
                  </p>
                  {course.description && (
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">
                    {course.moduleCount} modules
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                    Open
                    <ArrowRight size={12} weight="bold" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
