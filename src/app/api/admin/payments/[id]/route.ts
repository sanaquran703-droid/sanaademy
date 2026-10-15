import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";

const schema = z.object({ action: z.enum(["confirm", "reject"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status: parsed.data.action === "confirm" ? "confirmed" : "rejected",
      confirmedAt: new Date(),
      confirmedBy: session!.id,
    },
    include: { student: { select: { userId: true } } }
  });

  // Send notification to student
  await createNotification({
    userId: payment.student.userId,
    title: parsed.data.action === "confirm" ? "تم تأكيد اشتراكك" : "تنبيه بخصوص الدفع",
    message: parsed.data.action === "confirm" 
      ? `لقد تم تأكيد سداد اشتراكك لشهر ${payment.monthCovered} بنجاح.` 
      : `نعتذر، لقد تم رفض إثبات السداد لشهر ${payment.monthCovered}. يرجى مراجعة الإدارة.`,
    type: parsed.data.action === "confirm" ? "success" : "error",
    link: "/student/payments"
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.payment.update({
      where: { id },
      data: { status: "rejected", note: "deleted-by-admin" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "تعذر تحديث سجل الدفع" }, { status: 500 });
  }
}
