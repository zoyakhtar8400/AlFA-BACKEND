require('dotenv').config();
const http = require('http');
const { Sequelize } = require('sequelize');

const API_BASE = 'http://localhost:3000/api';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

function apiReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const req = http.request({
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runMultiOutletRbacTest() {
  console.log('===========================================================');
  console.log('  ALFA HMS MULTI-OUTLET ROLE-BASED ACCESS CONTROL AUDIT');
  console.log('===========================================================');

  const scorecard = [];

  // 1. Admin Login & Universal Outlets Check
  const adminLogin = await apiReq('POST', '/login', { username: 'admin', password: 'admin123' }, null);
  const adminToken = adminLogin.data?.token;
  const adminOutlets = adminLogin.data?.outlets || [];

  scorecard.push({
    test: '1. Admin Login & Universal Outlets',
    role: 'ADMIN',
    expected: 'All System Outlets',
    result: adminLogin.status === 200 && adminOutlets.length > 0 ? `PASS (${adminOutlets.length} Outlets)` : 'FAIL',
    status: adminLogin.status === 200 && adminOutlets.length > 0 ? '🟢 VERIFIED' : '🔴 FAILED'
  });

  // 2. Create Staff User assigned ONLY to STORE_2
  const staffUsername = `staff_airport_${Date.now().toString().slice(-4)}`;
  const staffPassword = 'password123';
  const createStaff = await apiReq('POST', '/users', {
    username: staffUsername,
    password: staffPassword,
    name: 'Airport Staff',
    role: 'STAFF',
    status: 'Active',
    assigned_outlets: ['STORE_2']
  }, adminToken);

  scorecard.push({
    test: '2. Staff Creation & Outlet Assignment',
    role: 'ADMIN',
    expected: 'Save to mpos_user_outlet',
    result: createStaff.status === 201 ? 'PASS (STORE_2 Assigned)' : 'FAIL',
    status: createStaff.status === 201 ? '🟢 VERIFIED' : '🔴 FAILED'
  });

  // 3. Staff Login & Scoped Token Check
  const staffLogin = await apiReq('POST', '/login', { username: staffUsername, password: staffPassword }, null);
  const staffToken = staffLogin.data?.token;
  const staffOutlets = staffLogin.data?.user?.assigned_outlets || [];

  scorecard.push({
    test: '3. Staff Scoped Login Context',
    role: 'STAFF',
    expected: "Only ['STORE_2']",
    result: staffLogin.status === 200 && staffOutlets.includes('STORE_2') ? 'PASS' : 'FAIL',
    status: staffLogin.status === 200 && staffOutlets.includes('STORE_2') ? '🟢 VERIFIED' : '🔴 FAILED'
  });

  // 4. Authorized Staff Access (STORE_2)
  const authAccess = await apiReq('GET', '/tables?store_id=STORE_2', null, staffToken);
  scorecard.push({
    test: '4. Authorized Outlet Request (STORE_2)',
    role: 'STAFF',
    expected: 'HTTP 200 OK',
    result: authAccess.status === 200 ? 'PASS' : 'FAIL',
    status: authAccess.status === 200 ? '🟢 VERIFIED' : '🔴 FAILED'
  });

  // 5. Backend Authorization Security Check (Unauthorized STORE_1 Request)
  const unauthAccess = await apiReq('GET', '/tables?store_id=STORE_1', null, staffToken);
  scorecard.push({
    test: '5. Backend Rejection of Unauthorized Outlet (STORE_1)',
    role: 'STAFF',
    expected: 'HTTP 403 Forbidden',
    result: unauthAccess.status === 403 ? 'PASS (Forbidden Received)' : `FAIL (Got ${unauthAccess.status})`,
    status: unauthAccess.status === 403 ? '🟢 VERIFIED' : '🔴 FAILED'
  });

  // 6. PostgreSQL Database Table Verification
  let dbMappingsCount = 0;
  try {
    await sequelize.authenticate();
    const [mRes] = await sequelize.query(`SELECT COUNT(*) FROM mpos_user_outlet WHERE store_id = 'STORE_2'`);
    dbMappingsCount = parseInt(mRes[0].count);
  } catch (e) {
    console.error('DB error:', e.message);
  }

  scorecard.push({
    test: '6. PostgreSQL mpos_user_outlet Persistence',
    role: 'SYSTEM',
    expected: 'Row exists in PostgreSQL',
    result: dbMappingsCount >= 1 ? 'PASS' : 'FAIL',
    status: dbMappingsCount >= 1 ? '🟢 VERIFIED' : '🔴 FAILED'
  });

  console.log('\n=====================================================================================================');
  console.log('                      MULTI-OUTLET ROLE-BASED ACCESS CONTROL AUDIT SCORECARD');
  console.log('=====================================================================================================');
  console.table(scorecard);
  console.log('=====================================================================================================\n');

  await sequelize.close();
}

runMultiOutletRbacTest().catch(err => console.error(err));
