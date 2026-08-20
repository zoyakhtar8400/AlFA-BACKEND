const express = require('express');
const { KOT, Bill } = require('../js/database');
const { changeTableforkot } = require('../main_controllers/Order');
const { ResponseMessage } = require('../error/ResponseMessage');
const { auth, authorizeOutlet } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use(authorizeOutlet);

// Helper to map DB record to frontend friendly format
function mapTable(t) {
  let extra = {};
  try {
    extra = typeof t.extra_details === 'string' ? JSON.parse(t.extra_details || '{}') : (t.extra_details || {});
  } catch(e) {
    extra = {};
  }
  if (extra && extra['0'] === '{' && extra['1'] === '"') {
    extra = { area: 'Main Area', floor: 'Main Area' };
  }
  const rawState = (t.order_state || 'AVAILABLE').toUpperCase();
  const now = Date.now();

  let status = 'AVAILABLE';
  let color = 'white';
  let kotStatus = extra.kot_status || 'NONE';
  let paymentStatus = extra.payment_status || 'UNPAID';
  let availableActions = [];
  let remainingSeconds = 0;
  const paymentCompletedAt = extra.payment_completed_at || extra.cleanedAt || null;
  const cleanupAfterSeconds = Number(extra.cleanup_after_seconds || 60);

  if (paymentCompletedAt && (rawState === 'PAYMENT_COMPLETED' || rawState === 'CLEANUP_RUNNING' || rawState === 'CLEANING' || rawState === 'PAID')) {
    const elapsedSec = Math.floor((now - paymentCompletedAt) / 1000);
    remainingSeconds = Math.max(0, cleanupAfterSeconds - elapsedSec);

    if (remainingSeconds <= 0) {
      status = 'AVAILABLE';
      color = 'white';
      kotStatus = 'NONE';
      paymentStatus = 'UNPAID';
      availableActions = [];
      remainingSeconds = 0;

      if (t.id && global.serverdbConnection && global.serverdbConnection.Table) {
        global.serverdbConnection.Table.update(
          {
            order_state: 'AVAILABLE',
            extra_details: {
              ...extra,
              payment_completed_at: null,
              cleanedAt: null,
              amount: 0,
              customer: 'Walk-in',
              waiter: null,
              kot_status: 'NONE',
              payment_status: 'UNPAID'
            }
          },
          { where: { id: t.id } }
        ).catch(err => console.warn('Error resetting table status in DB:', err.message));

        const cleanId = String(t.table_no || t.id).replace(/[^0-9]/g, '') || String(t.id);
        if (global.serverdbConnection.KOT) {
          global.serverdbConnection.KOT.update(
            { is_active: 0, status: 6 },
            {
              where: {
                is_active: 1,
                [global.serverdbConnection.Sequelize.Op.or]: [
                  { table_id: t.id },
                  { table_name: `Table ${cleanId}` },
                  { table_name: `T${cleanId}` },
                  { table_name: `T0${cleanId}` }
                ]
              }
            }
          ).catch(err => console.warn('Error deactivating KOTs on table reset:', err.message));
        }
      }
    } else {
      status = 'PAYMENT_COMPLETED';
      color = 'green';
      paymentStatus = 'PAID';
      kotStatus = extra.kot_status || 'CUT';
      availableActions = ['print_kot']; // View KOT is REMOVED!
    }
  } else if (rawState === 'RESERVED' || extra.status === 'Reserved' || String(extra.status || '').toLowerCase() === 'reserved') {
    status = 'Reserved';
    color = 'orange';
    kotStatus = 'NONE';
    paymentStatus = 'UNPAID';
    availableActions = [];
    remainingSeconds = 0;
  } else if (rawState === 'UNPAID_BILL' || rawState === 'UNPAID' || extra.status === 'UNPAID_BILL' || extra.color === 'blue' || extra.color === 'red') {
    status = 'UNPAID_BILL';
    color = 'blue';
    kotStatus = 'CUT';
    paymentStatus = 'UNPAID';
    availableActions = ['print_kot', 'view_kot'];
    remainingSeconds = 0;
  } else if (rawState === 'NC_BLOCKED' || rawState === 'NC' || extra.status === 'NC_BLOCKED' || extra.color === 'purple') {
    status = 'NC_BLOCKED';
    color = 'purple';
    kotStatus = 'CUT';
    paymentStatus = 'PAID';
    availableActions = ['view_kot'];
    remainingSeconds = 0;
  } else if (rawState === 'KOT_CUT' || rawState === 'RUNNING' || rawState === 'OCCUPIED' || rawState === 'ORDERED') {
    status = rawState === 'ORDERED' ? 'ORDERED' : 'KOT_CUT';
    color = 'yellow';
    kotStatus = 'CUT';
    paymentStatus = 'UNPAID';
    availableActions = ['print_kot', 'view_kot'];
    remainingSeconds = 0;
  } else {
    status = 'AVAILABLE';
    color = 'white';
    kotStatus = 'NONE';
    paymentStatus = 'UNPAID';
    availableActions = [];
    remainingSeconds = 0;
  }

  const prefix = extra.prefix || t.prefix || '';
  const digits = String(t.table_no || t.table_name || '').replace(/[^0-9]/g, '');
  const tableNoStr = digits || String(t.id);
  const cleanNum = parseInt(tableNoStr, 10) || tableNoStr;
  const displayName = (prefix && digits) ? `${prefix}${parseInt(digits, 10) || digits}` : (t.table_name || `Table ${tableNoStr}`);

  return {
    id: t.id,
    table_id: t.id,
    no: tableNoStr,
    table_name: displayName,
    prefix: prefix,
    seats: parseInt(t.max_person, 10) || 4,
    status: status,
    current_order_id: Number(extra.current_order_id || 0),
    payment_status: paymentStatus,
    kot_status: kotStatus,
    payment_completed_at: paymentCompletedAt,
    cleanup_after_seconds: cleanupAfterSeconds,
    remaining_seconds: remainingSeconds,
    color: color,
    available_actions: availableActions,
    floor: extra.area || extra.floor || 'Main Area',
    area: extra.area || extra.floor || 'Main Area',
    section: extra.section || 'Main Area',
    amount: status === 'AVAILABLE' ? 0 : Number(extra.amount || 0),
    waiter: status === 'AVAILABLE' ? null : (extra.waiter || null),
    customer: status === 'AVAILABLE' ? 'Walk-in' : (extra.customer || 'Walk-in'),
    store_id: t.store_id || 'STORE_1',
    isactive: t.isactive
  };
}

// Helper: extract floor and section from extra_details JSONB
function getExtra(t, key, fallback) {
  if (t[key]) return t[key];
  if (t.extra_details && t.extra_details[key]) return t.extra_details[key];
  return fallback;
}
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const userRole = String(req.user?.role || req.user?.type || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || req.user?.username === 'admin';
    const targetStoreId = (req.query.store_id && req.query.store_id.toLowerCase() !== 'all')
      ? req.query.store_id
      : (!isAdmin ? (req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0])) : null);

    let whereData = {};
    if (targetStoreId) {
      const qStore = targetStoreId;
      if (qStore === 'STORE_1' || qStore === '1') {
        whereData = {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { store_id: qStore },
            { store_id: 'STORE_1' },
            { store_id: '1' },
            { store_id: null }
          ]
        };
      } else {
        whereData = { store_id: qStore };
      }
    } else if (!req.query.store_id && !isAdmin) {
      const userStore = req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]);
      if (userStore) {
        if (userStore === 'STORE_1' || userStore === '1') {
          whereData = {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { store_id: userStore },
              { store_id: 'STORE_1' },
              { store_id: '1' },
              { store_id: null }
            ]
          };
        } else {
          whereData = { store_id: userStore };
        }
      }
    }

    const dbTables = await global.serverdbConnection.Table.findAll({
      where: whereData,
      order: [['id', 'ASC']],
      raw: true
    });
    const mapped = dbTables.map(mapTable);

    // Fetch active KOTs and KOT items to populate table.kots for UI
    try {
      const kotWhere = { is_active: 1 };
      if (targetStoreId) {
        kotWhere.store_id = targetStoreId;
      }
      const activeKots = await global.serverdbConnection.KOT.findAll({
        where: kotWhere,
        raw: true
      });

      if (activeKots && activeKots.length > 0) {
        const activeKotIds = activeKots.map(k => k.kot_id);
        const allKotItems = await global.serverdbConnection.KOTItem.findAll({
          where: { kot_id: activeKotIds },
          raw: true
        });

        mapped.forEach(tbl => {
          const cleanTblId = String(tbl.id || '').replace(/[^0-9]/g, '');
          const cleanTblNo = String(tbl.no || tbl.table_no || tbl.table_name || '').replace(/[^0-9]/g, '');
          const tblKots = activeKots.filter(k => {
            const cleanKotTableId = String(k.table_id || '').replace(/[^0-9]/g, '');
            // STRICT RULE: Only map KOTs to a table if the actual database ID matches!
            // Do NOT fall back to table_no or table_name, as this causes newly created 
            // tables to wrongly inherit ghost KOTs from deleted tables with the same number.
            return (cleanTblId && cleanKotTableId === cleanTblId);
          });

          if (tblKots.length === 0 && (
            tbl.status === 'KOT_CUT' || tbl.order_state === 'KOT_CUT' ||
            tbl.status === 'UNPAID_BILL' || tbl.order_state === 'UNPAID_BILL' ||
            tbl.status === 'UNPAID' || tbl.order_state === 'UNPAID'
          )) {
            tbl.status = 'AVAILABLE';
            tbl.color = 'white';
            tbl.amount = 0;
            tbl.kotCount = 0;
            tbl.available_actions = [];
          }

          tbl.kots = tblKots.map(k => {
            const items = (allKotItems || [])
              .filter(i => Number(i.kot_id) === Number(k.kot_id))
              .map(i => ({
                itemId: i.item_id,
                name: i.item_name || 'Item',
                itemName: i.item_name || 'Item',
                qty: Number(i.quantity || 1),
                quantity: Number(i.quantity || 1),
                unitPrice: Number(i.item_price || 0),
                price: Number(i.item_price || 0),
                total: Number(i.amount || (i.quantity * i.item_price) || 0)
              }));
            return {
              id: k.custom_bill_number || `KOT-${k.kot_id}`,
              kot_id: k.kot_id,
              status: k.status === 1 ? 'Sent to Kitchen' : 'Cut',
              numericKotId: k.kot_id,
              table_id: k.table_id,
              time: k.in_time || 'Now',
              waiter: k.waiter || 'Staff',
              amount: Number(k.amount || 0),
              items: items
            };
          });

          const ncKots = tblKots.filter(k => {
            try {
              const extra = typeof k.extra_details === 'string' ? JSON.parse(k.extra_details || '{}') : k.extra_details;
              return extra?.isNC || k.isNC || k.ncType;
            } catch (e) {
              return false;
            }
          });
          const normalKots = tblKots.filter(k => !ncKots.includes(k));

          tbl.kotCount = tbl.kots.length;
          
          const chargeableKots = tbl.kots.filter(k => {
            const matchKot = tblKots.find(tk => String(tk.kot_id) === String(k.numericKotId));
            return matchKot && !ncKots.includes(matchKot);
          });
          
          const kotsSum = chargeableKots.reduce((sum, k) => {
            const itemsSum = (k.items || []).reduce((is, it) => is + Number(it.total || 0), 0);
            return sum + (Number(k.amount || 0) || itemsSum);
          }, 0);

          if (tbl.kotCount > 0) {
            tbl.amount = kotsSum;
            if (normalKots.length > 0) {
              if (tbl.status === 'AVAILABLE' || tbl.status === 'BLANK' || tbl.status === 'NC_BLOCKED') {
                tbl.status = 'KOT_CUT';
                tbl.color = 'yellow';
                tbl.kot_status = 'CUT';
                tbl.available_actions = ['print_kot', 'view_kot'];
              }
            }
          }
        });
      }
    } catch (kotErr) {
      console.warn('Warning populating active KOTs for tables:', kotErr.message);
    }

    // Sort by numeric part of table_name so T1 < T2 < T10 < T11 (natural order)
    mapped.sort((a, b) => {
      const numA = parseInt(String(a.table_name || a.name || '').replace(/\D/g, '')) || 0;
      const numB = parseInt(String(b.table_name || b.name || '').replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.table_name || '').localeCompare(String(b.table_name || ''));
    });
    response.tables = mapped;
    response.data = mapped;
    response.setStatus(200);
  } catch (error) {
    console.error('❌ Error fetching tables:', error);
    response.setStatus(400);
    response.setMessage(error.message || 'Failed to fetch tables');
  }
  res.json(response);
});

// GET single table
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const table = await global.serverdbConnection.Table.findByPk(req.params.id, { raw: true });
    if (!table) {
      response.setStatus(404);
      response.setMessage('Table not found');
    } else {
      const mapped = mapTable(table);
      response.table = mapped;
      response.data = mapped;
      response.setStatus(200);
    }
  } catch (error) {
    response.setStatus(400);
    response.setMessage(error.message);
  }
  res.json(response);
});

// POST create table
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tableNum = req.body.no || req.body.table_no || req.body.table_number;
    const tableName = req.body.table_name || req.body.name || `Table ${tableNum || ''}`;
    let targetStoreId = req.body.store_id || req.query.store_id;
    if (!targetStoreId && (req.body.department || req.body.section) && global.serverdbConnection.Store) {
      const deptName = req.body.department || req.body.section;
      const storeMatch = await global.serverdbConnection.Store.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { store_name: deptName },
            { store_id: deptName }
          ]
        },
        raw: true
      });
      if (storeMatch) {
        targetStoreId = storeMatch.store_id || `STORE_${storeMatch.id}`;
      }
    }
    if (!targetStoreId) {
      targetStoreId = req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';
    }

    // 'department' DB column is INTEGER (FK). Store the readable name in extra_details.section
    const sectionName = req.body.section || req.body.department || 'Restaurant';
    const existing = await global.serverdbConnection.Table.findOne({
      where: {
        table_name: tableName,
        store_id: targetStoreId
      }
    });
    if (existing) {
      response.setStatus(409);
      response.setMessage(`Table '${tableName}' already exists in outlet '${targetStoreId}'`);
      return res.status(409).json(response);
    }

    const tableArea = req.body.area || req.body.floor || 'Main Area';
    const extraDetails = {
      area: tableArea,
      floor: tableArea,
      section: sectionName,
      amount: req.body.amount || 0,
      waiter: req.body.waiter || null,
      customer: req.body.customer || 'Walk-in',
      kot_status: 'NONE',
      payment_status: 'UNPAID',
      prefix: req.body.prefix || ''
    };

    const created = await global.serverdbConnection.Table.create({
      table_name: tableName,
      max_person: String(req.body.max_person || req.body.seats || 4),
      department: 1,           // Always integer — section name stored in extra_details
      store_id: targetStoreId,
      isactive: 1,
      order_state: 'AVAILABLE',
      extra_details: extraDetails
    });

    const mapped = mapTable(created.get({ plain: true }));
    response.setStatus(201);
    response.setMessage('Table created successfully');
    response.table = mapped;
    response.data = mapped;
  } catch (err) {
    console.error('Error creating table:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create table');
  }
  res.json(response);
});

// PUT /:id update table details or status
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    let table = await global.serverdbConnection.Table.findByPk(req.params.id);
    if (!table) {
      const cleanNum = String(req.params.id).replace(/[^0-9]/g, '');
      const paddedNo = cleanNum.padStart(2, '0');
      table = await global.serverdbConnection.Table.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_name: `Table ${cleanNum}` },
            { table_name: `Table ${paddedNo}` },
            { table_name: `T${cleanNum}` },
            { table_name: `T${paddedNo}` },
            { table_name: req.params.id }
          ]
        }
      });
    }
    if (!table) {
      response.setStatus(404);
      response.setMessage('Table not found');
      return res.json(response);
    }

    let currentExtra = {};
    if (typeof table.extra_details === 'string') {
      try { currentExtra = JSON.parse(table.extra_details || '{}'); } catch(e) {}
    } else {
      currentExtra = table.extra_details || {};
    }
    const reqArea = req.body.area || req.body.floor;
    const updatedExtra = {
      ...currentExtra,
      ...(reqArea && { area: reqArea, floor: reqArea }),
      ...(req.body.section && { section: req.body.section }),
      ...(req.body.department && { section: req.body.department }),
      ...(req.body.amount !== undefined && { amount: req.body.amount }),
      ...(req.body.waiter !== undefined && { waiter: req.body.waiter }),
      ...(req.body.customer !== undefined && { customer: req.body.customer }),
      ...(req.body.prefix !== undefined && { prefix: req.body.prefix })
    };

    const updateFields = {
      ...(req.body.table_name && { table_name: req.body.table_name }),
      ...(req.body.name && { table_name: req.body.name }),
      ...(req.body.seats && { max_person: String(req.body.seats) }),
      ...(req.body.max_person && { max_person: String(req.body.max_person) }),
      ...(req.body.status && { order_state: req.body.status }),
      // department stays as integer 1 — section name goes in extra_details
      extra_details: updatedExtra
    };

    await table.update(updateFields);
    const updated = mapTable(table.get({ plain: true }));
    response.setStatus(200);
    response.setMessage('Table updated successfully');
    response.table = updated;
    response.data = updated;
  } catch (err) {
    console.error('Error updating table:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update table');
  }
  res.json(response);
});

// PATCH status handler for both /:id and /:id/status routes
const patchStatusHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    let table = await global.serverdbConnection.Table.findByPk(req.params.id);
    if (!table) {
      const cleanNum = String(req.params.id).replace(/[^0-9]/g, '');
      const paddedNo = cleanNum.padStart(2, '0');
      table = await global.serverdbConnection.Table.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_name: `Table ${cleanNum}` },
            { table_name: `Table ${paddedNo}` },
            { table_name: `T${cleanNum}` },
            { table_name: `T${paddedNo}` },
            { table_name: req.params.id }
          ]
        }
      });
    }

    if (!table) {
      response.setStatus(404);
      response.setMessage('Table not found');
      return res.json(response);
    }

    const rawStatus = req.body.status || req.body.order_state || 'AVAILABLE';
    let status = 'AVAILABLE';
    const rawUpper = String(rawStatus).toUpperCase();
    if (['KOT_CUT', 'RUNNING', 'OCCUPIED', 'ORDERED', 'KOT GENERATED', 'KOT_GENERATED'].includes(rawUpper)) {
      status = rawUpper === 'ORDERED' ? 'ORDERED' : 'KOT_CUT';
    } else if (['UNPAID_BILL', 'UNPAID'].includes(rawUpper)) {
      status = 'UNPAID_BILL';
    } else if (['PAYMENT_COMPLETED', 'CLEANUP_RUNNING', 'PAID', 'CLEANING', 'BILL GENERATED'].includes(rawUpper)) {
      status = 'PAYMENT_COMPLETED';
    }

    let currentExtra = {};
    if (typeof table.extra_details === 'string') {
      try { currentExtra = JSON.parse(table.extra_details || '{}'); } catch(e) {}
    } else {
      currentExtra = table.extra_details || {};
    }
    const updatedExtra = {
      ...currentExtra,
      ...(req.body.amount !== undefined && { amount: req.body.amount }),
      ...(req.body.discount_amount !== undefined && { discount_amount: req.body.discount_amount }),
      ...(req.body.tax_amount !== undefined && { tax_amount: req.body.tax_amount }),
      ...(req.body.total_amount !== undefined && { total_amount: req.body.total_amount }),
      ...(req.body.taxes_breakdown !== undefined && { taxes_breakdown: req.body.taxes_breakdown }),
      ...(req.body.waiter !== undefined && { waiter: req.body.waiter }),
      ...(req.body.customer !== undefined && { customer: req.body.customer })
    };

    if (status === 'PAYMENT_COMPLETED') {
      updatedExtra.payment_completed_at = Date.now();
      updatedExtra.cleanup_after_seconds = 60;
      updatedExtra.payment_status = 'PAID';
    } else if (status === 'KOT_CUT' || status === 'ORDERED') {
      updatedExtra.kot_status = 'CUT';
      updatedExtra.payment_status = 'UNPAID';
    } else if (status === 'UNPAID_BILL') {
      updatedExtra.kot_status = 'CUT';
      updatedExtra.payment_status = 'UNPAID';
    } else if (status === 'AVAILABLE') {
      updatedExtra.payment_completed_at = null;
      updatedExtra.kot_status = 'NONE';
      updatedExtra.payment_status = 'UNPAID';
      updatedExtra.amount = 0;
      updatedExtra.waiter = null;
      updatedExtra.customer = 'Walk-in';
      delete updatedExtra.status;
      delete updatedExtra.color;
      delete updatedExtra.available_actions;

      const cleanId = String(table.table_no || table.id).replace(/[^0-9]/g, '') || String(table.id);
      if (global.serverdbConnection && global.serverdbConnection.KOT) {
        global.serverdbConnection.KOT.update(
          { is_active: 0, status: 6 },
          {
            where: {
              is_active: 1,
              [global.serverdbConnection.Sequelize.Op.or]: [
                { table_id: table.id },
                { table_name: `Table ${cleanId}` },
                { table_name: `T${cleanId}` },
                { table_name: `T0${cleanId}` }
              ]
            }
          }
        ).catch(err => console.warn('Error deactivating KOTs on table status patch:', err.message));
      }
    }

    await table.update({ order_state: status, extra_details: updatedExtra });
    const updated = mapTable(table.get({ plain: true }));
    response.setStatus(200);
    response.setMessage('Table status updated successfully');
    response.table = updated;
    response.data = updated;
  } catch (err) {
    console.error('Error updating table status:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update table status');
  }
  res.json(response);
};

router.patch('/:id/status', patchStatusHandler);
router.patch('/:id', patchStatusHandler);

// DELETE /:id or DELETE /
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tableId = req.params.id || req.query.tableId;
    await global.serverdbConnection.Table.destroy({ where: { id: tableId } });
    response.setStatus(200);
    response.setMessage('Table deleted successfully');
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete table');
  }
  res.json(response);
});

router.delete('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tableId = req.query.tableId;
    if (!tableId) {
      response.setStatus(400);
      response.setMessage('Please provide tableId');
      return res.json(response);
    }
    await global.serverdbConnection.Table.destroy({ where: { id: tableId } });
    response.setStatus(200);
    response.setMessage('Table deleted successfully');
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

module.exports = router;

