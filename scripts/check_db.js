const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasourceUrl: "postgres://postgres.gvhejkcmlqtmxvankijc:GhW7gBHCpZWEiye4@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
});
async function main() {
  try {
    const programs = await prisma.program.findMany({ where: { isActive: true } });
    console.log("PROGRAMS_DATA:", JSON.stringify(programs));
    const teachers = await prisma.teacher.findMany({ include: { user: true } });
    console.log("TEACHERS_DATA:", JSON.stringify(teachers.map(t => ({ id: t.id, name: t.user.fullName }))));
  } catch (e) {
    console.error("DB_ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
