const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  const token = jwt.sign({ id: 1, role: 'admin', store_id: 'STORE_1' }, '7FGnB8A2WrgmfJaMJYTfM7tDS7mYUNDa', { expiresIn: '1h' });
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const BASE = 'http://localhost:3000/api/company-profile';

  console.log('--- 1. Testing GET /api/company-profile ---');
  let res = await axios.get(BASE, { headers });
  console.log('GET status:', res.status, 'Data:', res.data);

  console.log('--- 2. Testing POST /api/company-profile (Create) ---');
  res = await axios.post(BASE, {
    company_name: 'ALFA Restaurant & Cafe',
    phone: '9876543210',
    email: 'admin@alfahms.com',
    logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    gstin: '09AAACA1234A1Z5',
    fssai: '10019051000001',
    address: 'Civil Lines, Main Road',
    state: 'Uttar Pradesh',
    city: 'Gorakhpur',
    country: 'India',
    license_key: 'ALFA-LIC-8899-001'
  }, { headers });
  console.log('POST status:', res.status, 'Created Profile:', res.data?.data);
  const createdId = res.data?.data?.id;

  console.log('--- 3. Testing GET /api/company-profile (Verify Persistence) ---');
  res = await axios.get(BASE, { headers });
  console.log('GET Data after create:', res.data?.data);

  console.log('--- 4. Testing PUT /api/company-profile/:id (Update) ---');
  res = await axios.put(`${BASE}/${createdId}`, {
    company_name: 'ALFA Grand Restaurant & Resort',
    phone: '9876543299',
    city: 'Lucknow'
  }, { headers });
  console.log('PUT status:', res.status, 'Updated Profile:', res.data?.data);

  console.log('--- 5. Testing GET /api/company-profile (Verify Update Persistence) ---');
  res = await axios.get(BASE, { headers });
  console.log('GET Data after update:', res.data?.data);

  console.log('--- 6. Testing DELETE /api/company-profile/:id ---');
  res = await axios.delete(`${BASE}/${createdId}`, { headers });
  console.log('DELETE status:', res.status, res.data?.message);

  console.log('--- 7. Testing GET /api/company-profile (Verify Delete Persistence) ---');
  res = await axios.get(BASE, { headers });
  console.log('GET Data after delete (should be null):', res.data?.data);

  console.log('All Company Profile API tests passed successfully!');
})();
