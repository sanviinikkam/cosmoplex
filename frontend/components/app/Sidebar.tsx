"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  Books,
  Certificate,
  Play,
  SignOut,
} from "@phosphor-icons/react";
import { clearSession } from "@/lib/auth";
import { useLang } from "@/lib/use-lang";
import { getAppI18n } from "@/lib/app-i18n";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = getAppI18n(useLang());

  const NAV = [
    { href: "/dashboard", icon: ChartBar, label: t.nav.dashboard },
    { href: "/course",    icon: Play,     label: t.nav.courses },
    { href: "/learn",     icon: Books,    label: t.nav.learn },
    { href: "/certificate", icon: Certificate, label: t.nav.certificate },
  ];

  function handleSignOut() {
    clearSession();
    router.push("/");
  }

  return (
    <>
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-16 md:w-56 bg-white border-r border-zinc-200 flex-col z-20">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 md:px-5 border-b border-zinc-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold font-mono">Cx</span>
          </div>
          <span className="hidden md:block text-sm font-semibold tracking-tight text-zinc-900 truncate">
            Cosmoplex
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
              }`}
            >
              <Icon size={18} weight={active ? "bold" : "regular"} />
              <span className="hidden md:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-zinc-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
        >
          <SignOut size={18} />
          <span className="hidden md:block">{t.nav.signOut}</span>
        </button>
      </div>
    </aside>

    {/* Mobile bottom navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 flex items-stretch z-20">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              active ? "text-zinc-900" : "text-zinc-400"
            }`}
          >
            <Icon size={20} weight={active ? "bold" : "regular"} />
            <span className="truncate max-w-full px-1">{label}</span>
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <SignOut size={20} />
        <span className="truncate max-w-full px-1">{t.nav.signOut}</span>
      </button>
    </nav>
    </>
  );
}
