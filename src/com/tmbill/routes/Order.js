const express = require('express');
const {
  getrunningorderDetails,
  saveBill,
  getOrderwindowdetails,
  settleBill,
  settleQuickbill,
  updateCustomerforanorder,
  updateCharges,
  updatePayment,
  updateDiscount,
  getSettings,
  fetchKOTnumbers,
  getOptiongroupandoptions,
  getDiscounts,
  updatePrintCountOfOrder,
  updateDeliveryboy,
  setOrderNote,
  updateWaiter,
} = require('../main_controllers/Order');
const { getPaymentmodes } = require('../main_controllers/Bill');
const { ResponseMessage } = require('../error/ResponseMessage');
const {
  spillBillbyportion,
  spillBillbypercentage,
  spillBillbyitems,
} = require('../main_controllers/SpiltOrder');
const { sleep } = require('../main_controllers/Utils');
const { isPOSUserLoggedIn } = require('../middleware/auth');
const { apiCall } = require('../services/APIService');
const { getHeadersformpos } = require('../services/MiscServices');
const { isDayClosed } = require('../main_controllers/Utils/ExtendCloseDayTime');

const router = express.Router();

router.get('/getorderdata', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.query && req.query.store_id) {
    try {
      const orderdata = await getOrderwindowdetails(
        req.query.store_id,
        req.query,
      );
      if (req.query.getOptions) {
        const { optionGroups, options } = await getOptiongroupandoptions({
          store_id: req.query.store_id,
        });
        Object.assign(orderdata, {
          optionGroups,
          options,
        });
      }
      if (req.query.getPayments) {
        const payments = await getPaymentmodes(req.query.store_id);
        Object.assign(orderdata, {
          payments,
        });
      }
      if (req.query.getDiscounts) {
        const discounts = await getDiscounts({ store_id: req.query.store_id });
        Object.assign(orderdata, {
          ...discounts,
        });
      }
      const settings = await getSettings();
      response.orderdata = orderdata;
      if (settings) {
        response.orderdata.settings = settings;
      }
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.get('/nextbillnkot', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const nextbillnkot = await fetchKOTnumbers();
    response.nextbillnkot = nextbillnkot;
  } catch (error) {
    response.setStatus(400);
    response.setMessage('Something went wrong');
  }

  res.json(response);
});

router.get('/generateId', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    response.id = global.generateId();
    response.setMessage('success');
  } catch (error) {
    response.setStatus(400);
    response.setMessage('Something went wrong');
  }

  res.json(response);
});

// GET / — fetch orders (all orders or filtered by table/status)
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tableId = req.query && (req.query.table_id || req.query.tableId || req.query.table_no || req.query.tableNo);
    if (tableId) {
      const cleanId = String(tableId).replace(/[^0-9]/g, '') || String(tableId);
      // Find active bill/order for this table in PostgreSQL
      const activeBill = await global.serverdbConnection.Bill.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_id: cleanId },
            { table_id: Number(cleanId) || 0 },
            { table_name: `Table ${cleanId}` },
            { table_name: `T${cleanId}` },
            { table_name: `T0${cleanId}` }
          ],
          order_state: { [global.serverdbConnection.Sequelize.Op.ne]: 'completed' }
        },
        order: [['id', 'DESC']],
        raw: true
      });

      if (activeBill) {
        // FIX A: query only by the real FK column (orderMasterId) that exists on mpos_order_child.
        // orderMasterId stores Bill.order_id (a string); bill_id stores the integer PK.
        // We try both to cover rows created before and after this fix.
        const items = await global.serverdbConnection.BillItem.findAll({
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { orderMasterId: String(activeBill.id) },
              { orderMasterId: String(activeBill.order_id || '') },
              { bill_id: activeBill.id }
            ]
          },
          raw: true
        });

        const formattedOrder = {
          id: activeBill.order_id || activeBill.id,
          order_id: activeBill.order_id || activeBill.id,
          billNo: String(activeBill.custom_bill_number || activeBill.order_number || activeBill.id),
          table_id: activeBill.table_id || cleanId,
          table_name: activeBill.table_name || `Table ${cleanId}`,
          amount: Number(activeBill.total_amount || activeBill.subtotal || activeBill.order_total || 0),
          total_amount: Number(activeBill.total_amount || activeBill.subtotal || activeBill.order_total || 0),
          subtotal: Number(activeBill.subtotal || 0),
          customer_name: activeBill.cust_name || activeBill.customer_name || 'Walk-in',
          waiter_name: activeBill.waiter || activeBill.waiter_name || 'Staff',
          order_status: activeBill.order_state || 'active',
          items: items.map((i, idx) => ({
            lineId: `bill-item-${i.id || idx}`,
            itemId: i.item_id,
            // OrderChild model uses 'title' — not 'item_name'
            itemName: i.title || i.item_name || i.name || 'Item',
            name: i.title || i.item_name || i.name || 'Item',
            variantName: i.alternative_title || '',
            qty: Number(i.quantity || 1),
            unitPrice: Number(i.price || i.rate || 0),
            price: Number(i.price || i.rate || 0),
            rate: Number(i.price || i.rate || 0),
            total: Number(i.total || (i.quantity * i.price) || 0),
            remark: i.item_note || i.remarks || ''
          }))
        };

        response.orderdata = formattedOrder;
        response.data = [formattedOrder];
        response.orders = [formattedOrder];
      } else {
        // Also check active KOT items for this table if no Bill row created yet.
        // mpos_kot has NO table_no column — only table_id (int) and table_name (string).
        const kots = await global.serverdbConnection.KOT.findAll({
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { table_id: Number(cleanId) || 0 },
              { table_name: `Table ${cleanId}` },
              { table_name: `T${cleanId}` },
              { table_name: `T0${cleanId}` }
            ],
            is_active: 1
          },
          order: [['kot_id', 'DESC']],
          raw: true
        });

        if (kots && kots.length > 0) {
          const kotIds = kots.map(k => k.kot_id);
          const kotItems = await global.serverdbConnection.KOTItem.findAll({
            where: { kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kotIds } },
            raw: true
          });

          const activeKotItems = kotItems.map((i, idx) => ({
            lineId: `kot-item-${i.id || idx}`,
            itemId: i.item_id,
            itemName: i.item_name || 'Item',
            name: i.item_name || 'Item',
            variantName: i.alternative_title || '',
            qty: Number(i.quantity || 1),
            unitPrice: Number(i.item_price || 0),
            price: Number(i.item_price || 0),
            rate: Number(i.item_price || 0),
            total: Number(i.amount || (i.quantity * i.item_price) || 0),
            remark: i.notes || ''
          }));

          const subtotal = activeKotItems.reduce((acc, curr) => acc + curr.total, 0);

          const formattedOrder = {
            id: kots[0].kot_id,
            order_id: kots[0].kot_id,
            table_id: cleanId,
            table_name: `Table ${cleanId}`,
            amount: subtotal,
            total_amount: subtotal,
            subtotal: subtotal,
            customer_name: kots[0].customer_name || 'Walk-in',
            waiter_name: kots[0].waiter || kots[0].waiter_name || 'Staff',
            order_status: 'active',
            items: activeKotItems
          };

          response.orderdata = formattedOrder;
          response.data = [formattedOrder];
          response.orders = [formattedOrder];
        } else {
          response.orderdata = null;
          response.data = [];
          response.orders = [];
        }
      }
    } else {
      const whereCondition = {};
      if (req.query && req.query.status) {
        whereCondition.order_state = req.query.status;
      }

      const bills = await global.serverdbConnection.Bill.findAll({
        where: whereCondition,
        order: [['id', 'DESC']],
        raw: true
      });
      let billItems = [];
      try {
        const stringIds = Array.from(new Set(bills.flatMap(b => [String(b.id), String(b.order_id)]).filter(Boolean)));
        const numericIds = Array.from(new Set(bills.flatMap(b => [Number(b.id), Number(b.order_id)]).filter(n => !isNaN(n) && n > 0)));

        const orConditions = [];
        if (stringIds.length > 0) {
          orConditions.push({ orderMasterId: { [global.serverdbConnection.Sequelize.Op.in]: stringIds } });
        }
        if (numericIds.length > 0) {
          orConditions.push({ bill_id: { [global.serverdbConnection.Sequelize.Op.in]: numericIds } });
        }

        if (orConditions.length > 0) {
          billItems = await global.serverdbConnection.BillItem.findAll({
            where: {
              [global.serverdbConnection.Sequelize.Op.or]: orConditions
            },
            raw: true
          });
        }
      } catch (err) {
        console.warn('Error loading bill items:', err.message);
      }

      const formatted = bills.map(b => {
        const currentId = b.order_id || b.id;
        const items = billItems.filter(bi =>
          String(bi.orderMasterId) === String(b.id) ||
          String(bi.orderMasterId) === String(b.order_id) ||
          String(bi.bill_id) === String(b.id) ||
          String(bi.order_id) === String(currentId) ||
          String(bi.order_id) === String(b.id)
        );
        return {
          id: currentId,
          order_id: currentId,
          billNo: String(b.custom_bill_number || b.order_number || currentId),
          table_id: b.table_id,
          table_name: b.table_name || `Table ${b.table_id || ''}`,
          tableNo: b.table_name || `T${b.table_id || currentId}`,
          order_type: b.order_type || (b.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY'),
          billType: b.order_type || (b.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY'),
          billDate: new Date(b.createdAt || b.bill_date || Date.now()).toLocaleDateString(),
          createdAt: b.createdAt || b.bill_date,
          orderNo: String(b.order_number || currentId),
          order_number: b.order_number || currentId,
          amount: Number(b.total_amount || b.subtotal || b.order_total || 0),
          total_amount: Number(b.total_amount || b.subtotal || b.order_total || 0),
          subtotal: Number(b.subtotal || 0),
          tax_amount: Number(b.total_tax || 0),
          discount_amount: Number(b.discount_amount || b.total_discount || 0),
          customer_name: b.cust_name || b.customer_name || 'Walk-in',
          customerName: b.cust_name || b.customer_name || 'Walk-in',
          customer_phone: b.phone || b.mobile || '—',
          mobileNo: b.phone || b.mobile || '—',
          waiter_name: b.waiter || b.waiter_name || 'Staff',
          waiter: b.waiter || b.waiter_name || 'Staff',
          order_status: b.order_state || 'completed',
          status: b.order_state || 'completed',
          payment_status: b.order_state === 'completed' ? 'Paid' : 'Unpaid',
          payment_method: b.payment_mode || 'Cash',
          items: items.map(i => ({
            itemId: i.item_id,
            itemName: i.title || i.item_name || i.name || 'Item',
            name: i.title || i.item_name || i.name || 'Item',
            variantName: i.alternative_title || i.variantName || i.variant || '',
            qty: Number(i.quantity || i.qty || 1),
            unitPrice: Number(i.price || i.rate || i.unitPrice || 0),
            rate: Number(i.price || i.rate || i.unitPrice || 0),
            price: Number(i.price || i.rate || i.unitPrice || 0),
            total: Number(i.total || (i.quantity * i.price) || 0),
            remark: i.notes || i.item_note || i.remark || ''
          }))
        };
      });

      response.data = formatted;
      response.orders = formatted;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    response.setStatus(400);
    response.setMessage(error.message || 'Something went wrong');
  }
  res.json(response);
});

// GET /:id — single order details
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const orderId = req.params.id;
    const bill = await global.serverdbConnection.Bill.findByPk(orderId, { raw: true });
    if (!bill) {
      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    // FIX B: orderMasterId is the actual FK on mpos_order_child (no order_id column exists).
    const items = await global.serverdbConnection.BillItem.findAll({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { orderMasterId: String(orderId) },
          { bill_id: Number(orderId) || 0 }
        ]
      },
      raw: true
    });

    const formatted = {
      id: bill.order_id,
      order_id: bill.order_id,
      billNo: String(bill.custom_bill_number || bill.order_number || bill.order_id),
      table_id: bill.table_id,
      table_name: bill.table_name || `Table ${bill.table_id || ''}`,
      tableNo: bill.table_name || `T${bill.table_id || bill.order_id}`,
      order_type: bill.order_type || 'DINE_IN',
      billType: bill.order_type || 'DINE_IN',
      billDate: new Date(bill.createdAt || bill.bill_date || Date.now()).toLocaleDateString(),
      orderNo: String(bill.order_number || bill.order_id),
      amount: Number(bill.total_amount || bill.subtotal || bill.order_total || 0),
      customerName: bill.customer_name || 'Walk-in',
      mobileNo: bill.phone || '—',
      waiter: bill.waiter || 'Staff',
      order_status: bill.order_state || 'pending',
      payment_status: bill.payment_status || (bill.order_state === 'completed' ? 'Paid' : 'Unpaid'),
      items: items.map(i => ({
        itemId: i.item_id,
        // OrderChild model uses 'title' — not 'item_name'
        itemName: i.title || i.item_name || i.name || 'Item',
        variantName: i.alternative_title || '',
        qty: Number(i.quantity || 1),
        unitPrice: Number(i.price || 0),
        total: Number(i.total || (i.quantity * i.price) || 0)
      }))
    };

    response.data = formatted;
    response.order = formatted;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// GET /:id/invoice — Complete PostgreSQL Invoice generation
router.get('/:id/invoice', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const paramId = req.params.id;
    let bill = null;

    if (!isNaN(Number(paramId))) {
      bill = await global.serverdbConnection.Bill.findByPk(paramId, { raw: true });
    }
    if (!bill) {
      bill = await global.serverdbConnection.Bill.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { custom_bill_number: paramId },
            { order_id: String(paramId) },
            { table_id: Number(paramId) }
          ]
        },
        order: [['id', 'DESC']],
        raw: true
      });
    }

    if (!bill) {
      response.setStatus(404);
      response.setMessage('Order invoice not found');
      return res.json(response);
    }

    const orderMasterId = bill.id;

    let billItems = [];
    try {
      billItems = await global.serverdbConnection.BillItem.findAll({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { orderMasterId: orderMasterId },
            { order_id: String(orderMasterId) }
          ]
        },
        raw: true
      });
    } catch (e) {
      console.warn('Invoice items query fallback:', e.message);
    }

    let tableNo = String(bill.table_name || bill.table_id || '1');
    if (bill.table_id) {
      try {
        const tbl = await global.serverdbConnection.Table.findByPk(bill.table_id, { raw: true });
        if (tbl) tableNo = String(tbl.table_no || tbl.table_name || tbl.id);
      } catch (e) {}
    }

    let paymentMethod = bill.payment || 'Cash';
    try {
      const pm = await global.serverdbConnection.BillPayment.findOne({
        where: { order_id: orderMasterId },
        order: [['id', 'DESC']],
        raw: true
      });
      if (pm && pm.payment_mode) paymentMethod = pm.payment_mode;
    } catch (e) {}

    const itemsFormatted = billItems.map(item => {
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || item.rate || item.item_price || 0);
      return {
        item_id: item.id || item.item_id,
        name: item.item_name || item.name || 'Item',
        qty: qty,
        unitPrice: price,
        price: price,
        amount: qty * price
      };
    });

    const subtotal = itemsFormatted.reduce((sum, i) => sum + i.amount, 0) || Number(bill.order_total || 0);
    const cgst = Math.round((subtotal * 0.025) * 100) / 100;
    const sgst = Math.round((subtotal * 0.025) * 100) / 100;
    const grandTotal = Math.round(subtotal + cgst + sgst);

    const now = new Date();
    const dateTimeStr = bill.createdAt
      ? new Date(bill.createdAt).toLocaleString('en-IN')
      : (now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));

    const invoiceObj = {
      restaurant_name: 'ALFA HMS RESTAURANT',
      address: 'Main Dining Area',
      phone: '+91 98765 43210',
      invoice_number: bill.custom_bill_number || `INV-${orderMasterId}`,
      bill_number: bill.custom_bill_number || `BILL-${orderMasterId}`,
      order_number: `ORD-${orderMasterId}`,
      table_number: tableNo,
      table_id: bill.table_id,
      date_time: dateTimeStr,
      customer_name: bill.cust_name || 'Walk-in Guest',
      customer_phone: bill.phone || '—',
      waiter_name: bill.waiter || 'Staff',
      items: itemsFormatted,
      subtotal: subtotal,
      discount: Number(bill.discount || 0),
      taxes: {
        cgst: cgst,
        sgst: sgst,
        total_tax: cgst + sgst
      },
      service_charges: Number(bill.charges || 0),
      grand_total: grandTotal,
      payment_method: paymentMethod,
      payment_status: bill.order_state === 'completed' ? 'PAID' : 'UNPAID',
      invoice_status: 'COMPLETED'
    };

    response.setStatus(200);
    response.setMessage('Invoice loaded successfully from PostgreSQL');
    response.invoice = invoiceObj;
    response.data = invoiceObj;
  } catch (err) {
    console.error('Error generating invoice:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to generate invoice');
  }
  res.json(response);
});

// POST / — create new order in PostgreSQL
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const payload = req.body;
    const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.rows) ? payload.rows : []);

    let subtotal = 0;
    items.forEach(it => {
      subtotal += (Number(it.qty || it.quantity || 1) * Number(it.unitPrice || it.price || it.rate || 0));
    });

    const taxAmount = payload.tax || payload.taxes || (subtotal * 0.05); // default 5% tax if not specified
    const totalAmount = subtotal + taxAmount;

    const createdBill = await global.serverdbConnection.Bill.create({
      table_id: Number(payload.tableId || payload.table_id || 1),
      table_name: payload.tableNo || payload.table_name || `Table ${payload.tableId || 1}`,
      store_id: payload.store_id || 'STORE_1',
      subtotal: subtotal,
      total_tax: taxAmount,
      total_amount: totalAmount,
      order_total: totalAmount,
      order_state: payload.status || 'pending',
      cust_name: payload.customerName || payload.customer_name || 'Walk-in',
      phone: payload.mobileNo || payload.customer_phone || '—',
      waiter: payload.waiter || payload.waiter_name || 'Staff',
      order_type: payload.order_type || payload.billType || 'DINE_IN',
      custom_bill_number: payload.billNo || `BILL-${Math.floor(100 + Math.random() * 900)}`,
      order_number: Math.floor(1 + Math.random() * 999),
      bill_date: '12:00:00'
    });

    const billId = createdBill.id || createdBill.order_id;

    if (items.length > 0) {
      for (const item of items) {
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.unitPrice || item.price || item.rate || 0);
        // FIX D: write bill_id (integer PK FK) and orderMasterId (string FK = Bill.order_id).
        // The mpos_order_child model has NO order_id column — removed that dead write.
        await global.serverdbConnection.BillItem.create({
          bill_id: Number(billId) || 0,
          orderMasterId: String(createdBill.order_id || billId),
          item_id: Number(item.itemId || item.id || 1),
          title: item.itemName || item.name || 'Item',
          alternative_title: item.variantName || item.variant || '',
          quantity: qty,
          price: price,
          total: qty * price,
          store_id: 'STORE_1'
        });
      }
    }

    // Update table status in PostgreSQL
    if (payload.tableId || payload.table_id) {
      await global.serverdbConnection.Table.update(
        { order_state: 'Running' },
        { where: { id: payload.tableId || payload.table_id } }
      );
    }

    response.setStatus(201);
    response.setMessage('Order created successfully');
    response.data = createdBill;
    response.order = createdBill;
  } catch (err) {
    console.error('Error creating order:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create order');
  }
  res.json(response);
});

// PUT /:id — update order
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const orderId = req.params.id;
    const bill = await global.serverdbConnection.Bill.findByPk(orderId);
    if (!bill) {
      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    await bill.update({
      ...(req.body.customerName && { customer_name: req.body.customerName }),
      ...(req.body.mobileNo && { phone: req.body.mobileNo }),
      ...(req.body.status && { order_state: req.body.status }),
      ...(req.body.amount !== undefined && { total_amount: req.body.amount, order_total: req.body.amount })
    });

    response.setStatus(200);
    response.setMessage('Order updated successfully');
    response.data = bill;
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// PATCH /:id/status — update status
router.patch('/:id/status', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const orderId = req.params.id;
    const bill = await global.serverdbConnection.Bill.findByPk(orderId);
    if (!bill) {
      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    const nextStatus = req.body.status || req.body.order_state || 'completed';
    await bill.update({ order_state: nextStatus });

    response.setStatus(200);
    response.setMessage(`Order status updated to ${nextStatus}`);
    response.data = bill;
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// PATCH /:id/payment or POST /:id/settle — settle bill
const settleOrderHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const orderId = req.params.id;
    const bill = await global.serverdbConnection.Bill.findByPk(orderId);
    
    if (bill) {
      await bill.update({
        order_state: 'completed',
        payment_status: 'Paid',
        payment_mode: req.body.paymentMethod || req.body.paymentMode || 'Cash'
      });

      // Also record payment entry
      await global.serverdbConnection.BillPayment.create({
        order_id: bill.order_id,
        amount: req.body.amount || bill.total_amount,
        payment_mode: req.body.paymentMethod || 'Cash',
        store_id: 'STORE_1'
      });

      // Update associated table to Available / Blank in PostgreSQL
      if (bill.table_id) {
        await global.serverdbConnection.Table.update(
          { order_state: 'Blank' },
          { where: { id: bill.table_id } }
        );
      }

      // Close KOTs associated with table
      await global.serverdbConnection.KOT.update(
        { status: 6 }, // 6 = Closed
        { where: { table_id: bill.table_id, is_active: 1 } }
      );
    }

    response.setStatus(200);
    response.setMessage('Payment settled successfully');
  } catch (err) {
    console.error('Error settling order:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to settle order');
  }
  res.json(response);
};

router.patch('/:id/payment', settleOrderHandler);
router.post('/:id/settle', settleOrderHandler);

// DELETE /:id — delete order
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const orderId = req.params.id;
    await global.serverdbConnection.BillItem.destroy({ where: { order_id: orderId } });
    await global.serverdbConnection.Bill.destroy({ where: { order_id: orderId } });
    response.setStatus(200);
    response.setMessage('Order deleted successfully');
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});


router.patch('/customer', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.body) {
    const customerupdateData = req.body;
    try {
      const result = await updateCustomerforanorder(customerupdateData);
      response.setMessage(result);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.patch('/update_charges', async (req, res) => {
  const response = new ResponseMessage(200, '');
  // if (req.body && req.body.table_id && req.body.tempCharges
  //     && req.body.tempCharges && req.body.order_id != undefined) {
  if (req.body) {
    const result = await updateCharges(req.body);
    response.result = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.patch('/update_payment', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (
    req.body &&
    req.body.table_id &&
    req.body.paymentName &&
    req.body.isSplitpayment != undefined &&
    req.body.order_id != undefined
  ) {
    if (
      req.body.isSplitpayment &&
      (!req.body.payList || req.body.payList == 0)
    ) {
      response.setStatus(400);
      response.setMessage('Invalid Parameters.');
      res.json(response);
      return;
    }

    const result = await updatePayment(req.body);
    response.setMessage(result);
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.patch('/update_discount', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.table_id && req.body.order_id != undefined) {
    const result = await updateDiscount(req.body);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.post('/splitbill_byportion', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.table_id && req.body.order_id != undefined) {
    const result = await spillBillbyportion(req.body);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});
router.post('/splitbill_byperc', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.table_id) {
    const result = await spillBillbypercentage(req.body);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.post('/splitbill_byitems', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.table_id) {
    const result = await spillBillbyitems(req.body);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.patch('/update_print_status', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.order_id) {
    const result = await updatePrintCountOfOrder(req.body);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.post('/UpdateDeliveryboy', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body) {
    const result = await updateDeliveryboy(req.body);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.post('/AddOrderNote', async (req, res) => {
  try {
    if (req.body) {
      const response = await setOrderNote(req.body);
      res.json(response);
    }
  } catch (error) {
    console.error(
      `Message="Error While Updating Order Note " Payload="${JSON.stringify(req.body)}"`,
      error,
    );
  }
  return undefined;
});

router.post('/UpdateWaiter', async (req, res) => {
  try {
    if (req.body) {
      const response = await updateWaiter(req.body);
      res.json(response);
    }
  } catch (error) {
    console.error(
      `Message="Error While Updating waiter " Payload="${JSON.stringify(req.body)}"`,
      error,
    );
  }
  return undefined;
});

router.post('/send-bill', async (req, res) => {
  try {
    let response = new ResponseMessage(200, '');
    if (req.body) {
      const { data: axiosResponse } = await apiCall.post(
        global.Config.links.sendbill,
        req.body,
        {
          headers: getHeadersformpos(),
        },
      );
      response = axiosResponse;
      res.json(response);
    }
  } catch (error) {
    console.error(
      `Message="Error While sending ebill " Payload="${JSON.stringify(req.body)}"`,
      error,
    );
    res.json({ status: 400 });
  }
});
module.exports = router;
