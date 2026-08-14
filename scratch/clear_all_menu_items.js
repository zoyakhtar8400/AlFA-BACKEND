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

async function clearAllMenuItems() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

    const [before] = await sequelize.query(`SELECT COUNT(*) as count FROM mpos_item;`);
    console.log(`Current menu items in mpos_item: ${before[0].count}`);

    // Delete item modifier mappings and prices if any
    await sequelize.query(`DELETE FROM mpos_item_prices;`).catch(() => {});
    await sequelize.query(`DELETE FROM mpos_item_stockout_box;`).catch(() => {});
    
    // Clear all menu items
    await sequelize.query(`DELETE FROM mpos_item;`);
    await sequelize.query(`ALTER SEQUENCE IF EXISTS mpos_item_item_id_seq RESTART WITH 1;`).catch(() => {});

    const [after] = await sequelize.query(`SELECT COUNT(*) as count FROM mpos_item;`);
    console.log(`Menu items in mpos_item after deletion: ${after[0].count}`);

  } catch (err) {
    console.error('Error clearing menu items:', err);
  } finally {
    await sequelize.close();
  }
}

clearAllMenuItems();
