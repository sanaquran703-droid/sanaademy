import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { prisma } from "./prisma";

export type StudentAuthResult =
  | { ok: true; ctx: { studentId: string; userId: string; fullName: string } }
  | { ok: false; response: NextResponse };

export async function requireStudent(): Promise<StudentAuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "سجّلي الدخول أولًا" }, { status: 401 }),
    };
  }
  if (session.role !== "student") {
    return {
      ok: false,
      response: NextResponse.json({ error: "هذه الصفحة مخصصة للطالبات فقط" }, { status: 403 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { isActive: true, mustChangePassword: true },
  });

  if (!user || !user.isActive) {
    return {
      ok: false,
      response: NextResponse.json({ error: "غير مصرح" }, { status: 401 }),
    };
  }

  if (user.mustChangePassword) {
    return {
      ok: false,
      response: NextResponse.json({ error: "يجب تغيير كلمة المرور أولاً" }, { status: 403 }),
    };
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.id },
    select: { id: true, userId: true },
  });
  if (!student) {
    return {
      ok: false,
      response: NextResponse.json({ error: "حساب الطالبة غير موجود" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    ctx: { studentId: student.id, userId: session.id, fullName: session.fullName },
  };
}

export async function getActiveEnrollment(studentId: string) {
  return prisma.enrollment.findFirst({
    where: { studentId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}
