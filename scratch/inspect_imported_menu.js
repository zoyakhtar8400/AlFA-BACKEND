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

async function inspectImportedMenu() {
  try {
    await sequelize.authenticate();
    const [items] = await sequelize.query(`
      SELECT i.item_id, i.title, i.sale_price, i.food_type, i.kitchen_dept, k.kitchen_dept_name, p.title as printer_name
      FROM mpos_item i
      LEFT JOIN mpos_kitchen_department k ON k.id = i.kitchen_dept
      LEFT JOIN mpos_printer p ON p.id = k.printer_id
      WHERE i.active = 1
      ORDER BY i.item_id DESC
      LIMIT 25;
    `);
    console.log('--- RECENTLY IMPORTED MENU ITEMS (Sample of 25) ---');
    console.table(items);

    const [categorySummary] = await sequelize.query(`
      SELECT COALESCE(k.kitchen_dept_name, 'Unassigned') as station, COALESCE(p.title, 'No Printer') as assigned_printer, COUNT(i.item_id) as total_items
      FROM mpos_item i
      LEFT JOIN mpos_kitchen_department k ON k.id = i.kitchen_dept
      LEFT JOIN mpos_printer p ON p.id = k.printer_id
      WHERE i.active = 1
      GROUP BY k.kitchen_dept_name, p.title
      ORDER BY total_items DESC;
    `);
    console.log('\n--- MENU ITEMS STATION & PRINTER DISTRIBUTION ---');
    console.table(categorySummary);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectImportedMenu();
