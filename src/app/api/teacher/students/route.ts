import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

// Active students for the signed-in teacher, grouped by their group.
// Optionally filters by name (client can pass ?name=...).
export async function GET(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const nameFilter = searchParams.get("name")?.trim() || null;

  const year = currentAcademicYear();

  const groups = await prisma.group.findMany({
    where: { teacherId: auth.ctx.teacherId, isActive: true },
    include: { program: { select: { name: true } } },
  });

  const out: { groupId: string; groupName: string; programName: string | null; students: { id: string; fullName: string; groupName: string }[] }[] = [];

  for (const group of groups) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        groupId: group.id,
        academicYear: year,
        status: "active",
        ...(nameFilter ? { student: { user: { fullName: { contains: nameFilter, mode: "insensitive" } } } } : {}),
      },
      select: {
        student: {
          select: { id: true, user: { select: { fullName: true } } },
        },
      },
    });

    out.push({
      groupId: group.id,
      groupName: group.name,
      programName: group.program?.name ?? null,
      students: enrollments.map((e) => ({
        id: e.student.id,
        fullName: e.student.user.fullName,
        groupName: group.name,
      })),
    });
  }

  return NextResponse.json({ ok: true, groups: out, academicYear: year });
}
