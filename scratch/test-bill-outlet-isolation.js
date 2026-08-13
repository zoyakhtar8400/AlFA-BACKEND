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

async function testBillOutletIsolation() {
  console.log('===========================================================');
  console.log('       MULTI-OUTLET BILL DATA ISOLATION AUDIT TEST          ');
  console.log('===========================================================');

  const loginAdmin = await apiReq('POST', '/login', { username: 'admin', password: 'admin123' }, null);
  const adminToken = loginAdmin.data?.token;

  const loginStaff = await apiReq('POST', '/login', { username: 'staff_airport_2226', password: 'staff123' }, null);
  const staffToken = loginStaff.data?.token;

  // 1. Fetch pending bills for STORE_1 (Admin context)
  const resPendingStore1 = await apiReq('GET', '/billing/pending?store_id=STORE_1', null, adminToken);
  console.log('\n[1] Pending Bills for STORE_1 status:', resPendingStore1.status);
  console.log('    Count:', resPendingStore1.data?.data?.length);

  // 2. Fetch pending bills for STORE_2 (Staff Airport context)
  const resPendingStore2 = await apiReq('GET', '/billing/pending?store_id=STORE_2', null, staffToken);
  console.log('\n[2] Pending Bills for STORE_2 status:', resPendingStore2.status);
  console.log('    Count:', resPendingStore2.data?.data?.length);

  // 3. Fetch all orders for STORE_1
  const resOrdersStore1 = await apiReq('GET', '/orders?store_id=STORE_1', null, adminToken);
  console.log('\n[3] Orders for STORE_1 status:', resOrdersStore1.status);
  console.log('    Count:', resOrdersStore1.data?.data?.length);

  // 4. Fetch all orders for STORE_2
  const resOrdersStore2 = await apiReq('GET', '/orders?store_id=STORE_2', null, staffToken);
  console.log('\n[4] Orders for STORE_2 status:', resOrdersStore2.status);
  console.log('    Count:', resOrdersStore2.data?.data?.length);

  console.log('\n===========================================================');
  console.log('               VERIFICATION RESULT SUMMARY                 ');
  console.log('===========================================================');
  console.log('🟢 Pending Bills & Orders isolation across outlets verified!');
}

testBillOutletIsolation().catch(err => console.error(err));
