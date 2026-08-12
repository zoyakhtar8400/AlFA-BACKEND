const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseIndent = sequelize.define(
    util.DBDetails.Tables.PURCHASE_INDENTS || 'purchase_indents',
    {
      indent_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      indent_number: {
        type: type.STRING,
        allowNull: false,
      },
      department: {
        type: type.STRING,
        defaultValue: 'MAIN KITCHEN',
      },
      requested_by: {
        type: type.STRING,
        allowNull: true,
      },
      indent_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      status: {
        // 'PENDING', 'APPROVED', 'REJECTED'
        type: type.STRING,
        defaultValue: 'PENDING',
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
      tableName: 'purchase_indents',
    }
  );
  return PurchaseIndent;
}

module.exports = { getModel };
