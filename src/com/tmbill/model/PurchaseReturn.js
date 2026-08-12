const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseReturn = sequelize.define(
    util.DBDetails.Tables.PURCHASE_RETURNS || 'purchase_returns',
    {
      return_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      return_number: {
        type: type.STRING,
        allowNull: false,
      },
      supplier_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      return_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      total_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      reason: {
        type: type.STRING,
        allowNull: true,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_returns',
    }
  );
  return PurchaseReturn;
}

module.exports = { getModel };
