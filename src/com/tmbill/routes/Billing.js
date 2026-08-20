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
        where: { 
          kot_id: { [global.serverdbConnection.Sequelize.Op.in]: unbilledKotIds },
          status: { [global.serverdbConnection.Sequelize.Op.ne]: 5 }
        },
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
    response.data = finalFormatted;
    response.pendingBills = finalFormatted;
    response.orders = finalFormatted;
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
    const { orderId, order_id, amount, paymentMethod, paymentMode, payments } = req.body;
    const targetOrderId = orderId || order_id;

    if (!targetOrderId) {
      await transaction.rollback();
      response.setStatus(400);
      response.setMessage('Order ID is required');
      return res.json(response);
    }

    const bill = await global.serverdbConnection.Bill.findByPk(targetOrderId, { transaction });
    if (bill) {
      // Support array of payments or single payment fallback
      const paymentList = Array.isArray(payments) && payments.length > 0 
        ? payments 
        : [{ method: paymentMethod || paymentMode || 'Cash', amount: Number(amount) || bill.order_total || bill.total_amount }];

      let calculatedTotalPaid = 0;
      for (const p of paymentList) {
        if (Number(p.amount) > 0) {
          calculatedTotalPaid += Number(p.amount);
          await global.serverdbConnection.BillPayment.create({
            order_id: bill.order_id || bill.id,
            amount: Number(p.amount),
            payment_option: p.method,
            payment_mode: p.method,
            store_id: bill.store_id || req.body.store_id || 'STORE_1'
          }, { transaction });
        }
      }

      // Calculate total amounts
      const previousTotalPaid = Number(bill.paid_amount || 0);
      const newTotalPaid = previousTotalPaid + calculatedTotalPaid;
      const billTotal = Number(bill.order_total || bill.total_amount || 0);
      const remainingDue = Math.max(0, billTotal - newTotalPaid);
      
      const newStatus = remainingDue > 0 ? 'partial' : 'completed';
      const mainMode = paymentList.length > 0 ? paymentList.sort((a,b) => b.amount - a.amount)[0].method : 'Cash';

      await bill.update({
        order_state: newStatus,
        payment: mainMode,
        payment_mode: mainMode,
        paid_amount: newTotalPaid,
        due_amount: remainingDue
      }, { transaction });

      // If fully paid, clear table and close KOTs
      if (newStatus === 'completed' && bill.table_id) {
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
          let currentExtra = {};
          if (typeof table.extra_details === 'string') {
            try { currentExtra = JSON.parse(table.extra_details || '{}'); } catch(e) {}
          } else {
            currentExtra = table.extra_details || {};
          }
          await table.update({
            order_state: 'AVAILABLE',
            status: 'Blank',
            extra_details: {
              ...currentExtra,
              payment_completed_at: null,
              cleanup_after_seconds: 0,
              payment_status: 'PAID',
              kot_status: 'CUT',
              amount: 0,
              customer: '',
              waiter: null
            }
          }, { transaction });
        }

        // Close KOT in PostgreSQL
        let tableNo = '';
        let tableName = '';
        try {
          if (table) {
            tableName = table.table_name || '';
            tableNo = String(table.table_no || tableName || '').replace(/[^0-9]/g, '');
          }
        } catch (e) {
          console.warn('Error fetching table details for KOT deactivation:', e.message);
        }

        const cleanId = String(bill.table_id).replace(/[^0-9]/g, '') || String(bill.table_id);
        const cleanNo = tableNo || cleanId;
        const paddedNo = cleanNo.padStart(2, '0');

        await global.serverdbConnection.KOT.update(
          { is_active: 0, status: 6 },
          {
            where: {
              is_active: 1,
              [global.serverdbConnection.Sequelize.Op.or]: [
                { table_id: Number(cleanId) || 0 },
                { table_id: Number(cleanNo) || 0 },
                { table_name: `Table ${cleanNo}` },
                { table_name: `Table ${paddedNo}` },
                { table_name: `T${cleanNo}` },
                { table_name: `T${paddedNo}` },
                { table_name: `T0${cleanNo}` },
                ...(tableName ? [{ table_name: tableName }, { table_name: `Table ${tableName}` }] : [])
              ]
            },
            transaction
          }
        );
      } else if (newStatus === 'partial' && bill.table_id) {
        // Table remains occupied, but update payment status
        let table = await global.serverdbConnection.Table.findByPk(bill.table_id, { transaction });
        if (table) {
          const currentExtra = table.extra_details || {};
          await table.update({
             extra_details: {
               ...currentExtra,
               payment_status: 'PARTIAL',
               paid_amount: newTotalPaid,
               due_amount: remainingDue
             }
          }, { transaction });
        }
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
