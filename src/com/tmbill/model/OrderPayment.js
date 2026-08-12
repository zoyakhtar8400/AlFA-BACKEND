const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const OrderPaymentMode = sequelize.define(
    util.DBDetails.Tables.MPOS_ORDER_PAYEMENT,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
      },
      payment_option: {
        type: type.STRING,
      },
      amount: {
        type: type.DECIMAL(10, 2),
      },
      status_flag: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER_PAYEMENT,
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['order_id', 'payment_option'],
        },
      ],
    },
  );

  OrderPaymentMode.getTodayspayments = async function (store_id, user_id) {
    let query =
      'SELECT payment_option, SUM(AMOUNT) as amount,count(payment_option) as transactions FROM mpos_order_payment' +
      ' left join mpos_order  on mpos_order_payment.order_id=mpos_order.order_id' +
      ' where mpos_order.my_order_date=date() ' +
      ' AND store_id=:store_id' +
      ' AND mpos_order.order_state="fulfilled"' +
      ' AND user_id=:user_id ' +
      ' GROUP BY payment_option';

    let payments = await sequelize.query(query, {
      model: this,
      mapToModel: true,
      replacements: { store_id: store_id, user_id: user_id },
      type: sequelize.QueryTypes.SELECT,
    });

    return payments;
  };
  OrderPaymentMode.getPayments = async function ({
    store_id,
    fromDate,
    toDate,
    user_id,
    order_state,
    groupBy,
  }) {
    let subquery =
      `SELECT ` +
      ` payment_option,` +
      ` SUM(CAST(COALESCE(p.amount, 0) AS numeric)) as amount, mpos_order.order_state as order_state,` +
      ` count(payment_option) as transactions, count(payment_option) as count ` +
      ` FROM (SELECT order_id, payment_option, amount from mpos_order_payment) as p ` +
      ` left join mpos_order on CAST(p.order_id AS text) = CAST(mpos_order.order_id AS text) where ` +
      ` $date ` +
      ` $order_state ` +
      ` $userId ` +
      ` CAST(mpos_order.store_id AS text) = :store_id GROUP BY $groupBy`;

    if (fromDate && toDate) {
      const fDate = String(fromDate).replace(/'/g, '').slice(0, 10);
      const tDate = String(toDate).replace(/'/g, '').slice(0, 10);
      subquery = subquery.replace(
        '$date',
        ` (mpos_order.my_order_date BETWEEN '${fDate}' and '${tDate}' OR mpos_order.my_order_date IS NULL) AND `,
      );
    } else {
      subquery = subquery.replace('$date', '');
    }
    if (user_id) {
      subquery = subquery.replace('$userId', ` mpos_order.user_id='${user_id}' AND `);
    } else {
      subquery = subquery.replace('$userId', '');
    }
    if (order_state) {
      subquery = subquery.replace(
        '$order_state',
        ` mpos_order.order_state in (${order_state}) AND `,
      );
    } else {
      subquery = subquery.replace(
        '$order_state',
        ` mpos_order.order_state IN ('fulfilled', 'completed', 'free') AND `,
      );
    }

    if (groupBy) {
      subquery = subquery.replace('$groupBy', `${groupBy}`);
    } else {
      subquery = subquery.replace('$groupBy', 'payment_option, mpos_order.order_state');
    }

    let payments = await sequelize.query(subquery, {
      model: this,
      mapToModel: true,
      raw: true,
      replacements: { store_id: String(store_id) },
      type: sequelize.QueryTypes.SELECT,
    });
    return payments;
  };
  OrderPaymentMode.getPaymentsForCLoseDay = async function ({
    store_id,
    fromDate,
    toDate,
    user_id,
    order_state,
    groupBy,
  }) {
    let subquery =
      `SELECT ` +
      ` payment_option,` +
      ` SUM(CAST(COALESCE(p.amount, 0) AS numeric)) as amount, mpos_order.order_state as order_state,` +
      ` count(payment_option) as transactions, count(payment_option) as count ` +
      ` FROM (SELECT order_id, payment_option, amount from mpos_order_payment) as p ` +
      ` left join mpos_order on CAST(p.order_id AS text) = CAST(mpos_order.order_id AS text) where ` +
      ` $date ` +
      ` $order_state ` +
      ` $userId ` +
      ` CAST(mpos_order.store_id AS text) = :store_id GROUP BY $groupBy`;

    if (fromDate && toDate) {
      const fDate = String(fromDate).replace(/'/g, '').slice(0, 10);
      const tDate = String(toDate).replace(/'/g, '').slice(0, 10);
      subquery = subquery.replace(
        '$date',
        ` (mpos_order.my_order_date BETWEEN '${fDate}' and '${tDate}' OR mpos_order.my_order_date IS NULL) AND `,
      );
    } else {
      subquery = subquery.replace('$date', '');
    }
    if (user_id) {
      subquery = subquery.replace('$userId', ` mpos_order.user_id='${user_id}' AND `);
    } else {
      subquery = subquery.replace('$userId', '');
    }
    if (order_state) {
      subquery = subquery.replace(
        '$order_state',
        ` mpos_order.order_state in (${order_state}) AND `,
      );
    } else {
      subquery = subquery.replace(
        '$order_state',
        ` mpos_order.order_state IN ('fulfilled', 'completed', 'free') AND `,
      );
    }

    if (groupBy) {
      subquery = subquery.replace('$groupBy', `${groupBy}`);
    } else {
      subquery = subquery.replace('$groupBy', 'payment_option, mpos_order.order_state');
    }

    let payments = await sequelize.query(subquery, {
      model: this,
      mapToModel: true,
      raw: true,
      replacements: { store_id: String(store_id) },
      type: sequelize.QueryTypes.SELECT,
    });
    return payments;
  };
  OrderPaymentMode.getCashPaymentsOnly = async function ({
    store_id,
    fromDate,
    toDate,
    user_id,
    order_state,
    groupBy,
  }) {
    let subquery =
      `SELECT ` +
      // ` DISTINCT ` +
      ` payment_option,` +
      ` sum(p.amount) as amount, mpos_order.order_state as order_state,` +
      ` count(payment_option) as transactions,  count(payment_option) as count ` +
      ` FROM (SELECT  order_id ,payment_option,amount from mpos_order_payment) as p ` +
      ` left join mpos_order on p.order_id=mpos_order.order_id where  ` +
      ' payment_option = "Cash" AND ' +
      ` $date ` +
      ` $order_state ` +
      ` $userId ` +
      // + ` due_payment = "0" AND`
      ` store_id=:store_id GROUP BY $groupBy`;

    if (fromDate && toDate) {
      subquery = subquery.replace(
        '$date',
        ` created_time BETWEEN ${fromDate} and ${toDate} AND `,
      );
    } else {
      subquery = subquery.replace('$date', '');
    }
    if (user_id) {
      subquery = subquery.replace('$userId', ` user_id="${user_id}" AND `);
    } else {
      subquery = subquery.replace('$userId', '');
    }
    if (order_state) {
      subquery = subquery.replace(
        '$order_state',
        ` order_state in (${order_state}) AND `,
      );
    } else {
      subquery = subquery.replace(
        '$order_state',
        'order_state = "fulfilled" AND',
      );
    }

    if (groupBy) {
      subquery = subquery.replace('$groupBy', `${groupBy}`);
    } else {
      subquery = subquery.replace('$groupBy', 'payment_option');
    }
    // console.log(subquery);
    let payments = await sequelize.query(subquery, {
      model: this,
      mapToModel: true,
      raw: true,
      replacements: { store_id: store_id },
      type: sequelize.QueryTypes.SELECT,
    });
    return payments;
  };
  OrderPaymentMode.addPayment = async function (paymentDetails, transaction) {
    try {
      console.log('payment details in payment model', paymentDetails);
      let addpayResult = await OrderPaymentMode.create(paymentDetails, {
        transaction,
      });

      return addpayResult;
    } catch (error) {
      console.error('Add payment failed');
      console.error('Message:', error.message);
      console.error('Name:', error.name);
      console.error('Stack:', error.stack);
      throw error; // IMPORTANT
    }
  };
  OrderPaymentMode.addBulkPayment = async function (paymentList) {
    try {
      for (const paymentDetails of paymentList) {
        await OrderPaymentMode.upsert(paymentDetails, {
          fields: ['order_id', 'payment_option', 'amount'],
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return OrderPaymentMode;
}

module.exports = {
  getModel,
};
