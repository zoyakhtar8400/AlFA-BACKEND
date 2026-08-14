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

async function inspectItemColumns() {
  try {
    await sequelize.authenticate();
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mpos_item';
    `);
    console.log('Columns in mpos_item:');
    console.table(cols);

    const [existing] = await sequelize.query(`SELECT COUNT(*) as total_items FROM mpos_item;`);
    console.log('Total items currently in DB:', existing[0].total_items);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectItemColumns();
