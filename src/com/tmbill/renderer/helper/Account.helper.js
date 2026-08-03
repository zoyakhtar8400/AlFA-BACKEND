const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makeCheckPreCloseShiftRequest(checkShiftData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.CHECK_PRE_CLOSE_SHIFT,
      checkShiftData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeCheckUserShiftStartedRequest(checkShiftData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.CHECK_USERSHIFT_STARTED,
      checkShiftData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeCloseShiftRequest(closeShiftData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.CLOSE_SHIFT,
      closeShiftData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeCloseDayShiftRequest(closeDayShiftData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.CLOSE_DAY_AND_SHIFT,
      closeDayShiftData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function startShiftRequest(startDayData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.START_SHIFT,
      startDayData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while starting shift" `, error);
  }
  return undefined;
}

async function makeSettledBillByPaymentsModeRequest(discountData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.GET_SETTLED_BILLS_BY_PAYMENT_MODE,
      discountData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function checkIfBillIsRunningRequest(startDayData) {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.ACCOUNT.CHECK_IFBILL_IS_RUNNING,
      startDayData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking if bill is running" `, error);
  }
  return undefined;
}

async function getOrderSummaryRequest(getOrderSumaryData) {
  try {
    console.log(
      `Message="Get order summary request" Payload=${JSON.stringify(getOrderSumaryData)}`,
    );
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.GET_ORDER_SUMMARY,
      getOrderSumaryData,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while getting order summary report in getOrderSummaryRequest" `,
      error,
    );
  }
  return undefined;
}

async function getshiftwiseReportRequest(getShiftwiseReportData) {
  try {
    console.log(
      `Message="Get shift wise report" Payload=${JSON.stringify(getShiftwiseReportData)}`,
    );
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.GET_SHIFTWISE_REPORT,
      getShiftwiseReportData,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while getting shift wise user report in getshiftwiseReportRequest" `,
      error,
    );
  }
  return undefined;
}

async function checkIfKOTIsRunningRequest(startDayData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.CHECK_IF_KOT_IS_RUNNING,
      startDayData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking running kot `, error);
  }
  return undefined;
}

async function checkIfAllShiftAreClosedRequest(startDayData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ACCOUNT.CHECK_IF_ALL_SHIFTS_ARE_CLOSED,
      startDayData,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while checking all shifts are closed" `,
      error,
    );
  }
  return undefined;
}
module.exports = {
  makeCheckPreCloseShiftRequest,
  makeCloseShiftRequest,
  makeSettledBillByPaymentsModeRequest,
  startShiftRequest,
  makeCloseDayShiftRequest,
  makeCheckUserShiftStartedRequest,
  checkIfBillIsRunningRequest,
  getOrderSummaryRequest,
  getshiftwiseReportRequest,
  checkIfKOTIsRunningRequest,
  checkIfAllShiftAreClosedRequest,
};
