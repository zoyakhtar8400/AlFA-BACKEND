/* eslint-disable camelcase */
const { Op } = require('sequelize');
const {
  BillPayment,
  UserShift,
  StartcloseDay,
  Bill,
  Expenses,
  KOT,
  Sequelize,
  Table,
} = require('../js/database');
const { syncStartenddaydata } = require('../services/SyncService');
const { checkIfTimeForMidnightReport } = require('../util/MiscUtil');
const {
  getDuePaymentReceivableSummarybydate,
  setStartdayotherdetails,
} = require('./Reports');

async function getSettledBillsAsPerPaymentMode(params) {
  let paymentList = [];
  let duePayments = [];
  const { fromDate, toDate, user_id } = params;
  try {
    // paymentList = await BillPayment.getPaymentsForCLoseDay({
    //   store_id: global.storeDetails.store_id,
    //   fromDate,
    //   toDate,
    //   user_id,
    //   groupBy: 'order_state,payment_option',
    // });
    paymentList = await BillPayment.getPayments({
      store_id: global.storeDetails.store_id,
      fromDate,
      toDate,
      user_id,
      order_state: "'pending', 'fulfilled'",
    });
    duePayments = await getDuePaymentReceivableSummarybydate(fromDate, toDate);
    if (duePayments && duePayments.length) {
      const result = {
        amount: duePayments
          .reduce((sum, item) => sum + parseFloat(item.total_amount), 0)
          .toFixed(2),
        count: duePayments.length,
        transactions: duePayments.length,
        payment_option: 'Due Payment',
      };

      paymentList.push(result);
    }
  } catch (error) {
    console.error(error);
  }
  return paymentList;
}

async function startUsershift(data) {
  if (data) {
    const response = await UserShift.addNewshift(data);
    return response;
  }
  return undefined;
}

async function closeDay(content) {
  try {
    const response = await StartcloseDay.updateCloseday(content);
    await setStartdayotherdetails(
      content.id,
      content?.closedayInfo?.current_closing_balance,
      response,
      content?.closedayInfo?.countMidnightSale,
      content?.closedayInfo?.nextDayOpeningAmount,
    );
    const startendDaydetails = await StartcloseDay.findAll({
      raw: true,
      where: {
        id: content.id,
      },
    });
    const isTimebetweenMidnightSale = checkIfTimeForMidnightReport();
    Object.assign(response, {
      insertedstartenddayId: content.id,
      startendDaydetails,
      isTimebetweenMidnightSale,
    });

    syncStartenddaydata({
      store_id: global.storeDetails.store_id,
      tmpos_id: global.storeDetails.tmpos_id,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function getOrderSummary(params) {
  try {
    // get order summary and expenses as per user ida
    const orderSummary = await Bill.getOrderbyOrderStateAsPerUserName(params);

    // get expesnse
    const expenses = await Expenses.getExpensestotalAsPerUser(params);

    return { orderSummary, expenses };
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function checkIfKOTIsRunningForCloseDay(data) {
  try {
    // const { fromDate, toDate } = data;
    // const kots = await KOT.findAll({
    //   raw: true,
    //   attributes: ['table_id', 'kot_id'],
    //   where: {
    //     store_id: global.storeDetails.store_id,
    //     is_active: 1,
    //     actual_in_time: {
    //       [Sequelize.Op.between]: [fromDate, toDate],
    //     },
    //   },
    //   group: ['table_id'],
    // });

    let isKOTRunning = false;
    // if (kots && kots.length) {
    //   isKOTRunning = true;
    //   const tableStatus = [];
    //   for (let i = 0; i < kots.length; i++) {
    //     const table = await Table.findAll({
    //       where: {
    //         id: kots[i].table_id,
    //       },
    //     });
    //     if (!table.length) {
    //       tableStatus.push('false');
    //     }
    //   }
    //   if (tableStatus.includes('false')) {
    //     isKOTRunning = false;
    //   }
    // }

    const runningTables = await Table.findAll({
      where: {
        store_id: global.storeDetails.store_id,
        table_action_flag: {
          [Op.ne]: 0,
        },
      },
    });
    if (runningTables && runningTables.length) {
      isKOTRunning = true;
    }
    return isKOTRunning;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function checkIfAllShiftsAreClosedForCloseDay(data) {
  try {
    const { fromDate, toDate, username } = data;
    const checkIfAllShiftsAreClosed = await UserShift.findAll({
      attributes: ['shift_start_by_user'],
      where: {
        store_id: global.storeDetails.store_id,
        shift_end_date: {
          [Sequelize.Op.eq]: null,
        },
        created_date: {
          [Sequelize.Op.between]: [fromDate, toDate],
        },
        shift_start_by_user: {
          [Sequelize.Op.not]: username,
        },
      },
    });

    return checkIfAllShiftsAreClosed;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}
module.exports = {
  getSettledBillsAsPerPaymentMode,
  startUsershift,
  closeDay,
  getOrderSummary,
  checkIfKOTIsRunningForCloseDay,
  checkIfAllShiftsAreClosedForCloseDay,
};
