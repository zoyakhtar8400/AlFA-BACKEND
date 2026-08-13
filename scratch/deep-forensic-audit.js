require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function apiRequest(method, path, body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runDeepAudit() {
  console.log('--- STARTING COMPREHENSIVE FORENSIC DEEP AUDIT ---');

  // 1. Obtain Admin Token
  const adminLogin = await apiRequest('POST', '/login', { username: 'admin', password: 'admin123' });
  const adminToken = adminLogin.data.token;
  console.log('Admin Token Acquired:', !!adminToken);

  // 2. Test Rate Limiting on /login
  console.log('\n--- TESTING RATE LIMITING ---');
  let rateLimitHit = false;
  let retryAfterHeader = null;
  // Send 6 failing attempts with custom IP header
  for (let i = 1; i <= 6; i++) {
    const res = await apiRequest('POST', '/login', { username: 'admin', password: 'wrong' }, null, { 'x-forwarded-for': '192.168.1.99' });
    console.log(`Attempt ${i}: Status ${res.status}`);
    if (res.status === 429) {
      rateLimitHit = true;
      retryAfterHeader = res.headers['retry-after'];
    }
  }
  console.log(`Rate Limit Result: ${rateLimitHit ? 'PASS (429 returned)' : 'FAIL'}, Retry-After: ${retryAfterHeader}`);

  // 3. Test Endpoint Authorization Matrix
  console.log('\n--- TESTING API AUTHORIZATION MATRIX ---');
  const endpointsToTest = [
    { path: '/users', method: 'GET', adminAllowed: true, staffAllowed: false },
    { path: '/users', method: 'POST', adminAllowed: true, staffAllowed: false },
    { path: '/department/get', method: 'GET', adminAllowed: true, staffAllowed: true },
    { path: '/v1/purchase/supplier', method: 'GET', adminAllowed: true, staffAllowed: true },
  ];

  // Create temporary Staff token for testing
  const staffUsername = `STAFF-AUDIT-${Date.now().toString().slice(-4)}`;
  const staffCreate = await apiRequest('POST', '/users', {
    username: staffUsername,
    password: 'StaffPassword123!',
    name: 'Audit Staff',
    role: 'STAFF',
    status: 'Active'
  }, adminToken);

  let staffToken = null;
  if (staffCreate.status === 201) {
    const staffLogin = await apiRequest('POST', '/login', { username: staffUsername, password: 'StaffPassword123!' });
    staffToken = staffLogin.data.token;
  }
  console.log('Staff Token Acquired:', !!staffToken);

  for (const ep of endpointsToTest) {
    // Unauthenticated (No token)
    const unauthRes = await apiRequest(ep.method, ep.path, ep.method === 'POST' ? {} : null, null);
    // Staff token
    const staffRes = staffToken ? await apiRequest(ep.method, ep.path, ep.method === 'POST' ? {} : null, staffToken) : { status: 'N/A' };
    // Admin token
    const adminRes = await apiRequest(ep.method, ep.path, ep.method === 'POST' ? {} : null, adminToken);

    console.log(`Endpoint [${ep.method} ${ep.path}] -> No Auth: ${unauthRes.status} | Staff: ${staffRes.status} | Admin: ${adminRes.status}`);
  }

  // Cleanup staff user
  if (staffCreate.data?.data?.id) {
    await apiRequest('DELETE', `/users/${staffCreate.data.data.id}`, null, adminToken);
  }
}

runDeepAudit().catch(err => console.error(err));
