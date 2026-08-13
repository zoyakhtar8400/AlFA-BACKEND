require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

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

async function testOutlet2Bill() {
  console.log('===========================================================');
  console.log('       TESTING OUTLET 2 (STORE_2) BILL CREATION & LOOKUP');
  console.log('===========================================================');

  const loginStaff = await apiReq('POST', '/login', { username: 'staff_airport_2226', password: 'staff123' }, null);
  const staffToken = loginStaff.data?.token;

  // 1. Create a bill for Table 1 in Outlet 2 (STORE_2)
  console.log('\n[1] Creating Bill for Table 1 in Outlet 2 (STORE_2)...');
  const createBillRes = await apiReq('POST', '/orders', {
    tableId: 1,
    tableNo: '01',
    table_name: 'Table 1',
    store_id: 'STORE_2',
    customerName: 'Airport Passenger',
    mobileNo: '9998887776',
    status: 'pending',
    items: [
      { itemId: 1, itemName: 'Butter Chicken', qty: 1, price: 350 }
    ]
  }, staffToken);

  console.log('    Create Bill Status:', createBillRes.status);
  console.log('    Create Bill Data:', createBillRes.data?.orderdata?.store_id || createBillRes.data);

  // 2. Fetch Active Bill for Table 1 in Outlet 2
  console.log('\n[2] Fetching Active Bill for Table 1 in STORE_2...');
  const activeBillRes = await apiReq('GET', '/orders?table_id=1&store_id=STORE_2', null, staffToken);
  console.log('    Active Bill Status:', activeBillRes.status);
  console.log('    Active Bill Result:', activeBillRes.data?.orderdata ? '🟢 FOUND (Belongs to STORE_2)' : '🔴 NOT FOUND');

  // 3. Fetch Active Bill for Table 1 in STORE_1 (Admin context)
  console.log('\n[3] Fetching Active Bill for Table 1 in STORE_1...');
  const loginAdmin = await apiReq('POST', '/login', { username: 'admin', password: 'admin123' }, null);
  const adminToken = loginAdmin.data?.token;
  const activeBillStore1Res = await apiReq('GET', '/orders?table_id=1&store_id=STORE_1', null, adminToken);
  console.log('    STORE_1 Active Bill Result:', activeBillStore1Res.data?.orderdata?.customerName === 'Airport Passenger' ? '🔴 LEAKED TO STORE_1' : '🟢 NOT LEAKED TO STORE_1 (Isolated)');

  console.log('\n===========================================================');
  console.log('               VERIFICATION RESULT SUMMARY                 ');
  console.log('===========================================================');
  console.log(`Outlet 2 Bill Creation  : ${createBillRes.status === 200 || createBillRes.status === 201 ? '🟢 PASS' : '🔴 FAIL'}`);
  console.log(`Outlet 2 Active Lookup  : ${activeBillRes.data?.orderdata ? '🟢 PASS' : '🔴 FAIL'}`);
  console.log(`Outlet 1 Isolation Check: ${activeBillStore1Res.data?.orderdata?.customerName !== 'Airport Passenger' ? '🟢 PASS' : '🔴 FAIL'}`);
}

testOutlet2Bill().catch(err => console.error(err));
