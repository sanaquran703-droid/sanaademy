import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { readJson, prismaErrorResponse } from "@/lib/api-errors";
import { idListSchema } from "@/lib/api-validation";

// Permanent deletion is an explicit administration requirement.
const schema = z.object({ ids: idListSchema }); // student IDs

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
    // Resolve user IDs from the students that actually exist.
    const students = await prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true },
    });
    const studentIds = students.map((s) => s.id);
    const userIds = students.map((s) => s.userId);

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { studentId: { in: studentIds } } }),
      prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } }),
      prisma.lesson.deleteMany({ where: { studentId: { in: studentIds } } }),
      prisma.enrollment.deleteMany({ where: { studentId: { in: studentIds } } }),
      prisma.memorizationPlan.deleteMany({ where: { studentId: { in: studentIds } } }),
      prisma.payment.deleteMany({ where: { studentId: { in: studentIds } } }),
      prisma.student.deleteMany({ where: { id: { in: studentIds } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);

    return NextResponse.json({ ok: true, deleted: studentIds.length });
  } catch (err) {
    return prismaErrorResponse(err, "تعذر حذف الطالبات نهائياً");
  }
}
