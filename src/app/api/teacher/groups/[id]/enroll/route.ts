import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsGroup } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

const schema = z.object({ studentId: z.string().min(1, "معرف الطالبة مطلوب") });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { id: groupId } = await params;
  const { teacherId } = auth.ctx;

  // Verify ownership
  const owns = await assertTeacherOwnsGroup(teacherId, groupId);
  if (!owns) {
    return NextResponse.json({ error: "لا تملك صلاحية لهذه الحلقة" }, { status: 403 });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
    }
    const { studentId } = parsed.data;

    const year = currentAcademicYear();

    // The student must exist and be an active account.
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, user: { select: { isActive: true } } },
    });
    if (!student || !student.user.isActive) {
      return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });
    }

    // Check if already enrolled in this specific group for this year
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, groupId, academicYear: year }
    });

    if (existing) {
      return NextResponse.json({ error: "الطالبة مسجلة بالفعل في هذه الحلقة" }, { status: 400 });
    }

    // Security: a teacher must not be able to self-grant access to a student who
    // is already enrolled under another teacher. Only unassigned students (or
    // students already in this teacher's own groups) may be added.
    const otherTeacherEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        academicYear: year,
        status: "active",
        group: { teacherId: { not: null } },
        NOT: { group: { teacherId } },
      },
      select: { id: true },
    });
    if (otherTeacherEnrollment) {
      return NextResponse.json(
        { error: "هذه الطالبة مسجلة بالفعل لدى معلمة أخرى" },
        { status: 403 },
      );
    }

    // Capacity check (mirrors admin bulk enrollment).
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { maxStudents: true },
    });
    const activeCount = await prisma.enrollment.count({
      where: { groupId, academicYear: year, status: "active" },
    });
    if (group && activeCount >= group.maxStudents) {
      return NextResponse.json({ error: "الحلقة ممتلئة، لا توجد مقاعد متاحة" }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        groupId,
        academicYear: year,
        startDate: new Date(),
        status: "active",
      },
      select: {
        id: true,
        studentId: true,
        groupId: true,
        academicYear: true,
        status: true,
        startDate: true,
        student: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                fullName: true,
                username: true,
              }
            }
          }
        },
        group: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: enrollment.student.userId,
        title: "حلقة جديدة",
        message: `تمت إضافتكِ إلى حلقة "${enrollment.group?.name}" بواسطة المعلمة ${auth.ctx.fullName}.`,
        type: "success",
        link: "/student",
      }
    });

    return NextResponse.json({ ok: true, enrollment });
  } catch (error) {
    return NextResponse.json({ error: "تعذّر إضافة الطالبة" }, { status: 500 });
  }
}
