const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Duepayments = sequelize.define(
    util.DBDetails.Tables.MPOS_DUEPAYMENTS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      order_id: {
        type: type.STRING,
        allowNull: true,
      },
      cust_mobile: {
        type: type.STRING,
        allowNull: true,
      },
      amount_to_pay: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      received_amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      due_amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      waived_off: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      payment_info: {
        type: type.STRING,
        allowNull: true,
      },
      billing_user_id: {
        type: type.STRING,
        allowNull: true,
      },
      status: {
        type: type.BOOLEAN,
        defaultValue: true,
      },
      created: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      transaction_id: {
        type: type.STRING,
        allowNull: false,
      },
      sync_flag: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      payment_mode: {
        type: type.STRING,
        allowNull: true,
      },
      created_time: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      bill_number: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      customer_name: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_DUEPAYMENTS,
    },
  );

  Duepayments.getAll = async function name(params) {
    let list = [];
    try {
      let where = {
        store_id: params.store_id,
      };
      if (params.fromDate) {
        where.created = {
          [type.Op.between]: [params.fromDate, params.toDate],
        };
      }
      list = await Duepayments.findAll({
        raw: true,
        where,
      });
    } catch (error) {
      console.log(error);
    }
    return list;
  };
  Duepayments.getSyncdata = async function (params) {
    let payments = [];
    try {
      payments = await Duepayments.findAll({
        raw: true,
        attributes: [
          'store_id',
          'order_id',
          'cust_mobile',
          'amount_to_pay',
          'received_amount',
          'due_amount',
          'waived_off',
          'payment_info',
          'billing_user_id',
          'status',
          'transaction_id',
          [type.fn('datetime', type.col('created'), 'localtime'), 'created'],
        ],
        where: {
          order_id: params.order_id,
          sync_flag: 0,
        },
      });
    } catch (error) {
      console.log(error);
    }
    return payments;
  };

  return Duepayments;
}

module.exports = {
  getModel,
};
