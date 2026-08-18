// Diagnose Prisma connectivity against BOTH URLs in .env.
// Read-only: only prints connection status. NO schema/table changes.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.chdir(path.join(__dirname, ".."));

// Load .env
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1].trim()] = m[2].trim();
}

function testConnection(label, url) {
  console.log(`\n--- Testing ${label} ---`);
  console.log("URL:", url.replace(/:\/\/[^@]+@/, "://***@"));
  try {
    const out = execSync("npx prisma db execute --stdin", {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: url },
      input: "SELECT current_database(), current_user;",
    });
    console.log("RESULT:", out.trim());
    return true;
  } catch (e) {
    console.log("FAILED:", (e.stderr || e.message).split("\n").slice(0, 4).join(" | "));
    return false;
  }
}

testConnection("DATABASE_URL (db.*.supabase.co — TCP direct)", process.env.DATABASE_URL);
testConnection("DIRECT_URL (aws pooler — pgbouncer)", process.env.DIRECT_URL);
