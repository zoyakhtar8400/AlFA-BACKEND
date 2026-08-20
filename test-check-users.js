require('dotenv').config();
const db = require('./src/com/tmbill/js/database');

async function checkUsers() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');
    const users = await db.User.findAll({ raw: true });
    console.log('Seeded Users:');
    users.forEach(u => {
      console.log({
        id: u.id,
        username: u.username,
        email: u.email,
        status: u.status,
        type: u.type,
        userCategory: u.userCategory,
        password_preview: u.password ? u.password.substring(0, 20) + '...' : null
      });
    });
  } catch (error) {
    console.error('Error connecting or querying database:', error);
  }
  process.exit(0);
}

checkUsers();
