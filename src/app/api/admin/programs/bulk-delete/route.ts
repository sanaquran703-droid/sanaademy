import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { z } from "zod";

const schema = z.object({
  ids: z.array(z.string()),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    
    const { ids } = parsed.data;

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { lesson: { group: { programId: { in: ids } } } } }),
      prisma.attendance.deleteMany({ where: { lesson: { group: { programId: { in: ids } } } } }),
      prisma.lesson.deleteMany({ where: { group: { programId: { in: ids } } } }),
      prisma.schedule.deleteMany({ where: { group: { programId: { in: ids } } } }),
      prisma.enrollment.deleteMany({ where: { programId: { in: ids } } }),
      prisma.group.deleteMany({ where: { programId: { in: ids } } }),
      prisma.program.deleteMany({ where: { id: { in: ids } } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bulk delete programs error:", err);
    return NextResponse.json({ error: "تعذر حذف البرامج نهائياً" }, { status: 500 });
  }
}
