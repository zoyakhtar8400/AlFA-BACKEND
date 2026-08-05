const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();

// GET /api/billing/pending — load all pending / unpaid orders for Billing Desk
router.get('/pending', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const bills = await global.serverdbConnection.Bill.findAll({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { order_state: 'pending' },
          { order_state: 'Running' },
          { order_state: 'placed' }
        ]
      },
      order: [['id', 'DESC']],
      raw: true
    });

    const billIds = bills.map(b => b.order_id || b.id);
    const billItems = billIds.length > 0 ? await global.serverdbConnection.BillItem.findAll({
      where: {
        order_id: { [global.serverdbConnection.Sequelize.Op.in]: billIds }
      },
      raw: true
    }) : [];

    const formatted = bills.map(b => {
      const currentId = b.order_id || b.id;
      const items = billItems.filter(bi => String(bi.order_id) === String(currentId));
      return {
        id: currentId,
        order_id: currentId,
        billNo: String(b.custom_bill_number || b.order_number || currentId),
        tableNo: b.table_name || `T${b.table_id || currentId}`,
        table_id: b.table_id,
        billType: b.order_type || 'DINE_IN',
        billDate: new Date(b.createdAt || b.bill_date || Date.now()).toLocaleDateString(),
        orderNo: String(b.order_number || currentId),
        amount: Number(b.total_amount || b.subtotal || b.order_total || 0),
        customerName: b.cust_name || b.customer_name || 'Walk-in',
        mobileNo: b.phone || '—',
        waiter: b.waiter || 'Staff',
        status: b.order_state || 'pending',
        payment_status: 'Unpaid',
        items: items.map(i => ({
          itemId: i.item_id,
          itemName: i.item_name || i.name || 'Item',
          name: i.item_name || i.name || 'Item',
          variantName: i.alternative_title || '',
          qty: Number(i.quantity || 1),
          unitPrice: Number(i.price || 0),
          total: Number(i.total || (i.quantity * i.price) || 0)
        }))
      };
    });

    response.data = formatted;
    response.pendingBills = formatted;
    response.orders = formatted;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching pending bills:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch pending bills');
  }
  res.json(response);
});

// POST /api/payments or POST /
const paymentHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  const transaction = await global.serverdbConnection.sequelize.transaction();
  try {
    const { orderId, order_id, amount, paymentMethod, paymentMode } = req.body;
    const targetOrderId = orderId || order_id;

    if (!targetOrderId) {
      await transaction.rollback();
      response.setStatus(400);
      response.setMessage('Order ID is required');
      return res.json(response);
    }

    const bill = await global.serverdbConnection.Bill.findByPk(targetOrderId, { transaction });
    if (bill) {
      const mode = paymentMethod || paymentMode || 'Cash';
      await bill.update({
        order_state: 'completed',
        payment_mode: mode
      }, { transaction });

      await global.serverdbConnection.BillPayment.create({
        order_id: bill.order_id || bill.id,
        amount: amount || bill.order_total || bill.total_amount,
        payment_mode: mode,
        store_id: 'STORE_1'
      }, { transaction });

      // Set Table status in PostgreSQL to 'PAYMENT_COMPLETED' with payment_completed_at timestamp
      if (bill.table_id) {
        let table = await global.serverdbConnection.Table.findByPk(bill.table_id, { transaction });
        if (!table) {
          table = await global.serverdbConnection.Table.findOne({
            where: {
              [global.serverdbConnection.Sequelize.Op.or]: [
                { table_no: String(bill.table_id) },
                { table_name: `Table ${bill.table_id}` }
              ]
            },
            transaction
          });
        }
        if (table) {
          const currentExtra = table.extra_details || {};
          await table.update({
            order_state: 'PAYMENT_COMPLETED',
            extra_details: {
              ...currentExtra,
              payment_completed_at: Date.now(),
              cleanup_after_seconds: 60,
              payment_status: 'PAID',
              kot_status: 'CUT',
              amount: 0,
              customer: 'Walk-in',
              waiter: null
            }
          }, { transaction });
        }
      }

      // Close KOT in PostgreSQL (set is_active: 0 so old KOT items don't accumulate in future sessions)
      if (bill.table_id) {
        const cleanId = String(bill.table_id).replace(/[^0-9]/g, '') || String(bill.table_id);
        await global.serverdbConnection.KOT.update(
          { is_active: 0, status: 6 },
          {
            where: {
              is_active: 1,
              [global.serverdbConnection.Sequelize.Op.or]: [
                { table_id: Number(cleanId) || 0 },
                { table_name: `Table ${cleanId}` },
                { table_name: `T${cleanId}` },
                { table_name: `T0${cleanId}` }
              ]
            },
            transaction
          }
        );
      }
    }

    await transaction.commit();
    response.setStatus(200);
    response.setMessage('Payment processed successfully');
  } catch (err) {
    await transaction.rollback();
    console.error('Error processing payment:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to process payment');
  }
  res.json(response);
};

router.post('/', paymentHandler);
router.post('/payments', paymentHandler);

module.exports = router;
