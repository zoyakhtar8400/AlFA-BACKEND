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

async function inspectTables() {
  try {
    await sequelize.authenticate();
    const [tables] = await sequelize.query("SELECT id, table_name, table_no, max_person, order_state, extra_details FROM mpos_table ORDER BY id ASC;");
    console.log('Tables in DB:');
    tables.forEach(t => {
      console.log(`ID: ${t.id}, Name: ${t.table_name}, No: ${t.table_no}, Floor in extra: ${t.extra_details?.floor}, extra_details:`, t.extra_details);
    });

    const [floors] = await sequelize.query("SELECT * FROM hotel_floors ORDER BY id ASC;");
    console.log('\nFloors in hotel_floors:');
    floors.forEach(f => {
      console.log(`ID: ${f.id}, Name: ${f.name}, Active: ${f.active}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

inspectTables();
