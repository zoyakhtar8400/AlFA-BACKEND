const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const KotItemOptions = sequelize.define(
    util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      kot_items_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      option_group_name: {
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
      option_name: {
        type: type.STRING,
        allowNull: true,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
      option_price: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      option_tax_amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      option_total: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      option_total_with_tax: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      option_qty: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      option_type: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      item_ref_id: {
        type: type.STRING,
        allowNull: true,
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
      tableName: util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
    },
    {
      instanceMethods: {},
    },
  );

  //     UPDATE table
  //     SET val = (
  //         CASE someproperty
  //     WHEN 1 THEN X
  //     WHEN 2 THEN Y
  //     ELSE val
  //     END
  // );
  return KotItemOptions;
}

module.exports = {
  getModel,
};
