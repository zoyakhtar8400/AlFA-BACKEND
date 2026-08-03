const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Shortcuts = sequelize.define(
    util.DBDetails.Tables.MPOS_SHORTCUTS,
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
      default: {
        type: type.STRING,
        allowNull: true,
      },
      window: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_SHORTCUTS,
    },
    {
      instanceMethods: {},
    },
  );
  return Shortcuts;
}

module.exports = {
  getModel,
};
