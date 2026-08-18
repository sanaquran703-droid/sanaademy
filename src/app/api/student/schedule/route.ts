import { NextResponse } from "next/server";
import { requireStudent, getActiveEnrollment } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;
  const enrollment = await getActiveEnrollment(studentId);
  if (!enrollment?.groupId) {
    return NextResponse.json({ ok: true, groupName: null, schedules: [] });
  }

  const [group, schedules] = await Promise.all([
    prisma.group.findUnique({ where: { id: enrollment.groupId }, select: { name: true } }),
    prisma.schedule.findMany({
      where: { groupId: enrollment.groupId },
      orderBy: { dayOfWeek: "asc" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    groupName: group?.name ?? null,
    schedules: schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      durationMins: s.durationMins,
    })),
  });
}
