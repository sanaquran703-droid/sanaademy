import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1),
  teacherId: z.string().nullable().optional(),
  programId: z.string().nullable().optional(),
  meetingProvider: z.enum(["google_meet", "zoom", "discord", "teams", "other"]).default("google_meet"),
  meetLink: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  maxStudents: z.number().int().min(1).max(50),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      durationMins: z.number().int().min(15).max(180),
    })
  ),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const d = parsed.data;

  await prisma.group.create({
    data: {
      name: d.name.trim(),
      teacherId: d.teacherId || null,
      programId: d.programId || null,
      meetingProvider: d.meetingProvider,
      meetLink: d.meetLink || null,
      maxStudents: d.maxStudents,
      academicYear: d.academicYear,
      schedules: {
        create: d.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          durationMins: s.durationMins,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { teacher: { user: { fullName: { contains: query, mode: "insensitive" } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      academicYear: true,
      maxStudents: true,
      teacher: {
        select: {
          user: { select: { fullName: true } },
        },
      },
      program: { select: { name: true } },
      _count: {
        select: { enrollments: { where: { status: "active" } } },
      },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, groups });
}
