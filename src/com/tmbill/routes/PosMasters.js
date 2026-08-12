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
    const stores = await global.serverdbConnection.Store.findAll({ raw: true });
    const mapped = (stores || []).map(s => ({
      ...s,
      store_id: s.store_id || String(s.id),
      store_name: s.store_name || 'Restaurant'
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
    const { store_id, store_name, address, phone, gst_number } = req.body;
    let store;
    if (store_id) {
      store = await global.serverdbConnection.Store.findByPk(store_id);
      if (store) {
        await store.update({
          store_name: store_name || store.store_name,
          address: address || store.address,
          phone: phone || store.phone,
          gst_number: gst_number || store.gst_number
        });
      }
    } else {
      store = await global.serverdbConnection.Store.create({
        store_name: store_name || 'Main Outlet',
        address: address || '',
        phone: phone || '',
        gst_number: gst_number || ''
      });
    }
    response.data = store;
    response.setMessage('Outlet saved successfully in PostgreSQL');
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
    const printers = await global.serverdbConnection.Printer.findAll({
      where: { is_active: 1 },
      raw: true
    });
    response.data = printers;
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
    const { printer_id, printer_name, name, ip_address, printer_ip, type, printer_type } = req.body;
    const pTypeVal = typeof printer_type === 'number' ? printer_type : (typeof type === 'number' ? type : 1);
    let printer;
    if (printer_id) {
      printer = await global.serverdbConnection.Printer.findByPk(printer_id);
      if (printer) {
        await printer.update({
          printer_name: printer_name || name || printer.printer_name,
          printer_ip: printer_ip || ip_address || printer.printer_ip,
          printer_type: pTypeVal
        });
      }
    } else {
      printer = await global.serverdbConnection.Printer.create({
        printer_name: printer_name || name || 'KOT Printer',
        printer_ip: printer_ip || ip_address || '192.168.1.100',
        printer_type: pTypeVal,
        is_active: 1,
        store_id: 1
      });
    }
    response.data = printer;
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
    const deps = await global.serverdbConnection.KitchenDepartment.findAll({
      where: { is_active: 1 },
      raw: true
    });
    const mapped = deps.map(d => ({
      id: d.id,
      name: d.name || d.department_name,
      status: d.is_active === 1 ? 'Active' : 'Inactive'
    }));
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
    const { id, name, department_name } = req.body;
    const deptName = name || department_name || 'Kitchen Section';
    let dep;
    if (id) {
      dep = await global.serverdbConnection.KitchenDepartment.findByPk(id);
      if (dep) {
        await dep.update({ name: deptName, kitchen_dept_name: deptName });
      }
    } else {
      dep = await global.serverdbConnection.KitchenDepartment.create({
        name: deptName,
        kitchen_dept_name: deptName,
        is_active: 1,
        isactive: 1,
        store_id: 1
      });
    }
    response.data = dep;
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
    let createdCount = 0;
    for (const it of items) {
      if (it.name || it.title) {
        await global.serverdbConnection.Item.create({
          title: it.name || it.title,
          item_name: it.name || it.title,
          price: Number(it.price || it.sale_price || 0),
          sale_price: Number(it.price || it.sale_price || 0),
          category_ref_ids: 1,
          food_type: it.type === 'Non-Veg' ? 2 : 1,
          active: 1
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

module.exports = router;
