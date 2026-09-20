import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { z } from "zod";

const schema = z.object({
  ids: z.array(z.string()), // These are student IDs
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    
    const { ids } = parsed.data;

    // Get user IDs for these students to delete the users as well
    const students = await prisma.student.findMany({
      where: { id: { in: ids } },
      select: { userId: true },
    });
    const userIds = students.map(s => s.userId);

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { studentId: { in: ids } } }),
      prisma.attendance.deleteMany({ where: { studentId: { in: ids } } }),
      prisma.lesson.deleteMany({ where: { studentId: { in: ids } } }),
      prisma.enrollment.deleteMany({ where: { studentId: { in: ids } } }),
      prisma.memorizationPlan.deleteMany({ where: { studentId: { in: ids } } }),
      prisma.payment.deleteMany({ where: { studentId: { in: ids } } }),
      prisma.student.deleteMany({ where: { id: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bulk delete students error:", err);
    return NextResponse.json({ error: "تعذر حذف الطالبات نهائياً" }, { status: 500 });
  }
}
