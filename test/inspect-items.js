require('dotenv').config();
const { Item, RecipeMaster, RecipeItems, InventoryItem } = require('../src/com/tmbill/js/database');

async function check() {
  const items = await Item.findAll({ raw: true });
  console.log('All Items in DB:', items.map(i => ({ id: i.item_id, title: i.title, inventory_type: i.inventory_type, direct_id: i.direct_inventory_item_id })));

  const recipes = await RecipeMaster.findAll({
    include: [{ model: RecipeItems, as: 'recipeItems' }],
  });
  console.log('Recipes in DB:', JSON.stringify(recipes, null, 2));

  process.exit(0);
}

check();
