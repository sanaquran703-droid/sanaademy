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

  const student = await prisma.student.findUnique({ where: { userId: session.id } });
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

// The student's active enrollment (most recent by creation date).
// All student endpoints scope their queries to this enrollment — no other
// student's data can ever be reached through the session-bound API.
export async function getActiveEnrollment(studentId: string) {
  return prisma.enrollment.findFirst({
    where: { studentId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}
