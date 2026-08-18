require("./load-env");
console.log("POOLER env:", JSON.stringify(process.env.DATABASE_URL_USE_POOLER));
console.log("BUCKET env:", JSON.stringify(process.env.SUPABASE_STORAGE_BUCKET));
console.log("URL env:", JSON.stringify((process.env.DATABASE_URL || "").substring(0, 40)));
console.log("DIRECT env:", JSON.stringify((process.env.DIRECT_URL || "").substring(0, 40)));
const { PrismaClient } = require("@prisma/client");
const url = process.env.DATABASE_URL_USE_POOLER ? process.env.DIRECT_URL : process.env.DATABASE_URL;
const p = new PrismaClient({ datasourceUrl: url, log: [] });
p.student.count().then((n) => { console.log("STUDENT COUNT:", n); process.exit(0); }).catch((e) => { console.error("COUNT_FAIL:", e.message); process.exit(1); });
