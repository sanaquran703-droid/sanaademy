import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  teacherId: z.string().nullable().optional(),
  programId: z.string().nullable().optional(),
  maxStudents: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  meetingProvider: z.enum(["google_meet", "zoom", "discord", "teams", "other"]).optional(),
  meetLink: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, user: { select: { fullName: true } } } },
      program: { select: { id: true, name: true } },
      schedules: true,
      enrollments: {
        where: { status: "active" },
        include: {
          student: {
            select: {
              id: true,
              user: { select: { fullName: true, username: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });

  return NextResponse.json({ ok: true, group });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const d = parsed.data;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });

  await prisma.group.update({
    where: { id },
    data: {
      name: d.name,
      teacherId: d.teacherId,
      programId: d.programId,
      maxStudents: d.maxStudents,
      isActive: d.isActive,
      meetingProvider: d.meetingProvider,
      meetLink: d.meetLink,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    // Hard delete - handle relations in a transaction
    // Based on schema, Lesson has onDelete: Cascade for Group, Schedule has onDelete: Cascade for Group.
    // However, Attendance and Evaluation depend on Lesson.
    // Let's manually clean up to be safe and avoid foreign key violations.
    await prisma.$transaction([
      // 1. Delete evaluations related to lessons in this group
      prisma.evaluation.deleteMany({
        where: { lesson: { groupId: id } }
      }),
      // 2. Delete attendance related to lessons in this group
      prisma.attendance.deleteMany({
        where: { lesson: { groupId: id } }
      }),
      // 3. Delete lessons
      prisma.lesson.deleteMany({
        where: { groupId: id }
      }),
      // 4. Delete schedules
      prisma.schedule.deleteMany({
        where: { groupId: id }
      }),
      // 5. Delete enrollments
      prisma.enrollment.deleteMany({
        where: { groupId: id }
      }),
      // 6. Finally delete the group
      prisma.group.delete({
        where: { id }
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Hard delete group error:", err);
    return NextResponse.json({ error: "تعذر حذف الحلقة نهائياً" }, { status: 500 });
  }
}
