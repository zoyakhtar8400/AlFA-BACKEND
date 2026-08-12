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

// POST /api/categories
router.post('/categories', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { id, category_name, name } = req.body;
    const catName = category_name || name || 'New Category';
    let cat;
    if (id) {
      cat = await global.serverdbConnection.Category.findByPk(id);
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
    response.category_id = cat.category_refid || cat.id;
    response.setMessage('Category saved successfully in PostgreSQL');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save category');
  }
  res.json(response);
});

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
    const items = await global.serverdbConnection.Item.findAll({
      where: { active: 1 },
      raw: true
    });

    const categories = await global.serverdbConnection.Category.findAll({ raw: true });

    const mapped = items.map(i => {
      const cat = categories.find(c => String(c.category_refid) === String(i.category_ref_ids) || c.id === i.category_ref_ids);
      return {
        id: i.item_id || i.id,
        item_id: i.item_id || i.id,
        name: i.title || i.item_name || 'Item',
        title: i.title || i.item_name || 'Item',
        price: Number(i.sale_price || i.price || 0),
        sale_price: Number(i.sale_price || i.price || 0),
        categoryId: i.category_ref_ids,
        category: cat ? cat.category_name : 'General',
        foodType: i.food_type === 1 ? 'Veg' : 'Non-Veg',
        taxPercent: 5
      };
    });

    response.data = mapped;
    response.menuItems = mapped;
    response.items = mapped;
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
    const { id, item_id, title, name, price, sale_price, category_ref_ids, food_type, inventory_type, direct_inventory_item_id } = req.body;
    const targetId = id || item_id;
    const itemTitle = title || name || 'Menu Item';
    const itemPrice = Number(price !== undefined ? price : (sale_price || 0));

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
          ...(category_ref_ids && { category_ref_ids }),
          ...(food_type && { food_type: food_type === 'Non-Veg' ? 2 : (food_type === 'Veg' ? 1 : food_type) }),
          ...(inventory_type && { inventory_type })
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
        tax_per: 0,
        tax_value: 0,
        itemsub_total: itemPrice,
        tax_name: 'GST 0%',
        kitchen_dept: validKdId,
        product_group: validPgId,
        tax_discount_method: 1,
        category_ref_ids: finalCatRefId,
        food_type: food_type === 'Non-Veg' ? 2 : 1,
        inventory_type: inventory_type || 'RECIPE',
        direct_inventory_item_id: direct_inventory_item_id || null,
        active: 1,
        is_active: 1,
        store_id: 'STORE_1'
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
    const item = await global.serverdbConnection.Item.findByPk(req.params.id);
    if (item) {
      await item.update({ active: 0, is_active: 0 });
    }
    response.setMessage('Menu item deactivated successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete menu item');
  }
  res.json(response);
});

module.exports = router;
