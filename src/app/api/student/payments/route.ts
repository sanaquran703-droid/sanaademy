import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";
import { uploadPaymentProof, MAX_FILE_SIZE } from "@/lib/supabase";

// Multipart-safe parser: extracts the file (proof) and text fields.
async function parseMultipart(req: Request): Promise<{
  file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> } | null;
  fields: Record<string, string>;
}> {
  const contentType = req.headers.get("content-type") ?? "";
  const form = await req.formData();

  const fileObj = form.get("proof") ?? form.get("file");
  const file =
    fileObj instanceof File
      ? {
          name: fileObj.name,
          type: fileObj.type,
          size: fileObj.size,
          arrayBuffer: () => fileObj.arrayBuffer(),
        }
      : null;

  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
  }
  return { file, fields };
}

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "صيغة الشهر غير صحيحة (استخدمي YYYY-MM)");

const DEFAULT_AMOUNT = 500;

export async function POST(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;

  let file;
  let fields: Record<string, string> = {};
  try {
    const parsed = await parseMultipart(req);
    file = parsed.file;
    fields = parsed.fields;
  } catch {
    return NextResponse.json({ error: "تعذّر قراءة الملف المرفوع" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "يجب إرفاق إثبات الدفع (صورة أو PDF)" }, { status: 400 });
  }

  const parsed = monthSchema.safeParse(fields.monthCovered);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }
  const monthCovered = parsed.data;

  const amount = Number(fields.amount ?? DEFAULT_AMOUNT);
  if (isNaN(amount) || amount <= 0 || amount > 100_000) {
    return NextResponse.json({ error: "مبلغ غير صحيح" }, { status: 400 });
  }

  // Server-side file validation (type + size) happens inside uploadPaymentProof.
  // Extra pre-check so a too-large file is rejected before any upload attempt.
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت." }, { status: 400 });
  }
  if (!file.type || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
    return NextResponse.json(
      { error: "نوع الملف غير مسموح. مسموح فقط: صور JPG/PNG/WEBP أو ملف PDF." },
      { status: 400 },
    );
  }

  // Prevent duplicate uploads for the same month (pending or confirmed).
  const existing = await prisma.payment.findFirst({
    where: { studentId, monthCovered, status: { in: ["pending", "confirmed"] } },
    select: { id: true, status: true },
  });
  if (existing) {
    if (existing.status === "confirmed") {
      return NextResponse.json({ error: "تم تسجيل دفعة هذا الشهر بالفعل" }, { status: 409 });
    }
    return NextResponse.json({ error: "تم رفع إثبات لهذا الشهر بالفعل" }, { status: 409 });
  }

  const upload = await uploadPaymentProof(studentId, file);
  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      studentId,
      amount,
      currency: "EGP",
      monthCovered,
      method: "instapay",
      proofUrl: upload.url,
      status: "pending",
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      monthCovered: true,
      status: true,
      submittedAt: true,
    },
  });

  return NextResponse.json({ ok: true, payment }, { status: 201 });
}

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId } = auth.ctx;

  const payments = await prisma.payment.findMany({
    where: { studentId },
    select: {
      id: true,
      amount: true,
      currency: true,
      monthCovered: true,
      method: true,
      proofUrl: true,
      status: true,
      submittedAt: true,
      confirmedAt: true,
      note: true,
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, payments });
}
