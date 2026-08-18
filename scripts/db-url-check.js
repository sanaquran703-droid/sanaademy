require("./load-env");
console.log("POOLER:", process.env.DATABASE_URL_USE_POOLER);
console.log("DATABASE_URL host:", (process.env.DATABASE_URL || "").split("@")[1] || "missing");
console.log("DIRECT_URL host:", (process.env.DIRECT_URL || "").split("@")[1] || "missing");
const url = process.env.DATABASE_URL_USE_POOLER ? process.env.DIRECT_URL : process.env.DATABASE_URL;
console.log("resolved host:", (url || "").split("@")[1] || "missing");
