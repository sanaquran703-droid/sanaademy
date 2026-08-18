// Read-only: check whether the seeded admin account exists in the live DB,
// its mustChangePassword flag, and whether any users exist at all.
// NO passwords or hashes are printed. NO writes.
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

process.chdir(path.join(__dirname, ".."));
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1].trim()] = m[2].trim();
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL, // pooler works on this network
  log: [],
});

(async () => {
  try {
    const total = await prisma.user.count();
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { username: true, fullName: true, isActive: true, mustChangePassword: true, lastLoginAt: true, createdAt: true },
    });
    const students = await prisma.user.count({ where: { role: "student" } });
    const teachers = await prisma.user.count({ where: { role: "teacher" } });

    console.log("TOTAL_USERS:", total);
    console.log("ADMINS_COUNT:", admins.length);
    for (const a of admins) {
      console.log(
        "ADMIN ->",
        JSON.stringify({
          username: a.username,
          fullName: a.fullName,
          isActive: a.isActive,
          mustChangePassword: a.mustChangePassword,
          lastLoginAt: a.lastLoginAt,
          createdAt: a.createdAt,
        })
      );
    }
    console.log("STUDENTS_COUNT:", students);
    console.log("TEACHERS_COUNT:", teachers);

    if (admins.length === 0) {
      console.log("NO_ADMIN_IN_DB: a test admin can be safely created (no existing admin accounts).");
    }
  } catch (e) {
    console.error("CHECK_FAIL:", (e.message || "").split("\n").slice(0, 4).join(" | "));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
