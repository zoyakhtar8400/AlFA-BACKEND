const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ModifierGroupsMapping = sequelize.define(
    util.DBDetails.Tables.MPOS_MODIFIERS_GROUP_MAPPING,
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
      modifier_group_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_MODIFIERS_GROUP_MAPPING,
    },
    {
      instanceMethods: {},
    },
  );
  return ModifierGroupsMapping;
}

module.exports = {
  getModel,
};
