
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRaw`
    SELECT table_name, column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;
  const byTable = {};
  for (const r of rows) {
    (byTable[r.table_name] = byTable[r.table_name] || []).push(r.column_name);
  }
  process.stdout.write(JSON.stringify(Object.keys(byTable).sort()));
  process.stdout.write("\n---COLUMNS---\n");
  process.stdout.write(JSON.stringify(byTable));
  await prisma.$disconnect();
})();
