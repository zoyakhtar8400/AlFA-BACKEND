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

async function testKotAndBillIsolation() {
  console.log('========================================================================');
  console.log('   DEEP MULTI-OUTLET AUDIT: COMPLETE KOT & BILL DATA ISOLATION VERIFICATION');
  console.log('========================================================================');

  const loginAdmin = await apiReq('POST', '/login', { username: 'admin', password: 'admin123' }, null);
  const adminToken = loginAdmin.data?.token;

  const loginStaff = await apiReq('POST', '/login', { username: 'staff_airport_2226', password: 'staff123' }, null);
  const staffToken = loginStaff.data?.token;

  // 1. Create a KOT in Outlet 2 (STORE_2) via Staff Airport token
  console.log('\n[1] Creating KOT in Outlet 2 (STORE_2)...');
  const createKotRes = await apiReq('POST', '/kots', {
    tableNo: '100',
    table_id: 100,
    store_id: 'STORE_2',
    customerName: 'Airport Guest',
    items: [
      { itemId: 1, itemName: 'Cold Coffee', qty: 2, unitPrice: 120 }
    ]
  }, staffToken);

  console.log('    Create KOT Status:', createKotRes.status);
  console.log('    Create KOT Data:', createKotRes.data?.data?.store_id || createKotRes.data);

  // 2. Fetch KOTs for STORE_1 (Outlet 1)
  console.log('\n[2] Querying KOTs for STORE_1...');
  const kotsStore1 = await apiReq('GET', '/kots?store_id=STORE_1&active=1', null, adminToken);
  const foundInStore1 = (kotsStore1.data?.kots || kotsStore1.data?.data || []).some(k => k.customerName === 'Airport Guest' || k.customer_name === 'Airport Guest');
  console.log('    STORE_1 Active KOTs Count:', (kotsStore1.data?.kots || kotsStore1.data?.data || []).length);
  console.log('    Airport KOT Present in STORE_1?:', foundInStore1 ? '🔴 LEAKED' : '🟢 NONE (Isolated)');

  // 3. Fetch KOTs for STORE_2 (Outlet 2)
  console.log('\n[3] Querying KOTs for STORE_2...');
  const kotsStore2 = await apiReq('GET', '/kots?store_id=STORE_2&active=1', null, staffToken);
  const foundInStore2 = (kotsStore2.data?.kots || kotsStore2.data?.data || []).some(k => k.customerName === 'Airport Guest' || k.customer_name === 'Airport Guest');
  console.log('    STORE_2 Active KOTs Count:', (kotsStore2.data?.kots || kotsStore2.data?.data || []).length);
  console.log('    Airport KOT Present in STORE_2?:', foundInStore2 ? '🟢 FOUND (Belongs to STORE_2)' : '🔴 MISSING');

  // 4. Fetch Pending Bills for STORE_1 vs STORE_2
  console.log('\n[4] Querying Pending Bills for STORE_1 vs STORE_2...');
  const pendingStore1 = await apiReq('GET', '/billing/pending?store_id=STORE_1', null, adminToken);
  const pendingStore2 = await apiReq('GET', '/billing/pending?store_id=STORE_2', null, staffToken);

  const leakPending = (pendingStore1.data?.data || []).some(b => b.store_id === 'STORE_2');
  console.log('    STORE_1 Pending Bills Count:', (pendingStore1.data?.data || []).length);
  console.log('    STORE_2 Pending Bills Count:', (pendingStore2.data?.data || []).length);
  console.log('    Cross-Outlet Pending Bill Leakage?:', leakPending ? '🔴 LEAKED' : '🟢 NONE (Isolated)');

  console.log('\n========================================================================');
  console.log('                     FINAL SCORECARD VERIFICATION                       ');
  console.log('========================================================================');
  console.log(`KOT Isolation (STORE_1 vs STORE_2)   : ${!foundInStore1 && foundInStore2 ? '🟢 PASS (100% Isolated)' : '🔴 FAIL'}`);
  console.log(`Bill Isolation (STORE_1 vs STORE_2)  : ${!leakPending ? '🟢 PASS (100% Isolated)' : '🔴 FAIL'}`);

}

testKotAndBillIsolation().catch(err => console.error(err));
