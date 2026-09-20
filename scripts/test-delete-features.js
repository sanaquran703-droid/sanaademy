const BASE_URL = 'http://localhost:3001';
const adminCreds = { username: 'admin', password: 'password123' };

async function runTests() {
  console.log("Starting Delete Features Verification (Debug Mode)...");
  
  let cookie = '';

  // 1. Login as Admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCreds)
  });
  cookie = loginRes.headers.get('set-cookie');
  console.log("✅ Step 1: Admin logged in");

  const headers = { 'Cookie': cookie, 'Content-Type': 'application/json' };

  // 2. Create a test group to delete
  const createRes = await fetch(`${BASE_URL}/api/admin/groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: "حلقة للحذف",
      maxStudents: 5,
      academicYear: "2025-2026",
      meetingProvider: "google_meet",
      schedules: []
    })
  });
  
  if (!createRes.ok) {
    console.error("❌ Step 2 Create Failed:", await createRes.text());
    return;
  }
  
  const groupsRes = await fetch(`${BASE_URL}/api/admin/groups`, { headers });
  const groupsText = await groupsRes.text();
  let groupsData;
  try {
    groupsData = JSON.parse(groupsText);
  } catch (e) {
    console.error("❌ Failed to parse groups JSON. Response was:", groupsText.substring(0, 200));
    return;
  }
  
  const group = groupsData.groups.find(g => g.name === "حلقة للحذف");
  const groupId = group.id;
  console.log("✅ Step 2: Test group created, ID:", groupId);

  // 3. Delete (Deactivate) the group
  const delGroupRes = await fetch(`${BASE_URL}/api/admin/groups/${groupId}`, { method: 'DELETE', headers });
  if (delGroupRes.ok) {
    console.log("✅ Step 3: Group deactivated successfully");
  } else {
    console.error("❌ Step 3 Failed:", await delGroupRes.text());
  }

  // 4. Create a test student to toggle active
  const createStudentRes = await fetch(`${BASE_URL}/api/admin/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fullName: "طالبة اختبار حذف",
      username: "test_delete_student_" + Date.now(),
      password: "password123",
      academicYear: "2025-2026"
    })
  });
  
  if (!createStudentRes.ok) {
    console.error("❌ Step 4 Create Student Failed:", await createStudentRes.text());
    return;
  }
  
  const studentsRes = await fetch(`${BASE_URL}/api/admin/students`, { headers });
  const studentsData = await studentsRes.json();
  const student = studentsData.students.find(s => s.user.fullName === "طالبة اختبار حذف");
  const userId = student.userId;
  console.log("✅ Step 4: Test student created, User ID:", userId);

  // 5. Toggle Active (Deactivate)
  const toggleRes = await fetch(`${BASE_URL}/api/admin/users/${userId}/toggle-active`, { method: 'PATCH', headers });
  const toggleData = await toggleRes.json();
  if (toggleRes.ok && toggleData.isActive === false) {
    console.log("✅ Step 5: Student account deactivated successfully");
  } else {
    console.error("❌ Step 5 Failed:", toggleData);
  }

  // 6. Toggle Active (Reactivate)
  const reactivateRes = await fetch(`${BASE_URL}/api/admin/users/${userId}/toggle-active`, { method: 'PATCH', headers });
  const reactivateData = await reactivateRes.json();
  if (reactivateRes.ok && reactivateData.isActive === true) {
    console.log("✅ Step 6: Student account reactivated successfully");
  } else {
    console.error("❌ Step 6 Failed:", reactivateData);
  }

  console.log("\n--- DELETE FEATURES VERIFICATION COMPLETE ---");
}

runTests().catch(err => console.error("Test Error:", err.message));
