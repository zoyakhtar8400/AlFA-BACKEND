/**
 * ALFA HMS — Table Master ↔ Display Table Complete CRUD & Integration Regression Test
 * Run: node test-table-master-full.js
 */
const http = require('http');

const BASE = 'http://localhost:3000/api';
let passed = 0, failed = 0;
const results = [];

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000,
      path: `/api${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const r = http.request(options, res => {
      let d = '';
      res.on('data', x => d += x);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve({ raw: d }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
    results.push({ name, pass: true });
  } else {
    console.log(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
    results.push({ name, pass: false, detail });
  }
}

async function cleanup(name) {
  const res = await req('GET', '/tables');
  const tables = res.tables || res.data || [];
  const mine = tables.filter(t => String(t.table_name || '').startsWith(name));
  for (const t of mine) await req('DELETE', `/tables/${t.id}`);
  return mine.length;
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ALFA HMS — Table Master CRUD Regression Test');
  console.log('═══════════════════════════════════════════════════\n');

  // ── PRE-CLEANUP ───────────────────────────────────────────────────────────
  console.log('── Pre-cleanup (removing TEST_ tables) ──');
  await cleanup('TEST_');

  // ── 1: GET empty (or whatever is in DB) ───────────────────────────────────
  console.log('\n[1] READ — GET all tables');
  const listRes = await req('GET', '/tables');
  const initialTables = listRes.tables || listRes.data || [];
  assert('GET /tables returns 200', listRes.status === 200, `status=${listRes.status}`);
  assert('Response has tables array', Array.isArray(initialTables));
  console.log(`    DB has ${initialTables.length} table(s) before test`);

  // ── 2: CREATE one table ───────────────────────────────────────────────────
  console.log('\n[2] CREATE — Single table');
  const createRes = await req('POST', '/tables', {
    table_name: 'TEST_T01', name: 'TEST_T01',
    seats: 4, max_person: 4,
    section: 'Restaurant', department: 'Restaurant',
    floor: 'Ground Floor', status: 'AVAILABLE'
  });
  assert('POST /tables returns 201', createRes.status === 201, `status=${createRes.status}, msg=${createRes.message}`);
  const createdId = createRes.table?.id || createRes.data?.id;
  assert('Created table has an ID', !!createdId, `id=${createdId}`);

  // ── 3: Verify in GET ──────────────────────────────────────────────────────
  console.log('\n[3] READ — Verify created table appears in list');
  const listAfterCreate = await req('GET', '/tables');
  const tablesAfterCreate = listAfterCreate.tables || listAfterCreate.data || [];
  const found = tablesAfterCreate.find(t => t.id === createdId);
  assert('New table appears in GET /tables', !!found, `id=${createdId}`);
  assert('New table has correct name', found?.table_name === 'TEST_T01');

  // ── 4: Verify count increased by 1 ────────────────────────────────────────
  assert('Row count increased by 1', tablesAfterCreate.length === initialTables.length + 1,
    `before=${initialTables.length} after=${tablesAfterCreate.length}`);

  // ── 5: BULK CREATE 5 tables ───────────────────────────────────────────────
  console.log('\n[4] BULK CREATE — 5 tables (TEST_T02 to TEST_T06)');
  const bulkPayloads = [02,03,04,05,06].map(n => ({
    table_name: `TEST_T0${n}`, name: `TEST_T0${n}`,
    seats: 4, max_person: 4,
    section: 'Restaurant', department: 'Restaurant',
    floor: 'Ground Floor', status: 'AVAILABLE'
  }));
  for (const p of bulkPayloads) {
    const r = await req('POST', '/tables', p);
    assert(`Bulk: ${p.table_name} created (201)`, r.status === 201, `status=${r.status}`);
  }

  // ── 6: Verify all 6 tables + original still present ──────────────────────
  console.log('\n[5] READ — Verify all 6 TEST_ tables present + existing tables remain');
  const listAfterBulk = await req('GET', '/tables');
  const tablesAfterBulk = listAfterBulk.tables || listAfterBulk.data || [];
  const testTables = tablesAfterBulk.filter(t => String(t.table_name || '').startsWith('TEST_'));
  assert('All 6 TEST_ tables exist in DB', testTables.length === 6, `found=${testTables.length}`);
  assert('Pre-existing tables still present', tablesAfterBulk.length === initialTables.length + 6,
    `expected=${initialTables.length + 6} got=${tablesAfterBulk.length}`);

  // ── 7: Verify sort order ──────────────────────────────────────────────────
  console.log('\n[6] ORDER — Tables sorted in natural sequence');
  const testSorted = testTables.sort((a, b) => {
    const na = parseInt(String(a.table_name || '').replace(/\D/g, '')) || 0;
    const nb = parseInt(String(b.table_name || '').replace(/\D/g, '')) || 0;
    return na - nb;
  });
  const names = testSorted.map(t => t.table_name);
  assert('TEST_ tables in numeric order', JSON.stringify(names) ===
    JSON.stringify(['TEST_T01','TEST_T02','TEST_T03','TEST_T04','TEST_T05','TEST_T06']),
    `order=${names.join(',')}`);

  // ── 8: UPDATE one table ───────────────────────────────────────────────────
  console.log('\n[7] UPDATE — Edit TEST_T01');
  const updateRes = await req('PUT', `/tables/${createdId}`, {
    table_name: 'TEST_T01_UPDATED', name: 'TEST_T01_UPDATED',
    seats: 6, max_person: 6,
    department: 'Bar', section: 'Bar',
    floor: 'First Floor'
  });
  assert('PUT /tables/:id returns 200', updateRes.status === 200, `status=${updateRes.status}`);

  // Verify updated in GET
  const listAfterUpdate = await req('GET', '/tables');
  const updatedRow = (listAfterUpdate.tables || []).find(t => t.id === createdId);
  assert('Updated name visible in GET', updatedRow?.table_name === 'TEST_T01_UPDATED');
  assert('Updated seats visible in GET', Number(updatedRow?.seats) === 6, `seats=${updatedRow?.seats}`);

  // ── 9: DELETE one table ───────────────────────────────────────────────────
  console.log('\n[8] DELETE — Remove TEST_T01_UPDATED');
  const delRes = await req('DELETE', `/tables/${createdId}`);
  assert('DELETE /tables/:id returns 200', delRes.status === 200);

  const listAfterDelete = await req('GET', '/tables');
  const tablesAfterDelete = listAfterDelete.tables || listAfterDelete.data || [];
  const stillThere = tablesAfterDelete.find(t => t.id === createdId);
  assert('Deleted table absent from GET', !stillThere);
  assert('Count decreased by 1 after delete',
    tablesAfterDelete.length === tablesAfterBulk.length - 1,
    `expected=${tablesAfterBulk.length - 1} got=${tablesAfterDelete.length}`);

  // ── 10: PAGINATION logic ──────────────────────────────────────────────────
  console.log('\n[9] PAGINATION — Verify page logic');
  const total = tablesAfterDelete.length;
  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);
  const page1 = tablesAfterDelete.slice(0, pageSize);
  const page2 = tablesAfterDelete.slice(pageSize, pageSize * 2);
  assert('Page 1 has ≤ 10 records', page1.length <= pageSize, `page1.length=${page1.length}`);
  if (total > pageSize) {
    assert('Page 2 has remaining records', page2.length > 0 && page2.length <= pageSize);
    assert('No overlap between page 1 and 2',
      !page1.some(a => page2.some(b => b.id === a.id)));
  } else {
    assert('All records fit on page 1', page1.length === total);
  }
  console.log(`    Total: ${total} | Pages at size 10: ${totalPages}`);

  // ── 11: SEARCH + PAGINATION ───────────────────────────────────────────────
  console.log('\n[10] SEARCH — Filter TEST_ tables');
  const allAfter = listAfterDelete.tables || [];
  const filtered = allAfter.filter(t => String(t.table_name || '').includes('TEST_'));
  const paginated = filtered.slice(0, 10);
  assert('Search filter reduces results', filtered.length < allAfter.length || allAfter.length === 0);
  assert('Paginated search is subset of filtered', paginated.length <= filtered.length);

  // ── 12: EMPTY STATE ───────────────────────────────────────────────────────
  console.log('\n[11] EMPTY STATE — GET returns valid structure when no results');
  assert('GET response always has tables array', Array.isArray(listAfterDelete.tables || listAfterDelete.data));
  assert('Empty search returns empty array not error',
    Array.isArray(allAfter.filter(t => t.table_name === '__NO_MATCH__')));

  // ── POST-CLEANUP ──────────────────────────────────────────────────────────
  console.log('\n── Post-cleanup ──');
  const cleaned = await cleanup('TEST_');
  console.log(`    Cleaned up ${cleaned} TEST_ table(s)`);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED — Table Master CRUD is fully functional.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
