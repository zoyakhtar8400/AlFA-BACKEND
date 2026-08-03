const {
  getReportData,
  updateCustomerToDuePayment,
} = require('../../main_controllers/Reports');
const {
  updateDuepaymentandaddtransaction,
  checkIfamountavaiableinwallet,
} = require('../../main_controllers/Wallet');

async function requestGetReportData(params) {
  try {
    if (params) {
      const result = await getReportData(params);
      return JSON.stringify(result);
    }
  } catch (error) {
    console.error(`Message="Error While Updating Order Level Values"`, error);
  }
  return undefined;
}

async function requestUpdateCustomerToDuePayment(params) {
  try {
    if (params) {
      const result = await updateCustomerToDuePayment(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Updating Order Level Values"`, error);
  }
  return undefined;
}

async function requestUpdateDueAndAddTransaction(params) {
  try {
    if (params) {
      const result = await updateDuepaymentandaddtransaction(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Updating Order Level Values"`, error);
  }
  return undefined;
}

async function requestcheckIfAmountIsAvailablehandler(params) {
  try {
    if (params) {
      const result = await checkIfamountavaiableinwallet(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While checking amount"`, error);
  }
  return undefined;
}

module.exports = {
  requestGetReportData,
  requestUpdateCustomerToDuePayment,
  requestUpdateDueAndAddTransaction,
  requestcheckIfAmountIsAvailablehandler,
};
