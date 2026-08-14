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

async function checkStores() {
  try {
    await sequelize.authenticate();
    const [stores] = await sequelize.query("SELECT * FROM mpos_store ORDER BY id ASC;");
    console.log('Stores in mpos_store:', stores.map(s => ({ id: s.id, store_id: s.store_id, name: s.store_name, settings: s.settings })));

    const [deps] = await sequelize.query("SELECT * FROM mpos_department ORDER BY id ASC;");
    console.log('Departments in mpos_department:', deps.map(d => ({ id: d.id, store_id: d.store_id, name: d.department_name })));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkStores();
