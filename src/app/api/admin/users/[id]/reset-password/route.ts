import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const schema = z.object({ newPassword: z.string().min(6).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  let newPassword = "";
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (parsed.success && parsed.data.newPassword) {
      newPassword = parsed.data.newPassword;
    }
  } catch (e) {
    // Empty body is fine for random generation
  }

  if (!newPassword) {
    // Generate 12-char cryptographically secure random password
    newPassword = crypto.randomBytes(9).toString("base64").replace(/\+/g, "0").replace(/\//g, "1");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  return NextResponse.json({ ok: true, newPassword });
}
