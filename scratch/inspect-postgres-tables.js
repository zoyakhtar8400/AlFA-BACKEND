require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');

    const results = await connection.sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`,
      { type: connection.sequelize.QueryTypes.SELECT }
    );
    console.log('PostgreSQL Tables:');
    console.log(results.map(r => r[0]));
  } catch (err) {
    console.error('Error listing tables:', err);
  }
  process.exit(0);
}

main();
