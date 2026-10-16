import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, BookOpen, GraduationCap } from "lucide-react";
import { getSession, DASHBOARD_ROUTES } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { whatsappLink } from "@/lib/constants";
import { LoginForm, type PortalRole } from "./login-form";

const PORTAL: Record<
  PortalRole,
  {
    title: string;
    subtitle: string;
    quote: string;
    icon: typeof Crown;
    accent: string;
    heroLabel: string;
  }
> = {
  admin: {
    title: "تسجيل دخول الإدارة",
    subtitle: "الدخول إلى لوحة تحكم أكاديمية سنا",
    quote: "«خيركم من تعلّم القرآن وعلّمه»",
    icon: Crown,
    accent: "#6A4FA3",
    heroLabel: "بوابة الإدارة",
  },
  teacher: {
    title: "تسجيل دخول المعلمات",
    subtitle: "الدخول إلى بوابة المعلمة — الحصص والحلقات",
    quote: "«المُاهرُ بالقرآنِ مع السفرةِ الكِرامِ البررة»",
    icon: BookOpen,
    accent: "#0A423A",
    heroLabel: "بوابة المعلمات",
  },
  student: {
    title: "تسجيل دخول الطالبات",
    subtitle: "الدخول إلى بوابة الطالبة — متابعة الحفظ والتقدم",
    quote: "«خيركم من تعلّم القرآن وعلّمه»",
    icon: GraduationCap,
    accent: "#B0894A",
    heroLabel: "بوابة الطالبات",
  },
};

const WHATSAPP_LINK = whatsappLink("السلام عليكم، أرغب في التسجيل بأكاديمية سنا");

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
          className="relative hidden p-12 text-brand-cream md:flex md:flex-col md:justify-between"
          style={{ backgroundColor: p.accent }}
        >
          <div aria-hidden className="absolute inset-0 bg-geometry opacity-40" />
          <Link href="/" className="relative">
            <Logo tone="light" />
          </Link>
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-cream/15 px-3 py-1 text-xs font-semibold">
              <Icon className="h-4 w-4" />
              {p.heroLabel}
            </div>
            <blockquote className="mb-4 text-2xl font-bold leading-relaxed">«{p.quote}»</blockquote>
            <div className="text-sm text-brand-cream/70">— حديث شريف</div>
          </div>
          <div className="relative text-xs text-brand-cream/60">
            © {new Date().getFullYear()} أكاديمية سنا
          </div>
        </section>

        <section className="flex items-center justify-center bg-background p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <div className="mb-5 flex justify-center md:hidden">
                <Logo />
              </div>
              <h1 className="mb-2 text-2xl font-black" style={{ color: p.accent }}>
                {p.title}
              </h1>
              <p className="text-sm text-muted-foreground">{p.subtitle}</p>
            </div>
            <LoginForm role={role} />
            <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
              <div>
                ليس لديكِ حساب؟{" "}
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
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
