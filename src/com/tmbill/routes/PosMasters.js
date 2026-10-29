const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();


const getWaitersHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const where = {};
    if (req.query.store_id && req.query.store_id !== 'All') {
      where.store_id = req.query.store_id;
    }
    const waiters = await global.serverdbConnection.Waiter.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true,
    });
    const mapped = waiters.map(w => ({
      id: w.id,
      name: w.name || `Steward ${w.id}`,
      phone: w.phone || '',
      area: w.area || '',
      store_id: w.store_id || 'STORE_1',
      active: 'Yes',
      status: 'Active'
    }));
    response.data = mapped;
    response.waiters = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching waiters:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch stewards');
  }
  res.json(response);
};

router.get('/menu/waiters', getWaitersHandler);
router.get('/waiters', getWaitersHandler);
router.get('/stewards', getWaitersHandler);

router.post('/menu/waiters', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, name, waiter_name, phone, area, store_id } = req.body;
    const stewardName = name || waiter_name || 'Steward';
    const targetStoreId = store_id || 'STORE_1';

    let waiter;
    if (id && Number(id) > 0) {
      waiter = await global.serverdbConnection.Waiter.findByPk(id);
      if (waiter) {
        await waiter.update({
          name: stewardName,
          phone: phone !== undefined ? phone : waiter.phone,
          area: area !== undefined ? area : (waiter.area || ''),
          store_id: targetStoreId
        });
      }
    } else {
      waiter = await global.serverdbConnection.Waiter.create({
        name: stewardName,
        username: `steward_${Date.now().toString().slice(-6)}`,
        phone: phone || '',
        area: area || '',
        store_id: targetStoreId
      });
    }
    response.data = waiter;
    response.setMessage('Steward saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving steward:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save steward');
  }
  res.json(response);
});

router.delete('/menu/waiters/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const waiter = await global.serverdbConnection.Waiter.findByPk(req.params.id);
    if (waiter) {
      await waiter.destroy();
    }
    response.setMessage('Steward deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 2. DELIVERY PARTNER / BOY MASTER CRUD
// ==========================================
router.get('/delivery-boys', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const where = {};
    if (req.query.store_id && req.query.store_id !== 'All') {
      where.store_id = req.query.store_id;
    }
    const boys = await global.serverdbConnection.DeliveryBoy.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true
    });
    const mapped = boys.map(d => ({
      id: d.id,
      partner: d.username || d.partner || 'Direct Delivery',
      name: d.name || `Delivery Boy ${d.id}`,
      phone: d.phone || '',
      area: d.area || '',
      store_id: d.store_id || 'STORE_1',
      status: 'Active'
    }));
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching delivery boys:', err);
    response.data = [];
    response.setStatus(200);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/delivery-boys', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, partner, name, phone, area, store_id } = req.body;
    const targetStoreId = store_id || 'STORE_1';
    let delBoy;
    if (id && Number(id) > 0) {
      delBoy = await global.serverdbConnection.DeliveryBoy.findByPk(id);
      if (delBoy) {
        await delBoy.update({
          username: partner || delBoy.username,
          name: name || delBoy.name,
          phone: phone !== undefined ? phone : delBoy.phone,
          area: area !== undefined ? area : (delBoy.area || ''),
          store_id: targetStoreId
        });
      }
    } else {
      delBoy = await global.serverdbConnection.DeliveryBoy.create({
        username: partner || 'Direct Delivery',
        name: name || 'Delivery Staff',
        phone: phone || '',
        area: area || '',
        store_id: targetStoreId
      });
    }
    response.data = delBoy;
    response.setMessage('Delivery partner saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving delivery boy:', err);
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.delete('/delivery-boys/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const delBoy = await global.serverdbConnection.DeliveryBoy.findByPk(req.params.id);
    if (delBoy) {
      await delBoy.destroy();
    }
    response.setMessage('Delivery partner deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 3. TAX CATEGORY MASTER CRUD
// ==========================================
router.get('/taxes', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const taxes = await global.serverdbConnection.Tax.findAll({
      where: { is_active: 1 },
      raw: true
    });
    const mapped = taxes.map(t => ({
      id: t.tax_id || t.id,
      name: t.tax_name || t.name,
      percentage: Number(t.tax_percentage || t.percentage || 5),
      cgst: Number(t.cgst || (t.tax_percentage ? t.tax_percentage / 2 : 2.5)),
      sgst: Number(t.sgst || (t.tax_percentage ? t.tax_percentage / 2 : 2.5)),
      status: t.is_active === 1 ? 'Active' : 'Inactive',
      extra_details: t.extra_details
    }));
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/taxes', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, name, tax_name, percentage, tax_percentage, taxes_json } = req.body;
    const taxVal = Number(percentage !== undefined ? percentage : (tax_percentage || 5));
    const tName = name || tax_name || 'GST 5%';
    let extraDetails = {};
    if (taxes_json) {
      try {
        extraDetails.taxes = typeof taxes_json === 'string' ? JSON.parse(taxes_json) : taxes_json;
      } catch (e) { }
    }

    let tax;
    if (id && Number(id) > 0) {
      tax = await global.serverdbConnection.Tax.findByPk(id);
      if (tax) {
        let currentExtra = tax.extra_details;
        if (typeof currentExtra === 'string') {
          try { currentExtra = JSON.parse(currentExtra); } catch (e) { currentExtra = {}; }
        }
        await tax.update({
          tax_name: tName,
          tax_display_name: tName,
          tax_percentage: taxVal,
          is_active: 1,
          extra_details: { ...(currentExtra || {}), ...extraDetails }
        });
      }
    }
    if (!tax) {
      tax = await global.serverdbConnection.Tax.create({
        tax_name: tName,
        tax_display_name: tName,
        tax_percentage: taxVal,
        is_active: 1,
        store_id: 'STORE_1',
        extra_details: extraDetails
      });
    }
    response.data = tax;
    response.setMessage('Tax category saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving tax category:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save tax category');
  }
  res.json(response);
});

router.delete('/taxes/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const tax = await global.serverdbConnection.Tax.findByPk(req.params.id);
    if (tax) {
      await tax.update({ is_active: 0 });
    }
    response.setMessage('Tax category deactivated successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 4. ITEM RATE CATEGORIES CRUD
// ==========================================
router.get('/rate-categories', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const categories = await global.serverdbConnection.MultipricingSettings.findAll({
      raw: true
    });
    const mapped = categories.map(c => ({
      id: c.multipricing_id || c.id,
      name: c.multipricing_name || c.name || 'AC Rate',
      code: c.multipricing_code || c.code || 'AC',
      status: c.is_active === 1 ? 'Active' : 'Inactive'
    }));
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/rate-categories', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, name, code, status } = req.body;
    let item;
    if (id) {
      item = await global.serverdbConnection.MultipricingSettings.findByPk(id);
      if (item) {
        await item.update({
          multipricing_name: name || item.multipricing_name,
          multipricing_code: code || item.multipricing_code,
          is_active: status === 'Inactive' ? 0 : 1
        });
      }
    } else {
      item = await global.serverdbConnection.MultipricingSettings.create({
        multipricing_name: name || 'Rate Category',
        multipricing_code: code || 'RATE',
        is_active: status === 'Inactive' ? 0 : 1,
        store_id: 'STORE_1'
      });
    }
    response.data = item;
    response.setMessage('Rate category saved successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.delete('/rate-categories/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const item = await global.serverdbConnection.MultipricingSettings.findByPk(req.params.id);
    if (item) {
      await item.update({ is_active: 0 });
    }
    response.setMessage('Rate category deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 5. NC TYPE MASTER CRUD
// ==========================================
router.get('/nc-types', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { Op } = require('sequelize');
    const andConditions = [
      {
        [Op.or]: [
          { is_active: 1 },
          { is_active: null }
        ]
      }
    ];

    let reqStoreId = req.query.store_id;
    if (reqStoreId && reqStoreId !== 'All') {
      // Resolve store from Store table if name / string was passed
      try {
        const storeMatch = await global.serverdbConnection.Store.findOne({
          where: {
            [Op.or]: [
              { store_id: reqStoreId },
              { id: isNaN(Number(reqStoreId)) ? -1 : Number(reqStoreId) },
              { store_name: reqStoreId },
              { name: reqStoreId }
            ]
          },
          raw: true
        });
        if (storeMatch) {
          reqStoreId = storeMatch.store_id || `STORE_${storeMatch.id}`;
        }
      } catch (e) { }

      const cleanNum = String(reqStoreId).replace(/\D/g, '') || '1';
      const storeVariants = [reqStoreId, cleanNum, `STORE_${cleanNum}`, `store_${cleanNum}`].filter(Boolean);
      if (reqStoreId === 'STORE_1' || cleanNum === '1' || String(reqStoreId).toLowerCase().includes('main')) {
        andConditions.push({
          [Op.or]: [
            ...storeVariants.map(v => ({ store_id: v })),
            { store_id: null },
            { store_id: '' }
          ]
        });
      } else {
        andConditions.push({
          [Op.or]: storeVariants.map(v => ({ store_id: v }))
        });
      }
    }

    const ncTypes = await global.serverdbConnection.NCType.findAll({
      where: {
        [Op.and]: andConditions
      },
      order: [['id', 'DESC']],
      raw: true
    });

    console.log(`[PosMasters] GET /nc-types store_id=${req.query.store_id} resolved=${reqStoreId} returned ${ncTypes?.length || 0} rows`);

    const mapped = (ncTypes || []).map(nc => ({
      id: nc.id,
      code: nc.code || `NC${nc.id}`,
      name: nc.name,
      store_id: nc.store_id || 'STORE_1',
      status: nc.status || 'Active'
    }));
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching NC types:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch NC types');
  }
  res.json(response);
});

router.post('/nc-types', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, code, name, status, store_id } = req.body;
    const ncName = name || 'NC Type';
    const targetStoreId = store_id || 'STORE_1';
    let nc;
    if (id && Number(id) > 0) {
      nc = await global.serverdbConnection.NCType.findByPk(id);
      if (nc) {
        await nc.update({
          code: code || nc.code,
          name: ncName,
          status: status || nc.status,
          store_id: targetStoreId,
          is_active: 1
        });
      }
    }
    if (!nc) {
      nc = await global.serverdbConnection.NCType.create({
        code: code || `NC${Math.floor(Date.now() / 1000)}`,
        name: ncName,
        status: status || 'Active',
        is_active: 1,
        store_id: targetStoreId
      });
    }
    response.data = nc;
    response.setMessage('NC Type saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving NC type:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save NC type');
  }
  res.json(response);
});

router.delete('/nc-types/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const nc = await global.serverdbConnection.NCType.findByPk(req.params.id);
    if (nc) {
      await nc.destroy();
    }
    response.setMessage('NC Type deleted successfully');
    response.setStatus(200);
  } catch (err) {
    console.error('Error deleting NC type:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete NC type');
  }
  res.json(response);
});

// ==========================================
// 6. STORES / OUTLET MASTER CRUD
// ==========================================
router.get('/stores', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    let allowedStoreIds = null;
    const isUserAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPERADMIN' || req.user?.type === 'ADMIN' || req.user?.type === 'SUPERADMIN';
    if (!isUserAdmin && req.user?.assigned_outlets) {
      allowedStoreIds = req.user.assigned_outlets.map(out => {
        if (typeof out === 'string' && out.startsWith('STORE_')) {
          return parseInt(out.replace('STORE_', ''), 10);
        }
        return Number(out);
      }).filter(n => !isNaN(n));
    }

    const queryOptions = {
      order: [['id', 'ASC']],
      raw: true
    };
    if (allowedStoreIds) {
      queryOptions.where = {
        id: {
          [global.serverdbConnection.Sequelize.Op.in]: allowedStoreIds
        }
      };
    }

    const stores = await global.serverdbConnection.Store.findAll(queryOptions);
    const mapped = (stores || []).map(s => ({
      ...s,
      id: s.id,
      store_id: s.store_id || `STORE_${s.id}`,
      store_name: s.store_name || `Outlet ${s.id}`,
      name: s.store_name || `Outlet ${s.id}`
    }));
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/stores', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const {
      id, store_id, store_name, name, address, phone, gstin,
      shortName, companyTitle, outletTitle, customerInfo, autoSettlement,
      focusOn, kot, kotPrint, roomService, noOfKOT, noOfBills, hsnSac,
      general, billHeader1, billHeader2, billHeader3, billSlogan1, billSlogan2, billSlogan3, status
    } = req.body || {};

    const newStoreName = (store_name || name || '').trim();
    const cleanShortName = (shortName || '').trim();
    const cleanGstin = (gstin || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanHsnSac = (hsnSac || '').trim();

    if (!newStoreName) {
      throw new Error('Outlet Name is mandatory.');
    }
    if (!cleanShortName) {
      throw new Error('Short Name is mandatory.');
    }
    if (!cleanGstin) {
      throw new Error('GST No / GSTIN is mandatory.');
    }
    if (!cleanPhone) {
      throw new Error('Phone No is mandatory.');
    }
    if (!cleanHsnSac) {
      throw new Error('HSN No is mandatory.');
    }

    const targetId = id || store_id;
    const isInactive = status === 'Inactive';

    const settingsObj = {
      shortName: cleanShortName,
      companyTitle: companyTitle || '',
      outletTitle: outletTitle || '',
      customerInfo: customerInfo || 'Optional',
      autoSettlement: autoSettlement || 'No',
      focusOn: focusOn || 'BOTH',
      kot: kot || 'Print & Save',
      kotPrint: kotPrint || 'Immediate',
      roomService: roomService || 'Disabled',
      noOfKOT: String(noOfKOT || '1'),
      noOfBills: String(noOfBills || '1'),
      hsnSac: cleanHsnSac,
      gstin: cleanGstin,
      general: general || '',
      billHeader1: billHeader1 || address || '',
      billHeader2: billHeader2 || '',
      billHeader3: billHeader3 || '',
      billSlogan1: billSlogan1 || '',
      billSlogan2: billSlogan2 || '',
      billSlogan3: billSlogan3 || ''
    };

    let store = null;
    if (targetId) {
      store = await global.serverdbConnection.Store.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { id: Number(targetId) || 0 },
            { store_id: String(targetId) }
          ]
        }
      });
    }

    if (store) {
      const existingSettings = typeof store.settings === 'object' && store.settings ? store.settings : {};
      const mergedSettings = { ...existingSettings, ...settingsObj };
      if (req.body.numbering) mergedSettings.numbering = req.body.numbering;
      if (req.body.generalConfig) mergedSettings.generalConfig = req.body.generalConfig;

      await store.update({
        store_name: newStoreName,
        store_phone: phone || store.store_phone,
        user_phone: phone || store.user_phone,
        user_line_1: billHeader1 || address || store.user_line_1,
        user_line_2: billHeader2 || store.user_line_2,
        user_sub_locality: billHeader3 || store.user_sub_locality,
        footer_note: billSlogan1 || store.footer_note,
        disable_ordering: isInactive ? 1 : 0,
        settings: mergedSettings
      });
    } else {
      const baseSettings = { ...settingsObj };
      if (req.body.numbering) baseSettings.numbering = req.body.numbering;
      if (req.body.generalConfig) baseSettings.generalConfig = req.body.generalConfig;

      store = await global.serverdbConnection.Store.create({
        store_name: newStoreName,
        store_phone: phone || '',
        user_phone: phone || '',
        user_line_1: billHeader1 || address || '',
        user_line_2: billHeader2 || '',
        user_sub_locality: billHeader3 || '',
        footer_note: billSlogan1 || '',
        disable_ordering: isInactive ? 1 : 0,
        settings: baseSettings
      });
      const generatedStoreId = `STORE_${store.id}`;
      await store.update({ store_id: generatedStoreId });
    }

    const plainStore = store.get({ plain: true });
    response.data = {
      ...plainStore,
      id: store.id,
      store_id: store.store_id || `STORE_${store.id}`,
      store_name: store.store_name,
      name: store.store_name,
      phone: store.store_phone || store.user_phone || '',
      settings: store.settings
    };
    response.setMessage('Outlet saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/stores/:id/config', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetId = req.params.id;
    const { numbering, general, generalConfig, settings } = req.body || {};
    const store = await global.serverdbConnection.Store.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { id: Number(targetId) || 0 },
          { store_id: String(targetId) }
        ]
      }
    });
    if (!store) {
      response.setStatus(404);
      response.setMessage(`Outlet ID '${targetId}' not found in database.`);
      return res.status(404).json(response);
    }
    const existingSettings = typeof store.settings === 'object' && store.settings ? store.settings : {};
    const mergedSettings = { ...existingSettings };
    if (numbering) mergedSettings.numbering = numbering;
    if (general || generalConfig) mergedSettings.generalConfig = general || generalConfig;
    if (settings && typeof settings === 'object') Object.assign(mergedSettings, settings);

    await store.update({ settings: mergedSettings });

    response.data = {
      ...store.get({ plain: true }),
      settings: mergedSettings
    };
    response.setMessage('Outlet configuration persisted successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.delete('/stores/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetId = req.params.id;
    if (Number(targetId) === 1) {
      response.setStatus(400);
      response.setMessage('Primary outlet cannot be deleted.');
      return res.status(400).json(response);
    }

    const store = await global.serverdbConnection.Store.findByPk(targetId);
    if (!store) {
      response.setStatus(404);
      response.setMessage('Outlet not found.');
      return res.status(404).json(response);
    }

    await store.destroy();
    response.setMessage('Outlet deleted successfully.');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 7. PRINTER MASTER CRUD
// ==========================================
router.get('/printers', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const qStoreId = req.query.store_id || req.body?.store_id;
    const qType = req.query.printer_type || req.query.type;
    const whereClause = {
      [global.serverdbConnection.Sequelize.Op.or]: [
        { is_active: 1 },
        { is_active: null }
      ]
    };
    if (qStoreId) {
      whereClause.store_id = qStoreId;
    }
    if (qType) {
      whereClause.printer_type = String(qType).trim().toUpperCase();
    }

    const printers = await global.serverdbConnection.Printer.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
      raw: true
    });
    const mapped = printers.map(p => {
      const pType = String(p.printer_type || '').toUpperCase() === 'BILL' ? 'BILL' : 'KOT';
      const pPort = p.printer_port_number || 9100;
      return {
        id: p.id,
        printer_id: p.id,
        name: p.title || p.device_name || `Printer ${p.id}`,
        printer_name: p.title || p.device_name || `Printer ${p.id}`,
        title: p.title || p.device_name || `Printer ${p.id}`,
        device_name: p.device_name || p.title || `Printer ${p.id}`,
        ip_address: p.device_address || '192.168.1.100',
        printer_ip: p.device_address || '192.168.1.100',
        device_address: p.device_address || '192.168.1.100',
        port: pPort,
        printer_port_number: pPort,
        printer_type: pType,
        type: pType,
        store_id: p.store_id || 'STORE_1',
        is_active: p.is_active !== 0 ? 1 : 0
      };
    });
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/printers', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, printer_id, printer_name, name, title, ip_address, printer_ip, device_address, port, printer_port_number, type, printer_type, store_id } = req.body;
    const targetId = id || printer_id;
    const pName = printer_name || name || title || 'KOT Printer';
    const pIp = ip_address || printer_ip || device_address || '192.168.1.100';
    const pPort = String(port || printer_port_number || '9100');
    const rawType = String(printer_type !== undefined ? printer_type : (type || '')).trim().toUpperCase();
    const pTypeVal = rawType === 'BILL' ? 'BILL' : 'KOT';
    const pStoreId = store_id ? String(store_id) : 'STORE_1';

    let printer;
    if (targetId) {
      printer = await global.serverdbConnection.Printer.findByPk(targetId);
      if (printer) {
        await printer.update({
          title: pName,
          device_name: pName,
          device_address: pIp,
          printer_port_number: pPort,
          printer_type: pTypeVal,
          store_id: pStoreId,
          is_active: 1
        });
      }
    } else {
      printer = await global.serverdbConnection.Printer.create({
        title: pName,
        device_name: pName,
        device_address: pIp,
        printer_port_number: pPort,
        printer_type: pTypeVal,
        is_active: 1,
        activate: 1,
        store_id: pStoreId
      });
    }
    response.data = {
      id: printer.id,
      printer_id: printer.id,
      name: printer.title || printer.device_name,
      printer_name: printer.title || printer.device_name,
      ip_address: printer.device_address,
      printer_ip: printer.device_address,
      printer_port_number: printer.printer_port_number || '9100',
      port: printer.printer_port_number || '9100',
      printer_type: printer.printer_type,
      type: printer.printer_type,
      store_id: printer.store_id,
      is_active: 1
    };
    response.setMessage('Printer saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.delete('/printers/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const printer = await global.serverdbConnection.Printer.findByPk(req.params.id);
    if (printer) {
      await printer.update({ is_active: 0 });
    }
    response.setMessage('Printer deactivated successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 8. PRODUCTION CATEGORIES (KITCHEN ROUTING)
// ==========================================
router.get('/production-categories', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const qStoreId = req.query.store_id || req.body?.store_id;
    const deptWhere = { is_active: 1 };
    if (qStoreId) {
      deptWhere.store_id = qStoreId;
    }

    const [deps, printers] = await Promise.all([
      global.serverdbConnection.KitchenDepartment.findAll({
        where: deptWhere,
        raw: true
      }),
      global.serverdbConnection.Printer.findAll({
        where: { is_active: 1, printer_type: 'KOT' },
        raw: true
      })
    ]);

    const printerMap = new Map();
    printers.forEach(p => printerMap.set(Number(p.id), p));

    const mapped = deps.map(d => {
      const assignedPrinter = d.printer_id ? printerMap.get(Number(d.printer_id)) : null;
      return {
        id: d.id,
        name: d.name || d.kitchen_dept_name || `Category ${d.id}`,
        department_name: d.name || d.kitchen_dept_name || `Category ${d.id}`,
        printer_id: d.printer_id || null,
        printerId: d.printer_id || null,
        printer_name: assignedPrinter ? assignedPrinter.title || assignedPrinter.device_name : null,
        printerName: assignedPrinter ? assignedPrinter.title || assignedPrinter.device_name : null,
        printer: assignedPrinter || null,
        status: d.is_active === 1 ? 'Active' : 'Inactive',
        store_id: d.store_id || 'STORE_1'
      };
    });
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/production-categories', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, name, department_name, printer_id, printerId, store_id } = req.body;
    const deptName = name || department_name || 'Kitchen Section';
    const assignedPrinterId = printer_id !== undefined ? (printer_id ? Number(printer_id) : null) : (printerId ? Number(printerId) : null);
    const parsedStoreId = store_id ? (isNaN(Number(store_id)) ? (parseInt(String(store_id).replace(/\D/g, ''), 10) || 1) : Number(store_id)) : 1;

    // Strict validation if a printer is assigned
    let assignedPrinter = null;
    if (assignedPrinterId) {
      assignedPrinter = await global.serverdbConnection.Printer.findByPk(assignedPrinterId, { raw: true });
      if (!assignedPrinter || assignedPrinter.is_active === 0) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Selected printer does not exist or is inactive.'
        });
      }
      const pType = String(assignedPrinter.printer_type || '').toUpperCase();
      if (pType !== 'KOT') {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Selected printer is not configured as a KOT printer.'
        });
      }
    }

    let dep;
    if (id) {
      dep = await global.serverdbConnection.KitchenDepartment.findByPk(id);
      if (dep) {
        await dep.update({
          name: deptName,
          kitchen_dept_name: deptName,
          printer_id: assignedPrinterId,
          is_active: 1,
          isactive: 1,
          store_id: parsedStoreId
        });
      }
    } else {
      dep = await global.serverdbConnection.KitchenDepartment.create({
        name: deptName,
        kitchen_dept_name: deptName,
        printer_id: assignedPrinterId,
        is_active: 1,
        isactive: 1,
        store_id: parsedStoreId
      });
    }

    response.data = {
      id: dep.id,
      name: dep.name || dep.kitchen_dept_name,
      department_name: dep.name || dep.kitchen_dept_name,
      printer_id: dep.printer_id,
      printerId: dep.printer_id,
      printer_name: assignedPrinter ? assignedPrinter.title || assignedPrinter.device_name : null,
      printerName: assignedPrinter ? assignedPrinter.title || assignedPrinter.device_name : null,
      printer: assignedPrinter,
      status: 'Active',
      store_id: dep.store_id
    };
    response.setMessage('Production category saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.delete('/production-categories/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const dep = await global.serverdbConnection.KitchenDepartment.findByPk(req.params.id);
    if (dep) {
      await dep.update({ is_active: 0, isactive: 0 });
    }
    response.setMessage('Production category deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 9. ITEM RATE UPDATE (SINGLE & BULK)
// ==========================================
router.post('/item-rates/update', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { items, item_id, price } = req.body;
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        if (it.id || it.item_id) {
          await global.serverdbConnection.Item.update(
            { sale_price: Number(it.price || it.sale_price || 0) },
            { where: { item_id: it.id || it.item_id } }
          );
        }
      }
    } else if (item_id && price !== undefined) {
      await global.serverdbConnection.Item.update(
        { sale_price: Number(price) },
        { where: { item_id } }
      );
    }
    response.setMessage('Item rates updated successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 10. HSN CODE BATCH UPDATE
// ==========================================
router.post('/items/hsn-update', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { category_id, hsn_code } = req.body;
    if (category_id && hsn_code) {
      await global.serverdbConnection.Item.update(
        { description: `HSN:${hsn_code}` },
        { where: { category_ref_ids: category_id } }
      );
    }
    response.setMessage('HSN Codes updated successfully across menu category');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 11. ITEM ENTRY CSV BULK UPLOAD
// ==========================================
router.post('/items/csv-upload', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : (Array.isArray(req.body) ? req.body : []);

    // 1. Preload existing categories for mapping
    const categoriesMap = {};
    try {
      const existingCats = await global.serverdbConnection.Category.findAll({ raw: true });
      existingCats.forEach(c => {
        if (c.category_name) {
          categoriesMap[c.category_name.toLowerCase()] = c.category_refid || c.id;
        }
      });
    } catch (err) {
      console.warn("Failed to load existing categories for CSV import map:", err);
    }

    // Preload existing product groups for mapping
    const productGroupsMap = {};
    try {
      const existingGroups = await global.serverdbConnection.ProductGroup.findAll({ raw: true });
      existingGroups.forEach(g => {
        if (g.product_group_name) {
          productGroupsMap[g.product_group_name.toLowerCase()] = g.product_group_id || g.id;
        }
      });
    } catch (err) {
      console.warn("Failed to load existing product groups for CSV import map:", err);
    }

    let createdCount = 0;
    for (const it of items) {
      if (it.name || it.title) {

        // 2. Resolve or auto-create category from 'itemGroup'
        let categoryId = 1; // Fallback
        const groupName = (it.itemGroup || it.group || it.category_name || '').trim();

        if (groupName) {
          const lowerName = groupName.toLowerCase();
          if (categoriesMap[lowerName]) {
            categoryId = categoriesMap[lowerName];
          } else {
            // Auto-create missing category
            try {
              const nextCatId = Math.floor(Date.now() / 1000) + createdCount;
              const newCat = await global.serverdbConnection.Category.create({
                category_refid: nextCatId,
                category_name: groupName,
                is_active: 1,
                store_id: it.store_id || it.outlet || 'STORE_1'
              });
              categoryId = newCat.category_refid || newCat.id;
              categoriesMap[lowerName] = categoryId; // Add to map for subsequent items
            } catch (err) {
              console.warn(`Failed to auto-create category '${groupName}', falling back to default.`, err);
            }
          }
        }

        // 2b. Resolve or auto-create product_group from 'mainGroup'
        let productGroupId = Object.values(productGroupsMap)[0] || 1; // Fallback to an existing group if possible
        const mainGroupName = (it.mainGroup || 'Food').trim();

        if (mainGroupName) {
          const lowerName = mainGroupName.toLowerCase();
          if (productGroupsMap[lowerName]) {
            productGroupId = productGroupsMap[lowerName];
          } else {
            // Auto-create missing product group
            try {
              const nextGroupId = Math.floor(Date.now() / 1000) + createdCount;
              const newGroup = await global.serverdbConnection.ProductGroup.create({
                product_group_id: nextGroupId,
                product_group_name: mainGroupName,
                store_id: 1
              });
              productGroupId = newGroup.product_group_id || newGroup.id;
              productGroupsMap[lowerName] = productGroupId;
            } catch (err) {
              console.warn(`Failed to auto-create product group '${mainGroupName}', falling back to default.`, err);
            }
          }
        }

        // 3. Auto-detect Veg/Non-Veg (overrides frontend defaults)
        const itemNameLower = (it.name || it.title || '').toLowerCase();
        const isNonVegName = /chicken|mutton|beef|pork|fish|prawn|meat|egg|crab|squid/.test(itemNameLower);
        const foodType = (it.type === 'Non-Veg' || isNonVegName) ? 2 : 1;

        // 4. Insert or update the Menu Item with all required defaults for the POS menu
        const itemTitle = (it.name || it.title || '').trim();
        const itemStoreId = it.store_id || it.outlet || 'STORE_1';
        const finalVariants = Array.isArray(it.variants) && it.variants.length > 0
          ? it.variants
          : (Array.isArray(it.portions) && it.portions.length > 0 ? it.portions : null);

        let itemPrice = Number(it.price || it.sale_price || 0);
        if ((!itemPrice || itemPrice <= 0) && finalVariants && finalVariants.length > 0) {
          itemPrice = Number(finalVariants[0].price || 0);
        }

        const cleanTitle = itemTitle.trim();
        const existingItem = await global.serverdbConnection.Item.findOne({
          where: {
            [global.serverdbConnection.Sequelize.Op.and]: [
              global.serverdbConnection.Sequelize.where(
                global.serverdbConnection.Sequelize.fn('LOWER', global.serverdbConnection.Sequelize.fn('TRIM', global.serverdbConnection.Sequelize.col('title'))),
                cleanTitle.toLowerCase()
              ),
              {
                [global.serverdbConnection.Sequelize.Op.or]: [
                  { store_id: itemStoreId },
                  { store_id: 'STORE_1' },
                  { store_id: null },
                  { store_id: '' }
                ]
              }
            ]
          }
        });

        if (existingItem) {
          let mergedVariants = null;
          let currentVariants = [];
          if (Array.isArray(existingItem.discounted_items)) {
            currentVariants = existingItem.discounted_items;
          } else if (typeof existingItem.discounted_items === 'string' && existingItem.discounted_items.trim()) {
            try { currentVariants = JSON.parse(existingItem.discounted_items); } catch (e) {}
          }
          if (!Array.isArray(currentVariants)) currentVariants = [];

          if (finalVariants && finalVariants.length > 0) {
            const variantMap = new Map();
            currentVariants.forEach(cv => {
              if (cv && cv.name) {
                variantMap.set(cv.name.trim().toLowerCase(), { ...cv });
              }
            });
            finalVariants.forEach(iv => {
              if (iv && iv.name) {
                const key = iv.name.trim().toLowerCase();
                const existingV = variantMap.get(key);
                if (existingV) {
                  variantMap.set(key, {
                    ...existingV,
                    price: Number(iv.price) > 0 ? Number(iv.price) : existingV.price,
                    serving: iv.serving || iv.description || existingV.serving || '',
                    description: iv.description || iv.serving || existingV.description || '',
                    code: iv.code || existingV.code || '',
                    active: iv.active !== undefined ? iv.active : existingV.active
                  });
                } else {
                  variantMap.set(key, {
                    id: iv.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    name: iv.name,
                    serving: iv.serving || iv.description || '',
                    description: iv.description || iv.serving || '',
                    price: Number(iv.price) || 0,
                    code: iv.code || '',
                    active: iv.active !== false
                  });
                }
              }
            });
            mergedVariants = Array.from(variantMap.values());
          } else {
            mergedVariants = currentVariants.length > 0 ? currentVariants : null;
          }

          const resolvedPrice = (mergedVariants && mergedVariants.length > 0)
            ? Number(mergedVariants[0].price || itemPrice || existingItem.price)
            : (itemPrice > 0 ? itemPrice : existingItem.price);

          await existingItem.update({
            price: resolvedPrice,
            sale_price: resolvedPrice,
            itemsub_total: resolvedPrice,
            category_ref_ids: categoryId || existingItem.category_ref_ids,
            product_group: productGroupId || existingItem.product_group,
            food_type: foodType,
            active: 1,
            discounted_items: mergedVariants
          });
        } else {
          await global.serverdbConnection.Item.create({
            item_refid: Math.floor(Date.now() / 1000) + createdCount,
            title: itemTitle,
            item_name: itemTitle,
            price: itemPrice,
            sale_price: itemPrice,
            itemsub_total: itemPrice,
            tax_per: 5,
            tax_value: 0,
            tax_name: 'Default 5%',
            kitchen_dept: 1,
            product_group: productGroupId, // Resolved product group ID
            tax_discount_method: 1,
            inventory_type: 'RECIPE',
            category_ref_ids: categoryId, // Assign resolved or created category ID
            food_type: foodType,
            active: 1,
            store_id: itemStoreId,
            short_code: it.dispCode || '',
            is_open_item: 0,
            open_price: 0,
            discounted_items: finalVariants
          });
        }
        createdCount++;
      }
    }
    response.setMessage(`Successfully imported ${createdCount} items into PostgreSQL database!`);
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});
// ==========================================
// 12. PRODUCT GROUPS / MAIN GROUPS CRUD
// ==========================================
router.get('/product-groups', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const groups = await global.serverdbConnection.ProductGroup.findAll({ raw: true });
    const mapped = groups.map(g => ({
      id: g.product_group_id || g.id,
      name: g.product_group_name || `Main Group ${g.id}`,
      product_group_name: g.product_group_name || `Main Group ${g.id}`
    }));
    response.data = mapped;
    response.productGroups = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch product groups');
  }
  res.json(response);
});

router.post('/product-groups', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, product_group_id, name, product_group_name } = req.body;
    const groupName = product_group_name || name || 'New Main Group';
    const targetId = id || product_group_id;

    let group;
    if (targetId && Number(targetId) > 0) {
      group = await global.serverdbConnection.ProductGroup.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { id: targetId },
            { product_group_id: targetId }
          ]
        }
      });
      if (group) {
        await group.update({ product_group_name: groupName });
      }
    }

    if (!group) {
      const nextId = Math.floor(Date.now() / 1000);
      group = await global.serverdbConnection.ProductGroup.create({
        product_group_id: nextId,
        product_group_name: groupName,
        store_id: 1
      });
    }

    response.data = group;
    response.id = group.product_group_id || group.id;
    response.setMessage('Product group saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving product group:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save product group');
  }
  res.json(response);
});

router.delete('/product-groups/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetId = req.params.id;
    const count = await global.serverdbConnection.Item.count({ where: { product_group: targetId } });
    if (count > 0) {
      response.setStatus(400);
      response.setMessage(`Cannot delete Main Group: ${count} menu item(s) are referencing it.`);
      return res.json(response);
    }

    const group = await global.serverdbConnection.ProductGroup.findOne({
      where: {
        [global.serverdbConnection.Sequelize.Op.or]: [
          { id: targetId },
          { product_group_id: targetId }
        ]
      }
    });
    if (group) {
      await group.destroy();
    }
    response.setMessage('Product group deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete product group');
  }
  res.json(response);
});

// ==========================================
// 12. FLOOR MASTER CRUD
// ==========================================
router.get('/menu/floors', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const floors = await global.serverdbConnection.Floor.findAll({
      order: [['id', 'ASC']],
      raw: true
    });
    const mapped = floors.map(f => ({
      id: f.id,
      name: f.name || '',
      active: f.active === 'No' ? 'No' : 'Yes'
    }));
    response.data = mapped;
    response.floors = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching floors in PosMasters:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch floors');
  }
  res.json(response);
});

module.exports = router;
