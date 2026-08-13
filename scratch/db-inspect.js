require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function inspectDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL successfully.');

    const [cols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mpos_user'");
    console.log('Columns in mpos_user:', cols.map(c => c.column_name).join(', '));

    const [users] = await sequelize.query('SELECT id, username, email, type, status, store_id, password FROM mpos_user ORDER BY id ASC');
    console.log('\n--- MPOS_USER RECORDS IN POSTGRESQL ---');
    users.forEach(u => {
      const passFormat = u.password.includes(':') ? 'PBKDF2 (salt:hash)' : (u.password.startsWith('$2') ? 'BCRYPT' : 'PLAINTEXT/OTHER');
      console.log(`ID: ${u.id} | User: ${u.username} | Type: ${u.type} | Status: ${u.status} | Store: ${u.store_id} | Pass Format: ${passFormat}`);
    });

  } catch (err) {
    console.error('DB inspection failed:', err.message);
  } finally {
    await sequelize.close();
  }
}

inspectDb();
