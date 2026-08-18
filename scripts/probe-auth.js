// Directly exercise the authenticate() flow using the project's own prisma client.
// Shows the exact error without Next.js layers.
const fs = require("fs");
const path = require("path");

process.chdir(path.join(__dirname, ".."));
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1].trim()] = m[2].trim();
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: "admin" }, { email: "admin" }] },
      select: { id: true, username: true, role: true, mustChangePassword: true, isActive: true },
    });
    console.log("PRISMA_QUERY_OK:", JSON.stringify(user));
  } catch (e) {
    fs.writeFileSync(
      path.join(__dirname, "probe-auth.log"),
      JSON.stringify({ message: e.message || "", cause: e.cause?.message || "", full: String(e) }, null, 2)
    );
    console.error("PRISMA_QUERY_FAIL: see scripts/probe-auth.log");
  } finally {
    await prisma.$disconnect();
  }
})();
