const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PurchaseGRN = sequelize.define(
    util.DBDetails.Tables.PURCHASE_GRN || 'purchase_grn',
    {
      grn_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      grn_number: {
        type: type.STRING,
        allowNull: false,
      },
      po_id: {
        type: type.INTEGER,
        allowNull: true,
      },
      supplier_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      grn_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      party_challan_no: {
        type: type.STRING,
        allowNull: true,
      },
      party_challan_date: {
        type: type.DATE,
        allowNull: true,
      },
      gross_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      net_amount: {
        type: type.DECIMAL(12, 2),
        defaultValue: 0,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'purchase_grn',
    }
  );
  return PurchaseGRN;
}

module.exports = { getModel };
