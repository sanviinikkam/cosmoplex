import type { Metadata } from "next";
import type { ReactNode } from "react";

// Hidden internal tool — keep it out of search engines. It is not linked from
// anywhere on the public site and is gated by the admin password.
export const metadata: Metadata = {
  title: "Cosmoplex Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-zinc-100 text-zinc-900">{children}</div>;
}
