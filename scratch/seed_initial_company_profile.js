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

async function seedCompany() {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(`SELECT * FROM hotel_company_profile LIMIT 1;`);
    if (rows.length === 0) {
      await sequelize.query(`
        INSERT INTO hotel_company_profile (
          company_name, phone, email, logo, gstin, fssai, address, state, city, country, license_key, store_id
        ) VALUES (
          'ALFA Restaurant & Hotel',
          '+91 9876543210',
          'info@alfahms.com',
          '',
          '09AAACA1234A1Z5',
          '10019051000001',
          'Main Road, Civil Lines',
          'Uttar Pradesh',
          'Gorakhpur',
          'India',
          'ALFA-HMS-PRO-2026',
          'STORE_1'
        );
      `);
      console.log('Seeded real initial company profile in PostgreSQL.');
    } else {
      console.log('Company profile already exists:', rows[0].company_name);
    }
  } catch (err) {
    console.error('Error seeding company profile:', err.message);
  } finally {
    await sequelize.close();
  }
}

seedCompany();
