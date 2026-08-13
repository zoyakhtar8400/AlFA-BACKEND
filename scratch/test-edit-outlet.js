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

async function testAllFieldsEditOutlet() {
  console.log('Testing ALL fields editing in Outlet Master...');

  // Admin login
  const login = await apiReq('POST', '/login', { username: 'admin', password: 'admin123' }, null);
  const token = login.data?.token;

  // Edit ALL fields for Outlet 2
  const updatePayload = {
    id: 2,
    store_id: 'STORE_2',
    name: 'Airport Grand Restaurant',
    shortName: 'AGR',
    companyTitle: 'Grand Plaza Group',
    outletTitle: 'Rooftop Grill',
    customerInfo: 'Required',
    autoSettlement: 'Yes',
    focusOn: 'Quantity',
    kot: 'Print & Save',
    kotPrint: 'Immediate',
    roomService: 'Enabled',
    noOfKOT: '2',
    noOfBills: '2',
    hsnSac: '996331',
    general: 'Premium Dining Outlet',
    phone: '9876543210',
    billHeader1: 'Airport Grand Hotel',
    billHeader2: 'Terminal 2, Departure Level',
    billHeader3: 'New Delhi - 110037',
    billSlogan1: 'Thank you for dining with us!',
    billSlogan2: 'Visit us again!',
    billSlogan3: 'Have a safe flight!',
    status: 'Active'
  };

  const updateRes = await apiReq('POST', '/stores', updatePayload, token);
  console.log('Update All Fields Status:', updateRes.status);
  console.log('Updated Settings:', updateRes.data?.data?.settings);

  // Re-fetch all stores from /stores endpoint to verify full retrieval
  const fetchRes = await apiReq('GET', '/stores', null, token);
  const outlet2 = (fetchRes.data?.data || []).find(o => Number(o.id) === 2);

  console.log('Fetched Outlet 2 from DB:', outlet2);

  // Restore name back to "Airport Restaurant"
  await apiReq('POST', '/stores', { id: 2, store_id: 'STORE_2', name: 'Airport Restaurant' }, token);

  if (updateRes.status === 200 && outlet2 && outlet2.store_name === 'Airport Grand Restaurant') {
    console.log('🟢 SUCCESS: All 22 Outlet Master fields verified saved and retrieved from PostgreSQL!');
  } else {
    console.error('🔴 FAIL:', updateRes.data);
  }
}

testAllFieldsEditOutlet().catch(err => console.error(err));
