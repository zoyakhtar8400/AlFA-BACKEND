const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const InventoryItem = sequelize.define(
    util.DBDetails.Tables.INVENTORY_ITEMS || 'inventory_items',
    {
      inventory_item_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_name: {
        type: type.STRING,
        allowNull: false,
      },
      item_type: {
        // 'RAW' or 'FINISHED'
        type: type.STRING,
        defaultValue: 'RAW',
        allowNull: false,
      },
      unit: {
        // e.g. Kg, Grams, Liters, ml, Pcs, Bottle, Can
        type: type.STRING,
        allowNull: false,
        defaultValue: 'Kg',
      },
      current_stock: {
        type: type.DECIMAL(12, 3),
        defaultValue: 0,
        allowNull: false,
      },
      minimum_stock: {
        type: type.DECIMAL(12, 3),
        defaultValue: 0,
      },
      purchase_price: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      selling_price: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      created_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      updated_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
    },
    {
      timestamps: false,
      tableName: 'inventory_items',
    }
  );
  return InventoryItem;
}

module.exports = { getModel };
