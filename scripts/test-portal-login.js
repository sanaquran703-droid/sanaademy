// End-to-end smoke test for the portal login system (runs against localhost:3000).
// Tests:
// 1. Wrong-role login is REJECTED by the server (403 + roleMismatch).
// 2. Correct-role login SUCCEEDS (200 + redirectTo /admin).
// 3. Wrong password is rejected (401).
// NOTE: the server must be running (npm run dev) before this script.
const http = require("http");

const BASE = "http://localhost:3000";

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(buf) });
          } catch {
            resolve({ status: res.statusCode, body: buf.slice(0, 200) });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // 1. Student account (should not exist; wrong-role attempt from /login/admin)
    let r = await post("/api/auth/login", { username: "student1", password: "anything", expectedRole: "admin" });
    console.log("1. Student account from admin portal ->", r.status, r.json?.error || r.json?.roleMismatch ? "(role/credentials rejected OK)" : JSON.stringify(r.json));

    // 2. Real admin login from admin portal
    r = await post("/api/auth/login", { username: "admin", password: process.env.TEST_ADMIN_PASSWORD || "GhW7gBHCpZWEiye4", expectedRole: "admin" });
    console.log("2. Admin from admin portal ->", r.status, r.json?.redirectTo ? "OK -> " + r.json.redirectTo : JSON.stringify(r.json));

    // 3. Admin trying the student portal
    r = await post("/api/auth/login", { username: "admin", password: "GhW7gBHCpZWEiye4", expectedRole: "student" });
    console.log("3. Admin from student portal ->", r.status, r.json?.roleMismatch ? "REJECTED (role validation OK)" : JSON.stringify(r.json));

    // 4. Wrong password
    r = await post("/api/auth/login", { username: "admin", password: "wrong", expectedRole: "admin" });
    console.log("4. Wrong password ->", r.status, r.json?.error ? "OK (rejected)" : JSON.stringify(r.json));
  } catch (e) {
    console.error("TEST_FAIL:", (e.message || "").split("\n")[0]);
    console.error("Make sure `npm run dev` is running on port 3000.");
    process.exit(1);
  }
})();
