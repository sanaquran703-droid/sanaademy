import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { currentAcademicYear } from "@/lib/academic-year";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const year = currentAcademicYear();
    
    // Get all active groups for the current year
    const groups = await prisma.group.findMany({
      where: { isActive: true, academicYear: year },
      select: {
        id: true,
        name: true,
        teacherId: true,
        teacher: { 
          select: { 
            user: { select: { fullName: true } } 
          } 
        },
        _count: { 
          select: { 
            enrollments: { where: { status: "active", academicYear: year } } 
          } 
        },
        maxStudents: true,
      },
      orderBy: { name: "asc" },
    });

    // Get all students and their current enrollment for this year
    const students = await prisma.student.findMany({
      select: {
        id: true,
        user: { select: { fullName: true } },
        enrollments: {
          where: { academicYear: year, status: "active" },
          select: {
            groupId: true,
            group: { select: { name: true } }
          },
          take: 1
        }
      },
      orderBy: { user: { fullName: "asc" } },
    });

    const formattedStudents = students.map(s => ({
      id: s.id,
      name: s.user.fullName,
      currentGroupId: s.enrollments[0]?.groupId || null,
      currentGroupName: s.enrollments[0]?.group?.name || null,
    }));

    return NextResponse.json({ 
      ok: true, 
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        teacherId: g.teacherId,
        teacherName: g.teacher?.user?.fullName,
        studentCount: g._count.enrollments,
        maxStudents: g.maxStudents,
      })),
      students: formattedStudents,
      academicYear: year 
    });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENTS_GET]", error);
    return NextResponse.json({ error: "تعذّر جلب البيانات" }, { status: 500 });
  }
}
