const express = require('express');
const { KOT, Bill } = require('../js/database');
const { changeTableforkot } = require('../main_controllers/Order');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;

const router = express.Router();

// Helper to map DB record to frontend friendly format
function mapTable(t) {
  const extra = t.extra_details || {};
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
  } else if (rawState === 'KOT_CUT' || rawState === 'RUNNING' || rawState === 'OCCUPIED' || rawState === 'ORDERED') {
    status = rawState === 'ORDERED' ? 'ORDERED' : 'KOT_CUT';
    color = 'orange';
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

  const tableNoStr = String(t.table_no || t.table_name || t.id).replace(/[^0-9]/g, '') || String(t.id);

  return {
    id: t.id,
    table_id: t.id,
    no: tableNoStr,
    table_name: t.table_name || `Table ${tableNoStr}`,
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
    floor: extra.floor || 'Ground',
    section: extra.section || 'Main Area',
    amount: status === 'AVAILABLE' ? 0 : Number(extra.amount || 0),
    waiter: status === 'AVAILABLE' ? null : (extra.waiter || null),
    customer: status === 'AVAILABLE' ? 'Walk-in' : (extra.customer || 'Walk-in'),
    store_id: t.store_id || 'STORE_1',
    isactive: t.isactive
  };
}

// GET all tables
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const whereData = req.query.store_id ? { store_id: req.query.store_id } : {};
    const dbTables = await global.serverdbConnection.Table.findAll({
      where: whereData,
      order: [['id', 'ASC']],
      raw: true
    });
    const mapped = dbTables.map(mapTable);
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
    const extraDetails = {
      floor: req.body.floor || 'Ground',
      section: req.body.section || 'Main Area',
      amount: req.body.amount || 0,
      waiter: req.body.waiter || null,
      customer: req.body.customer || 'Walk-in',
      kot_status: 'NONE',
      payment_status: 'UNPAID'
    };

    const created = await global.serverdbConnection.Table.create({
      table_name: tableName,
      max_person: String(req.body.max_person || req.body.seats || 4),
      department: req.body.department || 1,
      store_id: req.body.store_id || 'STORE_1',
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
    const table = await global.serverdbConnection.Table.findByPk(req.params.id);
    if (!table) {
      response.setStatus(404);
      response.setMessage('Table not found');
      return res.json(response);
    }

    const currentExtra = table.extra_details || {};
    const updatedExtra = {
      ...currentExtra,
      ...(req.body.floor && { floor: req.body.floor }),
      ...(req.body.section && { section: req.body.section }),
      ...(req.body.amount !== undefined && { amount: req.body.amount }),
      ...(req.body.waiter !== undefined && { waiter: req.body.waiter }),
      ...(req.body.customer !== undefined && { customer: req.body.customer })
    };

    const updateFields = {
      ...(req.body.table_name && { table_name: req.body.table_name }),
      ...(req.body.seats && { max_person: String(req.body.seats) }),
      ...(req.body.max_person && { max_person: String(req.body.max_person) }),
      ...(req.body.status && { order_state: req.body.status }),
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
      table = await global.serverdbConnection.Table.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_no: String(req.params.id) },
            { table_name: `Table ${req.params.id}` }
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
    } else if (['PAYMENT_COMPLETED', 'CLEANUP_RUNNING', 'PAID', 'CLEANING', 'BILL GENERATED'].includes(rawUpper)) {
      status = 'PAYMENT_COMPLETED';
    }

    const currentExtra = table.extra_details || {};
    const updatedExtra = {
      ...currentExtra,
      ...(req.body.amount !== undefined && { amount: req.body.amount }),
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
    } else if (status === 'AVAILABLE') {
      updatedExtra.payment_completed_at = null;
      updatedExtra.kot_status = 'NONE';
      updatedExtra.payment_status = 'UNPAID';
      updatedExtra.amount = 0;
      updatedExtra.waiter = null;
      updatedExtra.customer = 'Walk-in';

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

