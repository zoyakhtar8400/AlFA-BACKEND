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

async function inspect() {
  try {
    await sequelize.authenticate();
    const [cols] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mpos_table_reservations';");
    console.log('Columns in mpos_table_reservations:');
    cols.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    
    const [rows] = await sequelize.query('SELECT * FROM mpos_table_reservations ORDER BY id DESC LIMIT 5;');
    console.log('Sample rows:', rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

inspect();
