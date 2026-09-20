var http = require("http");
function probe() {
  return new Promise(function (resolve) {
    var r = http.request({ hostname: "localhost", port: 3000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" } }, function (res) {
      resolve(res.statusCode);
    });
    r.on("error", function () { resolve("ERR"); });
    r.setTimeout(8000, function () { r.destroy(); resolve("TIMEOUT"); });
    r.write("{}");
    r.end();
  });
}
(async function () {
  var s = await probe();
  console.log("dev server /api/auth/login:", s);
  process.exit(0);
})();
