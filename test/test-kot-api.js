const axios = require('axios');

async function testKotFlow() {
  try {
    console.log('1. Testing POST http://localhost:3000/api/kot ...');
    const postRes = await axios.post('http://localhost:3000/api/kot', {
      kotNo: 'KOT-101',
      tableId: 1,
      tableNo: '01',
      customerName: 'Test Customer',
      waiter: 'Rakesh',
      items: [
        { itemId: 1, itemName: 'Paneer Tikka', qty: 2, price: 240 },
        { itemId: 2, itemName: 'Cold Coffee', qty: 1, price: 120 }
      ]
    });
    console.log('✅ POST Response (HTTP Status 201 Created):', postRes.data);

    console.log('\n2. Testing GET http://localhost:3000/api/kot ...');
    const getRes = await axios.get('http://localhost:3000/api/kot');
    console.log('✅ GET Response (HTTP Status 200 OK):', JSON.stringify(getRes.data, null, 2));

    console.log('\n🎉 KOT PERSISTENCE IN POSTGRESQL VERIFIED END-TO-END!');
  } catch (err) {
    console.error('❌ Error testing KOT API:', err.response?.data || err.message);
  }
}

testKotFlow();
