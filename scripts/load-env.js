// Manual .env loader (project has no dotenv). Skips comments/blank lines and inline `#` comments after quoted values handling.
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  let val = t.slice(idx + 1).trim();
  // Strip inline comments that follow the value (outside quotes).
  const quote = val[0];
  if (quote === '"' || quote === "'") {
    const close = val.lastIndexOf(quote);
    if (close > 0) val = val.slice(0, close + 1);
  } else {
    const ci = val.search(/\s+#/);
    if (ci !== -1) val = val.slice(0, ci);
  }
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}
