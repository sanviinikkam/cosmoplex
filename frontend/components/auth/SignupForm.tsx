"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash, Warning } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", language: "en" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.signup(form);
      saveSession(res.access_token, res.learner);
      router.push("/language"); // new user — pick language first
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="w-full max-w-sm"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
          Create your account
        </h1>
        <p className="text-sm text-zinc-500">Begin your AI literacy certification.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">Full name</label>
          <input
            id="name" type="text" required autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            placeholder="Arjun Sharma"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            placeholder="arjun@company.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              required autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 pr-11 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <Warning size={15} weight="bold" className="shrink-0" />
            {error}
          </motion.div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98] mt-1"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-zinc-500 text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-900 font-medium hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
