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

async function listTables() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND (table_name LIKE '%order%' OR table_name LIKE '%bill%' OR table_name LIKE '%kot%');
    `);
    console.table(results);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

listTables();
