import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.$transaction([
      // 1. Delete evaluations for lessons in groups of this program
      prisma.evaluation.deleteMany({
        where: { lesson: { group: { programId: id } } }
      }),
      // 2. Delete attendance for lessons in groups of this program
      prisma.attendance.deleteMany({
        where: { lesson: { group: { programId: id } } }
      }),
      // 3. Delete lessons
      prisma.lesson.deleteMany({
        where: { group: { programId: id } }
      }),
      // 4. Delete schedules
      prisma.schedule.deleteMany({
        where: { group: { programId: id } }
      }),
      // 5. Delete enrollments
      prisma.enrollment.deleteMany({
        where: { programId: id }
      }),
      // 6. Delete groups
      prisma.group.deleteMany({
        where: { programId: id }
      }),
      // 7. Finally delete program
      prisma.program.delete({
        where: { id }
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN_PROGRAM_DELETE]", error);
    return NextResponse.json({ error: "تعذّر حذف البرنامج نهائياً" }, { status: 500 });
  }
}
