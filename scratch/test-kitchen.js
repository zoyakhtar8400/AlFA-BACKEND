require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');
    const models = Object.keys(connection);
    const integerStoreIdModels = [];
    const stringStoreIdModels = [];

    models.forEach(m => {
      const model = connection[m];
      if (model && model.rawAttributes) {
        const storeIdAttr = model.rawAttributes.store_id;
        if (storeIdAttr) {
          const typeName = storeIdAttr.type.constructor.name;
          if (typeName === 'INTEGER') {
            integerStoreIdModels.push(m);
          } else {
            stringStoreIdModels.push(m);
          }
        }
      }
    });

    console.log('Models with INTEGER store_id:', integerStoreIdModels);
    console.log('Models with STRING/other store_id:', stringStoreIdModels);
  } catch (err) {
    console.error('CRASHED:', err);
  }
  process.exit(0);
}

main();
