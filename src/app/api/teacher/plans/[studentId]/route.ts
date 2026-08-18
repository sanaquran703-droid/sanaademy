import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsStudent } from "@/lib/teacher-auth";

const schema = z.object({
  currentSurah: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
  currentAyahFrom: z.number().int().min(1).max(300).nullable(),
  currentAyahTo: z.number().int().min(1).max(300).nullable(),
  reviewSurah: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
  reviewAyahFrom: z.number().int().min(1).max(300).nullable(),
  reviewAyahTo: z.number().int().min(1).max(300).nullable(),
  progressPct: z.number().int().min(0).max(100).default(0),
  notes: z.string().max(2000).optional(),
});

// Update (or create) the student's memorization plan.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { studentId } = await params;

  if (!(await assertTeacherOwnsStudent(auth.ctx.teacherId, studentId))) {
    return NextResponse.json(
      { error: "هذه الطالبة ليست ضمن طالباتك في هذه الحلقة" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }
  const d = parsed.data;

  const plan = await prisma.memorizationPlan.upsert({
    where: { studentId },
    update: d,
    create: { studentId, ...d },
  });

  return NextResponse.json({ ok: true, plan });
}
