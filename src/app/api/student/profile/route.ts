import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";
import { uploadAvatar, MAX_FILE_SIZE } from "@/lib/supabase";

// Strict allowlist: only avatar + password change are permitted.
// Any extra field in the JSON body is ignored; non-allowed keys cannot mutate data.
const schema = z
  .object({
    avatarUrl: z.string().url().max(2000).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8, "كلمة السر الجديدة 8 أحرف على الأقل").max(128).optional(),
  })
  .strict()
  .refine((d) => !(d.newPassword && !d.currentPassword), {
    message: "أدخلي كلمة السر الحالية لتغيير كلمة السر",
  });

export async function PATCH(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { studentId, userId } = auth.ctx;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Avatar upload path (multipart) — same file rules as payment proofs.
  const contentType = req.headers.get("content-type") ?? "";
  let avatarUrl: string | undefined = d.avatarUrl;
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const fileObj = form.get("avatar");
    const file =
      fileObj instanceof File
        ? {
            name: fileObj.name,
            type: fileObj.type,
            size: fileObj.size,
            arrayBuffer: () => fileObj.arrayBuffer(),
          }
        : null;
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت." }, { status: 400 });
      }
      if (!file.type || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return NextResponse.json(
          { error: "نوع الصورة غير مسموح. مسموح فقط: صور JPG/PNG/WEBP." },
          { status: 400 },
        );
      }
      const upload = await uploadAvatar(userId, file);
      if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 });
      avatarUrl = upload.url;
    }
  }

  const data: Record<string, unknown> = {};
  if (avatarUrl) data.avatarUrl = avatarUrl;

  if (d.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) {
      return NextResponse.json({ error: "تعذّر التحقق من الحساب" }, { status: 400 });
    }
    const valid = await bcrypt.compare(d.currentPassword ?? "", user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "كلمة السر الحالية غير صحيحة" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(d.newPassword, 12);
    data.mustChangePassword = false;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا توجد تغييرات للحفظ" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data });

  return NextResponse.json({ ok: true });
}
