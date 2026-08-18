import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, Users, BookOpen } from "lucide-react";
import { requireTeacher } from "@/lib/teacher-auth";

const NAV = [
  { href: "/teacher", label: "حاصلاتي اليوم", icon: LayoutDashboard },
  { href: "/teacher/students", label: "طالباتي", icon: Users },
  { href: "/teacher/groups", label: "حلقاتي", icon: BookOpen },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireTeacher();
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
