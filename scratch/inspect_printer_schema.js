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

async function inspectPrinterSchema() {
  try {
    await sequelize.authenticate();
    console.log('--- 1. mpos_printer COLUMNS & ROWS ---');
    const [printerCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'mpos_printer'
      ORDER BY ordinal_position;
    `);
    console.table(printerCols);

    const [printerRows] = await sequelize.query(`SELECT * FROM mpos_printer LIMIT 10;`);
    console.log('Printer Rows:', printerRows);

    console.log('\n--- 2. mpos_kitchen_department COLUMNS & ROWS ---');
    const [kdCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'mpos_kitchen_department'
      ORDER BY ordinal_position;
    `);
    console.table(kdCols);

    const [kdRows] = await sequelize.query(`SELECT * FROM mpos_kitchen_department LIMIT 10;`);
    console.log('Kitchen Department Rows:', kdRows);

    console.log('\n--- 3. mpos_item (kitchen_dept & category_ref_ids) SAMPLE ROWS ---');
    const [itemRows] = await sequelize.query(`
      SELECT item_id, item_refid, title, category_ref_ids, kitchen_dept, store_id
      FROM mpos_item
      LIMIT 10;
    `);
    console.log('Item Sample Rows:', itemRows);

    console.log('\n--- 4. mpos_categories SAMPLE ROWS ---');
    const [catRows] = await sequelize.query(`
      SELECT id, category_refid, category_name, parent_ref_id, store_id
      FROM mpos_categories
      LIMIT 10;
    `);
    console.log('Category Sample Rows:', catRows);

  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    await sequelize.close();
  }
}

inspectPrinterSchema();
