const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const MposModifierVarient = sequelize.define(
    util.DBDetails.Tables.MPOS_MODIFIER_VARIENT,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tmpos_id: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      modifier_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      variant_id: {
        type: type.STRING,
        allowNull: true,
      },
      title: {
        type: type.STRING,
      },
      price: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      item_id: {
        // Use this to refer the menu item for inventory
        type: type.INTEGER,
      },
      short_code: {
        type: type.STRING,
        allowNull: true,
      },
      default_selected: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      alternative_title: {
        type: type.STRING,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_MODIFIER_VARIENT,
    },
    {
      instanceMethods: {},
    },
  );
  return MposModifierVarient;
}

module.exports = {
  getModel,
};
