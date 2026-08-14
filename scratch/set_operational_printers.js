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

async function setOperationalPrinterNames() {
  try {
    await sequelize.authenticate();

    // Specific operational station names for active printers
    const stationNames = [
      'Main Kitchen Printer',
      'Tandoor Printer',
      'Chinese Printer',
      'Beverage Printer',
      'Bar Printer',
      'Dessert & Bakery Printer',
      'Billing Desk Printer',
      'Takeaway Printer',
      'Room Service Printer',
      'Banquet Printer',
      'Kitchen Sub-Station 1',
      'Kitchen Sub-Station 2',
      'Kitchen Sub-Station 3'
    ];

    const [printers] = await sequelize.query(`SELECT id, title, device_name, device_address FROM mpos_printer ORDER BY id ASC;`);
    console.log('Current Printers in DB before update:');
    console.table(printers);

    for (let i = 0; i < printers.length; i++) {
      const p = printers[i];
      const newName = stationNames[i] || `Kitchen Station Printer ${p.id}`;
      await sequelize.query(`
        UPDATE mpos_printer 
        SET title = '${newName}', device_name = '${newName}'
        WHERE id = ${p.id};
      `);
    }

    const [updatedPrinters] = await sequelize.query(`SELECT id, title, device_name, device_address, store_id, is_active FROM mpos_printer ORDER BY id ASC;`);
    console.log('\nUpdated Operational Printers in DB:');
    console.table(updatedPrinters);

    // Let's also check and map production categories nicely
    const [categories] = await sequelize.query(`SELECT id, kitchen_dept_name, printer_id FROM mpos_kitchen_department ORDER BY id ASC;`);
    console.log('\nCurrent Production Categories in DB:');
    console.table(categories);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

setOperationalPrinterNames();
