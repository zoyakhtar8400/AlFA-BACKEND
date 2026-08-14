const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const token = jwt.sign({ id: 1, role: 'admin', store_id: 'STORE_1' }, '7FGnB8A2WrgmfJaMJYTfM7tDS7mYUNDa', { expiresIn: '1h' });
    const authHeaders = { headers: { Authorization: 'Bearer ' + token } };

    // 1. GET all floors
    console.log('1. GET /api/floors...');
    const getRes = await axios.get('http://localhost:3000/api/floors', authHeaders);
    console.log('Floors list:', getRes.data?.data);

    // 2. POST create floor
    console.log('\n2. POST /api/floors...');
    const createRes = await axios.post('http://localhost:3000/api/floors', {
      name: 'Rooftop Lounge',
      active: 'Yes'
    }, authHeaders);
    console.log('Created floor:', createRes.data?.data);
    const newId = createRes.data?.data?.id;

    // 3. PUT update floor
    console.log('\n3. PUT /api/floors/' + newId + '...');
    const updateRes = await axios.put(`http://localhost:3000/api/floors/${newId}`, {
      name: 'Rooftop Sky Lounge',
      active: 'No'
    }, authHeaders);
    console.log('Updated floor:', updateRes.data?.data);

    // 4. DELETE floor
    console.log('\n4. DELETE /api/floors/' + newId + '...');
    const delRes = await axios.delete(`http://localhost:3000/api/floors/${newId}`, authHeaders);
    console.log('Delete response:', delRes.data);

    // 5. Verify list again
    const finalRes = await axios.get('http://localhost:3000/api/floors', authHeaders);
    console.log('\n5. Final floors count:', finalRes.data?.data?.length);
    console.log('Final floors:', finalRes.data?.data);
  } catch(e) {
    console.error('Error testing floor CRUD:', e.message, e.response?.data);
  }
})();
