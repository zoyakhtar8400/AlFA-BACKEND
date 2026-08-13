const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const UserOutlet = sequelize.define(
    util.DBDetails.Tables.MPOS_USER_OUTLET || 'mpos_user_outlet',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      store_id: {
        type: type.STRING,
        allowNull: false,
      },
      created_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
    },
    {
      timestamps: false,
      tableName: 'mpos_user_outlet',
    }
  );
  return UserOutlet;
}

module.exports = {
  getModel,
};
