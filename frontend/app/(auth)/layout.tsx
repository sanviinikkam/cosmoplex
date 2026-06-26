import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] grid md:grid-cols-2">
      {/* Left: branding panel */}
      <div className="hidden md:flex flex-col justify-between bg-zinc-900 p-16">
        <Link href="/" className="text-white font-semibold tracking-tight">
          Cosmoplex
        </Link>

        <div>
          <blockquote className="text-zinc-300 text-lg leading-relaxed font-light mb-8 max-w-[38ch]">
            &ldquo;Understanding AI is no longer optional for anyone who
            builds, manages, or makes decisions in the modern
            workplace.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-semibold font-mono">
              CP
            </div>
            <div>
              <div className="text-white text-sm font-medium">
                Cosmoplex Platform
              </div>
              <div className="text-zinc-500 text-xs">
                AI Literacy Certification
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 text-xs text-zinc-600">
          <span>5 specialist agents</span>
          <span>12+ languages</span>
          <span>Verified certificates</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 sm:px-8 py-12 sm:py-16 bg-zinc-50">
        {children}
      </div>
    </div>
  );
}
