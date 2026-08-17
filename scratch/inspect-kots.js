require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');
    
    const kots = await connection.KOT.findAll({ raw: true });
    console.log('KOT records in DB:');
    console.log(kots.map(k => ({ kot_id: k.kot_id, store_id: k.store_id, is_active: k.is_active, status: k.status, table_id: k.table_id })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();
