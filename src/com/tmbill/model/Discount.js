const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Discount = sequelize.define(
    util.DBDetails.Tables.MPOS_DISCOUNT,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      discount_name: {
        type: type.STRING,
      },
      discount_type: {
        // 2=Fixed 1=Per
        type: type.STRING,
      },
      rate: {
        type: type.DECIMAL(10, 2),
      },
      active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      status_flag: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      is_modifiable: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      product_groups: {
        type: type.STRING,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      order_type: {
        type: type.STRING,
        allowNull: true,
        defaultValue: '0',
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_DISCOUNT,
    },
    {
      instanceMethods: {},
    },
  );
  return Discount;
}

module.exports = {
  getModel,
};
