require('dotenv').config();
const { InventoryItem, StockLedger } = require('../src/com/tmbill/js/database');

(async () => {
  const items = await InventoryItem.findAll({ raw: true });
  console.log('📌 Current PostgreSQL Stock Balances:');
  items.forEach(i => console.log(` - ${i.item_name}: ${i.current_stock} ${i.unit}`));

  const ledger = await StockLedger.findAll({ limit: 5, order: [['ledger_id', 'DESC']], raw: true });
  console.log('\n📌 Latest Stock Ledger Audit Trail:');
  ledger.forEach(l => console.log(` - [${l.module}] Ref: ${l.reference_no} | Item ID: ${l.inventory_item_id} | Qty: ${l.qty_change} ${l.unit} | Balance: ${l.closing_balance}`));

  process.exit(0);
})();
