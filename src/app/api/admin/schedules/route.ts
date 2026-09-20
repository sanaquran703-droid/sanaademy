import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        group: {
          include: {
            teacher: { include: { user: { select: { fullName: true } } } },
            _count: { select: { enrollments: { where: { status: "active" } } } },
          },
        },
      },
    });
    return NextResponse.json({ ok: true, schedules });
  } catch (error) {
    console.error("[ADMIN_SCHEDULES_GET]", error);
    return NextResponse.json({ error: "تعذّر تحميل الجداول" }, { status: 500 });
  }
}
