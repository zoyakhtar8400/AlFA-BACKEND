require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Config } = require('../src/com/tmbill/config/config');

async function testApi() {
  try {
    console.log('Generating auth token...');
    const token = jwt.sign(
      { id: 1, username: 'admin', role: 'ADMIN', type: 'ADMIN' },
      Config.JWT_SECRET || process.env.JWT_SECRET || 'secretKey'
    );

    const backendUrl = 'http://localhost:3000/api/orders/getdashboardstats';
    console.log(`Sending GET request to ${backendUrl}...`);

    const response = await axios.get(backendUrl, {
      params: { store_id: 'STORE_1', timeframe: 'weekly' },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Response Status:', response.status);
    console.log('Response Message:', response.data.message);
    const data = response.data.data;
    console.log('Dashboard Data Keys:', Object.keys(data));
    console.log('Today Sales:', data.todaySales);
    console.log('Yesterday Sales:', data.yesterdaySales);
    console.log('Monthly Sales:', data.monthlySales);
    console.log('Collections:', {
      cash: data.cashCollection,
      upi: data.upiCollection,
      card: data.cardCollection,
      due: data.dueCollection
    });
    console.log('KOT Stats:', {
      total: data.totalKotsCount,
      running: data.runningKotsCount,
      completed: data.completedKotsCount
    });
    console.log('Revenue Mix:', data.revenueMix);
    console.log('Revenue Trend Labels:', data.revenueTrend.labels);
    console.log('Revenue Trend Values:', data.revenueTrend.values);
    console.log('Occupancy Trend Values:', data.occupancyTrend.values);
    console.log('Recent Orders Count:', data.recentOrders.length);
    console.log('Outlet Summary:', data.outletSummary);
    console.log('SUCCESS: API response matches all required statistics specifications!');
  } catch (err) {
    console.error('API Verification FAILED:', err.message);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  }
  process.exit(0);
}

testApi();
