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
        id: i.id,
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

module.exports = router;
