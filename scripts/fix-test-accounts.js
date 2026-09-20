const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log("Fixing test accounts (setting mustChangePassword = false)...");
  await prisma.user.updateMany({
    where: { username: { in: ['admin', 'teacher_maryam', 'test_delete_student'] } },
    data: { mustChangePassword: false }
  });
  console.log("✅ Done.");
  await prisma.$disconnect();
}

fix().catch(console.error);
