import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";

export async function GET(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ ok: true, students: [] });
  }
  const groupId = searchParams.get("groupId");
  const teacherId = auth.ctx.teacherId;
  const year = currentAcademicYear();

  // If a groupId filter is supplied it must belong to the signed-in teacher.
  if (groupId) {
    const ownsGroup = await prisma.group.findFirst({
      where: { id: groupId, teacherId },
      select: { id: true },
    });
    if (!ownsGroup) {
      return NextResponse.json({ error: "لا تملك صلاحية لهذه الحلقة" }, { status: 403 });
    }
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        user: { isActive: true },
        OR: [
          { user: { fullName: { contains: query, mode: "insensitive" } } },
          { user: { username: { contains: query, mode: "insensitive" } } },
        ],
        // A teacher may only see students who are not already assigned to another
        // teacher (unassigned) or who are already in one of their own groups.
        enrollments: {
          none: {
            academicYear: year,
            status: "active",
            group: { teacherId: { not: null } },
            NOT: { group: { teacherId } },
          },
        },
        // Exclude students already in this specific group
        ...(groupId ? {
          AND: [{ enrollments: { none: { groupId } } }]
        } : {})
      },
      select: {
        id: true,
        user: {
          select: {
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      take: 20,
      orderBy: { user: { fullName: "asc" } },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      fullName: s.user.fullName,
      username: s.user.username,
      avatarUrl: s.user.avatarUrl,
    }));

    return NextResponse.json({ ok: true, students: formatted });
  } catch (error) {
    console.error("[TEACHER_STUDENTS_SEARCH_GET]", error);
    return NextResponse.json({ error: "تعذّر جلب البيانات" }, { status: 500 });
  }
}
