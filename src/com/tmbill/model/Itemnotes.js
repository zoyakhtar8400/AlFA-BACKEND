const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Itemnote = sequelize.define(
    util.DBDetails.Tables.MPOS_ITEMNOTES,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_refid: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      note: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ITEMNOTES,
    },
  );
  return Itemnote;
}

module.exports = {
  getModel,
};
