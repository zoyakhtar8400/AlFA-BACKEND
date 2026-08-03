const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Options = sequelize.define(
    util.DBDetails.Tables.MPOS_ORDERCHILD_OPTION_ADDONS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
        allowNull: true,
      },
      item_ref_id: {
        type: type.STRING,
        allowNull: true,
      },
      order_item_id: {
        type: type.STRING,
        allowNull: true,
      },
      option_group_ref_id: {
        type: type.STRING,
        allowNull: true,
      },
      option_ref_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      option_group_name: {
        type: type.STRING,
        allowNull: true,
      },
      title: {
        //here name should be small full half
        type: type.STRING,
        allowNull: true,
      },
      qty: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      price: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total_with_tax: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      tax_per: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      tax_value: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      tax_method: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      is_devidable: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      item_note: {
        type: type.STRING,
        allowNull: true,
      },
      tax_discount_method: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      type: {
        //addon or option
        type: type.INTEGER,
        defaultValue: 0,
      },
      option_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDERCHILD_OPTION_ADDONS,
    },
    {
      instanceMethods: {},
    },
  );
  return Options;
}

module.exports = {
  getModel,
};
