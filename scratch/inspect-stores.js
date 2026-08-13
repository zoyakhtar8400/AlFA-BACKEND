require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function inspectStores() {
  try {
    await sequelize.authenticate();
    const [stores] = await sequelize.query('SELECT id, store_id, store_name, person_name, store_phone FROM mpos_store');
    console.log('Stores in mpos_store table:', stores);
  } catch (err) {
    console.error('Error querying mpos_store:', err.message);
  } finally {
    await sequelize.close();
  }
}

inspectStores();
