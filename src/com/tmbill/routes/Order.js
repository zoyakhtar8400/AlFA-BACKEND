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

const NOISE_WORDS = new Set(['OUTLET', 'STORE', 'BRANCH', 'COUNTER', 'POS', 'RESTAURANT_OUTLET']);

function getStorePrefix(store) {
  if (!store) return 'T';
  if (store.shortName && store.shortName !== 'T') {
    return String(store.shortName).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  const name = store.store_name || store.name || '';
  if (!name) return 'T';
  const clean = name.replace(/&/g, ' and ').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  let tokens = clean.split(/\s+/).filter(Boolean);
  let meaningfulTokens = tokens.filter(t => !NOISE_WORDS.has(t.toUpperCase()));
  if (meaningfulTokens.length === 0) meaningfulTokens = tokens;
  if (meaningfulTokens.length >= 2) {
    return meaningfulTokens.map(w => w[0].toUpperCase()).join('').slice(0, 4);
  } else if (meaningfulTokens.length === 1) {
    const word = meaningfulTokens[0];
    const match = word.match(/^([a-zA-Z]+)(\d+)$/);
    if (match) return `${match[1][0].toUpperCase()}${match[2]}`;
    return word[0].toUpperCase();
  }
  return 'T';
}

router.get(['/getdashboardstats', '/dashboard/stats', '/dashboard-stats'], async (req, res) => {
  const response = new ResponseMessage(200, 'Dashboard statistics fetched successfully');
  try {
    const { Bill, Table, Item, KOT, BillPayment, Store, Sequelize } = require('../js/database');

    let targetStoreId = req.query.store_id || req.body?.store_id || 'STORE_1';
    if (targetStoreId === 'undefined' || targetStoreId === 'null') {
      targetStoreId = 'STORE_1';
    }
    const timeframe = req.query.timeframe || 'weekly';

    const getLocalDateStr = (dateObj) => {
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      return (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 10);
    };

    const todayStr = getLocalDateStr(new Date());

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    let startDateStr = todayStr;
    if (timeframe === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDateStr = getLocalDateStr(d);
    } else if (timeframe === 'monthly') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDateStr = getLocalDateStr(d);
    } else if (timeframe === 'yearly') {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      startDateStr = d.toISOString().slice(0, 10);
    }

    // 1. Tables stats
    const allTables = await Table.findAll({ where: { store_id: targetStoreId }, raw: true }).catch(() => []);
    const totalTables = allTables.length;
    const activeTables = allTables.filter(t => {
      let extra = {};
      if (t.extra_details) {
        extra = typeof t.extra_details === 'string' ? JSON.parse(t.extra_details) : t.extra_details;
      }
      const amt = Number(t.amount || extra.amount || 0);
      const st = String(t.status || t.order_state || extra.status || '').toUpperCase();
      return ['RUNNING', 'KOT_CUT', 'ORDERED', 'OCCUPIED', 'PAID', 'KOT GENERATED'].includes(st) || amt > 0;
    });
    const liveDiningSales = activeTables.reduce((acc, t) => {
      let extra = {};
      if (t.extra_details) {
        extra = typeof t.extra_details === 'string' ? JSON.parse(t.extra_details) : t.extra_details;
      }
      const amt = Number(t.amount || extra.amount || 0);
      return acc + amt;
    }, 0);

    // 2. Menu items count
    const totalItems = await Item.count({
      where: {
        [Sequelize.Op.or]: [
          { store_id: targetStoreId },
          { store_id: 'STORE_1' },
          { store_id: null }
        ]
      }
    }).catch(() => 0);

    // 3. Orders / Revenue stats in the chosen timeframe
    const allOrders = await Bill.findAll({
      where: {
        store_id: targetStoreId,
        my_order_date: {
          [Sequelize.Op.between]: [startDateStr, todayStr]
        }
      },
      order: [['id', 'DESC']],
      raw: true
    }).catch(() => []);

    let totalRevenue = 0;
    let cashCollection = 0;
    let upiCollection = 0;
    let cardCollection = 0;
    let dueCollection = 0;
    let totalOrdersCount = 0;
    let completedBillsCount = 0;
    let cancelledBillsCount = 0;
    let ncBillsCount = 0;

    let restaurantRevenue = 0; // Dine-in
    let posRevenue = 0; // Takeaway / Delivery

    allOrders.forEach(o => {
      const state = String(o.order_state || '').toLowerCase();

      if (state === 'cancelled') {
        cancelledBillsCount++;
        return;
      }

      if (state === 'nc') {
        ncBillsCount++;
        return;
      }

      if (state === 'completed' || state === 'fulfilled' || state === 'paid') {
        completedBillsCount++;
        totalOrdersCount++;

        const amt = Number(o.order_total || 0);
        totalRevenue += amt;

        const orderType = String(o.order_type || '').toUpperCase();
        if (orderType.includes('DINE') || orderType.includes('TABLE')) {
          restaurantRevenue += amt;
        } else {
          posRevenue += amt;
        }

        const duePayment = Number(o.due_payment || 0);
        if (duePayment > 0 || o.hasDuepayment) {
          dueCollection += duePayment;
        }

        const pType = String(o.payment || o.payment_mode || 'Cash').toLowerCase();
        if (pType.includes('cash')) {
          cashCollection += (amt - duePayment);
        } else if (pType.includes('upi') || pType.includes('online')) {
          upiCollection += (amt - duePayment);
        } else if (pType.includes('card')) {
          cardCollection += (amt - duePayment);
        } else {
          cashCollection += (amt - duePayment);
        }
      }
    });

    // 4. Today's vs Yesterday's Sales
    const todayOrders = await Bill.findAll({
      where: {
        store_id: targetStoreId,
        order_state: ['completed', 'fulfilled', 'paid'],
        my_order_date: todayStr
      },
      raw: true
    }).catch(() => []);
    const todaySales = todayOrders.reduce((acc, o) => acc + Number(o.order_total || 0), 0) + liveDiningSales;

    const yesterdayOrders = await Bill.findAll({
      where: {
        store_id: targetStoreId,
        order_state: ['completed', 'fulfilled', 'paid'],
        my_order_date: yesterdayStr
      },
      raw: true
    }).catch(() => []);
    const yesterdaySales = yesterdayOrders.reduce((acc, o) => acc + Number(o.order_total || 0), 0);

    // 5. KOT Stats
    const kots = await KOT.findAll({
      where: {
        store_id: targetStoreId,
        kot_date: {
          [Sequelize.Op.between]: [new Date(startDateStr + 'T00:00:00.000Z'), new Date(todayStr + 'T23:59:59.999Z')]
        }
      },
      raw: true
    }).catch(() => []);

    const totalKotsCount = kots.length;
    const runningKotsCount = kots.filter(k => k.is_active === 1).length;
    const completedKotsCount = kots.filter(k => k.is_active === 0).length;

    // 6. Recent orders
    const recentOrders = allOrders.slice(0, 10).map(o => ({
      id: o.id,
      billNo: o.custom_bill_number || o.bill_no || o.order_id || `BILL-${o.id}`,
      table: o.table_name || (o.table_id ? `Table T${o.table_id}` : 'Direct Sale'),
      customer: o.cust_name || 'Walk-in',
      amount: `₹${Number(o.order_total || 0).toLocaleString('en-IN')}`,
      rawAmount: Number(o.order_total || 0),
      paymentType: o.payment || o.payment_mode || 'Cash',
      status: o.order_state || 'Paid',
      createdAt: o.my_order_date || 'Today'
    }));

    // 7. Dynamic Trend Calculation
    let revenueLabels = [];
    let revenueValues = [];

    if (timeframe === 'weekly') {
      revenueLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      revenueValues = [0, 0, 0, 0, 0, 0, 0];

      allOrders.forEach(o => {
        const state = String(o.order_state || '').toLowerCase();
        if (state === 'completed' || state === 'fulfilled' || state === 'paid') {
          const amt = Number(o.order_total || 0);
          const dateObj = new Date(o.my_order_date);
          let dayIdx = dateObj.getDay() - 1;
          if (dayIdx < 0) dayIdx = 6;
          if (dayIdx >= 0 && dayIdx < 7) {
            revenueValues[dayIdx] += amt;
          }
        }
      });
    } else if (timeframe === 'monthly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyIndexMap = {};

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mName = monthNames[d.getMonth()];
        revenueLabels.push(mName);
        revenueValues.push(0);
        monthlyIndexMap[d.getMonth()] = revenueLabels.length - 1;
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

      const monthlyOrders = await Bill.findAll({
        where: {
          store_id: targetStoreId,
          order_state: ['completed', 'fulfilled', 'paid'],
          my_order_date: {
            [Sequelize.Op.between]: [sixMonthsAgoStr, todayStr]
          }
        },
        raw: true
      }).catch(() => []);

      monthlyOrders.forEach(o => {
        const amt = Number(o.order_total || 0);
        const dateObj = new Date(o.my_order_date);
        const m = dateObj.getMonth();
        if (monthlyIndexMap[m] !== undefined) {
          revenueValues[monthlyIndexMap[m]] += amt;
        }
      });
    } else if (timeframe === 'yearly') {
      const currentYear = new Date().getFullYear();
      revenueLabels = [
        String(currentYear - 3),
        String(currentYear - 2),
        String(currentYear - 1),
        String(currentYear)
      ];
      revenueValues = [0, 0, 0, 0];
      const yearIndexMap = {
        [currentYear - 3]: 0,
        [currentYear - 2]: 1,
        [currentYear - 1]: 2,
        [currentYear]: 3
      };

      const yearlyOrders = await Bill.findAll({
        where: {
          store_id: targetStoreId,
          order_state: ['completed', 'fulfilled', 'paid'],
          my_order_date: {
            [Sequelize.Op.between]: [`${currentYear - 3}-01-01`, todayStr]
          }
        },
        raw: true
      }).catch(() => []);

      yearlyOrders.forEach(o => {
        const amt = Number(o.order_total || 0);
        const dateObj = new Date(o.my_order_date);
        const y = dateObj.getFullYear();
        if (yearIndexMap[y] !== undefined) {
          revenueValues[yearIndexMap[y]] += amt;
        }
      });
    } else {
      revenueLabels = ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
      revenueValues = [0, 0, 0, 0, 0, 0, 0];

      allOrders.forEach(o => {
        const state = String(o.order_state || '').toLowerCase();
        if (state === 'completed' || state === 'fulfilled' || state === 'paid') {
          const amt = Number(o.order_total || 0);
          let hour = 12;
          if (o.bill_date) {
            const match = o.bill_date.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
              let h = parseInt(match[1], 10);
              const ampm = match[3].toUpperCase();
              if (ampm === 'PM' && h < 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              hour = h;
            }
          }

          if (hour < 9) revenueValues[0] += amt;
          else if (hour < 11) revenueValues[1] += amt;
          else if (hour < 13) revenueValues[2] += amt;
          else if (hour < 15) revenueValues[3] += amt;
          else if (hour < 17) revenueValues[4] += amt;
          else if (hour < 19) revenueValues[5] += amt;
          else revenueValues[6] += amt;
        }
      });
    }

    const occupancyValues = revenueValues.map(v => Math.min(95, Math.max(10, Math.round((v / (totalTables * 200 || 2000)) * 100))));

    // 8. Outlet summary list
    const stores = await Store.findAll({ raw: true }).catch(() => []);
    const outletSummary = [];

    for (const store of stores) {
      const storeId = store.store_id || `STORE_${store.id}`;
      const storeName = store.store_name || `Outlet ${store.id}`;

      // Aggregate today sales
      const stTodayOrders = await Bill.findAll({
        where: {
          store_id: storeId,
          order_state: ['completed', 'fulfilled', 'paid'],
          my_order_date: todayStr
        },
        raw: true
      }).catch(() => []);
      const stTodaySales = stTodayOrders.reduce((acc, o) => acc + Number(o.order_total || 0), 0);

      // Aggregate live dining sales & active tables
      const stTables = await Table.findAll({ where: { store_id: storeId }, raw: true }).catch(() => []);
      const stActiveTables = stTables.filter(t => {
        let extra = {};
        if (t.extra_details) {
          extra = typeof t.extra_details === 'string' ? JSON.parse(t.extra_details) : t.extra_details;
        }
        const amt = Number(t.amount || extra.amount || 0);
        const st = String(t.status || t.order_state || extra.status || '').toUpperCase();
        return ['RUNNING', 'KOT_CUT', 'ORDERED', 'OCCUPIED', 'PAID', 'KOT GENERATED'].includes(st) || amt > 0;
      });
      const stLiveDiningSales = stActiveTables.reduce((acc, t) => {
        let extra = {};
        if (t.extra_details) {
          extra = typeof t.extra_details === 'string' ? JSON.parse(t.extra_details) : t.extra_details;
        }
        const amt = Number(t.amount || extra.amount || 0);
        return acc + amt;
      }, 0);

      // Aggregate KOT stats
      const stKotCount = await KOT.count({
        where: {
          store_id: storeId,
          kot_date: {
            [Sequelize.Op.between]: [new Date(startDateStr + 'T00:00:00.000Z'), new Date(todayStr + 'T23:59:59.999Z')]
          }
        }
      }).catch(() => 0);

      outletSummary.push({
        id: store.id,
        store_id: storeId,
        name: storeName,
        todaySales: stTodaySales + stLiveDiningSales,
        liveDiningSales: stLiveDiningSales,
        activeTablesCount: stActiveTables.length,
        totalTablesCount: stTables.length,
        totalKotsCount: stKotCount,
        totalOrdersCount: stTodayOrders.length
      });
    }

    response.data = {
      todaySales,
      yesterdaySales,
      monthlySales: totalRevenue + liveDiningSales,
      cashCollection,
      upiCollection,
      cardCollection,
      dueCollection,
      totalOrdersCount,
      activeTablesCount: activeTables.length,
      availableTablesCount: Math.max(0, totalTables - activeTables.length),
      totalTablesCount: totalTables,
      totalMenuItems: totalItems,
      liveDiningSales,
      recentOrders,
      totalKotsCount,
      runningKotsCount,
      completedKotsCount,
      cancelledBillsCount,
      ncBillsCount,
      revenueMix: {
        rooms: 0,
        restaurant: restaurantRevenue + liveDiningSales,
        banquet: 0,
        laundry: 0,
        pos: posRevenue
      },
      revenueTrend: {
        labels: revenueLabels,
        values: revenueValues
      },
      occupancyTrend: {
        labels: revenueLabels,
        values: occupancyValues
      },
      outletSummary
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in getdashboardstats:', err);
    response.setStatus(500);
    response.setMessage(err.message);
    return res.status(500).json(response);
  }
});

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
              { orderMasterId: String(activeBill.order_id || activeBill.id || '') },
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
          amount: Math.round(Number(activeBill.total_amount || activeBill.subtotal || activeBill.order_total || 0)),
          total_amount: Math.round(Number(activeBill.total_amount || activeBill.subtotal || activeBill.order_total || 0)),
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
            table_id: Number(cleanId) || 0, // STRICT RULE: Only match exactly by database table ID
            is_active: 1
          },
          order: [['kot_id', 'DESC']],
          raw: true
        });

        if (kots && kots.length > 0) {
          const kotIds = kots.map(k => k.kot_id);
          const kotItems = await global.serverdbConnection.KOTItem.findAll({
            where: {
              kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kotIds },
              status: { [global.serverdbConnection.Sequelize.Op.ne]: 5 }
            },
            raw: true
          });

          const activeKotItems = kotItems.map((i, idx) => {
            const rawPrice = Number(i.item_price || i.price || i.rate || i.unitPrice || 0);
            return {
              lineId: `kot-item-${i.id || idx}`,
              itemId: i.item_id,
              itemName: i.item_name || 'Item',
              name: i.item_name || 'Item',
              variantName: i.alternative_title || '',
              qty: Number(i.quantity || 1),
              unitPrice: rawPrice,
              price: rawPrice,
              rate: rawPrice,
              total: Number(i.amount || i.total || (Number(i.quantity || 1) * rawPrice) || 0),
              remark: i.notes || ''
            };
          });

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
        limit: 300,
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
              where: {
                kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kIds },
                status: { [global.serverdbConnection.Sequelize.Op.ne]: 5 }
              },
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

        // Robust date and time resolution from all possible database columns
        const rawDate = b.my_order_date || b.created_time || b.actual_created_time || b.intime || b.createdAt || b.bill_date;
        let resolvedDateStr = '';
        let resolvedCreatedAt = b.createdAt || b.created_time || b.my_order_date || b.bill_date;
        if (b.my_order_date) {
          resolvedDateStr = b.my_order_date;
        } else if (b.createdAt) {
          resolvedDateStr = new Date(b.createdAt).toISOString().slice(0, 10);
        } else if (b.created_time && !isNaN(Number(b.created_time))) {
          const tNum = Number(b.created_time);
          resolvedDateStr = new Date(tNum < 1e12 ? tNum * 1000 : tNum).toISOString().slice(0, 10);
        }

        const extraD = typeof b.extra_details === 'string'
          ? (JSON.parse(b.extra_details || '{}') || {})
          : (b.extra_details || {});
        const resolvedPayMode = b.payment || extraD.payment_mode || extraD.paymentMode || extraD.paymentMethod || extraD.payment || 'Cash';
        const isOrderUnpaid = (String(b.order_state).toLowerCase() === 'unpaid' || String(b.order_state).toLowerCase() === 'unpaid_bill' || String(b.order_state).toLowerCase() === 'running' || String(b.payment_status).toLowerCase() === 'unpaid');

        const resolvedOrderType = b.order_type || extraD.order_type || (b.billing_type === 3 ? 'DELIVERY' : (b.billing_type === 2 ? 'TAKEAWAY' : 'DINE_IN'));
        const customerAddress = b.line_1 || extraD.customer_address || extraD.address || '';
        const deliveryBoyName = b.delivery_boy_name || extraD.delivery_boy_name || '';
        const deliveryBoyPhone = b.delivery_boy_phone || extraD.delivery_boy_phone || '';
        const deliveryBoyId = b.deliveryboy_id || extraD.deliveryboy_id || 0;

        return {
          id: currentId,
          order_id: currentId,
          billNo: cleanBillNo,
          table_id: b.table_id,
          table_name: cleanTableName,
          tableNo: cleanTableName,
          order_type: resolvedOrderType,
          billType: resolvedOrderType,
          billing_type: b.billing_type || (resolvedOrderType === 'DELIVERY' ? 3 : (resolvedOrderType === 'TAKEAWAY' ? 2 : 1)),
          my_order_date: b.my_order_date || resolvedDateStr,
          created_time: b.created_time || b.actual_created_time || b.intime,
          actual_created_time: b.actual_created_time,
          intime: b.intime,
          outtime: b.outtime,
          bill_date: b.bill_date,
          billDate: resolvedDateStr || (b.createdAt ? new Date(b.createdAt).toLocaleDateString() : (b.my_order_date || '—')),
          createdAt: resolvedCreatedAt,
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
          customer_address: customerAddress,
          address: customerAddress,
          customer_locality: extraD.customer_locality || extraD.locality || '',
          delivery_boy_name: deliveryBoyName,
          deliveryBoyName: deliveryBoyName,
          delivery_boy_phone: deliveryBoyPhone,
          deliveryboy_id: deliveryBoyId,
          waiter_name: b.waiter || b.waiter_name || 'Staff',
          waiter: b.waiter || b.waiter_name || 'Staff',
          order_status: isOrderUnpaid ? 'unpaid' : (b.order_state || 'completed'),
          status: isOrderUnpaid ? 'unpaid' : (b.order_state || 'completed'),
          order_state: b.order_state || (isOrderUnpaid ? 'unpaid' : 'completed'),
          payment_status: isOrderUnpaid ? 'Unpaid' : 'Paid',
          payment: isOrderUnpaid ? '—' : resolvedPayMode,
          payment_mode: isOrderUnpaid ? '—' : resolvedPayMode,
          paymentMode: isOrderUnpaid ? '—' : resolvedPayMode,
          payment_method: isOrderUnpaid ? '—' : resolvedPayMode,
          extra_details: extraD,
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
        where: {
          is_active: 1,
          status: { [global.serverdbConnection.Sequelize.Op.ne]: 6 },
          ...(targetStoreId && { store_id: targetStoreId })
        },
        order: [['kot_id', 'DESC']],
        raw: true
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

      const formattedKots = unbilledKots.map((k, idx) => {
        const items = kotItemsForUnbilled.filter(ki => String(ki.kot_id) === String(k.kot_id));
        const cleanTableName = k.table_name || `Table ${k.table_id || ''}`;
        let extra = {};
        if (typeof k.extra_details === 'string') {
          try { extra = JSON.parse(k.extra_details || '{}'); } catch (e) { }
        } else {
          extra = k.extra_details || {};
        }

        const rawType = String(extra.order_type || '').toUpperCase();
        let kotOrderType = 'DINE_IN';
        if (rawType.includes('DELIV') || k.billing_type === 3) kotOrderType = 'DELIVERY';
        else if (rawType.includes('TAKE') || k.billing_type === 2) kotOrderType = 'TAKEAWAY';
        else if (k.billing_type === 1) kotOrderType = 'DINE_IN';

        return {
          id: k.kot_id,
          order_id: k.kot_id,
          billNo: k.custom_bill_number || `KOT-${k.kot_id}`,
          table_id: k.table_id,
          table_name: cleanTableName,
          tableNo: cleanTableName,
          order_type: kotOrderType,
          billType: kotOrderType,
          billing_type: k.billing_type || (kotOrderType === 'DELIVERY' ? 3 : (kotOrderType === 'TAKEAWAY' ? 2 : 1)),
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
          customer_address: extra.customer_address || '',
          address: extra.customer_address || '',
          delivery_boy_name: extra.delivery_boy_name || '',
          deliveryBoyName: extra.delivery_boy_name || '',
          waiter_name: k.waiter || 'Staff',
          waiter: k.waiter || 'Staff',
          order_status: extra.order_state || extra.order_status || extra.status || 'Preparing',
          status: extra.order_state || extra.order_status || extra.status || 'Preparing',
          order_state: extra.order_state || extra.order_status || extra.status || 'Preparing',
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
    let bill = null;

    if (String(orderId).startsWith('table-')) {
      const tableId = Number(String(orderId).replace('table-', '')) || 0;
      bill = await global.serverdbConnection.Bill.findOne({
        where: { table_id: tableId },
        order: [['id', 'DESC']],
        raw: true
      });
    } else {
      const cleanNum = String(orderId).replace(/[^0-9]/g, '');
      const numVal = Number(cleanNum) || Number(orderId) || 0;
      if (numVal > 0) {
        bill = await global.serverdbConnection.Bill.findByPk(numVal, { raw: true });
      }
      if (!bill) {
        bill = await global.serverdbConnection.Bill.findOne({
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { order_id: String(orderId) },
              { custom_bill_number: String(orderId) }
            ]
          },
          raw: true
        });
      }
      if (!bill && numVal > 0) {
        bill = await global.serverdbConnection.Bill.findOne({
          where: { table_id: numVal },
          order: [['id', 'DESC']],
          raw: true
        });
      }
    }

    if (!bill) {
      // Fallback: If querying by table-X and no bill is found, check for active KOTs!
      if (String(orderId).startsWith('table-')) {
        const tableId = Number(String(orderId).replace('table-', '')) || 0;
        const kots = await global.serverdbConnection.KOT.findAll({
          where: {
            table_id: tableId, // STRICT RULE: Only match exactly by database table ID
            is_active: 1
          },
          order: [['kot_id', 'DESC']],
          raw: true
        });

        if (kots && kots.length > 0) {
          const kotIds = kots.map(k => k.kot_id);
          const kotItems = await global.serverdbConnection.KOTItem.findAll({
            where: {
              kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kotIds },
              status: { [global.serverdbConnection.Sequelize.Op.ne]: 5 }
            },
            raw: true
          });

          const allItemIds = kotItems.map(k => k.item_id);
          let itemMasterMap = {};
          if (allItemIds.length > 0) {
            try {
              const itemMasters = await global.serverdbConnection.Item.findAll({
                where: { item_id: { [global.serverdbConnection.Sequelize.Op.in]: allItemIds } },
                raw: true
              });
              itemMasters.forEach(im => { itemMasterMap[im.item_id] = im.title; });
            } catch (e) { }
          }

          const items = kotItems.map((i, idx) => {
            const rawPrice = Number(i.item_price || i.price || i.rate || i.unitPrice || 0);
            const realName = (i.item_name && i.item_name !== 'Item') ? i.item_name : (itemMasterMap[i.item_id] || i.item_name || 'Item');
            return {
              itemId: i.item_id,
              itemName: realName,
              name: realName,
              variantName: i.alternative_title || '',
              qty: Number(i.quantity || 1),
              unitPrice: rawPrice,
              rate: rawPrice,
              price: rawPrice,
              total: Number(i.amount || i.total || (Number(i.quantity || 1) * rawPrice) || 0),
              remark: i.notes || ''
            };
          });

          const subtotal = items.reduce((sum, i) => sum + i.total, 0);

          const formattedKotAsBill = {
            id: `kot-${kots[0].kot_id}`,
            order_id: kots[0].kot_id,
            billNo: `KOT-${kots[0].kot_id}`,
            table_id: tableId,
            table_name: `Table ${tableId}`,
            tableNo: `Table ${tableId}`,
            order_type: 'DINE_IN',
            billType: 'DINE_IN',
            billDate: new Date().toLocaleDateString(),
            amount: subtotal,
            total_amount: subtotal,
            subtotal: subtotal,
            tax_amount: 0,
            discount_amount: 0,
            customer_name: kots[0].customer_name || 'Walk-in',
            customerName: kots[0].customer_name || 'Walk-in',
            mobileNo: kots[0].customer_mobile || '—',
            waiter_name: kots[0].waiter || 'Staff',
            order_status: 'running',
            status: 'running',
            payment_status: 'Unpaid',
            items: items
          };

          response.data = formattedKotAsBill;
          response.order = formattedKotAsBill;
          return res.json(response);
        }
      }

      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    const items = await global.serverdbConnection.BillItem.findAll({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { orderMasterId: String(bill.order_id || bill.id || '') },
          { bill_id: bill.id }
        ]
      },
      raw: true
    });

    let profile = null;
    try {
      if (global.serverdbConnection && global.serverdbConnection.CompanyProfile) {
        profile = await global.serverdbConnection.CompanyProfile.findOne({
          where: { store_id: bill.store_id || 'STORE_1' },
          raw: true
        });
        if (!profile) {
          profile = await global.serverdbConnection.CompanyProfile.findOne({ raw: true });
        }
      }
    } catch (e) {
      console.warn('CompanyProfile query failed:', e.message);
    }

    let store = null;
    let extra = {};
    try {
      if (global.serverdbConnection && global.serverdbConnection.Store) {
        store = await global.serverdbConnection.Store.findOne({
          where: { store_id: bill.store_id || 'STORE_1' },
          raw: true
        });
        if (store && store.settings) {
          extra = typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings;
        }
      }
    } catch (e) {
      console.warn('Store query failed:', e.message);
    }

    const outletPrefix = getStorePrefix(store);
    const cleanTablePrefix = (rawVal, pfx) => {
      if (!rawVal) return `${outletPrefix || 'T'}--`;
      let s = String(rawVal).trim();
      if (/^TK[-_\s]?\d+/i.test(s)) return `TK-${s.replace(/\D/g, '') || '1'}`;
      if (/^DL[-_\s]?\d+/i.test(s)) return `DL-${s.replace(/\D/g, '') || '1'}`;
      const effectivePrefix = (pfx !== undefined && pfx !== null && String(pfx).trim() !== '') ? String(pfx).trim() : (outletPrefix || 'T');
      s = s.replace(/^Table\s*/i, '');
      const pRegex = new RegExp(`^${effectivePrefix}[-_\\s]*(\\d+)$`, 'i');
      const pMatch = s.match(pRegex);
      if (pMatch) return `${effectivePrefix}${pMatch[1]}`;
      s = s.replace(/^[A-Za-z]+[-_\\s]*/, '');
      const digits = s.replace(/\D/g, '');
      if (digits) return `${effectivePrefix}${digits}`;
      return s;
    };

    let resolvedTableNo = cleanTablePrefix(bill.table_name || bill.table_id, outletPrefix);
    if (bill.table_id && global.serverdbConnection && global.serverdbConnection.Table) {
      try {
        const tableObj = await global.serverdbConnection.Table.findByPk(bill.table_id, { raw: true });
        if (tableObj) {
          const tExtra = typeof tableObj.extra_details === 'string' ? JSON.parse(tableObj.extra_details || '{}') : (tableObj.extra_details || {});
          let tPrefix = '';
          if (tExtra.prefix !== undefined && tExtra.prefix !== null && String(tExtra.prefix).trim() !== '') {
            tPrefix = String(tExtra.prefix).trim();
          } else if (tableObj.prefix !== undefined && tableObj.prefix !== null && String(tableObj.prefix).trim() !== '') {
            tPrefix = String(tableObj.prefix).trim();
          } else {
            tPrefix = outletPrefix;
          }
          resolvedTableNo = cleanTablePrefix(tableObj.table_name || tableObj.table_no || tableObj.id, tPrefix);
        }
      } catch (e) {
        console.warn('Error resolving table prefix for bill:', e.message);
      }
    }

    const addrParts = [store?.user_line_1, store?.user_line_2, store?.user_sub_locality].filter(p => p && p.trim().length > 0);
    const resolvedAddress = addrParts.length > 0 ? addrParts.join(', ') : (profile?.address || 'Main Dining Area');
    const resolvedPhone = store?.store_phone || store?.user_phone || profile?.phone || '+91 98765 43210';
    const resolvedGstin = extra.gstin || profile?.gstin || '27AAAAA0000A1Z5';
    const resolvedHsn = extra.hsnSac || '9963';

    const subtotal = Number(bill.order_subtotal || bill.subtotal || 0) || items.reduce((sum, i) => sum + (Number(i.quantity || 1) * Number(i.price || 0)), 0);
    const discount = Number(bill.discount || bill.total_external_discount || bill.couponDisount || bill.discount_amount || bill.total_discount || 0);
    const taxableAmount = Math.max(0, subtotal - discount);

    // Fetch ALL active taxes from Tax master for breakdown
    let taxMaster = [];
    try {
      taxMaster = await global.serverdbConnection.Tax.findAll({ where: { is_active: 1 }, raw: true });
    } catch (_) { }

    let taxesBreakdown = [];
    let totalTax = 0;
    if (bill.order_level_total_taxes !== undefined && Number(bill.order_level_total_taxes) > 0 && taxMaster.length > 0) {
      // Recalculate each tax line from master rates
      taxesBreakdown = taxMaster.map(t => {
        const rate = Number(t.tax_percentage || 0);
        const amt = Math.round((taxableAmount * rate / 100) * 100) / 100;
        return { name: t.tax_name || t.tax_display_name, rate, amount: amt };
      });
      totalTax = taxesBreakdown.reduce((s, t) => s + t.amount, 0);
    } else if (taxMaster.length > 0) {
      taxesBreakdown = taxMaster.map(t => {
        const rate = Number(t.tax_percentage || 0);
        const amt = Math.round((taxableAmount * rate / 100) * 100) / 100;
        return { name: t.tax_name || t.tax_display_name, rate, amount: amt };
      });
      totalTax = taxesBreakdown.reduce((s, t) => s + t.amount, 0);
    } else {
      // No tax master: fallback to stored value
      totalTax = Number(bill.order_level_total_taxes || 0);
    }
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

    // Legacy cgst/sgst for backward compat
    const cgstEntry = taxesBreakdown.find(t => t.name?.toUpperCase().includes('CGST'));
    const sgstEntry = taxesBreakdown.find(t => t.name?.toUpperCase().includes('SGST'));
    const cgst = cgstEntry ? cgstEntry.amount : Math.round((totalTax / 2) * 100) / 100;
    const sgst = sgstEntry ? sgstEntry.amount : Math.round((totalTax / 2) * 100) / 100;

    const formatted = {
      id: bill.order_id || bill.id,
      order_id: bill.order_id || bill.id,
      billNo: String(bill.custom_bill_number || bill.order_number || bill.order_id || bill.id),
      table_id: bill.table_id,
      table_name: resolvedTableNo,
      tableNo: resolvedTableNo,
      order_type: bill.order_type || 'DINE_IN',
      billType: bill.order_type || 'DINE_IN',
      billDate: new Date(bill.createdAt || bill.bill_date || Date.now()).toLocaleDateString(),
      orderNo: String(bill.order_number || bill.order_id || bill.id),
      subtotal: subtotal,
      discount: discount,
      discount_amount: discount,
      taxes: {
        cgst: cgst,
        sgst: sgst,
        total_tax: totalTax
      },
      taxes_breakdown: taxesBreakdown,
      tax_amount: totalTax,
      amount: grandTotal,
      total_amount: grandTotal,
      grand_total: grandTotal,
      customerName: bill.cust_name || bill.customer_name || 'Walk-in',
      customer_name: bill.cust_name || bill.customer_name || 'Walk-in',
      mobileNo: bill.phone || bill.mobile || '—',
      mobile_no: bill.phone || bill.mobile || '—',
      waiter: bill.waiter || 'Staff',
      waiter_name: bill.waiter || 'Staff',
      order_status: bill.order_state || 'completed',
      payment_status: bill.payment_status || (bill.order_state === 'completed' ? 'Paid' : 'Unpaid'),
      restaurant_name: (extra.companyTitle !== 'No' ? (profile?.company_name || 'ALFA HOTEL & RESTAURANT') : ''),
      outlet_name: (extra.outletTitle !== 'No' ? (store?.store_name || '') : ''),
      address: resolvedAddress,
      phone: resolvedPhone,
      gstin: resolvedGstin,
      hsn: resolvedHsn,
      fssai: profile?.fssai || '10020021000123',
      extra_details: typeof bill.extra_details === 'string' ? JSON.parse(bill.extra_details || '{}') : (bill.extra_details || {}),
      items: items.map(i => ({
        itemId: i.item_id,
        itemName: i.title || i.item_name || i.name || 'Item',
        variantName: i.alternative_title || '',
        qty: Number(i.quantity || 1),
        unitPrice: Number(i.price || i.rate || 0),
        total: Number(i.total || (i.quantity * i.price) || 0)
      }))
    };

    // Retrieve all recorded payments for this order
    try {
      const orderIdentifier = String(bill.order_id || bill.id);
      const billPayments = await global.serverdbConnection.BillPayment.findAll({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { order_id: orderIdentifier },
            { order_id: String(bill.id) },
            ...(bill.order_id ? [{ order_id: String(bill.order_id) }] : [])
          ]
        },
        order: [['id', 'ASC']],
        raw: true
      });
      const totalPaid = billPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      formatted.payments = billPayments.map((p, idx) => ({
        id: p.id || idx + 1,
        mode: p.payment_mode || p.mode || 'Cash',
        amount: Number(p.amount || 0),
        status: 'COMPLETED',
        date: p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : formatted.billDate),
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:30 AM',
        ref: `TXN-${p.id || idx + 1}`
      }));
      formatted.total_paid = Math.round(totalPaid * 100) / 100;
      formatted.paid_amount = formatted.total_paid;
      formatted.balance_due = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);
    } catch (payErr) {
      console.warn('Failed to fetch BillPayment list:', payErr.message);
      formatted.payments = [];
      formatted.total_paid = 0;
      formatted.balance_due = grandTotal;
    }

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
            where: {
              kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kIds },
              status: { [global.serverdbConnection.Sequelize.Op.ne]: 5 }
            },
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

    let profile = null;
    try {
      if (global.serverdbConnection && global.serverdbConnection.CompanyProfile) {
        profile = await global.serverdbConnection.CompanyProfile.findOne({
          where: { store_id: bill.store_id || 'STORE_1' },
          raw: true
        });
        if (!profile) {
          profile = await global.serverdbConnection.CompanyProfile.findOne({ raw: true });
        }
      }
    } catch (e) {
      console.warn('CompanyProfile query failed:', e.message);
    }

    let store = null;
    let extra = {};
    try {
      if (global.serverdbConnection && global.serverdbConnection.Store) {
        store = await global.serverdbConnection.Store.findOne({
          where: { store_id: bill.store_id || 'STORE_1' },
          raw: true
        });
        if (store && store.settings) {
          extra = typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings;
        }
      }
    } catch (e) {
      console.warn('Store query failed:', e.message);
    }

    const outletPrefix = getStorePrefix(store);
    let resolvedTableNo = String(bill.table_name || bill.table_id || '1');
    if (bill.table_id && global.serverdbConnection && global.serverdbConnection.Table) {
      try {
        const tableObj = await global.serverdbConnection.Table.findByPk(bill.table_id, { raw: true });
        if (tableObj) {
          const tExtra = typeof tableObj.extra_details === 'string' ? JSON.parse(tableObj.extra_details || '{}') : (tableObj.extra_details || {});
          let tPrefix = '';
          if (tExtra.prefix !== undefined && tExtra.prefix !== null && String(tExtra.prefix).trim() !== '') {
            tPrefix = String(tExtra.prefix).trim();
          } else if (tableObj.prefix !== undefined && tableObj.prefix !== null && String(tableObj.prefix).trim() !== '') {
            tPrefix = String(tableObj.prefix).trim();
          } else {
            tPrefix = outletPrefix;
          }
          const rawTName = String(tableObj.table_name || tableObj.table_no || tableObj.id);
          if (/^TK[-_\s]?\d+/i.test(rawTName)) {
            resolvedTableNo = `TK-${rawTName.replace(/\D/g, '') || '1'}`;
          } else if (/^DL[-_\s]?\d+/i.test(rawTName)) {
            resolvedTableNo = `DL-${rawTName.replace(/\D/g, '') || '1'}`;
          } else {
            const tableNoStr = String(tableObj.table_no || tableObj.table_name || tableObj.id).replace(/[^0-9]/g, '') || String(tableObj.id);
            resolvedTableNo = `${tPrefix}${parseInt(tableNoStr, 10) || tableNoStr}`;
          }
        }
      } catch (e) {
        console.warn('Error resolving table prefix for invoice:', e.message);
      }
    }

    const addrParts = [store?.user_line_1, store?.user_line_2, store?.user_sub_locality].filter(p => p && p.trim().length > 0);
    const resolvedAddress = addrParts.length > 0 ? addrParts.join(', ') : (profile?.address || 'Main Dining Area');
    const resolvedPhone = store?.store_phone || store?.user_phone || profile?.phone || '+91 98765 43210';
    const resolvedGstin = extra.gstin || profile?.gstin || '27AAAAA0000A1Z5';
    const resolvedHsn = extra.hsnSac || '9963';

    let paymentMethod = bill.payment || 'Cash';
    try {
      const pm = await global.serverdbConnection.BillPayment.findOne({
        where: { order_id: orderMasterId },
        order: [['id', 'DESC']],
        raw: true
      });
      if (pm && pm.payment_mode) paymentMethod = pm.payment_mode;
    } catch (e) { }

    const itemsFormatted = billItems.map(item => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.price || item.rate || item.unitPrice || item.item_price || 0);
      const total = Number(item.total || item.amount || (qty * price));
      const variant = item.alternative_title ? String(item.alternative_title).trim() : '';
      const baseName = item.title || item.item_name || item.name || 'Item';
      const displayName = variant ? `${baseName} (${variant})` : baseName;
      return {
        item_id: item.id || item.item_id,
        name: displayName,
        variantName: variant,
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
      restaurant_name: (extra.companyTitle !== 'No' ? (profile?.company_name || 'ALFA HMS RESTAURANT') : ''),
      outlet_name: (extra.outletTitle !== 'No' ? (store?.store_name || '') : ''),
      address: resolvedAddress,
      phone: resolvedPhone,
      gstin: resolvedGstin,
      hsn: resolvedHsn,
      fssai: profile?.fssai || '10020021000123',
      invoice_number: bill.custom_bill_number || `INV-${orderMasterId}`,
      bill_number: bill.custom_bill_number || `BILL-${orderMasterId}`,
      order_number: `ORD-${orderMasterId}`,
      table_number: resolvedTableNo,
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

    const discount = Number(payload.discount || payload.discount_amount || 0);
    const taxAmount = payload.tax || payload.taxes || (subtotal * 0.05); // default 5% tax if not specified
    const totalAmount = Math.round(Math.max(0, subtotal + taxAmount - discount));

    const targetTableId = Number(payload.tableId || payload.table_id || 0);
    const targetStoreId = payload.store_id || payload.outletId || req.body?.store_id || req.body?.outletId || req.query?.store_id || req.query?.outletId || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';

    let existingBill = null;
    const targetOrderId = payload.order_id || payload.orderId || payload.id || payload.current_order_id;
    if (targetOrderId) {
      existingBill = await global.serverdbConnection.Bill.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { id: isNaN(targetOrderId) ? 0 : Number(targetOrderId) },
            { order_id: String(targetOrderId) },
            { custom_bill_number: String(targetOrderId) }
          ]
        }
      });
    }

    if (!existingBill && targetTableId > 0) {
      existingBill = await global.serverdbConnection.Bill.findOne({
        where: {
          table_id: targetTableId,
          store_id: targetStoreId,
          order_state: {
            [global.serverdbConnection.Sequelize.Op.in]: ['pending', 'unpaid', 'UNPAID_BILL', 'UNPAID', 'Running', 'running']
          }
        },
        order: [['id', 'DESC']]
      });
    }

    // Enforce outlet-specific Bill limit (Section 9, 10)
    if (!existingBill && targetTableId > 0) {
      try {
        const store = await global.serverdbConnection.Store.findOne({
          where: { store_id: targetStoreId },
          raw: true
        });
        if (store) {
          const extra = typeof store.settings === 'string' ? JSON.parse(store.settings) : (store.settings || {});
          const allowedBillLimit = parseInt(extra.noOfBills || '1', 10);

          const oldestActiveKot = await global.serverdbConnection.KOT.findOne({
            where: {
              table_id: targetTableId,
              store_id: targetStoreId,
              is_active: 1,
              status: { [global.serverdbConnection.Sequelize.Op.ne]: 6 }
            },
            order: [['kot_id', 'ASC']],
            raw: true
          });

          if (oldestActiveKot) {
            const todayStr = new Date().toISOString().split('T')[0];
            const activeBillsCount = await global.serverdbConnection.Bill.count({
              where: {
                table_id: targetTableId,
                store_id: targetStoreId,
                my_order_date: todayStr
              }
            });

            if (activeBillsCount >= allowedBillLimit && allowedBillLimit > 0) {
              // Disable this check to allow multiple bills per table per day
              // response.setStatus(400);
              // response.setMessage(`No more bills are allowed for this transaction. Limit reached: ${allowedBillLimit}`);
              // return res.status(400).json(response);
              console.log(`Bypassing Bill limit of ${allowedBillLimit} for table ${targetTableId}`);
            }
          }
        }
      } catch (e) {
        console.warn('Error checking Bill limits:', e.message);
      }
    }

    const resolvedCustName = payload.customerName || payload.customer_name || 'Walk-in';
    const rawMobile = payload.mobileNo || payload.customer_phone || payload.mobile || '';
    const resolvedMobile = (rawMobile && rawMobile !== '—') ? rawMobile : '';

    const isCompletedPayment = payload.status === 'completed' || payload.payment_status === 'Paid' || payload.payment_status === 'PAID';
    const resolvedPayStatus = isCompletedPayment ? 'Paid' : (payload.payment_status || 'Unpaid');
    const resolvedOrderState = isCompletedPayment ? 'completed' : (payload.status || 'pending');

    const payMode = payload.paymentMode || payload.paymentMethod || payload.payment || 'Cash';
    const rawOrderType = String(payload.order_type || payload.billType || '').toUpperCase();
    const isDelivery = rawType => rawType.includes('DELIV');
    const isTakeaway = rawType => rawType.includes('TAKE');
    const calculatedBillingType = isDelivery(rawOrderType) ? 3 : (isTakeaway(rawOrderType) ? 2 : 1);
    const normalizedOrderType = calculatedBillingType === 3 ? 'DELIVERY' : (calculatedBillingType === 2 ? 'TAKEAWAY' : 'DINE_IN');
    const isDineIn = calculatedBillingType === 1;

    let createdBill;
    if (existingBill) {
      const updateFields = {
        store_id: targetStoreId,
        payment: payMode,
        billing_type: calculatedBillingType,
        delivery_type: calculatedBillingType === 3 ? 'DELIVERY' : (calculatedBillingType === 2 ? 'TAKEAWAY' : 'DINE_IN'),
        order_subtotal: subtotal || existingBill.order_subtotal,
        order_level_total_taxes: taxAmount || existingBill.order_level_total_taxes,
        discount: String(discount),
        order_total: totalAmount || existingBill.order_total,
        order_state: resolvedOrderState,
        waiter: payload.waiter || payload.waiter_name || existingBill.waiter,
        extra_details: {
          ...(typeof existingBill.extra_details === 'string' ? JSON.parse(existingBill.extra_details || '{}') : (existingBill.extra_details || {})),
          payment_mode: payMode,
          paymentMode: payMode,
          paymentMethod: payMode,
          payment: payMode,
          order_type: normalizedOrderType,
          takeaway_no: payload.takeaway_no || null,
          delivery_no: payload.delivery_no || null,
          customer_address: payload.customer_address || payload.address || '',
          customer_locality: payload.customer_locality || payload.locality || '',
          delivery_boy_name: payload.delivery_boy_name || payload.deliveryBoy || '',
          deliveryboy_id: payload.deliveryboy_id || 0,
          total_amount: totalAmount,
          payment_status: resolvedPayStatus
        }
      };
      if (resolvedCustName && resolvedCustName !== 'Walk-in') {
        updateFields.cust_name = resolvedCustName;
      }
      if (resolvedMobile) {
        updateFields.phone = resolvedMobile;
      }
      if (payload.customer_address || payload.address) {
        updateFields.line_1 = payload.customer_address || payload.address;
      }
      if (payload.delivery_boy_name || payload.deliveryBoy) {
        updateFields.delivery_boy_name = payload.delivery_boy_name || payload.deliveryBoy;
      }
      if (payload.deliveryboy_id) {
        updateFields.deliveryboy_id = Number(payload.deliveryboy_id) || 0;
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
      const maxBillNum = await global.serverdbConnection.Bill.max('bill_number', {
        where: { store_id: targetStoreId }
      }).catch(() => 0) || 0;
      const existingBillCount = await global.serverdbConnection.Bill.count({
        where: { store_id: targetStoreId }
      }).catch(() => 0);
      const seqNum = Math.max(existingBillCount, maxBillNum) + 1;
      const orderIdStr = payload.order_id || `ORD-${Date.now()}-${seqNum}`;
      const timeStr = new Date().toTimeString().split(' ')[0];

      // Resolve business date respecting 2:00 AM closing rule and active session
      let resolvedBizDate = payload.business_date || payload.businessDate || null;
      let activeSessionId = null;
      try {
        const { resolveBusinessDate } = require('../util/businessDateUtil');
        const activeSession = await global.serverdbConnection.StartcloseDay.findOne({
          where: {
            store_id: targetStoreId,
            day_close_date: null
          },
          order: [['id', 'DESC']],
          raw: true
        });
        const storeObj = await global.serverdbConnection.Store.findOne({ where: { store_id: targetStoreId }, raw: true });
        const bizRes = resolveBusinessDate(activeSession, storeObj || {});
        resolvedBizDate = resolvedBizDate || bizRes.businessDate;
        activeSessionId = activeSession ? activeSession.id : null;
      } catch (bizErr) {
        resolvedBizDate = resolvedBizDate || new Date().toISOString().slice(0, 10);
      }

      createdBill = await global.serverdbConnection.Bill.create({
        order_id: orderIdStr,
        table_id: isDineIn ? (targetTableId || 1) : 0,
        table_name: isDineIn ? (payload.tableNo || payload.table_name || `Table ${targetTableId || 1}`) : (payload.tableNo || payload.table_name || normalizedOrderType),
        billing_type: calculatedBillingType,
        delivery_type: calculatedBillingType === 3 ? 'DELIVERY' : (calculatedBillingType === 2 ? 'TAKEAWAY' : 'DINE_IN'),
        store_id: targetStoreId,
        payment: payMode,
        order_subtotal: subtotal,
        order_level_total_taxes: taxAmount,
        discount: String(discount),
        order_total: totalAmount,
        order_level_total_charges: 0,
        order_state: resolvedOrderState,
        cust_name: resolvedCustName,
        phone: resolvedMobile || '—',
        line_1: payload.customer_address || payload.address || '',
        delivery_boy_name: payload.delivery_boy_name || payload.deliveryBoy || '',
        deliveryboy_id: Number(payload.deliveryboy_id) || 0,
        waiter: payload.waiter || payload.waiter_name || 'Staff',
        custom_bill_number: (payload.billNo && /^Bill\s+\d+$/i.test(String(payload.billNo).trim())) ? String(payload.billNo).trim() : `Bill ${seqNum}`,
        bill_number: seqNum,
        my_order_date: resolvedBizDate,
        business_date: resolvedBizDate,
        night_audit_id: activeSessionId,
        created_time: timeStr,
        actual_created_time: timeStr,
        intime: timeStr,
        outtime: timeStr,
        extra_details: {
          payment_mode: payMode,
          paymentMode: payMode,
          paymentMethod: payMode,
          payment: payMode,
          order_type: normalizedOrderType,
          takeaway_no: payload.takeaway_no || null,
          delivery_no: payload.delivery_no || null,
          customer_address: payload.customer_address || payload.address || '',
          customer_locality: payload.customer_locality || payload.locality || '',
          delivery_boy_name: payload.delivery_boy_name || payload.deliveryBoy || '',
          deliveryboy_id: Number(payload.deliveryboy_id) || 0,
          total_amount: totalAmount,
          payment_status: resolvedPayStatus
        }
      });
    }

    const billId = createdBill.id || createdBill.order_id;

    if (items.length > 0) {
      for (const item of items) {
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.unitPrice || item.price || item.rate || 0);
        const itId = Number(item.itemId || item.id || 1);
        await global.serverdbConnection.BillItem.create({
          bill_id: Number(billId) || 0,
          orderMasterId: String(createdBill.order_id || billId),
          item_id: itId,
          title: item.itemName || item.name || 'Item',
          alternative_title: item.variantName || item.variant || '',
          quantity: qty,
          price: price,
          total: qty * price,
          store_id: 'STORE_1'
        });

        // If temporary item, delete it from menu catalog after billing
        if (itId > 0 && (item.is_open_item === 1 || item.is_open_item === '1' || item.is_open_item === true)) {
          try {
            await global.serverdbConnection.Item.update(
              { active: 0, description: 'BILLED' },
              { where: { item_id: itId, is_open_item: 1 } }
            );
          } catch (e) { }
        }
      }
    }

    // Close / Deactivate associated KOT if paying an unbilled KOT
    const kotIdToClose = payload.kot_id || (payload.order_id && !String(payload.order_id).startsWith('ORD-') ? payload.order_id : null);
    if (kotIdToClose) {
      await global.serverdbConnection.KOT.update(
        { status: 6, is_active: 0, order_id: Number(createdBill.id) || 0 },
        {
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { kot_id: isNaN(Number(kotIdToClose)) ? 0 : Number(kotIdToClose) },
              { custom_bill_number: String(kotIdToClose) }
            ]
          }
        }
      ).catch(e => console.warn('KOT status update error:', e.message));
    }

    // Update table status in PostgreSQL STRICTLY for Dine-In only (Never touch physical tables for Takeaway or Delivery!)
    if (isDineIn && (payload.tableId || payload.table_id)) {
      const tId = payload.tableId || payload.table_id;
      if (isCompletedPayment) {
        const tbl = await global.serverdbConnection.Table.findByPk(tId);
        let extra = {};
        if (tbl) {
          if (typeof tbl.extra_details === 'string') {
            try { extra = JSON.parse(tbl.extra_details || '{}'); } catch (e) { }
          } else {
            extra = tbl.extra_details || {};
          }
        }
        await global.serverdbConnection.Table.update(
          {
            order_state: 'PAYMENT_COMPLETED',
            extra_details: {
              ...extra,
              status: 'PAYMENT_COMPLETED',
              color: 'green',
              payment_status: 'PAID',
              payment_completed_at: Date.now(),
              cleanedAt: Date.now()
            }
          },
          { where: { id: tId } }
        ).catch(() => { });
        // Close KOTs for this table
        await global.serverdbConnection.KOT.update(
          { status: 6 },
          { where: { table_id: tId, is_active: 1 } }
        ).catch(() => { });
      } else {
        const nextState = (payload.status === 'unpaid' || payload.status === 'UNPAID_BILL') ? 'UNPAID_BILL' : 'Running';
        const tbl = await global.serverdbConnection.Table.findByPk(tId);
        let extra = {};
        if (tbl) {
          if (typeof tbl.extra_details === 'string') {
            try { extra = JSON.parse(tbl.extra_details || '{}'); } catch (e) { }
          } else {
            extra = tbl.extra_details || {};
          }
        }
        await global.serverdbConnection.Table.update(
          {
            order_state: nextState,
            extra_details: {
              ...extra,
              status: nextState,
              color: nextState === 'UNPAID_BILL' ? 'blue' : 'yellow',
              amount: totalAmount,
              total_amount: totalAmount,
              payment_status: 'UNPAID',
              current_order_id: billId
            }
          },
          { where: { id: tId } }
        ).catch(() => { });
      }
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
    let bill = await global.serverdbConnection.Bill.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { id: isNaN(orderId) ? 0 : Number(orderId) },
          { order_id: String(orderId) },
          { custom_bill_number: String(orderId) }
        ]
      }
    });
    if (!bill) {
      const numericOrderId = Number(String(orderId).replace(/[^0-9]/g, ''));
      const kot = await global.serverdbConnection.KOT.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { kot_id: isNaN(orderId) ? 0 : Number(orderId) },
            { custom_bill_number: String(orderId) },
            ...(!isNaN(numericOrderId) && numericOrderId > 0 ? [{ kot_id: numericOrderId }] : [])
          ]
        }
      });

      if (kot) {
        const isCompleted = req.body.status === 'completed' || req.body.payment_status === 'Paid' || req.body.payment_status === 'PAID';
        const payMode = req.body.paymentMode || req.body.paymentMethod || req.body.payment || 'Cash';
        const rawType = String(kot.billing_type === 3 ? 'DELIVERY' : (kot.billing_type === 2 ? 'TAKEAWAY' : 'DINE_IN'));
        const subtotal = req.body.subtotal !== undefined ? Number(req.body.subtotal) : Number(kot.amount || 0);
        const tax = req.body.tax !== undefined ? Number(req.body.tax) : Number(req.body.taxes || 0);
        const discount = Number(req.body.discount || 0);
        const totalAmount = req.body.amount !== undefined ? Number(req.body.amount) : Math.round(Math.max(0, subtotal + tax - discount));
        
        let extra = {};
        if (typeof kot.extra_details === 'string') {
          try { extra = JSON.parse(kot.extra_details || '{}'); } catch (e) { }
        } else {
          extra = kot.extra_details || {};
        }

        const seqNum = Date.now().toString().slice(-4);
        const orderIdStr = `ORD-${Date.now()}-${seqNum}`;

        const createdBill = await global.serverdbConnection.Bill.create({
          order_id: orderIdStr,
          table_id: kot.table_id || 0,
          table_name: kot.table_name || rawType,
          billing_type: kot.billing_type || 2,
          delivery_type: rawType,
          store_id: kot.store_id || 'STORE_1',
          payment: payMode,
          order_subtotal: subtotal,
          order_level_total_taxes: tax,
          discount: String(discount),
          order_total: totalAmount,
          order_state: isCompleted ? 'completed' : 'pending',
          cust_name: req.body.customerName || kot.customer_name || 'Walk-in',
          phone: req.body.mobileNo || kot.customer_mobile || '—',
          custom_bill_number: `Bill ${seqNum}`,
          bill_number: Number(seqNum),
          extra_details: {
            ...extra,
            payment_mode: payMode,
            payment_status: isCompleted ? 'Paid' : 'Unpaid',
            status: isCompleted ? 'completed' : 'pending'
          }
        });

        // Deactivate KOT
        await kot.update({ status: 6, is_active: 0, order_id: Number(createdBill.id) || 0 });

        response.setStatus(200);
        response.setMessage('Order created and settled successfully');
        response.data = createdBill;
        response.order = createdBill;
        return res.json(response);
      }

      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    const items = Array.isArray(req.body.items) ? req.body.items : (Array.isArray(req.body.rows) ? req.body.rows : null);

    let subtotal = Number(req.body.subtotal !== undefined ? req.body.subtotal : bill.order_subtotal);
    if (items && req.body.subtotal === undefined) {
      subtotal = items.reduce((sum, it) => sum + (Number(it.qty || it.quantity || 1) * Number(it.unitPrice || it.price || it.rate || 0)), 0);
    }
    const discount = req.body.discount !== undefined ? Number(req.body.discount) : Number(bill.discount || 0);
    const tax = req.body.tax !== undefined ? Number(req.body.tax) : (req.body.taxes !== undefined ? Number(req.body.taxes) : Number(bill.order_level_total_taxes || 0));
    const totalAmount = req.body.amount !== undefined ? Number(req.body.amount) : Math.round(Math.max(0, subtotal + tax - discount));

    const custName = req.body.customerName || req.body.cust_name || req.body.customer_name;
    const phone = req.body.mobileNo || req.body.phone || req.body.mobile;

    const resolvedStatus = (req.body.status === 'completed' || req.body.payment_status === 'Paid' || req.body.payment_status === 'PAID') ? 'completed' : (req.body.status || req.body.order_state || bill.order_state);
    const resolvedPay = (req.body.status === 'completed' || req.body.payment_status === 'Paid' || req.body.payment_status === 'PAID') ? 'Paid' : (req.body.payment_status || 'Unpaid');

    const payMode = req.body.paymentMode || req.body.paymentMethod || req.body.payment || bill.payment || 'Cash';

    await bill.update({
      ...(custName && { cust_name: custName }),
      ...(phone && { phone: phone }),
      order_state: resolvedStatus,
      payment: payMode,
      ...(req.body.waiter && { waiter: req.body.waiter }),
      order_subtotal: subtotal,
      order_level_total_taxes: tax,
      discount: String(discount),
      order_total: totalAmount,
      extra_details: {
        ...(typeof bill.extra_details === 'string' ? JSON.parse(bill.extra_details || '{}') : (bill.extra_details || {})),
        payment_mode: payMode,
        paymentMode: payMode,
        paymentMethod: payMode,
        payment: payMode,
        payment_status: resolvedPay,
        status: resolvedStatus,
        total_amount: totalAmount
      }
    });

    if (items) {
      await global.serverdbConnection.BillItem.destroy({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { bill_id: bill.id },
            { orderMasterId: String(bill.id) }
          ]
        }
      });

      for (const item of items) {
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.unitPrice || item.price || item.rate || 0);
        const itId = Number(item.itemId || item.item_id || item.id || 1);
        await global.serverdbConnection.BillItem.create({
          bill_id: Number(bill.id) || 0,
          orderMasterId: String(bill.order_id || bill.id),
          item_id: itId,
          title: item.itemName || item.name || item.title || 'Item',
          alternative_title: item.variantName || item.alternative_title || item.variant || '',
          quantity: qty,
          price: price,
          total: qty * price,
          store_id: bill.store_id || 'STORE_1'
        });
      }
    }

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
    const numericOrderId = Number(String(orderId).replace(/[^0-9]/g, ''));
    let bill = await global.serverdbConnection.Bill.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { custom_bill_number: orderId },
          { order_id: String(orderId) },
          ...(isNaN(Number(orderId)) ? [] : [{ id: Number(orderId) }]),
          ...(!isNaN(numericOrderId) && numericOrderId > 0 ? [{ id: numericOrderId }] : [])
        ]
      }
    });

    if (!bill) {
      // Look up in KOT table if this order is an unbilled KOT
      const kot = await global.serverdbConnection.KOT.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { kot_id: isNaN(Number(orderId)) ? 0 : Number(orderId) },
            { custom_bill_number: String(orderId) },
            ...(!isNaN(numericOrderId) && numericOrderId > 0 ? [{ kot_id: numericOrderId }] : [])
          ]
        }
      });

      if (kot) {
        const nextStatus = req.body.status || req.body.order_state || 'Ready for Pickup';
        const deliveryBoyName = req.body.delivery_boy_name || req.body.deliveryBoy || req.body.name;
        const deliveryBoyId = req.body.deliveryboy_id || req.body.deliveryBoyId;
        const deliveryBoyPhone = req.body.delivery_boy_phone || req.body.phone;

        let extraDetails = {};
        if (typeof kot.extra_details === 'string') {
          try { extraDetails = JSON.parse(kot.extra_details || '{}'); } catch (e) { }
        } else {
          extraDetails = kot.extra_details || {};
        }

        extraDetails.order_state = nextStatus;
        extraDetails.order_status = nextStatus;
        extraDetails.status = nextStatus;
        if (deliveryBoyName) extraDetails.delivery_boy_name = deliveryBoyName;
        if (deliveryBoyId) extraDetails.deliveryboy_id = deliveryBoyId;
        if (deliveryBoyPhone) extraDetails.delivery_boy_phone = deliveryBoyPhone;

        const updateFields = {
          extra_details: extraDetails
        };
        if (deliveryBoyId) updateFields.deliveryboy_id = Number(deliveryBoyId) || 0;
        if (nextStatus === 'Completed' || nextStatus === 'Delivered' || nextStatus === 'Picked Up') {
          updateFields.status = 6;
          updateFields.is_active = 0;
        }

        await kot.update(updateFields);

        response.setStatus(200);
        response.setMessage(`Order status updated to ${nextStatus}`);
        response.data = kot;
        return res.json(response);
      }

      response.setStatus(404);
      response.setMessage('Order not found');
      return res.json(response);
    }

    const nextStatus = req.body.status || req.body.order_state || bill.order_state || 'completed';
    const deliveryBoyName = req.body.delivery_boy_name || req.body.deliveryBoy || req.body.name;
    const deliveryBoyId = req.body.deliveryboy_id || req.body.deliveryBoyId;
    const deliveryBoyPhone = req.body.delivery_boy_phone || req.body.phone;

    let extraDetails = {};
    if (typeof bill.extra_details === 'string') {
      try { extraDetails = JSON.parse(bill.extra_details || '{}'); } catch (e) { }
    } else {
      extraDetails = bill.extra_details || {};
    }

    extraDetails.order_state = nextStatus;
    if (deliveryBoyName) extraDetails.delivery_boy_name = deliveryBoyName;
    if (deliveryBoyId) extraDetails.deliveryboy_id = deliveryBoyId;
    if (deliveryBoyPhone) extraDetails.delivery_boy_phone = deliveryBoyPhone;

    const updateFields = {
      order_state: nextStatus,
      extra_details: extraDetails
    };

    if (deliveryBoyName) updateFields.delivery_boy_name = deliveryBoyName;
    if (deliveryBoyId) updateFields.deliveryboy_id = Number(deliveryBoyId) || 0;
    if (deliveryBoyPhone) updateFields.delivery_boy_phone = deliveryBoyPhone;

    await bill.update(updateFields);

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

    // Calculate total payments recorded so far for this bill
    const orderIdentifier = String(bill.order_id || bill.id);
    const existingPayments = await global.serverdbConnection.BillPayment.findAll({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { order_id: orderIdentifier },
          { order_id: String(bill.id) },
          ...(bill.order_id ? [{ order_id: String(bill.order_id) }] : [])
        ]
      },
      transaction
    });

    const totalPaidSoFar = existingPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const billGrandTotal = Number(bill.total_amount || bill.order_total || 0);
    const outstanding = Math.max(0, Math.round((billGrandTotal - totalPaidSoFar) * 100) / 100);

    // If already fully settled and no positive balance remains, prevent duplicate payment
    if (outstanding <= 0 && (bill.order_state === 'completed' || bill.payment_status === 'Paid')) {
      await transaction.rollback();
      response.setStatus(200);
      response.setMessage('Bill is already settled and paid in full. No additional payment required.');
      return res.json(response);
    }

    const payMode = req.body.paymentMethod || req.body.paymentMode || 'Cash';
    // Collect only the requested amount or the remaining outstanding balance, never duplicate the entire total
    const requestedAmt = req.body.amount !== undefined ? Number(req.body.amount) : outstanding;
    const payAmt = Math.min(requestedAmt, outstanding > 0 ? outstanding : requestedAmt);

    if (payAmt <= 0 && outstanding <= 0) {
      await transaction.rollback();
      response.setStatus(200);
      response.setMessage('No balance due on this order.');
      return res.json(response);
    }

    const newTotalPaid = Math.round((totalPaidSoFar + payAmt) * 100) / 100;
    const isNowFullyPaid = newTotalPaid >= billGrandTotal;

    await bill.update({
      order_state: isNowFullyPaid ? 'completed' : 'settling',
      payment: payMode,
      extra_details: {
        ...(typeof bill.extra_details === 'string' ? JSON.parse(bill.extra_details || '{}') : (bill.extra_details || {})),
        payment_mode: payMode,
        paymentMode: payMode,
        paymentMethod: payMode,
        payment: payMode,
        payment_status: isNowFullyPaid ? 'Paid' : 'Partially Paid'
      }
    }, { transaction });

    // Record additional payment entry with exact delta amount
    await global.serverdbConnection.BillPayment.create({
      order_id: bill.order_id || String(bill.id),
      amount: payAmt,
      payment_option: payMode
    }, { transaction }).catch(err => console.warn('BillPayment warning:', err.message));

    // Update associated table to PAYMENT_COMPLETED in PostgreSQL
    if (bill.table_id) {
      const tbl = await global.serverdbConnection.Table.findByPk(bill.table_id, { transaction });
      if (tbl) {
        let extra = {};
        if (typeof tbl.extra_details === 'string') {
          try { extra = JSON.parse(tbl.extra_details || '{}'); } catch (e) { }
        } else {
          extra = tbl.extra_details || {};
        }
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
      await transaction.rollback().catch(() => { });
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
    const bill = await global.serverdbConnection.Bill.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { id: isNaN(orderId) ? 0 : Number(orderId) },
          { order_id: String(orderId) },
          { custom_bill_number: String(orderId) }
        ]
      }
    });

    if (bill) {
      const bId = bill.id;
      const bOrderId = bill.order_id;

      // 1. Delete associated Bill Items
      await global.serverdbConnection.BillItem.destroy({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { bill_id: bId },
            { orderMasterId: String(bId) },
            ...(bOrderId ? [{ orderMasterId: String(bOrderId) }] : [])
          ]
        }
      }).catch(e => console.warn('BillItem destroy error:', e.message));

      // 2. Delete associated Order Payments if present
      if (global.serverdbConnection.OrderPayment) {
        await global.serverdbConnection.OrderPayment.destroy({
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { order_id: String(bId) },
              ...(bOrderId ? [{ order_id: String(bOrderId) }] : [])
            ]
          }
        }).catch(e => console.warn('OrderPayment destroy error:', e.message));
      }

      // 3. Reset associated Table if it was attached to this bill
      if (bill.table_id) {
        try {
          const tbl = await global.serverdbConnection.Table.findByPk(bill.table_id);
          if (tbl) {
            let extra = {};
            if (typeof tbl.extra_details === 'string') {
              try { extra = JSON.parse(tbl.extra_details || '{}'); } catch (e) { }
            } else {
              extra = tbl.extra_details || {};
            }
            if (String(extra.current_order_id) === String(bId) || String(extra.current_order_id) === String(bOrderId) || extra.status === 'UNPAID_BILL') {
              await global.serverdbConnection.Table.update({
                order_state: 'AVAILABLE',
                extra_details: {
                  ...extra,
                  status: 'AVAILABLE',
                  color: 'white',
                  current_order_id: null,
                  amount: 0,
                  total_amount: 0
                }
              }, { where: { id: bill.table_id } });
            }
          }
        } catch (tblErr) {
          console.warn('Table reset error on bill delete:', tblErr.message);
        }
      }

      // 4. Destroy the bill itself
      await bill.destroy();
    } else {
      // Fallback: delete directly by id or order_id
      await global.serverdbConnection.BillItem.destroy({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { bill_id: isNaN(orderId) ? 0 : Number(orderId) },
            { orderMasterId: String(orderId) }
          ]
        }
      }).catch(() => {});
      await global.serverdbConnection.Bill.destroy({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { id: isNaN(orderId) ? 0 : Number(orderId) },
            { order_id: String(orderId) }
          ]
        }
      }).catch(() => {});
    }

    response.setStatus(200);
    response.setMessage('Order deleted successfully');
  } catch (err) {
    console.error('Error deleting order:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete order');
  }
  res.json(response);
});

// DELETE / — delete all orders
router.delete('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    await global.serverdbConnection.OrderPayment.destroy({ where: {} }).catch(() => {});
    await global.serverdbConnection.BillItem.destroy({ where: {} }).catch(() => {});
    await global.serverdbConnection.Bill.destroy({ where: {} }).catch(() => {});

    // Reset table order statuses to AVAILABLE
    try {
      const tables = await global.serverdbConnection.Table.findAll();
      for (const t of tables) {
        let extra = {};
        if (typeof t.extra_details === 'string') {
          try { extra = JSON.parse(t.extra_details || '{}'); } catch (e) { }
        } else {
          extra = t.extra_details || {};
        }
        if (extra.current_order_id || extra.status === 'UNPAID_BILL' || extra.status === 'PAYMENT_COMPLETED') {
          await global.serverdbConnection.Table.update({
            order_state: 'AVAILABLE',
            extra_details: {
              ...extra,
              status: 'AVAILABLE',
              color: 'white',
              current_order_id: null,
              amount: 0,
              total_amount: 0
            }
          }, { where: { id: t.id } });
        }
      }
    } catch (e) {
      console.warn('Reset tables on delete all warning:', e.message);
    }

    response.setStatus(200);
    response.setMessage('All orders deleted successfully');
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
