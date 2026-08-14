require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false
  }
);

async function settleTable2() {
  try {
    await sequelize.authenticate();

    // Settle orders for table 2
    await sequelize.query(`
      UPDATE mpos_order_master 
      SET order_state = 'completed', payment_status = 'Paid' 
      WHERE table_id = '2' OR table_name ILIKE '%T02%' OR table_name ILIKE '%T2%' OR table_name ILIKE '%Table 2%';
    `);

    // Close KOTs for table 2
    await sequelize.query(`
      UPDATE mpos_kot 
      SET status = 6 
      WHERE table_id = 2;
    `);

    const [bills] = await sequelize.query(`
      SELECT id, custom_bill_number, table_id, table_name, total_amount, order_state, payment_status 
      FROM mpos_order_master 
      ORDER BY id DESC 
      LIMIT 10;
    `);
    console.log('Recent Bills in PostgreSQL:');
    console.table(bills);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

settleTable2();
