const { Bill } = require('../src/com/tmbill/js/database');

async function checkOrders() {
  try {
    const orders = await Bill.findAll({
      attributes: ['id', 'order_total', 'my_order_date', 'order_state', 'payment', 'store_id'],
      limit: 10,
      order: [['id', 'DESC']]
    });
    console.log('Last 10 orders:');
    orders.forEach(o => {
      console.log({
        id: o.id,
        store_id: o.store_id,
        total: o.order_total,
        date: o.my_order_date,
        state: o.order_state,
        payment: o.payment
      });
    });
  } catch (err) {
    console.error('Error querying orders:', err);
  }
  process.exit(0);
}

checkOrders();
