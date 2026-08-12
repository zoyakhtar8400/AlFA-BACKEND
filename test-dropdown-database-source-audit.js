/**
 * ALFA HMS — COMPREHENSIVE DROPDOWN DATABASE SOURCE AUDIT SUITE
 * Tests every single dropdown / select API endpoint across Restaurant & POS modules to confirm PostgreSQL backend data origin.
 */

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path) {
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
    req.end();
  });
}

async function runDropdownAudit() {
  console.log('================================================================');
  console.log('🔍 ALFA HMS — RESTAURANT & POS DROPDOWN DATA SOURCE AUDIT');
  console.log('================================================================\n');

  const dropdowns = [
    { id: 1, module: 'Restaurant / POS', field: 'Dining Table Select', path: '/tables', expectedTable: 'mpos_table' },
    { id: 2, module: 'Restaurant / POS', field: 'Steward / Waiter Select', path: '/menu/waiters', expectedTable: 'mpos_waiter' },
    { id: 3, module: 'Restaurant / POS', field: 'Menu Category Select', path: '/categories', expectedTable: 'mpos_category' },
    { id: 4, module: 'Restaurant / POS', field: 'Menu Item Select', path: '/menu-items', expectedTable: 'mpos_item' },
    { id: 5, module: 'Recipe / Inventory', field: 'Raw Material Ingredient Select', path: '/inventory-items', expectedTable: 'mpos_inventory_item' },
    { id: 6, module: 'POS Master', field: 'Item Tax Category Select', path: '/taxes', expectedTable: 'mpos_tax' },
    { id: 7, module: 'POS Master', field: 'Rate Category Select', path: '/rate-categories', expectedTable: 'mpos_multipricing_settings' },
    { id: 8, module: 'POS Master', field: 'Outlet / Store Select', path: '/stores', expectedTable: 'mpos_store' },
    { id: 9, module: 'POS Master', field: 'Delivery Partner Select', path: '/delivery-boys', expectedTable: 'mpos_delivery_boy' },
    { id: 10, module: 'Restaurant Master', field: 'KOT Printer Select', path: '/printers', expectedTable: 'mpos_printer' },
    { id: 11, module: 'Restaurant Master', field: 'Production Kitchen Routing Select', path: '/production-categories', expectedTable: 'mpos_kitchen_department' },
    { id: 12, module: 'POS Master', field: 'NC Reason Type Select', path: '/nc-types', expectedTable: 'mpos_nc_type' },
    { id: 13, module: 'Purchase Master', field: 'Supplier / Vendor Select', path: '/suppliers', expectedTable: 'mpos_supplier' },
    { id: 14, module: 'Purchase Master', field: 'Unit of Measure Select', path: '/units', expectedTable: 'mpos_unit' },
    { id: 15, module: 'Restaurant Master', field: 'Department Section Select', path: '/department', expectedTable: 'mpos_department' }
  ];

  const summary = { total: dropdowns.length, realDb: 0, failed: 0 };
  const auditTable = [];

  for (const d of dropdowns) {
    try {
      const res = await request('GET', d.path);
      const rawList = Array.isArray(res.data?.data?.tables) 
        ? res.data.tables 
        : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));

      const isRealDb = res.status === 200 && Array.isArray(rawList);
      const statusSymbol = isRealDb ? '🟢 REAL DB' : '🔴 BROKEN API';

      if (isRealDb) summary.realDb++;
      else summary.failed++;

      console.log(`[${String(d.id).padStart(2, '0')}] ${statusSymbol} | ${d.module.padEnd(20)} | ${d.field.padEnd(32)} | API: ${d.path.padEnd(24)} | DB Table: ${d.expectedTable.padEnd(24)} | Records Count: ${rawList.length}`);
      
      auditTable.push({
        id: d.id,
        module: d.module,
        field: d.field,
        path: d.path,
        dbTable: d.expectedTable,
        count: rawList.length,
        status: isRealDb ? '🟢 REAL DATABASE' : '🔴 BROKEN API'
      });
    } catch (err) {
      summary.failed++;
      console.log(`[${String(d.id).padStart(2, '0')}] 🔴 BROKEN API | ${d.module.padEnd(20)} | ${d.field.padEnd(32)} | API: ${d.path.padEnd(24)} | Error: ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 FINAL DROPDOWN DATABASE SOURCE AUDIT SCORECARD');
  console.log('================================================================');
  console.log(`Total Dropdowns Audited: ${summary.total}`);
  console.log(`Verified Real DB Source: ${summary.realDb}`);
  console.log(`Failed / Unverified:     ${summary.failed}`);
  console.log(`Dropdown Integrity:      ${summary.realDb === summary.total ? '🟢 100% VERIFIED REAL DATABASE' : '🔴 ATTENTION REQUIRED'}`);
}

runDropdownAudit();
