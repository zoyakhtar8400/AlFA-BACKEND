const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const OrderTip = sequelize.define(
    util.DBDetails.Tables.MPOS_ORDER_TIP,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
      },
      amount: {
        type: type.DECIMAL(10, 2),
      },
      payment_option: {
        type: type.STRING,
      },
      waiter: {
        type: type.STRING,
        allowNull: true,
      },
      waiter_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      store_id: {
        type: type.STRING,
      },
      sync_status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER_TIP,
    },
    {
      instanceMethods: {},
    },
  );
  return OrderTip;
}

module.exports = {
  getModel,
};
