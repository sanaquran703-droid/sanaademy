// Create a TEST student account (owned by the test teacher's group) ONLY if a
// student with this username doesn't already exist. Idempotent and safe.
// Prints the password ONCE on creation and also writes it to a gitignored
// creds file so it can be used by the security test script.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

process.chdir(path.join(__dirname, ".."));
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1].trim()] = m[2].trim();
}

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL, log: [] });

// The test group created during Teacher Portal setup ("حلقة تجريبية").
const GROUP_NAME = "حلقة تجريبية";
const USERNAME = "sana_s_test12";
const CREDS_FILE = path.join(__dirname, "student-test-creds.json");

(async () => {
  try {
    const existing = await prisma.user.findUnique({ where: { username: USERNAME } });
    if (existing) {
      const creds = { username: USERNAME, note: "test student — change or delete before real use" };
      if (fs.existsSync(CREDS_FILE)) creds.password = JSON.parse(fs.readFileSync(CREDS_FILE, "utf8")).password;
      fs.writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2) + "\n");
      console.log("ABORT: test student already exists. Creds file updated. Nothing was changed in the DB.");
      process.exit(0);
    }

    const group = await prisma.group.findFirst({ where: { name: GROUP_NAME } });
    if (!group) {
      console.error("SEED_FAIL: test group '" + GROUP_NAME + "' not found. Run teacher setup first.");
      process.exit(1);
    }

    const password = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: USERNAME,
        role: "student",
        fullName: "طالبة اختبارية",
        passwordHash,
        mustChangePassword: false,
        student: {
          create: {
            enrollments: {
              create: {
                academicYear: "2025-2026",
                groupId: group.id,
                startDate: new Date("2025-09-01"),
                status: "active",
              },
            },
          },
        },
      },
    });

    fs.writeFileSync(
      CREDS_FILE,
      JSON.stringify({ username: USERNAME, password, note: "test student credentials — change or delete before real use" }, null, 2) + "\n",
    );

    console.log("TEST STUDENT CREATED SUCCESSFULLY:");
    console.log("  URL:     http://localhost:3000/login/student");
    console.log("  username:", USERNAME);
    console.log("  password:", password);
    console.log("  group:", group.name, "(" + group.id + ")");
    console.log("NOTE: credentials also saved to " + path.basename(CREDS_FILE) + " (gitignored).");
  } catch (e) {
    console.error("SEED_FAIL:", (e.message || "").split("\n").slice(0, 4).join(" | "));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
