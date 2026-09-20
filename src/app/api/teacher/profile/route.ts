import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireTeacher } from "@/lib/teacher-auth";
import { prisma } from "@/lib/prisma";
import { uploadAvatar, MAX_FILE_SIZE } from "@/lib/supabase";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "كلمة السر الجديدة 8 أحرف على الأقل").max(128),
  })
  .strict();

export async function PATCH(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;

  const { userId } = auth.ctx;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    const data: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const fileObj = form.get("avatar");
      
      if (fileObj instanceof File) {
        if (fileObj.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: "حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت." }, { status: 400 });
        }
        if (!fileObj.type || !["image/jpeg", "image/png", "image/webp"].includes(fileObj.type)) {
          return NextResponse.json({ error: "نوع الصورة غير مسموح. مسموح فقط: صور JPG/PNG/WEBP." }, { status: 400 });
        }
        
        const upload = await uploadAvatar(userId, {
          name: fileObj.name,
          type: fileObj.type,
          size: fileObj.size,
          arrayBuffer: () => fileObj.arrayBuffer(),
        });
        
        if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 });
        data.avatarUrl = upload.url;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      const parsed = passwordSchema.safeParse(body);
      
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
      if (!user) return NextResponse.json({ error: "تعذّر التحقق من الحساب" }, { status: 400 });

      const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
      if (!valid) return NextResponse.json({ error: "كلمة السر الحالية غير صحيحة" }, { status: 400 });

      data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
      data.mustChangePassword = false;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للحفظ" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("TEACHER_PROFILE_UPDATE_ERROR:", e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الحساب" }, { status: 500 });
  }
}
