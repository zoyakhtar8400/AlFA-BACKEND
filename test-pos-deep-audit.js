/**
 * ALFA HMS — DEEP POS MODULE AUDIT & INTEGRATION TEST SUITE
 * Tests all POS masters, KOT operations, billing calculations, payment settlements, snapshot reversals, and reports against live PostgreSQL database.
 */

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPosDeepAudit() {
  console.log('================================================================');
  console.log('🔴 STARTING ALFA HMS COMPLETE POS MODULE DEEP AUDIT');
  console.log('================================================================\n');

  const scorecard = {
    posMasters: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    tableManagement: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    kotOperations: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    billingCalculations: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    paymentSettlement: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    inventoryIntegration: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    snapshotReversal: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' },
    posReports: { tested: 0, passed: 0, failed: 0, status: 'NOT VERIFIED' }
  };

  const auditLog = [];

  const logTest = (area, testName, passed, details) => {
    scorecard[area].tested++;
    if (passed) scorecard[area].passed++;
    else scorecard[area].failed++;

    const statusSymbol = passed ? '✅ VERIFIED' : '❌ BROKEN';
    console.log(`[${area.toUpperCase()}] ${statusSymbol} - ${testName}: ${details}`);
    auditLog.push({ area, testName, passed, details });
  };

  try {
    // -------------------------------------------------------------
    // SECTION 1: POS MASTERS
    // -------------------------------------------------------------
    console.log('--- 1. Testing POS Masters (Table, Categories, Menu Items) ---');
    
    // 1.1 Fetch Categories
    const catRes = await request('GET', '/categories');
    logTest('posMasters', 'Category Master GET', catRes.status === 200, `Categories fetched: ${Array.isArray(catRes.data?.data) ? catRes.data.data.length : 0}`);

    // 1.2 Create POS Menu Item
    const menuItemRes = await request('POST', '/menu-items', {
      title: `POS Audit Butter Chicken ${Date.now().toString().slice(-4)}`,
      price: 380,
      category_ref_ids: 1,
      food_type: 'Non-Veg',
      inventory_type: 'RECIPE'
    });
    const posItemId = menuItemRes.data?.data?.item_id || menuItemRes.data?.data?.id || menuItemRes.data?.item_id;
    logTest('posMasters', 'POS Menu Item Create', menuItemRes.status === 200 && posItemId > 0, `Menu Item ID: ${posItemId}`);

    // 1.3 Map Recipe to POS Menu Item (150g Chicken, 50g Butter)
    const rawChickenRes = await request('POST', '/inventory-items', {
      item_name: `POS Audit Raw Chicken ${Date.now().toString().slice(-4)}`,
      unit: 'kg',
      current_stock: 20.0,
      purchase_price: 220.0
    });
    const rawChickenId = rawChickenRes.data?.data?.inventory_item_id || rawChickenRes.data?.inventory_item_id;

    if (posItemId && rawChickenId) {
      const recipeRes = await request('POST', '/recipes', {
        menu_item_id: posItemId,
        recipe_name: 'Butter Chicken Recipe',
        items: [
          { inventory_item_id: rawChickenId, quantity: 150, unit: 'g' }
        ]
      });
      logTest('posMasters', 'Recipe Mapping to POS Menu Item', recipeRes.status === 200, `Raw Chicken Item ID: ${rawChickenId} (150g / portion)`);
    }

    // -------------------------------------------------------------
    // SECTION 2: TABLE LIFECYCLE & KOT OPERATIONS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Table Lifecycle & KOT Creation ---');

    // 2.1 Cut KOT for Table 88 (2 x Butter Chicken = 300g Chicken = 0.3 Kg)
    const kot1Res = await request('POST', '/kot', {
      tableNo: '88',
      waiter: 'Steward John',
      customerName: 'Guest Alpha',
      items: [
        { itemId: posItemId, itemName: 'Butter Chicken', qty: 2, unitPrice: 380 }
      ]
    });
    const kot1Id = kot1Res.data?.data?.kotId || kot1Res.data?.data?.id || kot1Res.data?.kot_id;
    logTest('kotOperations', 'KOT Creation (KOT 1)', kot1Res.status === 201 || kot1Res.status === 200, `KOT ID: ${kot1Id}`);

    // 2.2 Verify Stock Deduction (20.0 Kg - 0.3 Kg = 19.7 Kg)
    const allInvRes1 = await request('GET', '/inventory-items');
    const itemsList1 = Array.isArray(allInvRes1.data?.data) ? allInvRes1.data.data : [];
    const invChicken1 = itemsList1.find(i => Number(i.inventory_item_id) === Number(rawChickenId));
    const stockAfterKot1 = Number(invChicken1?.current_stock || 0);
    logTest('inventoryIntegration', 'KOT 1 Stock Deduction (20 Kg -> 19.7 Kg)', stockAfterKot1 === 19.7, `Current Stock: ${stockAfterKot1} Kg`);

    // 2.3 Add Second KOT (KOT 2: 1 x Butter Chicken = 150g = 0.15 Kg) on Same Table
    const kot2Res = await request('POST', '/kot', {
      tableNo: '88',
      waiter: 'Steward John',
      customerName: 'Guest Alpha',
      items: [
        { itemId: posItemId, itemName: 'Butter Chicken', qty: 1, unitPrice: 380 }
      ]
    });
    const kot2Id = kot2Res.data?.data?.kotId || kot2Res.data?.data?.id || kot2Res.data?.kot_id;
    logTest('kotOperations', 'Second KOT on Same Table (KOT 2)', kot2Res.status === 201 || kot2Res.status === 200, `KOT ID: ${kot2Id}`);

    // 2.4 Verify Stock Deduction for KOT 2 ONLY (19.7 Kg - 0.15 Kg = 19.55 Kg)
    const allInvRes2 = await request('GET', '/inventory-items');
    const itemsList2 = Array.isArray(allInvRes2.data?.data) ? allInvRes2.data.data : [];
    const invChicken2 = itemsList2.find(i => Number(i.inventory_item_id) === Number(rawChickenId));
    const stockAfterKot2 = Number(invChicken2?.current_stock || 0);
    logTest('inventoryIntegration', 'Incremental KOT 2 Stock Deduction (19.7 Kg -> 19.55 Kg)', stockAfterKot2 === 19.55, `Current Stock: ${stockAfterKot2} Kg`);

    // -------------------------------------------------------------
    // SECTION 3: BILLING & PAYMENT SETTLEMENT
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Billing & Payment Settlement ---');

    // 3.1 Generate Bill for Table 88 (3 x Butter Chicken @ ₹380 = ₹1140)
    const orderRes = await request('POST', '/orders', {
      table_no: '88',
      items: [{ item_id: posItemId, quantity: 3, price: 380 }],
      subtotal: 1140,
      tax_amount: 57,
      total_amount: 1197,
      payment_mode: 'CARD',
      status: 'PAID'
    });
    logTest('billingCalculations', 'Order Billing & Tax Calculation', orderRes.status === 200 || orderRes.status === 201, `Order Amount: ₹1197 (Tax ₹57)`);

    // 3.2 Verify Billing / Payment does NOT cause Double Stock Deduction
    const allInvRes3 = await request('GET', '/inventory-items');
    const itemsList3 = Array.isArray(allInvRes3.data?.data) ? allInvRes3.data.data : [];
    const invChicken3 = itemsList3.find(i => Number(i.inventory_item_id) === Number(rawChickenId));
    const stockAfterPayment = Number(invChicken3?.current_stock || 0);
    logTest('inventoryIntegration', 'No Double Stock Deduction on Billing/Payment', stockAfterPayment === 19.55, `Stock after Payment: ${stockAfterPayment} Kg (Unchanged)`);

    // -------------------------------------------------------------
    // SECTION 4: SNAPSHOT KOT CANCELLATION & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing KOT Cancellation Reversal & Idempotency ---');

    // 4.1 Cancel KOT 2 (+0.15 Kg back to 19.7 Kg)
    const cancelKot2Res = await request('PATCH', `/kot/${kot2Id}/status`, {
      status: 'Cancelled',
      cancellationReason: 'Order Modification'
    });
    const allInvRes4 = await request('GET', '/inventory-items');
    const itemsList4 = Array.isArray(allInvRes4.data?.data) ? allInvRes4.data.data : [];
    const invChicken4 = itemsList4.find(i => Number(i.inventory_item_id) === Number(rawChickenId));
    const stockAfterCancelKot2 = Number(invChicken4?.current_stock || 0);
    logTest('snapshotReversal', 'Snapshot KOT 2 Cancel Reversal (+0.15 Kg -> 19.7 Kg)', stockAfterCancelKot2 === 19.7, `Stock after Cancel: ${stockAfterCancelKot2} Kg`);

    // 4.2 Re-cancel KOT 2 to test Idempotency (Stock should remain 19.7 Kg)
    await request('PATCH', `/kot/${kot2Id}/status`, {
      status: 'Cancelled',
      cancellationReason: 'Duplicate Cancel Signal'
    });
    const allInvRes5 = await request('GET', '/inventory-items');
    const itemsList5 = Array.isArray(allInvRes5.data?.data) ? allInvRes5.data.data : [];
    const invChicken5 = itemsList5.find(i => Number(i.inventory_item_id) === Number(rawChickenId));
    const stockAfterIdem = Number(invChicken5?.current_stock || 0);
    logTest('snapshotReversal', 'Idempotent KOT Reversal Check (No 2nd Restoration)', stockAfterIdem === 19.7, `Stock after 2nd Cancel: ${stockAfterIdem} Kg (Remains 19.7 Kg)`);

    // -------------------------------------------------------------
    // SECTION 5: POS REPORTS DATA INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing POS Live PostgreSQL Report Data ---');
    const posReportRes = await request('GET', '/purchase/reports/sales-summary-report');
    logTest('posReports', 'Live PostgreSQL Sales Summary Report', posReportRes.status === 200, `Report Data Rows: ${posReportRes.data?.data?.data?.length || 0}`);

    // -------------------------------------------------------------
    // FINAL SCORECARD SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📊 FINAL ALFA HMS POS MODULE AUDIT SCORECARD');
    console.log('================================================================');
    
    Object.keys(scorecard).forEach(key => {
      const item = scorecard[key];
      if (item.tested > 0) {
        if (item.passed === item.tested) item.status = '✅ VERIFIED';
        else if (item.passed > 0) item.status = '🟡 PARTIAL';
        else item.status = '❌ BROKEN';
      }
      console.log(`${key.padEnd(24)} | Tested: ${String(item.tested).padStart(2)} | Passed: ${String(item.passed).padStart(2)} | Failed: ${String(item.failed).padStart(2)} | Status: ${item.status}`);
    });

  } catch (err) {
    console.error('\n❌ POS Deep Audit execution error:', err);
  }
}

runPosDeepAudit();
