require('dotenv').config();
const http = require('http');
const {
  sequelize,
  InventoryItem,
  StockLedger,
  RecipeMaster,
  RecipeItems,
  Item
} = require('../src/com/tmbill/js/database');

const API_BASE = 'http://localhost:3000/api';

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runFullStockLifecycleAudit() {
  console.log('===================================================================================');
  console.log('🍷 ALFA HMS — COMPREHENSIVE RESTAURANT ↔ PURCHASE STOCK LIFECYCLE AUDIT');
  console.log('===================================================================================\n');

  const auditLog = [];

  try {
    // -----------------------------------------------------------------------------------
    // STEP 0: Baseline Initial Stock
    // -----------------------------------------------------------------------------------
    const paneerItem = await InventoryItem.findOne({ where: { item_name: 'Paneer' } });
    const butterItem = await InventoryItem.findOne({ where: { item_name: 'Butter' } });
    const cokeItem = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });

    if (!paneerItem || !butterItem) {
      throw new Error('Paneer or Butter inventory item not found in database. Seed data first.');
    }

    const startPaneerStock = Number(paneerItem.current_stock || 0);
    const startButterStock = Number(butterItem.current_stock || 0);
    const startCokeStock = Number(cokeItem ? cokeItem.current_stock : 0);

    console.log('📌 STEP 0: INITIAL BASELINE STOCK (PostgreSQL):');
    console.log(`   • Paneer: ${startPaneerStock} g`);
    console.log(`   • Butter: ${startButterStock} g`);
    console.log(`   • Coca Cola: ${startCokeStock} Bottles\n`);

    // -----------------------------------------------------------------------------------
    // STEP 1: GRN Stock Inflow (+1000g Paneer, +500g Butter)
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 1: Posting Purchase GRN (+1000g Paneer, +500g Butter)...');
    const grnRes = await apiRequest('POST', '/grns', {
      grn_number: `GRN-AUDIT-${Date.now().toString().slice(-4)}`,
      supplier_id: 1,
      received_date: new Date(),
      items: [
        { inventory_item_id: paneerItem.inventory_item_id, received_qty: 1000, unit_price: 0.35, unit: 'g' },
        { inventory_item_id: butterItem.inventory_item_id, received_qty: 500, unit_price: 0.60, unit: 'g' }
      ]
    });

    const grnPaneer = await InventoryItem.findByPk(paneerItem.inventory_item_id);
    const grnButter = await InventoryItem.findByPk(butterItem.inventory_item_id);

    const grnSuccess = grnRes.status === 200 &&
      Number(grnPaneer.current_stock) === startPaneerStock + 1000 &&
      Number(grnButter.current_stock) === startButterStock + 500;

    auditLog.push({
      step: '1. GRN Stock Increase',
      status: grnSuccess ? 'PASS' : 'FAIL',
      evidence: `Paneer: ${grnPaneer.current_stock}g (expected ${startPaneerStock + 1000}g), Butter: ${grnButter.current_stock}g (expected ${startButterStock + 500}g)`
    });

    console.log(`   Status: ${grnSuccess ? '✅ PASS' : '❌ FAIL'}\n`);

    // -----------------------------------------------------------------------------------
    // STEP 2: Department Issue Stock Outflow (-200g Paneer)
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 2: Issue Stock to Department (-200g Paneer)...');
    const issueRes = await apiRequest('POST', '/department-issues', {
      issue_number: `ISS-AUDIT-${Date.now().toString().slice(-4)}`,
      from_department: 'PURCHASE STORE',
      to_department: 'MAIN KITCHEN',
      items: [
        { inventory_item_id: paneerItem.inventory_item_id, issue_qty: 200, unit: 'g' }
      ]
    });

    const issuePaneer = await InventoryItem.findByPk(paneerItem.inventory_item_id);
    const issueSuccess = issueRes.status === 200 && Number(issuePaneer.current_stock) === Number(grnPaneer.current_stock) - 200;

    auditLog.push({
      step: '2. Department Issue Stock Outflow',
      status: issueSuccess ? 'PASS' : 'FAIL',
      evidence: `Paneer Stock after Issue: ${issuePaneer.current_stock}g (expected ${Number(grnPaneer.current_stock) - 200}g)`
    });

    console.log(`   Status: ${issueSuccess ? '✅ PASS' : '❌ FAIL'}\n`);

    // -----------------------------------------------------------------------------------
    // STEP 3: Create Recipe-Based KOT (2 x Paneer Tikka)
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 3: Creating KOT 1 (2 x Paneer Tikka: Recipe 200g Paneer, 50g Butter)...');
    const kot1No = `KOT-AUDIT-RECIPE-${Date.now().toString().slice(-4)}`;

    const stockBeforeKot1Paneer = await InventoryItem.findByPk(paneerItem.inventory_item_id);
    const stockBeforeKot1Butter = await InventoryItem.findByPk(butterItem.inventory_item_id);

    const kot1Res = await apiRequest('POST', '/kot', {
      kotNo: kot1No,
      tableId: 1,
      tableNo: '01',
      customerName: 'Snapshot Guest',
      items: [
        { itemId: 1, itemName: 'Paneer Tikka', qty: 2, unitPrice: 350 }
      ]
    });

    console.log('   KOT 1 API Status:', kot1Res.status, 'Response:', JSON.stringify(kot1Res.data));

    const stockAfterKot1Paneer = await InventoryItem.findByPk(paneerItem.inventory_item_id);
    const stockAfterKot1Butter = await InventoryItem.findByPk(butterItem.inventory_item_id);

    const kot1PaneerDeducted = Number(stockBeforeKot1Paneer.current_stock) - Number(stockAfterKot1Paneer.current_stock);
    const kot1ButterDeducted = Number(stockBeforeKot1Butter.current_stock) - Number(stockAfterKot1Butter.current_stock);

    const kot1Success = (kot1Res.status === 200 || kot1Res.status === 201) &&
      kot1PaneerDeducted === 400 && kot1ButterDeducted === 100;

    auditLog.push({
      step: '3. Recipe-Based KOT Deduction',
      status: kot1Success ? 'PASS' : 'FAIL',
      evidence: `Kot No: ${kot1No}. Deducted Paneer: ${kot1PaneerDeducted}g (exp 400g), Butter: ${kot1ButterDeducted}g (exp 100g)`
    });

    console.log(`   Status: ${kot1Success ? '✅ PASS' : '❌ FAIL'}\n`);

    const createdKot1Id = kot1Res.data?.data?.id || kot1Res.data?.kot?.kotId || kot1Res.data?.data?.kotId || kot1No;

    // -----------------------------------------------------------------------------------
    // STEP 4: Recipe Mutation Test (Change Recipe to 150g Paneer, 10g Butter)
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 4: MUTATING RECIPE in Database to test Snapshot Protection...');
    console.log('   (Changing Paneer Tikka recipe to: 150g Paneer, 10g Butter)...');
    const paneerRecipeMaster = await RecipeMaster.findOne({ where: { menu_item_id: 1 } });
    if (paneerRecipeMaster) {
      await RecipeItems.update(
        { quantity: 150 },
        { where: { recipe_id: paneerRecipeMaster.recipe_id, inventory_item_id: paneerItem.inventory_item_id } }
      );
      await RecipeItems.update(
        { quantity: 10 },
        { where: { recipe_id: paneerRecipeMaster.recipe_id, inventory_item_id: butterItem.inventory_item_id } }
      );
      console.log('   Recipe successfully altered in PostgreSQL DB.');
    }

    // -----------------------------------------------------------------------------------
    // STEP 5: Cancel KOT 1 & Verify Exact Snapshot Reversal (+400g Paneer, +100g Butter)
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 5: Cancelling KOT 1 via PATCH /api/kot/:id/status...');
    const cancel1Res = await apiRequest('PATCH', `/kot/${createdKot1Id}/status`, { status: 'Cancelled' });

    const stockAfterCancel1Paneer = await InventoryItem.findByPk(paneerItem.inventory_item_id);
    const stockAfterCancel1Butter = await InventoryItem.findByPk(butterItem.inventory_item_id);

    const paneerRestored = Number(stockAfterCancel1Paneer.current_stock) - Number(stockAfterKot1Paneer.current_stock);
    const butterRestored = Number(stockAfterCancel1Butter.current_stock) - Number(stockAfterKot1Butter.current_stock);

    const cancel1Success = cancel1Res.status === 200 &&
      paneerRestored === 400 && butterRestored === 100;

    auditLog.push({
      step: '4. Snapshot-Based KOT Stock Reversal (Protected vs Recipe Change)',
      status: cancel1Success ? 'PASS' : 'FAIL',
      evidence: `Restored Paneer: +${paneerRestored}g (expected exact original +400g, NOT mutated +300g!), Butter: +${butterRestored}g (expected exact original +40g, NOT mutated +20g!)`
    });

    console.log(`   Restored Paneer: +${paneerRestored}g | Restored Butter: +${butterRestored}g`);
    console.log(`   Status: ${cancel1Success ? '✅ PASS' : '❌ FAIL'}\n`);

    // -----------------------------------------------------------------------------------
    // STEP 6: Idempotency Test (Cancel KOT 1 Second Time)
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 6: Testing Cancellation Idempotency (Cancelling KOT 1 a 2nd time)...');
    const cancel2Res = await apiRequest('PATCH', `/kot/${createdKot1Id}/status`, { status: 'Cancelled' });

    const stockAfterCancel2Paneer = await InventoryItem.findByPk(paneerItem.inventory_item_id);
    const stockAfterCancel2Butter = await InventoryItem.findByPk(butterItem.inventory_item_id);

    const idempotencySuccess = cancel2Res.status === 200 &&
      cancel2Res.data?.data?.alreadyReversed === true &&
      Number(stockAfterCancel2Paneer.current_stock) === Number(stockAfterCancel1Paneer.current_stock) &&
      Number(stockAfterCancel2Butter.current_stock) === Number(stockAfterCancel1Butter.current_stock);

    auditLog.push({
      step: '5. Cancellation Idempotency Guard',
      status: idempotencySuccess ? 'PASS' : 'FAIL',
      evidence: `2nd Cancel API Response alreadyReversed: ${cancel2Res.data?.data?.alreadyReversed}. Paneer stock remained unchanged at ${stockAfterCancel2Paneer.current_stock}g.`
    });

    console.log(`   Status: ${idempotencySuccess ? '✅ PASS' : '❌ FAIL'}\n`);

    // -----------------------------------------------------------------------------------
    // STEP 7: Billing & Payment Double-Deduction Verification
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 7: Billing & Payment double-deduction check...');
    // Create KOT 2
    const kot2No = `KOT-AUDIT-BILL-${Date.now().toString().slice(-4)}`;
    const kot2Res = await apiRequest('POST', '/kot', {
      kotNo: kot2No,
      tableId: 2,
      tableNo: '02',
      customerName: 'Billing Guest',
      items: [
        { itemId: 10, itemName: 'Coca Cola', qty: 2, unitPrice: 40 }
      ]
    });

    const cokeAfterKot2 = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });

    // Create Order & Process Payment for KOT 2
    const orderRes = await apiRequest('POST', '/orders', {
      tableId: 2,
      tableNo: '02',
      customerName: 'Billing Guest',
      status: 'active',
      items: [{ itemId: 10, itemName: 'Coca Cola', qty: 2, unitPrice: 40 }]
    });

    const orderId = orderRes.data?.order?.order_id || orderRes.data?.order?.id || orderRes.data?.order_id;
    if (orderId) {
      await apiRequest('POST', '/payments', { orderId, paymentMethod: 'Cash', amount: 80 });
    }

    const cokeAfterPayment = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });

    const noDoubleDeduction = Number(cokeAfterPayment.current_stock) === Number(cokeAfterKot2.current_stock);

    auditLog.push({
      step: '6. Billing/Payment Non-Deduction Verification',
      status: noDoubleDeduction ? 'PASS' : 'FAIL',
      evidence: `Coke Stock after KOT: ${cokeAfterKot2.current_stock} bottles. Coke Stock after Order & Payment: ${cokeAfterPayment.current_stock} bottles (No double deduction).`
    });

    console.log(`   Status: ${noDoubleDeduction ? '✅ PASS' : '❌ FAIL'}\n`);

    // -----------------------------------------------------------------------------------
    // STEP 8: Stock Ledger Audit Trail & Report Engine Check
    // -----------------------------------------------------------------------------------
    console.log('🔹 STEP 8: Verifying Stock Ledger Audit Trail & Reports from PostgreSQL...');
    const ledgerRes = await apiRequest('GET', '/stock-ledger');
    const reportRes = await apiRequest('GET', '/purchase/reports/stock-ledger-register');

    const ledgerEntries = ledgerRes.data?.data || ledgerRes.data || [];
    const cancelLedgerEntry = ledgerEntries.find(l => l.module === 'KOT_CANCEL');

    const auditTrailSuccess = ledgerRes.status === 200 &&
      reportRes.status === 200 &&
      cancelLedgerEntry !== undefined;

    auditLog.push({
      step: '7. Stock Ledger Audit & PostgreSQL Report Engine',
      status: auditTrailSuccess ? 'PASS' : 'FAIL',
      evidence: `Found ${ledgerEntries.length} total Stock Ledger rows. Verified KOT_CANCEL entry present with ref: ${cancelLedgerEntry?.reference_no}.`
    });

    console.log(`   Status: ${auditTrailSuccess ? '✅ PASS' : '❌ FAIL'}\n`);

    // Restore modified recipe back to original 200g / 50g for cleanliness
    if (paneerRecipeMaster) {
      await RecipeItems.update(
        { quantity: 200 },
        { where: { recipe_id: paneerRecipeMaster.recipe_id, inventory_item_id: paneerItem.inventory_item_id } }
      );
      await RecipeItems.update(
        { quantity: 50 },
        { where: { recipe_id: paneerRecipeMaster.recipe_id, inventory_item_id: butterItem.inventory_item_id } }
      );
    }

    // -----------------------------------------------------------------------------------
    // SUMMARY REPORT
    // -----------------------------------------------------------------------------------
    console.log('===================================================================================');
    console.log('📋 AUDIT SUMMARY RESULTS:');
    console.log('===================================================================================');
    let allPassed = true;
    auditLog.forEach(row => {
      if (row.status === 'FAIL') allPassed = false;
      console.log(`[${row.status}] ${row.step}`);
      console.log(`        Evidence: ${row.evidence}`);
    });
    console.log('===================================================================================');

    if (allPassed) {
      console.log('\n🎉 ALL 7 CRITICAL AUDIT STAGES PASSED PERFECTLY!');
      console.log('The Restaurant ↔ Purchase/Inventory connection in ALFA software is 100% AUDITED and VERIFIED.');
      process.exit(0);
    } else {
      console.error('\n❌ AUDIT FAILED ON ONE OR MORE STAGES. See details above.');
      process.exit(1);
    }

  } catch (err) {
    console.error('\n❌ Audit execution error:', err.stack || err);
    process.exit(1);
  }
}

runFullStockLifecycleAudit();
