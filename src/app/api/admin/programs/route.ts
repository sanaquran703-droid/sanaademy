import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().trim().min(2, "اسم البرنامج قصير جداً"),
  description: z.string().trim().optional().nullable(),
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "program"
  );
}

async function ensureUniqueSlug(name: string) {
  const base = slugify(name).slice(0, 40);
  let slug = base;
  let i = 1;
  while (await prisma.program.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  try {
    const name = parsed.data.name.trim();
    const description = parsed.data.description?.trim() || null;
    const slug = await ensureUniqueSlug(name);

    const program = await prisma.program.create({
      data: { name, description, slug },
    });

    return NextResponse.json({ ok: true, program }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_POST]", error);
    return NextResponse.json({ error: "تعذّر إنشاء البرنامج" }, { status: 500 });
  }
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const programs = await prisma.program.findMany({
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ ok: true, programs });
  } catch (error) {
    console.error("[ADMIN_PROGRAMS_GET]", error);
    return NextResponse.json({ error: "تعذّر تحميل البرامج" }, { status: 500 });
  }
}
