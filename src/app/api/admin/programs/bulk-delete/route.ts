import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { readJson, prismaErrorResponse } from "@/lib/api-errors";
import { idListSchema } from "@/lib/api-validation";

// Permanent deletion is an explicit administration requirement.
const schema = z.object({ ids: idListSchema }); // program IDs

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
    const programs = await prisma.program.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const programIds = programs.map((p) => p.id);

    // Groups belonging to these programs (their children are removed first).
    const groups = await prisma.group.findMany({
      where: { programId: { in: programIds } },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { lesson: { groupId: { in: groupIds } } } }),
      prisma.attendance.deleteMany({ where: { lesson: { groupId: { in: groupIds } } } }),
      prisma.lesson.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.schedule.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.enrollment.deleteMany({
        where: { OR: [{ programId: { in: programIds } }, { groupId: { in: groupIds } }] },
      }),
      prisma.group.deleteMany({ where: { id: { in: groupIds } } }),
      prisma.program.deleteMany({ where: { id: { in: programIds } } }),
    ]);

    return NextResponse.json({ ok: true, deleted: programIds.length });
  } catch (err) {
    return prismaErrorResponse(err, "تعذر حذف البرامج نهائياً");
  }
}
