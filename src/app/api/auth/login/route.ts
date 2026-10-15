import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, signSession, setSessionCookie, DASHBOARD_ROUTES } from "@/lib/auth";
import { checkLoginRateLimit, recordLoginAttempt, getClientIp } from "@/lib/rate-limit";
import { logServerError } from "@/lib/server-log";

const schema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  expectedRole: z.enum(["student", "teacher", "admin"]).optional(),
});

const ROLE_NAMES: Record<string, string> = {
  student: "بوابة الطالبات",
  teacher: "بوابة المعلمات",
  admin: "بوابة الإدارة",
};

export async function POST(req: Request) {
  let stage = "parse-body";
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
    }

    const ip = getClientIp(req.headers);
    const identifier = parsed.data.username.toLowerCase().trim();

    stage = "rate-limit";
    const rl = await checkLoginRateLimit(ip, identifier);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "محاولات كثيرة، يرجى المحاولة بعد قليل" },
        { status: 429 }
      );
    }

    stage = "authenticate";
    const user = await authenticate(parsed.data.username, parsed.data.password);

    stage = "record-attempt";
    await recordLoginAttempt(ip, identifier, !!user);

    if (!user) {
      return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    // Server-side role validation: if the page is portal-specific, the account's
    // real role MUST match the portal. The role comes from the JWT/DB only —
    // never from the URL or any client hint.
    if (parsed.data.expectedRole && user.role !== parsed.data.expectedRole) {
      return NextResponse.json(
        {
          error: `هذا الحساب مخصص ${ROLE_NAMES[user.role]}، ولا يمكنه الدخول من هنا.`,
          roleMismatch: true,
          actualRole: user.role,
        },
        { status: 403 }
      );
    }

    stage = "sign-session";
    const token = await signSession(user);

    stage = "set-cookie";
    await setSessionCookie(token);

    const redirectTo = user.mustChangePassword ? "/change-password" : DASHBOARD_ROUTES[user.role];
    return NextResponse.json({ ok: true, redirectTo });
  } catch (err) {
    // Safe, always-on diagnostic. Logs only the failing stage and the error
    // class/Prisma code — never the body, credentials, cookies, tokens, or any
    // environment value.
    logServerError("login", stage, err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
