const { Table } = require('../src/com/tmbill/js/database');

async function check() {
  try {
    const list = await Table.findAll({
      where: { store_id: 'STORE_1' },
      raw: true
    });
    console.log('STORE_1 tables:');
    list.forEach(t => {
      console.log({
        id: t.id,
        table_name: t.table_name,
        store_id: t.store_id,
        order_state: t.order_state,
        extra_details: t.extra_details
      });
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
