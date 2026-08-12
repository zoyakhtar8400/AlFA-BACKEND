const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseOrder = sequelize.define(
    util.DBDetails.Tables.PURCHASE_ORDERS || 'purchase_orders',
    {
      po_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      po_number: {
        type: type.STRING,
        allowNull: false,
      },
      supplier_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      order_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      delivery_date: {
        type: type.DATE,
        allowNull: true,
      },
      status: {
        // 'DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED'
        type: type.STRING,
        defaultValue: 'ISSUED',
      },
      gross_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      tax_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      net_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      notes: {
        type: type.TEXT,
        allowNull: true,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_orders',
    }
  );
  return PurchaseOrder;
}

module.exports = { getModel };
