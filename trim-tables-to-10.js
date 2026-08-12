const http = require('http');

function del(id) {
  return new Promise(resolve => {
    const req = http.request(
      { host: 'localhost', port: 3000, path: '/api/tables/' + id, method: 'DELETE' },
      res => {
        let d = '';
        res.on('data', x => d += x);
        res.on('end', () => resolve(JSON.parse(d)));
      }
    );
    req.end();
  });
}

function getAll() {
  return new Promise(resolve => {
    http.get('http://localhost:3000/api/tables', res => {
      let d = '';
      res.on('data', x => d += x);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });
}

async function run() {
  const res = await getAll();
  const tables = res.tables || res.data || [];
  console.log('Total tables before:', tables.length);

  // Sort by numeric table number
  const sorted = tables.sort((a, b) => {
    const an = parseInt(String(a.no || a.table_no || a.id).replace(/\D/g, '')) || 0;
    const bn = parseInt(String(b.no || b.table_no || b.id).replace(/\D/g, '')) || 0;
    return an - bn;
  });

  const keep = sorted.slice(0, 10);
  const toDelete = sorted.slice(10);

  console.log('Keeping:', keep.map(t => t.table_name || t.no).join(', '));
  console.log('Deleting:', toDelete.map(t => t.table_name || t.no).join(', '));

  for (const t of toDelete) {
    const r = await del(t.id);
    console.log('Deleted ID:', t.id, 'Name:', t.table_name, '->', r.message);
  }

  const after = await getAll();
  const afterTables = after.tables || after.data || [];
  console.log('\nFinal table count:', afterTables.length);
  console.log('Tables:', afterTables.map(t => t.table_name || t.no).join(', '));
}

run().catch(console.error);
