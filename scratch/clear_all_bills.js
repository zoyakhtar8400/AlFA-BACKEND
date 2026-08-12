require('dotenv').config();
const db = require('../src/com/tmbill/js/database');

async function clearAllBills() {
  console.log('========================================================================');
  console.log('  ALFA HMS — CLEARING ALL BILLS & KOTS FROM POSTGRESQL DATABASE         ');
  console.log('========================================================================\n');

  try {
    // 1. Delete all Bill items & Bills
    if (db.BillItem) {
      await db.BillItem.destroy({ where: {}, truncate: true, cascade: true }).catch(() => db.BillItem.destroy({ where: {} }));
      console.log('  ✓ Cleared all Bill items');
    }
    if (db.Bill) {
      await db.Bill.destroy({ where: {}, truncate: true, cascade: true }).catch(() => db.Bill.destroy({ where: {} }));
      console.log('  ✓ Cleared all Bills');
    }

    // 2. Delete all KOT items & KOTs
    if (db.KOTItem) {
      await db.KOTItem.destroy({ where: {}, truncate: true, cascade: true }).catch(() => db.KOTItem.destroy({ where: {} }));
      console.log('  ✓ Cleared all KOT items');
    }
    if (db.KOT) {
      await db.KOT.destroy({ where: {}, truncate: true, cascade: true }).catch(() => db.KOT.destroy({ where: {} }));
      console.log('  ✓ Cleared all KOTs');
    }

    // 3. Reset all tables to AVAILABLE / blank state
    if (db.Table) {
      await db.Table.update({
        order_state: 'AVAILABLE',
        extra_details: {
          amount: 0,
          kot_status: 'NONE',
          payment_status: 'UNPAID',
          customer: 'Walk-in',
          waiter: null
        }
      }, { where: {} });
      console.log('  ✓ Reset all tables to AVAILABLE / blank state');
    }

    console.log('\n========================================================================');
    console.log('  ALL BILLS, KOTS, AND TEST RECORDS CLEARED SUCCESSFULLY!               ');
    console.log('========================================================================');
  } catch (err) {
    console.error('Error clearing database records:', err);
    process.exit(1);
  }
  process.exit(0);
}

clearAllBills();
