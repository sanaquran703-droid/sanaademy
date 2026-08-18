// List students + their active enrollments + test teacher group info, for security test setup.
require("./load-env");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL, log: [] });

(async () => {
  try {
    const students = await prisma.student.findMany({
      take: 10,
      include: {
        user: { select: { username: true, fullName: true } },
        enrollments: { where: { status: "active" }, take: 2, include: { group: { select: { id: true, name: true, teacherId: true } } } },
        payments: { select: { monthCovered: true, status: true } },
      },
    });
    console.log(JSON.stringify(students, null, 1));
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error("ERR:", e.message);
    process.exit(1);
  }
})();
