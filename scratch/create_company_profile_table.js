require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

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

async function initTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS hotel_company_profile (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        logo TEXT,
        gstin VARCHAR(50),
        fssai VARCHAR(50),
        address TEXT,
        state VARCHAR(100),
        city VARCHAR(100),
        country VARCHAR(100),
        license_key VARCHAR(255),
        store_id VARCHAR(50) DEFAULT 'STORE_1',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Table hotel_company_profile ensured in PostgreSQL.');

    const [rows] = await sequelize.query(`SELECT * FROM hotel_company_profile;`);
    console.log('Existing company profiles count:', rows.length);
  } catch (err) {
    console.error('Error creating hotel_company_profile table:', err);
  } finally {
    await sequelize.close();
  }
}

initTable();
