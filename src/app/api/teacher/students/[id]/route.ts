import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsStudent } from "@/lib/teacher-auth";

// Student profile: basic info + memorization plan + last 6 lessons + attendance stats.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { id: studentId } = await params;

  if (!(await assertTeacherOwnsStudent(auth.ctx.teacherId, studentId))) {
    return NextResponse.json(
      { error: "هذه الطالبة ليست ضمن طالباتك في هذه الحلقة" },
      { status: 403 },
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      guardianName: true,
      guardianPhone: true,
      user: { select: { fullName: true, username: true, phone: true, email: true } },
      memorizationPlan: {
        select: {
          id: true,
          currentSurah: true,
          currentAyahFrom: true,
          currentAyahTo: true,
          reviewSurah: true,
          reviewAyahFrom: true,
          reviewAyahTo: true,
          progressPct: true,
          notes: true,
        },
      },
      enrollments: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { academicYear: true, group: { select: { name: true } } },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { studentId },
    orderBy: { scheduledAt: "desc" },
    take: 6,
    include: {
      evaluation: { select: { memorization: true, review: true, tajweed: true, commitment: true } },
    },
  });

  const attendanceRows = await prisma.attendance.findMany({
    where: { studentId },
    select: { status: true },
  });
  const total = attendanceRows.length;
  const attended = attendanceRows.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : null;

  return NextResponse.json({
    ok: true,
    student: {
      id: student.id,
      fullName: student.user.fullName,
      username: student.user.username,
      phone: student.user.phone,
      email: student.user.email,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      groupName: student.enrollments[0]?.group?.name ?? null,
      academicYear: student.enrollments[0]?.academicYear ?? null,
      plan: student.memorizationPlan,
      lessons: lessons.map((l) => ({
        id: l.id,
        scheduledAt: l.scheduledAt,
        status: l.status,
        newPortion: l.newPortion,
        reviewPortion: l.reviewPortion,
        evaluation: l.evaluation,
      })),
      attendancePct,
      attendanceTotal: total,
    },
  });
}
