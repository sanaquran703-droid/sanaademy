import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsStudent, assertTeacherOwnsGroup } from "@/lib/teacher-auth";
import { createNotification } from "@/lib/notifications";

const gradeSchema = z.enum(["excellent", "very_good", "good", "needs_review"] as const);

const evaluationSchema = z.object({
  memorization: gradeSchema,
  review: gradeSchema,
  tajweed: gradeSchema,
  commitment: gradeSchema,
  overallNote: z.string().max(1000).optional(),
});

const schema = z.object({
  groupId: z.string().min(1, "الحلقة مطلوبة"),
  studentId: z.string().min(1, "الطالبة مطلوبة"),
  scheduledAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "التاريخ غير صحيح")
    .transform((v) => new Date(v)),
  attendanceStatus: z.enum(["present", "absent", "late", "excused"] as const).default("present"),
  hasNewMemorization: z.boolean().default(true),
  newPortion: z.string().max(200).optional(),
  reviewPortion: z.string().max(200).optional(),
  errorsCount: z.number().int().min(0).max(100).optional(),
  errorsType: z.string().max(200).optional(),
  evaluation: evaluationSchema.optional(),
  homework: z.string().max(1000).optional(),
  teacherNotes: z.string().max(2000).optional(),
  meetLink: z
    .string()
    .max(500)
    .refine((v) => {
      if (!v) return true;
      try {
        const u = new URL(v.trim());
        return u.protocol === "https:";
      } catch {
        return false;
      }
    }, "رابط غير صحيح")
    .optional(),
});

// Record (or update) one lesson in a single transaction:
// Lesson upsert + Attendance upsert + optional Evaluation.
// If status is absent, only attendance + lesson are recorded (no evaluation
// or portion fields are required).
export async function POST(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await assertTeacherOwnsStudent(auth.ctx.teacherId, d.studentId))) {
    return NextResponse.json(
      { error: "هذه الطالبة ليست ضمن طالباتك في هذه الحلقة" },
      { status: 403 },
    );
  }

  if (!(await assertTeacherOwnsGroup(auth.ctx.teacherId, d.groupId))) {
    return NextResponse.json({ error: "هذه الحلقة ليست من حلقاتك" }, { status: 403 });
  }

  // Derive lesson status: absent/excused -> that status; present/late -> completed.
  const lessonStatus: "completed" | "absent" =
    d.attendanceStatus === "present" || d.attendanceStatus === "late" ? "completed" : "absent";

  try {
    const lesson = await prisma.$transaction(async (tx) => {
      // Lesson has no unique composite key in the schema, so look up an
      // existing lesson for this student/slot first, then update or create.
      const existingLesson = await tx.lesson.findFirst({
        where: {
          groupId: d.groupId,
          studentId: d.studentId,
          scheduledAt: {
            gte: new Date(d.scheduledAt.getTime() - 5 * 60 * 1000),
            lte: new Date(d.scheduledAt.getTime() + 5 * 60 * 1000),
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      let lesson;
      if (existingLesson) {
        lesson = await tx.lesson.update({
          where: { id: existingLesson.id },
          data: {
            status: lessonStatus,
            hasNewMemorization: d.hasNewMemorization,
            newPortion: d.newPortion ?? null,
            reviewPortion: d.reviewPortion ?? null,
            errorsCount: d.errorsCount ?? null,
            errorsType: d.errorsType ?? null,
            homework: d.homework ?? null,
            teacherNotes: d.teacherNotes ?? null,
            meetLink: d.meetLink ?? null,
          },
        });
      } else {
        lesson = await tx.lesson.create({
          data: {
            groupId: d.groupId,
            studentId: d.studentId,
            scheduledAt: d.scheduledAt,
            status: lessonStatus,
            hasNewMemorization: d.hasNewMemorization,
            newPortion: d.newPortion ?? null,
            reviewPortion: d.reviewPortion ?? null,
            errorsCount: d.errorsCount ?? null,
            errorsType: d.errorsType ?? null,
            homework: d.homework ?? null,
            teacherNotes: d.teacherNotes ?? null,
            meetLink: d.meetLink ?? null,
          },
        });
      }

      await tx.attendance.upsert({
        where: { lessonId_studentId: { lessonId: lesson.id, studentId: d.studentId } },
        update: { status: d.attendanceStatus },
        create: { lessonId: lesson.id, studentId: d.studentId, status: d.attendanceStatus },
      });

      if ((d.attendanceStatus === "present" || d.attendanceStatus === "late") && d.evaluation) {
        await tx.evaluation.upsert({
          where: { lessonId: lesson.id },
          update: d.evaluation,
          create: {
            lessonId: lesson.id,
            studentId: d.studentId,
            ...d.evaluation,
          },
        });
      }

      return lesson;
    });

    // Send notification to student
    const student = await prisma.student.findUnique({
      where: { id: d.studentId },
      select: { userId: true }
    });

    if (student) {
      const title = d.attendanceStatus === "present" || d.attendanceStatus === "late" 
        ? "تقييم جديد لحصتك" 
        : "تحديث في حالة الحضور";
      
      const message = d.attendanceStatus === "present" || d.attendanceStatus === "late"
        ? `لقد سجلت المعلمة ${auth.ctx.fullName} تقييم حصتك اليوم. يمكنكِ الاطلاع عليه الآن.`
        : `تم تسجيلكِ كـ "${d.attendanceStatus === "absent" ? "غائبة" : d.attendanceStatus === "excused" ? "غائبة بعذر" : "متأخرة"}" في حصة اليوم.`;

      await createNotification({
        userId: student.userId,
        title,
        message,
        type: d.attendanceStatus === "present" || d.attendanceStatus === "late" ? "success" : "warning",
        link: "/student"
      });
    }

    return NextResponse.json({ ok: true, lessonId: lesson.id });
  } catch (err) {
    return NextResponse.json({ error: "تعذّر حفظ الحصة، حاولي مرة أخرى" }, { status: 500 });
  }
}
