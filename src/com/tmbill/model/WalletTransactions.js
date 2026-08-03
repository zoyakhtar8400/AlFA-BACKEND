const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const WalletTransactions = sequelize.define(
    util.DBDetails.Tables.MPOS_WALLET_TRANSACTIONS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      wallet_id: {
        type: type.STRING,
        allowNull: true,
      },
      order_id: {
        type: type.STRING,
        allowNull: true,
      },
      credit_debit_type: {
        type: type.BOOLEAN,
        defaultValue: true,
      },
      amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      created_time: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      user_id: {
        type: type.STRING,
        allowNull: false,
      },
      available_balance: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      transaction_id: {
        type: type.STRING,
        allowNull: false,
      },
      sync_flag: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      payment_mode: {
        type: type.STRING,
        allowNull: true,
      },
      cust_phone: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_WALLET_TRANSACTIONS,
    },
  );
  WalletTransactions.setSyncflag = async function (idList) {
    try {
      if (idList && idList.length > 0) {
        for (const currentwallet of idList) {
          if (currentwallet.status == 'success') {
            await WalletTransactions.update(
              {
                sync_flag: 1,
              },
              {
                where: {
                  transaction_id: currentwallet.transaction_id,
                },
              },
            );
          }
        }
      }
    } catch (error) {}
  };

  WalletTransactions.getSyndata = async function (params) {
    let cust_wallet_transactions = [];
    try {
      cust_wallet_transactions = await WalletTransactions.findAll({
        raw: true,
        include: [
          {
            model: params.model,
            attributes: [],
            where: {
              store_id: params.store_id,
            },
          },
        ],
        attributes: [
          'wallet_id',
          'order_id',
          'credit_debit_type',
          'amount',
          'user_id',
          'available_balance',
          'transaction_id',
          [
            type.fn('datetime', type.col('created_time'), 'localtime'),
            'created_time',
          ],
        ],
        where: {
          sync_flag: 0,
        },
      });
    } catch (error) {
      console.log(error);
    }
    return cust_wallet_transactions;
  };

  return WalletTransactions;
}

module.exports = {
  getModel,
};
