import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import { getSession, DASHBOARD_ROUTES } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { whatsappLink } from "@/lib/constants";

const PORTALS = [
  {
    role: "student",
    href: "/login/student",
    title: "بوابة الطالبات",
    desc: "دخول إلى بوابة الطالبة — متابعة الحفظ والتقدم",
    icon: GraduationCap,
    iconWrap: "bg-brand-gold/20 text-brand-gold",
    surface: "bg-brand-student hover:border-brand-gold/60",
  },
  {
    role: "teacher",
    href: "/login/teacher",
    title: "بوابة المعلمات",
    desc: "دخول إلى بوابة المعلمة — الحصص والحلقات",
    icon: BookOpen,
    iconWrap: "bg-primary/15 text-primary",
    surface: "bg-brand-teacher hover:border-primary/50",
  },
  {
    role: "admin",
    href: "/login/admin",
    title: "بوابة الإدارة",
    desc: "دخول إلى لوحة تحكم المنصة",
    icon: Crown,
    iconWrap: "bg-[#6a4fa3]/20 text-[#6a4fa3]",
    surface: "bg-brand-admin hover:border-[#6a4fa3]/40",
  },
];

const WHATSAPP_LINK = whatsappLink("السلام عليكم، أرغب في التسجيل بأكاديمية سَنَا");

export const metadata = {
  title: "تسجيل الدخول — أكاديمية سَنَا",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(DASHBOARD_ROUTES[session.role]);
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="relative hidden bg-primary p-12 text-brand-cream md:flex md:flex-col md:justify-between">
        <div aria-hidden className="absolute inset-0 bg-geometry opacity-40" />
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-gold/20 blur-3xl" />
        <Link href="/" className="relative">
          <Logo tone="light" />
        </Link>
        <div className="relative">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-px w-8 bg-brand-gold/60" />
            <span className="h-1.5 w-1.5 rotate-45 bg-brand-gold" />
          </div>
          <blockquote className="mb-4 text-2xl font-bold leading-relaxed">
            «خيركم من تعلّم القرآن وعلّمه»
          </blockquote>
          <div className="text-sm text-brand-cream/70">— حديث شريف</div>
        </div>
        <div className="relative text-xs text-brand-cream/60">
          © {new Date().getFullYear()} أكاديمية سنا
        </div>
      </section>

      <section className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-5 flex justify-center md:hidden">
              <Logo />
            </div>
            <h1 className="mb-2 text-2xl font-black text-primary">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">اختاري البوابة الخاصة بكِ</p>
          </div>

          <div className="space-y-4">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.role}
                  href={portal.href}
                  className={`group flex items-center gap-4 rounded-2xl border border-transparent p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${portal.surface}`}
                >
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${portal.iconWrap}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-primary">{portal.title}</div>
                    <div className="text-sm text-muted-foreground">{portal.desc}</div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
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
        </div>
      </section>
    </main>
  );
}
