const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseQuotation = sequelize.define(
    util.DBDetails.Tables.PURCHASE_QUOTATIONS || 'purchase_quotations',
    {
      quotation_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      quotation_number: {
        type: type.STRING,
        allowNull: false,
      },
      supplier_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      quotation_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      valid_until: {
        type: type.DATE,
        allowNull: true,
      },
      total_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      status: {
        // 'DRAFT', 'APPROVED', 'REJECTED'
        type: type.STRING,
        defaultValue: 'DRAFT',
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_quotations',
    }
  );
  return PurchaseQuotation;
}

module.exports = { getModel };
