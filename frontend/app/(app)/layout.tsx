import { Sidebar } from "@/components/app/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      <Sidebar />
      <main className="md:pl-56 pb-16 md:pb-0 min-h-[100dvh]">{children}</main>
    </div>
  );
}
