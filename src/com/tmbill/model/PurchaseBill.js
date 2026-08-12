const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseBill = sequelize.define(
    util.DBDetails.Tables.PURCHASE_BILLS || 'purchase_bills',
    {
      bill_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bill_number: {
        type: type.STRING,
        allowNull: false,
      },
      supplier_invoice_no: {
        type: type.STRING,
        allowNull: true,
      },
      grn_id: {
        type: type.INTEGER,
        allowNull: true,
      },
      supplier_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      bill_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      due_date: {
        type: type.DATE,
        allowNull: true,
      },
      total_amount: {
        type: type.DECIMAL(12, 2),
        allowNull: false,
      },
      paid_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      payment_status: {
        // 'UNPAID', 'PARTIAL', 'PAID'
        type: type.STRING,
        defaultValue: 'UNPAID',
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_bills',
    }
  );
  return PurchaseBill;
}

module.exports = { getModel };
