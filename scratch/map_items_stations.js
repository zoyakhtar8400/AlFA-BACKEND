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

async function mapItemsToKitchenStations() {
  try {
    await sequelize.authenticate();

    // Map by item name patterns to appropriate kitchen department
    await sequelize.query(`UPDATE mpos_item SET kitchen_dept = 2 WHERE title ILIKE '%tikka%' OR title ILIKE '%kebab%' OR title ILIKE '%tandoor%' OR title ILIKE '%naan%' OR title ILIKE '%roti%';`);
    await sequelize.query(`UPDATE mpos_item SET kitchen_dept = 3 WHERE title ILIKE '%rice%' OR title ILIKE '%noodle%' OR title ILIKE '%manchurian%' OR title ILIKE '%chilli%' OR title ILIKE '%chinese%';`);
    await sequelize.query(`UPDATE mpos_item SET kitchen_dept = 4 WHERE title ILIKE '%coke%' OR title ILIKE '%cola%' OR title ILIKE '%coffee%' OR title ILIKE '%tea%' OR title ILIKE '%soda%' OR title ILIKE '%juice%' OR title ILIKE '%water%' OR title ILIKE '%shake%' OR title ILIKE '%beverage%';`);
    await sequelize.query(`UPDATE mpos_item SET kitchen_dept = 5 WHERE title ILIKE '%jamun%' OR title ILIKE '%cake%' OR title ILIKE '%ice cream%' OR title ILIKE '%dessert%' OR title ILIKE '%pastry%';`);
    await sequelize.query(`UPDATE mpos_item SET kitchen_dept = 1 WHERE kitchen_dept IS NULL OR kitchen_dept = 0;`);

    const [sampleMapped] = await sequelize.query(`
      SELECT m.item_id, m.title, m.kitchen_dept, k.kitchen_dept_name as station_name, p.title as printer_name
      FROM mpos_item m
      LEFT JOIN mpos_kitchen_department k ON k.id = m.kitchen_dept
      LEFT JOIN mpos_printer p ON p.id = k.printer_id
      ORDER BY m.item_id ASC
      LIMIT 15;
    `);

    console.log('Sample Mapped Menu Items in PostgreSQL:');
    console.table(sampleMapped);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

mapItemsToKitchenStations();
