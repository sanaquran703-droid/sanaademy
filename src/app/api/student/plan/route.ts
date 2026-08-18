import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;

  // Read-only: expose only the plan's own fields, scoped to the session student.
  const plan = await prisma.memorizationPlan.findUnique({
    where: { studentId },
    select: {
      currentSurah: true,
      currentAyahFrom: true,
      currentAyahTo: true,
      reviewSurah: true,
      reviewAyahFrom: true,
      reviewAyahTo: true,
      progressPct: true,
      notes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, plan });
}
