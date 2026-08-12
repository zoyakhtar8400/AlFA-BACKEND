const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

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

async function runComprehensiveCrudAudit() {
  console.log('================================================================');
  console.log('🔍 ALFA HMS - COMPREHENSIVE ALL-MODULE CRUD INTEGRITY AUDIT');
  console.log('================================================================\n');

  const results = [];

  async function testCrud(moduleName, endpoints) {
    const itemResult = { module: moduleName, create: 'N/A', read: 'N/A', update: 'N/A', delete: 'N/A', errors: [] };
    let createdId = null;

    try {
      // 1. CREATE
      if (endpoints.create) {
        const payload = typeof endpoints.create.payload === 'function' ? endpoints.create.payload() : endpoints.create.payload;
        const res = await request(endpoints.create.method || 'POST', endpoints.create.path, payload);
        if (res.status >= 200 && res.status < 300 && (res.data?.status === 200 || res.data?.status === '200' || res.data?.id || res.data?.data)) {
          itemResult.create = 'PASS';
          createdId = res.data?.id || res.data?.data?.id || res.data?.data?.supplier_id || res.data?.data?.inventory_item_id || res.data?.data?.unit_id || res.data?.data?.item_id || res.data?.waiters?.[0]?.id || res.data?.store_id || res.data?.tax_id;
        } else {
          itemResult.create = 'FAIL';
          itemResult.errors.push(`Create failed: HTTP ${res.status} - ${JSON.stringify(res.data || res.text)}`);
        }
      }

      // 2. READ
      if (endpoints.read) {
        const readPath = typeof endpoints.read.path === 'function' ? endpoints.read.path(createdId) : endpoints.read.path;
        const res = await request('GET', readPath);
        if (res.status >= 200 && res.status < 300) {
          itemResult.read = 'PASS';
        } else {
          itemResult.read = 'FAIL';
          itemResult.errors.push(`Read failed: HTTP ${res.status} - ${JSON.stringify(res.data || res.text)}`);
        }
      }

      // 3. UPDATE
      if (endpoints.update) {
        const updatePath = typeof endpoints.update.path === 'function' ? endpoints.update.path(createdId) : endpoints.update.path;
        const payload = typeof endpoints.update.payload === 'function' ? endpoints.update.payload(createdId) : endpoints.update.payload;
        const res = await request(endpoints.update.method || 'POST', updatePath, payload);
        if (res.status >= 200 && res.status < 300 && (res.data?.status === 200 || res.data?.status === '200' || res.data?.message || res.data?.data)) {
          itemResult.update = 'PASS';
        } else {
          itemResult.update = 'FAIL';
          itemResult.errors.push(`Update failed: HTTP ${res.status} - ${JSON.stringify(res.data || res.text)}`);
        }
      }

      // 4. DELETE
      if (endpoints.delete) {
        const deletePath = typeof endpoints.delete.path === 'function' ? endpoints.delete.path(createdId) : endpoints.delete.path;
        const res = await request(endpoints.delete.method || 'DELETE', deletePath);
        if (res.status >= 200 && res.status < 300) {
          itemResult.delete = 'PASS';
        } else {
          itemResult.delete = 'FAIL';
          itemResult.errors.push(`Delete failed: HTTP ${res.status} - ${JSON.stringify(res.data || res.text)}`);
        }
      }
    } catch (err) {
      itemResult.errors.push(`Exception: ${err.message}`);
    }

    results.push(itemResult);
    const failCount = [itemResult.create, itemResult.read, itemResult.update, itemResult.delete].filter(x => x === 'FAIL').length;
    const statusIcon = failCount === 0 ? '🟢 PASS' : '🔴 FAIL';

    console.log(`${statusIcon} [${moduleName.padEnd(28)}] C:${itemResult.create} R:${itemResult.read} U:${itemResult.update} D:${itemResult.delete}`);
    if (itemResult.errors.length > 0) {
      itemResult.errors.forEach(e => console.log(`   ⚠️ ${e}`));
    }
  }

  const ts = Date.now().toString().slice(-4);

  // 1. Suppliers
  await testCrud('Suppliers', {
    create: { path: '/api/suppliers', payload: { supplier_name: `Test Vendor ${ts}`, phone: '9900990099' } },
    read: { path: '/api/suppliers' },
    update: { path: '/api/suppliers', method: 'POST', payload: (id) => ({ supplier_id: id || 1, supplier_name: `Test Vendor Updated ${ts}`, phone: '9900990099' }) },
    delete: { path: (id) => `/api/suppliers/${id || 1}` }
  });

  // 2. Inventory Items
  await testCrud('Inventory Items', {
    create: { path: '/api/inventory-items', payload: { item_name: `Test Material ${ts}`, unit: 'kg', current_stock: 10, purchase_price: 100 } },
    read: { path: '/api/inventory-items' },
    update: { path: '/api/inventory-items', method: 'POST', payload: (id) => ({ inventory_item_id: id || 1, item_name: `Test Material Updated ${ts}`, current_stock: 15 }) },
    delete: { path: (id) => `/api/inventory-items/${id || 1}` }
  });

  // 3. Units
  await testCrud('Units', {
    create: { path: '/api/units', payload: { unit_name: `Box_${ts}`, unit_symbol: `bx_${ts}` } },
    read: { path: '/api/units' },
    update: { path: '/api/units', method: 'POST', payload: (id) => ({ unit_id: id || 1, unit_name: `Box_Updated_${ts}` }) },
    delete: { path: (id) => `/api/units/${id || 1}` }
  });

  // 4. Stewards / Waiters
  await testCrud('Steward Master', {
    create: { path: '/api/menu/waiters', payload: { name: `Steward ${ts}`, phone: '9876543210' } },
    read: { path: '/api/menu/waiters' },
    update: { path: '/api/menu/waiters', method: 'POST', payload: (id) => ({ id, name: `Steward Updated ${ts}`, phone: '9876543210' }) },
    delete: { path: (id) => `/api/menu/waiters/${id || 1}` }
  });

  // 5. Delivery Partners
  await testCrud('Delivery Master', {
    create: { path: '/api/delivery-boys', payload: { partner: 'Zomato', name: `Rider ${ts}`, phone: '9123456789' } },
    read: { path: '/api/delivery-boys' },
    update: { path: '/api/delivery-boys', method: 'POST', payload: (id) => ({ id, name: `Rider Updated ${ts}`, partner: 'Swiggy' }) },
    delete: { path: (id) => `/api/delivery-boys/${id || 1}` }
  });

  // 6. Outlets
  await testCrud('Outlet Master', {
    create: { path: '/api/stores', payload: { store_name: `Outlet ${ts}`, phone: '9000000000' } },
    read: { path: '/api/stores' },
    update: { path: '/api/stores', method: 'POST', payload: (id) => ({ store_id: id || 'STORE_1', store_name: `Outlet Updated ${ts}`, phone: '9000000000' }) }
  });

  // 7. Table Master
  await testCrud('Table Master', {
    create: { path: '/api/tables', payload: { table_name: `T-${ts}`, table_number: `${ts}`, seating_capacity: 4 } },
    read: { path: '/api/tables' },
    update: { path: (id) => `/api/tables/${id || 1}`, method: 'PUT', payload: { table_name: `T-${ts}-U`, seating_capacity: 6 } },
    delete: { path: (id) => `/api/tables/${id || 1}` }
  });

  // 8. Categories / Groups
  await testCrud('Item Categories', {
    create: { path: '/api/categories', payload: { category_name: `Cat_${ts}` } },
    read: { path: '/api/categories' },
    update: { path: '/api/categories', method: 'POST', payload: (id) => ({ id, category_name: `Cat_Updated_${ts}` }) },
    delete: { path: (id) => `/api/categories/${id || 1}` }
  });

  // 9. Menu Items
  await testCrud('Menu Items', {
    create: { path: '/api/menu-items', payload: { title: `Menu Dish ${ts}`, price: 250, food_type: 'Veg' } },
    read: { path: '/api/menu-items' },
    update: { path: '/api/menu-items', method: 'POST', payload: (id) => ({ item_id: id || 1, title: `Menu Dish Updated ${ts}`, price: 280 }) },
    delete: { path: (id) => `/api/menu-items/${id || 1}` }
  });

  // 10. Tax Categories
  await testCrud('Item Tax Categories', {
    create: { path: '/api/taxes', payload: { tax_name: `GST ${ts}`, tax_percentage: 18, cgst: 9, sgst: 9 } },
    read: { path: '/api/taxes' },
    update: { path: '/api/taxes', method: 'POST', payload: (id) => ({ id, tax_name: `GST Updated ${ts}`, tax_percentage: 18 }) },
    delete: { path: (id) => `/api/taxes/${id || 1}` }
  });

  // 11. NC Types
  await testCrud('NC Type Master', {
    create: { path: '/api/nc-types', payload: { name: `NC Reason ${ts}`, description: 'Management Duty' } },
    read: { path: '/api/nc-types' },
    update: { path: '/api/nc-types', method: 'POST', payload: (id) => ({ id, name: `NC Reason Updated ${ts}` }) },
    delete: { path: (id) => `/api/nc-types/${id || 1}` }
  });

  // 12. Printers
  await testCrud('Printer Master', {
    create: { path: '/api/printers', payload: { name: `Kitchen Thermal ${ts}`, ip_address: '192.168.1.200', printer_type: 1 } },
    read: { path: '/api/printers' },
    update: { path: '/api/printers', method: 'POST', payload: (id) => ({ id, name: `Kitchen Thermal Updated ${ts}` }) },
    delete: { path: (id) => `/api/printers/${id || 1}` }
  });

  // 13. Kitchen Departments
  await testCrud('Kitchen Departments', {
    create: { path: '/api/production-categories', payload: { name: `Main Pantry ${ts}` } },
    read: { path: '/api/production-categories' },
    update: { path: '/api/production-categories', method: 'POST', payload: (id) => ({ id, name: `Main Pantry Updated ${ts}` }) },
    delete: { path: (id) => `/api/production-categories/${id || 1}` }
  });

  // 14. Rate Categories
  await testCrud('Item Rate Categories', {
    create: { path: '/api/rate-categories', payload: { name: `AC Dining ${ts}`, discount_percentage: 0 } },
    read: { path: '/api/rate-categories' },
    update: { path: '/api/rate-categories', method: 'POST', payload: (id) => ({ id, name: `AC Dining Updated ${ts}` }) },
    delete: { path: (id) => `/api/rate-categories/${id || 1}` }
  });

  // 15. Purchase Indents
  await testCrud('Purchase Indents', {
    create: { path: '/api/purchase-indents', payload: { indent_no: `IND-${ts}`, items: [{ inventory_item_id: 1, quantity: 5 }] } },
    read: { path: '/api/purchase-indents' }
  });

  // 16. GRN (Goods Receipt Note)
  await testCrud('GRN Entry', {
    create: { path: '/api/grn', payload: { supplier_id: 1, invoice_no: `INV-${ts}`, items: [{ inventory_item_id: 1, received_qty: 10, unit_price: 50 }] } },
    read: { path: '/api/grn' }
  });

  // 17. Reservations / Bookings
  await testCrud('Room Reservations', {
    create: { path: '/api/reservations', payload: { guest_name: `Audit Guest ${ts}`, room_no: '101', check_in: '2026-08-12', check_out: '2026-08-14' } },
    read: { path: '/api/reservations' }
  });

  console.log('\n================================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('================================================================');
  const totalModules = results.length;
  const fullyWorking = results.filter(r => r.errors.length === 0).length;
  console.log(`Modules Audited: ${totalModules}`);
  console.log(`Fully Working:   ${fullyWorking} / ${totalModules}`);
  console.log(`Issues Found:    ${totalModules - fullyWorking}`);
}

runComprehensiveCrudAudit();
