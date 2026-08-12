require('dotenv').config();
const connection = require('./src/com/tmbill/js/database');

async function testDates() {
  await connection.sequelize.authenticate();
  const bills = await connection.Bill.findAll({ raw: true });
  console.log('--- DB ORDERS DATE FIELDS ---');
  bills.slice(0, 10).forEach(b => {
    console.log(`ID: ${b.id}, store_id: ${b.store_id}, created_time: "${b.created_time}", my_order_date: "${b.my_order_date}", createdDate: "${b.createdDate}"`);
  });
  process.exit(0);
}

testDates();
