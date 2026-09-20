import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { z } from "zod";

const schema = z.object({
  ids: z.array(z.string()), // These are teacher IDs
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    
    const { ids } = parsed.data;

    // 1. Get user IDs and group IDs first to avoid async issues in transaction
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: ids } },
      select: { userId: true },
    });
    const userIds = teachers.map(t => t.userId);

    const groups = await prisma.group.findMany({
      where: { teacherId: { in: ids } },
      select: { id: true },
    });
    const groupIds = groups.map(g => g.id);

    // 2. Perform hard delete in correct order
    await prisma.$transaction([
      // Delete evaluations related to lessons in these groups
      prisma.evaluation.deleteMany({
        where: { lesson: { groupId: { in: groupIds } } }
      }),
      // Delete attendance related to lessons in these groups
      prisma.attendance.deleteMany({
        where: { lesson: { groupId: { in: groupIds } } }
      }),
      // Delete lessons in these groups
      prisma.lesson.deleteMany({
        where: { groupId: { in: groupIds } }
      }),
      // Delete schedules for these groups
      prisma.schedule.deleteMany({
        where: { groupId: { in: groupIds } }
      }),
      // Delete enrollments for these groups
      prisma.enrollment.deleteMany({
        where: { groupId: { in: groupIds } }
      }),
      // Delete the groups
      prisma.group.deleteMany({
        where: { teacherId: { in: ids } }
      }),
      // Delete teacher profiles
      prisma.teacher.deleteMany({
        where: { id: { in: ids } }
      }),
      // Finally delete the users
      prisma.user.deleteMany({
        where: { id: { in: userIds } }
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bulk delete teachers error:", err);
    return NextResponse.json({ error: "تعذر حذف المعلمات نهائياً" }, { status: 500 });
  }
}
