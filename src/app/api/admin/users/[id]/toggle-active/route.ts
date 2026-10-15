import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { prismaErrorResponse } from "@/lib/api-errors";
import { uuidSchema } from "@/lib/api-validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  // Prevent an admin from deactivating their own account (self-lockout).
  if (session!.id === id) {
    return NextResponse.json({ error: "لا يمكنك تعطيل حسابك الخاص" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true, isActive: true, role: true },
      });
      if (!user) return { status: 404, body: { error: "المستخدم غير موجود" } };

      const nextActive = !user.isActive;

      // Refuse to deactivate the last remaining active administrator.
      if (!nextActive && user.role === "admin") {
        const otherActiveAdmins = await tx.user.count({
          where: { role: "admin", isActive: true, id: { not: id } },
        });
        if (otherActiveAdmins === 0) {
          return {
            status: 400,
            body: { error: "لا يمكن تعطيل آخر حساب إداري نشط" },
          };
        }
      }

      const updated = await tx.user.update({
        where: { id },
        data: { isActive: nextActive },
        select: { isActive: true },
      });

      return { status: 200, body: { ok: true, isActive: updated.isActive } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return prismaErrorResponse(err, "تعذّر تحديث حالة الحساب");
  }
}
