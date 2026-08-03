const util = require('../util/DBUtil');

async function addPaymentOptionInOrderTip(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER_TIP, 'payment_option', {
    type: type.STRING,
    allowNull: true,
  });
}

async function addExtraDetailsFieldinKOT(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'extra_details', {
    type: type.JSON,
    allowNull: true,
  });
}

async function addUserLoginStatusTable(query, type) {
  try {
    await query.createTable(
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
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_USER_LOGIN_STATUS,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function addCustomerNameinduepaymentTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_DUEPAYMENTS, 'customer_name', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_DUEPAYMENTS, 'bill_number', {
      type: type.INTEGER,
      defaultValue: 0,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addPaymentModeInWalletTrxTable(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_WALLET_TRANSACTIONS,
      'payment_mode',
      {
        type: type.STRING,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_WALLET_TRANSACTIONS,
      'cust_phone',
      {
        type: type.STRING,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

const up = function (query, type) {
  addPaymentOptionInOrderTip(query, type);
  addExtraDetailsFieldinKOT(query, type);
  addUserLoginStatusTable(query, type);
  addCustomerNameinduepaymentTable(query, type);
  addPaymentModeInWalletTrxTable(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
