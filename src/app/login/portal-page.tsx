import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { getSession, DASHBOARD_ROUTES } from "@/lib/auth";
import { LoginForm, type PortalRole } from "./login-form";

const PORTAL: Record<
  PortalRole,
  {
    title: string;
    subtitle: string;
    quote: string;
    icon: typeof Crown;
    accent: string; // tailwind color tokens (hsl-friendly primary override via inline style)
    heroLabel: string;
  }
> = {
  admin: {
    title: "تسجيل دخول الإدارة",
    subtitle: "الدخول إلى لوحة تحكم أكاديمية سَنَا",
    quote: "«خيركم من تعلّم القرآن وعلّمه»",
    icon: Crown,
    accent: "#6d28d9",
    heroLabel: "بوابة الإدارة",
  },
  teacher: {
    title: "تسجيل دخول المعلمات",
    subtitle: "الدخول إلى بوابة المعلمة — الحصص والحلقات",
    quote: "«المُاهرُ بالقرآنِ مع السفرةِ الكِرامِ البررة»",
    icon: BookOpen,
    accent: "#0d9488",
    heroLabel: "بوابة المعلمات",
  },
  student: {
    title: "تسجيل دخول الطالبات",
    subtitle: "الدخول إلى بوابة الطالبة — متابعة الحفظ والتقدم",
    quote: "«خيركم من تعلّم القرآن وعلّمه»",
    icon: GraduationCap,
    accent: "#c2410c",
    heroLabel: "بوابة الطالبات",
  },
};

export function PortalLoginPage({ role }: { role: PortalRole }) {
  return async function Page() {
    const session = await getSession();
    if (session) {
      redirect(DASHBOARD_ROUTES[session.role]);
    }

    const p = PORTAL[role];
    const Icon = p.icon;

    return (
      <main className="grid min-h-screen md:grid-cols-2">
        <section
          className="relative hidden p-12 text-white md:flex md:flex-col md:justify-between"
          style={{ backgroundColor: p.accent }}
        >
          <div className="absolute inset-0 bg-pattern opacity-10" />
          <Link href="/" className="relative flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">سَنَا</div>
              <div className="text-xs opacity-80">أكاديمية القرآن الكريم</div>
            </div>
          </Link>
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Icon className="h-4 w-4" />
              {p.heroLabel}
            </div>
            <blockquote className="mb-4 text-2xl font-medium leading-relaxed">«{p.quote}»</blockquote>
            <div className="text-sm opacity-80">— حديث شريف</div>
          </div>
          <div className="relative text-xs opacity-70">
            © {new Date().getFullYear()} أكاديمية سَنَا
          </div>
        </section>

        <section className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold" style={{ color: p.accent }}>
                {p.title}
              </h1>
              <p className="text-sm text-muted-foreground">{p.subtitle}</p>
            </div>
            <LoginForm role={role} />
            <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
              <div>
                ليس لديكِ حساب؟{" "}
                <a
                  href="https://wa.me/201023290018"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  تواصلي معنا للتسجيل
                </a>
              </div>
              <Link href="/login" className="inline-block text-xs text-muted-foreground hover:underline">
                ← العودة لاختيار البوابة
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  };
}
