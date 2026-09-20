import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const programs = await prisma.program.findMany({
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ ok: true, programs });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_GET]", error);
    return NextResponse.json({ error: "تعذّر تحميل البرامج" }, { status: 500 });
  }
}
