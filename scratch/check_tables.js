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

async function checkTables() {
  try {
    await sequelize.authenticate();
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mpos_table';
    `);
    console.log('Columns in mpos_table:', cols.map(c => c.column_name));

    const [tables] = await sequelize.query(`
      SELECT * FROM mpos_table;
    `);
    console.log(`Total rows in mpos_table: ${tables.length}`);
    console.log('mpos_table rows:', tables);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkTables();
