const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Category = sequelize.define(
    util.DBDetails.Tables.MPOS_USER_PASSCODE_ACTIVITY,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      activity: {
        type: type.STRING,
        allowNull: true,
      },
      requested_permission: {
        type: type.STRING,
        allowNull: true,
      },
      created_at: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      activity_id: {
        type: type.STRING(20),
        allowNull: true,
      },
      activity_event_id: {
        type: type.STRING(20),
        allowNull: true,
      },
      billing_user: {
        type: type.STRING,
        allowNull: true,
      },
      passcode_user: {
        type: type.STRING,
        allowNull: true,
      },
      order_id: {
        type: type.STRING(90),
        allowNull: true,
      },
      bill_number: {
        type: type.STRING(25),
        allowNull: true,
      },
      kot_number: {
        type: type.STRING(25),
        allowNull: true,
      },
      store_id: {
        type: type.STRING(50),
        allowNull: true,
      },
      tmpos_id: {
        type: type.STRING(50),
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      permission_given: {
        type: type.BOOLEAN,
        defaultValue: true,
      },
      sync_status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_USER_PASSCODE_ACTIVITY,
    },
  );
  return Category;
}

module.exports = {
  getModel,
};
