/* eslint-disable no-console */

const { Payment } = require('../../js/database');
const { updatePayment } = require('../../main_controllers/Order');

async function requestGetpayments(data) {
  const response = {
    addPaymenttolist: data?.addPaymenttolist || undefined,
    showPaymentWindow: data?.showPaymentWindow || undefined,
  };
  try {
    const list = await Payment.findAll({
      raw: true,
      where: {
        store_id: data.store_id || global.storeDetails.store_id,
      },
    });

    response.payments = list;
  } catch (error) {
    console.error(`Message="Error While Getting Store Payments"`, error);
  }
  return response;
}

async function requestUpdatepayments(data) {
  try {
    const result = await updatePayment(data);
    return result;
  } catch (error) {
    console.error(`Message="Error While Updating Order Payment"`, error);
  }
  return undefined;
}

module.exports = {
  requestGetpayments,
  requestUpdatepayments,
};
