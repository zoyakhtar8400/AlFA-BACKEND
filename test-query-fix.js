require('dotenv').config();
const connection = require('./src/com/tmbill/js/database');

async function testQueryFix() {
  await connection.sequelize.authenticate();
  
  const fromDate = '2026-08-12 00:00:00';
  const toDate = '2026-08-12 23:59:59';
  const startDateOnly = '2026-08-12';
  const endDateOnly = '2026-08-12';

  const storeId = 1;

  const whereData = {
    [connection.Sequelize.Op.and]: [
      {
        [connection.Sequelize.Op.or]: [
          { store_id: '1' },
          { store_id: 'STORE_1' }
        ]
      },
      {
        my_order_date: { [connection.Sequelize.Op.between]: [startDateOnly, endDateOnly] }
      }
    ]
  };

  const bills = await connection.Bill.findAll({
    where: whereData,
    raw: true
  });

  console.log('--- QUERY RESULT WITH REPAIRED DATE & STORE_ID CLAUSE ---');
  console.log('Bills matched count:', bills.length);
  bills.forEach((b, i) => {
    console.log(`${i+1}. Bill #${b.bill_number || b.custom_bill_number}, store_id: ${b.store_id}, my_order_date: ${b.my_order_date}, created_time: ${b.created_time}, total: ${b.order_total}`);
  });

  process.exit(0);
}

testQueryFix();
