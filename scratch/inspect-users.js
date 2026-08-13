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

async function inspectUsers() {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT id, username, email, type, "userCategory", status, store_id FROM mpos_user');
    console.log('Users in mpos_user:', users);
    const [userOutlets] = await sequelize.query('SELECT * FROM mpos_user_outlet');
    console.log('User outlets in mpos_user_outlet:', userOutlets);
  } catch (err) {
    console.error('Error inspecting users:', err.message);
  } finally {
    await sequelize.close();
  }
}

inspectUsers();
