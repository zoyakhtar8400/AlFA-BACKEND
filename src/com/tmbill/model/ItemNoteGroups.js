const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ItemnoteGroup = sequelize.define(
    util.DBDetails.Tables.MPOS_ITEM_NOTE_GROUPS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      item_note_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      menu_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      short_code: {
        type: type.STRING,
        allowNull: true,
      },
      tag_group_name: {
        type: type.STRING,
        allowNull: true,
      },
      tags_info: {
        type: type.JSON,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      tmpos_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ITEM_NOTE_GROUPS,
    },
  );
  return ItemnoteGroup;
}

module.exports = {
  getModel,
};
