// Security tests for the Teacher Portal (read-only API checks against the dev server).
// 1. Login as teacher -> 200 + session cookie.
// 2. GET /api/teacher/lessons/today        -> 200 (own data)
// 3. GET /api/teacher/students             -> 200 (own students grouped)
// 4. GET /api/teacher/students/<OWN>       -> 200 (owned student)
// 5. GET /api/teacher/students/<OTHER>     -> 403 (not owned — main ownership test)
// 6. GET /api/teacher/groups               -> 200 (own groups)
// 7. Logged-in admin accessing teacher API -> 403 (role check)
// 8. Anonymous access                      -> 401/302
// Outputs a summary of PASS/FAIL per test. No data is written.
const fs = require("fs");
const path = require("path");
const http = require("http");

process.chdir(path.join(__dirname, ".."));

const BASE = "http://localhost:3000";
const results = [];

function req(urlPath, method, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method || "GET",
      headers: headers || {},
    };
    const r = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        const setCookie = (res.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");
        resolve({ status: res.statusCode, body: data, setCookie });
      });
    });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  try {
    const creds = JSON.parse(fs.readFileSync(path.join(__dirname, "teacher-test-creds.json"), "utf8"));
    const adminCreds = { username: "admin", password: "GhW7gBHCpZWEiye4" };

    function check(name, cond) {
      results.push({ name, pass: !!cond });
      console.log((cond ? "PASS " : "FAIL ") + name);
    }

    // Test 1: teacher login
    const login = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, creds);
    check("teacher login -> 200", login.status === 200);
    const sessTeacher = login.setCookie.includes("sana_session")
      ? login.setCookie.match(/sana_session=([^;]+)/)?.[1]
      : null;
    check("teacher session cookie present", !!sessTeacher);

    // Test 8 first (anonymous)
    const anon = await req("/api/teacher/students");
    check("anonymous GET /api/teacher/students -> redirected (no data leak)", anon.status === 302 || anon.status === 307 || anon.status === 401);

    const tHeaders = { Cookie: "sana_session=" + sessTeacher };

    // Test 2: today's lessons
    const today = await req("/api/teacher/lessons/today", "GET", tHeaders);
    check("GET /api/teacher/lessons/today -> 200", today.status === 200);
    let todayData = null;
    try { todayData = JSON.parse(today.body); } catch (e) {}
    check("today rows is array", Array.isArray(todayData?.rows));

    // Test 3: students list
    const students = await req("/api/teacher/students", "GET", tHeaders);
    check("GET /api/teacher/students -> 200", students.status === 200);
    let studentsData = null;
    try { studentsData = JSON.parse(students.body); } catch (e) {}
    check("students grouped list returned", Array.isArray(studentsData?.groups));
    const ownStudentId =
      studentsData?.groups?.flatMap((g) => g.students)?.[0]?.id || null;
    console.log("OWN STUDENT ID:", ownStudentId);

    // Test 6: groups
    const groups = await req("/api/teacher/groups", "GET", tHeaders);
    check("GET /api/teacher/groups -> 200", groups.status === 200);
    let groupsData = null;
    try { groupsData = JSON.parse(groups.body); } catch (e) {}
    check("groups list returned", Array.isArray(groupsData?.groups));
    const groupId = groupsData?.groups?.[0]?.id || null;
    console.log("GROUP ID:", groupId);

    // Test 4: own student profile
    if (ownStudentId) {
      const profile = await req(`/api/teacher/students/${ownStudentId}`, "GET", tHeaders);
      check("GET /api/teacher/students/<OWN> -> 200", profile.status === 200);
      let profileData = null;
      try { profileData = JSON.parse(profile.body); } catch (e) {}
      check("own profile has plan/lessons", !!(profileData?.student?.lessons));
    }

    // Test 5: non-owned student -> 403 (use a random UUID as "other student")
    const otherStudentId = "00000000-0000-0000-0000-" + Math.random().toString(16).slice(2, 14).padStart(12, "0");
    const other = await req(`/api/teacher/students/${otherStudentId}`, "GET", tHeaders);
    check("GET /api/teacher/students/<NOT-OWNED> -> 403", other.status === 403);

    // Test 7: admin token accessing teacher API
    const adminLogin = await req("/api/auth/login", "POST", { "Content-Type": "application/json" }, adminCreds);
    const sessAdmin = adminLogin.setCookie.includes("sana_session")
      ? adminLogin.setCookie.match(/sana_session=([^;]+)/)?.[1]
      : null;
    if (sessAdmin) {
      const adminProbe = await req("/api/teacher/students", "GET", { Cookie: "sana_session=" + sessAdmin });
      check("admin accessing teacher API -> 403", adminProbe.status === 403);
      const adminGroups = await req("/api/teacher/groups", "GET", { Cookie: "sana_session=" + sessAdmin });
      check("admin accessing teacher groups -> 403", adminGroups.status === 403);
    } else {
      check("admin login for role test", false);
    }

    // Optional: POST lesson upsert smoke test (read-only safe: creates a lesson, but that is real test data)
    // Skipped to keep tests read-only; transaction behavior was code-reviewed.

    const fails = results.filter((r) => !r.pass).length;
    console.log(`\nSUMMARY: ${results.filter((r) => r.pass).length}/${results.length} PASSED${fails ? " — FIX FAILURES" : " — ALL PASS"}`);
    process.exit(fails ? 2 : 0);
  } catch (e) {
    console.error("SETUP_FAIL:", e);
    process.exit(1);
  }
})();
