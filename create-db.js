require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres',
});

async function resetDatabase() {
  try {
    await client.connect();
    console.log('Resetting alfa_restaurant database...');

    // Terminate existing connections to alfa_restaurant
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'alfa_restaurant'
        AND pid <> pg_backend_pid();
    `);

    await client.query('DROP DATABASE IF EXISTS alfa_restaurant;');
    await client.query('CREATE DATABASE alfa_restaurant;');

    console.log('🎉 Clean "alfa_restaurant" database created successfully!');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
