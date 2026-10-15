import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { readJson, prismaErrorResponse } from "@/lib/api-errors";
import { uuidSchema } from "@/lib/api-validation";

const schema = z.object({ action: z.enum(["confirm", "reject"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });

  const existing = await prisma.payment.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "سجل الدفع غير موجود" }, { status: 404 });

  try {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: parsed.data.action === "confirm" ? "confirmed" : "rejected",
        confirmedAt: new Date(),
        confirmedBy: session!.id,
      },
      include: { student: { select: { userId: true } } },
    });

    await createNotification({
      userId: payment.student.userId,
      title: parsed.data.action === "confirm" ? "تم تأكيد اشتراكك" : "تنبيه بخصوص الدفع",
      message:
        parsed.data.action === "confirm"
          ? `لقد تم تأكيد سداد اشتراكك لشهر ${payment.monthCovered} بنجاح.`
          : `نعتذر، لقد تم رفض إثبات السداد لشهر ${payment.monthCovered}. يرجى مراجعة الإدارة.`,
      type: parsed.data.action === "confirm" ? "success" : "error",
      link: "/student/payments",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return prismaErrorResponse(err, "تعذّر تحديث حالة الدفع");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  try {
    const result = await prisma.payment.updateMany({
      where: { id },
      data: { status: "rejected", note: "deleted-by-admin" },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "سجل الدفع غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return prismaErrorResponse(err, "تعذر تحديث سجل الدفع");
  }
}
