import { NextResponse } from "next/server";
import { requireStudent, getActiveEnrollment } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;
  
  // Fetch all active enrollments for the student
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: "active" },
    include: {
      group: {
        include: {
          schedules: true,
          teacher: { include: { user: { select: { fullName: true } } } }
        }
      }
    }
  });

  const schedules = enrollments.flatMap(e => {
    if (!e.group) return [];
    return e.group.schedules.map(s => ({
      id: s.id,
      groupId: e.group!.id,
      groupName: e.group!.name,
      teacherName: e.group!.teacher?.user.fullName ?? "معلمة غير معروفة",
      meetLink: e.group!.meetLink,
      meetingProvider: e.group!.meetingProvider,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      durationMins: s.durationMins,
    }));
  }).sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return NextResponse.json({
    ok: true,
    schedules,
  });
}
