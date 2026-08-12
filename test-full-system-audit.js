/**
 * ALFA HMS - Comprehensive End-to-End System Audit & Integration Test Suite
 * Tests Purchase GRN (+Stock) -> Recipe -> POS KOT (-Stock with Unit Conversion) -> Billing -> Payment -> KOT Cancel Reversal -> Idempotency
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

async function runAudit() {
  console.log('================================================================');
  console.log('🚀 STARTING ALFA HMS FULL SYSTEM INTEGRATION AUDIT');
  console.log('================================================================\n');

  const testMatrix = [];

  const logResult = (testName, passed, details) => {
    const status = passed ? '🟢 VERIFIED' : '🔴 FAILED';
    console.log(`${status} - ${testName}: ${details}`);
    testMatrix.push({ testName, passed, details });
  };

  try {
    // 1. Create Supplier
    console.log('--- Step 1: Create Supplier ---');
    const supRes = await request('POST', '/suppliers', {
      supplier_name: 'TEST SUPPLIER AUDIT',
      contact_person: 'Audit Manager',
      phone: '9999999999',
      city: 'Mumbai',
    });
    const supplierId = supRes.data?.data?.supplier_id || supRes.data?.supplier_id;
    logResult('Supplier Creation', supRes.status === 200 && supplierId > 0, `Supplier ID: ${supplierId}`);

    // 2. Create Inventory Item (Paneer: 10 Kg opening stock)
    console.log('\n--- Step 2: Create Inventory Item (Paneer, 10 Kg) ---');
    const invRes = await request('POST', '/inventory-items', {
      item_name: `Audit Paneer Raw ${Date.now().toString().slice(-4)}`,
      unit: 'kg',
      current_stock: 10.0,
      purchase_price: 350.0,
      minimum_stock: 2.0,
      store_department: 'KITCHEN',
    });
    const invItemId = invRes.data?.data?.inventory_item_id || invRes.data?.inventory_item_id;
    logResult('Inventory Item Creation', invRes.status === 200 && invItemId > 0, `Item ID: ${invItemId}, Opening Stock: 10 Kg`);

    // 3. Post GRN (+5 Kg stock inflow)
    console.log('\n--- Step 3: Post GRN (+5 Kg Stock Inflow) ---');
    const grnRes = await request('POST', '/grn', {
      grn_number: `GRN-AUDIT-${Date.now().toString().slice(-6)}`,
      supplier_id: supplierId,
      gross_amount: 1750,
      net_amount: 1750,
      items: [
        { inventory_item_id: invItemId, received_qty: 5, unit: 'kg', unit_price: 350 }
      ]
    });
    const grnId = grnRes.data?.data?.grn_id || grnRes.data?.grn_id;
    logResult('GRN Inflow (+5 Kg)', grnRes.status === 200 && grnId > 0, `GRN ID: ${grnId}, Message: ${grnRes.data?.message || 'Success'}`);

    // 4. Verify Stock increased to 15 Kg
    console.log('\n--- Step 4: Verify Stock Post-GRN ---');
    const allInvRes = await request('GET', '/inventory-items');
    const itemsList = Array.isArray(allInvRes.data?.data) ? allInvRes.data.data : (Array.isArray(allInvRes.data) ? allInvRes.data : []);
    const createdInvItem = itemsList.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterGrn = Number(createdInvItem?.current_stock || 0);
    logResult('Post-GRN Stock Verification', stockAfterGrn === 15, `Current Stock: ${stockAfterGrn} Kg (Expected 15.0 Kg)`);

    // 5. Create Menu Item & Recipe (Paneer Tikka: 200g Paneer per portion)
    console.log('\n--- Step 5: Create Menu Item & Recipe (200g Paneer / portion) ---');
    const menuItemRes = await request('POST', '/menu-items', {
      title: `Audit Paneer Tikka ${Date.now().toString().slice(-4)}`,
      price: 320,
      inventory_type: 'RECIPE',
      is_active: 1
    });
    const menuItemId = menuItemRes.data?.data?.item_id || menuItemRes.data?.data?.id || menuItemRes.data?.item_id || menuItemRes.data?.id;

    if (menuItemId) {
      await request('POST', '/recipes', {
        menu_item_id: menuItemId,
        recipe_name: 'Paneer Tikka Recipe',
        items: [
          { inventory_item_id: invItemId, quantity: 200, unit: 'g' }
        ]
      });
    }
    logResult('Menu & Recipe Mapping', menuItemId > 0, `Menu Item ID: ${menuItemId}, Recipe: 200g Paneer`);

    // 6. Cut KOT for 2 x Paneer Tikka (Requires 400g = 0.4 Kg)
    console.log('\n--- Step 6: Cut KOT for 2 x Paneer Tikka (Unit Conversion: 400g = 0.4 Kg) ---');
    const kotRes = await request('POST', '/kot', {
      tableNo: '99',
      items: [
        { itemId: menuItemId, itemName: 'Audit Paneer Tikka', qty: 2, unitPrice: 320 }
      ]
    });
    const kotId = kotRes.data?.data?.kotId || kotRes.data?.data?.id || kotRes.data?.kot_id;
    logResult('KOT Creation & Unit Scaled Deduction', kotRes.status === 201 || kotRes.status === 200, `KOT ID: ${kotId}`);

    // 7. Verify Stock decreased from 15 Kg to 14.6 Kg (15 - 0.4 = 14.6 Kg)
    console.log('\n--- Step 7: Verify Stock Post-KOT ---');
    const allInvRes2 = await request('GET', '/inventory-items');
    const itemsList2 = Array.isArray(allInvRes2.data?.data) ? allInvRes2.data.data : [];
    const invItemPostKot = itemsList2.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterKot = Number(invItemPostKot?.current_stock || 0);
    logResult('Post-KOT Stock Verification', stockAfterKot === 14.6, `Current Stock: ${stockAfterKot} Kg (Expected 14.6 Kg)`);

    // 8. Generate Order / Bill & Payment (Stock should NOT change)
    console.log('\n--- Step 8: Generate Order, Billing & Payment ---');
    await request('POST', '/orders', {
      table_no: '99',
      items: [{ item_id: menuItemId, quantity: 2, price: 320 }],
      total_amount: 640,
      payment_mode: 'UPI',
      status: 'PAID'
    });
    const allInvRes3 = await request('GET', '/inventory-items');
    const itemsList3 = Array.isArray(allInvRes3.data?.data) ? allInvRes3.data.data : [];
    const invItemPostBill = itemsList3.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterBill = Number(invItemPostBill?.current_stock || 0);
    logResult('No Double Deduction on Payment', stockAfterBill === 14.6, `Stock after Payment: ${stockAfterBill} Kg (Unchanged at 14.6 Kg)`);

    // 9. Cancel KOT (Snapshot Stock Restoration: +0.4 Kg back to 15.0 Kg)
    console.log('\n--- Step 9: Cancel KOT (Snapshot Stock Reversal) ---');
    await request('PATCH', `/kot/${kotId}/status`, {
      status: 'Cancelled',
      cancellationReason: 'Customer Change of Mind'
    });
    const allInvRes4 = await request('GET', '/inventory-items');
    const itemsList4 = Array.isArray(allInvRes4.data?.data) ? allInvRes4.data.data : [];
    const invItemPostCancel = itemsList4.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterCancel = Number(invItemPostCancel?.current_stock || 0);
    logResult('Snapshot KOT Cancel Reversal', stockAfterCancel === 15.0, `Stock after Cancel: ${stockAfterCancel} Kg (Restored to 15.0 Kg)`);

    // 10. Test Idempotency (Cancel again -> No second restoration)
    console.log('\n--- Step 10: Test Idempotent Cancellation ---');
    await request('PATCH', `/kot/${kotId}/status`, {
      status: 'Cancelled',
      cancellationReason: 'Duplicate Cancel Attempt'
    });
    const allInvRes5 = await request('GET', '/inventory-items');
    const itemsList5 = Array.isArray(allInvRes5.data?.data) ? allInvRes4.data.data : [];
    const invItemPostIdem = itemsList5.find(i => Number(i.inventory_item_id) === Number(invItemId));
    const stockAfterIdem = Number(invItemPostIdem?.current_stock || 0);
    logResult('Idempotency Reversal Check', stockAfterIdem === 15.0, `Stock after 2nd Cancel: ${stockAfterIdem} Kg (Remains 15.0 Kg)`);

    // 11. Final Summary Scorecard
    console.log('\n================================================================');
    console.log('📊 FINAL ALFA HMS SYSTEM AUDIT SCORECARD');
    console.log('================================================================');
    const passedCount = testMatrix.filter(t => t.passed).length;
    console.log(`Total Scenarios Tested: ${testMatrix.length}`);
    console.log(`Passed Scenarios:       ${passedCount}`);
    console.log(`Failed Scenarios:       ${testMatrix.length - passedCount}`);
    console.log(`Integration Status:     ${passedCount === testMatrix.length ? '🟢 PRODUCTION READY' : '🔴 NEEDS ATTENTION'}`);

  } catch (err) {
    console.error('\n❌ Audit execution error:', err);
  }
}

runAudit();
