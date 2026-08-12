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

async function testMoveKotRefresh() {
  const ts = Date.now().toString().slice(-4);
  console.log('=== TEST MOVE KOT REFRESH PERSISTENCE ===');

  // 1. Create Table 1 and Table 2
  const t1Res = await request('POST', '/tables', { table_name: `T-100-${ts}`, seats: 4 });
  const t1Id = t1Res.data?.data?.id;
  console.log('Created Table 1 ID:', t1Id);

  const t2Res = await request('POST', '/tables', { table_name: `T-200-${ts}`, seats: 4 });
  const t2Id = t2Res.data?.data?.id;
  console.log('Created Table 2 ID:', t2Id);

  // 2. Cut KOT on Table 1
  const kotRes = await request('POST', '/kot', {
    table_id: t1Id,
    table_name: `T-100-${ts}`,
    items: [{ item_id: 1, itemName: 'Paneer Tikka', quantity: 2, price: 300 }]
  });
  const kotId = kotRes.data?.data?.kotId || kotRes.data?.data?.kot_id;
  console.log('Created KOT ID:', kotId, 'on Table 1');

  // Verify DB state BEFORE move
  let tablesBefore = await request('GET', '/tables');
  let t1Before = tablesBefore.data?.data?.find(t => t.id === t1Id);
  let t2Before = tablesBefore.data?.data?.find(t => t.id === t2Id);
  console.log('BEFORE MOVE: Table 1 state:', t1Before?.status, 'color:', t1Before?.color, 'kots:', t1Before?.kots?.length);
  console.log('BEFORE MOVE: Table 2 state:', t2Before?.status, 'color:', t2Before?.color, 'kots:', t2Before?.kots?.length);

  // 3. Move KOT from Table 1 to Table 2
  const moveRes = await request('POST', `/kot/${kotId}/move`, { toTableId: t2Id });
  console.log('MOVE RESPONSE:', moveRes.status, moveRes.data?.message);

  // 4. Verify DB state AFTER move (Simulating Page Refresh / GET /tables)
  let tablesAfter = await request('GET', '/tables');
  let t1After = tablesAfter.data?.data?.find(t => t.id === t1Id);
  let t2After = tablesAfter.data?.data?.find(t => t.id === t2Id);

  console.log('\nAFTER MOVE (POSTGRESQL REFRESH):');
  console.log('Table 1 (Source): status =', t1After?.status, '| color =', t1After?.color, '| kots =', t1After?.kots?.length);
  console.log('Table 2 (Dest)  : status =', t2After?.status, '| color =', t2After?.color, '| kots =', t2After?.kots?.length);
}

testMoveKotRefresh();
