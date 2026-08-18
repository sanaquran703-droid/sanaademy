// Generate a baseline migration from the current Prisma schema (from empty DB perspective).
// This migration.sql is recorded as "applied" without touching the real database.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Run from anywhere: node scripts/make-baseline.js
process.chdir(path.join(__dirname, ".."));

const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { encoding: "utf8" }
);

const dir = path.join(__dirname, "..", "prisma", "migrations", "0000_baseline");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "migration.sql"), sql);
console.log(`Baseline migration written (${sql.length} bytes) to ${dir}`);
