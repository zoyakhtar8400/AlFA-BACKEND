const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const UserLoginStatus = sequelize.define(
    util.DBDetails.Tables.MPOS_USER_LOGIN_STATUS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
      },
      name: {
        type: type.STRING,
        allowNull: true,
      },
      username: {
        type: type.STRING,
        allowNull: false,
        unique: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      machine_id: {
        type: type.STRING,
        allowNull: true,
      },
      status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_USER_LOGIN_STATUS,
    },
  );
  return UserLoginStatus;
}

module.exports = {
  getModel,
};
