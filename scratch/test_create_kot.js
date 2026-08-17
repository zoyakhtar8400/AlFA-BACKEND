require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function testCreateKot() {
  try {
    const tableId = 177;
    const kotData = {
      custom_bill_number: 'KOT-TEST-999',
      table_id: tableId,
      table_name: 'T02',
      customer_name: 'Walk-in',
      customer_mobile: '',
      store_id: 'STORE_1',
      status: 1,
      in_time: '02:30 PM',
      kot_date: new Date(),
      waiter: 'Staff',
      amount: 400,
      is_active: 1
    };

    const created = await connection.KOT.create(kotData);
    console.log('Created KOT:', created.toJSON());

    const item = await connection.KOTItem.create({
      kot_id: created.kot_id,
      item_id: 1,
      item_name: 'Test Paneer Butter Masala',
      alternative_title: '',
      quantity: 2,
      item_price: 200,
      amount: 400,
      store_id: 'STORE_1'
    });
    console.log('Created KOT Item:', item.toJSON());

    // Now query KOTs
    const allKots = await connection.KOT.findAll({ raw: true });
    console.log('All KOTs count:', allKots.length);

    const allItems = await connection.KOTItem.findAll({ raw: true });
    console.log('All KOT Items count:', allItems.length);
  } catch (err) {
    console.error('Error in testCreateKot:', err);
  } finally {
    process.exit(0);
  }
}

testCreateKot();
