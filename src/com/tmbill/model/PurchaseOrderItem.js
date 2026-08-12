const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseOrderItem = sequelize.define(
    util.DBDetails.Tables.PURCHASE_ORDER_ITEMS || 'purchase_order_items',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      po_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      inventory_item_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      order_qty: {
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
      department: {
        type: type.STRING,
        defaultValue: 'PURCHASE STORE',
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_order_items',
    }
  );
  return PurchaseOrderItem;
}

module.exports = { getModel };
