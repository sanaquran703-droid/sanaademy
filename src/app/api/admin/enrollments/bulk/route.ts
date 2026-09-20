import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { currentAcademicYear, academicYearRange } from "@/lib/academic-year";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  groupId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    const { groupId, studentIds } = parsed.data;

    const year = currentAcademicYear();
    
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { 
        _count: { 
          select: { 
            enrollments: { 
              where: { 
                status: "active",
                academicYear: year
              } 
            } 
          } 
        } 
      }
    });

    if (!group) return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });

    const currentCount = group._count.enrollments;
    const max = group.maxStudents || 10;
    const requested = studentIds.length;

    // Check capacity: only for students NOT already in this group
    const alreadyInGroup = await prisma.enrollment.count({
      where: {
        groupId: groupId,
        studentId: { in: studentIds },
        academicYear: year,
        status: "active"
      }
    });

    const netNew = requested - alreadyInGroup;

    if (currentCount + netNew > max) {
      return NextResponse.json({ 
        error: `لا توجد مساحة كافية. المقاعد المتاحة: ${max - currentCount}، والمطلوب تسجيل: ${netNew} طالبات جدد` 
      }, { status: 400 });
    }

    const { startDate } = academicYearRange(year);

    const enrolledUserIds = await prisma.$transaction(async (tx) => {
      const userIds: string[] = [];
      for (const studentId of studentIds) {
        const enrollment = await tx.enrollment.upsert({
          where: {
            studentId_academicYear_groupId: {
              studentId,
              academicYear: year,
              groupId,
            },
          },
          update: {
            programId: group.programId,
            status: "active",
          },
          create: {
            studentId,
            groupId,
            programId: group.programId,
            academicYear: year,
            startDate,
            status: "active",
          },
          include: { student: { select: { userId: true } } }
        });
        if (enrollment.student.userId) userIds.push(enrollment.student.userId);
      }
      return userIds;
    });

    // Send notifications after transaction succeeds
    if (enrolledUserIds.length > 0) {
      await prisma.notification.createMany({
        data: enrolledUserIds.map(userId => ({
          userId,
          title: "تم تسجيلك في حلقة جديدة",
          message: `لقد تم تسجيلك في حلقة "${group.name}". يمكنك الآن متابعة جدولك وخطة حفظك.`,
          type: "success",
          link: "/student"
        }))
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("BULK_ENROLL_ERROR:", e);
    return NextResponse.json({ error: "تعذّر تسجيل الطالبات" }, { status: 500 });
  }
}
