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

async function migrate() {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TABLE mpos_table_reservations ADD COLUMN IF NOT EXISTS booking_date VARCHAR(50);");
    await sequelize.query("ALTER TABLE mpos_table_reservations ADD COLUMN IF NOT EXISTS booking_time VARCHAR(50);");
    console.log('Successfully added booking_date and booking_time columns to mpos_table_reservations!');
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
