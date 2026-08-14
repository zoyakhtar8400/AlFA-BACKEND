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

async function checkStoresAndTables() {
  try {
    await sequelize.authenticate();
    const [stores] = await sequelize.query(`SELECT id, store_id, store_name, user_phone, settings FROM mpos_store;`);
    console.log('--- STORES IN mpos_store ---');
    console.table(stores);

    const [tables] = await sequelize.query(`SELECT id, table_name, store_id, department, extra_details FROM mpos_table;`);
    console.log('--- TABLES IN mpos_table ---');
    console.log(tables);

    const [deps] = await sequelize.query(`SELECT id, department_name, store_id FROM mpos_department;`);
    console.log('--- DEPARTMENTS IN mpos_department ---');
    console.table(deps);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkStoresAndTables();
