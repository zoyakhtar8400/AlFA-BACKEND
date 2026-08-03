const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const WaiterNotification = sequelize.define(
    util.DBDetails.Tables.MPOS_WAITER_NOTIFICATIONS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },

      store_id: {
        type: type.STRING,
      },
      table_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      Message: {
        type: type.STRING,
      },
      status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      updated_at: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      username: {
        type: type.STRING,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_WAITER_NOTIFICATIONS,
    },
  );
  return WaiterNotification;
}

module.exports = {
  getModel,
};
