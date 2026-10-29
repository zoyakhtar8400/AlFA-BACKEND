const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();

// GET /api/categories
router.get('/categories', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const categories = await global.serverdbConnection.Category.findAll({
      where: { is_active: 1 },
      raw: true
    });
    const mapped = categories.map(c => ({
      id: c.category_refid || c.id,
      name: c.category_name,
      category_name: c.category_name
    }));
    response.data = mapped;
    response.categories = mapped;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST & PUT /api/categories
const saveCategoryHandler = async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetId = req.params.id || req.body.id;
    const { category_name, name } = req.body;
    const catName = category_name || name || 'New Category';
    let cat;
    if (targetId) {
      cat = await global.serverdbConnection.Category.findByPk(targetId);
      if (cat) {
        await cat.update({ category_name: catName });
      }
    } else {
      cat = await global.serverdbConnection.Category.create({
        category_refid: Math.floor(Date.now() / 1000),
        category_name: catName,
        is_active: 1,
        store_id: 'STORE_1'
      });
    }
    response.data = cat;
    response.category_id = cat ? (cat.category_refid || cat.id) : targetId;
    response.setMessage('Category saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save category');
  }
  res.json(response);
};

router.post('/categories', saveCategoryHandler);
router.put('/categories/:id', saveCategoryHandler);
router.put('/categories', saveCategoryHandler);

// DELETE /api/categories/:id
router.delete('/categories/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const cat = await global.serverdbConnection.Category.findByPk(req.params.id);
    if (cat) {
      await cat.update({ is_active: 0 });
    }
    response.setMessage('Category deactivated successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// GET /api/menu-items
router.get('/menu-items', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const Op = global.serverdbConnection.Sequelize?.Op;
    const whereCond = Op ? {
      [Op.or]: [
        { active: 1 },
        { active: null }
      ]
    } : {};
    let items = await global.serverdbConnection.Item.findAll({
      where: whereCond,
      raw: true
    });

    if (!items || items.length === 0) {
      items = await global.serverdbConnection.Item.findAll({ raw: true });
    }
    console.log('[MenuRoutes] GET /menu-items total DB items found:', items?.length);

    const categories = await global.serverdbConnection.Category.findAll({ raw: true });
    let dbUnits = [];
    try {
      if (global.serverdbConnection.Unit) {
        dbUnits = await global.serverdbConnection.Unit.findAll({ where: { is_active: 1 }, raw: true });
      }
    } catch (e) { }

    let billedItemIds = new Set();
    try {
      if (global.serverdbConnection.BillItem) {
        const billedRows = await global.serverdbConnection.BillItem.findAll({
          attributes: ['item_id'],
          raw: true
        });
        billedRows.forEach(r => {
          if (r.item_id) billedItemIds.add(Number(r.item_id));
        });
      }
    } catch (e) { }

    const mapped = items.map(i => {
      const cat = categories.find(c => String(c.category_refid) === String(i.category_ref_ids) || c.id === i.category_ref_ids);
      const isOpenItem = Number(i.is_open_item || 0);
      const unitLabel = i.alternative_title || 'Plate';
      let parsedVariants = [];
      if (Array.isArray(i.discounted_items)) {
        parsedVariants = i.discounted_items;
      } else if (typeof i.discounted_items === 'string' && i.discounted_items.trim()) {
        try {
          const parsed = JSON.parse(i.discounted_items);
          if (Array.isArray(parsed)) parsedVariants = parsed;
        } catch (e) {
          parsedVariants = [];
        }
      }
      const isBilled = (isOpenItem === 1 && (i.description === 'BILLED' || billedItemIds.has(Number(i.item_id || i.id)))) ? 1 : 0;

      return {
        id: i.item_id || i.id,
        item_id: i.item_id || i.id,
        name: i.title || i.item_name || 'Item',
        title: i.title || i.item_name || 'Item',
        price: Number(i.sale_price || i.price || 0),
        sale_price: Number(i.sale_price || i.price || 0),
        sale_price_1: Number(i.sale_price_1 || i.sale_price || i.price || 0),
        sale_price_2: Number(i.sale_price_2 || i.sale_price || i.price || 0),
        sale_price_3: Number(i.sale_price_3 || i.sale_price || i.price || 0),
        sale_price_4: Number(i.sale_price_4 || i.sale_price || i.price || 0),
        sale_price_5: Number(i.sale_price_5 || i.sale_price || i.price || 0),
        unit: unitLabel,
        unit_name: unitLabel,
        alternative_title: i.alternative_title || '',
        has_modifiers: i.has_modifiers || 0,
        option_group_ref_id: i.option_group_ref_id || '',
        variants: parsedVariants,
        portions: parsedVariants,
        categoryId: i.category_ref_ids,
        category: cat ? cat.category_name : 'General',
        foodType: i.food_type === 1 ? 'Veg' : 'Non-Veg',
        taxPercent: i.tax_per !== undefined ? Number(i.tax_per) : 5,
        tax_name: i.tax_name || 'GST',
        tax_per: i.tax_per !== undefined ? Number(i.tax_per) : 5,
        store_id: i.store_id || 'STORE_1',
        short_code: i.short_code || '',
        is_open_item: isOpenItem,
        open_price: i.open_price || 0,
        description: i.description || null,
        is_billed: isBilled
      };
    });

    response.data = mapped;
    response.menuItems = mapped;
    response.items = mapped;
    response.units = dbUnits;
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST /api/menu-items (Create or Update)
router.post('/menu-items', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    console.log('\n[MenuRoutes] POST /menu-items received body:', req.body);
    const {
      id, item_id, title, name, price, sale_price,
      sale_price_1, sale_price_2, sale_price_3, sale_price_4, sale_price_5,
      unit, unit_name, unitType, alternative_title, has_modifiers, option_group_ref_id,
      variants, portions,
      category_ref_ids, food_type, inventory_type, direct_inventory_item_id,
      store_id, outlet, short_code, is_open_item, open_price, kitchen_dept,
      tax_name, tax_per
    } = req.body;
    const targetId = id || item_id;
    const itemTitle = title || name || 'Menu Item';
    const itemPrice = Number(price !== undefined ? price : (sale_price || 0));
    const finalStoreId = store_id || outlet || 'STORE_1';
    const finalUnit = unit || unit_name || unitType || alternative_title || 'Plate';
    const finalVariants = variants || portions || null;

    let item;
    if (targetId && Number(targetId) > 0) {
      item = await global.serverdbConnection.Item.findByPk(targetId);
      if (item) {
        await item.update({
          title: itemTitle,
          item_name: itemTitle,
          price: itemPrice,
          sale_price: itemPrice,
          itemsub_total: itemPrice,
          alternative_title: finalUnit,
          ...(sale_price_1 !== undefined && { sale_price_1: Number(sale_price_1) }),
          ...(sale_price_2 !== undefined && { sale_price_2: Number(sale_price_2) }),
          ...(sale_price_3 !== undefined && { sale_price_3: Number(sale_price_3) }),
          ...(sale_price_4 !== undefined && { sale_price_4: Number(sale_price_4) }),
          ...(sale_price_5 !== undefined && { sale_price_5: Number(sale_price_5) }),
          ...(has_modifiers !== undefined && { has_modifiers: Number(has_modifiers) }),
          ...(option_group_ref_id !== undefined && { option_group_ref_id: String(option_group_ref_id) }),
          ...(finalVariants && { discounted_items: finalVariants }),
          ...(category_ref_ids && { category_ref_ids }),
          ...(food_type && { food_type: food_type === 'Non-Veg' ? 2 : (food_type === 'Veg' ? 1 : food_type) }),
          ...(inventory_type && { inventory_type }),
          ...(kitchen_dept && { kitchen_dept }),
          store_id: finalStoreId,
          short_code: short_code !== undefined ? short_code : item.short_code,
          is_open_item: is_open_item !== undefined ? Number(is_open_item) : item.is_open_item,
          open_price: open_price !== undefined ? Number(open_price) : item.open_price,
          ...(tax_name && { tax_name }),
          ...(tax_per !== undefined && { tax_per: Number(tax_per) })
        });
      }
    } else {
      let pg = await global.serverdbConnection.ProductGroup.findOne({ raw: true });
      if (!pg) {
        try {
          pg = await global.serverdbConnection.ProductGroup.create({
            product_group_id: 1,
            product_group_name: 'General',
            store_id: 1
          });
        } catch (e) {
          pg = null;
        }
      }
      const validPgId = pg ? (pg.product_group_id || pg.id) : 1;

      let kd = await global.serverdbConnection.KitchenDepartment.findOne({ raw: true });
      const validKdId = kd ? kd.id : 1;

      let finalCatRefId = 1;
      if (category_ref_ids) {
        const inputCatId = Number(Array.isArray(category_ref_ids) ? category_ref_ids[0] : category_ref_ids);
        if (inputCatId > 0) {
          const existingCat = await global.serverdbConnection.Category.findOne({
            where: {
              [global.serverdbConnection.Sequelize.Op.or]: [
                { id: inputCatId },
                { category_refid: inputCatId }
              ]
            },
            raw: true
          });
          if (existingCat) {
            finalCatRefId = existingCat.category_refid || existingCat.id;
          }
        }
      }
      if (!finalCatRefId || finalCatRefId === 1) {
        const firstCat = await global.serverdbConnection.Category.findOne({ raw: true });
        if (firstCat) {
          finalCatRefId = firstCat.category_refid || firstCat.id;
        }
      }

      item = await global.serverdbConnection.Item.create({
        item_refid: Math.floor(Date.now() / 1000),
        title: itemTitle,
        item_name: itemTitle,
        price: itemPrice,
        sale_price: itemPrice,
        tax_per: tax_per !== undefined ? Number(tax_per) : 5,
        tax_value: 0,
        itemsub_total: itemPrice,
        tax_name: tax_name || 'Default 5%',
        kitchen_dept: validKdId,
        product_group: validPgId,
        tax_discount_method: 1,
        category_ref_ids: finalCatRefId,
        food_type: food_type === 'Non-Veg' ? 2 : 1,
        inventory_type: inventory_type || 'RECIPE',
        direct_inventory_item_id: direct_inventory_item_id || null,
        active: 1,
        is_active: 1,
        store_id: finalStoreId,
        short_code: short_code || '',
        alternative_title: finalUnit,
        sale_price_1: sale_price_1 !== undefined ? Number(sale_price_1) : itemPrice,
        sale_price_2: sale_price_2 !== undefined ? Number(sale_price_2) : itemPrice,
        sale_price_3: sale_price_3 !== undefined ? Number(sale_price_3) : itemPrice,
        sale_price_4: sale_price_4 !== undefined ? Number(sale_price_4) : itemPrice,
        sale_price_5: sale_price_5 !== undefined ? Number(sale_price_5) : itemPrice,
        has_modifiers: has_modifiers !== undefined ? Number(has_modifiers) : 0,
        option_group_ref_id: option_group_ref_id ? String(option_group_ref_id) : null,
        discounted_items: finalVariants,
        is_open_item: is_open_item !== undefined ? Number(is_open_item) : 0,
        open_price: open_price !== undefined ? Number(open_price) : 0
      });
    }
    const plainItem = item ? (typeof item.get === 'function' ? item.get({ plain: true }) : item) : null;
    response.data = plainItem;
    response.item_id = plainItem ? (plainItem.item_id || plainItem.id) : targetId;
    response.setMessage('Menu item saved successfully');
    response.setStatus(200);
  } catch (err) {
    const errorDetails = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    console.error('Error saving menu item:', errorDetails);
    response.setStatus(400);
    response.setMessage(errorDetails || 'Failed to save menu item');
  }
  res.json(response);
});

// DELETE /api/menu-items/:id
router.delete('/menu-items/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    let item = await global.serverdbConnection.Item.findByPk(req.params.id);
    if (!item) {
      item = await global.serverdbConnection.Item.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { item_id: req.params.id },
            { item_refid: req.params.id }
          ]
        }
      });
    }
    if (item) {
      try {
        await item.destroy();
      } catch (dErr) {
        await item.update({ active: 0 });
      }
    }
    response.setMessage('Menu item deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete menu item');
  }
  res.json(response);
});

// POST /api/menu-items/bulk-delete — Bulk delete or clear all menu items
router.post('/menu-items/bulk-delete', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { ids, deleteAll, store_id } = req.body || {};
    const Op = global.serverdbConnection.Sequelize.Op;

    if (deleteAll) {
      const deleteWhere = store_id ? {
        [Op.or]: [
          { store_id: store_id },
          { store_id: 'STORE_1' },
          { store_id: null }
        ]
      } : {};
      
      try {
        await global.serverdbConnection.Item.destroy({ where: deleteWhere });
      } catch (dErr) {
        await global.serverdbConnection.Item.update({ active: 0 }, { where: deleteWhere });
      }
      response.setMessage('All menu items deleted successfully');
    } else if (Array.isArray(ids) && ids.length > 0) {
      const deleteWhere = {
        [Op.or]: [
          { item_id: { [Op.in]: ids } },
          { item_refid: { [Op.in]: ids } }
        ]
      };
      try {
        await global.serverdbConnection.Item.destroy({ where: deleteWhere });
      } catch (dErr) {
        await global.serverdbConnection.Item.update({ active: 0 }, { where: deleteWhere });
      }
      response.setMessage(`Deleted ${ids.length} menu items successfully`);
    } else {
      response.setStatus(400);
      response.setMessage('No item IDs provided for bulk deletion');
      return res.json(response);
    }

    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to bulk delete menu items');
  }
  res.json(response);
});

// POST /api/menu-items/:id/mark-billed — marks temporary item as billed in database
router.post('/menu-items/:id/mark-billed', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const item = await global.serverdbConnection.Item.findByPk(req.params.id);
    if (item && (item.is_open_item === 1 || item.is_open_item === '1')) {
      await item.update({ active: 0, description: 'BILLED' });
      response.setMessage('Temporary item deleted from POS menu after billing');
      response.setStatus(200);
    } else {
      response.setMessage('Item not found or not temporary');
      response.setStatus(200);
    }
  } catch (err) {
    console.warn('Error marking temp item as billed:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Error marking item as billed');
  }
  res.json(response);
});

module.exports = router;
