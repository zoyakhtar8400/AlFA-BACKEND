/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const { ipcMain } = require('electron');
const sumBy = require('lodash/sumBy');
const filter = require('lodash/filter');
const {
  CHECK_USERSHIFTSTARTED,
  START_USERSHIFT,
  START_USERSHIFT_REPLY,
  CHECK_USERSHIFTSTARTED_REPLY,
  CHECK_PRECLOSESHIFT,
  CHECK_PRECLOSESHIFT_REPLY,
  CLOSE_SHIFT,
  CLOSE_SHIFT_REPLY,
} = require('../util/IPC_Messages');
const {
  ONLINE_PLATFORMS,
  OFFLINE_BILLING_TYPES,
  OrderState,
} = require('../util/DBUtil');
const connection = require('../js/database');

let syncStartenddaydata;
const { COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY } = require('../util/SettingIDs');
const { checkIfTimeForMidnightReport } = require('../util/MiscUtil');
const { Op } = require('sequelize');

async function checkUsershiftstarted(event, data) {
  try {
    const response = await connection.UserShift.checkIfshiftstarted(data);
    // console.log(response);
    event.reply(CHECK_USERSHIFTSTARTED_REPLY, response);
  } catch (error) {
    console.log(error);
  }
}

async function startUsershift(event, data) {
  if (data) {
    const response = await connection.UserShift.addNewshift(data);
    event.reply(START_USERSHIFT_REPLY, response);
  }
}

async function preshiftcloseCheck(event, data) {
  try {
    const response = await connection.UserShift.isusershiftStarted(data);
    event.reply(CHECK_PRECLOSESHIFT_REPLY, response);
  } catch (error) {}
}

/**
 * Closes a shift of an user
 * @param {Event } event
 * @param {Data } data
 */
async function closeuserShift(data) {
  let response = {};
  try {
    const { closeshiftInfo } = data;
    const { id } = data;

    response = await connection.UserShift.closeuserShift(closeshiftInfo, id);

    const userShiftResponse = await generateUsershiftdata({
      fromDate: closeshiftInfo.shift_start_date,
      toDate: closeshiftInfo.shift_end_date,
      prev_closing_balance: data.prev_closing_balance,
      username: closeshiftInfo.shift_end_by_user,
      insertedId: id,
      countMidnightSale: closeshiftInfo.countMidnightSale,
    });
    let isTimebetweenMidnightSale = false;
    const isTimebetweenMidnight = checkIfTimeForMidnightReport();
    if (isTimebetweenMidnight) {
      isTimebetweenMidnightSale = true;
    }

    Object.assign(response, {
      cash_diff: userShiftResponse.cash_diff,
      fromDate: closeshiftInfo.shift_start_date,
      toDate: Number(closeshiftInfo.shift_end_date),
      username: closeshiftInfo.shift_end_by_user,
      store_id: global.storeDetails.store_id,
      total_sales: userShiftResponse.total_sales,
      total_expense: userShiftResponse.total_expense,
      expenseInCashOnly: userShiftResponse.expenseInCashOnly,
      invoice_range: userShiftResponse.invoice_range,
      opening_balance: userShiftResponse.opening_balance,
      closing_balance: Number(userShiftResponse.current_closing_balance),
      shift_start_comment: userShiftResponse.shift_start_comment,
      shift_end_comment: userShiftResponse.shift_end_comment,
      close_shift_amount: userShiftResponse.close_shift_amount,
      shift_start_by_user: userShiftResponse.shift_start_by_user,
      shift_end_by_user: userShiftResponse.shift_end_by_user,
      countMidnightSale: closeshiftInfo.countMidnightSale,
      isTimebetweenMidnightSale,
      shift_end_currency_denomination:
        closeshiftInfo.shift_end_currency_denomination,
      shift_end_transactions: closeshiftInfo.shift_end_transactions,
    });
  } catch (error) {}
  // event.reply(CLOSE_SHIFT_REPLY, response);
  syncStartenddaydata(connection, {
    store_id: global.storeDetails.store_id,
    tmpos_id: global.storeDetails.tmpos_id,
  });
  return response;
}

async function generateUsershiftdata({
  fromDate,
  toDate,
  prev_closing_balance,
  username,
  insertedId,
  countMidnightSale,
}) {
  try {
    const isTimebetweenMidnightSale = checkIfTimeForMidnightReport();
    // if(countMidnightSale && isTimebetweenMidnightSale){
    //     // fromDate = moment(fromDate).subtract(1, 'days').format('x');
    //     fromDate = moment(fromDate).set("hour", 00).set("minute", 00).format('x');
    //     toDate = Number(toDate)
    //     toDate = moment(toDate).subtract(1, 'days').set("hour", 23).set("minute", 59).format('x');
    // }
    const params = {
      fromDate: Number(fromDate),
      toDate: Number(toDate),
      store_id: global.storeDetails.store_id,
      username,
    };

    let currentShiftdata = await connection.UserShift.findAll({
      limit: 1,
      raw: true,
      where: {
        id: insertedId,
      },
    });
    currentShiftdata = currentShiftdata[0];
    let { opening_balance } = currentShiftdata;
    if (!opening_balance) {
      opening_balance = 0;
    }

    const total_sales = await connection.Bill.getSalestotal(params);
    const due_amount = await connection.Bill.getduepayTotal(params);
    const { expensesTotal: total_expense, expenseInCashOnly } =
      await connection.Expenses.getExpensestotal(params);
    // const { expensesPaymentData } =
    //   await connection.Expenses.getExpensesPaymentData(params);
    // let invoice_range = await connection.Bill.getBillrange(params);
    let invoice_range = await connection.Bill.getBillrange(params);

    if (invoice_range) {
      invoice_range = {
        min_bill_number: invoice_range.min_bill_number,
        max_bill_number: invoice_range.max_bill_number,
      };
      // invoice_range = Object.values(bill_range).join('-');
    }

    let generated_bill_range = {};
    if (invoice_range) {
      generated_bill_range = invoice_range;
      invoice_range = Object.values(invoice_range).join('-');
    }
    const updateData = {
      total_expense,
      total_sales,
      invoice_range,
    };
    const extra_details = {
      generated_bill_range,
    };
    if (isTimebetweenMidnightSale) {
      Object.assign(extra_details, { isDayClosedAtMidnight: true });
    }

    const data = await connection.Expenses.getDataforstartendDayreport(params);
    extra_details.expense_data = {
      data,
    };
    extra_details.day_end_data = {
      expenseInCashOnly,
      total_expense,
      prev_closing_balance,
      due_amount,
    };
    const orderDetails = await connection.Bill.getDataforstartendDayreport(
      params,
      OFFLINE_BILLING_TYPES,
      ONLINE_PLATFORMS,
    );
    extra_details.orderDetails = orderDetails;
    await getOrderdetailsbybillstatus(params, extra_details);

    const payment_modes = await connection.BillPayment.getPayments({
      store_id: global.storeDetails.store_id,
      fromDate: params.fromDate,
      toDate: params.toDate,
      user_id: username,
      order_state: "'pending', 'fulfilled'",
    });

    let rawcashinHand = 0;
    extra_details.day_end_data.rawcashinHand = rawcashinHand;
    if (payment_modes && payment_modes.length > 0) {
      extra_details.payment_modes = {
        data: payment_modes,
      };
      const rawcashPayments = filter(payment_modes, (o) =>
        ['cash'].includes(String(o.payment_option).toLowerCase()),
      );
      rawcashinHand = sumBy(rawcashPayments, 'amount');
      extra_details.day_end_data.rawcashinHand = rawcashinHand;
      updateData.raw_cash_in_hand = rawcashinHand;
    }
    if (orderDetails.online_orderDetails.overallInfo) {
      extra_details.day_end_data.online_amount =
        orderDetails.online_orderDetails.overallInfo.amount;
    }
    try {
      // Old Way
      // extra_details.day_end_data.Cash_in_hand =
      //     (Number(opening_balance) +
      //         Number(extra_details.day_end_data.fulfilled_order_amount)) -
      //     Number(extra_details.day_end_data.total_expense);

      extra_details.day_end_data.Cash_in_hand =
        Number(opening_balance) +
        Number(extra_details.day_end_data.rawcashinHand) -
        Number(extra_details.day_end_data.expenseInCashOnly);
      // Number(extra_details.day_end_data.total_expense);

      extra_details.day_end_data.Cash_in_hand = Number(
        extra_details.day_end_data.Cash_in_hand,
      ).toFixed(ROUNDOFF_UPTO);
      extra_details.day_end_data.opening_balance =
        Number(opening_balance).toFixed(ROUNDOFF_UPTO);
      extra_details.day_end_data.rawcashinHand =
        extra_details.day_end_data.Cash_in_hand;
    } catch (error) {
      extra_details.day_end_data.Cash_in_hand = 0;
    }

    updateData.extra_details = extra_details;

    // Check if current_closing_balance is provided or not
    // if not then calculate the balance
    if (extra_details.day_end_data.Cash_in_hand) {
      const current_closing_balance = extra_details.day_end_data.Cash_in_hand;
      updateData.current_closing_balance = current_closing_balance;
    }
    const cash_diff =
      currentShiftdata.close_shift_amount - updateData.current_closing_balance;
    updateData.cash_diff = cash_diff.toFixed(ROUNDOFF_UPTO);
    // console.log(JSON.stringify(extra_details));
    await connection.UserShift.update(updateData, {
      where: {
        id: insertedId,
      },
    });

    return {
      cash_diff,
      total_sales,
      total_expense,
      expenseInCashOnly,
      invoice_range,
      opening_balance,
      current_closing_balance: updateData.current_closing_balance,
      username,
      shift_start_comment: currentShiftdata.shift_start_comment,
      shift_end_comment: currentShiftdata.shift_end_comment,
      close_shift_amount: currentShiftdata.close_shift_amount,
      shift_start_by_user: currentShiftdata.shift_start_by_user,
      shift_end_by_user: currentShiftdata.shift_end_by_user,
      fromDate,
      toDate,
    };
  } catch (error) {
    console.log(error);
  }
}

/**
 * Generate report data for users shift
 * @param {Parameters} params
 * @param {*} extra_details
 */
async function getOrderdetailsbybillstatus(params, extra_details) {
  for (const state in OrderState) {
    const dataList = [];
    const whereData = {
      store_id: params.store_id,
      order_state: OrderState[state],
    };
    if (params.fromDate && params.toDate) {
      whereData.actual_created_time = {
        [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
      };
    }

    const attributes = [
      [
        connection.sequelize.fn('sum', connection.sequelize.col('order_total')),
        'amount',
      ],
      [
        connection.sequelize.fn('count', connection.sequelize.col('id')),
        'count',
      ],
    ];
    if (OrderState[state] == OrderState.FULFILLED) {
      attributes.push(
        [
          connection.sequelize.fn('sum', connection.sequelize.col('discount')),
          'discount',
        ],
        [
          connection.sequelize.fn(
            'sum',
            connection.sequelize.col('order_level_total_taxes'),
          ),
          'tax',
        ],
        [
          connection.sequelize.fn(
            'sum',
            connection.sequelize.col('couponDisounttotal'),
          ),
          'couponDisount',
        ],
      );
    }
    let data = await connection.Bill.findAll({
      raw: true,
      attributes,
      where: whereData,
    });

    if (data && data.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      data = data[0];
      if (data.amount == null || data.amount == undefined) {
        data.amount = 0;
      }
    }

    for (const element of OFFLINE_BILLING_TYPES) {
      whereData.billing_type = element.id;
      const data =
        await connection.Bill.getOrderdetailsbybillingtype(whereData);
      if (data) {
        data.type = element.name;
        dataList.push(data);
      }
    }
    if (OrderState[state] == OrderState.FULFILLED) {
      extra_details.day_end_data.discount = data.discount;
      extra_details.day_end_data.tax = data.tax;
      extra_details.day_end_data.couponDisount = data.couponDisount;
    }

    extra_details[`${OrderState[state]}_orders`] = {
      data,
      details: dataList,
    };
    // eslint-disable-next-line camelcase
    extra_details.day_end_data[`${OrderState[state]}_order_amount`] =
      data.amount ? data.amount : 0;
  }

  if (extra_details.orderDetails) {
    if (extra_details.orderDetails.online_orderDetails) {
      extra_details.day_end_data.online_amount =
        extra_details.orderDetails.online_orderDetails.overallInfo.amount;
    }
  }
}

/**
 * Initialize the connection
 * @param {Parameters} params
 */
function mastermenuInitializer(params) {
  if (params) {
    syncStartenddaydata = params.syncStartenddaydata;
  }
}

async function startEndDayDateData(params) {
  // get data of last 60 days
  const currentDate = new Date();
  // Subtract 60 days
  const pastDate = new Date();
  pastDate.setDate(currentDate.getDate() - 61);
  const timestamp = pastDate.getTime();
  const startEndDayData = await connection.StartcloseDay.findAll({
    raw: true,
    attributes: [
      'start_day_date',
      'day_close_date',
      'created_date',
      'start_date',
      'close_date',
    ],
    where: {
      created_date: {
        [Op.gt]: timestamp,
      },
      store_id: global.storeDetails.store_id,
    },
  });

  let startDayDates;
  let closeDayDates;
  if (startEndDayData && startEndDayData.length) {
    // result = startEndDayData.reduce((acc, item) => {
    //   acc[item.start_date] = {
    //     start_day_date: item.start_day_date,
    //     day_close_date: item.day_close_date,
    //   };
    //   return acc;
    // }, {});

    startDayDates = startEndDayData.reduce((acc, item) => {
      const { start_date, start_day_date } = item;
      if (!acc[start_date]) {
        acc[start_date] = [];
      }
      acc[start_date].push(start_day_date);
      return acc;
    }, {});

    closeDayDates = startEndDayData.reduce((acc, item) => {
      const { start_date, close_date, day_close_date } = item;
      if (!acc[start_date]) {
        acc[start_date] = [];
      }
      acc[start_date].push(day_close_date);
      return acc;
    }, {});
  }
  return { startDayDates, closeDayDates };
}

function initializeListeners() {
  ipcMain.on(CHECK_USERSHIFTSTARTED, checkUsershiftstarted);
  ipcMain.on(START_USERSHIFT, startUsershift);
  ipcMain.on(CHECK_PRECLOSESHIFT, preshiftcloseCheck);
  // ipcMain.on(CLOSE_SHIFT, closeuserShift);
}

initializeListeners();

module.exports = {
  mastermenuInitializer,
  startEndDayDateData,
  closeuserShift,
};
