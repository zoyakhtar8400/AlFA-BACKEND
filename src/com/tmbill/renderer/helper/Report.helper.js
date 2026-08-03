const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makeGetReortDataRequest(params) {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.REPORT.GET_REPORT_DATA,
      { params, timeout: 240000 },
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while fetching report data" `, error);
  }
  return undefined;
}

async function makeUpdateCustomerToDuePaymentRequest(customer) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.REPORT.UPDATE_CUSTOMER_TO_DUE_PAYMENT,
      customer,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while updating customer to due payment" `,
      error,
    );
  }
  return undefined;
}

async function makeupdateDueAndAddTransactionRequest(duePayData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.REPORT.UPDATE_DUE_AND_ADD_TRANSACTION,
      duePayData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while updating  due payment" `, error);
  }
  return undefined;
}

async function makeCheckIfAmountIsAvailableRequest(checkdata) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.REPORT.CHECK_IF_AMONT_IS_AVAILABLE,
      checkdata,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking Amount" `, error);
  }
  return undefined;
}

module.exports = {
  makeGetReortDataRequest,
  makeUpdateCustomerToDuePaymentRequest,
  makeupdateDueAndAddTransactionRequest,
  makeCheckIfAmountIsAvailableRequest,
};
