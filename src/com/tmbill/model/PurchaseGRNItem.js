const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseGRNItem = sequelize.define(
    util.DBDetails.Tables.PURCHASE_GRN_ITEMS || 'purchase_grn_items',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      grn_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      inventory_item_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      received_qty: {
        type: type.DECIMAL(12, 3),
        allowNull: false,
      },
      unit: {
        type: type.STRING,
        allowNull: false,
      },
      unit_price: {
        type: type.DECIMAL(10, 2),
        allowNull: false,
      },
      total_amount: {
        type: type.DECIMAL(12, 2),
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_grn_items',
    }
  );
  return PurchaseGRNItem;
}

module.exports = { getModel };
