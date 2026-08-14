require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 1, username: 'admin', role: 'ADMIN', store_id: 'STORE_1' },
  process.env.JWT_SECRET || 'secretKey',
  { expiresIn: '1h' }
);

async function testGetTables() {
  try {
    const res = await axios.get('http://localhost:3000/api/tables', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('GET /api/tables response status:', res.data.statusCode || res.status);
    console.log('Tables returned:', (res.data.tables || res.data.data || []).length);
  } catch (err) {
    console.error('Error fetching tables:', err.response?.data || err.message);
  }
}

testGetTables();
