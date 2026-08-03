let connection = require('../js/database');
let stringConstructor = 'test'.constructor;

async function getBills({
  store_id,
  username,
  fromDate,
  toDate,
  limit,
  offset,
}) {
  let bills = [];
  try {
    if (store_id) {
      const where = { store_id };
      // Get bill's by captain or terminal which referes to createdBy
      if (username) {
        where.createdBy = username;
      }
      if (fromDate && toDate) {
        where.created_time = {
          [connection.Sequelize.Op.between]: [fromDate, toDate],
        };
      }
      bills = await connection.Bill.findAndCountAll({
        limit,
        offset,
        attributes: [
          'id',
          'order_id',
          'store_id',
          'table_id',
          'table_name',
          'user_id',
          'cust_name',
          'phone',
          'email',
          'is_guest_mode',
          'line_1',
          'line_2',
          'discount',
          'charges',
          'delivery_type',
          'instructions',
          'quantity',
          'order_level_total_charges',
          'order_level_total_taxes',
          'order_state',
          'order_subtotal',
          'order_total',
          'my_order_date',
          'created_time',
          'payment',
          'items',
          'order_check_flag',
          'billing_type',
          'print_status',
          'draftprint_status',
          'payment_id',
          'persons',
          'bill_number',
          'custom_bill_number',
          'sync_status',
          'order_flag',
          'deliveryboy_id',
          'total_external_discount',
          'delivery_boy_name',
          'delivery_boy_phone',
          'createdBy',
          'inventoryReduced',
          'couponDisount',
          'couponDisounttype',
          'coupon',
          'couponDisounttotal',
          'issectionwisebilling',
          'due_payment',
          'hasDuepayment',
          'order_kotflag',
          'cust_paid_amount',
          'waiter',
          'waiter_id',
          'rbt_temprature',
          'charges_level_total_tax',
          ['order_id', 'key'],
        ],
        include: [
          {
            as: 'tmpos_order_child',
            model: connection.BillItem,
            attributes: [
              'id',
              'title',
              'quantity',
              'price',
              'total',
              ['id', 'key'],
            ],
          },
        ],
        where,
        order: [['id', 'DESC']],
        distinct: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
  return bills;
}

async function getPaymentmodes(store_id) {
  let payments = [];
  try {
    payments = await connection.Payment.findAll({
      raw: true,
      where: {
        //NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });
  } catch (error) {
    payments = [];
  }
  return payments;
}

async function deleteOrderById(orderDetails, billDetails, transaction) {
  try {
    await connection.BillCharges.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    //PreOrder
    await connection.PreOrder.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    await connection.BillItemOption.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    await connection.Orderchildcharges.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    await connection.BillItem.destroy({
      where: {
        orderMasterId: orderDetails.order_id,
      },
      transaction,
    });

    await connection.Bill.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    await connection.KOT.update(
      {
        discount_id: 0,
        discount_type: 0,
        discount_rate: 0,
        couponDisount: 0,
        couponDisounttype: 0,
        discount_title: '',
        discounted_product_groups: undefined,
      },
      {
        where: {
          bill_number: orderDetails.order_id,
        },
        transaction,
      },
    );
    // if(orderDetails.extra_details){
    //   let extra_details;
    //   if (orderDetails.extra_details.constructor === stringConstructor) {
    //     extra_details = JSON.parse(orderDetails.extra_details);
    //   } else {
    //     extra_details = orderDetails.extra_details;
    //   }

    //   if(extra_details.discount){
    //     delete extra_details.discount
    //     orderDetails.extra_details = JSON.stringify(extra_details)
    //   }
    // }

    if (billDetails.extra_details) {
      let extra_details;
      if (billDetails.extra_details.constructor === stringConstructor) {
        extra_details = JSON.parse(billDetails.extra_details);
      } else {
        extra_details = billDetails.extra_details;
      }

      if (extra_details.discount) {
        delete extra_details.discount;
        billDetails.discount = 0;
        billDetails.discounted_product_groups = undefined;
        billDetails.extra_details = extra_details;
      }
    }
    await connection.SectionwiseDiscounthistory.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    await connection.CoupondiscountHistory.destroy({
      where: {
        order_id: orderDetails.order_id,
      },
      transaction,
    });

    // if coupon discount is applied then set coupon discount 0
    if (billDetails.coupon && billDetails.couponDisount) {
      Object.assign(billDetails, {
        coupon: '',
        couponDisount: 0,
      });
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = {
  getBills,
  getPaymentmodes,
  deleteOrderById,
};
