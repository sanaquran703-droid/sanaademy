import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, CalendarDays, BookOpen, ClipboardList, Wallet, User } from "lucide-react";
import { requireStudent } from "@/lib/student-auth";

const NAV = [
  { href: "/student", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/student/schedule", label: "جدولي", icon: CalendarDays },
  { href: "/student/plan", label: "خطة الحفظ", icon: BookOpen },
  { href: "/student/lessons", label: "سجل الحصص", icon: ClipboardList },
  { href: "/student/payments", label: "المدفوعات", icon: Wallet },
  { href: "/student/profile", label: "حسابي", icon: User },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireStudent();
  if (!auth.ok) {
    notFound();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:h-fit">
        <nav className="rounded-2xl border border-border bg-card p-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
