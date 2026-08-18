import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

// The teacher's groups with active student counts and weekly schedules.
export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const year = currentAcademicYear();
  const groups = await prisma.group.findMany({
    where: { teacherId: auth.ctx.teacherId, isActive: true },
    include: {
      program: { select: { name: true } },
      schedules: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  const withCounts = await Promise.all(
    groups.map(async (g) => {
      const count = await prisma.enrollment.count({
        where: { groupId: g.id, academicYear: year, status: "active" },
      });
      return {
        id: g.id,
        name: g.name,
        programName: g.program?.name ?? null,
        meetLink: g.meetLink,
        meetingProvider: g.meetLink ? g.meetingProvider : null,
        maxStudents: g.maxStudents,
        studentCount: count,
        schedules: g.schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          durationMins: s.durationMins,
        })),
      };
    }),
  );

  return NextResponse.json({ ok: true, groups: withCounts, academicYear: year });
}
