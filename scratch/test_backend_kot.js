require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');
const fs = require('fs');

async function testKotCancel() {
  try {
    global.serverdbConnection = connection;
    await connection.sequelize.authenticate();
    console.log('✅ Connected to database successfully.');

    // Find any KOT
    const kot = await connection.KOT.findOne({
      where: { is_active: 1 }
    });

    if (!kot) {
      console.log('ℹ️ No active KOTs found to test cancel.');
      process.exit(0);
    }

    console.log(`🔎 Found active KOT ID: ${kot.kot_id}, custom_bill_number: ${kot.custom_bill_number}`);

    // Import helper functions or copy the stock ledger reversal code
    // Let's copy reverseKotStockIfDeducted logic directly here to see if it works or fails
    const Op = connection.Sequelize.Op;
    const refNumbers = [
      kot.custom_bill_number,
      kot.kot_no,
      `KOT-${kot.kot_id}`,
      String(kot.kot_id)
    ].filter(Boolean);

    await connection.sequelize.transaction(async (t) => {
      // 1. Authoritative idempotency check
      const existingCancel = await connection.StockLedger.findOne({
        where: {
          module: 'KOT_CANCEL',
          reference_no: { [Op.in]: refNumbers }
        },
        transaction: t
      });

      console.log('Idempotency check result:', existingCancel ? 'Already cancelled' : 'Not cancelled yet');

      // 2. Query original deductions
      const originalDeductions = await connection.StockLedger.findAll({
        where: {
          module: 'KOT',
          reference_no: { [Op.in]: refNumbers }
        },
        transaction: t
      });

      console.log('Original deductions count:', originalDeductions.length);

      // 3. Update KOT
      const nextExtra = {
        ...(kot.extra_details || {}),
        cancel_reason: 'Test cancel reason',
        cancelled_at: new Date().toISOString()
      };

      console.log('Updating KOT attributes...');
      await kot.update({ 
        is_active: 0, 
        status: 5, 
        note: 'Test cancel reason',
        extra_details: nextExtra
      }, { transaction: t });

      console.log('✅ KOT updated inside transaction successfully.');
    });

    console.log('🎉 Complete transaction committed successfully! No errors.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error testing KOT cancel:', err);
    process.exit(1);
  }
}

testKotCancel();
