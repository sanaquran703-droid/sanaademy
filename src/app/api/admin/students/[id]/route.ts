import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const patchSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const student = await prisma.student.findUnique({
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
      memorizationPlan: true,
      enrollments: {
        orderBy: { academicYear: "desc" },
        include: {
          group: { select: { name: true } },
          program: { select: { name: true } },
        },
      },
      payments: {
        orderBy: { submittedAt: "desc" },
      },
      lessons: {
        take: 10,
        orderBy: { scheduledAt: "desc" },
        include: {
          group: { 
            select: { 
              name: true,
              teacher: { select: { user: { select: { fullName: true } } } }
            } 
          },
          attendance: { where: { studentId: id }, take: 1 },
        },
      },
    },
  });

  if (!student) return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });

  return NextResponse.json({ ok: true, student });
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

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.userId },
      data: {
        fullName: d.fullName,
        phone: d.phone,
      },
    }),
    prisma.student.update({
      where: { id },
      data: {
        guardianName: d.guardianName,
        guardianPhone: d.guardianPhone,
        notes: d.notes,
        birthDate: d.birthDate,
      },
    }),
  ]);

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
    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!student) return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });

    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { studentId: id } }),
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      prisma.lesson.deleteMany({ where: { studentId: id } }),
      prisma.enrollment.deleteMany({ where: { studentId: id } }),
      prisma.memorizationPlan.deleteMany({ where: { studentId: id } }),
      prisma.payment.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } }),
      prisma.user.delete({ where: { id: student.userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete student error:", err);
    return NextResponse.json({ error: "تعذر حذف الطالبة نهائياً" }, { status: 500 });
  }
}
