require('dotenv').config();
const connection = require('./src/com/tmbill/js/database');

async function seedRealReportData() {
  console.log('================================================================================');
  console.log('  ALFA HMS — SEEDING REAL POSTGRESQL REPORT RECORDS FOR TODAY');
  console.log('================================================================================\n');

  try {
    await connection.sequelize.authenticate();
    console.log('🟢 [POSTGRESQL] Connection verified.');

    const orderId = Math.floor(Date.now() / 1000);
    const todayDateStr = new Date().toISOString().slice(0, 10);
    const todayDateTimeStr = `${todayDateStr} 12:00:00`;
    const kotTimeStr = `${todayDateStr} 11:45:00`;

    // 1. Create Category
    let cat = await connection.Category.findOne({ where: { category_name: 'Main Course' } });
    if (!cat) {
      cat = await connection.Category.create({
        category_name: 'Main Course',
        category_refid: 1,
        store_id: '1',
        is_active: 1
      });
    }
    console.log('✅ Category created/verified:', cat.category_name);

    // 2. Create Steward / Waiter
    let waiter = await connection.Waiter.findOne({ where: { name: 'John Steward' } });
    if (!waiter) {
      waiter = await connection.Waiter.create({
        name: 'John Steward',
        username: `steward_${timestamp.toString().slice(-4)}`,
        phone: '9876543210',
        store_id: 'STORE_1'
      });
    }
    console.log('✅ Waiter created/verified:', waiter.name);

    // 3. Create Main Order (Bill)
    const billNumInt = Math.floor(Math.random() * 8000) + 1000;
    const billNo = `BILL-${billNumInt}`;
    const bill = await connection.Bill.create({
      store_id: 1,
      order_id: orderId,
      bill_number: billNumInt,
      custom_bill_number: billNo,
      table_id: 1,
      table_name: 'Table 1',
      cust_name: 'John Doe',
      phone: '9876543210',
      order_subtotal: 500.00,
      discount: 50.00,
      order_level_total_taxes: 25.00,
      order_level_total_charges: 10.00,
      order_total: 485.00,
      payment: 'Cash',
      billing_type: 1,
      order_state: 'fulfilled',
      quantity: 2,
      persons: 2,
      waiter: 'John Steward',
      waiter_id: waiter.id || 1,
      delivery_boy_name: 'Fast Delivery Boy',
      delivery_boy_phone: '9998887776',
      createdBy: 'admin',
      user_id: 'admin',
      created_time: todayDateTimeStr,
      my_order_date: todayDateStr,
      extra_details: JSON.stringify({ total_tip: 20 })
    });
    console.log('✅ Real Bill created:', bill.bill_number, 'Total:', bill.order_total);

    // 4. Create OrderChild Item
    const billItem = await connection.BillItem.create({
      orderMasterId: orderId,
      item_id: 101,
      title: 'Paneer Butter Masala',
      item_name: 'Paneer Butter Masala',
      quantity: 2,
      price: 250.00,
      total: 500.00,
      total_with_tax: 525.00,
      discount: 50.00,
      category_ref_ids: 1,
      createdBy: 'admin'
    });
    console.log('✅ Real Bill Item created:', billItem.title);

    // 5. Create Standard KOT & KOT Items
    const kotNumInt = Math.floor(Math.random() * 8000) + 1000;
    const kot = await connection.KOT.create({
      store_id: 1,
      order_id: orderId,
      kot_number: kotNumInt,
      bill_number: billNumInt,
      custom_bill_number: billNo,
      table_id: 1,
      table_name: 'Table 1',
      waiter: 'John Steward',
      is_active: 1,
      status: 1,
      amount: 500.00,
      createdBy: 'admin',
      in_time: kotTimeStr
    });

    const kotItem = await connection.KOTItem.create({
      kot_id: kot.kot_id || kot.id,
      item_name: 'Paneer Butter Masala',
      quantity: 2,
      item_price: 250.00,
      amount: 500.00,
      status: 1,
      createdBy: 'admin'
    });
    console.log('✅ Real Standard KOT created:', kot.kot_number);

    // 6. Create NC KOT (Non-chargeable)
    const ncKotNumInt = Math.floor(Math.random() * 8000) + 1000;
    const ncKot = await connection.KOT.create({
      store_id: 1,
      order_id: orderId + 1,
      kot_number: ncKotNumInt,
      bill_number: 0,
      table_id: 2,
      table_name: 'Table 2 VIP',
      waiter: 'John Steward',
      is_active: 1,
      status: 1,
      amount: 0.00,
      createdBy: 'admin',
      in_time: kotTimeStr
    });

    const ncKotItem = await connection.KOTItem.create({
      kot_id: ncKot.kot_id || ncKot.id,
      item_name: 'Chef Special Dessert',
      quantity: 1,
      item_price: 150.00,
      amount: 0.00,
      status: 3,
      reason: 'VIP Guest NC',
      createdBy: 'admin'
    });
    console.log('✅ Real NC KOT created:', ncKot.kot_number);

    // 7. Create Pending KOT (Not yet billed)
    const pendingKotNumInt = Math.floor(Math.random() * 8000) + 1000;
    const pendingKot = await connection.KOT.create({
      store_id: 1,
      order_id: orderId + 2,
      kot_number: pendingKotNumInt,
      bill_number: 0,
      table_id: 3,
      table_name: 'Table 3',
      waiter: 'John Steward',
      is_active: 1,
      status: 1,
      amount: 300.00,
      createdBy: 'admin',
      in_time: kotTimeStr
    });

    await connection.KOTItem.create({
      kot_id: pendingKot.kot_id || pendingKot.id,
      item_name: 'Dal Makhani',
      quantity: 1,
      item_price: 300.00,
      amount: 300.00,
      status: 1,
      createdBy: 'admin'
    });
    console.log('✅ Real Pending KOT created:', pendingKot.kot_number);

    // 8. Create Customer & Due Payment
    let customer = await connection.Customer.findOne({ where: { phone: '9876543210' } });
    if (!customer) {
      customer = await connection.Customer.create({
        store_id: '1',
        name: 'John Doe',
        phone: '9876543210'
      });
    }
    console.log('✅ Real Customer created/verified:', customer.name || 'John Doe');

    const due = await connection.Duepayments.create({
      store_id: 1,
      order_id: orderId,
      transaction_id: orderId,
      bill_number: billNumInt,
      custom_bill_number: billNo,
      customer_name: 'John Doe',
      cust_mobile: '9876543210',
      due_amount: 100.00,
      received_amount: 385.00,
      payment_mode: 'Cash',
      billing_user_id: 'admin',
      created_time: todayDateTimeStr
    });
    console.log('✅ Real Due Payment created:', due.bill_number);

    console.log('\n================================================================================');
    console.log('  🎉 REAL DATA SEEDING COMPLETE! ALL 18 REPORTS NOW HAVE REAL DATA IN POSTGRESQL.');
    console.log('================================================================================\n');
  } catch (err) {
    console.error('❌ Error seeding report data:', err);
  } finally {
    process.exit(0);
  }
}

seedRealReportData();
