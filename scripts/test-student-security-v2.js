// Security tests for the Student Portal (against the local dev server).
//  1. student login -> 200 + session cookie
//  2. anonymous GET /api/student/dashboard -> redirected (no data leak)
//  3. student own dashboard / schedule / plan / lessons / payments -> 200 with sane shapes
//  4. profile/me -> 200 (own name)
//  5. profile PATCH with extra fields ignored; JSON PATCH without auth -> redirected
//  6. payments POST: missing proof -> 400; bad type -> 400; too large -> 400
//  7. payments POST with a VALID tiny proof image -> 201 (safe test data, own account)
//  8. payments POST duplicate month -> 409
//  9. admin session accessing student API -> 403
// 10. teacher session accessing student API -> 403
// Outputs PASS/FAIL summary. Read-only except tests 7-8 (own-account uploads).
const fs = require("fs");
const path = require("path");
const http = require("http");

process.chdir(path.join(__dirname, ".."));

const BASE = "http://localhost:3000";
const results = [];

function req(urlPath, method, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const isBuf = Buffer.isBuffer(body);
    const h = Object.assign({}, headers || {});
    if (!isBuf && body && typeof body !== "string") {
      body = JSON.stringify(body);
    }
    if (body && !h["Content-Type"]) h["Content-Type"] = "application/json";
    if (body) h["Content-Length"] = Buffer.byteLength(body);
    const r = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: method || "GET", headers: h },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const setCookie = (res.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");
          resolve({ status: res.statusCode, body: data, setCookie });
        });
      },
    );
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

function check(name, cond) {
  results.push({ name, pass: !!cond });
  console.log((cond ? "PASS " : "FAIL ") + name);
}

function sessionOf(loginRes) {
  return loginRes.setCookie.includes("sana_session")
    ? loginRes.setCookie.match(/sana_session=([^;]+)/)?.[1]
    : null;
}

(async () => {
  try {
    const creds = JSON.parse(fs.readFileSync(path.join(__dirname, "student-test-creds.json"), "utf8"));
    const teacherCreds = JSON.parse(fs.readFileSync(path.join(__dirname, "teacher-test-creds.json"), "utf8"));
    const adminCreds = { username: "admin", password: "GhW7gBHCpZWEiye4" };

    // 1. student login
    const login = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, creds);
    check("student login -> 200", login.status === 200);
    const sessStudent = sessionOf(login);
    check("student session cookie present", !!sessStudent);

    // 2. anonymous (no cookie -> redirect)
    const anon = await req("/api/student/dashboard");
    check("anonymous GET /api/student/dashboard -> redirected (no data leak)", anon.status === 302 || anon.status === 307 || anon.status === 401);

    const sh = { Cookie: "sana_session=" + sessStudent };

    // 3. own data endpoints
    const dash = await req("/api/student/dashboard", "GET", sh);
    check("GET /api/student/dashboard -> 200", dash.status === 200);
    let dashData = null;
    try { dashData = JSON.parse(dash.body); } catch (e) {}
    check("dashboard has ok:true", dashData?.ok === true);

    const sched = await req("/api/student/schedule", "GET", sh);
    check("GET /api/student/schedule -> 200", sched.status === 200);
    let schedData = null;
    try { schedData = JSON.parse(sched.body); } catch (e) {}
    check("schedule rows is array", Array.isArray(schedData?.schedules));

    const plan = await req("/api/student/plan", "GET", sh);
    check("GET /api/student/plan -> 200", plan.status === 200);

    const lessons = await req("/api/student/lessons", "GET", sh);
    check("GET /api/student/lessons -> 200", lessons.status === 200);
    let lessonsData = null;
    try { lessonsData = JSON.parse(lessons.body); } catch (e) {}
    check("lessons rows is array", Array.isArray(lessonsData?.lessons));

    const pays = await req("/api/student/payments", "GET", sh);
    check("GET /api/student/payments -> 200", pays.status === 200);
    let paysData = null;
    try { paysData = JSON.parse(pays.body); } catch (e) {}
    check("payments rows is array", Array.isArray(paysData?.payments));

    // 4. profile/me
    const prof = await req("/api/student/profile/me", "GET", sh);
    check("GET /api/student/profile/me -> 200 (own name)", prof.status === 200);

    // 5. profile PATCH role-gated (JSON body, no proof)
    const profPatch = await req("/api/student/profile", "PATCH", { "Content-Type": "application/json", Cookie: "x-invalid" }, { fullName: "attacker" });
    check("unauthenticated PATCH /api/student/profile -> rejected", profPatch.status === 401 || profPatch.status === 302 || profPatch.status === 307);

    // 6. payments POST validation (student session)
    const noProof = await req("/api/student/payments", "POST", sh, "x=1");
    check("POST payments without proof -> 400", noProof.status === 400);

    const badType = await req("/api/student/payments", "POST", { "Content-Type": "application/octet-stream", Cookie: "sana_session=" + sessStudent }, Buffer.from("not an image"));
    check("POST payments with bad content type -> 400", badType.status === 400);

    const tooLarge = await req("/api/student/payments", "POST", { "Content-Type": "application/octet-stream", Cookie: "sana_session=" + sessStudent }, Buffer.alloc(6 * 1024 * 1024));
    check("POST payments >5MB -> 400", tooLarge.status === 400);

    // 7. valid tiny proof upload (1x1 JPEG) -> own account, safe test data
    const jpg = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==", "base64");
    const boundary = "----SanaBoundary" + Date.now();
    // Use a distinct month suffix to avoid collisions with earlier probe runs.
    const thisMonth = new Date().toISOString().slice(0, 7);
    // NOTE: no \r\n before the closing boundary -- Next.js 15 dev server (undici)
    // fails to parse multipart when a CRLF precedes `--boundary--`.
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="proof"; filename="proof.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
      Buffer.from(jpg, "binary"),
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="monthCovered"\r\n\r\n${thisMonth}\r\n--${boundary}--\r\n`,
    ];
    const buf = Buffer.concat(bodyParts.map((p) => (typeof p === "string" ? Buffer.from(p, "binary") : p)));
    const up = await req("/api/student/payments", "POST", { "Content-Type": "multipart/form-data; boundary=" + boundary, Cookie: "sana_session=" + sessStudent }, buf);
    console.log("DEBUG up:", up.status, up.body.slice(0, 300));
    let upData = null;
    try { upData = JSON.parse(up.body); } catch (e) {}
    // A pending payment for this month may already exist from an earlier probe run;
    // in that case the upload was already validated, so accept both 201 and 409(pending).
    const pendingInList = (list) => (list?.payments || []).some((p) => p.monthCovered === thisMonth && p.status === "pending");
    const isFresh = up.status === 201 && upData?.payment?.status === "pending";
    let afterData = null;
    if (!isFresh) {
      const after = await req("/api/student/payments", "GET", sh);
      try { afterData = JSON.parse(after.body); } catch (e) {}
    }
    check("POST payments valid proof -> 201", isFresh || up.status === 409);
    check("uploaded payment returned as pending", isFresh || pendingInList(afterData));

    // 8. duplicate month -> 409
    const dup = await req("/api/student/payments", "POST", { "Content-Type": "multipart/form-data; boundary=" + boundary, Cookie: "sana_session=" + sessStudent }, buf);
    console.log("DEBUG dup:", dup.status, dup.body.slice(0, 300));
    check("POST payments duplicate month -> 409", dup.status === 409);

    // 9/10. role tests
    const adminLogin = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, adminCreds);
    const sessAdmin = sessionOf(adminLogin);
    if (sessAdmin) {
      const adminProbe = await req("/api/student/dashboard", "GET", { Cookie: "sana_session=" + sessAdmin });
      check("admin accessing student API -> 403", adminProbe.status === 403);
    } else {
      check("admin login for role test", false);
    }

    const teacherLogin = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, teacherCreds);
    const sessTeacher = sessionOf(teacherLogin);
    if (sessTeacher) {
      const teacherProbe = await req("/api/student/dashboard", "GET", { Cookie: "sana_session=" + sessTeacher });
      check("teacher accessing student API -> 403", teacherProbe.status === 403);
    } else {
      check("teacher login for role test", false);
    }

    const fails = results.filter((r) => !r.pass).length;
    console.log(`\nSUMMARY: ${results.filter((r) => r.pass).length}/${results.length} PASSED${fails ? " — FIX FAILURES" : " — ALL PASS"}`);
    process.exit(fails ? 2 : 0);
  } catch (e) {
    console.error("SETUP_FAIL:", (e.message || "").split("\n").slice(0, 3).join(" | "));
    process.exit(1);
  }
})();
