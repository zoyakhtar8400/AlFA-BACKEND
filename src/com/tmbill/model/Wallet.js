/* eslint-disable no-restricted-syntax */
const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Wallet = sequelize.define(
    util.DBDetails.Tables.MPOS_WALLET,
    {
      wallet_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      cust_phone: {
        type: type.STRING,
        allowNull: true,
      },
      wallet_name: {
        type: type.STRING,
        allowNull: true,
      },
      available_balance: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      created_on: {
        type: type.DATE,
        allowNull: true,
        defaultValue: type.NOW,
      },
      created_by: {
        type: type.STRING,
        allowNull: true,
      },
      modified_on: {
        type: type.DATE,
        allowNull: true,
        defaultValue: type.NOW,
      },
      sync_flag: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_WALLET,
    },
  );

  Wallet.setSyncflag = async function (idList) {
    try {
      if (idList && idList.length > 0) {
        for (const currentwallet of idList) {
          if (currentwallet.status == 'success') {
            // eslint-disable-next-line no-await-in-loop
            await Wallet.update(
              {
                sync_flag: 1,
              },
              {
                where: {
                  wallet_id: currentwallet.wallet_id,
                },
              },
            );
          }
        }
      }
    } catch (error) {}
  };

  Wallet.getCustomerswithoutwallet = async function (store_id) {
    let customers = [];
    try {
      let query =
        'SELECT mpos_customer.phone as phone,' +
        ' mpos_customer.name as name FROM mpos_customer' +
        ' WHERE NOT EXISTS' +
        ' (SELECT mpos_wallet.cust_phone' +
        ' FROM mpos_wallet' +
        ' WHERE mpos_wallet.cust_phone = mpos_customer.phone)' +
        ' AND' +
        ' mpos_customer.store_id = :store_id;';
      customers = await sequelize.query(query, {
        raw: true,
        replacements: { store_id: store_id },
        type: sequelize.QueryTypes.SELECT,
      });
      // customers = customers.map((result) => result.phone);
    } catch (error) {
      console.log(error);
    }
    return customers;
  };

  return Wallet;
}

module.exports = {
  getModel,
};
