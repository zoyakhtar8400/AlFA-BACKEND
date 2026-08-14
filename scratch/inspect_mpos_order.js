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

async function inspectMposOrder() {
  try {
    await sequelize.authenticate();
    const [orders] = await sequelize.query(`
      SELECT id, custom_bill_number, table_id, table_name, total_amount, order_state, payment_status, created_at 
      FROM mpos_order 
      ORDER BY id DESC 
      LIMIT 10;
    `);
    console.log('--- RECENT ORDERS IN mpos_order ---');
    console.table(orders);

    const [kots] = await sequelize.query(`
      SELECT kot_id, kot_number, table_id, table_name, amount, is_active, status 
      FROM mpos_kot 
      ORDER BY kot_id DESC 
      LIMIT 10;
    `);
    console.log('\n--- RECENT KOTS IN mpos_kot ---');
    console.table(kots);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectMposOrder();
