import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { prisma } from "./prisma";
import { currentAcademicYear } from "./academic-year";

export type TeacherAuthResult =
  | { ok: true; ctx: { teacherId: string; userId: string; fullName: string } }
  | { ok: false; response: NextResponse };

export async function requireTeacher(): Promise<TeacherAuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "سجّلي الدخول أولًا" }, { status: 401 }),
    };
  }
  if (session.role !== "teacher") {
    return {
      ok: false,
      response: NextResponse.json({ error: "هذه الصفحة مخصصة للمعلمات فقط" }, { status: 403 }),
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

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.id },
    select: { id: true, userId: true },
  });
  if (!teacher) {
    return {
      ok: false,
      response: NextResponse.json({ error: "حساب المعلمة غير موجود" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    ctx: { teacherId: teacher.id, userId: session.id, fullName: session.fullName },
  };
}

function denied(message = "لا يوجد لديك صلاحية للوصول إلى هذه البيانات") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function assertTeacherOwnsStudent(teacherId: string, studentId: string): Promise<boolean> {
  const year = currentAcademicYear();
  const link = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: "active",
      academicYear: year,
      group: { teacherId },
    },
  });
  return link !== null;
}

export async function assertTeacherOwnsGroup(teacherId: string, groupId: string): Promise<boolean> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return false;
  return group.teacherId === teacherId;
}
