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

async function setupStandardPrinters() {
  try {
    await sequelize.authenticate();
    
    // Check if mpos_printer needs printer_name column as alias or update existing title/device_name
    await sequelize.query(`
      UPDATE mpos_printer 
      SET title = 'Kitchen Printer ' || id, device_name = 'Kitchen Printer ' || id, device_address = '192.168.1.10' || id
      WHERE title IS NULL OR title = '';
    `);

    // Ensure we have primary standard printers
    const [existingPrinters] = await sequelize.query(`SELECT id, title, device_name, device_address FROM mpos_printer WHERE is_active = 1;`);
    console.log('Active printers in DB:', existingPrinters);

    const mainPrinterId = existingPrinters[0]?.id || 1;

    // Assign main printer to any production category that currently has null printer_id
    await sequelize.query(`
      UPDATE mpos_kitchen_department 
      SET printer_id = ${mainPrinterId}
      WHERE printer_id IS NULL;
    `);

    const [updatedCats] = await sequelize.query(`
      SELECT id, kitchen_dept_name, printer_id 
      FROM mpos_kitchen_department;
    `);
    console.log('Updated production categories in DB:');
    console.table(updatedCats);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

setupStandardPrinters();
