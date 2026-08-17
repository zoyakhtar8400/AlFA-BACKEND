require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected.');

    const results = await connection.BillPayment.findAll({
      attributes: ['payment_option', [connection.sequelize.fn('COUNT', 'id'), 'count']],
      group: ['payment_option'],
      raw: true
    });
    console.log('Unique payment_options in mpos_order_payment:', results);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
