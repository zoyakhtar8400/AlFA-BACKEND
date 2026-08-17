require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'alfa_restaurant',
});

async function clearAllBillsAndKOTs() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database: alfa_restaurant');

    console.log('🧹 Clearing all KOT and Order / Bill tables...');

    // 1. Delete KOT and KOT Child/Charges tables
    const kotTables = [
      'mpos_kot_charges',
      'mpos_kot_item',
      'mpos_kot'
    ];

    for (const tbl of kotTables) {
      try {
        await client.query(`TRUNCATE TABLE "${tbl}" CASCADE;`);
        console.log(`✅ Truncated table: ${tbl}`);
      } catch (e) {
        console.log(`ℹ️ Table ${tbl} skipped: ${e.message}`);
      }
    }

    // 2. Delete Order / Bill and Order Child/Payment tables
    const orderTables = [
      'mpos_orderchild_charges',
      'mpos_order_tip',
      'mpos_order_charges',
      'mpos_order_payment',
      'mpos_order_child',
      'mpos_due_payments',
      'mpos_order'
    ];

    for (const tbl of orderTables) {
      try {
        await client.query(`TRUNCATE TABLE "${tbl}" CASCADE;`);
        console.log(`✅ Truncated table: ${tbl}`);
      } catch (e) {
        console.log(`ℹ️ Table ${tbl} skipped: ${e.message}`);
      }
    }

    // 3. Reset Table states in mpos_table to clean free state
    try {
      await client.query(`
        UPDATE mpos_table
        SET 
          order_state = 'AVAILABLE',
          table_color = 'white',
          table_action_flag = 0,
          order_type_flag = 0,
          is_pre_order = 0,
          reservation_id = NULL,
          extra_details = jsonb_build_object(
            'floor', COALESCE(extra_details->>'floor', extra_details->>'area', 'Ground Floor'),
            'area', COALESCE(extra_details->>'area', extra_details->>'floor', 'Ground Floor'),
            'section', COALESCE(extra_details->>'section', 'Main Restaurant'),
            'amount', 0,
            'waiter', NULL,
            'customer', 'Walk-in',
            'kot_status', 'NONE',
            'payment_status', 'UNPAID'
          )
        WHERE id IS NOT NULL;
      `);
      console.log('✅ Reset all mpos_table records to free (AVAILABLE, white, flag=0, default extra_details)');
    } catch (e) {
      console.log('ℹ️ mpos_table update info:', e.message);
    }

    console.log('\n🎉 ALL Bills, Orders, KOTs, Payments, and Table states have been successfully cleared and reset!');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing bills and KOTs:', err.message);
    process.exit(1);
  }
}

clearAllBillsAndKOTs();
