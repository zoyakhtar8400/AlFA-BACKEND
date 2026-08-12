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
      headers: { 'Content-Type': 'application/json' },
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runAllTests() {
  const ts = Date.now().toString().slice(-4);
  console.log('====================================================');
  console.log('  ALFA HMS — MOVE KOT & MOVE QTY AUTOMATED AUDIT    ');
  console.log('====================================================\n');

  // --- TEST 1: FULL KOT MOVE ---
  console.log('--- TEST 1: Full KOT Move ---');
  const t1 = await request('POST', '/tables', { table_name: `T1-Full-${ts}`, seats: 4 });
  const t2 = await request('POST', '/tables', { table_name: `T2-Full-${ts}`, seats: 4 });
  const t1Id = t1.data.data.id;
  const t2Id = t2.data.data.id;

  const kot1 = await request('POST', '/kot', {
    table_id: t1Id,
    table_name: `T1-Full-${ts}`,
    items: [
      { item_id: 101, itemName: 'Paneer Tikka', quantity: 2, price: 250 },
      { item_id: 102, itemName: 'Coke', quantity: 1, price: 50 }
    ]
  });
  const kot1Id = kot1.data.data.kotId || kot1.data.data.kot_id;
  console.log(`Created KOT #${kot1Id} on Table 1 (ID: ${t1Id})`);

  let tables = await request('GET', '/tables');
  let t1Data = tables.data.data.find(t => t.id === t1Id);
  let t2Data = tables.data.data.find(t => t.id === t2Id);
  assert(t1Data.status === 'KOT_CUT' && t1Data.kots.length === 1, 'Table 1 has 1 active KOT');
  assert(t2Data.status === 'AVAILABLE' && t2Data.kots.length === 0, 'Table 2 is AVAILABLE');

  // Perform Move KOT
  const move1 = await request('POST', `/kot/${kot1Id}/move`, { toTableId: t2Id });
  assert(move1.status === 200, 'Move KOT API returns HTTP 200');

  // Refresh (Simulate GET /tables after browser F5)
  tables = await request('GET', '/tables');
  t1Data = tables.data.data.find(t => t.id === t1Id);
  t2Data = tables.data.data.find(t => t.id === t2Id);
  assert(t1Data.status === 'AVAILABLE' && t1Data.kots.length === 0 && t1Data.amount === 0, 'Table 1 is empty and AVAILABLE after move and refresh');
  assert(t2Data.status === 'KOT_CUT' && t2Data.kots.length === 1 && t2Data.amount === 550, 'Table 2 has moved KOT and amount 550 after refresh');
  assert(t2Data.available_actions.includes('print_kot') && t2Data.available_actions.includes('view_kot'), 'Table 2 has KOT icons (print_kot, view_kot)');

  console.log('✓ TEST 1 PASSED!\n');

  // --- TEST 2: PARTIAL QUANTITY MOVE ---
  console.log('--- TEST 2: Partial Quantity Move ---');
  const t3 = await request('POST', '/tables', { table_name: `T3-Part-${ts}`, seats: 4 });
  const t4 = await request('POST', '/tables', { table_name: `T4-Part-${ts}`, seats: 4 });
  const t3Id = t3.data.data.id;
  const t4Id = t4.data.data.id;

  await request('POST', '/kot', {
    table_id: t3Id,
    table_name: `T3-Part-${ts}`,
    items: [{ item_id: 201, itemName: 'Butter Naan', quantity: 5, price: 40 }]
  });

  // Move 2 of Butter Naan (201) from T3 -> T4
  const movePart = await request('POST', '/kot/move-items', {
    fromTableId: t3Id,
    toTableId: t4Id,
    items: { 'Butter Naan': 2 }
  });
  assert(movePart.status === 200, 'Move Items API returns HTTP 200');

  // Refresh
  tables = await request('GET', '/tables');
  let t3Data = tables.data.data.find(t => t.id === t3Id);
  let t4Data = tables.data.data.find(t => t.id === t4Id);

  const t3Qty = t3Data.kots[0].items[0].qty;
  const t4Qty = t4Data.kots[0].items[0].qty;
  assert(t3Qty === 3, 'Table 3 remaining item quantity is 3');
  assert(t4Qty === 2, 'Table 4 moved item quantity is 2');
  assert(t3Data.amount === 120, 'Table 3 amount updated to 120 (3 x 40)');
  assert(t4Data.amount === 80, 'Table 4 amount updated to 80 (2 x 40)');

  console.log('✓ TEST 2 PASSED!\n');

  // --- TEST 3: MULTIPLE ITEMS MOVE ---
  console.log('--- TEST 3: Multiple Items Move ---');
  const t5 = await request('POST', '/tables', { table_name: `T5-Multi-${ts}`, seats: 4 });
  const t6 = await request('POST', '/tables', { table_name: `T6-Multi-${ts}`, seats: 4 });
  const t5Id = t5.data.data.id;
  const t6Id = t6.data.data.id;

  await request('POST', '/kot', {
    table_id: t5Id,
    table_name: `T5-Multi-${ts}`,
    items: [
      { item_id: 301, itemName: 'Item A', quantity: 5, price: 100 },
      { item_id: 302, itemName: 'Item B', quantity: 3, price: 150 },
      { item_id: 303, itemName: 'Item C', quantity: 2, price: 200 }
    ]
  });

  // Move Item A x 2, Item B x 1
  const moveMulti = await request('POST', '/kot/move-items', {
    fromTableId: t5Id,
    toTableId: t6Id,
    items: { 'Item A': 2, 'Item B': 1 }
  });
  assert(moveMulti.status === 200, 'Move Multi Items API returns HTTP 200');

  // Refresh
  tables = await request('GET', '/tables');
  let t5Data = tables.data.data.find(t => t.id === t5Id);
  let t6Data = tables.data.data.find(t => t.id === t6Id);

  const t5Items = t5Data.kots[0].items;
  const t6Items = t6Data.kots[0].items;

  const t5ItemA = t5Items.find(i => i.name === 'Item A')?.qty;
  const t5ItemB = t5Items.find(i => i.name === 'Item B')?.qty;
  const t5ItemC = t5Items.find(i => i.name === 'Item C')?.qty;

  const t6ItemA = t6Items.find(i => i.name === 'Item A')?.qty;
  const t6ItemB = t6Items.find(i => i.name === 'Item B')?.qty;

  assert(t5ItemA === 3 && t5ItemB === 2 && t5ItemC === 2, 'Table 5 has Item A x3, Item B x2, Item C x2');
  assert(t6ItemA === 2 && t6ItemB === 1, 'Table 6 has Item A x2, Item B x1');

  console.log('✓ TEST 3 PASSED!\n');

  // --- TEST 4: KOT ICONS MOVE ---
  console.log('--- TEST 4: KOT Icons Move ---');
  assert(t5Data.available_actions.includes('print_kot') && t5Data.available_actions.includes('view_kot'), 'Table 5 retains icons while active');
  assert(t6Data.available_actions.includes('print_kot') && t6Data.available_actions.includes('view_kot'), 'Table 6 receives KOT icons after item transfer');
  console.log('✓ TEST 4 PASSED!\n');

  // --- TEST 5: FULL TABLE MOVE (Move Table Order) ---
  console.log('--- TEST 5: Full Table Move ---');
  const moveTab = await request('POST', '/kot/move-table', {
    fromTableId: t5Id,
    toTableId: t6Id
  });
  assert(moveTab.status === 200, 'Move Table API returns HTTP 200');

  tables = await request('GET', '/tables');
  t5Data = tables.data.data.find(t => t.id === t5Id);
  t6Data = tables.data.data.find(t => t.id === t6Id);

  assert(t5Data.status === 'AVAILABLE' && t5Data.kots.length === 0, 'Source Table 5 becomes AVAILABLE and empty');
  assert(t6Data.status === 'KOT_CUT' && t6Data.amount > 0, 'Destination Table 6 receives full table order');
  console.log('✓ TEST 5 PASSED!\n');

  // --- TEST 6: BILLED / CANCELLED KOT PROTECTION & FAILED MOVE VALIDATION ---
  console.log('--- TEST 6: Billed / Cancelled KOT Protection & Rollback Validation ---');

  // 1. Cancelled KOT protection
  const cancelledKotRes = await request('DELETE', `/kot/${kot1Id}`);
  const moveCancelled = await request('POST', `/kot/${kot1Id}/move`, { toTableId: t5Id });
  assert(moveCancelled.status >= 400, 'Cannot move cancelled KOT returns HTTP 4xx');

  // 2. Move quantity > available quantity
  const failExcess = await request('POST', '/kot/move-items', {
    fromTableId: t6Id,
    toTableId: t5Id,
    items: { 'Item A': 999 }
  });
  assert(failExcess.status >= 400, 'Move excess quantity returns HTTP 4xx');

  // 3. Same source and destination table
  const failSame = await request('POST', '/kot/move-table', {
    fromTableId: t6Id,
    toTableId: t6Id
  });
  assert(failSame.status >= 400, 'Same table move returns HTTP 4xx');

  // 4. Non-existent table
  const failTable = await request('POST', '/kot/move-table', {
    fromTableId: 999999,
    toTableId: t5Id
  });
  assert(failTable.status >= 400, 'Non-existent source table returns HTTP 4xx');

  console.log('✓ TEST 6 PASSED!\n');

  console.log('====================================================');
  console.log('  ALL 6 TEST SUITES COMPLETED SUCCESSFULLY!         ');
  console.log('====================================================');
}

runAllTests().catch(err => {
  console.error('Unhandled Test Error:', err);
  process.exit(1);
});
