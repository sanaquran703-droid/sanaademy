/**
 * Sana Quranic Platform - 14-Step QA Scenario Script (Final Final Final Fix)
 */
const http = require("http");
const BASE = "http://localhost:3000";

const results = [];
function logStep(num, name, pass, detail = "") {
  results.push({ step: num, name, pass });
  console.log(`${pass ? "✅" : "❌"} Step ${num}: ${name} ${detail ? "(" + detail + ")" : ""}`);
}

function req(urlPath, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method || "GET",
      headers: { ...headers, "Content-Type": "application/json" },
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

async function runQA() {
  console.log("Starting 14-Step QA Scenario...\n");
  let adminHeaders, teacherHeaders, studentAHeaders;
  let studentAId, studentBId, groupId, enrollmentBId;

  try {
    const year = "2025-2026";

    // 1. Admin login
    const adminLogin = await req("/api/auth/login", "POST", {}, { username: "admin", password: "GhW7gBHCpZWEiye4" });
    const aSess = adminLogin.setCookie.match(/sana_session=([^;]+)/)?.[1];
    adminHeaders = { Cookie: `sana_session=${aSess}` };
    logStep(1, "Admin login", adminLogin.status === 200);

    // 2. Admin adds two new students
    const suffix = Date.now().toString().slice(-4);
    const studentA = await req("/api/admin/students", "POST", adminHeaders, {
      fullName: "test-student-A",
      username: `student_qa_a_${suffix}`,
      password: "Student@123",
      gender: "female",
      academicYear: year
    });
    const studentB = await req("/api/admin/students", "POST", adminHeaders, {
      fullName: "test-student-B",
      username: `student_qa_b_${suffix}`,
      password: "Student@123",
      gender: "female",
      academicYear: year
    });
    
    studentAId = JSON.parse(studentA.body).id;
    studentBId = JSON.parse(studentB.body).id;
    logStep(2, "Admin adds test-student-A & B", !!studentAId && !!studentBId);

    // 3. Teacher logs in
    const teacherLogin = await req("/api/auth/login", "POST", {}, { username: "teacher_mariam", password: "Teacher@123" });
    const tSess = teacherLogin.setCookie.match(/sana_session=([^;]+)/)?.[1];
    teacherHeaders = { Cookie: `sana_session=${tSess}` };
    logStep(3, "Teacher exists and logs in", teacherLogin.status === 200);

    // 4. Teacher creates group
    const programsRes = await req("/api/teacher/programs", "GET", teacherHeaders);
    const programs = JSON.parse(programsRes.body).programs || [];
    const programId = programs[0]?.id;
    const createGroup = await req("/api/teacher/groups", "POST", teacherHeaders, {
      name: `حلقة الاختبار ${suffix}`,
      programId: programId,
      maxStudents: 10,
      meetingProvider: "google_meet",
      meetLink: "https://meet.google.com/qa-test",
      schedules: [{ dayOfWeek: 1, startTime: "18:00", durationMins: 60 }]
    });
    groupId = JSON.parse(createGroup.body).group?.id;
    logStep(4, "Teacher creates 'حلقة الاختبار'", !!groupId);

    // 5. Admin distributes students
    const bulkAssign = await req("/api/admin/enrollments/bulk", "POST", adminHeaders, {
      groupId: groupId,
      studentIds: [studentAId, studentBId]
    });
    logStep(5, "Admin distributes A & B to group", bulkAssign.status === 200);

    // 6. Teacher sees students
    const tStudents = await req("/api/teacher/students", "GET", teacherHeaders);
    const tData = JSON.parse(tStudents.body);
    const group = tData.groups?.find(g => g.groupId === groupId);
    const tStudentsList = group?.students || [];
    const hasBoth = tStudentsList.some(s => s.id === studentAId) && tStudentsList.some(s => s.id === studentBId);
    logStep(6, "Teacher sees A & B only", hasBoth && tStudentsList.length === 2);

    // 7. Teacher sets plan for student A
    const setPlan = await req(`/api/teacher/plans/${studentAId}`, "PATCH", teacherHeaders, {
      currentSurah: "البقرة",
      currentAyahFrom: 1,
      currentAyahTo: 5,
      reviewSurah: "الفاتحة",
      reviewAyahFrom: 1,
      reviewAyahTo: 7,
      progressPct: 5,
      notes: "بداية موفقة"
    });
    console.log(`DEBUG Step 7: Status ${setPlan.status}, Body: ${setPlan.body}`);
    logStep(7, "Teacher sets plan for A", setPlan.status === 200);

    // 8. Student A logs in
    const studentALogin = await req("/api/auth/login", "POST", {}, { username: `student_qa_a_${suffix}`, password: "Student@123" });
    let sASess = studentALogin.setCookie.match(/sana_session=([^;]+)/)?.[1];
    let sAHeaders = { Cookie: `sana_session=${sASess}` };
    
    // Bypass mustChangePassword
    await req("/api/auth/change-password", "POST", sAHeaders, {
      currentPassword: "Student@123",
      newPassword: "Student@Updated123"
    });
    
    const studentALogin2 = await req("/api/auth/login", "POST", {}, { username: `student_qa_a_${suffix}`, password: "Student@Updated123" });
    sASess = studentALogin2.setCookie.match(/sana_session=([^;]+)/)?.[1];
    studentAHeaders = { Cookie: `sana_session=${sASess}` };

    const aPlan = await req("/api/student/plan", "GET", studentAHeaders);
    const planRes = JSON.parse(aPlan.body);
    const planData = planRes.plan;
    logStep(8, "Student A sees correct plan", planData?.currentSurah === "البقرة");

    // 9. Student A sees group info
    const aDash = await req("/api/student/dashboard", "GET", studentAHeaders);
    const dashData = JSON.parse(aDash.body);
    const groupNameMatch = dashData.todayLesson?.groupName?.includes("حلقة الاختبار");
    logStep(9, "Student A sees group name & meet link", groupNameMatch && !!dashData.todayLesson?.meetLink);

    // 10. Teacher records lesson for A
    const recordLesson = await req("/api/teacher/lessons", "POST", teacherHeaders, {
      groupId: groupId,
      studentId: studentAId,
      scheduledAt: new Date().toISOString(),
      attendanceStatus: "present",
      newPortion: "البقرة 1-5",
      evaluation: { memorization: "excellent", review: "excellent", tajweed: "excellent", commitment: "excellent" }
    });
    logStep(10, "Teacher records lesson for A", recordLesson.status === 200);

    // 11. Student A sees lesson in history
    const aLessons = await req("/api/student/lessons", "GET", studentAHeaders);
    const hasLesson = JSON.parse(aLessons.body).lessons?.some(l => l.newPortion === "البقرة 1-5");
    logStep(11, "Student A sees lesson in history", hasLesson);

    // 12. Admin removes student B
    const groupDetails = await req(`/api/admin/groups/${groupId}`, "GET", adminHeaders);
    enrollmentBId = JSON.parse(groupDetails.body).group?.enrollments?.find(e => e.student.id === studentBId)?.id;
    const removeB = await req(`/api/admin/enrollments/${enrollmentBId}`, "DELETE", adminHeaders);
    logStep(12, "Admin removes student B", removeB.status === 200);

    // 13. Verify B is withdrawn
    const checkB = await req("/api/admin/enrollments", "GET", adminHeaders);
    const bStatus = JSON.parse(checkB.body).students?.find(s => s.id === studentBId);
    logStep(13, "Enrollment B is withdrawn (not in active group)", bStatus && bStatus.currentGroupId === null);

    // 14. Teacher sees A only now
    const tStudentsFinal = await req("/api/teacher/students", "GET", teacherHeaders);
    const tStudentsFinalList = JSON.parse(tStudentsFinal.body).groups?.find(g => g.groupId === groupId)?.students || [];
    const onlyA = tStudentsFinalList.length === 1 && tStudentsFinalList[0].id === studentAId;
    logStep(14, "Teacher sees A only (B removed)", onlyA);

    console.log("\n--- QA SUMMARY ---");
    const passedCount = results.filter(r => r.pass).length;
    console.log(`${passedCount}/${results.length} PASSED`);
    process.exit(passedCount === 14 ? 0 : 2);

  } catch (error) {
    console.error("QA_ERROR:", error);
    process.exit(1);
  }
}

runQA();
