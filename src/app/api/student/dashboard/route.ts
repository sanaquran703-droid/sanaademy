import { NextResponse } from "next/server";
import { requireStudent, getActiveEnrollment } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

function nowMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;

  const [enrollment, plan, lastEvaluation, todayLesson, pendingOrConfirmed] = await Promise.all([
    getActiveEnrollment(studentId),
    prisma.memorizationPlan.findUnique({ where: { studentId } }),
    prisma.evaluation.findFirst({
      where: { studentId },
      include: {
        lesson: {
          select: {
            scheduledAt: true,
            newPortion: true,
            reviewPortion: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    (async () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun .. 6=Sat
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sched = await prisma.schedule.findFirst({
        where: {
          group: {
            enrollments: { some: { studentId, status: "active" } },
          },
          dayOfWeek,
        },
        select: {
          startTime: true,
          durationMins: true,
          group: { select: { name: true, meetLink: true, meetingProvider: true } },
        },
      });
      if (!sched) return null;
      const [h, m] = sched.startTime.split(":").map(Number);
      const startsAt = new Date(startOfDay);
      startsAt.setHours(h, m, 0, 0);
      const endsAt = new Date(startsAt.getTime() + (sched.durationMins ?? 30) * 60 * 1000);
      const status =
        now >= endsAt ? "finished" : now >= startsAt ? "ongoing" : "upcoming";
      return {
        groupName: sched.group?.name ?? null,
        meetLink: sched.group?.meetLink ?? null,
        meetingProvider: sched.group?.meetingProvider ?? null,
        startTime: startsAt.toISOString(),
        durationMins: sched.durationMins,
        status,
      };
    })(),
    prisma.payment.findFirst({
      where: { studentId, monthCovered: nowMonth() },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const month = nowMonth();

  return NextResponse.json({
    ok: true,
    groupId: enrollment?.groupId ?? null,
    plan: plan
      ? {
          currentSurah: plan.currentSurah ?? null,
          progressPct: plan.progressPct ?? 0,
        }
      : null,
    lastEvaluation: lastEvaluation
      ? {
          createdAt: lastEvaluation.createdAt,
          newPortion: lastEvaluation.lesson?.newPortion ?? null,
          reviewPortion: lastEvaluation.lesson?.reviewPortion ?? null,
          grades: {
            memorization: lastEvaluation.memorization,
            review: lastEvaluation.review,
            tajweed: lastEvaluation.tajweed,
            commitment: lastEvaluation.commitment,
          },
          overallNote: lastEvaluation.overallNote ?? null,
        }
      : null,
    todayLesson,
    payment: {
      month,
      status: (pendingOrConfirmed as { status: string } | null)?.status ?? "due",
      submittedAt: (pendingOrConfirmed as { submittedAt: Date } | null)?.submittedAt ?? null,
    },
  });
}
