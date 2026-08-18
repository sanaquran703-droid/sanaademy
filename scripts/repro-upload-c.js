// Repro C: test-script body structure but WITHOUT \r\n before the closing boundary (probe style).
var fs = require("fs");
var path = require("path");
var http = require("http");

process.chdir(path.join(__dirname, ".."));
var BASE = "http://localhost:3000";

function req(urlPath, method, headers, body) {
  return new Promise(function (resolve, reject) {
    var url = new URL(urlPath, BASE);
    var isBuf = Buffer.isBuffer(body);
    var h = Object.assign({}, headers || {});
    if (!isBuf && body && typeof body !== "string") body = JSON.stringify(body);
    if (body && !h["Content-Type"]) h["Content-Type"] = "application/json";
    if (body) h["Content-Length"] = Buffer.byteLength(body);
    var r = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: method || "GET", headers: h },
      function (res) {
        var data = "";
        res.on("data", function (c) { data += c; });
        res.on("end", function () {
          var setCookie = (res.headers["set-cookie"] || []).map(function (c) { return c.split(";")[0]; }).join("; ");
          resolve({ status: res.statusCode, body: data.slice(0, 600), setCookie: setCookie });
        });
      },
    );
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

(async function () {
  var creds = JSON.parse(fs.readFileSync(path.join(__dirname, "student-test-creds.json"), "utf8"));
  var login = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, creds);
  var sess = login.setCookie.includes("sana_session") ? login.setCookie.match(/sana_session=([^;]+)/)[1] : null;
  if (!sess) { console.error("no session"); process.exit(1); }

  var jpg = fs.readFileSync(path.join(__dirname, "tiny.jpg"));
  var boundary = "----SanaBoundary" + Date.now();
  var month = new Date().toISOString().slice(0, 7);
  // Probe-style: NO \r\n before closing boundary
  var buf = Buffer.concat([
    Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"proof\"; filename=\"proof.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n", "binary"),
    jpg,
    Buffer.from("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"monthCovered\"\r\n\r\n" + month + "\r\n--" + boundary + "--\r\n", "binary"),
  ]);
  console.log("Content-Length:", buf.length, "| month:", month);
  var up = await req("/api/student/payments", "POST", { "Content-Type": "multipart/form-data; boundary=" + boundary, Cookie: "sana_session=" + sess }, buf);
  console.log("status:", up.status, "| body:", up.body.slice(0, 300));
  process.exit(0);
})();
