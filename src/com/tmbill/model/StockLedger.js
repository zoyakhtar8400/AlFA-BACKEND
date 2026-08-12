const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const StockLedger = sequelize.define(
    util.DBDetails.Tables.STOCK_LEDGER || 'stock_ledger',
    {
      ledger_id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      entry_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      module: {
        // 'PURCHASE', 'KOT', 'STOCK_ADJUSTMENT', 'WASTAGE'
        type: type.STRING,
        allowNull: false,
      },
      reference_no: {
        // e.g. PO-001, KOT-101, ADJ-01
        type: type.STRING,
        allowNull: false,
      },
      inventory_item_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      qty_change: {
        // Positive (+) or Negative (-)
        type: type.DECIMAL(12, 3),
        allowNull: false,
      },
      unit: {
        type: type.STRING,
        allowNull: false,
      },
      closing_balance: {
        type: type.DECIMAL(12, 3),
        allowNull: false,
      },
      notes: {
        type: type.TEXT,
        allowNull: true,
      },
      created_by: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: 'stock_ledger',
    }
  );
  return StockLedger;
}

module.exports = { getModel };
