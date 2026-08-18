// One-shot request that will surface the server error stack in dev logs.
const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL("http://localhost:3000" + path);
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => resolve({ status: res.statusCode, body: buf }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

post("/api/auth/login", { username: "admin", password: "GhW7gBHCpZWEiye4", expectedRole: "admin" }).then((r) => {
  console.log("status:", r.status);
  console.log("body:", r.body);
});
