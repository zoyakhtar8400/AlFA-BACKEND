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

async function testStaffAirport2226() {
  console.log('===================================================');
  console.log('   TESTING USER: staff_airport_2226 & TABLE CREATION');
  console.log('===================================================');

  await sequelize.authenticate();

  // 1. Inspect DB user staff_airport_2226
  const [users] = await sequelize.query(`SELECT id, username, store_id, password FROM mpos_user WHERE username LIKE '%2226%' OR username = 'staff_airport_2226'`);
  console.log('\n[1] User Info from PostgreSQL mpos_user:', users);

  if (users.length === 0) {
    console.error('🔴 User staff_airport_2226 not found in DB!');
    await sequelize.close();
    return;
  }

  const staffUser = users[0];

  // Set known password for test if needed
  const bcrypt = require('bcryptjs');
  const hashedPass = await bcrypt.hash('staff123', 10);
  await sequelize.query(`UPDATE mpos_user SET password = '${hashedPass}', status = 1 WHERE id = ${staffUser.id}`);
  console.log(`\n[2] Set password 'staff123' for ${staffUser.username} (ID: ${staffUser.id})`);

  // Inspect assigned outlets in mpos_user_outlet
  const [outlets] = await sequelize.query(`SELECT * FROM mpos_user_outlet WHERE user_id = ${staffUser.id}`);
  console.log('\n[3] Assigned Outlets in mpos_user_outlet:', outlets);

  // 2. Login as staff_airport_2226
  const loginRes = await apiReq('POST', '/login', { username: staffUser.username, password: 'staff123' }, null);
  console.log('\n[4] Login Status:', loginRes.status);
  console.log('    Login Data:', loginRes.data?.user);
  const token = loginRes.data?.token;

  if (!token) {
    console.error('🔴 Failed to obtain JWT token for staff_airport_2226!');
    await sequelize.close();
    return;
  }

  // 3. Create Table in Assigned Outlet (STORE_2)
  console.log('\n[5] Attempting Table Creation for Assigned Outlet (STORE_2)...');
  const createTableStore2 = await apiReq('POST', '/tables', {
    table_name: 'Airport T100',
    seats: 4,
    department: 'Dining',
    store_id: 'STORE_2'
  }, token);

  console.log('    Create Table Status (STORE_2):', createTableStore2.status);
  console.log('    Create Table Response:', createTableStore2.data);

  // 4. Attempt Table Creation in Unauthorized Outlet (STORE_1)
  console.log('\n[6] Attempting Table Creation for Unauthorized Outlet (STORE_1)...');
  const createTableStore1 = await apiReq('POST', '/tables', {
    table_name: 'Unauthorized T999',
    seats: 4,
    department: 'Dining',
    store_id: 'STORE_1'
  }, token);

  console.log('    Create Table Status (STORE_1):', createTableStore1.status);
  console.log('    Create Table Response:', createTableStore1.data);

  // Verification Summary
  console.log('\n===================================================');
  console.log('               VERIFICATION SUMMARY                ');
  console.log('===================================================');
  const passAssigned = createTableStore2.status === 200 || createTableStore2.status === 201;
  const passUnassigned = createTableStore1.status === 403;

  console.log(`Assigned Outlet (STORE_2) Creation : ${passAssigned ? '🟢 PASS (201 Created)' : '🔴 FAIL'}`);
  console.log(`Unassigned Outlet (STORE_1) Block : ${passUnassigned ? '🟢 PASS (403 Forbidden Guarded)' : '🔴 FAIL'}`);

  await sequelize.close();
}

testStaffAirport2226().catch(err => console.error(err));
