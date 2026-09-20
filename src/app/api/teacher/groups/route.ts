import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

const createSchema = z.object({
  name: z.string().min(1),
  programId: z.string().min(1),
  maxStudents: z.number().int().min(1).max(50).default(10),
  meetingProvider: z.enum(["google_meet", "zoom", "discord", "teams", "other"]).default("google_meet"),
  meetLink: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      durationMins: z.number().int().min(15).max(180),
    })
  ).min(1),
});

export async function POST(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    const d = parsed.data;

    const group = await prisma.group.create({
      data: {
        name: d.name.trim(),
        teacherId: auth.ctx.teacherId,
        programId: d.programId,
        meetingProvider: d.meetingProvider,
        meetLink: d.meetLink || null,
        maxStudents: d.maxStudents,
        academicYear: currentAcademicYear(),
        isActive: true,
        schedules: {
          create: d.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            durationMins: s.durationMins,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, group });
  } catch (e) {
    return NextResponse.json({ error: "تعذّر إنشاء الحلقة" }, { status: 500 });
  }
}

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
