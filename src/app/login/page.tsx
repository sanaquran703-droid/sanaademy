import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, BookOpen, GraduationCap, Sparkles, ArrowLeft } from "lucide-react";
import { getSession, DASHBOARD_ROUTES } from "@/lib/auth";

const PORTALS = [
  {
    role: "admin",
    href: "/login/admin",
    title: "الإدارة",
    desc: "دخول إلى لوحة تحكم المنصة",
    icon: Crown,
    accent: "#6d28d9",
    bg: "bg-purple-50",
  },
  {
    role: "teacher",
    href: "/login/teacher",
    title: "المعلمات",
    desc: "دخول إلى بوابة المعلمة — الحصص والحلقات",
    icon: BookOpen,
    accent: "#0d9488",
    bg: "bg-teal-50",
  },
  {
    role: "student",
    href: "/login/student",
    title: "الطالبات",
    desc: "دخول إلى بوابة الطالبة — متابعة الحفظ والتقدم",
    icon: GraduationCap,
    accent: "#c2410c",
    bg: "bg-orange-50",
  },
];

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
      <section className="relative hidden bg-primary p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-foreground/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">سَنَا</div>
            <div className="text-xs opacity-80">أكاديمية القرآن الكريم</div>
          </div>
        </Link>
        <div className="relative">
          <blockquote className="mb-4 text-2xl font-medium leading-relaxed">
            «خيركم من تعلّم القرآن وعلّمه»
          </blockquote>
          <div className="text-sm opacity-80">— حديث شريف</div>
        </div>
        <div className="relative text-xs opacity-70">
          © {new Date().getFullYear()} أكاديمية سَنَا
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-primary">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">اختاري البوابة الخاصة بكِ</p>
          </div>

          <div className="space-y-4">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.role}
                  href={portal.href}
                  className={`group flex items-center gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${portal.bg} border-transparent`}
                >
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white"
                    style={{ backgroundColor: portal.accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">{portal.title}</div>
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
              href="https://wa.me/201023290018"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              تواصلي معنا للتسجيل
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
