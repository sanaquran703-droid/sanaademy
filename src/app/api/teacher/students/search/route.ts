import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

export async function GET(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const groupId = searchParams.get("groupId");

  try {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { user: { fullName: { contains: query, mode: "insensitive" } } },
          { user: { username: { contains: query, mode: "insensitive" } } },
        ],
        // Exclude students already in this specific group
        ...(groupId ? {
          enrollments: {
            none: { groupId }
          }
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
