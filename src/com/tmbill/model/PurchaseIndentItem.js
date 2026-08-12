const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseIndentItem = sequelize.define(
    util.DBDetails.Tables.PURCHASE_INDENT_ITEMS || 'purchase_indent_items',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      indent_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      inventory_item_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: type.DECIMAL(12, 3),
        allowNull: false,
      },
      unit: {
        type: type.STRING,
        allowNull: false,
      },
      remark: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_indent_items',
    }
  );
  return PurchaseIndentItem;
}

module.exports = { getModel };
