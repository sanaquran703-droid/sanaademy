import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { readJson, prismaErrorResponse } from "@/lib/api-errors";
import { idListSchema } from "@/lib/api-validation";

// Permanent deletion is an explicit administration requirement.
const schema = z.object({ ids: idListSchema }); // group IDs

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
    const groups = await prisma.group.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { lesson: { groupId: { in: groupIds } } } }),
      prisma.attendance.deleteMany({ where: { lesson: { groupId: { in: groupIds } } } }),
      prisma.lesson.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.schedule.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.enrollment.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.group.deleteMany({ where: { id: { in: groupIds } } }),
    ]);

    return NextResponse.json({ ok: true, deleted: groupIds.length });
  } catch (err) {
    return prismaErrorResponse(err, "تعذر حذف الحلقات نهائياً");
  }
}
