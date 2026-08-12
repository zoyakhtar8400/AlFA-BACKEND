const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Taxes = sequelize.define(
    util.DBDetails.Tables.MPOS_TAX,
    {
      tax_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tax_name: {
        type: type.STRING,
      },
      tax_percentage: {
        type: type.DECIMAL(10, 2),
        defaultValue: 5.0,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      tax_perct: {
        type: type.INTEGER, //1-percentage 0-fix
        defaultValue: 0,
      },
      tax_method: {
        type: type.INTEGER, //1-default 0-not default
        defaultValue: 0,
      },
      is_devidable: {
        type: type.INTEGER, //1-percentage 0-fix
        defaultValue: 0,
      },
      cal_method: {
        type: type.INTEGER, //1-percentage 0-fix
        defaultValue: 0,
        allowNull: true,
      },
      tax_display_name: {
        type: type.STRING,
        allowNull: true,
      },
      product_group_id: {
        // 0=All ,1=Quick Bill, 2=Dine In, 3= TA 4=HD
        type: type.INTEGER,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      primary: {
        type: type.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      sort: {
        type: type.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_TAX,
    },
    {
      instanceMethods: {},
    },
  );
  return Taxes;
}

module.exports = {
  getModel,
};
