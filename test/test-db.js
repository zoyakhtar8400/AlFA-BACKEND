require('dotenv').config();
const { Sequelize } = require('sequelize');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'alfa_restaurant';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

console.log(`Connecting to PostgreSQL at ${DB_HOST}:${DB_PORT}/${DB_NAME} as user ${DB_USER}...`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL Connected Successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  });
