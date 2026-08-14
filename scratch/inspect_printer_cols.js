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

async function inspectPrinterCols() {
  try {
    await sequelize.authenticate();
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mpos_printer';
    `);
    console.log('Columns in mpos_printer:', cols);

    const [rows] = await sequelize.query(`SELECT * FROM mpos_printer;`);
    console.log('Rows in mpos_printer:', rows);

    const [cats] = await sequelize.query(`SELECT * FROM mpos_kitchen_department;`);
    console.log('Rows in mpos_kitchen_department:', cats);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectPrinterCols();
