const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ItemGroup = sequelize.define(
    util.DBDetails.Tables.ITEM_GROUPS || 'item_groups',
    {
      group_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_name: {
        type: type.STRING,
        allowNull: false,
      },
      group_type: {
        type: type.STRING,
        defaultValue: 'Raw Material',
      },
      post_in_ac: {
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
      tableName: 'item_groups',
    }
  );
  return ItemGroup;
}

module.exports = { getModel };
