require('dotenv').config();
const connection = require('./src/com/tmbill/js/database');

async function checkDb() {
  await connection.sequelize.authenticate();
  const bills = await connection.Bill.findAll({ raw: true });
  console.log('--- MPOS_ORDER RECORDS ---');
  console.log('Total bills count:', bills.length);
  bills.forEach(b => {
    console.log({
      id: b.id,
      order_id: b.order_id,
      store_id: b.store_id,
      type_store_id: typeof b.store_id,
      bill_number: b.bill_number,
      custom_bill_number: b.custom_bill_number,
      order_state: b.order_state,
      created_time: b.created_time,
      order_total: b.order_total,
      createdBy: b.createdBy
    });
  });
  process.exit(0);
}

checkDb();
