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

async function inspectPrintersAndCategories() {
  try {
    await sequelize.authenticate();
    const [printers] = await sequelize.query(`SELECT id, printer_name, printer_ip, printer_type, is_active FROM mpos_printer;`);
    console.log('--- PRINTERS IN mpos_printer ---');
    console.table(printers);

    const [cats] = await sequelize.query(`SELECT id, name, kitchen_dept_name, printer_id, is_active FROM mpos_kitchen_department;`);
    console.log('--- PRODUCTION CATEGORIES IN mpos_kitchen_department ---');
    console.table(cats);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectPrintersAndCategories();
