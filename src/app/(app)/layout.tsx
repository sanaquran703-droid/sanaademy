import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const roleLabel = { student: "طالبة", teacher: "معلمة", admin: "إدارة" }[session.role];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href={`/${session.role}`} className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-95">
            <Image
              src="/brand/sana-emblem.png"
              alt="شعار أكاديمية سَنَا"
              width={40}
              height={40}
              className="h-9 w-9 rounded-xl object-contain"
            />
            <div className="text-sm">
              <div className="font-black text-primary text-base leading-tight tracking-tight">سَنَا</div>
              <div className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">{roleLabel}</div>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <NotificationBell />
            <div className="hidden sm:flex flex-col items-end border-r border-border/50 pr-4 mr-1">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">مرحبًا بكِ</span>
              <span className="text-xs font-black text-primary leading-tight">{session.fullName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
        <div className="container py-10 px-4 relative z-10">{children}</div>
      </main>
    </div>
  );
}
