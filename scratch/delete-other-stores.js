require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');

    // 1. Delete tables associated with stores other than STORE_1
    console.log('Deleting tables for other stores...');
    const deletedTables = await connection.Table.destroy({
      where: {
        store_id: {
          [connection.Sequelize.Op.ne]: 'STORE_1'
        }
      }
    });
    console.log(`Deleted ${deletedTables} table records.`);

    // 2. Delete stores other than id = 1
    console.log('Deleting other stores...');
    const deletedStores = await connection.Store.destroy({
      where: {
        id: {
          [connection.Sequelize.Op.ne]: 1
        }
      }
    });
    console.log(`Deleted ${deletedStores} store records.`);
    
    // 3. Confirm remaining stores
    const stores = await connection.Store.findAll({ raw: true });
    console.log('Remaining stores in DB:', stores.map(s => ({ id: s.id, store_name: s.store_name, store_id: s.store_id })));
  } catch (err) {
    console.error('ERROR during deletion:', err);
  }
  process.exit(0);
}

main();
