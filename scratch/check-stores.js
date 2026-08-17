require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');
    const stores = await connection.Store.findAll({ raw: true });
    console.log('Stores list:');
    console.log(stores.map(s => ({ id: s.id, name: s.name, store_name: s.store_name })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();
