require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');
    const users = await connection.User.findAll({ raw: true });
    console.log('Users:');
    console.log(users.map(u => ({ id: u.id, username: u.username, phone: u.phone, email: u.email, pin: u.pin, store_id: u.store_id })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();
