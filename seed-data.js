require('dotenv').config();
const db = require('./src/com/tmbill/js/database');
const CryptoJS = require('crypto-js');
const { Config } = require('./src/com/tmbill/config/config');

async function seedTestData() {
  try {
    console.log('🌱 Starting Comprehensive PostgreSQL Database Seeding...');

    // Sync database models
    await db.sequelize.sync({ force: false });
    console.log('✅ Database models synchronized with PostgreSQL.');

    const defaultStore = 'STORE_1';

    // 0. Admin User
    const encryptedPassword = CryptoJS.AES.encrypt('admin', Config.cipherKey).toString();
    await db.User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        name: 'System Admin',
        username: 'admin',
        password: encryptedPassword,
        store_id: defaultStore,
        status: 1
      }
    });
    console.log('✔ Admin User created');

    // 1. Department
    const [dept] = await db.Department.findOrCreate({
      where: { department_name: 'Main Kitchen' },
      defaults: { department_name: 'Main Kitchen', store_id: defaultStore, is_active: 1 }
    });

    // 2. Categories
    const categoriesList = [
      { name: 'Starters', refId: 101 },
      { name: 'Main Course', refId: 102 },
      { name: 'Breads & Rice', refId: 103 },
      { name: 'Beverages', refId: 104 },
      { name: 'Desserts', refId: 105 },
      { name: 'Fast Food', refId: 106 }
    ];

    for (const cat of categoriesList) {
      const existing = await db.Category.findOne({ where: { category_name: cat.name } });
      if (!existing) {
        try {
          await db.Category.create({
            category_name: cat.name,
            category_refid: cat.refId,
            store_id: defaultStore,
            is_active: 1
          });
        } catch (e) {
          // ignore duplicate refid
        }
      }
    }
    console.log('✔ Categories seeded');

    // 3. Menu Items
    const sampleItems = [
      { title: 'Paneer Tikka', sale_price: 240, food_type: 1, category_ref_ids: 101 },
      { title: 'Butter Chicken', sale_price: 450, food_type: 2, category_ref_ids: 102 },
      { title: 'Chicken Biryani', sale_price: 400, food_type: 2, category_ref_ids: 102 },
      { title: 'Dal Makhani', sale_price: 160, food_type: 1, category_ref_ids: 102 },
      { title: 'Garlic Naan', sale_price: 100, food_type: 1, category_ref_ids: 103 },
      { title: 'Tandoori Roti', sale_price: 30, food_type: 1, category_ref_ids: 103 },
      { title: 'Jeera Rice', sale_price: 200, food_type: 1, category_ref_ids: 103 },
      { title: 'Cold Drink', sale_price: 70, food_type: 1, category_ref_ids: 104 },
      { title: 'Gulab Jamun', sale_price: 90, food_type: 1, category_ref_ids: 105 },
      { title: 'French Fries', sale_price: 140, food_type: 1, category_ref_ids: 106 }
    ];

    for (const item of sampleItems) {
      const existing = await db.Item.findOne({ where: { title: item.title } });
      if (!existing) {
        await db.Item.create({
          ...item,
          store_id: defaultStore,
          active: 1
        });
      }
    }
    console.log('✔ Menu Items seeded');

    // 4. Dining Tables
    const diningTables = [
      { name: 'Table 1', seats: '4', order_state: 'Blank', extra: { floor: 'Ground', section: 'Main Area', amount: 0, waiter: null, customer: 'Walk-in' } },
      { name: 'Table 2', seats: '2', order_state: 'Running', extra: { floor: 'Ground', section: 'Main Area', amount: 360, waiter: 'Rahul', customer: 'Walk-in' } },
      { name: 'Table 3', seats: '6', order_state: 'Reserved', extra: { floor: 'First Floor', section: 'AC Section', amount: 0, waiter: 'Aman', customer: 'Vikram Mehta' } },
      { name: 'Table 4', seats: '4', order_state: 'Blank', extra: { floor: 'Ground', section: 'Main Area', amount: 0, waiter: null, customer: 'Walk-in' } },
      { name: 'Table 5', seats: '8', order_state: 'Cleaning', extra: { floor: 'Balcony', section: 'Open Terrace', amount: 0, waiter: null, customer: 'Walk-in' } }
    ];

    for (const t of diningTables) {
      const existing = await db.Table.findOne({ where: { table_name: t.name } });
      if (!existing) {
        await db.Table.create({
          table_name: t.name,
          max_person: t.seats,
          department: dept.id || 1,
          store_id: defaultStore,
          isactive: 1,
          order_state: t.order_state,
          extra_details: t.extra
        });
      }
    }
    console.log('✔ Dining Tables seeded');

    // 5. Sample KOT Records
    const sampleKots = [
      {
        kot_no: 'KOT-402',
        custom_bill_number: 'KOT-402',
        table_id: 2,
        table_no: '2',
        status: 2, // Cooking / Preparing
        in_time: '12:40 PM',
        waiter: 'Rahul',
        amount: 450,
        items: [
          { name: 'Butter Chicken', qty: 1, price: 450 }
        ]
      },
      {
        kot_no: 'KOT-403',
        custom_bill_number: 'KOT-403',
        table_id: 3,
        table_no: '3',
        status: 1, // Sent to Kitchen
        in_time: '12:45 PM',
        waiter: 'Aman',
        amount: 540,
        items: [
          { name: 'Chicken Biryani', qty: 1, price: 400 },
          { name: 'Cold Drink', qty: 2, price: 70 }
        ]
      },
      {
        kot_no: 'KOT-404',
        custom_bill_number: 'KOT-404',
        table_id: 4,
        table_no: '4',
        status: 3, // Ready
        in_time: '12:35 PM',
        waiter: 'Staff',
        amount: 360,
        items: [
          { name: 'Dal Makhani', qty: 1, price: 160 },
          { name: 'Jeera Rice', qty: 1, price: 200 }
        ]
      }
    ];

    for (const k of sampleKots) {
      let createdKot = await db.KOT.findOne({ where: { custom_bill_number: k.custom_bill_number } });
      if (!createdKot) {
        createdKot = await db.KOT.create({
          kot_no: k.kot_no,
          custom_bill_number: k.custom_bill_number,
          table_id: k.table_id,
          table_no: k.table_no,
          store_id: defaultStore,
          status: k.status,
          in_time: k.in_time,
          waiter: k.waiter,
          amount: k.amount,
          is_active: 1
        });
      }

      if (k.items && k.items.length > 0) {
        for (const it of k.items) {
          const existingItem = await db.KOTItem.findOne({ where: { kot_id: createdKot.kot_id, item_name: it.name } });
          if (!existingItem) {
            await db.KOTItem.create({
              kot_id: createdKot.kot_id,
              item_id: 1,
              item_name: it.name,
              quantity: it.qty,
              item_price: it.price,
              amount: it.qty * it.price,
              store_id: defaultStore
            });
          }
        }
      }
    }
    console.log('✔ KOT tickets seeded');

    // 6. Sample Orders
    const sampleOrders = [
      {
        order_number: 1,
        custom_bill_number: 'BILL-101',
        table_id: 2,
        table_name: 'Table 2',
        subtotal: 360,
        total_tax: 18,
        total_amount: 378,
        order_total: 378,
        order_state: 'pending',
        payment_status: 'Unpaid',
        customer_name: 'Rahul Sharma',
        phone: '9876543210',
        waiter: 'Rahul',
        order_type: 'DINE_IN',
        items: [
          { name: 'Paneer Tikka', qty: 1, price: 180 },
          { name: 'Tandoori Roti', qty: 6, price: 30 }
        ]
      },
      {
        order_number: 2,
        custom_bill_number: 'BILL-102',
        table_id: 3,
        table_name: 'Table 3',
        subtotal: 560,
        total_tax: 28,
        total_amount: 588,
        order_total: 588,
        order_state: 'pending',
        payment_status: 'Unpaid',
        customer_name: 'Vikram Mehta',
        phone: '9888877777',
        waiter: 'Aman',
        order_type: 'DINE_IN',
        items: [
          { name: 'Chicken Biryani', qty: 1, price: 400 },
          { name: 'Dal Makhani', qty: 1, price: 160 }
        ]
      }
    ];

    for (const o of sampleOrders) {
      let createdBill = await db.Bill.findOne({ where: { custom_bill_number: o.custom_bill_number } });
      if (!createdBill) {
        createdBill = await db.Bill.create({
          table_id: o.table_id,
          table_name: o.table_name,
          store_id: defaultStore,
          subtotal: o.subtotal,
          total_tax: o.total_tax,
          total_amount: o.total_amount,
          order_total: o.order_total,
          order_state: o.order_state,
          payment_status: o.payment_status,
          customer_name: o.customer_name,
          phone: o.phone,
          waiter: o.waiter,
          order_type: o.order_type,
          custom_bill_number: o.custom_bill_number,
          order_number: o.order_number,
          bill_date: new Date()
        });
      }

      if (o.items && o.items.length > 0) {
        for (const it of o.items) {
          const existingItem = await db.BillItem.findOne({ where: { order_id: createdBill.order_id, item_name: it.name } });
          if (!existingItem) {
            await db.BillItem.create({
              order_id: createdBill.order_id,
              orderMasterId: createdBill.order_id,
              item_id: 1,
              item_name: it.name,
              quantity: it.qty,
              price: it.price,
              total: it.qty * it.price,
              store_id: defaultStore
            });
          }
        }
      }
    }
    console.log('✔ Orders seeded');

    console.log('\n🎉 ALL REAL RESTAURANT DATA SEEDED SUCCESSFULLY INTO POSTGRESQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
}

seedTestData();
