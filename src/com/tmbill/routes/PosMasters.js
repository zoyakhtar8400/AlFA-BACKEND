const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();

// ==========================================
// 1. STEWARD / WAITER MASTER CRUD
// ==========================================
// ==========================================
// 1. STEWARD / WAITER MASTER CRUD
// ==========================================
router.get('/menu/waiters', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const waiters = await global.serverdbConnection.Waiter.findAll({
      order: [['id', 'DESC']],
      raw: true,
    });
    const mapped = waiters.map(w => ({
      id: w.id,
      name: w.name || `Steward ${w.id}`,
      phone: w.phone || '',
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
});

router.post('/menu/waiters', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, name, waiter_name, phone } = req.body;
    const stewardName = name || waiter_name || 'Steward';

    let waiter;
    if (id && Number(id) > 0) {
      waiter = await global.serverdbConnection.Waiter.findByPk(id);
      if (waiter) {
        await waiter.update({
          name: stewardName,
          phone: phone || waiter.phone
        });
      }
    } else {
      waiter = await global.serverdbConnection.Waiter.create({
        name: stewardName,
        username: `steward_${Date.now().toString().slice(-6)}`,
        phone: phone || '',
        store_id: 'STORE_1'
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
    const boys = await global.serverdbConnection.DeliveryBoy.findAll({
      order: [['id', 'DESC']],
      raw: true
    });
    const mapped = boys.map(d => ({
      id: d.id,
      partner: d.username || d.partner || 'Direct Delivery',
      name: d.name || `Delivery Boy ${d.id}`,
      phone: d.phone || '',
      status: 'Active'
    }));
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching delivery boys:', err);
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.post('/delivery-boys', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, partner, name, phone } = req.body;
    let delBoy;
    if (id && Number(id) > 0) {
      delBoy = await global.serverdbConnection.DeliveryBoy.findByPk(id);
      if (delBoy) {
        await delBoy.update({
          username: partner || delBoy.username,
          name: name || delBoy.name,
          phone: phone || delBoy.phone
        });
      }
    } else {
      delBoy = await global.serverdbConnection.DeliveryBoy.create({
        username: partner || 'Direct Delivery',
        name: name || 'Delivery Staff',
        phone: phone || '',
        store_id: 'STORE_1'
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
      status: t.is_active === 1 ? 'Active' : 'Inactive'
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
    const { id, name, tax_name, percentage, tax_percentage } = req.body;
    const taxVal = Number(percentage !== undefined ? percentage : (tax_percentage || 5));
    const tName = name || tax_name || 'GST 5%';
    let tax;
    if (id && Number(id) > 0) {
      tax = await global.serverdbConnection.Tax.findByPk(id);
      if (tax) {
        await tax.update({
          tax_name: tName,
          tax_display_name: tName,
          tax_percentage: taxVal,
          is_active: 1
        });
      }
    }
    if (!tax) {
      tax = await global.serverdbConnection.Tax.create({
        tax_name: tName,
        tax_display_name: tName,
        tax_percentage: taxVal,
        is_active: 1,
        store_id: 'STORE_1'
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
    const ncTypes = await global.serverdbConnection.NCType.findAll({
      where: { is_active: 1 },
      order: [['id', 'DESC']],
      raw: true
    });
    const mapped = ncTypes.map(nc => ({
      id: nc.id,
      code: nc.code || `NC${nc.id}`,
      name: nc.name,
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
    const { id, code, name, status } = req.body;
    const ncName = name || 'NC Type';
    let nc;
    if (id && Number(id) > 0) {
      nc = await global.serverdbConnection.NCType.findByPk(id);
      if (nc) {
        await nc.update({
          code: code || nc.code,
          name: ncName,
          status: status || nc.status
        });
      }
    }
    if (!nc) {
      nc = await global.serverdbConnection.NCType.create({
        code: code || `NC${Math.floor(Date.now() / 1000)}`,
        name: ncName,
        status: status || 'Active',
        is_active: 1,
        store_id: 'STORE_1'
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
      await nc.update({ is_active: 0, status: 'Inactive' });
    }
    response.setMessage('NC Type deactivated successfully');
    response.setStatus(200);
  } catch (err) {
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
      focusOn: focusOn || 'Item Search',
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
      await store.update({
        store_name: newStoreName,
        store_phone: phone || store.store_phone,
        user_phone: phone || store.user_phone,
        user_line_1: billHeader1 || address || store.user_line_1,
        user_line_2: billHeader2 || store.user_line_2,
        user_sub_locality: billHeader3 || store.user_sub_locality,
        footer_note: billSlogan1 || store.footer_note,
        disable_ordering: isInactive ? 1 : 0,
        settings: settingsObj
      });
    } else {
      store = await global.serverdbConnection.Store.create({
        store_name: newStoreName,
        store_phone: phone || '',
        user_phone: phone || '',
        user_line_1: billHeader1 || address || '',
        user_line_2: billHeader2 || '',
        user_sub_locality: billHeader3 || '',
        footer_note: billSlogan1 || '',
        disable_ordering: isInactive ? 1 : 0,
        settings: settingsObj
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
      settings: settingsObj
    };
    response.setMessage('Outlet saved successfully in PostgreSQL');
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
    const whereClause = {
      [global.serverdbConnection.Sequelize.Op.or]: [
        { is_active: 1 },
        { is_active: null }
      ]
    };
    if (qStoreId) {
      whereClause.store_id = qStoreId;
    }

    const printers = await global.serverdbConnection.Printer.findAll({
      where: whereClause,
      raw: true
    });
    const mapped = printers.map(p => ({
      id: p.id,
      printer_id: p.id,
      name: p.title || p.device_name || `Printer ${p.id}`,
      printer_name: p.title || p.device_name || `Printer ${p.id}`,
      title: p.title || p.device_name || `Printer ${p.id}`,
      device_name: p.device_name || p.title || `Printer ${p.id}`,
      ip_address: p.device_address || '192.168.1.100',
      printer_ip: p.device_address || '192.168.1.100',
      device_address: p.device_address || '192.168.1.100',
      printer_type: p.printer_type || 1,
      type: p.printer_type || 1,
      store_id: p.store_id || 'STORE_1',
      is_active: p.is_active !== 0 ? 1 : 0
    }));
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
    const { id, printer_id, printer_name, name, title, ip_address, printer_ip, device_address, type, printer_type, store_id } = req.body;
    const targetId = id || printer_id;
    const pName = printer_name || name || title || 'KOT Printer';
    const pIp = ip_address || printer_ip || device_address || '192.168.1.100';
    const pTypeVal = typeof printer_type === 'number' ? printer_type : (typeof type === 'number' ? type : 1);

    let printer;
    if (targetId) {
      printer = await global.serverdbConnection.Printer.findByPk(targetId);
      if (printer) {
        await printer.update({
          title: pName,
          device_name: pName,
          device_address: pIp,
          printer_type: pTypeVal,
          store_id: store_id ? String(store_id) : printer.store_id,
          is_active: 1
        });
      }
    } else {
      printer = await global.serverdbConnection.Printer.create({
        title: pName,
        device_name: pName,
        device_address: pIp,
        printer_type: pTypeVal,
        is_active: 1,
        activate: 1,
        store_id: store_id ? String(store_id) : 'STORE_1'
      });
    }
    response.data = {
      id: printer.id,
      printer_id: printer.id,
      name: printer.title || printer.device_name,
      printer_name: printer.title || printer.device_name,
      ip_address: printer.device_address,
      printer_ip: printer.device_address,
      printer_type: printer.printer_type,
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
    const [deps, printers] = await Promise.all([
      global.serverdbConnection.KitchenDepartment.findAll({
        where: { is_active: 1 },
        raw: true
      }),
      global.serverdbConnection.Printer.findAll({
        where: { is_active: 1 },
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
        printer_name: assignedPrinter ? assignedPrinter.printer_name : null,
        printerName: assignedPrinter ? assignedPrinter.printer_name : null,
        printer: assignedPrinter || null,
        status: d.is_active === 1 ? 'Active' : 'Inactive',
        store_id: d.store_id || 1
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

    let dep;
    if (id) {
      dep = await global.serverdbConnection.KitchenDepartment.findByPk(id);
      if (dep) {
        await dep.update({
          name: deptName,
          kitchen_dept_name: deptName,
          printer_id: assignedPrinterId,
          is_active: 1,
          isactive: 1
        });
      }
    } else {
      dep = await global.serverdbConnection.KitchenDepartment.create({
        name: deptName,
        kitchen_dept_name: deptName,
        printer_id: assignedPrinterId,
        is_active: 1,
        isactive: 1,
        store_id: store_id || 1
      });
    }

    // Resolve printer details for immediate response
    let assignedPrinter = null;
    if (dep && dep.printer_id) {
      assignedPrinter = await global.serverdbConnection.Printer.findByPk(dep.printer_id, { raw: true });
    }

    response.data = {
      id: dep.id,
      name: dep.name || dep.kitchen_dept_name,
      department_name: dep.name || dep.kitchen_dept_name,
      printer_id: dep.printer_id,
      printerId: dep.printer_id,
      printer_name: assignedPrinter ? assignedPrinter.printer_name : null,
      printerName: assignedPrinter ? assignedPrinter.printer_name : null,
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

        // 4. Insert the Menu Item with all required defaults for the POS menu
        await global.serverdbConnection.Item.create({
          item_refid: Math.floor(Date.now() / 1000) + createdCount,
          title: it.name || it.title,
          item_name: it.name || it.title,
          price: Number(it.price || it.sale_price || 0),
          sale_price: Number(it.price || it.sale_price || 0),
          itemsub_total: Number(it.price || it.sale_price || 0),
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
          is_active: 1, // Mandatory for visibility in POS
          store_id: it.store_id || it.outlet || 'STORE_1',
          short_code: '',
          is_open_item: 0,
          open_price: 0
        });
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
