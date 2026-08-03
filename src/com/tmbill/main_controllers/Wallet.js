/* eslint-disable camelcase */
const uniqBy = require('lodash/uniqBy');
const {
  Wallet,
  BillPayment,
  Bill,
  WalletTransactions,
  Duepayments,
  Sequelize,
  KOT,
} = require('../js/database');

let syncStartenddaydata;
const request = require('request-promise');
const { Config } = require('../config/config');
const { getHeadersformpos } = require('../services/MiscServices');
const { sendLivesyncrequest } = require('../services/SyncService');
/**
 * Initialize the connection
 * @param {Parameters} params
 */
function walletInitializer(params) {
  if (params) {
    syncStartenddaydata = params.syncStartenddaydata;
  }
}

async function getUserwallets(params) {
  let wallets = [];
  try {
    const { connection } = params;
    delete params.connection;
    wallets = await connection.Wallet.findAll({
      raw: true,
      where: params,
    });
  } catch (error) {
    console.log(error);
  }
  return wallets;
}

async function createWallet(params) {
  try {
    delete params.connection;
    const walletEntity = await Wallet.findAll({
      raw: true,
      where: {
        cust_phone: params.cust_phone,
      },
    });

    if (walletEntity.length > 0) {
      params.sync_flag = 0;
      params.modified_on = moment.utc().format();
      await Wallet.update(params, {
        where: {
          cust_phone: params.cust_phone,
        },
      });
    } else {
      params.sync_flag = 1;
      await Wallet.create(params);
    }
  } catch (error) {
    params = undefined;
  }
  return params;
}

async function checkIfamountavaiableinwallet(params) {
  const response = { status: 200, amountAvailable: false };
  try {
    // const { connection } = params;
    // delete params.connection;

    const walletEntity = await Wallet.findAll({
      raw: true,
      where: {
        cust_phone: params.cust_phone,
        available_balance: {
          [Sequelize.Op.gte]: params.due_amount,
        },
      },
    });
    if (walletEntity.length > 0) {
      response.amountAvailable = true;
      response.walletInfo = walletEntity[0];
    }
  } catch (error) {
    response.status = 400;
    console.log(error);
  }
  return response;
}

async function updateCustomerpaidamount(order_id) {
  try {
    const paidAmount = await BillPayment.sum('amount', {
      where: { order_id },
    });

    await Bill.update(
      {
        cust_paid_amount: paidAmount,
      },
      { where: { order_id } },
    );
  } catch (error) {
    console.error(`Message="Error While Updating Customer paid amount"`, error);
  }
}

async function updateDuepaymentandaddtransaction(params) {
  const response = { status: 200 };
  try {
    // const { connection } = params;
    const newduePaydata = params.dueUpdate;
    const { paymentList } = params;
    const { walletSelected } = params;
    newduePaydata.transaction_id = global.generateId();
    if (newduePaydata.id) delete newduePaydata.id;
    if (newduePaydata.created) delete newduePaydata.created;

    // delete params.connection;

    if (walletSelected) {
      const walletEntity = await Wallet.findAll({
        raw: true,
        where: {
          cust_phone: newduePaydata.cust_mobile,
        },
      });
      if (walletEntity.length > 0) {
        const walletInfo = walletEntity[0];
        const { amountTopay } = params;
        if (walletInfo.available_balance >= amountTopay) {
          let available_balance = walletInfo.available_balance - amountTopay;
          available_balance = Number(Number(available_balance).toFixed(2));

          const transaction = {
            wallet_id: walletInfo.wallet_id,
            order_id: newduePaydata.order_id,
            credit_debit_type: 0,
            amount: amountTopay,
            user_id: global.storeDetails.username,
            available_balance,
            transaction_id: newduePaydata.transaction_id,
            cust_phone: newduePaydata.cust_mobile,
          };
          await WalletTransactions.create(transaction);
          await Wallet.update(
            {
              available_balance,
              sync_flag: 0,
              modified_on: moment.utc().format(),
            },
            { where: { wallet_id: walletInfo.wallet_id } },
          );
        } else {
          response.message = 'Wallet balance is low.';
          response.status = 400;
        }
      } else {
        response.message = 'No Wallet found.';
        response.status = 400;
      }
    }

    await Duepayments.create(newduePaydata);
    let paymentMode = 'wallet';
    if (paymentList && Array.isArray(paymentList) && paymentList.length) {
      if (paymentList.length === 1) {
        paymentMode = paymentList[0].payment_option;
      } else if (paymentList.length > 1) {
        paymentMode = 'Split';
      }
    }

    await Bill.update(
      {
        due_payment: newduePaydata.due_amount,
        sync_status: 0,
        payment: paymentMode,
      },
      { where: { order_id: newduePaydata.order_id } },
    );
    await KOT.update(
      { sync_status: 0 },
      { where: { bill_number: newduePaydata.order_id } },
    );
    const duePaymentData = { sync_flag: 0 };
    if (newduePaydata.due_amount === 0) {
      Object.assign(duePaymentData, {
        status: 0,
      });
    }
    await Duepayments.update(duePaymentData, {
      where: { order_id: newduePaydata.order_id },
    });

    response.message = 'Paid Successfully.';

    await BillPayment.destroy({
      where: {
        order_id: newduePaydata.order_id,
      },
    });

    if (paymentList && paymentList.length > 0) {
      const newpaymentList = uniqBy(paymentList, 'payment_option');
      await BillPayment.bulkCreate(newpaymentList);
    }
    updateCustomerpaidamount(newduePaydata.order_id);

    sendLivesyncrequest();
    syncStartenddaydata({
      store_id: global.storeDetails.store_id,
      tmpos_id: global.storeDetails.tmpos_id,
    });
  } catch (error) {
    response.status = 400;
    console.log(error);
  }
  return response;
}

/**
 * Returns the transactions of paticular wallet
 * @param {Wallet ID and other params} params
 */
async function getTransactions(params) {
  let transactions = [];
  try {
    if (params && params.wallet_id) {
      const { connection } = params;
      delete params.connection;

      transactions = await connection.WalletTransactions.findAll({
        raw: true,
        where: {
          wallet_id: params.wallet_id,
        },
        order: [['id', 'DESC']],
      });
    }
  } catch (error) {}
  return transactions;
}

async function walletTopup(params) {
  const response = { status: 200, message: 'success' };
  try {
    const { connection } = params;
    delete params.connection;

    if (params && params.wallet_id && params.amount) {
      let walletEntity = await connection.Wallet.findAll({
        raw: true,
        where: {
          wallet_id: params.wallet_id,
        },
      });
      if (walletEntity.length > 0) {
        walletEntity = walletEntity[0];
        let { available_balance } = walletEntity;
        available_balance += params.amount;
        available_balance = Number(
          Number(available_balance).toFixed(ROUNDOFF_UPTO),
        );
        const transaction = {
          wallet_id: params.wallet_id,
          credit_debit_type: 1,
          amount: params.amount,
          user_id: global.storeDetails.username,
          available_balance,
          payment_mode: params.payment_mode,
          cust_phone: params.cust_phone,
          transaction_id: global.generateId(),
        };

        await connection.WalletTransactions.create(transaction);

        await connection.Wallet.update(
          {
            available_balance,
            sync_flag: 0,
            modified_on: moment.utc().format(),
          },
          { where: { wallet_id: params.wallet_id } },
        );
        response.status = 200;
        response.message = 'Top up successful.';
        response.available_balance = available_balance;
        syncStartenddaydata(connection, {
          store_id: global.storeDetails.store_id,
          tmpos_id: global.storeDetails.tmpos_id,
        });
      } else {
        response.status = 400;
        response.message = 'Wallet doesnot exists.';
      }
    } else {
      response.status = 400;
      response.message = 'Please provide wallet id and amount';
    }
  } catch (error) {
    response.status = 400;
    response.message = 'Invalid parameters';
  }
  return response;
}

async function getCustomernothavingwallets(params) {
  const response = { status: 200, message: 'success' };
  try {
    const { connection } = params;
    delete params.connection;

    const customers = await connection.Wallet.getCustomerswithoutwallet(
      params.store_id,
    );
    response.customers = customers;
  } catch (error) {
    response.status = 400;
    response.message = 'failure';
  }
  return response;
}

async function createWalletonremote(customer) {
  const options = {
    method: 'POST',
    uri: Config.links.createWallet,
    body: {
      wallet_name: customer.name,
      cust_phone: customer.phone,
      available_balance: 0,
      store_id: global.storeDetails.store_id,
      wallet_id: -1,
      created_by: global.storeDetails.username,
      is_active: 1,
    },
    json: true,
    headers: getHeadersformpos(),
    rejectUnauthorized: false,
  };

  try {
    const response = await request(options);
    if (response && response.status) {
      if (response.status == '200') {
        const walletInfo = response.msg;
        if (walletInfo) {
          delete walletInfo.action;
          delete walletInfo.status;
          delete walletInfo.message;

          createWallet(walletInfo);
        }
        return response;
      }
      if (response.status == '303') {
        reloginfromremote();
      }
    }
  } catch (error) {}
}

async function getWalletdetails(customer) {
  let walletDetails = [];
  try {
    if (customer && customer.phone) {
      walletDetails = await Wallet.findAll({
        raw: true,
        where: {
          cust_phone: customer.phone,
          store_id: customer.store_id,
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
  return walletDetails;
}

module.exports = {
  getWalletdetails,
  getCustomernothavingwallets,
  walletInitializer,
  walletTopup,
  getUserwallets,
  createWallet,
  checkIfamountavaiableinwallet,
  updateDuepaymentandaddtransaction,
  getTransactions,
  createWalletonremote,
};
