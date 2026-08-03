/* eslint-disable no-await-in-loop */
const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();

// Map status string to integer code or vice versa
function mapStatusIntToString(statusInt) {
  if (statusInt === 2) return 'Preparing';
  if (statusInt === 3) return 'Ready';
  if (statusInt === 4) return 'Served';
  if (statusInt === 5) return 'Cancelled';
  if (statusInt === 6) return 'Closed';
  return 'Sent to Kitchen';
}

function mapStatusStringToInt(statusStr) {
  if (!statusStr) return 1;
  const lower = String(statusStr).toLowerCase();
  if (lower.includes('prep') || lower.includes('cook')) return 2;
  if (lower.includes('ready')) return 3;
  if (lower.includes('serv')) return 4;
  if (lower.includes('cancel')) return 5;
  if (lower.includes('close')) return 6;
  return 1;
}

// GET all KOTs (or filtered by table_id)
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tableIdParam = req.query && (req.query.table_id || req.query.tableId || req.query.table_no || req.query.tableNo);
    const whereCondition = { is_active: 1 };
    if (tableIdParam) {
      const cleanId = String(tableIdParam).replace(/[^0-9]/g, '') || String(tableIdParam);
      // mpos_kot has NO table_no column — only table_id (int) and table_name (string)
      whereCondition[global.serverdbConnection.Sequelize.Op.or] = [
        { table_id: Number(cleanId) || 0 },
        { table_name: `Table ${cleanId}` },
        { table_name: `T${cleanId}` },
        { table_name: `T0${cleanId}` }
      ];
    }
    const kots = await global.serverdbConnection.KOT.findAll({
      where: whereCondition,
      order: [['kot_id', 'DESC']],
      raw: true
    });
    // Load KOT items filtered by the found KOT IDs (not all rows)
    const kotIds = kots.map(k => k.kot_id);
    const kotItems = kotIds.length > 0
      ? await global.serverdbConnection.KOTItem.findAll({
          where: { kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kotIds } },
          raw: true
        })
      : [];
    
    const formatted = kots.map(k => {
      const items = kotItems.filter(ki => String(ki.kot_id) === String(k.kot_id));
      return {
        id: k.custom_bill_number || `KOT-${k.kot_id}`,
        kotId: k.kot_id,
        // mpos_kot has no table_no — use table_name or table_id
        tableId: k.table_name || String(k.table_id || ''),
        status: mapStatusIntToString(k.status),
        time: k.in_time || new Date(k.kot_date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waiter: k.waiter || 'Staff',
        items: items.map(i => ({
          itemId: i.item_id,
          itemName: i.item_name || 'Item',
          variantName: i.alternative_title || '',
          qty: Number(i.quantity || 1),
          unitPrice: Number(i.item_price || 0),
          total: Number(i.amount || (i.quantity * i.item_price) || 0)
        }))
      };
    });

    response.data = formatted;
    response.kots = formatted;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching KOTs:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch KOTs');
  }
  res.json(response);
});

// GET single KOT by ID
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const idParam = req.params.id;
    let kot = null;
    if (String(idParam).startsWith('KOT-')) {
      const numericId = idParam.replace('KOT-', '');
      kot = await global.serverdbConnection.KOT.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { kot_id: numericId },
            { kot_no: idParam },
            { custom_bill_number: idParam }
          ]
        },
        raw: true
      });
    } else {
      kot = await global.serverdbConnection.KOT.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { kot_id: idParam },
            { kot_no: idParam },
            { custom_bill_number: idParam }
          ]
        },
        raw: true
      }) || await global.serverdbConnection.KOT.findByPk(idParam, { raw: true });
    }

    if (!kot) {
      response.setStatus(404);
      response.setMessage('KOT not found');
      return res.json(response);
    }

    const items = await global.serverdbConnection.KOTItem.findAll({
      where: { kot_id: kot.kot_id },
      raw: true
    });

    const mappedItems = items.map((i, idx) => ({
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

    const subtotal = mappedItems.reduce((acc, curr) => acc + curr.total, 0);
    const cleanTableNo = String(kot.table_no || kot.table_id || '').replace(/[^0-9]/g, '') || String(kot.table_id || '1');

    const formatted = {
      kotId: kot.custom_bill_number || kot.kot_no || `KOT-${kot.kot_id}`,
      numericKotId: kot.kot_id,
      tableId: kot.table_id || cleanTableNo,
      tableNo: cleanTableNo,
      tableName: kot.table_name || `Table ${cleanTableNo}`,
      customer: {
        name: kot.customer_name || 'Walk-in',
        mobile: kot.mobile_number || kot.phone || '—'
      },
      customer_name: kot.customer_name || 'Walk-in',
      mobile_number: kot.mobile_number || kot.phone || '—',
      remark: kot.remarks || kot.notes || '',
      remarks: kot.remarks || kot.notes || '',
      status: mapStatusIntToString(kot.status),
      paymentStatus: 'UNPAID',
      createdAt: kot.in_time || new Date(kot.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waiter: kot.waiter || kot.waiter_name || 'Staff',
      items: mappedItems,
      subtotal: subtotal,
      tax: 0,
      discount: 0,
      grandTotal: subtotal
    };

    response.data = formatted;
    response.kot = formatted;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST / and POST /save (Create KOT)
const createKotHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const payload = req.body;
    const timeNo = Date.now().toString().slice(-4);
    const randNo = Math.floor(1000 + Math.random() * 9000);
    const generatedNo = `KOT-${timeNo}-${randNo}`;
    const kotNo = payload.kotNo || payload.id || payload.kot_no || generatedNo;
    const customBillNo = `${kotNo}-${Math.floor(10 + Math.random() * 90)}`;
    const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.rows) ? payload.rows : []);

    let totalAmount = 0;
    items.forEach(it => {
      totalAmount += (Number(it.qty || it.quantity || 1) * Number(it.unitPrice || it.price || it.rate || 0));
    });

    const kotData = {
      // mpos_kot model columns: kot_id, table_id, table_name, custom_bill_number, in_time, waiter, amount, is_active, store_id, status, kot_date, customer_name
      // NO kot_no or table_no columns exist in mpos_kot
      custom_bill_number: customBillNo,
      table_id: Number(payload.tableId || payload.table_id || 1),
      table_name: payload.tableNo ? `Table ${payload.tableNo}` : (payload.table_name || `Table ${payload.tableId || 1}`),
      customer_name: payload.customerName || payload.customer_name || 'Walk-in',
      store_id: payload.store_id || 'STORE_1',
      status: mapStatusStringToInt(payload.status || 'Sent to Kitchen'),
      in_time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kot_date: new Date(),
      waiter: payload.waiter || payload.waiter_name || 'Staff',
      amount: totalAmount,
      is_active: 1
    };
    const createdKot = await global.serverdbConnection.KOT.create(kotData);
    
    if (items.length > 0) {
      for (const item of items) {
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.unitPrice || item.price || item.rate || 0);
        await global.serverdbConnection.KOTItem.create({
          kot_id: createdKot.kot_id,
          item_id: Number(item.itemId || item.id || 1),
          item_name: item.itemName || item.name || 'Item',
          alternative_title: item.variantName || item.variant || '',
          quantity: qty,
          item_price: price,
          amount: qty * price,
          store_id: 'STORE_1'
        });
      }
    }

    // Update table status to KOT_CUT in PostgreSQL
    if (payload.tableId || payload.table_id) {
      const targetTableId = payload.tableId || payload.table_id;
      let table = await global.serverdbConnection.Table.findByPk(targetTableId);
      if (!table) {
        table = await global.serverdbConnection.Table.findOne({
          where: {
            // mpos_table has NO table_no column — only table_name
            table_name: `Table ${targetTableId}`
          }
        });
      }
      if (table) {
        const extra = table.extra_details || {};
        await table.update({
          order_state: 'KOT_CUT',
          extra_details: {
            ...extra,
            kot_status: 'CUT',
            payment_status: 'UNPAID',
            amount: totalAmount || extra.amount || 0,
            waiter: payload.waiter || extra.waiter || 'Staff',
            customer: payload.customerName || extra.customer || 'Walk-in'
          }
        });
      }
    }

    const result = {
      id: createdKot.custom_bill_number || `KOT-${createdKot.kot_id}`,
      kotId: createdKot.kot_id,
      tableId: createdKot.table_name || String(createdKot.table_id),
      status: mapStatusIntToString(createdKot.status),
      time: createdKot.in_time,
      items: items
    };

    response.setStatus(201);
    response.setMessage('KOT generated successfully');
    response.data = result;
    response.kot = result;
  } catch (err) {
    console.error('Error creating KOT:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create KOT');
  }
  res.json(response);
};

router.post('/', createKotHandler);
router.post('/save', createKotHandler);

// POST /:id/move — Move KOT to another table, updating both tables in PostgreSQL
router.post('/:id/move', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const kotIdParam = req.params.id;
    const { toTableId, toTableNo } = req.body;

    if (!toTableId && !toTableNo) {
      response.setStatus(400);
      response.setMessage('Please provide toTableId or toTableNo');
      return res.json(response);
    }

    // Find the KOT record
    let kot = await global.serverdbConnection.KOT.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { custom_bill_number: kotIdParam },
          ...(isNaN(Number(kotIdParam)) ? [] : [{ kot_id: Number(kotIdParam) }])
        ]
      }
    });

    if (!kot) {
      response.setStatus(404);
      response.setMessage('KOT not found');
      return res.json(response);
    }

    const sourceTableId = kot.table_id;
    const sourceTableName = kot.table_name;

    // Resolve destination table
    let destTable = null;
    if (toTableId) {
      destTable = await global.serverdbConnection.Table.findByPk(toTableId);
    }
    if (!destTable && toTableNo) {
      const cleanNo = String(toTableNo).replace(/[^0-9]/g, '');
      destTable = await global.serverdbConnection.Table.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_name: `Table ${cleanNo}` },
            { table_name: `T${cleanNo}` }
          ]
        }
      });
    }

    if (!destTable) {
      response.setStatus(404);
      response.setMessage('Destination table not found');
      return res.json(response);
    }

    const destTableNo = String(destTable.table_name || destTable.id).replace(/[^0-9]/g, '') || String(destTable.id);

    // Update KOT record to new table
    await kot.update({
      table_id: destTable.id,
      table_name: destTable.table_name || `Table ${destTableNo}`
    });

    // Update destination table → KOT_CUT (active)
    const destExtra = destTable.extra_details || {};
    await destTable.update({
      order_state: 'KOT_CUT',
      extra_details: {
        ...destExtra,
        kot_status: 'CUT',
        payment_status: 'UNPAID',
        amount: destExtra.amount || 0
      }
    });

    // Check if source table has any remaining active KOTs (after move, this KOT now belongs to dest)
    if (sourceTableId) {
      const remainingKots = await global.serverdbConnection.KOT.count({
        where: {
          table_id: sourceTableId,
          is_active: 1
        }
      });

      if (remainingKots === 0) {
        const srcTable = await global.serverdbConnection.Table.findByPk(sourceTableId);
        if (srcTable) {
          const srcExtra = srcTable.extra_details || {};
          await srcTable.update({
            order_state: 'AVAILABLE',
            extra_details: {
              ...srcExtra,
              kot_status: 'NONE',
              payment_status: 'UNPAID',
              amount: 0,
              customer: 'Walk-in',
              waiter: null
            }
          });
        }
      }
    }

    response.setStatus(200);
    response.setMessage(`KOT moved from ${sourceTableName} to ${destTable.table_name} successfully`);
    response.data = {
      kotId: kot.kot_id,
      fromTableId: sourceTableId,
      fromTableName: sourceTableName,
      toTableId: destTable.id,
      toTableName: destTable.table_name
    };
  } catch (err) {
    console.error('Error moving KOT:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to move KOT');
  }
  res.json(response);
});

// PATCH /:id/status & PUT /:id (Update Status)
const updateStatusHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const idParam = req.params.id;
    const nextStatus = req.body.status || req.body.nextStatus;
    const statusInt = mapStatusStringToInt(nextStatus);

    let kot = await global.serverdbConnection.KOT.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { kot_no: idParam },
          { custom_bill_number: idParam },
          ...(isNaN(Number(idParam)) ? [] : [{ kot_id: Number(idParam) }])
        ]
      }
    });

    if (!kot) {
      response.setStatus(404);
      response.setMessage('KOT not found');
      return res.json(response);
    }

    await kot.update({ status: statusInt });
    response.setStatus(200);
    response.setMessage(`KOT updated to ${mapStatusIntToString(statusInt)}`);
    response.data = { id: idParam, status: mapStatusIntToString(statusInt) };
  } catch (err) {
    console.error('Error updating KOT status:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update KOT status');
  }
  res.json(response);
};

router.patch('/:id/status', updateStatusHandler);
router.put('/:id', updateStatusHandler);

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const idParam = req.params.id;
    await global.serverdbConnection.KOT.update(
      { is_active: 0 },
      {
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { kot_no: idParam },
            { custom_bill_number: idParam },
            ...(isNaN(Number(idParam)) ? [] : [{ kot_id: Number(idParam) }])
          ]
        }
      }
    );
    response.setStatus(200);
    response.setMessage(`KOT ${idParam} deleted successfully`);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

module.exports = router;

