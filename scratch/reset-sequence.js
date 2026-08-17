require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');

    console.log('Resetting sequence for mpos_store...');
    await connection.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('mpos_store', 'id'), coalesce((SELECT max(id) FROM mpos_store), 1), true);
    `);
    console.log('Sequence reset successfully.');
    
    // Also let's check if there are other sequence tables we can check
    console.log('Checking next value of sequence...');
    const [result] = await connection.sequelize.query(`
      SELECT nextval(pg_get_serial_sequence('mpos_store', 'id')) AS next_val;
    `);
    console.log('Next val would have been:', result[0].next_val);
    
    // Reset it back since nextval increments it!
    await connection.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('mpos_store', 'id'), coalesce((SELECT max(id) FROM mpos_store), 1), true);
    `);
  } catch (err) {
    console.error('ERROR resetting sequence:', err);
  }
  process.exit(0);
}

main();
