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
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "التسجيل غير موجود" }, { status: 404 });
    }

    // Never delete - update status to 'withdrawn'
    await prisma.enrollment.update({
      where: { id },
      data: { status: "withdrawn" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENT_DELETE]", error);
    return NextResponse.json({ error: "تعذّر إلغاء التسجيل" }, { status: 500 });
  }
}
