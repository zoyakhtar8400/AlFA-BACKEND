const http = require('http');

function del(id) {
  return new Promise(resolve => {
    const req = http.request(
      { host: 'localhost', port: 3000, path: '/api/tables/' + id, method: 'DELETE' },
      res => {
        let d = '';
        res.on('data', x => d += x);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ message: d }); } });
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
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
  });
}

async function run() {
  const res = await getAll();
  const tables = res.tables || res.data || [];
  console.log('Total tables before:', tables.length);

  // Find tables whose number is 21-30 (in name like T21..T30 or no field)
  const toDelete = tables.filter(t => {
    const name = String(t.table_name || t.name || t.no || '');
    const num = parseInt(name.replace(/\D/g, ''));
    return num >= 21 && num <= 30;
  });

  if (toDelete.length === 0) {
    console.log('No tables found in range 21-30. Current tables:');
    tables.forEach(t => console.log(' -', t.table_name || t.name, '| id:', t.id));
    return;
  }

  console.log('Deleting:', toDelete.map(t => t.table_name || t.name).join(', '));

  for (const t of toDelete) {
    const r = await del(t.id);
    console.log('Deleted ID:', t.id, 'Name:', t.table_name || t.name, '->', r.message);
  }

  const after = await getAll();
  const afterTables = after.tables || after.data || [];
  console.log('\nFinal table count:', afterTables.length);
  console.log('Remaining:', afterTables.map(t => t.table_name || t.name).join(', '));
}

run().catch(console.error);
