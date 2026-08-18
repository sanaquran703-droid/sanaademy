// Create a local TEST admin account ONLY if no admin exists in the DB.
// Idempotent and safe: never modifies or creates users if an admin already exists.
// The test password is randomly generated and printed ONCE on creation.
// Uses DIRECT_URL (pooler) because this network cannot reach the direct Supabase host.
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

(async () => {
  try {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount > 0) {
      console.log("ABORT: an admin already exists in the DB. Nothing was created or changed.");
      process.exit(0);
    }

    const username = "admin";
    const password = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        username,
        email: "admin@sana-academy.com",
        passwordHash,
        role: "admin",
        fullName: "مدير النظام",
        mustChangePassword: false, // test account — no forced change on first login
        admin: { create: {} },
      },
    });

    console.log("TEST ADMIN CREATED SUCCESSFULLY:");
    console.log("  URL:     http://localhost:3000/login/admin");
    console.log("  username: admin");
    console.log("  password: " + password);
    console.log("  (forced password change disabled for this test account)");
    console.log("NOTE: change this password or delete the account before real use.");
  } catch (e) {
    console.error("SEED_FAIL:", (e.message || "").split("\n").slice(0, 4).join(" | "));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
