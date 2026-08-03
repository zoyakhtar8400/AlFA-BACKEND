const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Settings = sequelize.define(
    util.DBDetails.Tables.MPOS_SETTINGS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: type.STRING,
        allowNull: true,
      },
      value: {
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
      tableName: util.DBDetails.Tables.MPOS_SETTINGS,
    },
    {
      instanceMethods: {},
    },
  );
  return Settings;
}

module.exports = {
  getModel,
};
