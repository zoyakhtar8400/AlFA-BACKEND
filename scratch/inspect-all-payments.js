require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected.');

    const results = await connection.Bill.findAll({
      attributes: ['payment', [connection.sequelize.fn('COUNT', 'id'), 'count']],
      group: ['payment'],
      raw: true
    });
    console.log('Unique payments in mpos_order:', results);

    const states = await connection.Bill.findAll({
      attributes: ['order_state', [connection.sequelize.fn('COUNT', 'id'), 'count']],
      group: ['order_state'],
      raw: true
    });
    console.log('Unique order_states in mpos_order:', states);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
