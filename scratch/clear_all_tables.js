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

async function clearAllTables() {
  try {
    await sequelize.authenticate();
    const [deleted] = await sequelize.query(`DELETE FROM mpos_table;`);
    console.log('✅ Cleared all tables from mpos_table in PostgreSQL.');

    const [remaining] = await sequelize.query(`SELECT count(*) FROM mpos_table;`);
    console.log('Remaining tables in mpos_table:', remaining);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

clearAllTables();
