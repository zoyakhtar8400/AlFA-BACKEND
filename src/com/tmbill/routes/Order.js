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
  const targetStoreId = req.query?.store_id || req.query?.outletId || 'STORE_1';
  if (req.query && targetStoreId) {
    try {
      const orderdata = await getOrderwindowdetails(
        targetStoreId,
        req.query,
      );
      if (req.query.getOptions) {
        const { optionGroups, options } = await getOptiongroupandoptions({
          store_id: targetStoreId,
        });
        Object.assign(orderdata, {
          optionGroups,
          options,
        });
      }
      if (req.query.getPayments) {
        const payments = await getPaymentmodes(targetStoreId);
        Object.assign(orderdata, {
          payments,
        });
      }
      if (req.query.getDiscounts) {
        const discounts = await getDiscounts({ store_id: targetStoreId });
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
    const targetStoreId = req.query?.store_id || req.query?.outletId || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';
    const tableId = req.query && (req.query.table_id || req.query.tableId || req.query.table_no || req.query.tableNo);
    if (tableId) {
      const cleanId = String(tableId).replace(/[^0-9]/g, '') || String(tableId);
      const billWhere = {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { table_id: cleanId },
          { table_id: Number(cleanId) || 0 },
          { table_name: `Table ${cleanId}` },
          { table_name: `T${cleanId}` },
          { table_name: `T0${cleanId}` }
        ],
        order_state: { [global.serverdbConnection.Sequelize.Op.ne]: 'completed' }
      };
      if (targetStoreId) {
        billWhere.store_id = targetStoreId;
      }
      // Find active bill/order for this table in PostgreSQL
      const activeBill = await global.serverdbConnection.Bill.findOne({
        where: billWhere,
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
            customerName: kots[0].customer_name || 'Walk-in',
            customer_phone: kots[0].customer_mobile || '',
            mobileNo: kots[0].customer_mobile || '—',
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
      const targetStoreId = req.query?.store_id || req.query?.outletId || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';
      const whereCondition = {};
      if (req.query && req.query.status) {
        whereCondition.order_state = req.query.status;
      }
      if (targetStoreId) {
        whereCondition.store_id = targetStoreId;
      }

      const bills = await global.serverdbConnection.Bill.findAll({
        where: whereCondition,
        order: [['id', 'DESC']],
        raw: true
      });
      let billItems = [];
      let kotItems = [];
      try {
        const stringIds = Array.from(new Set(bills.flatMap(b => [String(b.id), String(b.order_id)]).filter(Boolean)));
        const numericIds = Array.from(new Set(bills.flatMap(b => [Number(b.id), Number(b.order_id)]).filter(n => !isNaN(n) && n > 0)));
        const tableIds = Array.from(new Set(bills.map(b => b.table_id).filter(Boolean)));

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

        if (tableIds.length > 0) {
          const kotsForTables = await global.serverdbConnection.KOT.findAll({
            where: { table_id: { [global.serverdbConnection.Sequelize.Op.in]: tableIds } },
            raw: true
          });
          const kIds = kotsForTables.map(k => k.kot_id);
          if (kIds.length > 0) {
            kotItems = await global.serverdbConnection.KOTItem.findAll({
              where: { kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kIds } },
              raw: true
            });
          }
        }
      } catch (err) {
        console.warn('Error loading bill items:', err.message);
      }

      const formatted = bills.map((b, idx) => {
        const currentId = b.order_id || b.id;
        const seqId = b.order_number || b.id || (idx + 1);

        // Clean table name formatting: convert 'T-Bill-6478' to 'Table 1' or clean table name
        let cleanTableName = b.table_name || `Table ${b.table_id || ''}`;
        if (cleanTableName.includes('T-') || cleanTableName.includes('Full') || cleanTableName.includes('Part') || cleanTableName.includes('Multi')) {
          const numMatch = String(cleanTableName).match(/\d+/);
          cleanTableName = numMatch ? `Table ${parseInt(numMatch[0], 10)}` : `Table ${b.table_id || 1}`;
        }

        // Clean billNo formatting: ensure 'Bill 1', 'Bill 2', 'Bill 3' format
        let cleanBillNo = b.custom_bill_number;
        if (!cleanBillNo || !cleanBillNo.startsWith('Bill ') || cleanBillNo.includes('BILL-')) {
          cleanBillNo = `Bill ${seqId}`;
        }

        let items = billItems.filter(bi =>
          String(bi.orderMasterId) === String(b.id) ||
          String(bi.orderMasterId) === String(b.order_id) ||
          String(bi.bill_id) === String(b.id) ||
          String(bi.order_id) === String(currentId) ||
          String(bi.order_id) === String(b.id)
        );

        if (items.length === 0 && b.table_id) {
          const fallback = (kotItems || []).filter(ki => Number(ki.table_id) === Number(b.table_id));
          if (fallback.length > 0) {
            items = fallback.map(ki => ({
              item_id: ki.item_id,
              title: ki.item_name || 'Item',
              alternative_title: ki.alternative_title || '',
              quantity: ki.quantity,
              price: ki.item_price,
              total: ki.amount
            }));
          }
        }

        const calculatedSubtotal = items.reduce((sum, i) => sum + (Number(i.quantity || 1) * Number(i.price || i.rate || 0)), 0);
        const subtotal = Number(b.subtotal || 0) || calculatedSubtotal || Number(b.total_amount || 0);
        const taxAmount = Number(b.total_tax || 0) || Math.round(subtotal * 0.05);
        const discountAmount = Number(b.discount_amount || b.total_discount || 0);
        const totalAmount = Number(b.total_amount || b.order_total || 0) || Math.round(subtotal + taxAmount - discountAmount);

        return {
          id: currentId,
          order_id: currentId,
          billNo: cleanBillNo,
          table_id: b.table_id,
          table_name: cleanTableName,
          tableNo: cleanTableName,
          order_type: b.order_type || (b.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY'),
          billType: b.order_type || (b.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY'),
          billDate: new Date(b.createdAt || b.bill_date || Date.now()).toLocaleDateString(),
          createdAt: b.createdAt || b.bill_date,
          orderNo: String(seqId),
          order_number: seqId,
          amount: totalAmount,
          total_amount: totalAmount,
          subtotal: subtotal,
          tax_amount: taxAmount,
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

      const billTableIds = bills.map(b => b.table_id).filter(Boolean);
      const standaloneKots = await global.serverdbConnection.KOT.findAll({
        where: { is_active: 1, ...(targetStoreId && { store_id: targetStoreId }) },
        order: [['kot_id', 'DESC']],
        raw: true
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

      const formattedKots = unbilledKots.map((k, idx) => {
        const items = kotItemsForUnbilled.filter(ki => String(ki.kot_id) === String(k.kot_id));
        const cleanTableName = k.table_name || `Table ${k.table_id || ''}`;
        return {
          id: k.kot_id,
          order_id: k.kot_id,
          billNo: k.custom_bill_number || `KOT-${k.kot_id}`,
          table_id: k.table_id,
          table_name: cleanTableName,
          tableNo: cleanTableName,
          order_type: k.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY',
          billType: k.billing_type === 1 ? 'DINE_IN' : 'TAKE_AWAY',
          billDate: new Date(k.kot_date || Date.now()).toLocaleDateString(),
          createdAt: k.kot_date || Date.now(),
          orderNo: String(k.kot_number || k.kot_id),
          order_number: k.kot_number || k.kot_id,
          amount: Number(k.amount || 0),
          total_amount: Number(k.amount || 0),
          subtotal: Number(k.amount || 0),
          tax_amount: 0,
          discount_amount: 0,
          customer_name: k.customer_name || 'Walk-in',
          customerName: k.customer_name || 'Walk-in',
          customer_phone: k.customer_mobile || '—',
          mobileNo: k.customer_mobile || '—',
          waiter_name: k.waiter || 'Staff',
          waiter: k.waiter || 'Staff',
          order_status: 'pending',
          status: 'pending',
          payment_status: 'Unpaid',
          payment_method: 'Cash',
          items: items.map(i => ({
            itemId: i.item_id,
            itemName: i.item_name || 'Item',
            name: i.item_name || 'Item',
            variantName: i.alternative_title || '',
            qty: Number(i.quantity || 1),
            unitPrice: Number(i.item_price || 0),
            rate: Number(i.item_price || 0),
            price: Number(i.item_price || 0),
            total: Number(i.amount || (i.quantity * i.item_price) || 0),
            remark: ''
          }))
        };
      });

      const finalFormatted = [...formatted, ...formattedKots];
      response.data = finalFormatted;
      response.orders = finalFormatted;
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
    const cleanNum = String(paramId).replace(/[^0-9]/g, '');
    const numVal = Number(cleanNum) || Number(paramId) || 0;
    let bill = null;

    if (numVal > 0) {
      bill = await global.serverdbConnection.Bill.findByPk(numVal, { raw: true });
    }
    if (!bill) {
      bill = await global.serverdbConnection.Bill.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { id: numVal },
            { order_id: String(paramId) },
            { order_number: numVal },
            { custom_bill_number: paramId },
            { custom_bill_number: `Bill ${numVal}` },
            { table_id: numVal }
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
      const strId = String(orderMasterId);
      const numId = Number(orderMasterId) || 0;
      billItems = await global.serverdbConnection.BillItem.findAll({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { orderMasterId: strId },
            { bill_id: numId }
          ]
        },
        raw: true
      });

      if (billItems.length === 0 && bill.table_id) {
        const kots = await global.serverdbConnection.KOT.findAll({
          where: { table_id: bill.table_id },
          raw: true
        });
        const kIds = kots.map(k => k.kot_id);
        if (kIds.length > 0) {
          const kItems = await global.serverdbConnection.KOTItem.findAll({
            where: { kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kIds } },
            raw: true
          });
          billItems = kItems.map(ki => ({
            id: ki.id,
            item_id: ki.item_id,
            title: ki.item_name || 'Item',
            quantity: ki.quantity,
            price: ki.item_price,
            total: ki.amount
          }));
        }
      }
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
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.price || item.rate || item.unitPrice || item.item_price || 0);
      const total = Number(item.total || item.amount || (qty * price));
      return {
        item_id: item.id || item.item_id,
        name: item.title || item.item_name || item.name || 'Item',
        qty: qty,
        unitPrice: price,
        price: price,
        amount: total
      };
    });

    const calculatedSubtotal = itemsFormatted.reduce((sum, i) => sum + i.amount, 0);
    const subtotal = Number(bill.subtotal || 0) || calculatedSubtotal || Number(bill.total_amount || 0);
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

    const targetTableId = Number(payload.tableId || payload.table_id || 0);
    const targetStoreId = payload.store_id || payload.outletId || req.body?.store_id || req.body?.outletId || req.query?.store_id || req.query?.outletId || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';

    let existingBill = null;
    if (targetTableId > 0) {
      existingBill = await global.serverdbConnection.Bill.findOne({
        where: {
          table_id: targetTableId,
          store_id: targetStoreId,
          order_state: 'pending'
        },
        order: [['id', 'DESC']]
      });
    }

    const resolvedCustName = payload.customerName || payload.customer_name || 'Walk-in';
    const rawMobile = payload.mobileNo || payload.customer_phone || payload.mobile || '';
    const resolvedMobile = (rawMobile && rawMobile !== '—') ? rawMobile : '';

    let createdBill;
    if (existingBill) {
      const updateFields = {
        store_id: targetStoreId,
        subtotal: subtotal || existingBill.subtotal,
        total_tax: taxAmount || existingBill.total_tax,
        total_amount: totalAmount || existingBill.total_amount,
        order_total: totalAmount || existingBill.order_total,
        order_state: payload.status || existingBill.order_state,
        waiter: payload.waiter || payload.waiter_name || existingBill.waiter
      };
      if (resolvedCustName && resolvedCustName !== 'Walk-in') {
        updateFields.cust_name = resolvedCustName;
      }
      if (resolvedMobile) {
        updateFields.phone = resolvedMobile;
      }
      await existingBill.update(updateFields);
      createdBill = existingBill;

      if (items.length > 0) {
        await global.serverdbConnection.BillItem.destroy({
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { bill_id: createdBill.id },
              { orderMasterId: String(createdBill.id) }
            ]
          }
        });
      }
    } else {
      const existingBillCount = await global.serverdbConnection.Bill.count();
      const seqNum = existingBillCount + 1;

      createdBill = await global.serverdbConnection.Bill.create({
        table_id: targetTableId || 1,
        table_name: payload.tableNo || payload.table_name || `Table ${targetTableId || 1}`,
        store_id: targetStoreId,
        subtotal: subtotal,
        total_tax: taxAmount,
        total_amount: totalAmount,
        order_total: totalAmount,
        order_state: payload.status || 'pending',
        payment_status: 'Unpaid',
        cust_name: resolvedCustName,
        phone: resolvedMobile || '—',
        waiter: payload.waiter || payload.waiter_name || 'Staff',
        order_type: payload.order_type || payload.billType || 'DINE_IN',
        custom_bill_number: payload.billNo || `Bill ${seqNum}`,
        order_number: seqNum,
        bill_date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

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
  const transaction = await global.serverdbConnection.sequelize.transaction();
  try {
    const orderId = req.params.id;
    const numericOrderId = Number(String(orderId).replace(/[^0-9]/g, ''));
    
    let bill = await global.serverdbConnection.Bill.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { custom_bill_number: orderId },
          { order_id: String(orderId) },
          ...(isNaN(Number(orderId)) ? [] : [{ id: Number(orderId) }]),
          ...(!isNaN(numericOrderId) && numericOrderId > 0 ? [{ id: numericOrderId }] : [])
        ]
      },
      transaction
    });

    if (!bill) {
      await transaction.rollback();
      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    // Protect already paid / completed bills from duplicate payment mutation
    if (bill.order_state === 'completed' || bill.payment_status === 'Paid') {
      await transaction.rollback();
      response.setStatus(200);
      response.setMessage('Bill is already settled and paid');
      return res.json(response);
    }

    const payMode = req.body.paymentMethod || req.body.paymentMode || 'Cash';
    const payAmt = Number(req.body.amount || bill.total_amount || bill.order_total || 0);

    await bill.update({
      order_state: 'completed',
      payment_status: 'Paid',
      payment_mode: payMode
    }, { transaction });

    // Record payment entry
    await global.serverdbConnection.BillPayment.create({
      order_id: bill.order_id || String(bill.id),
      amount: payAmt,
      payment_mode: payMode,
      store_id: 'STORE_1'
    }, { transaction });

    // Update associated table to PAYMENT_COMPLETED in PostgreSQL
    if (bill.table_id) {
      const tbl = await global.serverdbConnection.Table.findByPk(bill.table_id, { transaction });
      if (tbl) {
        const extra = tbl.extra_details || {};
        await tbl.update({
          order_state: 'PAYMENT_COMPLETED',
          extra_details: {
            ...extra,
            payment_status: 'PAID',
            payment_completed_at: Date.now(),
            cleanedAt: Date.now()
          }
        }, { transaction });
      }
    }

    // Close KOTs associated with table
    if (bill.table_id) {
      await global.serverdbConnection.KOT.update(
        { status: 6 }, // 6 = Closed / Billed
        { where: { table_id: bill.table_id, is_active: 1 }, transaction }
      );
    }

    await transaction.commit();
    response.setStatus(200);
    response.setMessage('Payment settled successfully');
    response.data = bill;
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback().catch(() => {});
    }
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
