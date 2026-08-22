import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const patchSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          fullName: true,
          username: true,
          email: true,
          phone: true,
          isActive: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
      groups: {
        include: {
          program: { select: { name: true } },
          _count: { select: { enrollments: { where: { status: "active" } } } },
        },
      },
    },
  });

  if (!teacher) return NextResponse.json({ error: "المعلمة غير موجودة" }, { status: 404 });

  // Simple stat: lessons in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLessonsCount = await prisma.lesson.count({
    where: {
      group: { teacherId: id },
      scheduledAt: { gte: thirtyDaysAgo },
      status: "completed",
    },
  });

  return NextResponse.json({ ok: true, teacher, stats: { recentLessonsCount } });
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

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "المعلمة غير موجودة" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: teacher.userId },
      data: {
        fullName: d.fullName,
        phone: d.phone,
      },
    }),
    prisma.teacher.update({
      where: { id },
      data: {
        specialty: d.specialty,
        bio: d.bio,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
