import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { readJson, prismaErrorResponse } from "@/lib/api-errors";
import { uuidSchema } from "@/lib/api-validation";

// The admin supplies the new (temporary) password; the plaintext value is never
// echoed back in the response and is never logged.
const schema = z.object({
  newPassword: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(128),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  try {
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    const response = NextResponse.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    return prismaErrorResponse(err, "تعذّر إعادة تعيين كلمة المرور");
  }
}
