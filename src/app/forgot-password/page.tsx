import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { whatsappLink } from "@/lib/constants";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-8">
      <div className="w-full max-w-sm rounded-[2rem] border border-border bg-card p-8 text-center shadow-card">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-3 text-xl font-black text-primary">نسيتِ كلمة المرور؟</h1>
        <p className="mb-6 text-sm leading-7 text-muted-foreground">
          تواصلي مع إدارة الأكاديمية عبر واتساب لإعادة تعيين كلمة المرور.
        </p>
        <Button asChild className="w-full rounded-full">
          <a
            href={whatsappLink("السلام عليكم، نسيتُ كلمة المرور وأحتاج إلى إعادة تعيينها.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            تواصل عبر واتساب
          </a>
        </Button>
        <div className="mt-4 text-sm">
          <Link href="/login" className="text-primary hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </main>
  );
}
