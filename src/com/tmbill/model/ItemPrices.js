const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ItemPrices = sequelize.define(
    util.DBDetails.Tables.MPOS_ITEM_PRICES,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_id: {
        type: type.INTEGER,
      },
      short_code: {
        type: type.STRING,
        allowNull: true,
      },
      title: {
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
      price: {
        type: type.DECIMAL(10, 2),
      },
      ref: {
        type: type.INTEGER,
      },
      type: {
        type: type.INTEGER,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      active: {
        type: type.INTEGER,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ITEM_PRICES,
    },
  );
  return ItemPrices;
}

module.exports = {
  getModel,
};
