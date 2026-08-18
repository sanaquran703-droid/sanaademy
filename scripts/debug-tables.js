// Debug v3: test PrismaClient against BOTH URLs to find which one works.
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

process.chdir(path.join(__dirname, ".."));
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1].trim()] = m[2].trim();
}

async function testClient(label, url) {
  console.log(`\n--- Client test: ${label} ---`);
  const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
  try {
    const res = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS user_`;
    console.log("OK:", JSON.stringify(res));
    await prisma.$disconnect();
    return true;
  } catch (e) {
    console.log("FAIL:", (e.message || "").split("\n").slice(0, 3).join(" | "));
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

(async () => {
  await testClient("DATABASE_URL (db.*.supabase.co)", process.env.DATABASE_URL);
  await testClient("DIRECT_URL (pooler)", process.env.DIRECT_URL);
})();
