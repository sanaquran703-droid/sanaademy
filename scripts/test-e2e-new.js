/**
 * Sana Quranic Platform - E2E Verification Script
 * Tests: Teacher self-service groups, Admin bulk enrollment, and student data access.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const results = [];

function check(name, cond) {
  results.push({ name, pass: !!cond });
  console.log((cond ? "✅ PASS " : "❌ FAIL ") + name);
}

function req(urlPath, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method || "GET",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
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

async function runTests() {
  try {
    console.log("Starting E2E verification tests...\n");

    // 1. Log in as Teacher
    const teacherLogin = await req("/api/auth/login", "POST", {}, { username: "teacher_mariam", password: "Teacher@123" });
    check("Teacher login (Mariam)", teacherLogin.status === 200);
    const tSess = teacherLogin.setCookie.match(/sana_session=([^;]+)/)?.[1];
    const tHeaders = { Cookie: `sana_session=${tSess}` };

    // 2. Teacher: Create a new group
    const programsRes = await req("/api/teacher/programs", "GET", tHeaders);
    check("Teacher fetches programs", programsRes.status === 200);
    const programs = JSON.parse(programsRes.body).programs || [];
    const programId = programs[0]?.id;

    if (programId) {
      const createRes = await req("/api/teacher/groups", "POST", tHeaders, {
        name: "حلقة تجريبية ذاتية",
        programId: programId,
        maxStudents: 8,
        meetingProvider: "google_meet",
        meetLink: "https://meet.google.com/test-e2e",
        schedules: [{ dayOfWeek: 2, startTime: "10:00", durationMins: 45 }]
      });
      check("Teacher creates group self-service", createRes.status === 200);
    } else {
      check("Teacher creates group self-service (skipped - no program)", false);
    }

    // 3. Log in as Admin
    const adminLogin = await req("/api/auth/login", "POST", {}, { username: "admin", password: "GhW7gBHCpZWEiye4" });
    check("Admin login", adminLogin.status === 200);
    const aSess = adminLogin.setCookie.match(/sana_session=([^;]+)/)?.[1];
    const aHeaders = { Cookie: `sana_session=${aSess}` };

    // 4. Admin: Fetch students and groups for bulk enrollment
    const enrollDataRes = await req("/api/admin/enrollments", "GET", aHeaders);
    check("Admin fetches enrollment data", enrollDataRes.status === 200);
    const enrollData = JSON.parse(enrollDataRes.body);
    const students = enrollData.students || [];
    const groups = enrollData.groups || [];
    
    check("Found students for enrollment", students.length >= 6);
    check("Found groups for enrollment", groups.length >= 3);

    // 5. Admin: Bulk enroll students
    if (students.length >= 2 && groups.length >= 3) {
      // Successful bulk enrollment into the 3rd group
      const successEnroll = await req("/api/admin/enrollments/bulk", "POST", aHeaders, {
        groupId: groups[2].id,
        studentIds: students.slice(0, 2).map(s => s.id)
      });
      check("Admin bulk enrollment (2 students)", successEnroll.status === 200);
    } else {
      check("Admin bulk enrollment (skipped - insufficient data)", false);
    }

    // 6. Teacher: Verify student access after enrollment
    const teacherStudents = await req("/api/teacher/students", "GET", tHeaders);
    check("Teacher fetches students list", teacherStudents.status === 200);
    const tStudentsData = JSON.parse(teacherStudents.body);
    const allEnrolledCount = tStudentsData.groups ? tStudentsData.groups.reduce((acc, g) => acc + (g.students ? g.students.length : 0), 0) : 0;
    check("Teacher sees enrolled students", allEnrolledCount >= 2);

    // 7. Student: Check schedule and plan
    const studentLogin = await req("/api/auth/login", "POST", {}, { username: "student_test_1", password: "Student@123" });
    check("Student login (Student 1)", studentLogin.status === 200);
    const sSess = studentLogin.setCookie.match(/sana_session=([^;]+)/)?.[1];
    const sHeaders = { Cookie: `sana_session=${sSess}` };

    const studentSchedule = await req("/api/student/schedule", "GET", sHeaders);
    check("Student fetches schedule", studentSchedule.status === 200);

    const studentPlan = await req("/api/student/plan", "GET", sHeaders);
    check("Student fetches plan", studentPlan.status === 200);

    console.log("\n--- E2E SUMMARY ---");
    const passed = results.filter(r => r.pass).length;
    console.log(`${passed}/${results.length} PASSED`);
    
    if (passed < results.length) {
      process.exit(2);
    }
    process.exit(0);

  } catch (error) {
    console.error("TEST_ERROR:", error);
    process.exit(1);
  }
}

runTests();
