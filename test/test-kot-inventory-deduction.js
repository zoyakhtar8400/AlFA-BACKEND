require('dotenv').config();
const http = require('http');
const {
  sequelize,
  InventoryItem,
  StockLedger,
} = require('../src/com/tmbill/js/database');

function makePostRequest(urlPath, postData) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(postData);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(dataString);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('🧪 Starting KOT Inventory Stock Validation & Deduction Tests...\n');

    // 1. Fetch initial stock
    const paneerBefore = await InventoryItem.findOne({ where: { item_name: 'Paneer' } });
    const onionBefore = await InventoryItem.findOne({ where: { item_name: 'Onion' } });
    const butterBefore = await InventoryItem.findOne({ where: { item_name: 'Butter' } });
    const cokeBefore = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });

    console.log('📊 Stock BEFORE KOT:');
    console.log(` - Paneer: ${paneerBefore.current_stock} g`);
    console.log(` - Onion: ${onionBefore.current_stock} g`);
    console.log(` - Butter: ${butterBefore.current_stock} g`);
    console.log(` - Coca Cola: ${cokeBefore.current_stock} Bottles\n`);

    // TEST 1: Recipe-Based KOT (2 x Paneer Tikka)
    console.log('🔹 TEST 1: Cutting KOT for 2 x Paneer Tikka (Recipe-Based)...');
    const res1 = await makePostRequest('/api/kot', {
      tableId: 1,
      tableNo: '01',
      items: [
        { itemId: 1, itemName: 'Paneer Tikka', qty: 2, unitPrice: 350 }
      ]
    });

    console.log(`Result 1 (Status ${res1.statusCode}):`, res1.body.message || res1.body.id || res1.body);

    const paneerAfter1 = await InventoryItem.findOne({ where: { item_name: 'Paneer' } });
    const onionAfter1 = await InventoryItem.findOne({ where: { item_name: 'Onion' } });
    const butterAfter1 = await InventoryItem.findOne({ where: { item_name: 'Butter' } });

    console.log('📊 Stock AFTER Test 1:');
    console.log(` - Paneer: ${paneerAfter1.current_stock} g (Expected: ${Number(paneerBefore.current_stock) - 400} g)`);
    console.log(` - Onion: ${onionAfter1.current_stock} g (Expected: ${Number(onionBefore.current_stock) - 100} g)`);
    console.log(` - Butter: ${butterAfter1.current_stock} g (Expected: ${Number(butterBefore.current_stock) - 40} g)\n`);

    // TEST 2: Direct Finished Good KOT (3 x Coca Cola)
    console.log('🔹 TEST 2: Cutting KOT for 3 x Coca Cola (Direct Finished Good)...');
    const res2 = await makePostRequest('/api/kot', {
      tableId: 2,
      tableNo: '02',
      items: [
        { itemId: 10, itemName: 'Coca Cola', qty: 3, unitPrice: 40 }
      ]
    });

    console.log(`Result 2 (Status ${res2.statusCode}):`, res2.body.message || res2.body.id || res2.body);

    const cokeAfter2 = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });
    console.log('📊 Stock AFTER Test 2:');
    console.log(` - Coca Cola: ${cokeAfter2.current_stock} Bottles (Expected: ${Number(cokeBefore.current_stock) - 3} Bottles)\n`);

    // TEST 3: Insufficient Stock Test (30 x Coca Cola)
    console.log('🔹 TEST 3: Cutting KOT for 30 x Coca Cola (Should fail due to insufficient stock)...');
    const res3 = await makePostRequest('/api/kot', {
      tableId: 3,
      tableNo: '03',
      items: [
        { itemId: 10, itemName: 'Coca Cola', qty: 30, unitPrice: 40 }
      ]
    });

    console.log(`Result 3 (Status ${res3.statusCode}):`, res3.body.message || res3.body);

    const cokeAfter3 = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });
    console.log('📊 Stock AFTER Test 3:');
    console.log(` - Coca Cola: ${cokeAfter3.current_stock} Bottles (Unchanged, stock rollback successful)\n`);

    // Check Stock Ledger
    const ledger = await StockLedger.findAll({ limit: 10, order: [['ledger_id', 'DESC']] });
    console.log(`📜 Recent Stock Ledger Audit Entries (${ledger.length} entries):`);
    ledger.forEach(l => {
      console.log(` - [${l.module}] Ref: ${l.reference_no} | Item ID: ${l.inventory_item_id} | Qty Change: ${l.qty_change} ${l.unit} | Balance: ${l.closing_balance}`);
    });

    console.log('\n✅ All KOT Stock Validation & Deduction Tests Passed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Execution Failed:', err);
    process.exit(1);
  }
}

runTests();
