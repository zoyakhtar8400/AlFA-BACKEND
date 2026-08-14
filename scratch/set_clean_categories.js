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

async function setCleanCategories() {
  try {
    await sequelize.authenticate();

    // Map departments to their dedicated station printers
    await sequelize.query(`UPDATE mpos_kitchen_department SET kitchen_dept_name = 'Main Kitchen', name = 'Main Kitchen', printer_id = 1 WHERE id = 1;`);
    await sequelize.query(`UPDATE mpos_kitchen_department SET kitchen_dept_name = 'Tandoor Section', name = 'Tandoor Section', printer_id = 2 WHERE id = 2;`);
    await sequelize.query(`UPDATE mpos_kitchen_department SET kitchen_dept_name = 'Chinese Section', name = 'Chinese Section', printer_id = 3 WHERE id = 3;`);
    await sequelize.query(`UPDATE mpos_kitchen_department SET kitchen_dept_name = 'Beverages & Pantry', name = 'Beverages & Pantry', printer_id = 4 WHERE id = 4;`);
    await sequelize.query(`UPDATE mpos_kitchen_department SET kitchen_dept_name = 'Bakery & Desserts', name = 'Bakery & Desserts', printer_id = 6 WHERE id = 5;`);

    const [cats] = await sequelize.query(`SELECT id, kitchen_dept_name, printer_id FROM mpos_kitchen_department ORDER BY id ASC;`);
    console.log('Cleaned Production Categories & Assigned Station Printers:');
    console.table(cats);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

setCleanCategories();
