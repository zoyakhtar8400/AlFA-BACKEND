const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ModifierGroupItemMapping = sequelize.define(
    util.DBDetails.Tables.MPOS_MODIFIERGROUP_ITEMS_MAPPING,
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
      menu_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      group_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      item_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      short_code: {
        type: type.STRING,
        allowNull: true,
      },
      item_name: {
        type: type.STRING,
      },
      rank: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_MODIFIERGROUP_ITEMS_MAPPING,
    },
    {
      instanceMethods: {},
    },
  );
  return ModifierGroupItemMapping;
}

module.exports = {
  getModel,
};
