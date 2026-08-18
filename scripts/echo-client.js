// Sends the SAME two multipart bodies (probe-style + test-script-style) to the echo server
// so we can diff exactly what the dev server sees vs what Next.js parses.
var fs = require("fs");
var path = require("path");
var http = require("http");

process.chdir(path.join(__dirname, ".."));
var BASE = "http://localhost:3456";
var jpg = fs.readFileSync(path.join(__dirname, "tiny.jpg"));
var month = "2026-08";

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
        res.on("end", function () { resolve({ status: res.statusCode, body: data }); });
      },
    );
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

(async function () {
  // probe style
  var b1 = "----B1234";
  var head1 = Buffer.from("--" + b1 + "\r\nContent-Disposition: form-data; name=\"proof\"; filename=\"p.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n", "binary");
  var foot1 = Buffer.from("\r\n--" + b1 + "\r\nContent-Disposition: form-data; name=\"monthCovered\"\r\n\r\n" + month + "\r\n--" + b1 + "--\r\n", "binary");
  var probeBuf = Buffer.concat([head1, jpg, foot1]);
  var r1 = await req("/a", "POST", { "Content-Type": "multipart/form-data; boundary=" + b1, Cookie: "sana_session=abc" }, probeBuf);
  console.log("PROBE echo:", r1.status, r1.body);

  // test-script style
  var b2 = "----SanaBoundary9999";
  var parts = [
    "--" + b2 + "\r\nContent-Disposition: form-data; name=\"proof\"; filename=\"proof.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n",
    Buffer.from(jpg, "binary"),
    "\r\n--" + b2 + "\r\nContent-Disposition: form-data; name=\"monthCovered\"\r\n\r\n" + month + "\r\n",
    "\r\n--" + b2 + "\r\nContent-Disposition: form-data; name=\"amount\"\r\n\r\n500\r\n",
    "\r\n--" + b2 + "--\r\n",
  ];
  var testBuf = Buffer.concat(parts.map(function (p) { return typeof p === "string" ? Buffer.from(p, "binary") : p; }));
  var r2 = await req("/b", "POST", { "Content-Type": "multipart/form-data; boundary=" + b2, Cookie: "sana_session=abc" }, testBuf);
  console.log("TEST echo:", r2.status, r2.body);

  process.exit(0);
})();
