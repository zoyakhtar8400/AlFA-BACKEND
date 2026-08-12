require('dotenv').config();
const {
  sequelize,
  InventoryItem,
  RecipeMaster,
  RecipeItems,
  Item,
  Supplier,
  ItemGroup,
  Unit,
  PurchaseOrder,
  PurchaseOrderItem,
  StockLedger,
} = require('./src/com/tmbill/js/database');

async function seed() {
  try {
    console.log('🌱 Seeding Sample Inventory, Supplier & Purchase Data into PostgreSQL...');

    await sequelize.authenticate();
    await InventoryItem.sync({ alter: true });
    await RecipeMaster.sync({ alter: true });
    await RecipeItems.sync({ alter: true });
    await StockLedger.sync({ alter: true });
    await Item.sync({ alter: true });
    await Supplier.sync({ alter: true });
    await ItemGroup.sync({ alter: true });
    await Unit.sync({ alter: true });
    await PurchaseOrder.sync({ alter: true });
    await PurchaseOrderItem.sync({ alter: true });

    // 1. Create Suppliers
    const [apSupply] = await Supplier.findOrCreate({
      where: { supplier_name: 'A P SUPPLY' },
      defaults: { contact_person: 'Anil Patel', phone: '9876543210', email: 'ap@supply.com', gstin: '09AAAAA0000A1Z5', current_balance: 15000, is_active: 1 },
    });

    const [metro] = await Supplier.findOrCreate({
      where: { supplier_name: 'Metro Cash & Carry India' },
      defaults: { contact_person: 'Store Manager', phone: '9811223344', email: 'metro@cashcarry.in', gstin: '07BBBBB1111B2Z6', current_balance: 28000, is_active: 1 },
    });

    console.log('✅ Suppliers Seeded:', apSupply.supplier_name, metro.supplier_name);

    // 2. Create Item Groups & Units
    await ItemGroup.findOrCreate({ where: { group_name: 'RAW MATERIAL' }, defaults: { group_type: 'Raw Material', is_active: 1 } });
    await ItemGroup.findOrCreate({ where: { group_name: 'BEVERAGES' }, defaults: { group_type: 'Finished Good', is_active: 1 } });

    await Unit.findOrCreate({ where: { unit_name: 'Kg' }, defaults: { qty_decimal_places: 3, is_active: 1 } });
    await Unit.findOrCreate({ where: { unit_name: 'g' }, defaults: { qty_decimal_places: 3, is_active: 1 } });
    await Unit.findOrCreate({ where: { unit_name: 'Bottle' }, defaults: { qty_decimal_places: 0, is_active: 1 } });

    // 3. Create Raw Materials
    const [paneer] = await InventoryItem.findOrCreate({
      where: { item_name: 'Paneer' },
      defaults: { item_type: 'RAW', unit: 'g', current_stock: 50000, minimum_stock: 5000, purchase_price: 0.3 },
    });

    const [onion] = await InventoryItem.findOrCreate({
      where: { item_name: 'Onion' },
      defaults: { item_type: 'RAW', unit: 'g', current_stock: 20000, minimum_stock: 2000, purchase_price: 0.05 },
    });

    const [butter] = await InventoryItem.findOrCreate({
      where: { item_name: 'Butter' },
      defaults: { item_type: 'RAW', unit: 'g', current_stock: 10000, minimum_stock: 1000, purchase_price: 0.5 },
    });

    // 4. Create Finished Goods
    const [cocaCola] = await InventoryItem.findOrCreate({
      where: { item_name: 'Coca Cola 250ml' },
      defaults: { item_type: 'FINISHED', unit: 'Bottle', current_stock: 24, minimum_stock: 5, purchase_price: 20, selling_price: 40 },
    });

    // 5. Create Sample Purchase Orders
    const [po1] = await PurchaseOrder.findOrCreate({
      where: { po_number: 'PO-100001' },
      defaults: { supplier_id: apSupply.supplier_id, order_date: new Date(), status: 'ISSUED', gross_amount: 15000, net_amount: 15000, notes: 'Monthly raw ingredient supply', is_active: 1 },
    });

    await PurchaseOrderItem.findOrCreate({
      where: { po_id: po1.po_id, inventory_item_id: paneer.inventory_item_id },
      defaults: { order_qty: 50, unit: 'Kg', unit_price: 300, total_amount: 15000, department: 'PURCHASE STORE' },
    });

    console.log('✅ Purchase Orders Seeded in PostgreSQL');

    // 6. Map Recipe for Paneer Tikka
    let paneerTikkaMenuItem = await Item.findOne({ where: { title: 'Paneer Tikka' } });
    if (!paneerTikkaMenuItem) {
      paneerTikkaMenuItem = await Item.create({ title: 'Paneer Tikka', sale_price: 350, inventory_type: 'RECIPE', active: 1 });
    } else {
      await paneerTikkaMenuItem.update({ inventory_type: 'RECIPE' });
    }

    let [recipe] = await RecipeMaster.findOrCreate({
      where: { menu_item_id: paneerTikkaMenuItem.item_id },
      defaults: { recipe_name: 'Paneer Tikka Standard Recipe', yield_qty: 1, is_active: 1 },
    });

    await RecipeItems.destroy({ where: { recipe_id: recipe.recipe_id } });
    await RecipeItems.bulkCreate([
      { recipe_id: recipe.recipe_id, inventory_item_id: paneer.inventory_item_id, quantity: 200, unit: 'g', is_active: 1 },
      { recipe_id: recipe.recipe_id, inventory_item_id: onion.inventory_item_id, quantity: 50, unit: 'g', is_active: 1 },
      { recipe_id: recipe.recipe_id, inventory_item_id: butter.inventory_item_id, quantity: 20, unit: 'g', is_active: 1 },
    ]);

    // 7. Map Finished Good (Coca Cola)
    let cokeMenuItem = await Item.findOne({ where: { title: 'Coca Cola' } });
    if (!cokeMenuItem) {
      cokeMenuItem = await Item.create({ title: 'Coca Cola', sale_price: 40, inventory_type: 'DIRECT', direct_inventory_item_id: cocaCola.inventory_item_id, active: 1 });
    } else {
      await cokeMenuItem.update({ inventory_type: 'DIRECT', direct_inventory_item_id: cocaCola.inventory_item_id });
    }

    console.log('🎉 Seeding Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seed();
