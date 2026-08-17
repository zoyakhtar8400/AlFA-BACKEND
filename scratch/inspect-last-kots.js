const { KOT } = require('../src/com/tmbill/js/database');

async function check() {
  try {
    const list = await KOT.findAll({
      limit: 5,
      order: [['kot_id', 'DESC']],
      raw: true
    });
    console.log('Last 5 KOTs:');
    list.forEach(k => {
      console.log({
        kot_id: k.kot_id,
        table_id: k.table_id,
        table_name: k.table_name,
        kot_date: k.kot_date,
        is_active: k.is_active,
        store_id: k.store_id
      });
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
