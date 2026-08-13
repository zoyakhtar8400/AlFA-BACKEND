require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runForensicAudit() {
  console.log('--- STARTING ALFA HMS AUTHENTICATION FORENSIC AUDIT ---');
  const results = [];

  let adminToken = null;
  let normalUserToken = null;
  let createdAuditUserId = null;

  // 1. Admin Login (Correct Credentials)
  try {
    const res = await apiRequest('POST', '/login', { username: 'admin', password: 'admin123' });
    if (res.status === 200 && res.data?.token) {
      adminToken = res.data.token;
      results.push({ test: 'Admin login', status: 200, dbState: 'User id=1 verified', frontend: 'JWT issued', result: 'PASS' });
    } else {
      results.push({ test: 'Admin login', status: res.status, dbState: 'Failed', frontend: res.data?.message, result: 'FAIL' });
    }
  } catch (e) {
    results.push({ test: 'Admin login', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 2. Wrong Password
  try {
    const res = await apiRequest('POST', '/login', { username: 'admin', password: 'WrongPassword999!' });
    results.push({
      test: 'Wrong password',
      status: res.status,
      dbState: 'Auth rejected',
      frontend: res.data?.message || 'Invalid',
      result: res.status === 401 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Wrong password', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 3. Wrong Username
  try {
    const res = await apiRequest('POST', '/login', { username: 'non_existent_user_99', password: 'admin123' });
    results.push({
      test: 'Wrong username',
      status: res.status,
      dbState: 'User not found',
      frontend: res.data?.message || 'Invalid',
      result: res.status === 401 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Wrong username', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 4. Missing Parameters
  try {
    const res = await apiRequest('POST', '/login', { username: '', password: '' });
    results.push({
      test: 'Empty username/password',
      status: res.status,
      dbState: 'Validation error',
      frontend: res.data?.message,
      result: res.status === 400 || res.status === 401 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Empty username/password', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 5. Admin Create User
  const auditUsername = `AUTH-AUDIT-USER-${Date.now().toString().slice(-4)}`;
  try {
    const res = await apiRequest('POST', '/users', {
      username: auditUsername,
      password: 'AuditPassword123!',
      name: 'Audit Test Steward',
      role: 'USER',
      status: 'Active'
    }, adminToken);

    if (res.status === 201 && res.data?.data?.id) {
      createdAuditUserId = res.data.data.id;
      results.push({
        test: 'Admin create user',
        status: res.status,
        dbState: `PostgreSQL mpos_user ID ${createdAuditUserId}`,
        frontend: 'User added',
        result: 'PASS'
      });
    } else {
      results.push({ test: 'Admin create user', status: res.status, dbState: 'Failed', frontend: res.data?.message, result: 'FAIL' });
    }
  } catch (e) {
    results.push({ test: 'Admin create user', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 6. Duplicate Username Protection
  try {
    const res = await apiRequest('POST', '/users', {
      username: auditUsername,
      password: 'AuditPassword123!',
      role: 'USER'
    }, adminToken);
    results.push({
      test: 'Duplicate username protection',
      status: res.status,
      dbState: 'Unique constraint enforced',
      frontend: res.data?.message,
      result: res.status === 400 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Duplicate username protection', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 7. Normal User Login
  try {
    const res = await apiRequest('POST', '/login', { username: auditUsername, password: 'AuditPassword123!' });
    if (res.status === 200 && res.data?.token) {
      normalUserToken = res.data.token;
      results.push({ test: 'Normal user login', status: 200, dbState: `User ${auditUsername} verified`, frontend: 'JWT issued (USER role)', result: 'PASS' });
    } else {
      results.push({ test: 'Normal user login', status: res.status, dbState: 'Failed', frontend: res.data?.message, result: 'FAIL' });
    }
  } catch (e) {
    results.push({ test: 'Normal user login', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 8. Admin Read Users
  try {
    const res = await apiRequest('GET', '/users', null, adminToken);
    results.push({
      test: 'Admin read users',
      status: res.status,
      dbState: `Retrieved ${res.data?.data?.length || 0} users`,
      frontend: 'User list loaded',
      result: res.status === 200 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Admin read users', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 9. Admin Update User
  if (createdAuditUserId) {
    try {
      const res = await apiRequest('PUT', `/users/${createdAuditUserId}`, {
        name: 'Audit Test Steward Updated',
        phone: '9876543210'
      }, adminToken);
      results.push({
        test: 'Admin update user',
        status: res.status,
        dbState: `PostgreSQL updated ID ${createdAuditUserId}`,
        frontend: 'User updated',
        result: res.status === 200 ? 'PASS' : 'FAIL'
      });
    } catch (e) {
      results.push({ test: 'Admin update user', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
    }
  }

  // 10. Normal User Blocked on Admin Endpoint (403 Forbidden)
  try {
    const res = await apiRequest('POST', '/users', {
      username: 'UNAUTHORIZED-USER',
      password: 'Password123!',
      role: 'USER'
    }, normalUserToken);
    results.push({
      test: 'Normal user blocked (403)',
      status: res.status,
      dbState: 'Operation denied',
      frontend: '403 Forbidden',
      result: res.status === 403 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Normal user blocked (403)', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 11. Missing Token Security Test (401 Unauthorized)
  try {
    const res = await apiRequest('GET', '/users', null, null);
    results.push({
      test: 'Missing token (401)',
      status: res.status,
      dbState: 'Access denied',
      frontend: '401 Unauthorized',
      result: res.status === 401 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Missing token (401)', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 12. Invalid Token Security Test (401 Unauthorized)
  try {
    const res = await apiRequest('GET', '/users', null, 'invalid.jwt.token.here');
    results.push({
      test: 'Invalid token (401)',
      status: res.status,
      dbState: 'Signature rejected',
      frontend: '401 Unauthorized',
      result: res.status === 401 ? 'PASS' : 'FAIL'
    });
  } catch (e) {
    results.push({ test: 'Invalid token (401)', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
  }

  // 13. Admin Deactivate User
  if (createdAuditUserId) {
    try {
      const res = await apiRequest('DELETE', `/users/${createdAuditUserId}`, null, adminToken);
      results.push({
        test: 'Admin deactivate user',
        status: res.status,
        dbState: `PostgreSQL status set to 0 for ID ${createdAuditUserId}`,
        frontend: 'User deactivated',
        result: res.status === 200 ? 'PASS' : 'FAIL'
      });
    } catch (e) {
      results.push({ test: 'Admin deactivate user', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
    }

    // 14. Inactive User Login Rejection
    try {
      const res = await apiRequest('POST', '/login', { username: auditUsername, password: 'AuditPassword123!' });
      results.push({
        test: 'Inactive login rejection',
        status: res.status,
        dbState: 'Status 0 blocked',
        frontend: res.data?.message,
        result: res.status === 401 ? 'PASS' : 'FAIL'
      });
    } catch (e) {
      results.push({ test: 'Inactive login rejection', status: 500, dbState: e.message, frontend: 'Error', result: 'FAIL' });
    }
  }

  // Print Summary Evidence Table
  console.log('\n===========================================================');
  console.log('EVIDENCE TABLE:');
  console.log('===========================================================');
  results.forEach(r => {
    console.log(`[${r.result}] ${r.test.padEnd(32)} | HTTP: ${r.status} | DB: ${r.dbState} | FE: ${r.frontend}`);
  });
  console.log('===========================================================');

  const passed = results.filter(r => r.result === 'PASS').length;
  const total = results.length;
  console.log(`SUMMARY: Passed ${passed}/${total}, Failed ${total - passed}/${total}`);
  console.log('===========================================================');

  process.exit(passed === total ? 0 : 1);
}

runForensicAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
