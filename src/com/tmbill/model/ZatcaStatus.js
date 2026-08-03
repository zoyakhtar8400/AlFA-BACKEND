const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const zatcaStatus = sequelize.define(
    util.DBDetails.Tables.MPOS_ZATCA_STATUS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
      },
      store_id: {
        type: type.STRING,
      },
      status: {
        type: type.STRING,
      },
      qr: {
        type: type.STRING,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ZATCA_STATUS,
    },
  );

  return zatcaStatus;
}

module.exports = {
  getModel,
};
