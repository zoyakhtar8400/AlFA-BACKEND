const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Modifiers = sequelize.define(
    util.DBDetails.Tables.MPOS_MODIFIERS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      unique_id: {
        type: type.STRING,
      },
      tmpos_id: {
        type: type.STRING,
      },
      store_id: {
        type: type.STRING,
      },
      menu_id: {
        type: type.INTEGER,
      },
      group_id: {
        // reference to the modifier grp
        type: type.INTEGER,
      },
      item_id: {
        // reference to the menuchild item
        type: type.INTEGER,
      },
      short_code: {
        type: type.STRING,
      },
      title: {
        type: type.STRING,
      },
      subtitle: {
        type: type.STRING,
      },
      price: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      description: {
        type: type.STRING,
      },
      min: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      max: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      extra: {
        // 0 = Varient and 1 = Addon
        type: type.FLOAT,
        defaultValue: 0,
      },
      free: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      has_variants: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      has_customisation: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      has_nested_mg: {
        // Tell if this modifier has nested modifiers groups
        type: type.INTEGER,
        defaultValue: 0,
      },
      default_selected: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      rank: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      tags: {
        type: type.STRING,
      },
      assets: {
        type: type.JSON,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      sku: {
        type: type.STRING,
      },
      defaultQty: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_MODIFIERS,
    },
    {
      instanceMethods: {},
    },
  );
  return Modifiers;
}

module.exports = {
  getModel,
};
