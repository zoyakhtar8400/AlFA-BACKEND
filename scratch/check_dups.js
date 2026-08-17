require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function checkDups() {
  try {
    global.serverdbConnection = connection;
    await connection.sequelize.authenticate();
    
    const kots = await connection.KOT.findAll({
      where: { is_active: 0, status: 5 }, // Cancelled KOTs
      raw: true
    });

    const duplicates = {};
    kots.forEach(k => {
      const key = k.custom_bill_number;
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(k.kot_id);
    });

    let foundDups = false;
    for (const [billNo, ids] of Object.entries(duplicates)) {
      if (ids.length > 1) {
        console.log(`Duplicate KOTs found for ${billNo}: kot_ids = ${ids.join(', ')}`);
        foundDups = true;
      }
    }

    if (!foundDups) {
      console.log('No database duplicates found for custom_bill_number.');
      // Check for table + items duplicate?
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

checkDups();
