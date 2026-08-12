require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

const endpoints = [
  { name: 'Dashboard KPIs', method: 'GET', url: '/purchase/dashboard-kpis' },
  { name: 'Consolidated Dashboard', method: 'GET', url: '/purchase/dashboard' },
  { name: 'Suppliers List', method: 'GET', url: '/suppliers' },
  { name: 'Item Groups List', method: 'GET', url: '/item-groups' },
  { name: 'Units List', method: 'GET', url: '/units' },
  { name: 'Inventory Items List', method: 'GET', url: '/inventory-items' },
  { name: 'Purchase Orders List', method: 'GET', url: '/purchase-orders' },
  { name: 'GRN List', method: 'GET', url: '/grn' },
  { name: 'Purchase Bills List', method: 'GET', url: '/purchase-bills' },
  { name: 'Indents List', method: 'GET', url: '/indents' },
  {
    name: 'Create Supplier',
    method: 'POST',
    url: '/suppliers',
    body: { supplier_code: 'SUP-TEST', supplier_name: 'Test Vendor', phone: '9999999999' }
  },
  {
    name: 'Create Item Group',
    method: 'POST',
    url: '/item-groups',
    body: { group_name: 'TEST GROUP', group_type: 'Store Item' }
  },
  {
    name: 'Create Unit',
    method: 'POST',
    url: '/units',
    body: { unit_name: 'BOX-TEST', qty_decimal_places: 2 }
  },
  {
    name: 'Create Inventory Item',
    method: 'POST',
    url: '/inventory-items',
    body: { item_name: 'TEST ITEM', item_type: 'RAW', unit: 'Kg', purchase_price: 50 }
  },
  {
    name: 'Create Indent Requisition',
    method: 'POST',
    url: '/indents',
    body: { indent_number: 'IND-TEST-1', department: 'MAIN KITCHEN', requested_by: 'Chef', items: [{ inventory_item_id: 1, quantity: 5, unit: 'Kg' }] }
  },
  {
    name: 'Create Purchase Order',
    method: 'POST',
    url: '/purchase-orders',
    body: { po_number: 'PO-TEST-1', supplier_id: 1, net_amount: 500, items: [{ inventory_item_id: 1, order_qty: 10, unit_price: 50, total_amount: 500 }] }
  },
  {
    name: 'Create GRN Receipt',
    method: 'POST',
    url: '/grn',
    body: { grn_number: 'GRN-TEST-1', supplier_id: 1, net_amount: 500, items: [{ inventory_item_id: 1, received_qty: 10, unit_price: 50, total_amount: 500 }] }
  },
  {
    name: 'Create Purchase Bill',
    method: 'POST',
    url: '/purchase-bills',
    body: { bill_number: 'BILL-TEST-1', supplier_id: 1, total_amount: 500, paid_amount: 0 }
  },
  {
    name: 'Process Purchase Return',
    method: 'POST',
    url: '/purchase-returns',
    body: { return_number: 'RET-TEST-1', supplier_id: 1, total_amount: 100, items: [{ inventory_item_id: 1, return_qty: 2 }] }
  },
  {
    name: 'Process Department Issue',
    method: 'POST',
    url: '/department-issues',
    body: { issue_number: 'ISS-TEST-1', from_department: 'STORE', to_department: 'KITCHEN', items: [{ inventory_item_id: 1, issue_qty: 2 }] }
  },
  {
    name: 'Open Stock Entry',
    method: 'POST',
    url: '/open-stock',
    body: { remarks: 'Initial Open Stock Audit', items: [{ inventory_item_id: 1, opening_stock: 5, unit: 'Kg' }] }
  },
  {
    name: 'Item CSV Bulk Upload',
    method: 'POST',
    url: '/inventory-items/upload-csv',
    body: { items: [{ item_name: 'CSV TEST PANEER', item_type: 'RAW', unit: 'Kg', purchase_price: 150 }] }
  }
];

async function runAudit() {
  console.log('🔍 RUNNING COMPREHENSIVE PURCHASE API AUDIT...\n');
  const results = [];

  for (const ep of endpoints) {
    try {
      const options = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (ep.body) options.body = JSON.stringify(ep.body);

      const res = await fetch(`${BASE_URL}${ep.url}`, options);
      const status = res.status;
      const json = await res.json().catch(() => null);

      if (status >= 200 && status < 300) {
        results.push({ name: ep.name, url: ep.url, method: ep.method, status: `${status} OK`, working: true, message: json?.message || 'Success' });
      } else {
        results.push({ name: ep.name, url: ep.url, method: ep.method, status: `${status} ERROR`, working: false, message: json?.message || json?.error || 'HTTP Error' });
      }
    } catch (err) {
      results.push({ name: ep.name, url: ep.url, method: ep.method, status: 'FAILED', working: false, message: err.message });
    }
  }

  console.table(results);
  const workingCount = results.filter(r => r.working).length;
  const failedCount = results.filter(r => !r.working).length;
  console.log(`\n==========================================`);
  console.log(`✅ WORKING APIS: ${workingCount} / ${results.length}`);
  console.log(`❌ FAILED APIS : ${failedCount} / ${results.length}`);
  console.log(`==========================================\n`);
  process.exit(0);
}

runAudit();
