const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const NCType = sequelize.define(
    util.DBDetails.Tables.MPOS_NC_TYPE,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: type.STRING,
        allowNull: true,
      },
      name: {
        type: type.STRING,
        allowNull: false,
      },
      status: {
        type: type.STRING,
        defaultValue: 'Active',
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_NC_TYPE,
    }
  );
  return NCType;
}

module.exports = {
  getModel,
};
