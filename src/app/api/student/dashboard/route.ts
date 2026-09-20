import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";
import { currentAcademicYear } from "@/lib/academic-year";

function nowMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;

  const year = currentAcademicYear();
  const [enrollment, plan, lastEvaluation, lessons, pendingOrConfirmed] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, status: "active", academicYear: year },
      include: {
        group: {
          include: {
            teacher: {
              include: {
                user: {
                  select: { fullName: true, avatarUrl: true }
                }
              }
            },
            program: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
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
      
      const schedules = await prisma.schedule.findMany({
        where: {
          group: {
            enrollments: { some: { studentId, status: "active", academicYear: year } },
          },
          dayOfWeek,
        },
        select: {
          startTime: true,
          durationMins: true,
          group: { 
            select: { 
              id: true,
              name: true, 
              meetLink: true, 
              meetingProvider: true,
              teacher: {
                include: { user: { select: { fullName: true } } }
              }
            } 
          },
        },
        orderBy: { startTime: "asc" }
      });

      return schedules.map(sched => {
        const [h, m] = sched.startTime.split(":").map(Number);
        const startsAt = new Date(startOfDay);
        startsAt.setHours(h, m, 0, 0);
        const endsAt = new Date(startsAt.getTime() + (sched.durationMins ?? 30) * 60 * 1000);
        const status =
          now >= endsAt ? "finished" : now >= startsAt ? "ongoing" : "upcoming";
        
        return {
          groupId: sched.group?.id,
          groupName: sched.group?.name ?? null,
          teacherName: sched.group?.teacher?.user?.fullName ?? null,
          meetLink: sched.group?.meetLink ?? null,
          meetingProvider: sched.group?.meetingProvider ?? null,
          startTime: startsAt.toISOString(),
          durationMins: sched.durationMins,
          status,
        };
      });
    })(),
    prisma.payment.findFirst({
      where: { studentId, monthCovered: nowMonth() },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const month = nowMonth();
  const mainEnrollment = enrollment[0];

  return NextResponse.json({
    ok: true,
    enrollments: enrollment.map(e => ({
      groupId: e.groupId,
      groupName: e.group?.name,
      programName: e.group?.program?.name,
      teacher: e.group?.teacher ? {
        name: e.group.teacher.user.fullName,
        avatarUrl: e.group.teacher.user.avatarUrl
      } : null,
    })),
    groupId: mainEnrollment?.groupId ?? null,
    groupName: mainEnrollment?.group?.name ?? null,
    programName: mainEnrollment?.group?.program?.name ?? null,
    teacher: mainEnrollment?.group?.teacher ? {
      name: mainEnrollment.group.teacher.user.fullName,
      avatarUrl: mainEnrollment.group.teacher.user.avatarUrl
    } : null,
    plan: plan
      ? {
          currentSurah: plan.currentSurah ?? null,
          currentAyahFrom: plan.currentAyahFrom ?? null,
          currentAyahTo: plan.currentAyahTo ?? null,
          reviewSurah: plan.reviewSurah ?? null,
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
    todayLessons: lessons, // Array of lessons instead of single todayLesson
    payment: {
      month,
      status: (pendingOrConfirmed as { status: string } | null)?.status ?? "due",
      submittedAt: (pendingOrConfirmed as { submittedAt: Date } | null)?.submittedAt ?? null,
    },
  });
}
