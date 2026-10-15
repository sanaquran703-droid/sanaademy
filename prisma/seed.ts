import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return;
  }

  const tempPassword = randomBytes(16).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const admin = await prisma.user.create({
    data: {
      username,
      email: "admin@sana-academy.com",
      passwordHash,
      role: UserRole.admin,
      fullName: "مدير النظام",
      mustChangePassword: true,
      admin: { create: {} },
    },
  });

  const existingPrograms = await prisma.program.findMany();
  if (existingPrograms.length === 0) {
    await prisma.$transaction([
      prisma.program.create({ data: { name: "برنامج الحفظ", slug: "hifz" } }),
      prisma.program.create({ data: { name: "برنامج المراجعة والتثبيت", slug: "review" } }),
      prisma.program.create({ data: { name: "برنامج الإجازة في القرآن الكريم", slug: "ijazah" } }),
    ]);
  }

  process.stdout.write(`Admin created. Temporary password: ${tempPassword}\n`);
  process.stdout.write("This password must be changed on first login.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
