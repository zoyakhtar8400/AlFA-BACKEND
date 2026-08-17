require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');

    const oneOrder = await connection.Bill.findOne({ raw: true });
    console.log('One Bill record:');
    console.log(oneOrder);
  } catch (err) {
    console.error('Error fetching order:', err);
  }
  process.exit(0);
}

main();
