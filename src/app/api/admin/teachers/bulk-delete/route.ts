import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { readJson, prismaErrorResponse } from "@/lib/api-errors";
import { idListSchema } from "@/lib/api-validation";

// Permanent deletion is an explicit administration requirement.
const schema = z.object({ ids: idListSchema }); // teacher IDs

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 },
    );
  }
  const { ids } = parsed.data;

  try {
    // Resolve related users and groups that actually exist.
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true },
    });
    const teacherIds = teachers.map((t) => t.id);
    const userIds = teachers.map((t) => t.userId);

    const groups = await prisma.group.findMany({
      where: { teacherId: { in: teacherIds } },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { lesson: { groupId: { in: groupIds } } } }),
      prisma.attendance.deleteMany({ where: { lesson: { groupId: { in: groupIds } } } }),
      prisma.lesson.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.schedule.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.enrollment.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.group.deleteMany({ where: { teacherId: { in: teacherIds } } }),
      prisma.teacher.deleteMany({ where: { id: { in: teacherIds } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);

    return NextResponse.json({ ok: true, deleted: teacherIds.length });
  } catch (err) {
    return prismaErrorResponse(err, "تعذر حذف المعلمات نهائياً");
  }
}
