const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const PaymentMode = sequelize.define(
    util.DBDetails.Tables.MPOS_PAYMENT_MODE,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payment_mode_name: {
        type: type.STRING,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
      payment_mode_image: {
        type: type.STRING,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_PAYMENT_MODE,
    },
    {
      instanceMethods: {},
    },
  );
  return PaymentMode;
}

module.exports = {
  getModel,
};
