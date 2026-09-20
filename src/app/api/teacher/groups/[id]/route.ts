import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Ensure teacher owns the group
    const group = await prisma.group.findFirst({
      where: { id, teacherId: auth.ctx.teacherId },
    });

    if (!group) return NextResponse.json({ error: "الحلقة غير موجودة أو لا تملك صلاحية حذفها" }, { status: 404 });

    // Hard delete group and all related data in correct order
    await prisma.$transaction([
      prisma.evaluation.deleteMany({ where: { lesson: { groupId: id } } }),
      prisma.attendance.deleteMany({ where: { lesson: { groupId: id } } }),
      prisma.lesson.deleteMany({ where: { groupId: id } }),
      prisma.schedule.deleteMany({ where: { groupId: id } }),
      prisma.enrollment.deleteMany({ where: { groupId: id } }),
      prisma.group.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TEACHER_GROUP_DELETE]", error);
    return NextResponse.json({ error: "تعذّر حذف الحلقة نهائياً" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, teacherId: auth.ctx.teacherId },
      include: {
        program: { select: { name: true } },
        schedules: true,
        enrollments: {
          where: { status: "active" },
          include: {
            student: {
              include: {
                user: {
                  select: { fullName: true, username: true, avatarUrl: true }
                }
              }
            }
          }
        }
      }
    });

    if (!group) return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });

    return NextResponse.json({ ok: true, group });
  } catch (error) {
    console.error("[TEACHER_GROUP_GET]", error);
    return NextResponse.json({ error: "تعذّر جلب بيانات الحلقة" }, { status: 500 });
  }
}
