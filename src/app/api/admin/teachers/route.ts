import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { ensureUniqueUsername } from "@/lib/username";

const schema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/i),
  password: z.string().min(6),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  const d = parsed.data;

  const username = await ensureUniqueUsername(d.username);
  if (d.email) {
    const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "هذا البريد مسجل بالفعل" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({
    data: {
      username,
      email: d.email ? d.email.toLowerCase().trim() : null,
      passwordHash,
      role: "teacher",
      fullName: d.fullName.trim(),
      phone: d.phone || null,
      mustChangePassword: true,
      teacher: {
        create: { specialty: d.specialty || null, bio: d.bio || null },
      },
    },
  });

  return NextResponse.json({ ok: true, username });
}

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";
  const isActive = searchParams.get("active");

  const teachers = await prisma.teacher.findMany({
    where: {
      user: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
        ...(isActive === "true" || isActive === "false" ? { isActive: isActive === "true" } : {}),
      },
    },
    select: {
      id: true,
      userId: true,
      specialty: true,
      user: {
        select: {
          fullName: true,
          username: true,
          phone: true,
          isActive: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: { groups: true },
      },
    },
    orderBy: { user: { fullName: "asc" } },
    take: 100,
  });

  return NextResponse.json({ ok: true, teachers });
}
