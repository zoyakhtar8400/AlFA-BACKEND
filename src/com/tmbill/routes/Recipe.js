const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();

// GET all inventory items (Raw Materials & Finished Goods)
router.get('/inventory-items', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { item_type } = req.query;
    const whereClause = { is_active: 1 };
    if (item_type) {
      whereClause.item_type = item_type.toUpperCase();
    }
    const items = await global.serverdbConnection.InventoryItem.findAll({
      where: whereClause,
      order: [['item_name', 'ASC']],
      raw: true,
    });
    response.data = items;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch inventory items');
  }
  res.json(response);
});

// POST create/update inventory item
router.post('/inventory-items', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const {
      inventory_item_id,
      item_name,
      item_type, // 'RAW' or 'FINISHED'
      unit,
      current_stock,
      minimum_stock,
      purchase_price,
      selling_price,
    } = req.body;

    if (!item_name) {
      throw new Error('Item name is required');
    }

    let item;
    if (inventory_item_id) {
      item = await global.serverdbConnection.InventoryItem.findByPk(inventory_item_id);
      if (!item) throw new Error('Inventory item not found');
      await item.update({
        item_name,
        item_type: item_type ? item_type.toUpperCase() : item.item_type,
        unit: unit || item.unit,
        current_stock: current_stock !== undefined ? current_stock : item.current_stock,
        minimum_stock: minimum_stock !== undefined ? minimum_stock : item.minimum_stock,
        purchase_price: purchase_price !== undefined ? purchase_price : item.purchase_price,
        selling_price: selling_price !== undefined ? selling_price : item.selling_price,
      });
    } else {
      item = await global.serverdbConnection.InventoryItem.create({
        item_name,
        item_type: item_type ? item_type.toUpperCase() : 'RAW',
        unit: unit || 'Kg',
        current_stock: current_stock || 0,
        minimum_stock: minimum_stock || 0,
        purchase_price: purchase_price || 0,
        selling_price: selling_price || 0,
        is_active: 1,
      });
    }

    response.data = item;
    response.setMessage('Inventory item saved successfully');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving inventory item:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save inventory item');
  }
  res.json(response);
});

// PUT update inventory item
router.put('/inventory-items/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const item = await global.serverdbConnection.InventoryItem.findByPk(req.params.id);
    if (!item) throw new Error('Inventory item not found');
    await item.update(req.body);
    response.data = item;
    response.setMessage('Inventory item updated successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update inventory item');
  }
  res.json(response);
});

// DELETE inventory item
router.delete('/inventory-items/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const item = await global.serverdbConnection.InventoryItem.findByPk(req.params.id);
    if (item) {
      await item.update({ is_active: 0 });
    }
    response.setMessage('Inventory item deleted successfully');
    response.setStatus(200);
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete inventory item');
  }
  res.json(response);
});

// GET all recipes
router.get('/recipes', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const recipes = await global.serverdbConnection.RecipeMaster.findAll({
      where: { is_active: 1 },
      include: [
        {
          model: global.serverdbConnection.RecipeItems,
          as: 'recipeItems',
          where: { is_active: 1 },
          required: false,
          include: [{ model: global.serverdbConnection.InventoryItem }],
        },
      ],
    });
    response.data = recipes;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch recipes');
  }
  res.json(response);
});

// GET single recipe by menu_item_id
router.get('/recipes/menu-item/:menu_item_id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const menuItemId = req.params.menu_item_id;
    const recipe = await global.serverdbConnection.RecipeMaster.findOne({
      where: { menu_item_id: menuItemId, is_active: 1 },
      include: [
        {
          model: global.serverdbConnection.RecipeItems,
          as: 'recipeItems',
          where: { is_active: 1 },
          required: false,
          include: [{ model: global.serverdbConnection.InventoryItem }],
        },
      ],
    });
    response.data = recipe;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching recipe for menu item:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch recipe');
  }
  res.json(response);
});

// POST Save/Update Recipe for Menu Item
router.post('/recipes', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { menu_item_id, recipe_name, yield_qty, ingredients } = req.body;

    if (!menu_item_id) {
      throw new Error('menu_item_id is required');
    }

    let recipe = await global.serverdbConnection.RecipeMaster.findOne({
      where: { menu_item_id, is_active: 1 },
    });

    if (!recipe) {
      recipe = await global.serverdbConnection.RecipeMaster.create({
        menu_item_id,
        recipe_name: recipe_name || `Recipe for item ${menu_item_id}`,
        yield_qty: yield_qty || 1,
        is_active: 1,
      });
    } else {
      await recipe.update({
        recipe_name: recipe_name || recipe.recipe_name,
        yield_qty: yield_qty || recipe.yield_qty,
      });
      // Deactivate old recipe items
      await global.serverdbConnection.RecipeItems.update(
        { is_active: 0 },
        { where: { recipe_id: recipe.recipe_id } }
      );
    }

    // Insert new recipe items
    const ingredientList = Array.isArray(ingredients) ? ingredients : (Array.isArray(req.body.items) ? req.body.items : []);
    if (ingredientList.length > 0) {
      for (const ing of ingredientList) {
        await global.serverdbConnection.RecipeItems.create({
          recipe_id: recipe.recipe_id,
          inventory_item_id: ing.inventory_item_id || ing.id,
          quantity: ing.quantity || ing.qty || 0,
          unit: ing.unit || 'g',
          is_active: 1,
        });
      }
    }

    // Update menu item inventory_type to RECIPE
    await global.serverdbConnection.Item.update(
      { inventory_type: 'RECIPE', direct_inventory_item_id: null },
      { where: { item_id: menu_item_id } }
    );

    response.data = recipe;
    response.setMessage('Recipe saved successfully');
    response.setStatus(200);
  } catch (err) {
    console.error('Error saving recipe:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save recipe');
  }
  res.json(response);
});

// POST Link Menu Item directly to Finished Good (DIRECT)
router.post('/menu-item/direct-link', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { menu_item_id, direct_inventory_item_id } = req.body;
    if (!menu_item_id || !direct_inventory_item_id) {
      throw new Error('menu_item_id and direct_inventory_item_id are required');
    }

    await global.serverdbConnection.Item.update(
      {
        inventory_type: 'DIRECT',
        direct_inventory_item_id,
      },
      { where: { item_id: menu_item_id } }
    );

    response.setMessage('Menu item linked directly to finished good inventory');
    response.setStatus(200);
  } catch (err) {
    console.error('Error linking direct menu item:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to link direct menu item');
  }
  res.json(response);
});

// GET Stock Ledger history
router.get('/stock-ledger', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { inventory_item_id } = req.query;
    const whereClause = {};
    if (inventory_item_id) {
      whereClause.inventory_item_id = inventory_item_id;
    }
    const ledger = await global.serverdbConnection.StockLedger.findAll({
      where: whereClause,
      order: [['ledger_id', 'DESC']],
      include: [{ model: global.serverdbConnection.InventoryItem }],
    });
    response.data = ledger;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching stock ledger:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch stock ledger');
  }
  res.json(response);
});

module.exports = router;
