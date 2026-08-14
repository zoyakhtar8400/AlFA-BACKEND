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

async function checkActiveKots() {
  try {
    await sequelize.authenticate();
    const [kots] = await sequelize.query(`
      SELECT k.kot_id, k.kot_number, k.table_id, k.table_name, k.amount, k.is_active, k.status, t.order_state as table_order_state, t.extra_details
      FROM mpos_kot k
      LEFT JOIN mpos_table t ON t.id = k.table_id
      WHERE k.is_active = 1
      ORDER BY k.kot_id DESC;
    `);
    console.log(`Found ${kots.length} KOTs with is_active = 1:`);
    console.table(kots);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkActiveKots();
