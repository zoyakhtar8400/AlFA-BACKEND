const { Table } = require('../src/com/tmbill/js/database');

async function check() {
  try {
    const list = await Table.findAll({
      where: {
        id: {
          [require('sequelize').Op.between]: [170, 210]
        }
      },
      raw: true
    });
    console.log('Tables found:');
    list.forEach(t => {
      console.log({
        id: t.id,
        table_name: t.table_name,
        store_id: t.store_id,
        order_state: t.order_state
      });
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
