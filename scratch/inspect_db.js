require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function inspectDb() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected.');

    const tables = await connection.Table.findAll({
      attributes: [[connection.sequelize.fn('DISTINCT', connection.sequelize.col('store_id')), 'store_id']],
      raw: true
    });
    console.log('Unique Table store_id:', tables);

    const kots = await connection.KOT.findAll({
      attributes: [[connection.sequelize.fn('DISTINCT', connection.sequelize.col('store_id')), 'store_id']],
      raw: true
    });
    console.log('Unique KOT store_id:', kots);

    const bills = await connection.Bill.findAll({
      attributes: [[connection.sequelize.fn('DISTINCT', connection.sequelize.col('store_id')), 'store_id']],
      raw: true
    });
    console.log('Unique Bill store_id:', bills);
  } catch (err) {
    console.error('Error inspecting DB:', err);
  } finally {
    process.exit(0);
  }
}

inspectDb();
