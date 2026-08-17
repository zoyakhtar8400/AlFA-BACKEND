const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function testKotApiCancel() {
  try {
    await connection.sequelize.authenticate();
    
    // 1. Create a dummy active KOT in the database
    const dummyKot = await connection.KOT.create({
      table_id: 1,
      table_name: 'Table 1',
      customer_name: 'Test Customer',
      customer_mobile: '1234567890',
      store_id: 'STORE_1',
      status: 1, // Sent to Kitchen
      in_time: '12:00 PM',
      kot_date: new Date(),
      waiter: 'Staff',
      amount: 100.00,
      is_active: 1
    });

    console.log(`✅ Created dummy active KOT ID: ${dummyKot.kot_id}`);

    // 2. Generate a valid JWT token
    const token = jwt.sign(
      {
        id: '1',
        username: 'admin',
        role: 'ADMIN',
        type: 'ADMIN',
        store_id: 'STORE_1'
      },
      process.env.JWT_SECRET || '7FGnB8A2WrgmfJaMJYTfM7tDS7mYUNDa'
    );

    console.log('✅ Generated JWT token.');

    // 3. Make HTTP DELETE request to the running backend
    console.log(`Sending DELETE request to http://localhost:3000/api/kot/${dummyKot.kot_id}...`);
    const res = await axios.delete(`http://localhost:3000/api/kot/${dummyKot.kot_id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        reason: 'Customer requested cancellation'
      }
    });

    console.log('✅ API Response Status:', res.status);
    console.log('✅ API Response Data:', res.data);

    // 4. Verify in DB if the KOT status is updated to 5 and note contains the reason
    const updatedKot = await connection.KOT.findByPk(dummyKot.kot_id);
    console.log('--- DB Record After Cancellation ---');
    console.log({
      kot_id: updatedKot.kot_id,
      is_active: updatedKot.is_active,
      status: updatedKot.status,
      note: updatedKot.note,
      extra_details: updatedKot.extra_details
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing KOT API test:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

testKotApiCancel();
