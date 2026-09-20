import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  try {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, programs });
  } catch (error) {
    console.error("[TEACHER_PROGRAMS_GET]", error);
    return NextResponse.json({ error: "تعذّر جلب البرامج" }, { status: 500 });
  }
}
