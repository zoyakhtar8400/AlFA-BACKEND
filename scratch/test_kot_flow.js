const axios = require('axios');

async function testKotFlow() {
  try {
    // 1. Create a KOT for table 1 via POST /api/kot
    const createRes = await axios.post('http://localhost:3000/api/kot', {
      kotNo: 'KOT-TEST-001',
      tableId: 1,
      tableNo: '01',
      customerName: 'Test Customer',
      mobileNo: '9876543210',
      waiter: 'Staff',
      items: [
        { itemId: 1, itemName: 'Butter Naan', qty: 2, unitPrice: 40, total: 80 },
        { itemId: 2, itemName: 'Paneer Butter Masala', qty: 1, unitPrice: 220, total: 220 }
      ]
    });
    console.log('Create KOT status:', createRes.status);

    // 2. Fetch KOTs without filter
    const getResAll = await axios.get('http://localhost:3000/api/kot?active=all');
    console.log('GET /api/kot?active=all count:', getResAll.data?.data?.length);

    // 3. Fetch KOTs with table_id=1
    const getResTable1 = await axios.get('http://localhost:3000/api/kot?tableId=1');
    console.log('GET /api/kot?tableId=1 count:', getResTable1.data?.data?.length);
    console.log('GET /api/kot?tableId=1 items:', JSON.stringify(getResTable1.data?.data?.[0]?.items, null, 2));

    // 4. Fetch KOTs with table_no=01
    const getResTableStr = await axios.get('http://localhost:3000/api/kot?table_no=01');
    console.log('GET /api/kot?table_no=01 count:', getResTableStr.data?.data?.length);
  } catch (err) {
    console.error('Error testing KOT flow:', err.response?.data || err.message);
  }
}

testKotFlow();
