const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Supplier = sequelize.define(
    util.DBDetails.Tables.SUPPLIERS || 'suppliers',
    {
      supplier_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      supplier_name: {
        type: type.STRING,
        allowNull: false,
      },
      contact_person: {
        type: type.STRING,
        allowNull: true,
      },
      phone: {
        type: type.STRING,
        allowNull: true,
      },
      email: {
        type: type.STRING,
        allowNull: true,
      },
      address: {
        type: type.TEXT,
        allowNull: true,
      },
      gstin: {
        type: type.STRING,
        allowNull: true,
      },
      current_balance: {
        type: type.DECIMAL(12, 2),
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
    },
    {
      timestamps: false,
      tableName: 'suppliers',
    }
  );
  return Supplier;
}

module.exports = { getModel };
