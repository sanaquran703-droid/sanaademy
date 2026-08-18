// Minimal probe v2: login, GET payments, POST proof as buffer; print full error bodies.
var fs = require("fs");
var path = require("path");
var http = require("http");

process.chdir(path.join(__dirname, ".."));
var BASE = "http://localhost:3000";

function req(urlPath, method, headers, body) {
  return new Promise(function (resolve, reject) {
    var url = new URL(urlPath, BASE);
    var h = Object.assign({}, headers || {});
    if (body && typeof body !== "string" && !Buffer.isBuffer(body)) body = JSON.stringify(body);
    if (body && !h["Content-Type"]) h["Content-Type"] = "application/json";
    if (body) h["Content-Length"] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    var r = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: method || "GET", headers: h },
      function (res) {
        var data = "";
        res.on("data", function (c) { data += c; });
        res.on("end", function () {
          var setCookie = (res.headers["set-cookie"] || []).map(function (c) { return c.split(";")[0]; }).join("; ");
          resolve({ status: res.statusCode, body: data.slice(0, 800), setCookie: setCookie, headers: res.headers });
        });
      },
    );
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

(async function () {
  try {
    var creds = JSON.parse(fs.readFileSync(path.join(__dirname, "student-test-creds.json"), "utf8"));
    var login = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, creds);
    console.log("login:", login.status, login.body.slice(0, 200));
    var sess = login.setCookie.includes("sana_session") ? login.setCookie.match(/sana_session=([^;]+)/)[1] : null;
    if (!sess) { console.error("NO SESSION; set-cookie:", JSON.stringify(login.headers["set-cookie"])); process.exit(1); }
    var sh = { Cookie: "sana_session=" + sess };

    var get = await req("/api/student/payments", "GET", sh);
    console.log("GET payments:", get.status, get.body);

    var jpg = fs.readFileSync(path.join(__dirname, "tiny.jpg"));
    var boundary = "----B1234";
    var month = "2026-08";
    var head = Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"proof\"; filename=\"p.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n", "binary");
    var foot = Buffer.from("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"monthCovered\"\r\n\r\n" + month + "\r\n--" + boundary + "--\r\n", "binary");
    var buf = Buffer.concat([head, jpg, foot]);
    console.log("buf length:", buf.length);
    var up = await req("/api/student/payments", "POST", { "Content-Type": "multipart/form-data; boundary=" + boundary, Cookie: "sana_session=" + sess }, buf);
    console.log("POST valid:", up.status, up.body);

    var dup = await req("/api/student/payments", "POST", { "Content-Type": "multipart/form-data; boundary=" + boundary, Cookie: "sana_session=" + sess }, buf);
    console.log("POST dup:", dup.status, dup.body);
  } catch (e) {
    console.error("ERR:", e && e.stack ? e.stack.split("\n").slice(0, 6).join(" | ") : e);
  } finally {
    process.exit(0);
  }
})();
