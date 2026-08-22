const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDS = { username: 'admin', password: 'GhW7gBHCpZWEiye4' };
const STUDENT_CREDS = { username: 'sana_s_test12', password: 'C6L5D7V_jQm0qeS0' };

async function req(path, method = 'GET', body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function runTests() {
  console.log('--- Admin Portal Security Tests ---');
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
    // 1. Login as Admin
    const loginRes = await req('/api/auth/login', 'POST', ADMIN_CREDS);
    const adminCookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
    assert(loginRes.status === 200 && adminCookie, 'Admin can login');

    // 2. Login as Student
    const sLoginRes = await req('/api/auth/login', 'POST', STUDENT_CREDS);
    const studentCookie = sLoginRes.headers['set-cookie']?.[0]?.split(';')[0];
    assert(sLoginRes.status === 200 && studentCookie, 'Student can login');

    // 3. Admin access Dashboard API
    const dashRes = await req('/api/admin/dashboard', 'GET', null, adminCookie);
    assert(dashRes.status === 200 && dashRes.data.ok, 'Admin can access dashboard API');

    // 4. Student access Admin Dashboard API -> 403
    const sDashRes = await req('/api/admin/dashboard', 'GET', null, studentCookie);
    assert(sDashRes.status === 403, 'Student rejected from Admin Dashboard API (403)');

    // 5. Admin access Student list API
    const studentsRes = await req('/api/admin/students', 'GET', null, adminCookie);
    assert(studentsRes.status === 200 && Array.isArray(studentsRes.data.students), 'Admin can list students');

    // 6. Anonymous access Admin API -> 401
    const anonRes = await req('/api/admin/dashboard', 'GET');
    assert(anonRes.status === 401, 'Anonymous rejected from Admin API (401)');

    // 7. Student access Teacher detail API -> 403
    // We need a real teacher ID, but even if fake, it should be 403 before 404
    const sTeacherRes = await req('/api/admin/teachers/some-id', 'GET', null, studentCookie);
    assert(sTeacherRes.status === 403, 'Student rejected from Admin Teacher detail API (403)');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log(`\nResults: ${passed}/${total} PASSED`);
  process.exit(passed === total ? 0 : 1);
}

runTests();
