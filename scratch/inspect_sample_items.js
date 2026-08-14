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

async function inspectMenuItems() {
  try {
    await sequelize.authenticate();
    const [items] = await sequelize.query(`
      SELECT item_id, title, kitchen_dept, sale_price 
      FROM mpos_item 
      ORDER BY item_id ASC 
      LIMIT 20;
    `);
    console.log('Sample Menu Items in DB:');
    console.table(items);

    // If any items have null kitchen_dept, map them to Main Kitchen (1) by default or based on category
    await sequelize.query(`
      UPDATE mpos_item 
      SET kitchen_dept = 1 
      WHERE kitchen_dept IS NULL OR kitchen_dept = 0;
    `);
    console.log('Mapped default kitchen_dept = 1 for any unassigned menu items.');

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectMenuItems();
