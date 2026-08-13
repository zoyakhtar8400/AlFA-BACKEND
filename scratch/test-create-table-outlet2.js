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

async function testCreateTableInOutlet2() {
  console.log('Testing table creation in Outlet 2 (STORE_2)...');

  // Login as admin
  const login = await apiReq('POST', '/login', { username: 'admin', password: 'admin123' }, null);
  const token = login.data?.token;

  // Create Table 1 in Outlet 2 (STORE_2)
  const createRes = await apiReq('POST', '/tables', {
    table_name: 'Table 1',
    seats: 4,
    department: 'Dining',
    store_id: 'STORE_2'
  }, token);

  console.log('Create Table Status:', createRes.status);
  console.log('Create Table Response:', createRes.data);

  if (createRes.status === 201) {
    console.log('🟢 SUCCESS: Table created in Outlet 2 (STORE_2)!');
  } else {
    console.error('🔴 FAIL:', createRes.data);
  }

  // Cleanup test table from DB
  await sequelize.authenticate();
  await sequelize.query(`DELETE FROM mpos_table WHERE table_name = 'Table 1' AND store_id = 'STORE_2'`);
  await sequelize.close();
}

testCreateTableInOutlet2().catch(err => console.error(err));
