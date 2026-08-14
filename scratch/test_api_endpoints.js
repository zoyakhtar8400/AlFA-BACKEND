require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 1, username: 'admin', role: 'ADMIN', store_id: 'STORE_1' },
  process.env.JWT_SECRET || 'secretKey',
  { expiresIn: '1h' }
);

async function testPrinterAndCatEndpoints() {
  try {
    const [pRes, cRes] = await Promise.all([
      axios.get('http://localhost:3000/api/printers', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:3000/api/production-categories', { headers: { Authorization: `Bearer ${token}` } })
    ]);

    console.log('--- GET /api/printers ---');
    console.table(pRes.data.data.slice(0, 5));

    console.log('\n--- GET /api/production-categories ---');
    console.table(cRes.data.data);

  } catch (err) {
    console.error('API test error:', err.response?.data || err.message);
  }
}

testPrinterAndCatEndpoints();
