require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve) => {
    const dataString = body ? JSON.stringify(body) : null;
    const url = new URL(`${BASE_URL}${urlPath}`);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (dataString) {
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

const testCases = [
  // ==========================================
  // 📦 PURCHASE & INVENTORY MODULE APIS
  // ==========================================
  { category: 'PURCHASE', name: '1. Dashboard KPIs', method: 'GET', url: '/purchase/dashboard-kpis' },
  { category: 'PURCHASE', name: '2. Consolidated Dashboard', method: 'GET', url: '/purchase/dashboard' },
  { category: 'PURCHASE', name: '3. Suppliers List', method: 'GET', url: '/suppliers' },
  {
    category: 'PURCHASE',
    name: '4. Create Supplier',
    method: 'POST',
    url: '/suppliers',
    body: { supplier_name: 'GLOBAL FOOD SUPPLIERS LTD', contact_person: 'Rahul Sharma', phone: '9876543210', email: 'rahul@globalfood.com', gstin: '27ABCDE1234F1Z5', current_balance: 5000 }
  },
  { category: 'PURCHASE', name: '5. Item Groups List', method: 'GET', url: '/item-groups' },
  {
    category: 'PURCHASE',
    name: '6. Create Item Group',
    method: 'POST',
    url: '/item-groups',
    body: { group_name: 'DAIRY PRODUCTS', group_type: 'Raw Material' }
  },
  { category: 'PURCHASE', name: '7. Units List', method: 'GET', url: '/units' },
  {
    category: 'PURCHASE',
    name: '8. Create Unit',
    method: 'POST',
    url: '/units',
    body: { unit_name: 'Kg', qty_decimal_places: 3 }
  },
  { category: 'PURCHASE', name: '9. Inventory Items List', method: 'GET', url: '/inventory-items' },
  {
    category: 'PURCHASE',
    name: '10. Create Inventory Item (Paneer)',
    method: 'POST',
    url: '/inventory-items',
    body: { item_name: 'Fresh Paneer', item_type: 'RAW', unit: 'Kg', current_stock: 50, minimum_stock: 5, purchase_price: 300, selling_price: 0 }
  },
  {
    category: 'PURCHASE',
    name: '11. Create Inventory Item (Cold Drink)',
    method: 'POST',
    url: '/inventory-items',
    body: { item_name: 'Coca Cola 300ml', item_type: 'FINISHED', unit: 'Pcs', current_stock: 100, minimum_stock: 10, purchase_price: 20, selling_price: 40 }
  },
  { category: 'PURCHASE', name: '12. Purchase Orders List', method: 'GET', url: '/purchase-orders' },
  {
    category: 'PURCHASE',
    name: '13. Create Purchase Order',
    method: 'POST',
    url: '/purchase-orders',
    body: { po_number: 'PO-AUDIT-001', supplier_id: 1, gross_amount: 3000, tax_amount: 0, net_amount: 3000, items: [{ inventory_item_id: 1, order_qty: 10, unit: 'Kg', unit_price: 300 }] }
  },
  { category: 'PURCHASE', name: '14. GRN List', method: 'GET', url: '/grn' },
  {
    category: 'PURCHASE',
    name: '15. Create GRN (Stock Inflow)',
    method: 'POST',
    url: '/grn',
    body: { grn_number: 'GRN-AUDIT-001', supplier_id: 1, party_challan_no: 'CH-999', gross_amount: 3000, net_amount: 3000, items: [{ inventory_item_id: 1, received_qty: 10, unit: 'Kg', unit_price: 300 }] }
  },
  { category: 'PURCHASE', name: '16. Purchase Bills List', method: 'GET', url: '/purchase-bills' },
  {
    category: 'PURCHASE',
    name: '17. Create Purchase Bill',
    method: 'POST',
    url: '/purchase-bills',
    body: { bill_number: 'BILL-AUDIT-001', supplier_invoice_no: 'INV-888', supplier_id: 1, total_amount: 3000, paid_amount: 1000 }
  },
  { category: 'PURCHASE', name: '18. Indents List', method: 'GET', url: '/indents' },
  {
    category: 'PURCHASE',
    name: '19. Create Indent Requisition',
    method: 'POST',
    url: '/indents',
    body: { indent_number: 'IND-AUDIT-001', department: 'MAIN KITCHEN', requested_by: 'Head Chef', items: [{ inventory_item_id: 1, quantity: 5, unit: 'Kg' }] }
  },
  {
    category: 'PURCHASE',
    name: '20. Approve Indent',
    method: 'PUT',
    url: '/indents/1/status',
    body: { status: 'APPROVED' }
  },
  {
    category: 'PURCHASE',
    name: '21. Process Purchase Return',
    method: 'POST',
    url: '/purchase-returns',
    body: { return_number: 'RET-AUDIT-001', supplier_id: 1, reason: 'Damaged packaging', total_amount: 600, items: [{ inventory_item_id: 1, return_qty: 2, unit: 'Kg' }] }
  },
  {
    category: 'PURCHASE',
    name: '22. Process Department Issue',
    method: 'POST',
    url: '/department-issues',
    body: { issue_number: 'ISS-AUDIT-001', from_department: 'STORE', to_department: 'MAIN KITCHEN', items: [{ inventory_item_id: 1, issue_qty: 3, unit: 'Kg' }] }
  },
  {
    category: 'PURCHASE',
    name: '23. Open Stock Entry',
    method: 'POST',
    url: '/open-stock',
    body: { remarks: 'Audit Initial Stock Adjustment', items: [{ inventory_item_id: 1, opening_stock: 5, unit: 'Kg' }] }
  },
  {
    category: 'PURCHASE',
    name: '24. Item CSV Bulk Upload',
    method: 'POST',
    url: '/inventory-items/upload-csv',
    body: { items: [{ item_name: 'CSV Amul Butter', item_type: 'RAW', unit: 'Kg', purchase_price: 500, current_stock: 10 }] }
  },
  { category: 'PURCHASE', name: '25. Recipes List', method: 'GET', url: '/recipes' },
  {
    category: 'PURCHASE',
    name: '26. Create/Update Recipe',
    method: 'POST',
    url: '/recipes',
    body: { menu_item_id: 1, recipe_name: 'Paneer Tikka Recipe', yield_qty: 1, ingredients: [{ inventory_item_id: 1, quantity: 200, unit: 'g' }] }
  },
  {
    category: 'PURCHASE',
    name: '27. Link Direct Finished Good',
    method: 'POST',
    url: '/menu-item/direct-link',
    body: { menu_item_id: 2, direct_inventory_item_id: 2 }
  },
  { category: 'PURCHASE', name: '28. Stock Ledger History', method: 'GET', url: '/stock-ledger' },

  // ==========================================
  // 🍽 RESTAURANT & KOT MODULE APIS
  // ==========================================
  { category: 'RESTAURANT', name: '29. Get All Tables', method: 'GET', url: '/tables' },
  { category: 'RESTAURANT', name: '30. Get Single Table (Table 1)', method: 'GET', url: '/tables/1' },
  { category: 'RESTAURANT', name: '31. Get All KOTs', method: 'GET', url: '/kot' },
  {
    category: 'RESTAURANT',
    name: '32. Create KOT (Recipe Stock Deduction)',
    method: 'POST',
    url: '/kot',
    body: { tableId: 1, tableNo: '01', customerName: 'Rohan Sharma', waiter: 'Rakesh', items: [{ itemId: 1, itemName: 'Paneer Tikka', qty: 2, unitPrice: 350 }] }
  },
  {
    category: 'RESTAURANT',
    name: '33. Create KOT (Direct Sale Deduction)',
    method: 'POST',
    url: '/kot',
    body: { tableId: 2, tableNo: '02', customerName: 'Anita Gupta', waiter: 'Sunil', items: [{ itemId: 2, itemName: 'Coca Cola 300ml', qty: 2, unitPrice: 40 }] }
  },
  { category: 'RESTAURANT', name: '34. Get KOT Details (KOT-1)', method: 'GET', url: '/kot/1' },
  {
    category: 'RESTAURANT',
    name: '35. Update KOT Status (Preparing)',
    method: 'PATCH',
    url: '/kot/1/status',
    body: { status: 'Preparing' }
  },
  {
    category: 'RESTAURANT',
    name: '36. Move KOT to Table 3',
    method: 'POST',
    url: '/kot/1/move',
    body: { toTableId: 3, toTableNo: '03' }
  },
  {
    category: 'RESTAURANT',
    name: '37. Close KOTs for Table 1',
    method: 'POST',
    url: '/kot/close-table/1',
  },
  { category: 'RESTAURANT', name: '38. Get All Orders', method: 'GET', url: '/orders' },
  { category: 'RESTAURANT', name: '39. Get Menu Catalogue', method: 'GET', url: '/menu?store_id=STORE_1' },
  { category: 'RESTAURANT', name: '40. Get Menu Item Prices', method: 'GET', url: '/menu/getItemPrices?store_id=STORE_1' },
  { category: 'RESTAURANT', name: '41. Get Categories List', method: 'GET', url: '/categories' },
  { category: 'RESTAURANT', name: '42. Get Menu Items List', method: 'GET', url: '/menu-items' },
  { category: 'RESTAURANT', name: '43. Get Departments', method: 'GET', url: '/departments' },
  { category: 'RESTAURANT', name: '44. Get Customers List', method: 'GET', url: '/customer?store_id=STORE_1' },
  {
    category: 'RESTAURANT',
    name: '45. Create Customer',
    method: 'POST',
    url: '/customer',
    body: { name: 'Audit Test Customer', phone: '9988776655', store_id: 'STORE_1' }
  },
  { category: 'RESTAURANT', name: '46. Get Table Reservations', method: 'GET', url: '/reservations' },
  { category: 'RESTAURANT', name: '47. Get KDS Running Tables', method: 'GET', url: '/kds/runningtables?store_id=STORE_1' }
];

async function run100PercentAudit() {
  console.log('\n========================================================================');
  console.log('🧪 RUNNING 100% AUDIT OF PURCHASE & RESTAURANT API ENDPOINTS');
  console.log('========================================================================\n');

  const results = [];

  for (const test of testCases) {
    const res = await makeRequest(test.method, test.url, test.body);
    const isSuccess = res.status >= 200 && res.status < 300;
    const msg = res.body?.message || (res.body?.data ? 'OK' : (res.error || (typeof res.body === 'string' ? res.body.slice(0, 50) : 'HTTP Error')));

    results.push({
      Category: test.category,
      API: test.name,
      Method: test.method,
      URL: test.url,
      Status: res.status,
      Working: isSuccess ? '✅ YES' : '❌ NO',
      Message: String(msg).slice(0, 65)
    });
  }

  console.table(results);

  const total = results.length;
  const passed = results.filter(r => r.Working.includes('YES')).length;
  const failed = total - passed;
  const passPercentage = Math.round((passed / total) * 100);

  console.log('\n========================================================================');
  console.log(`📊 FINAL 100% API AUDIT SUMMARY:`);
  console.log(` - Total Endpoints Tested : ${total}`);
  console.log(` - Working / Passed       : ${passed} ✅`);
  console.log(` - Failed                 : ${failed} ❌`);
  console.log(` - Success Rate           : ${passPercentage}%`);
  console.log('========================================================================\n');

  process.exit(0);
}

run100PercentAudit();
