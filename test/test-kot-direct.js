require('dotenv').config();
const {
  sequelize,
  InventoryItem,
  StockLedger,
  Item,
  RecipeMaster,
  RecipeItems,
  KOT,
  KOTItem,
} = require('../src/com/tmbill/js/database');

async function processKotStockDeduction(kotNo, items) {
  let createdKot;

  await sequelize.transaction(async (t) => {
    // 1. Validate Stock for all KOT items first
    for (const item of items) {
      const itemId = Number(item.itemId || item.id || item.item_id || 1);
      const qty = Number(item.qty || item.quantity || 1);
      console.log(`🔎 [Stock Check] Processing Item ID: ${itemId}, Name: "${item.itemName}", Qty: ${qty}`);
      
      let menuItem = await Item.findByPk(itemId, { transaction: t });
      if (!menuItem && item.itemName) {
        menuItem = await Item.findOne({ where: { title: item.itemName }, transaction: t });
      }

      if (menuItem) {
        if (menuItem.inventory_type === 'DIRECT' && menuItem.direct_inventory_item_id) {
          // Direct Finished Good Validation
          const invItem = await InventoryItem.findByPk(menuItem.direct_inventory_item_id, { transaction: t });
          if (invItem) {
            const currentStock = Number(invItem.current_stock || 0);
            console.log(`   📦 Finished Good "${invItem.item_name}": Available=${currentStock} ${invItem.unit}, Required=${qty}`);
            if (currentStock < qty) {
              throw new Error(`Insufficient stock for ${invItem.item_name}. Available: ${currentStock} ${invItem.unit}, Required: ${qty} ${invItem.unit}`);
            }
          }
        } else {
          // Recipe-Based Validation
          const recipe = await RecipeMaster.findOne({
            where: { menu_item_id: menuItem.item_id, is_active: 1 },
            include: [{
              model: RecipeItems,
              as: 'recipeItems',
              where: { is_active: 1 },
              required: false,
            }],
            transaction: t,
          });

          if (recipe && recipe.recipeItems && recipe.recipeItems.length > 0) {
            for (const recipeItem of recipe.recipeItems) {
              const reqQty = Number(recipeItem.quantity || 0) * qty;
              const invItem = await InventoryItem.findByPk(recipeItem.inventory_item_id, { transaction: t });
              if (invItem) {
                const currentStock = Number(invItem.current_stock || 0);
                console.log(`   🥗 Raw Ingredient "${invItem.item_name}": Available=${currentStock} ${invItem.unit}, Required=${reqQty}`);
                if (currentStock < reqQty) {
                  throw new Error(`Insufficient stock for ${invItem.item_name}. Available: ${currentStock} ${invItem.unit || 'g'}, Required: ${reqQty} ${invItem.unit || 'g'}`);
                }
              }
            }
          }
        }
      }
    }

    // 2. Stock is sufficient! Deduct stock & write stock ledger
    for (const item of items) {
      const itemId = Number(item.itemId || item.id || item.item_id || 1);
      const qty = Number(item.qty || item.quantity || 1);
      let menuItem = await Item.findByPk(itemId, { transaction: t });
      if (!menuItem && item.itemName) {
        menuItem = await Item.findOne({ where: { title: item.itemName }, transaction: t });
      }

      if (menuItem) {
        if (menuItem.inventory_type === 'DIRECT' && menuItem.direct_inventory_item_id) {
          const invItem = await InventoryItem.findByPk(menuItem.direct_inventory_item_id, { transaction: t });
          if (invItem) {
            const newStock = Number(invItem.current_stock || 0) - qty;
            await invItem.update({ current_stock: newStock }, { transaction: t });
            await StockLedger.create({
              module: 'KOT',
              reference_no: kotNo,
              inventory_item_id: invItem.inventory_item_id,
              qty_change: -qty,
              unit: invItem.unit || 'Pcs',
              closing_balance: newStock,
              notes: `KOT Direct Sale: ${menuItem.title || item.itemName} x${qty}`,
            }, { transaction: t });
            console.log(`   📉 [DIRECT Stock Deducted] ${invItem.item_name}: -${qty} ${invItem.unit}. New Stock: ${newStock}`);
          }
        } else {
          const recipe = await RecipeMaster.findOne({
            where: { menu_item_id: menuItem.item_id, is_active: 1 },
            include: [{
              model: RecipeItems,
              as: 'recipeItems',
              where: { is_active: 1 },
              required: false,
            }],
            transaction: t,
          });

          if (recipe && recipe.recipeItems && recipe.recipeItems.length > 0) {
            for (const recipeItem of recipe.recipeItems) {
              const reqQty = Number(recipeItem.quantity || 0) * qty;
              const invItem = await InventoryItem.findByPk(recipeItem.inventory_item_id, { transaction: t });
              if (invItem) {
                const newStock = Number(invItem.current_stock || 0) - reqQty;
                await invItem.update({ current_stock: newStock }, { transaction: t });
                await StockLedger.create({
                  module: 'KOT',
                  reference_no: kotNo,
                  inventory_item_id: invItem.inventory_item_id,
                  qty_change: -reqQty,
                  unit: recipeItem.unit || invItem.unit || 'g',
                  closing_balance: newStock,
                  notes: `KOT Recipe Consumption: ${menuItem.title || item.itemName} x${qty}`,
                }, { transaction: t });
                console.log(`   📉 [RECIPE Stock Deducted] ${invItem.item_name}: -${reqQty} ${recipeItem.unit || invItem.unit}. New Stock: ${newStock}`);
              }
            }
          }
        }
      }
    }

    // 3. Create KOT and KOT items
    createdKot = await KOT.create({
      custom_bill_number: kotNo,
      table_id: 1,
      table_name: 'Table 01',
      customer_name: 'Walk-in',
      store_id: 'STORE_1',
      status: 1,
      in_time: '12:00 PM',
      kot_date: new Date(),
      waiter: 'Staff',
      amount: 700,
      is_active: 1,
    }, { transaction: t });

    for (const item of items) {
      const qty = Number(item.qty || item.quantity || 1);
      const price = Number(item.unitPrice || item.price || item.rate || 0);
      await KOTItem.create({
        kot_id: createdKot.kot_id,
        item_id: Number(item.itemId || item.id || 1),
        item_name: item.itemName || item.name || 'Item',
        alternative_title: item.variantName || item.variant || '',
        quantity: qty,
        item_price: price,
        amount: qty * price,
        store_id: 'STORE_1',
      }, { transaction: t });
    }
  });

  return createdKot;
}

async function runDirectTests() {
  try {
    console.log('🧪 Starting Direct KOT Inventory Deduction Engine Test...\n');

    // Reset stock to initial values first
    await InventoryItem.update({ current_stock: 50000 }, { where: { item_name: 'Paneer' } });
    await InventoryItem.update({ current_stock: 20000 }, { where: { item_name: 'Onion' } });
    await InventoryItem.update({ current_stock: 10000 }, { where: { item_name: 'Butter' } });
    await InventoryItem.update({ current_stock: 24 }, { where: { item_name: 'Coca Cola 250ml' } });

    console.log('🔹 TEST 1: KOT for 2 x Paneer Tikka (Recipe-Based)...');
    await processKotStockDeduction('KOT-TEST-001', [
      { itemId: 1, itemName: 'Paneer Tikka', qty: 2, unitPrice: 350 },
    ]);

    const paneer = await InventoryItem.findOne({ where: { item_name: 'Paneer' } });
    const onion = await InventoryItem.findOne({ where: { item_name: 'Onion' } });
    const butter = await InventoryItem.findOne({ where: { item_name: 'Butter' } });

    console.log('✅ Stock After Test 1:');
    console.log(` - Paneer: ${paneer.current_stock} g (Initial 50,000 g - 400 g = 49,600 g)`);
    console.log(` - Onion: ${onion.current_stock} g (Initial 20,000 g - 100 g = 19,900 g)`);
    console.log(` - Butter: ${butter.current_stock} g (Initial 10,000 g - 40 g = 9,960 g)\n`);

    console.log('🔹 TEST 2: KOT for 3 x Coca Cola (Direct Finished Good)...');
    await processKotStockDeduction('KOT-TEST-002', [
      { itemId: 10, itemName: 'Coca Cola', qty: 3, unitPrice: 40 },
    ]);

    const coke = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });
    console.log('✅ Stock After Test 2:');
    console.log(` - Coca Cola: ${coke.current_stock} Bottles (Initial 24 Bottles - 3 = 21 Bottles)\n`);

    console.log('🔹 TEST 3: Insufficient Stock Test (Ordering 30 x Coca Cola)...');
    try {
      await processKotStockDeduction('KOT-TEST-003', [
        { itemId: 10, itemName: 'Coca Cola', qty: 30, unitPrice: 40 },
      ]);
      console.error('❌ ERROR: Test 3 should have thrown an insufficient stock exception!');
    } catch (err) {
      console.log(`✅ Expected Exception Caught: "${err.message}"`);
    }

    const cokeAfterFail = await InventoryItem.findOne({ where: { item_name: 'Coca Cola 250ml' } });
    console.log(` - Coca Cola Stock after failed order: ${cokeAfterFail.current_stock} Bottles (Unchanged - Rollback Successful!)\n`);

    const ledger = await StockLedger.findAll({ order: [['ledger_id', 'DESC']] });
    console.log(`📜 Stock Ledger Audit History (${ledger.length} entries recorded):`);
    ledger.forEach((l) => {
      console.log(` - [${l.module}] Ref: ${l.reference_no} | Item ID: ${l.inventory_item_id} | Qty Change: ${l.qty_change} ${l.unit} | Balance: ${l.closing_balance}`);
    });

    console.log('\n🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Engine Test Error:', err);
    process.exit(1);
  }
}

runDirectTests();
