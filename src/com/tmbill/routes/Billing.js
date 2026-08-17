const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();

// GET /api/billing/pending — load all pending / unpaid orders for Billing Desk
router.get('/pending', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetStoreId = req.query?.store_id || req.query?.outletId || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';
    const whereClause = {
      [global.serverdbConnection.Sequelize.Op.or]: [
        { order_state: 'pending' },
        { order_state: 'Running' },
        { order_state: 'placed' }
      ]
    };
    if (targetStoreId) {
      whereClause.store_id = targetStoreId;
    }

    const bills = await global.serverdbConnection.Bill.findAll({
      where: whereClause,
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

    const billTableIds = bills.map(b => b.table_id).filter(Boolean);
    const rawStandaloneKots = await global.serverdbConnection.KOT.findAll({
      where: { is_active: 1, ...(targetStoreId && { store_id: targetStoreId }) },
      order: [['kot_id', 'DESC']],
      raw: true
    });

    const standaloneKots = rawStandaloneKots.filter(k => {
      try {
        const extra = typeof k.extra_details === 'string' ? JSON.parse(k.extra_details || '{}') : k.extra_details;
        return !(extra?.isNC || k.isNC || k.ncType);
      } catch (e) {
        return true;
      }
    });

    const unbilledKots = standaloneKots.filter(k => !(k.table_id && billTableIds.includes(k.table_id)));
    const unbilledKotIds = unbilledKots.map(k => k.kot_id);
    let kotItemsForUnbilled = [];
    if (unbilledKotIds.length > 0) {
      kotItemsForUnbilled = await global.serverdbConnection.KOTItem.findAll({
        where: { kot_id: { [global.serverdbConnection.Sequelize.Op.in]: unbilledKotIds } },
        raw: true
      });
    }

    const formattedKots = unbilledKots.map(k => {
      const items = kotItemsForUnbilled.filter(ki => String(ki.kot_id) === String(k.kot_id));
      return {
        id: k.kot_id,
        order_id: k.kot_id,
        billNo: k.custom_bill_number || `KOT-${k.kot_id}`,
        tableNo: k.table_name || `T${k.table_id || k.kot_id}`,
        table_id: k.table_id,
        billType: k.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY',
        billDate: new Date(k.kot_date || Date.now()).toLocaleDateString(),
        orderNo: String(k.kot_number || k.kot_id),
        amount: Number(k.amount || 0),
        customerName: k.customer_name || 'Walk-in',
        mobileNo: k.customer_mobile || '—',
        waiter: k.waiter || 'Staff',
        status: 'pending',
        payment_status: 'Unpaid',
        items: items.map(i => ({
          itemId: i.item_id,
          itemName: i.item_name || 'Item',
          name: i.item_name || 'Item',
          variantName: i.alternative_title || '',
          qty: Number(i.quantity || 1),
          unitPrice: Number(i.item_price || 0),
          total: Number(i.amount || (i.quantity * i.item_price) || 0)
        }))
      };
    });

    const finalFormatted = [...formatted, ...formattedKots];

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
        payment: mode,
        payment_mode: mode
      }, { transaction });

      await global.serverdbConnection.BillPayment.create({
        order_id: bill.order_id || bill.id,
        amount: amount || bill.order_total || bill.total_amount,
        payment_option: mode,
        payment_mode: mode,
        store_id: bill.store_id || req.body.store_id || 'STORE_1'
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
