"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Seal, DownloadSimple, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { getToken, getUser } from "@/lib/auth";
import { api } from "@/lib/api";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

function CertificatePreview({
  name,
  issuedAt,
}: {
  name: string;
  issuedAt: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease }}
      className="relative w-full max-w-2xl mx-auto"
    >
      {/* Certificate card */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-[0_24px_48px_-16px_rgba(0,0,0,0.08)]">
        {/* Top stripe */}
        <div className="h-2 bg-emerald-500" />

        <div className="px-6 py-8 sm:px-12 sm:py-12 text-center">
          {/* Seal */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-8">
            <Seal size={32} className="text-emerald-600" weight="duotone" />
          </div>

          <div className="text-xs font-medium text-zinc-400 uppercase tracking-[0.2em] mb-3">
            Certificate of Completion
          </div>

          <div className="text-sm text-zinc-500 mb-2">
            This certifies that
          </div>

          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mb-4 break-words">
            {name}
          </div>

          <div className="text-zinc-500 text-sm leading-relaxed max-w-[44ch] mx-auto mb-8">
            has successfully completed the{" "}
            <strong className="text-zinc-800 font-medium">
              AI Literacy Certification
            </strong>{" "}
            course, passing all module examinations and completing all assigned
            practical tasks.
          </div>

          {/* Verified indicator */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mb-8">
            <CheckCircle
              size={14}
              className="text-emerald-600"
              weight="fill"
            />
            <span className="text-xs font-medium text-emerald-700">
              Verified by Cosmoplex
            </span>
          </div>

          <div className="flex items-center justify-center gap-5 sm:gap-12 text-center">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Issued</div>
              <div className="text-sm font-medium text-zinc-700 font-mono">
                {new Date(issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <div className="text-xs text-zinc-400 mb-1">Platform</div>
              <div className="text-sm font-medium text-zinc-700">
                Cosmoplex
              </div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <div className="text-xs text-zinc-400 mb-1">Modules</div>
              <div className="text-sm font-mono font-medium text-zinc-700">
                6 / 6
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stripe */}
        <div className="h-1 bg-zinc-100" />
      </div>
    </motion.div>
  );
}

function NotEligible() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="max-w-md mx-auto text-center pt-20"
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-6">
        <Seal size={28} className="text-zinc-400" weight="duotone" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-3">
        Certificate not yet available
      </h2>
      <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-[38ch] mx-auto">
        Complete all module exams with a passing score and submit all practice
        tasks to unlock your certificate.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-zinc-700 transition-colors active:scale-[0.98]"
      >
        Back to dashboard
        <ArrowRight size={14} weight="bold" />
      </Link>
    </motion.div>
  );
}

export function CertificateView() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "eligible"; url: string; issuedAt: string }
    | { status: "not_eligible" }
  >({ status: "loading" });
  const [name, setName] = useState("Learner");

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;
    setName(user.name);

    api.learner.certificate(token)
      .then((cert) => {
        setState({ status: "eligible", url: cert.url, issuedAt: cert.issuedAt });
      })
      .catch(() => {
        setState({ status: "not_eligible" });
      });
  }, []);

  return (
    <div className="p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-10 max-w-2xl mx-auto"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-1">
          Your certificate
        </h1>
        <p className="text-zinc-500 text-sm">
          Issued upon completing all modules and tasks.
        </p>
      </motion.div>

      {state.status === "loading" && (
        <div className="flex items-center justify-center pt-20">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
        </div>
      )}

      {state.status === "eligible" && (
        <div className="max-w-2xl mx-auto">
          <CertificatePreview name={name} issuedAt={state.issuedAt} />
          <div className="flex justify-center gap-3 mt-6">
            <a
              href={state.url}
              download
              className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-zinc-700 transition-colors active:scale-[0.98]"
            >
              <DownloadSimple size={16} weight="bold" />
              Download PDF
            </a>
          </div>
        </div>
      )}

      {state.status === "not_eligible" && <NotEligible />}
    </div>
  );
}
