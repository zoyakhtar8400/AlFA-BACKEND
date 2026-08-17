const { KOT } = require('../src/com/tmbill/js/database');

async function check() {
  try {
    const list = await KOT.findAll({
      where: { store_id: 'STORE_1' },
      limit: 10,
      order: [['kot_id', 'DESC']],
      raw: true
    });
    console.log('STORE_1 active KOTs:');
    list.forEach(k => {
      console.log({
        kot_id: k.kot_id,
        table_id: k.table_id,
        table_name: k.table_name,
        is_active: k.is_active,
        status: k.status
      });
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
