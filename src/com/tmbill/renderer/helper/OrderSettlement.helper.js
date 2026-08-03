const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makegetBillsrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER_SETTLEMENT.GET_BILLS,
      content,
      {
        timeout: 120000,
      },
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeSettleMultipleOrdersRequest(settleOrderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER_SETTLEMENT.SETTLE_MULTIPLE_ORDERS,
      settleOrderData,
    );
    return data;
  } catch (error) {
    if (window.Swal.isVisible()) window.Swal.close();
    console.log(`Message="Error while settling order" `, error);
  }
  return undefined;
}

async function makeUpdateMultipleOrdersRequest(updateOrderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER_SETTLEMENT.UPDATE_MULTIPLE_ORDERS,
      updateOrderData,
    );
    return data;
  } catch (error) {
    if (window.Swal.isVisible()) window.Swal.close();
    console.log(`Message="Error while settling order" `, error);
  }
  return undefined;
}

module.exports = {
  makegetBillsrequest,
  makeSettleMultipleOrdersRequest,
  makeUpdateMultipleOrdersRequest,
};
