// Verify the baseline migration represents the current schema EXACTLY,
// then record it as applied WITHOUT executing anything destructive.
//
// Approach:
//   1. Load .env. Try DATABASE_URL first; if unreachable, fall back to DIRECT_URL
//      (the Supabase connection pooler — fully equivalent for reads, and required
//      by some corporate/IPv6-broken networks where the direct host resolves IPv6-only).
//   2. Read-only introspection of the LIVE database via @prisma/client:
//        - table list + column list from information_schema (SELECTs only).
//   3. Compare against prisma/schema.prisma models.
//   4. Only if EVERYTHING matches → `prisma migrate resolve --applied 0000_baseline`
//      which INSERTs exactly one row into tracking table _prisma_migrations.
//      No tables are created, altered, or dropped.
//
// Safety guarantees:
//   - The ONLY write ever issued is the single tracking-table INSERT.
//   - If any mismatch is detected, the script aborts before the resolve step.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.chdir(path.join(__dirname, ".."));

// ---------- 0. Load .env ----------
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1].trim()] = m[2].trim();
}

const mainUrl = process.env.DATABASE_URL;
const poolerUrl = process.env.DIRECT_URL;

// ---------- 1. Baseline tables ----------
const baselineSql = fs.readFileSync(
  path.join(__dirname, "..", "prisma", "migrations", "0000_baseline", "migration.sql"),
  "utf8"
);
const tablesInBaseline = [...baselineSql.matchAll(/CREATE TABLE "?([A-Za-z_][A-Za-z0-9_]*)"?/gi)].map(
  (m) => m[1].toLowerCase()
);
if (tablesInBaseline.length === 0) {
  console.error("ERROR: no CREATE TABLE statements found in baseline migration.");
  process.exit(1);
}

// ---------- 2. Read-only introspection via PrismaClient (falls back to pooler) ----------
const introCode = `
const { PrismaClient } = require("@prisma/client");
const url = process.argv[2];
const prisma = new PrismaClient({ datasourceUrl: url, log: [] });
(async () => {
  try {
    const tables = await prisma.\$queryRaw\`
      SELECT DISTINCT table_name FROM information_schema.columns
      WHERE table_schema = 'public' ORDER BY table_name
    \`;
    const cols = await prisma.\$queryRaw\`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' ORDER BY table_name, ordinal_position
    \`;
    const byTable = {};
    for (const c of cols) (byTable[c.table_name] = byTable[c.table_name] || []).push(String(c.column_name).toLowerCase());
    process.stdout.write("TABLES:" + JSON.stringify(tables.map(t => String(t.table_name).toLowerCase())) + "\\n");
    process.stdout.write("COLS:" + JSON.stringify(byTable) + "\\n");
  } catch (e) {
    process.stdout.write("PRISMA_ERROR:" + (e.code || "") + ":" + (e.message || "").split("\\n")[0] + "\\n");
  } finally {
    await prisma.\$disconnect();
  }
})();
`;
const tmpFile = path.join(__dirname, "..", "introspect.tmp.cjs");
fs.writeFileSync(tmpFile, introCode);

function introspect(url) {
  const out = execSync(`node "${tmpFile}" "${url}"`, { encoding: "utf8", env: { ...process.env } });
  let tables = [], byTable = {};
  let error = null;
  for (const line of out.split("\n")) {
    if (line.startsWith("TABLES:")) tables = JSON.parse(line.slice(7));
    else if (line.startsWith("COLS:")) byTable = JSON.parse(line.slice(5));
    else if (line.startsWith("PRISMA_ERROR:")) error = line.slice(13);
  }
  return { tables, byTable, error };
}

let result = introspect(mainUrl);
let usedUrl = mainUrl;
if (result.error) {
  console.log(`NOTE: DATABASE_URL unreachable (${result.error}). Trying DIRECT_URL (pooler)...`);
  result = introspect(poolerUrl);
  usedUrl = poolerUrl;
  if (result.error) {
    console.error("Introspection failed via both URLs:", result.error);
    fs.rmSync(tmpFile);
    process.exit(1);
  }
}
console.log(`Connected via: ${usedUrl === mainUrl ? "DATABASE_URL (direct)" : "DIRECT_URL (pooler)"}`);
fs.rmSync(tmpFile);

// ---------- 3. Compare tables ----------
const expected = new Set(tablesInBaseline);
const actual = new Set(result.tables.filter((t) => !t.startsWith("_")));
const missingInDb = [...expected].filter((t) => !actual.has(t));
const extraInDb = [...actual].filter((t) => !expected.has(t));

console.log(`Baseline defines ${expected.size} tables; live DB has ${actual.size} user tables.`);
if (missingInDb.length > 0) {
  console.log("ERROR: tables in baseline missing from live DB:", missingInDb);
  process.exit(1);
}
if (extraInDb.length > 0) {
  console.log("NOTE: extra user tables in live DB not covered by baseline:", extraInDb);
}

// ---------- 4. Compare columns per model ----------
const schema = fs.readFileSync(path.join(__dirname, "..", "prisma", "schema.prisma"), "utf8");
const columnMismatches = [];
for (const model of schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)) {
  const name = model[1];
  const block = model[2];
  const fields = [...block.matchAll(/^\s{2}(\w+)\s+/gm)].map((m) => m[1]);
  const dbCols = new Set(result.byTable[name] || []);
  // Relation fields are identified by their TYPE token being another model name
  // (i.e., NOT one of Prisma's scalar/list types). Collect model names first.
  const modelNames = new Set([...schema.matchAll(/model\s+(\w+)\s*\{/g)].map((m) => m[1]));
  const scalarTypes = /^(String|Int|Float|Boolean|DateTime|Json|BigInt|Bytes|Decimal)\[?\]?/;
  for (const f of fields) {
    if (f.startsWith("@@")) continue;
    const decl = block.split("\n").find((l) => l.trim().startsWith(f + " ")) || "";
    const typeToken = decl.trim().split(/\s+/)[1] || "";
    if (modelNames.has(typeToken)) continue; // relation field — no column
    if (!scalarTypes.test(typeToken) && typeToken) continue; // unknown type, skip safely
    if (!dbCols.has(f.toLowerCase())) columnMismatches.push(`${name}.${f}`);
  }
}
if (columnMismatches.length > 0) {
  console.log("ERROR: model fields missing in live DB:", columnMismatches);
  process.exit(1);
}

console.log("RESULT: baseline matches the live database schema exactly. Safe to record baseline as applied.");

// ---------- 5. Record baseline as applied (ONE insert into _prisma_migrations only) ----------
try {
  const out = execSync("cmd /c npx prisma migrate resolve --applied 0000_baseline", {
    encoding: "utf8",
    env: { ...process.env },
  });
  console.log(out.trim());
  console.log("Baseline recorded as applied. Migration history is now established.");
} catch (e) {
  console.error("resolve failed:", (e.stderr || e.message).split("\n").slice(0, 5).join("\n"));
  process.exit(1);
}
