const axios = require('axios');

async function testGetKot() {
  try {
    const res = await axios.get('http://localhost:3000/kot?active=all');
    console.log('GET /kot?active=all status:', res.status);
    console.log('Result count:', res.data?.data?.length || res.data?.kots?.length || 0);
    console.log('First 2 KOTs:', JSON.stringify(res.data?.data?.slice(0, 2) || [], null, 2));
  } catch (err) {
    console.error('Error fetching KOTs:', err.message);
  }
}

testGetKot();
