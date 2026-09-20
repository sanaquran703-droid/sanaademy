import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsGroup } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

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
    const { studentId } = await req.json();
    if (!studentId) {
      return NextResponse.json({ error: "معرف الطالبة مطلوب" }, { status: 400 });
    }

    const year = currentAcademicYear();

    // Check if already enrolled in this specific group for this year
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, groupId, academicYear: year }
    });

    if (existing) {
      return NextResponse.json({ error: "الطالبة مسجلة بالفعل في هذه الحلقة" }, { status: 400 });
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
      include: {
        student: {
          include: { user: true }
        },
        group: true
      }
    });

    // Notify student
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
    console.error("[TEACHER_GROUP_ENROLL_POST]", error);
    return NextResponse.json({ error: "تعذّر إضافة الطالبة" }, { status: 500 });
  }
}
