// Diagnostic: test Supabase Storage directly (same service role client as src/lib/supabase.ts).
var fs = require("fs");
var path = require("path");

process.chdir(path.join(__dirname, ".."));
var envPath = path.join(__dirname, "..", ".env");
fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach(function (line) {
  var t = line.trim();
  if (!t || t.startsWith("#")) return;
  var idx = t.indexOf("=");
  if (idx === -1) return;
  var key = t.slice(0, idx).trim();
  var val = t.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

var { createClient } = require("@supabase/supabase-js");

var url = process.env.NEXT_PUBLIC_SUPABASE_URL;
var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
var bucket = process.env.SUPABASE_STORAGE_BUCKET || "sana-uploads";

console.log("URL set:", !!url, "| Key prefix:", key ? key.slice(0, 12) + "..." : "MISSING", "| Bucket:", bucket);

var admin = createClient(url, key);

(async function () {
  try {
    var listBuckets = await admin.storage.listBuckets();
    console.log("listBuckets error:", listBuckets.error ? listBuckets.error.message : "none");
    var names = (listBuckets.data || []).map(function (b) { return b.name; });
    console.log("buckets:", JSON.stringify(names));
    if (!names.includes(bucket)) {
      console.log("BUCKET MISSING - attempting to create private bucket '" + bucket + "'");
      var create = await admin.storage.createBucket(bucket, { public: false });
      console.log("createBucket:", create.error ? create.error.message : "OK");
      listBuckets = await admin.storage.listBuckets();
      console.log("buckets after:", JSON.stringify((listBuckets.data || []).map(function (b) { return b.name; })));
    }
    // Test upload + signed URL (same flow as uploadToBucket)
    var jpg = fs.readFileSync(path.join(__dirname, "tiny.jpg"));
    var p = "storage-tests/" + Date.now() + "-probe.jpg";
    var up = await admin.storage.from(bucket).upload(p, jpg, { contentType: "image/jpeg", upsert: false });
    console.log("upload:", up.error ? up.error.message + " (" + (up.error && up.error.statusCode) + ")" : "OK path=" + up.data.path);
    if (!up.error) {
      var signed = await admin.storage.from(bucket).createSignedUrl(up.data.path, 3600);
      console.log("signed:", signed.error ? signed.error.message : "signedUrl=" + signed.data.signedUrl.slice(0, 60) + "...");
      // cleanup
      var rm = await admin.storage.from(bucket).remove([up.data.path]);
      console.log("cleanup:", rm.error ? rm.error.message : "OK");
    }
  } catch (e) {
    console.error("ERR:", e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : e);
  } finally {
    process.exit(0);
  }
})();
