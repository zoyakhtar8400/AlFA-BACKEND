/* eslint-disable camelcase */
let connection = require('../js/database');
const { DASHBOARD_IPC } = require('../util/IPC_Messages');
const {
  ONLINE_PLATFORMS,
  OFFLINE_BILLING_TYPES,
  OrderState,
} = require('../util/DBUtil');

betteripcMain.answerRenderer(DASHBOARD_IPC.GET_TOP_ITEMS, async (params) => {
  let topItems = await connection.BillItem.gettopSolditems(params);
  return topItems;
});

betteripcMain.answerRenderer(DASHBOARD_IPC.GET_ALL_DATA, async (params) => {
  let result = await getDashboarddetails(params);
  return result;
});

betteripcMain.answerRenderer(DASHBOARD_IPC.GET_SALES_DATA, async (params) => {
  let saleschartdata = await connection.Bill.getsaleschartdata(params);
  return saleschartdata;
});

async function getDuePaymentSummarybydate(fromDate, toDate) {
  let deuPaymentList = [];
  let duePayment = 0;
  try {
    deuPaymentList = await connection.Duepayments.findAll({
      raw: true,
      attributes: [
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",( sum(received_amount)))`,
          ),
          'total_amount',
        ],
      ],
      where: {
        store_id: global.storeDetails.store_id,
        // user_id: global.storeDetails.username,
        created_time: {
          [connection.Sequelize.Op.between]: [fromDate, toDate],
        },
        // order_state: 'fulfilled',
        received_amount: {
          [connection.Sequelize.Op.ne]: 0,
        },
      },
    });
    if (deuPaymentList && deuPaymentList.length) {
      duePayment = deuPaymentList[0].total_amount;
    }
    return duePayment;
  } catch (err) {
    console.log(err);
  }
}

async function getDuePaymentReceivableSummarybydate(fromDate, toDate) {
  let deuPaymentList = [];
  try {
    deuPaymentList = await connection.Duepayments.findAll({
      raw: true,
      attributes: [
        // [
        //   connection.sequelize.literal(
        //     `printf("%.${global.ROUNDOFF_UPTO}f",( sum(due_amount)))`,
        //   ),
        //   'total_amount',
        // ],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(due_amount))`,
          ),
          'total_amount',
        ],
        // 'payment_mode',
        'bill_number',
        'customer_name',
        'created_time',
        'order_id',
      ],
      order: [['id', 'DESC']],
      // group: ['order_id'],
      where: {
        store_id: global.storeDetails.store_id,
        // user_id: global.storeDetails.username,
        created_time: {
          [connection.Sequelize.Op.between]: [fromDate, toDate],
        },
        // order_state: 'fulfilled',
        due_amount: {
          [connection.Sequelize.Op.ne]: 0,
        },
        status: 1,
      },
    });

    // get last transaction
    const lastTransactions = {};
    deuPaymentList.forEach((tx) => {
      if (!lastTransactions[tx.order_id]) {
        lastTransactions[tx.order_id] = tx;
      }
    });
    const result = Object.values(lastTransactions);
    let duePayment = 0;
    if (result && result.length) {
      result.forEach((r) => {
        duePayment += Number(r.total_amount);
      });
    }
    return duePayment.toFixed(global.ROUNDOFF_UPTO);
  } catch (err) {
    console.log(err);
  }
}
async function getWalletCreditedSummarybydate({ toDate, fromDate }) {
  let transactionsList = [];
  let walletCredited = 0;
  const formattedFromDate = global
    .moment(Number(fromDate))
    .format('YYYY-MM-DD HH:mm:ss.SSS Z');
  const formattedToDate = global
    .moment(Number(toDate))
    .format('YYYY-MM-DD HH:mm:ss.SSS Z');
  try {
    transactionsList = await connection.WalletTransactions.findAll({
      raw: true,
      attributes: [
        // 'amount',
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_wallet_transactions.amount)))`,
          ),
          'amount',
        ],
      ],

      include: [
        {
          model: connection.Wallet,
          attributes: ['wallet_name'],
        },
      ],
      where: {
        created_time: {
          [connection.Sequelize.Op.between]: [
            formattedFromDate,
            formattedToDate,
          ],
        },
        credit_debit_type: 1,
      },
    });
    if (transactionsList && transactionsList.length) {
      walletCredited = transactionsList[0].amount;
    }
    return walletCredited;
  } catch (err) {
    console.log(err);
  }
}

async function getWalletDebitedSummarybydate({ toDate, fromDate }) {
  let transactionsList = [];
  let walltedDebited = 0;
  const formattedFromDate = global
    .moment(Number(fromDate))
    .format('YYYY-MM-DD HH:mm:ss.SSS Z');
  const formattedToDate = global
    .moment(Number(toDate))
    .format('YYYY-MM-DD HH:mm:ss.SSS Z');
  try {
    transactionsList = await connection.WalletTransactions.findAll({
      raw: true,
      attributes: [
        // 'amount',
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_wallet_transactions.amount)))`,
          ),
          'amount',
        ],
      ],

      include: [
        {
          model: connection.Wallet,
          attributes: ['wallet_name'],
        },
      ],
      group: [
        'credit_debit_type',
        'mpos_wallet_transactions.cust_phone',
        'payment_mode',
      ],
      where: {
        created_time: {
          [connection.Sequelize.Op.between]: [
            formattedFromDate,
            formattedToDate,
          ],
        },
        credit_debit_type: 0,
      },
    });
    if (transactionsList && transactionsList.length) {
      walltedDebited = transactionsList[0].amount;
    }
    return walltedDebited;
  } catch (err) {
    console.log(err);
  }
}
async function getDashboarddetails(params) {
  let response = {};
  console.log('getDashboarddetails params::', params);
  if (params.store_id && params.user_id) {
    let sales_params = params.sales_params;
    let items_params = params.items_params;
    let bydate = params.bydate;

    const fromDate = params.fromDate;
    const toDate = params.toDate;
    if (bydate) delete params.bydate;
    if (items_params) delete params.items_params;
    if (sales_params) delete params.sales_params;
    let payment_modes = await connection.BillPayment.getPayments({
      store_id: global.storeDetails.store_id,
      fromDate: params.fromDate,
      toDate: params.toDate,
      order_state: `"fulfilled"`,
    });

    let dashboardDetails = undefined;
    let ordertypewisedashboardDetails = undefined;
    if (bydate) {
      dashboardDetails =
        await connection.Bill.getDashboarddetailsbydate(params);
    } else {
      console.time();
      dashboardDetails = await connection.Bill.getDashboarddetails(params);
      ordertypewisedashboardDetails =
        await connection.Bill.getOrderTypeWiseDashboarddetails(params);
      console.timeEnd();
    }
    let weekdays = await connection.Bill.getsalesbyweekdays(params);
    let saleschartdata = await connection.Bill.getsaleschartdata(sales_params);
    let topItems = await connection.BillItem.gettopSolditems(items_params);
    let customers = await connection.Customer.count({
      where: {
        store_id: params.store_id,
      },
    });
    let { expensesTotal: total_expense, expenseInCashOnly } =
      await connection.Expenses.getExpensestotal({
        store_id: params.store_id,
      });
    let { expenseInCashOnly: todays_cash_expense } =
      await connection.Expenses.getExpensestotal({
        store_id: params.store_id,
        fromDate: params.fromDate,
        toDate: params.toDate,
      });

    let total_todays_cash_amount =
      await connection.BillPayment.getCashPaymentsOnly({
        store_id: global.storeDetails.store_id,
        fromDate: params.fromDate,
        toDate: params.toDate,
        order_state: `"fulfilled"`,
      });

    let startenddayOpeningBalanace = await connection.StartcloseDay.findAll({
      attributes: ['opening_balance'],
      limit: 1,
      raw: true,
      order: [['id', 'DESC']],
    });

    if (dashboardDetails) dashboardDetails.total_expense = total_expense;
    if (dashboardDetails) dashboardDetails.customers = customers;

    // due payments receivable
    const duePaymentReceivable = await getDuePaymentReceivableSummarybydate(
      fromDate,
      toDate,
    );
    // due payments received
    const duePaymentRecieved = await getDuePaymentSummarybydate(
      fromDate,
      toDate,
    );

    // wallet debited
    const walletDebited = await getWalletDebitedSummarybydate({
      fromDate,
      toDate,
    });
    // wallet credited
    const walletCredited = await getWalletCreditedSummarybydate({
      fromDate,
      toDate,
    });
    response.data = {
      payment_modes,
      dashboardDetails,
      ordertypewisedashboardDetails,
      weekdays,
      saleschartdata,
      topItems,
      getSalesby: sales_params.getSalesby,
      todays_cash_expense,
      total_todays_cash_amount,
      startenddayOpeningBalanace,
      duePaymentReceivable,
      duePaymentRecieved,
      walletDebited,
      walletCredited,
    };
  } else {
    response.status = 400;
    response.message = 'Invalid store id/user id';
    console.log(error);
  }

  return response;
}

/**
 * Note: negative as it incremented,
 * positive as it decremented
 * @param {*} previousSales
 * @param {*} currentSales
 */
function getPercentageChange(previousSales, currentSales) {
  var decreaseValue = previousSales - currentSales;
  return (decreaseValue / previousSales) * 100;
}
