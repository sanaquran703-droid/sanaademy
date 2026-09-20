import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { currentAcademicYear } from "@/lib/academic-year";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const year = currentAcademicYear();
    
    // Find students who don't have an 'active' enrollment for the current academic year
    const students = await prisma.student.findMany({
      where: {
        enrollments: {
          none: {
            academicYear: year,
            status: "active",
          },
        },
      },
      select: {
        id: true,
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      fullName: s.user.fullName,
      username: s.user.username,
    }));

    return NextResponse.json({ ok: true, students: formatted });
  } catch (error) {
    console.error("[ADMIN_STUDENTS_UNASSIGNED_GET]", error);
    return NextResponse.json({ error: "تعذّر جلب البيانات" }, { status: 500 });
  }
}
