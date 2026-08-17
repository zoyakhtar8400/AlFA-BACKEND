/* eslint-disable camelcase */
function getModel(sequelize, type) {
  const PaymentMode = sequelize.define(
    'mpos_payment_mode',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payment_mode_name: {
        type: type.STRING,
        allowNull: false,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
      payment_mode_image: {
        type: type.STRING,
        allowNull: true,
      },
      type: {
        type: type.STRING,
        defaultValue: 'CASH', // CASH, CARD, UPI, WALLET, CREDIT, OTHER
      },
      charge_percent: {
        type: type.FLOAT,
        defaultValue: 0,
      },
      is_quick_pay: {
        type: type.BOOLEAN,
        defaultValue: true,
      },
      description: {
        type: type.TEXT,
        allowNull: true,
      },
      active: {
        type: type.STRING,
        defaultValue: 'Yes',
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 'STORE_1',
      },
      created_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      updated_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
    },
    {
      timestamps: false,
      tableName: 'mpos_payment_mode',
    }
  );
  return PaymentMode;
}

module.exports = {
  getModel,
};
