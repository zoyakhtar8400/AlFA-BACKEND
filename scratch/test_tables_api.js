const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const token = jwt.sign({ id: 1, role: 'admin', store_id: 'STORE_1' }, '7FGnB8A2WrgmfJaMJYTfM7tDS7mYUNDa', { expiresIn: '1h' });
    const res = await axios.get('http://localhost:3000/api/tables?store_id=all', { headers: { Authorization: 'Bearer ' + token } });
    console.log('GET /api/tables response status:', res.status);
    console.log('Tables count:', res.data?.tables?.length || res.data?.data?.length);
    console.log('Sample table:', (res.data?.tables || res.data?.data)?.[0]);
  } catch(e) {
    console.error('Error:', e.message, e.response?.data);
  }
})();
