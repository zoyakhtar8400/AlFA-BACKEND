/* eslint-disable no-await-in-loop */
// Auto-generate Bill on KOT creation active
const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const { convertQuantity } = require('../util/unitConverter');
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


// GET all KOTs — supports ?active=1 (active only), ?active=0 (inactive only), ?active=all (all)
// Also supports filtering by table_id / tableId / table_no / tableNo
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { active, table_id, tableId, table_no, tableNo, store_id } = req.query || {};
    const tableIdParam = table_id || tableId || table_no || tableNo;
    const targetStoreId = store_id || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]);

    // Build where condition based on ?active param
    const whereCondition = {};
    if (targetStoreId) {
      whereCondition.store_id = targetStoreId;
    }
    if (active === '1' || active === 'true') {
      whereCondition.is_active = 1;
      whereCondition.status = { [global.serverdbConnection.Sequelize.Op.ne]: 6 };
    } else if (active === '0' || active === 'false') {
      whereCondition[global.serverdbConnection.Sequelize.Op.or] = [
        { is_active: 0 },
        { status: 6 }
      ];
    } else if (!active || active === 'all') {
      // No is_active filter — return everything
    } else {
      whereCondition.is_active = 1;
      whereCondition.status = { [global.serverdbConnection.Sequelize.Op.ne]: 6 };
    }

    if (tableIdParam) {
      const cleanId = String(tableIdParam).replace(/[^0-9]/g, '') || String(tableIdParam);
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

    const kotIds = kots.map(k => k.kot_id);
    const kotItems = kotIds.length > 0
      ? await global.serverdbConnection.KOTItem.findAll({
          where: { kot_id: { [global.serverdbConnection.Sequelize.Op.in]: kotIds } },
          raw: true
        })
      : [];

    const formatted = kots.map(k => {
      const items = kotItems.filter(ki => String(ki.kot_id) === String(k.kot_id));
      const kotDate = k.kot_date || k.createdAt || null;
      return {
        id: k.custom_bill_number || `KOT-${k.kot_id}`,
        kotId: k.kot_id,
        tableId: k.table_name || String(k.table_id || ''),
        table_id: k.table_id,
        is_active: k.is_active,
        status: k.is_active === 0 ? 'Closed' : mapStatusIntToString(k.status),
        time: k.in_time || (kotDate ? new Date(kotDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
        date: kotDate ? new Date(kotDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        customer_name: k.customer_name || 'Walk-in',
        customerName: k.customer_name || 'Walk-in',
        customer_mobile: k.customer_mobile || k.phone || '—',
        mobileNo: k.customer_mobile || k.phone || '—',
        customer: {
          name: k.customer_name || 'Walk-in',
          mobile: k.customer_mobile || k.phone || '—'
        },
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
            { custom_bill_number: idParam },
            ...(isNaN(Number(idParam)) ? [] : [{ kot_id: Number(idParam) }])
          ]
        },
        raw: true
      });
    } else {
      kot = await global.serverdbConnection.KOT.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { custom_bill_number: idParam },
            ...(isNaN(Number(idParam)) ? [] : [{ kot_id: Number(idParam) }])
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
    if (!Array.isArray(items) || items.length === 0) {
      response.setStatus(400);
      response.setMessage('KOT must contain at least 1 menu item');
      return res.status(400).json(response);
    }

    let totalAmount = 0;
    items.forEach(it => {
      totalAmount += (Number(it.qty || it.quantity || 1) * Number(it.unitPrice || it.price || it.rate || 0));
    });

    const targetTableId = Number(payload.tableId || payload.table_id || 1);
    const cleanTableNum = String(payload.tableNo || payload.tableId || payload.table_id || '').replace(/[^0-9]/g, '') || String(targetTableId);

    // Deactivate previous active KOTs if payload indicates new session or if table was AVAILABLE / Blank
    let isBlankOrNew = payload.isNewSession || payload.is_new_session || false;
    if (!isBlankOrNew && targetTableId) {
      try {
        let existingTable = await global.serverdbConnection.Table.findByPk(targetTableId);
        if (!existingTable) {
          existingTable = await global.serverdbConnection.Table.findOne({
            where: {
              [global.serverdbConnection.Sequelize.Op.or]: [
                { table_name: `Table ${cleanTableNum}` },
                { table_name: `T${cleanTableNum}` },
                { table_name: `T0${cleanTableNum}` }
              ]
            }
          });
        }
        if (existingTable) {
          const tState = String(existingTable.order_state || '').toUpperCase();
          if (['AVAILABLE', 'BLANK', 'PAYMENT_COMPLETED', 'PAID', 'CLEANING'].includes(tState)) {
            isBlankOrNew = true;
          }
        }
      } catch (e) {
        console.warn('Error checking table state before KOT create:', e.message);
      }
    }

    const targetStoreId = payload.store_id || req.body?.store_id || req.query?.store_id || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';

    if (isBlankOrNew) {
      console.log(`🧹 Deactivating old KOTs for table ${targetTableId} (Table ${cleanTableNum}) in outlet ${targetStoreId} for new session...`);
      await global.serverdbConnection.KOT.update(
        { is_active: 0, status: 6 },
        {
          where: {
            is_active: 1,
            store_id: targetStoreId,
            [global.serverdbConnection.Sequelize.Op.or]: [
              { table_id: targetTableId },
              { table_name: `Table ${cleanTableNum}` },
              { table_name: `T${cleanTableNum}` },
              { table_name: `T0${cleanTableNum}` }
            ]
          }
        }
      );
    }

    const kotData = {
      // mpos_kot model columns: kot_id, table_id, table_name, custom_bill_number, in_time, waiter, amount, is_active, store_id, status, kot_date, customer_name
      // NO kot_no or table_no columns exist in mpos_kot
      custom_bill_number: customBillNo,
      table_id: targetTableId,
      table_name: payload.tableNo ? `Table ${payload.tableNo}` : (payload.table_name || `Table ${targetTableId}`),
      customer_name: payload.customerName || payload.customer_name || 'Walk-in',
      customer_mobile: payload.mobileNo || payload.customer_phone || payload.mobile || '',
      store_id: targetStoreId,
      status: mapStatusStringToInt(payload.status || 'Sent to Kitchen'),
      in_time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kot_date: new Date(),
      waiter: payload.waiter || payload.waiter_name || 'Staff',
      amount: totalAmount,
      is_active: 1
    };
    let createdKot;
    
    // Perform Inventory Stock Validation and Deduction inside PostgreSQL Transaction
    await global.serverdbConnection.sequelize.transaction(async (t) => {
      // 1. Validate Stock for all KOT items first
      for (const item of items) {
        const itemId = Number(item.itemId || item.item_id || item.id || 1);
        const qty = Number(item.qty || item.quantity || 1);
        console.log(`🔎 [KOT Stock Check] Processing Item ID: ${itemId}, Qty: ${qty}`);
        let menuItem = await global.serverdbConnection.Item.findByPk(itemId, { transaction: t });
        if (!menuItem && item.itemName) {
          menuItem = await global.serverdbConnection.Item.findOne({
            where: { title: item.itemName },
            transaction: t
          });
        }

        if (menuItem) {
          if (menuItem.inventory_type === 'DIRECT' && menuItem.direct_inventory_item_id) {
            // Direct Finished Good Validation
            const invItem = await global.serverdbConnection.InventoryItem.findByPk(menuItem.direct_inventory_item_id, { transaction: t });
            if (invItem) {
              const currentStock = Number(invItem.current_stock || 0);
              if (currentStock < qty) {
                console.warn(`⚠️ [Low Stock Notice] ${invItem.item_name}. Available: ${currentStock} ${invItem.unit}, Required: ${qty} ${invItem.unit}`);
              }
            }
          } else {
            // Recipe-Based Validation
            const recipe = await global.serverdbConnection.RecipeMaster.findOne({
              where: { menu_item_id: itemId, is_active: 1 },
              include: [{
                model: global.serverdbConnection.RecipeItems,
                as: 'recipeItems',
                where: { is_active: 1 },
                required: false
              }],
              transaction: t
            });

            if (recipe && recipe.recipeItems && recipe.recipeItems.length > 0) {
              for (const recipeItem of recipe.recipeItems) {
                const rawReqQty = Number(recipeItem.quantity || 0) * qty;
                const invItem = await global.serverdbConnection.InventoryItem.findByPk(recipeItem.inventory_item_id, { transaction: t });
                if (invItem) {
                  const reqQtyInInvUnit = convertQuantity(rawReqQty, recipeItem.unit || 'g', invItem.unit || 'kg');
                  const currentStock = Number(invItem.current_stock || 0);
                  if (currentStock < reqQtyInInvUnit) {
                    console.warn(`⚠️ [Low Stock Notice] Recipe ${invItem.item_name}. Available: ${currentStock} ${invItem.unit || 'kg'}, Required: ${reqQtyInInvUnit} ${invItem.unit || 'kg'}`);
                  }
                }
              }
            }
          }
        }
      }

      for (const item of items) {
        const itemId = Number(item.itemId || item.item_id || item.id || 1);
        const qty = Number(item.qty || item.quantity || 1);
        let menuItem = await global.serverdbConnection.Item.findByPk(itemId, { transaction: t });
        if (!menuItem && item.itemName) {
          menuItem = await global.serverdbConnection.Item.findOne({
            where: { title: item.itemName },
            transaction: t
          });
        }

        if (menuItem) {
          if (menuItem.inventory_type === 'DIRECT' && menuItem.direct_inventory_item_id) {
            const invItem = await global.serverdbConnection.InventoryItem.findByPk(menuItem.direct_inventory_item_id, { transaction: t });
            if (invItem) {
              const newStock = Number(invItem.current_stock || 0) - qty;
              await invItem.update({ current_stock: newStock }, { transaction: t });
              await global.serverdbConnection.StockLedger.create({
                module: 'KOT',
                reference_no: customBillNo,
                inventory_item_id: invItem.inventory_item_id,
                qty_change: -qty,
                unit: invItem.unit || 'Pcs',
                closing_balance: newStock,
                notes: `KOT Direct Sale: ${menuItem.title || item.itemName} x${qty}`
              }, { transaction: t });
              console.log(`📉 [DIRECT Stock Deducted] ${invItem.item_name}: -${qty} ${invItem.unit}. New Stock: ${newStock}`);
            }
          } else {
            const recipe = await global.serverdbConnection.RecipeMaster.findOne({
              where: { menu_item_id: menuItem.item_id, is_active: 1 },
              include: [{
                model: global.serverdbConnection.RecipeItems,
                as: 'recipeItems',
                where: { is_active: 1 },
                required: false
              }],
              transaction: t
            });

            if (recipe && recipe.recipeItems && recipe.recipeItems.length > 0) {
              for (const recipeItem of recipe.recipeItems) {
                const rawReqQty = Number(recipeItem.quantity || 0) * qty;
                const invItem = await global.serverdbConnection.InventoryItem.findByPk(recipeItem.inventory_item_id, { transaction: t });
                if (invItem) {
                  const reqQtyInInvUnit = convertQuantity(rawReqQty, recipeItem.unit || 'g', invItem.unit || 'kg');
                  const newStock = Number(invItem.current_stock || 0) - reqQtyInInvUnit;
                  await invItem.update({ current_stock: newStock }, { transaction: t });
                  await global.serverdbConnection.StockLedger.create({
                    module: 'KOT',
                    reference_no: customBillNo,
                    inventory_item_id: invItem.inventory_item_id,
                    qty_change: -reqQtyInInvUnit,
                    unit: invItem.unit || 'kg',
                    closing_balance: newStock,
                    notes: `KOT Recipe Consumption: ${menuItem.title || item.itemName} x${qty} (-${reqQtyInInvUnit} ${invItem.unit || 'kg'})`
                  }, { transaction: t });
                  console.log(`📉 [RECIPE Stock Deducted] ${invItem.item_name}: -${reqQtyInInvUnit} ${invItem.unit}. New Stock: ${newStock}`);
                }
              }
            }
          }
        }
      }

      // 3. Create KOT and KOT items
      createdKot = await global.serverdbConnection.KOT.create(kotData, { transaction: t });
      
      if (items.length > 0) {
        for (const item of items) {
          const qty = Number(item.qty || item.quantity || 1);
          const price = Number(item.unitPrice || item.price || item.rate || 0);
          await global.serverdbConnection.KOTItem.create({
            kot_id: createdKot.kot_id,
            item_id: Number(item.itemId || item.item_id || item.id || 1),
            item_name: item.itemName || item.name || 'Item',
            alternative_title: item.variantName || item.variant || '',
            quantity: qty,
            item_price: price,
            amount: qty * price,
            store_id: 'STORE_1'
          }, { transaction: t });
        }
      }
    });

    // Update table status to KOT_CUT in PostgreSQL
    if (payload.tableId || payload.table_id || payload.tableNo) {
      const cleanNum = String(payload.tableNo || payload.tableId || payload.table_id || '').replace(/[^0-9]/g, '');
      const numId = Number(cleanNum) || 1;
      const paddedNo = String(numId).padStart(2, '0');

      let table = await global.serverdbConnection.Table.findByPk(numId);
      if (!table) {
        table = await global.serverdbConnection.Table.findOne({
          where: {
            [global.serverdbConnection.Sequelize.Op.or]: [
              { id: numId },
              { table_name: `Table ${numId}` },
              { table_name: `Table ${paddedNo}` },
              { table_name: `T${numId}` },
              { table_name: `T${paddedNo}` }
            ]
          }
        });
      }
      if (table) {
        const extra = table.extra_details || {};
        await table.update({
          order_state: 'KOT_CUT',
          extra_details: {
            ...extra,
            status: 'Running',
            kot_status: 'CUT',
            payment_status: 'UNPAID',
            amount: totalAmount || extra.amount || 0,
            available_actions: ['print_kot', 'view_kot'],
            customer: payload.customerName || extra.customer || 'Walk-in'
          }
        });
        console.log(`✅ Backend KOT.js automatically updated Table ${table.table_name || table.id} to KOT_CUT (Yellow) in PostgreSQL DB`);
      }
    }

    // Automatically generate or update Bill record in PostgreSQL when KOT is cut
    try {
      const targetTableId = Number(payload.tableId || payload.table_id || 1);

      const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.qty || item.quantity || 1) * Number(item.unitPrice || item.price || item.rate || 0)), 0);
      const subtotal = itemsSubtotal || totalAmount || 0;
      const taxAmount = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + taxAmount;

      let existingBill = await global.serverdbConnection.Bill.findOne({
        where: {
          table_id: targetTableId,
          order_state: 'pending'
        },
        order: [['id', 'DESC']]
      });

      const resolvedCustName = payload.customerName || payload.customer_name || 'Walk-in';
      const rawMobile = payload.mobileNo || payload.customer_phone || payload.mobile || '';
      const resolvedMobile = (rawMobile && rawMobile !== '—') ? rawMobile : '';

      let createdBill;
      if (existingBill) {
        const newSubtotal = Number(existingBill.subtotal || 0) + subtotal;
        const newTax = Number(existingBill.total_tax || 0) + taxAmount;
        const newTotal = newSubtotal + newTax;

        const updateData = {
          subtotal: newSubtotal,
          total_tax: newTax,
          total_amount: newTotal,
          order_total: newTotal
        };
        if (resolvedCustName && resolvedCustName !== 'Walk-in') {
          updateData.cust_name = resolvedCustName;
        }
        if (resolvedMobile) {
          updateData.phone = resolvedMobile;
        }
        await existingBill.update(updateData);
        createdBill = existingBill;
      } else {
        const existingBillCount = await global.serverdbConnection.Bill.count();
        const seqNum = existingBillCount + 1;

        createdBill = await global.serverdbConnection.Bill.create({
          table_id: targetTableId,
          table_name: payload.tableNo ? `Table ${payload.tableNo}` : (payload.table_name || `Table ${targetTableId}`),
          store_id: payload.store_id || 'STORE_1',
          subtotal: subtotal,
          total_tax: taxAmount,
          total_amount: grandTotal,
          order_total: grandTotal,
          order_state: 'pending',
          payment_status: 'Unpaid',
          cust_name: resolvedCustName,
          phone: resolvedMobile || '—',
          waiter: payload.waiter || payload.waiter_name || 'Staff',
          order_type: payload.order_type || payload.billType || 'DINE_IN',
          custom_bill_number: `Bill ${seqNum}`,
          order_number: seqNum,
          bill_date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      if (items.length > 0) {
        for (const item of items) {
          const qty = Number(item.qty || item.quantity || 1);
          const price = Number(item.unitPrice || item.price || item.rate || 0);
          await global.serverdbConnection.BillItem.create({
            bill_id: createdBill.id,
            orderMasterId: String(createdBill.id),
            item_id: Number(item.itemId || item.item_id || item.id || 1),
            title: item.itemName || item.name || 'Item',
            alternative_title: item.variantName || item.variant || '',
            quantity: qty,
            price: price,
            total: qty * price,
            store_id: 'STORE_1'
          });
        }
      }
      console.log(`✅ Automatically generated Bill #${createdBill.id} (${createdBill.custom_bill_number}) in PostgreSQL when KOT #${createdKot.kot_id} was cut.`);
    } catch (billErr) {
      console.warn('Auto bill generation notice:', billErr.message);
    }

    const result = {
      id: createdKot.custom_bill_number || `KOT-${createdKot.kot_id}`,
      kotId: createdKot.kot_id,
      kot_id: createdKot.kot_id,
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
  res.status(response.status || 200).json(response);
};

router.post('/', createKotHandler);
router.post('/save', createKotHandler);

// POST /close-table/:tableId — Mark ALL active KOTs for a table as closed (is_active=0)
// Called after payment to prevent old KOT items from appearing in future billing sessions
router.post('/close-table/:tableId', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tableIdParam = req.params.tableId;
    const cleanId = String(tableIdParam).replace(/[^0-9]/g, '') || String(tableIdParam);

    const [updatedCount] = await global.serverdbConnection.KOT.update(
      { is_active: 0, status: 6 }, // 6 = Served/Closed
      {
        where: {
          is_active: 1,
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_id: Number(cleanId) || 0 },
            { table_name: `Table ${cleanId}` },
            { table_name: `T${cleanId}` },
            { table_name: `T0${cleanId}` }
          ]
        }
      }
    );

    response.setStatus(200);
    response.setMessage(`Closed ${updatedCount} KOT(s) for table ${tableIdParam}`);
    response.data = { tableId: tableIdParam, closedCount: updatedCount };
    console.log(`✅ Closed ${updatedCount} KOT(s) for table ${tableIdParam} after payment`);
  } catch (err) {
    console.error('Error closing KOTs for table:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to close KOTs for table');
  }
  res.json(response);
});


// POST /:id/move — Move KOT to another table, updating both tables in PostgreSQL
router.post('/:id/move', async (req, res) => {
  const response = new ResponseMessage(200, '');
  let t;
  try {
    const kotIdParam = req.params.id;
    const { toTableId, toTableNo, fromTableId } = req.body;

    if (!toTableId && !toTableNo) {
      response.setStatus(400);
      response.setMessage('Please provide toTableId or toTableNo');
      return res.json(response);
    }

    t = await global.serverdbConnection.sequelize.transaction();

    const numericKotId = Number(String(kotIdParam).replace(/[^0-9]/g, ''));

    // Find the KOT record
    let kot = await global.serverdbConnection.KOT.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { custom_bill_number: kotIdParam },
          ...(isNaN(Number(kotIdParam)) ? [] : [{ kot_id: Number(kotIdParam) }]),
          ...(!isNaN(numericKotId) && numericKotId > 0 ? [{ kot_id: numericKotId }] : [])
        ]
      },
      transaction: t
    });

    if (!kot) {
      await t.rollback();
      response.setStatus(404);
      response.setMessage('KOT not found');
      return res.json(response);
    }

    if (kot.is_active === 0 || kot.status === 'Cancelled') {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('Cannot move a cancelled KOT');
      return res.json(response);
    }

    if (kot.status === 'Paid' || kot.status === 'Settled') {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('Cannot move a settled or paid KOT');
      return res.json(response);
    }

    const sourceTableId = fromTableId ? Number(fromTableId) : kot.table_id;
    const sourceTableName = kot.table_name;

    // Resolve destination table
    let destTable = null;
    if (toTableId) {
      destTable = await global.serverdbConnection.Table.findByPk(toTableId, { transaction: t });
    }
    if (!destTable && toTableNo) {
      const cleanNo = String(toTableNo).replace(/[^0-9]/g, '');
      destTable = await global.serverdbConnection.Table.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_name: `Table ${cleanNo}` },
            { table_name: `T${cleanNo}` }
          ]
        },
        transaction: t
      });
    }

    if (!destTable) {
      await t.rollback();
      response.setStatus(404);
      response.setMessage('Destination table not found');
      return res.json(response);
    }

    if (sourceTableId && Number(sourceTableId) === Number(destTable.id)) {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('Source and destination tables cannot be the same');
      return res.json(response);
    }

    const destTableNo = String(destTable.table_name || destTable.id).replace(/[^0-9]/g, '') || String(destTable.id);

    // Update KOT record to new table
    await kot.update({
      table_id: destTable.id,
      table_name: destTable.table_name || `Table ${destTableNo}`
    }, { transaction: t });

    // Recalculate total active amount for destination table
    const destActiveKots = await global.serverdbConnection.KOT.findAll({
      where: { table_id: destTable.id, is_active: 1 },
      transaction: t
    });
    const destTotalAmount = destActiveKots.reduce((sum, k) => sum + Number(k.amount || 0), 0);

    const destExtra = destTable.extra_details || {};
    await destTable.update({
      order_state: 'KOT_CUT',
      extra_details: {
        ...destExtra,
        kot_status: 'CUT',
        payment_status: 'UNPAID',
        amount: destTotalAmount
      }
    }, { transaction: t });

    // Check source table remaining KOTs and update state & amount
    if (sourceTableId) {
      const srcTable = await global.serverdbConnection.Table.findByPk(sourceTableId, { transaction: t });
      if (srcTable) {
        const remainingKots = await global.serverdbConnection.KOT.findAll({
          where: { table_id: sourceTableId, is_active: 1 },
          transaction: t
        });

        const srcExtra = srcTable.extra_details || {};
        if (remainingKots.length === 0) {
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
          }, { transaction: t });
        } else {
          const srcTotalAmount = remainingKots.reduce((sum, k) => sum + Number(k.amount || 0), 0);
          await srcTable.update({
            order_state: 'KOT_CUT',
            extra_details: {
              ...srcExtra,
              kot_status: 'CUT',
              amount: srcTotalAmount
            }
          }, { transaction: t });
        }
      }
    }

    await t.commit();

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
    if (t && !t.finished) {
      await t.rollback().catch(() => {});
    }
    console.error('Error moving KOT:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to move KOT');
  }
  res.json(response);
});


// POST /move-table — Transfer all active KOTs from one table to another in PostgreSQL
router.post('/move-table', async (req, res) => {
  const response = new ResponseMessage(200, '');
  let t;
  try {
    const { fromTableId, toTableId, toTableNo } = req.body;

    if (!fromTableId) {
      response.setStatus(400);
      response.setMessage('Please provide fromTableId');
      return res.json(response);
    }
    if (!toTableId && !toTableNo) {
      response.setStatus(400);
      response.setMessage('Please provide toTableId or toTableNo');
      return res.json(response);
    }

    t = await global.serverdbConnection.sequelize.transaction();

    const srcTable = await global.serverdbConnection.Table.findByPk(fromTableId, { transaction: t });
    if (!srcTable) {
      await t.rollback();
      response.setStatus(404);
      response.setMessage('Source table not found');
      return res.json(response);
    }

    let destTable = null;
    if (toTableId) {
      destTable = await global.serverdbConnection.Table.findByPk(toTableId, { transaction: t });
    }
    if (!destTable && toTableNo) {
      const cleanNo = String(toTableNo).replace(/[^0-9]/g, '');
      destTable = await global.serverdbConnection.Table.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { table_name: `Table ${cleanNo}` },
            { table_name: `T${cleanNo}` }
          ]
        },
        transaction: t
      });
    }

    if (!destTable) {
      await t.rollback();
      response.setStatus(404);
      response.setMessage('Destination table not found');
      return res.json(response);
    }

    if (Number(srcTable.id) === Number(destTable.id)) {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('Source and destination tables cannot be the same');
      return res.json(response);
    }

    const srcNumStr = String(srcTable.table_no || srcTable.table_name || srcTable.id).replace(/[^0-9]/g, '');
    const rawKots = await global.serverdbConnection.KOT.findAll({
      where: {
        is_active: 1,
        [global.serverdbConnection.Sequelize.Op.or]: [
          { table_id: srcTable.id },
          { table_name: srcTable.table_name },
          ...(srcNumStr ? [{ table_name: `Table ${srcNumStr}` }, { table_name: `T${srcNumStr}` }] : [])
        ]
      },
      transaction: t
    });

    // Only move active, unbilled KOTs — protect billed/settled/cancelled KOTs
    const activeKots = (rawKots || []).filter(k =>
      k.is_active === 1 &&
      k.status !== 'Paid' && k.status !== 'Settled' && k.status !== 'Cancelled' &&
      Number(k.status) !== 5 && Number(k.status) !== 6
    );

    if (!activeKots || activeKots.length === 0) {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('No active unbilled KOTs on source table');
      return res.json(response);
    }

    const destTableNo = String(destTable.table_name || destTable.id).replace(/[^0-9]/g, '') || String(destTable.id);

    // Update all active KOTs to point to destination table
    for (const kot of activeKots) {
      await kot.update({
        table_id: destTable.id,
        table_name: destTable.table_name || `Table ${destTableNo}`
      }, { transaction: t });
    }

    // Update Source Table -> AVAILABLE
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
    }, { transaction: t });

    // Calculate total amount for destination table
    const allDestKots = await global.serverdbConnection.KOT.findAll({
      where: { table_id: destTable.id, is_active: 1 },
      transaction: t
    });
    const destTotalAmount = allDestKots.reduce((sum, k) => sum + Number(k.amount || 0), 0);

    const destExtra = destTable.extra_details || {};
    await destTable.update({
      order_state: 'KOT_CUT',
      extra_details: {
        ...destExtra,
        kot_status: 'CUT',
        payment_status: 'UNPAID',
        amount: destTotalAmount,
        waiter: destExtra.waiter || srcExtra.waiter || null
      }
    }, { transaction: t });

    await t.commit();

    response.setStatus(200);
    response.setMessage(`Moved Table ${srcTable.table_name} complete order to ${destTable.table_name} successfully`);
    response.data = {
      fromTableId: srcTable.id,
      toTableId: destTable.id,
      movedKotCount: activeKots.length
    };
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback().catch(() => {});
    }
    console.error('Error moving table order:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to move table order');
  }
  res.json(response);
});


// POST /move-items — Transfer specific items / quantities from source table to destination table in PostgreSQL
router.post('/move-items', async (req, res) => {
  const response = new ResponseMessage(200, '');
  let t;
  try {
    const { fromTableId, toTableId, items } = req.body;

    if (!fromTableId || !toTableId) {
      response.setStatus(400);
      response.setMessage('Please provide fromTableId and toTableId');
      return res.json(response);
    }

    if (Number(fromTableId) === Number(toTableId)) {
      response.setStatus(400);
      response.setMessage('Source and destination tables cannot be the same');
      return res.json(response);
    }

    t = await global.serverdbConnection.sequelize.transaction();

    const srcTable = await global.serverdbConnection.Table.findByPk(fromTableId, { transaction: t });
    const destTable = await global.serverdbConnection.Table.findByPk(toTableId, { transaction: t });

    if (!srcTable || !destTable) {
      await t.rollback();
      response.setStatus(404);
      response.setMessage('Source or destination table not found');
      return res.json(response);
    }

    // Get active KOTs on source table
    const srcKots = await global.serverdbConnection.KOT.findAll({
      where: { table_id: srcTable.id, is_active: 1 },
      transaction: t
    });

    if (!srcKots || srcKots.length === 0) {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('No active KOTs on source table');
      return res.json(response);
    }

    const srcKotIds = srcKots.map(k => k.kot_id);
    const srcKotItems = await global.serverdbConnection.KOTItem.findAll({
      where: { kot_id: srcKotIds, status: 1 },
      transaction: t
    });

    if (!srcKotItems || srcKotItems.length === 0) {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('No active items found on source table');
      return res.json(response);
    }

    // Parse requested move items payload: object { [nameOrId]: moveQty } or array of { item_id, item_name, name, qty, quantity, lineId }
    let transferList = [];
    if (Array.isArray(items)) {
      transferList = items.map(i => ({
        idOrName: i.kot_item_id || i.itemId || i.item_id || i.itemName || i.item_name || i.name || i.lineId,
        moveQty: Number(i.quantity || i.qty || 0)
      })).filter(i => i.moveQty > 0);
    } else if (typeof items === 'object' && items !== null) {
      transferList = Object.keys(items).map(key => ({
        idOrName: key,
        moveQty: Number(items[key] || 0)
      })).filter(i => i.moveQty > 0);
    }

    if (transferList.length === 0) {
      await t.rollback();
      response.setStatus(400);
      response.setMessage('No valid item quantities specified to move');
      return res.json(response);
    }

    // Find or create destination active KOT
    let destKot = await global.serverdbConnection.KOT.findOne({
      where: { table_id: destTable.id, is_active: 1 },
      transaction: t
    });

    if (!destKot) {
      const destTableNo = String(destTable.table_name || destTable.id).replace(/[^0-9]/g, '') || String(destTable.id);
      destKot = await global.serverdbConnection.KOT.create({
        in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 1,
        table_id: destTable.id,
        table_name: destTable.table_name || `Table ${destTableNo}`,
        amount: 0,
        is_active: 1,
        kot_date: new Date(),
        createdDate: new Date(),
        custom_bill_number: `KOT-${Math.floor(1000 + Math.random() * 9000)}`
      }, { transaction: t });
    }

    // Process item transfers
    for (const reqIt of transferList) {
      const targetName = String(reqIt.idOrName).toLowerCase().trim();
      const targetNum = Number(reqIt.idOrName);

      const matchingKotItem = srcKotItems.find(k => {
        const nameMatch = k.item_name && k.item_name.toLowerCase().trim() === targetName;
        const idMatch = !isNaN(targetNum) && targetNum > 0 && (Number(k.id) === targetNum || Number(k.item_id) === targetNum);
        return nameMatch || idMatch;
      });

      if (!matchingKotItem) {
        await t.rollback();
        response.setStatus(404);
        response.setMessage(`Item '${reqIt.idOrName}' not found on source table`);
        return res.json(response);
      }

      const availableQty = Number(matchingKotItem.quantity || 0);
      if (reqIt.moveQty > availableQty) {
        await t.rollback();
        response.setStatus(400);
        response.setMessage(`Requested quantity (${reqIt.moveQty}) exceeds available quantity (${availableQty}) for '${matchingKotItem.item_name}'`);
        return res.json(response);
      }

      const unitPrice = Number(matchingKotItem.item_price || 0);
      const remainingQty = availableQty - reqIt.moveQty;

      // Update source KOTItem
      if (remainingQty === 0) {
        await matchingKotItem.update({ quantity: 0, amount: 0, status: 3 }, { transaction: t });
      } else {
        await matchingKotItem.update({ quantity: remainingQty, amount: remainingQty * unitPrice }, { transaction: t });
      }

      // Add to destination KOT
      const existingDestKotItem = await global.serverdbConnection.KOTItem.findOne({
        where: { kot_id: destKot.kot_id, item_id: matchingKotItem.item_id, status: 1 },
        transaction: t
      });

      if (existingDestKotItem) {
        const nextQty = Number(existingDestKotItem.quantity || 0) + reqIt.moveQty;
        await existingDestKotItem.update({
          quantity: nextQty,
          amount: nextQty * unitPrice
        }, { transaction: t });
      } else {
        await global.serverdbConnection.KOTItem.create({
          kot_id: destKot.kot_id,
          item_id: matchingKotItem.item_id,
          item_name: matchingKotItem.item_name,
          item_price: unitPrice,
          quantity: reqIt.moveQty,
          amount: reqIt.moveQty * unitPrice,
          status: 1
        }, { transaction: t });
      }
    }

    // Recalculate source KOT amounts and deactivate empty KOTs
    for (const srcKot of srcKots) {
      const activeItems = await global.serverdbConnection.KOTItem.findAll({
        where: { kot_id: srcKot.kot_id, status: 1 },
        transaction: t
      });
      const validItems = activeItems.filter(i => Number(i.quantity || 0) > 0);
      const kotTotal = validItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);

      if (validItems.length === 0 || kotTotal <= 0) {
        await srcKot.update({ amount: 0, is_active: 0, status: 6 }, { transaction: t });
      } else {
        await srcKot.update({ amount: kotTotal }, { transaction: t });
      }
    }

    // Recalculate destination KOT amount
    const destItems = await global.serverdbConnection.KOTItem.findAll({
      where: { kot_id: destKot.kot_id, status: 1 },
      transaction: t
    });
    const destKotTotal = destItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    await destKot.update({ amount: destKotTotal, is_active: 1 }, { transaction: t });

    // Update Source Table state & amount
    const remainingSrcKots = await global.serverdbConnection.KOT.findAll({
      where: { table_id: srcTable.id, is_active: 1 },
      transaction: t
    });
    const srcExtra = srcTable.extra_details || {};
    if (remainingSrcKots.length === 0) {
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
      }, { transaction: t });
    } else {
      const srcTotalAmount = remainingSrcKots.reduce((sum, k) => sum + Number(k.amount || 0), 0);
      await srcTable.update({
        order_state: 'KOT_CUT',
        extra_details: {
          ...srcExtra,
          kot_status: 'CUT',
          amount: srcTotalAmount
        }
      }, { transaction: t });
    }

    // Update Destination Table state & amount
    const allDestKots = await global.serverdbConnection.KOT.findAll({
      where: { table_id: destTable.id, is_active: 1 },
      transaction: t
    });
    const destTotalAmount = allDestKots.reduce((sum, k) => sum + Number(k.amount || 0), 0);
    const destExtra = destTable.extra_details || {};

    await destTable.update({
      order_state: 'KOT_CUT',
      extra_details: {
        ...destExtra,
        kot_status: 'CUT',
        payment_status: 'UNPAID',
        amount: destTotalAmount
      }
    }, { transaction: t });

    await t.commit();

    response.setStatus(200);
    response.setMessage(`Transferred items from ${srcTable.table_name} to ${destTable.table_name} successfully`);
    response.data = {
      fromTableId: srcTable.id,
      toTableId: destTable.id
    };
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback().catch(() => {});
    }
    console.error('Error moving items:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to move items');
  }
  res.json(response);
});


/**
 * Snapshot-Based & Idempotent Stock Reversal Helper for KOT Cancellation / Voiding
 * Reads exact original deduction rows from StockLedger for the given KOT reference number
 * and restores inventory current_stock atomically.
 */
async function reverseKotStockIfDeducted(kot, transaction) {
  const Op = global.serverdbConnection.Sequelize.Op;
  const refNumbers = [
    kot.custom_bill_number,
    kot.kot_no,
    `KOT-${kot.kot_id}`,
    String(kot.kot_id)
  ].filter(Boolean);

  // 1. Authoritative idempotency check: check if a KOT_CANCEL entry already exists in StockLedger
  const existingCancel = await global.serverdbConnection.StockLedger.findOne({
    where: {
      module: 'KOT_CANCEL',
      reference_no: { [Op.in]: refNumbers }
    },
    transaction
  });

  if (existingCancel) {
    console.log(`⚠️ [Idempotent KOT Cancel] Stock reversal already recorded in StockLedger for KOT #${kot.kot_id} (${kot.custom_bill_number}). Skipping duplicate restoration.`);
    return { alreadyReversed: true, restoredItemsCount: 0 };
  }

  // 2. Query original deduction entries recorded when this KOT was created
  const originalDeductions = await global.serverdbConnection.StockLedger.findAll({
    where: {
      module: 'KOT',
      reference_no: { [Op.in]: refNumbers }
    },
    transaction
  });

  if (!originalDeductions || originalDeductions.length === 0) {
    console.log(`ℹ️ No original KOT stock deduction entries found in StockLedger for KOT #${kot.kot_id}.`);
    return { alreadyReversed: false, restoredItemsCount: 0 };
  }

  // 3. Restore exact snapshot quantities recorded at creation time
  let restoredCount = 0;
  for (const ledgerRow of originalDeductions) {
    const invItemId = ledgerRow.inventory_item_id;
    const deductedQty = Math.abs(Number(ledgerRow.qty_change || 0));

    if (invItemId && deductedQty > 0) {
      const invItem = await global.serverdbConnection.InventoryItem.findByPk(invItemId, { transaction });
      if (invItem) {
        const currentStockNum = Number(invItem.current_stock || 0);
        const newRestoredStock = currentStockNum + deductedQty;

        await invItem.update({ current_stock: newRestoredStock }, { transaction });

        await global.serverdbConnection.StockLedger.create({
          module: 'KOT_CANCEL',
          reference_no: ledgerRow.reference_no || kot.custom_bill_number || `KOT-${kot.kot_id}`,
          inventory_item_id: invItemId,
          qty_change: deductedQty,
          unit: ledgerRow.unit || invItem.unit || 'g',
          closing_balance: newRestoredStock,
          notes: `KOT Cancelled snapshot stock reversal: +${deductedQty} ${ledgerRow.unit || invItem.unit}`
        }, { transaction });

        restoredCount++;
        console.log(`↺ [SNAPSHOT STOCK RESTORED] ${invItem.item_name}: +${deductedQty} ${ledgerRow.unit || invItem.unit}. New Stock: ${newRestoredStock}`);
      }
    }
  }

  return { alreadyReversed: false, restoredItemsCount: restoredCount };
}

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

    let reversalResult = { alreadyReversed: false, restoredItemsCount: 0 };

    if (statusInt === 5 || String(nextStatus).toLowerCase().includes('cancel')) {
      await global.serverdbConnection.sequelize.transaction(async (t) => {
        reversalResult = await reverseKotStockIfDeducted(kot, t);
        await kot.update({ status: 5 }, { transaction: t });
      });
    } else {
      await kot.update({ status: statusInt });
    }

    response.setStatus(200);
    response.setMessage(
      reversalResult.alreadyReversed
        ? `KOT status updated to Cancelled (Stock was already reversed)`
        : `KOT updated to ${mapStatusIntToString(statusInt)}${reversalResult.restoredItemsCount > 0 ? ` with ${reversalResult.restoredItemsCount} stock items restored` : ''}`
    );
    response.data = {
      id: idParam,
      status: mapStatusIntToString(statusInt),
      alreadyReversed: reversalResult.alreadyReversed,
      restoredItemsCount: reversalResult.restoredItemsCount
    };
  } catch (err) {
    console.error('Error updating KOT status:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update KOT status');
  }
  res.json(response);
};

router.patch('/:id/status', updateStatusHandler);
router.put('/:id', updateStatusHandler);
router.post('/:id/status', updateStatusHandler);
router.post('/:id/cancel', (req, res, next) => {
  req.body.status = 'Cancelled';
  return updateStatusHandler(req, res, next);
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const idParam = req.params.id;
    let kot = await global.serverdbConnection.KOT.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
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

    let reversalResult = { alreadyReversed: false, restoredItemsCount: 0 };
    await global.serverdbConnection.sequelize.transaction(async (t) => {
      reversalResult = await reverseKotStockIfDeducted(kot, t);
      await kot.update({ is_active: 0, status: 5 }, { transaction: t });
    });

    response.setStatus(200);
    response.setMessage(
      reversalResult.alreadyReversed
        ? `KOT ${idParam} deleted (Stock was already reversed)`
        : `KOT ${idParam} deleted and ${reversalResult.restoredItemsCount} stock items restored successfully`
    );
    response.data = { id: idParam, alreadyReversed: reversalResult.alreadyReversed, restoredItemsCount: reversalResult.restoredItemsCount };
  } catch (err) {
    console.error('Error deleting KOT:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete KOT');
  }
  res.json(response);
});

module.exports = router;


