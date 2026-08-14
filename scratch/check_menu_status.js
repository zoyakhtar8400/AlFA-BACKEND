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

async function checkMenu() {
  try {
    await sequelize.authenticate();
    const [items] = await sequelize.query(`SELECT COUNT(*) as total_items FROM mpos_item;`);
    const [activeItems] = await sequelize.query(`SELECT COUNT(*) as active_items FROM mpos_item WHERE active = 1;`);
    
    console.log('--- POSTGRESQL MENU STATUS ---');
    console.log(`Total Menu Items in DB: ${items[0].total_items}`);
    console.log(`Active Menu Items in DB: ${activeItems[0].active_items}`);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkMenu();
