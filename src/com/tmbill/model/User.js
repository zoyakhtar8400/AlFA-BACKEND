const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const User = sequelize.define(
    util.DBDetails.Tables.MPOS_USER,
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
      phone: {
        type: type.STRING,
        allowNull: true,
      },
      username: {
        type: type.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: type.STRING,
        allowNull: true,
      },
      password: {
        type: type.STRING,
        allowNull: false,
      },
      type: {
        type: type.STRING,
        allowNull: true,
      },
      status: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      IPAddress: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      is_captain_app: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      is_kds_app: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      is_self_order: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      is_old_kot_enabled: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      is_terminal_app: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      assignedKitchedeps: {
        type: type.STRING,
        allowNull: true,
      },
      terminal_access_levels: {
        type: type.JSON,
        allowNull: true,
      },
      userCategory: {
        type: type.STRING(10),
        allowNull: true,
      },
      passcode_access_levels: {
        type: type.JSON,
        allowNull: true,
      },
      captain_access_levels: {
        type: type.JSON,
        allowNull: true,
      },
      captain_user_access: {
        type: type.INTEGER,
        allowNull: true,
      },
      languagePreference: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 'en',
      },
      is_old_user: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_USER,
    },
  );
  return User;
}

module.exports = {
  getModel,
};
