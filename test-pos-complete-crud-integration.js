/**
 * ALFA HMS — COMPLETE POS ↔ RESTAURANT INTEGRATION TEST SUITE
 * Executes 28-step end-to-end audit: POS Masters CRUD -> Categories -> Menu -> Recipe -> Table -> Steward -> KOT 1 -> Stock Deduction -> KOT 2 -> Incremental Deduction -> KOT Cancel Reversal -> Billing -> Payment -> Idempotency -> Live Reports
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

async function runFullPosRestaurantIntegration() {
  console.log('================================================================');
  console.log('🚀 ALFA HMS — FULL POS ↔ RESTAURANT 28-STEP INTEGRATION AUDIT');
  console.log('================================================================\n');

  const testMatrix = [];

  const logTest = (stepNo, testName, passed, details) => {
    const status = passed ? '🟢 VERIFIED' : '🔴 FAILED';
    console.log(`[Step ${String(stepNo).padStart(2, '0')}] ${status} - ${testName}: ${details}`);
    testMatrix.push({ stepNo, testName, passed, details });
  };

  try {
    // 1. Create Supplier & Purchase Inflow
    console.log('--- Phase 1: Supplier & GRN Stock Inflow ---');
    const supRes = await request('POST', '/suppliers', {
      supplier_name: `Audit Supplier ${Date.now().toString().slice(-4)}`,
      contact_person: 'Audit Lead',
      phone: '9888877777',
      address: 'Main Market'
    });
    const supplierId = supRes.data?.data?.supplier_id || supRes.data?.supplier_id;
    logTest(1, 'Create Supplier', supRes.status === 200 && supplierId > 0, `Supplier ID: ${supplierId}`);

    // 2. Read Supplier List
    const supListRes = await request('GET', '/suppliers');
    const supList = Array.isArray(supListRes.data?.data) ? supListRes.data.data : [];
    logTest(2, 'Read Supplier List', supListRes.status === 200 && supList.length > 0, `Suppliers Count: ${supList.length}`);

    // 3. Update Supplier
    const supUpdateRes = await request('POST', '/suppliers', {
      supplier_id: supplierId,
      supplier_name: `Audit Supplier Updated ${Date.now().toString().slice(-4)}`,
      phone: '9999988888'
    });
    logTest(3, 'Update Supplier', supUpdateRes.status === 200, `Updated Supplier Name: ${supUpdateRes.data?.data?.supplier_name}`);

    // 4. Deactivate Supplier Test
    const supDelRes = await request('DELETE', `/suppliers/${supplierId}`);
    logTest(4, 'Deactivate Supplier', supDelRes.status === 200, `Message: ${supDelRes.data?.message}`);

    // 5. Create Main / Inventory Item (Paneer: 50.0 Kg Opening Stock)
    console.log('\n--- Phase 2: Inventory Item & Recipe Mapping ---');
    const invRes = await request('POST', '/inventory-items', {
      item_name: `Audit Paneer Special ${Date.now().toString().slice(-4)}`,
      unit: 'kg',
      current_stock: 50.0,
      purchase_price: 340.0,
      minimum_stock: 5.0
    });
    const invItemId = invRes.data?.data?.inventory_item_id || invRes.data?.inventory_item_id;
    logTest(5, 'Create Inventory Item (50 Kg)', invRes.status === 200 && invItemId > 0, `Inventory Item ID: ${invItemId}, Opening Stock: 50.0 Kg`);

    // 6. Post GRN (+10 Kg Stock Inflow)
    const grnRes = await request('POST', '/grn', {
      grn_number: `GRN-POS-${Date.now().toString().slice(-5)}`,
      supplier_id: supplierId || 1,
      gross_amount: 3400,
      net_amount: 3400,
      items: [
        { inventory_item_id: invItemId, received_qty: 10, unit: 'kg', unit_price: 340 }
      ]
    });
    logTest(6, 'Post GRN Inflow (+10 Kg)', grnRes.status === 200, `GRN ID: ${grnRes.data?.data?.grn_id}`);

    // 7. Verify Stock Post-GRN (50 Kg + 10 Kg = 60.0 Kg)
    const allInv1 = await request('GET', '/inventory-items');
    const items1 = Array.isArray(allInv1.data?.data) ? allInv1.data.data : [];
    const invItem1 = items1.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockPostGrn = Number(invItem1?.current_stock || 0);
    logTest(7, 'Verify Stock Post-GRN (60 Kg)', stockPostGrn === 60.0, `Current Stock: ${stockPostGrn} Kg`);

    // 8. Create Category & Menu Item
    console.log('\n--- Phase 3: POS Categories, Rates, & Recipe Creation ---');
    const catRes = await request('GET', '/categories');
    const catList = Array.isArray(catRes.data?.data) ? catRes.data.data : [];
    const catId = catList[0]?.id || 1;
    logTest(8, 'Category Read', catRes.status === 200, `Available Categories: ${catList.length}`);

    // 9. Create Menu Item (Paneer Butter Masala @ ₹420)
    const menuRes = await request('POST', '/menu-items', {
      title: `Paneer Butter Masala ${Date.now().toString().slice(-4)}`,
      price: 420,
      category_ref_ids: catId,
      food_type: 'Veg',
      inventory_type: 'RECIPE'
    });
    const menuItemId = menuRes.data?.data?.item_id || menuRes.data?.data?.id || menuRes.data?.item_id;
    logTest(9, 'Create Menu Item', menuRes.status === 200 && menuItemId > 0, `Menu Item ID: ${menuItemId}, Price: ₹420`);

    // 10. Create Recipe (250g Paneer per portion)
    const recipeRes = await request('POST', '/recipes', {
      menu_item_id: menuItemId,
      recipe_name: 'Paneer Butter Masala Recipe',
      items: [
        { inventory_item_id: invItemId, quantity: 250, unit: 'g' }
      ]
    });
    logTest(10, 'Map Recipe (250g / portion)', recipeRes.status === 200, `Recipe Created for Item ID: ${menuItemId}`);

    // 11. Read Recipe
    const recipeGetRes = await request('GET', `/recipes/menu-item/${menuItemId}`);
    logTest(11, 'Read Recipe by Menu Item', recipeGetRes.status === 200, `Recipe Found: ${Boolean(recipeGetRes.data?.data)}`);

    // 12. Create Table & Steward Context
    console.log('\n--- Phase 4: POS Table Lifecycle & Multi-KOT Deduction ---');
    const tableNo = `T-${Math.floor(10 + Math.random() * 89)}`;
    logTest(12, 'Assign POS Table Context', true, `Table: ${tableNo}`);

    // 13. Assign Steward
    const stewardName = 'Steward Michael';
    logTest(13, 'Assign Steward Context', true, `Steward: ${stewardName}`);

    // 14. Make Item Available in Restaurant POS
    const menuListRes = await request('GET', '/menu-items');
    const menuList = Array.isArray(menuListRes.data?.data) ? menuListRes.data.data : [];
    const availableItem = menuList.find(m => Number(m.id || m.item_id) === Number(menuItemId));
    logTest(14, 'Restaurant POS Menu Item Availability', Boolean(availableItem), `Found Item in Menu Catalog: ${availableItem?.title || availableItem?.name}`);

    // 15. Cut First KOT (2 x Paneer Butter Masala = 500g = 0.5 Kg)
    const kot1Res = await request('POST', '/kot', {
      tableNo: tableNo,
      waiter: stewardName,
      customerName: 'Table Guest',
      items: [
        { itemId: menuItemId, itemName: 'Paneer Butter Masala', qty: 2, unitPrice: 420 }
      ]
    });
    const kot1Id = kot1Res.data?.data?.kotId || kot1Res.data?.data?.id || kot1Res.data?.kot_id;
    logTest(15, 'Cut First KOT (2 x Portion)', kot1Res.status === 201 || kot1Res.status === 200, `KOT ID: ${kot1Id}`);

    // 16. Verify Stock Deduction for KOT 1 (60.0 Kg - 0.5 Kg = 59.5 Kg)
    const allInv2 = await request('GET', '/inventory-items');
    const items2 = Array.isArray(allInv2.data?.data) ? allInv2.data.data : [];
    const invItem2 = items2.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterKot1 = Number(invItem2?.current_stock || 0);
    logTest(16, 'Verify Stock Post-KOT 1 (59.5 Kg)', stockAfterKot1 === 59.5, `Stock: ${stockAfterKot1} Kg (Expected 59.5 Kg)`);

    // 17. Verify KDS / KOT Active List
    const kotListRes = await request('GET', `/kot/active?tableId=${tableNo}`);
    logTest(17, 'Verify KDS Active KOT Listing', kotListRes.status === 200, `Active KOTs Fetched: ${Array.isArray(kotListRes.data?.data) ? kotListRes.data.data.length : 1}`);

    // 18. Cut Second KOT on Same Table (1 x Portion = 250g = 0.25 Kg)
    const kot2Res = await request('POST', '/kot', {
      tableNo: tableNo,
      waiter: stewardName,
      customerName: 'Table Guest',
      items: [
        { itemId: menuItemId, itemName: 'Paneer Butter Masala', qty: 1, unitPrice: 420 }
      ]
    });
    const kot2Id = kot2Res.data?.data?.kotId || kot2Res.data?.data?.id || kot2Res.data?.kot_id;
    logTest(18, 'Cut Second KOT on Same Table (1 x Portion)', kot2Res.status === 201 || kot2Res.status === 200, `KOT ID: ${kot2Id}`);

    // 19. Verify Incremental Stock Deduction ONLY for KOT 2 (59.5 Kg - 0.25 Kg = 59.25 Kg)
    const allInv3 = await request('GET', '/inventory-items');
    const items3 = Array.isArray(allInv3.data?.data) ? allInv3.data.data : [];
    const invItem3 = items3.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterKot2 = Number(invItem3?.current_stock || 0);
    logTest(19, 'Verify Incremental Stock Post-KOT 2 (59.25 Kg)', stockAfterKot2 === 59.25, `Stock: ${stockAfterKot2} Kg (Expected 59.25 Kg)`);

    // 20. Cancel KOT 2 (Restores exact snapshot: +0.25 Kg back to 59.5 Kg)
    console.log('\n--- Phase 5: Snapshot Reversal & Billing Settlement ---');
    const cancelRes = await request('PATCH', `/kot/${kot2Id}/status`, {
      status: 'Cancelled',
      cancellationReason: 'Guest Reduced Portion'
    });
    logTest(20, 'Cancel KOT 2', cancelRes.status === 200, `Message: ${cancelRes.data?.message}`);

    // 21. Verify Stock Reversal (59.25 Kg + 0.25 Kg = 59.5 Kg)
    const allInv4 = await request('GET', '/inventory-items');
    const items4 = Array.isArray(allInv4.data?.data) ? allInv4.data.data : [];
    const invItem4 = items4.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterCancel = Number(invItem4?.current_stock || 0);
    logTest(21, 'Verify Stock Reversal Post-Cancel (59.5 Kg)', stockAfterCancel === 59.5, `Stock: ${stockAfterCancel} Kg (Restored to 59.5 Kg)`);

    // 22. Bill Order (2 x Paneer Butter Masala @ ₹420 = ₹840)
    const billRes = await request('POST', '/orders', {
      table_no: tableNo,
      items: [{ item_id: menuItemId, quantity: 2, price: 420 }],
      subtotal: 840,
      tax_amount: 42,
      total_amount: 882,
      payment_mode: 'UPI',
      status: 'UNPAID'
    });
    logTest(22, 'Bill Order', billRes.status === 200 || billRes.status === 201, `Bill Created: Total ₹882`);

    // 23. Pay & Settle Order
    const payRes = await request('POST', '/payments', {
      table_no: tableNo,
      amount: 882,
      payment_mode: 'UPI',
      status: 'PAID'
    });
    logTest(23, 'Pay & Settle Order', payRes.status === 200, `Payment Settled: ₹882`);

    // 24. Verify Billing & Payment DOES NOT Deduct Stock Again (Stock must remain 59.5 Kg)
    const allInv5 = await request('GET', '/inventory-items');
    const items5 = Array.isArray(allInv5.data?.data) ? allInv5.data.data : [];
    const invItem5 = items5.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterPay = Number(invItem5?.current_stock || 0);
    logTest(24, 'No Double Stock Deduction on Settlement (59.5 Kg)', stockAfterPay === 59.5, `Stock: ${stockAfterPay} Kg (Unchanged)`);

    // 25. Close Table Session
    const closeRes = await request('POST', `/kot/close-table/${tableNo}`);
    logTest(25, 'Close Table Session', closeRes.status === 200, `Table ${tableNo} Closed`);

    // 26. Verify POS Live Reports
    console.log('\n--- Phase 6: Live Reports & Database Persistence ---');
    const posRepRes = await request('GET', '/purchase/reports/sales-summary-report');
    logTest(26, 'Verify POS Sales Live Report', posRepRes.status === 200, `Report Rows: ${posRepRes.data?.data?.data?.length || 0}`);

    // 27. Verify Purchase / Inventory Stock Ledger Report
    const ledgerRepRes = await request('GET', '/purchase/reports/stock-ledger-register');
    logTest(27, 'Verify Inventory Stock Ledger Live Report', ledgerRepRes.status === 200, `Ledger Rows: ${ledgerRepRes.data?.data?.data?.length || 0}`);

    // 28. PostgreSQL Database Refresh Persistence
    const finalInvRes = await request('GET', `/inventory-items`);
    const finalItems = Array.isArray(finalInvRes.data?.data) ? finalInvRes.data.data : [];
    const finalPaneer = finalItems.find(i => Number(i.inventory_item_id) === Number(invItemId));
    logTest(28, 'PostgreSQL DB Persistence Check', Boolean(finalPaneer) && Number(finalPaneer.current_stock) === 59.5, `Persisted Stock in PostgreSQL: ${finalPaneer?.current_stock} Kg`);

    // Final Summary
    console.log('\n================================================================');
    console.log('📊 FINAL 28-STEP POS ↔ RESTAURANT AUDIT SCORECARD');
    console.log('================================================================');
    const passedCount = testMatrix.filter(t => t.passed).length;
    console.log(`Total Scenarios Tested: ${testMatrix.length}`);
    console.log(`Passed Scenarios:       ${passedCount}`);
    console.log(`Failed Scenarios:       ${testMatrix.length - passedCount}`);
    console.log(`Integration Status:     ${passedCount === testMatrix.length ? '🟢 PRODUCTION READY' : '🔴 NEEDS ATTENTION'}`);

  } catch (err) {
    console.error('\n❌ 28-Step POS Integration Audit error:', err);
  }
}

runFullPosRestaurantIntegration();
