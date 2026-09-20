import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  target: z.enum(["all_students", "group_students", "group_teacher"]),
  groupId: z.string().optional(),
  title: z.string().min(1, "العنوان مطلوب"),
  message: z.string().min(1, "الرسالة مطلوبة"),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
    }

    const { target, groupId, title, message, type } = parsed.data;
    let userIds: string[] = [];

    if (target === "all_students") {
      const students = await prisma.student.findMany({
        select: { userId: true },
        where: { user: { isActive: true } }
      });
      userIds = students.map(s => s.userId);
    } else if (target === "group_students" && groupId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { groupId, status: "active" },
        select: { student: { select: { userId: true } } }
      });
      userIds = enrollments.map(e => e.student.userId);
    } else if (target === "group_teacher" && groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { teacher: { select: { userId: true } } }
      });
      if (group?.teacher?.userId) {
        userIds = [group.teacher.userId];
      }
    }

    if (userIds.length === 0) {
      return NextResponse.json({ error: "لا يوجد مستخدمين مستهدفين" }, { status: 400 });
    }

    // Send notifications in bulk using createMany for efficiency
    const link = target === "all_students" 
      ? "/student" 
      : groupId 
        ? (target.includes("teacher") ? "/teacher/groups" : "/student") // Fix links to existing routes
        : undefined;

    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        link,
      })),
    });

    return NextResponse.json({ ok: true, count: userIds.length });
  } catch (e) {
    console.error("BULK_NOTIFY_ERROR:", e);
    return NextResponse.json({ error: "تعذر إرسال الإشعارات" }, { status: 500 });
  }
}
