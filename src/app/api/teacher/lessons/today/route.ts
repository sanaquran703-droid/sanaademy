import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

// Returns today's lessons for the signed-in teacher.
// Each scheduled slot from the group's schedule is joined with any existing
// Lesson record for the same student/time window, so the UI knows whether a
// lesson was already recorded ("مسجَّلة") or not ("لم تُسجَّل").
export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const dayOfWeek = today.getDay(); // 0=Sunday .. 6=Saturday (matches Schedule.dayOfWeek)

  // Active enrollments for this teacher's groups in the current academic year,
  // grouped by group so we can pair each student with that group's schedule.
  const groups = await prisma.group.findMany({
    where: { teacherId: auth.ctx.teacherId, isActive: true },
    include: {
      schedules: { where: { dayOfWeek } },
      program: { select: { name: true } },
    },
  });

  const lessonsToday = await prisma.lesson.findMany({
    where: {
      groupId: { in: groups.map((g) => g.id) },
      scheduledAt: { gte: today, lt: tomorrow },
    },
    include: { student: { include: { user: { select: { fullName: true } } } } },
  });

  const existing = new Map<string, (typeof lessonsToday)[number]>();
  for (const l of lessonsToday) {
    existing.set(`${l.groupId}-${l.studentId ?? ""}`, l);
  }

  const rows: {
    id: string | null;
    groupId: string;
    studentId: string | null;
    studentName: string | null;
    groupName: string;
    programName: string | null;
    scheduledAt: string;
    startTime: string;
    status: string; // "recorded" | "scheduled"
    meetLink: string | null;
    durationMins: number;
  }[] = [];

  for (const group of groups) {
    for (const schedule of group.schedules) {
      const [hh, mm] = schedule.startTime.split(":").map(Number);
      const scheduledAt = new Date(today);
      scheduledAt.setHours(hh, mm, 0, 0);
      const endAt = new Date(scheduledAt.getTime() + schedule.durationMins * 60 * 1000);

      // Group-level lesson record (no specific student) takes priority.
      const groupLesson = existing.get(`${group.id}-`);
      if (groupLesson) {
        rows.push({
          id: groupLesson.id,
          groupId: group.id,
          studentId: null,
          studentName: null,
          groupName: group.name,
          programName: group.program?.name ?? null,
          scheduledAt: scheduledAt.toISOString(),
          startTime: schedule.startTime,
          status: "recorded",
          meetLink: groupLesson.meetLink ?? group.meetLink ?? null,
          durationMins: schedule.durationMins,
        });
        continue;
      }

      // Student-specific lesson records in this group for today.
      for (const studentLesson of lessonsToday.filter(
        (l) => l.groupId === group.id && l.studentId !== null,
      )) {
        existing.delete(`${group.id}-${studentLesson.studentId}`);
        rows.push({
          id: studentLesson.id,
          groupId: group.id,
          studentId: studentLesson.studentId,
          studentName: studentLesson.student?.user.fullName ?? null,
          groupName: group.name,
          programName: group.program?.name ?? null,
          scheduledAt: scheduledAt.toISOString(),
          startTime: schedule.startTime,
          status: "recorded",
          meetLink: studentLesson.meetLink ?? group.meetLink ?? null,
          durationMins: schedule.durationMins,
        });
      }

      // Students in this group with an active enrollment today who have no
      // recorded lesson yet -> show as scheduled slots.
      const studentsInGroup = await prisma.enrollment.findMany({
        where: { groupId: group.id, status: "active" },
        select: { student: { select: { id: true, user: { select: { fullName: true } } } } },
      });
      for (const e of studentsInGroup) {
        if (!existing.has(`${group.id}-${e.student.id}`)) {
          rows.push({
            id: null,
            groupId: group.id,
            studentId: e.student.id,
            studentName: e.student.user.fullName,
            groupName: group.name,
            programName: group.program?.name ?? null,
            scheduledAt: scheduledAt.toISOString(),
            startTime: schedule.startTime,
            status: "scheduled",
            meetLink: group.meetLink ?? null,
            durationMins: schedule.durationMins,
          });
        }
      }
    }
  }

  // Sort by start time.
  rows.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));

  return NextResponse.json({ ok: true, rows });
}
