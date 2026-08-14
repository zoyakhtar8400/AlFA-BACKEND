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

async function verifyAndMigrateKitchenDept() {
  try {
    await sequelize.authenticate();
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mpos_kitchen_department';
    `);
    console.log('Columns in mpos_kitchen_department:', cols.map(c => c.column_name));

    const hasPrinterId = cols.some(c => c.column_name === 'printer_id');
    if (!hasPrinterId) {
      console.log('Adding printer_id column to mpos_kitchen_department...');
      await sequelize.query(`
        ALTER TABLE mpos_kitchen_department 
        ADD COLUMN printer_id INTEGER REFERENCES mpos_printer(id) ON DELETE SET NULL;
      `);
      console.log('✅ printer_id column added successfully!');
    } else {
      console.log('✅ printer_id column already exists.');
    }

    const [rows] = await sequelize.query(`SELECT * FROM mpos_kitchen_department LIMIT 5;`);
    console.log('Sample rows in mpos_kitchen_department:', rows);
  } catch (err) {
    console.error('Error migrating kitchen department table:', err);
  } finally {
    await sequelize.close();
  }
}

verifyAndMigrateKitchenDept();
