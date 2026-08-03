const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ModifierGroups = sequelize.define(
    util.DBDetails.Tables.MPOS_MODIFIER_GROUPS,
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
      title: {
        type: type.STRING,
      },
      subtitle: {
        type: type.STRING,
      },
      description: {
        type: type.STRING,
      },
      min: {
        // Minimum selectable modifers
        type: type.INTEGER,
        defaultValue: 0,
      },
      max: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      type: {
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
      coc: {
        // Indicate if it is customisation of customisation
        type: type.INTEGER,
        defaultValue: 0,
      },
      visible_for_coc: {
        // Indicate if it is customisation of customisation
        type: type.INTEGER,
        defaultValue: 0,
      },
      tags: {
        type: type.STRING,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_MODIFIER_GROUPS,
    },
    {
      instanceMethods: {},
    },
  );
  return ModifierGroups;
}

module.exports = {
  getModel,
};
