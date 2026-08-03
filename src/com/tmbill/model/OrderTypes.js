const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const OrderTypes = sequelize.define(
    util.DBDetails.Tables.MPOS_ORDER_TYPES,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
      },
      order_type: {
        type: type.STRING,
      },
      order_type_image: {
        type: type.STRING,
        allowNull: true,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER_TYPES,
    },
    {
      instanceMethods: {},
    },
  );
  return OrderTypes;
}

module.exports = {
  getModel,
};
