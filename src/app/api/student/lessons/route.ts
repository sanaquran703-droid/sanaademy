import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

// Read-only lesson history for the session student.
// No client-supplied IDs are used; everything is scoped by studentId.
export async function GET(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);

  const lessons = await prisma.lesson.findMany({
    where: { studentId },
    orderBy: { scheduledAt: "desc" },
    take: limit,
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      newPortion: true,
      reviewPortion: true,
      hasNewMemorization: true,
      homework: true,
      attendance: {
        where: { studentId },
        select: { status: true },
      },
      evaluation: {
        select: {
          memorization: true,
          review: true,
          tajweed: true,
          commitment: true,
          overallNote: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    lessons: lessons.map((l) => ({
      id: l.id,
      scheduledAt: l.scheduledAt,
      status: l.status,
      attendance: l.attendance[0]?.status ?? null,
      newPortion: l.newPortion ?? null,
      reviewPortion: l.reviewPortion ?? null,
      hasNewMemorization: l.hasNewMemorization,
      homework: l.homework ?? null,
      evaluation: l.evaluation
        ? {
            memorization: l.evaluation.memorization,
            review: l.evaluation.review,
            tajweed: l.evaluation.tajweed,
            commitment: l.evaluation.commitment,
            overallNote: l.evaluation.overallNote ?? null,
          }
        : null,
    })),
  });
}
