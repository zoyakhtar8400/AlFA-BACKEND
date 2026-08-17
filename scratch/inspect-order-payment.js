require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');

    const onePayment = await connection.BillPayment.findOne({ raw: true });
    console.log('One BillPayment record:');
    console.log(onePayment);

    const allPayments = await connection.BillPayment.findAll({ limit: 10, raw: true });
    console.log('Sample BillPayment records:');
    console.log(allPayments);
  } catch (err) {
    console.error('Error fetching payment:', err);
  }
  process.exit(0);
}

main();
