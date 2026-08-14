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

async function configureProductionNetworkAndBar() {
  try {
    await sequelize.authenticate();

    // 1. Assign unique distinct station IPs to each physical printer
    const printerNetworkConfig = [
      { id: 1, title: 'Main Kitchen Printer', ip: '192.168.1.100', port: 9100 },
      { id: 2, title: 'Tandoor Printer', ip: '192.168.1.101', port: 9100 },
      { id: 3, title: 'Chinese Printer', ip: '192.168.1.102', port: 9100 },
      { id: 4, title: 'Beverage Printer', ip: '192.168.1.103', port: 9100 },
      { id: 5, title: 'Bar Printer', ip: '192.168.1.104', port: 9100 },
      { id: 6, title: 'Dessert & Bakery Printer', ip: '192.168.1.105', port: 9100 },
      { id: 7, title: 'Billing Desk Printer', ip: '192.168.1.107', port: 9100 }
    ];

    for (const p of printerNetworkConfig) {
      await sequelize.query(`
        UPDATE mpos_printer 
        SET title = '${p.title}', device_name = '${p.title}', device_address = '${p.ip}', printer_port_number = '${p.port}'
        WHERE id = ${p.id};
      `);
    }

    // 2. Ensure Bar section exists in mpos_kitchen_department and maps to Bar Printer (ID: 5)
    const [existingBar] = await sequelize.query(`SELECT id FROM mpos_kitchen_department WHERE kitchen_dept_name ILIKE '%bar%' OR id = 6;`);
    if (existingBar.length > 0) {
      await sequelize.query(`
        UPDATE mpos_kitchen_department 
        SET kitchen_dept_name = 'Bar & Spirits', name = 'Bar & Spirits', printer_id = 5, is_active = 1
        WHERE id = ${existingBar[0].id};
      `);
    } else {
      await sequelize.query(`
        INSERT INTO mpos_kitchen_department (kitchen_dept_name, name, printer_id, is_active, store_id)
        VALUES ('Bar & Spirits', 'Bar & Spirits', 5, 1, 1);
      `);
    }

    // Output verification
    const [printers] = await sequelize.query(`
      SELECT id, title, device_address as ip_address, printer_port_number as port, is_active 
      FROM mpos_printer 
      WHERE id <= 7 
      ORDER BY id ASC;
    `);
    console.log('--- DISTINCT PHYSICAL PRINTER NETWORK CONFIGURATION ---');
    console.table(printers);

    const [departments] = await sequelize.query(`
      SELECT k.id as category_id, k.kitchen_dept_name, k.printer_id, p.title as assigned_printer, p.device_address as printer_ip
      FROM mpos_kitchen_department k
      LEFT JOIN mpos_printer p ON p.id = k.printer_id
      ORDER BY k.id ASC;
    `);
    console.log('\n--- PRODUCTION CATEGORIES TO STATION PRINTER LINKAGE ---');
    console.table(departments);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

configureProductionNetworkAndBar();
