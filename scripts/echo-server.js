// Echo server: logs received headers + raw body, then sends it back to the client's callback URL not needed.
var http = require("http");
var port = 3456;
http.createServer(function (req, res) {
  var body = [];
  req.on("data", function (c) { body.push(c); });
  req.on("end", function () {
    var buf = Buffer.concat(body);
    console.log("=== REQUEST " + req.method + " " + req.url);
    console.log("HEADERS:", JSON.stringify(req.headers, null, 0).slice(0, 900));
    console.log("BODY LENGTH:", buf.length);
    // print first 120 bytes hex of body
    console.log("BODY HEAD HEX:", buf.subarray(0, 120).toString("hex"));
    console.log("BODY TAIL HEX:", buf.subarray(-40).toString("hex"));
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("echo " + buf.length + "\n");
  });
}).listen(port, function () { console.log("echo listening on", port); });
