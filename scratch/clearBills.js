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

async function clearBills() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    console.log('Clearing all bills and KOTs...');
    
    await sequelize.query('TRUNCATE TABLE mpos_order CASCADE;');
    await sequelize.query('TRUNCATE TABLE mpos_order_child CASCADE;');
    await sequelize.query('TRUNCATE TABLE mpos_kot CASCADE;');
    await sequelize.query('TRUNCATE TABLE mpos_kot_item CASCADE;');

    console.log('Successfully cleared all bills and KOTs!');
  } catch (error) {
    console.error('Error clearing bills:', error.message);
  } finally {
    await sequelize.close();
  }
}

clearBills();
