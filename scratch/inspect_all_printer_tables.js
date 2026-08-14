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

async function inspectAllPrinterTables() {
  try {
    await sequelize.authenticate();
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('All Public Tables:', tables.map(t => t.table_name));

    // Check columns of mpos_kitchen_department
    const [kdCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mpos_kitchen_department';
    `);
    console.log('mpos_kitchen_department columns:', kdCols);

    // Check columns of mpos_printer
    const [pCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mpos_printer';
    `);
    console.log('mpos_printer columns:', pCols);

    // Check if mpos_settings has any printer configs
    const [settings] = await sequelize.query(`
      SELECT * FROM mpos_settings LIMIT 10;
    `);
    console.log('mpos_settings sample:', settings);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectAllPrinterTables();
