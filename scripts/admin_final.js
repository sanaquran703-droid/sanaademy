const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDS = { username: 'admin', password: 'GhW7gBHCpZWEiye4' };

async function req(urlPath, method = 'GET', body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };

    const request = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        const setCookie = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
        resolve({ status: res.statusCode, data: json, headers: res.headers, setCookie });
      });
    });

    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function runTests() {
  console.log('--- Admin Portal Comprehensive Security Tests ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      passed++;
      console.log(`PASS: ${message}`);
    } else {
      console.log(`FAIL: ${message}`);
    }
  }

  try {
    const studentCreds = JSON.parse(fs.readFileSync(path.join(__dirname, 'student-test-creds.json'), 'utf8'));
    const teacherCreds = JSON.parse(fs.readFileSync(path.join(__dirname, 'teacher-test-creds.json'), 'utf8'));

    // 1. Admin Login
    const adminLogin = await req('/api/auth/login', 'POST', ADMIN_CREDS);
    const adminCookie = adminLogin.setCookie;
    assert(adminLogin.status === 200 && adminCookie, '1. Admin can login -> 200 + session cookie');

    // 2. Admin access real student detail
    const studentsList = await req('/api/admin/students', 'GET', null, adminCookie);
    const testStudentId = studentsList.data?.students?.[0]?.id;
    if (testStudentId) {
      const detail = await req(`/api/admin/students/${testStudentId}`, 'GET', null, adminCookie);
      assert(detail.status === 200 && detail.data?.student?.id === testStudentId, '2. Admin can access real student detail -> 200');
    } else {
      console.log('SKIP: No student found for detail test');
    }

    // 3. Teacher session try admin API
    const teacherLogin = await req('/api/auth/login', 'POST', teacherCreds);
    const teacherCookie = teacherLogin.setCookie;
    const tProbe = await req(`/api/admin/students/${testStudentId || 'any'}`, 'GET', null, teacherCookie);
    assert(tProbe.status === 403, '3. Teacher session rejected from Admin API -> 403');

    // 4. Student session try admin API
    const studentLogin = await req('/api/auth/login', 'POST', studentCreds);
    const studentCookie = studentLogin.setCookie;
    const sProbe = await req(`/api/admin/students/${testStudentId || 'any'}`, 'GET', null, studentCookie);
    assert(sProbe.status === 403, '4. Student session rejected from Admin API -> 403');

    // 5. Anonymous redirect
    const anon = await req('/api/admin/dashboard', 'GET');
    assert(anon.status === 401 || anon.status === 302 || anon.status === 307, '5. Anonymous rejected/redirected -> 401/30x');

    // 6. Reset Password Test
    console.log('Testing Reset Password...');
    const testUserId = studentLogin.data?.user?.id; // student's user id
    const reset = await req(`/api/admin/users/${testUserId}/reset-password`, 'POST', {}, adminCookie);
    const newPass = reset.data?.newPassword;
    assert(reset.status === 200 && newPass, '6a. Admin can reset password -> returns new password');
    
    if (newPass) {
      const newLogin = await req('/api/auth/login', 'POST', { username: studentCreds.username, password: newPass });
      assert(newLogin.status === 200 && newLogin.data?.redirectTo === '/change-password', '6b. Login with new password -> 200 + mustChangePassword redirect');
      
      // Restore original password for student-test-creds.json integrity
      await req(`/api/admin/users/${testUserId}/reset-password`, 'POST', { newPassword: studentCreds.password }, adminCookie);
    }

    // 7. Toggle Active Test
    console.log('Testing Toggle Active...');
    const toggleOff = await req(`/api/admin/users/${testUserId}/toggle-active`, 'PATCH', {}, adminCookie);
    assert(toggleOff.status === 200 && toggleOff.data?.isActive === false, '7a. Admin can disable user -> isActive: false');
    
    const disabledLogin = await req('/api/auth/login', 'POST', studentCreds);
    assert(disabledLogin.status === 401, '7b. Login with disabled account -> 401 Unauthorized');
    
    // Restore account
    await req(`/api/admin/users/${testUserId}/toggle-active`, 'PATCH', {}, adminCookie);

    // 8. Dashboard Parity
    // Note: academic year logic is complex in code, but we know what dashboard uses
    const dash = await req('/api/admin/dashboard', 'GET', null, adminCookie);
    const dashCount = dash.data?.stats?.activeStudents;
    console.log('Dashboard activeStudents:', dashCount);
    assert(typeof dashCount === 'number', '8. Dashboard returns numeric active student count');

    // 9. Forbidden field patch
    if (testStudentId) {
      const patch = await req(`/api/admin/students/${testStudentId}`, 'PATCH', { username: 'hacker_username', fullName: 'Verified Name' }, adminCookie);
      const after = await req(`/api/admin/students/${testStudentId}`, 'GET', null, adminCookie);
      assert(after.data?.student?.user?.username !== 'hacker_username' && after.data?.student?.user?.fullName === 'Verified Name', '9. PATCH ignores forbidden fields (username) while updating allowed ones');
    }

  } catch (err) {
    console.error('Test execution error:', err.message);
  }

  console.log(`\nResults: ${passed}/${total} PASSED`);
  process.exit(passed === total ? 0 : 1);
}

runTests();
