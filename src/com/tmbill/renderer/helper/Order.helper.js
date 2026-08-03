const { default: Swal } = require('sweetalert2');
const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function getNextKotOrderNumber() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.ORDER.FETCH_NEXT_KOTBILL_NUMBER,
    );
    return data;
  } catch (error) {
    console.log(
      `Message="Error while getting next kot and bill number" `,
      error,
    );
  }
  return undefined;
}

async function fetchSyncStatus() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.ORDER.FETCH_SYNC_STATUS,
    );
    return data;
  } catch (error) {
    console.log(
      `Message="Error while getting next kot and bill number" `,
      error,
    );
  }
  return undefined;
}

async function checkIsBillRunning() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_IS_BILL_RUNNING,
    );
    return data;
  } catch (error) {
    console.log(`Message="Error while checking is bill running" `, error);
  }
  return undefined;
}

async function makeSaveOrderRequest(saveOrderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SAVE_ORDER,
      saveOrderData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while saving order" `, error);
  }
  return undefined;
}

async function makeSettleOrderRequest(settleOrderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SETTLE_ORDER,
      settleOrderData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while settling order" `, error);
  }
  return undefined;
}

async function makeSettleQuickBillRequest(settleQuickBillData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SETTLE_QUICK_BILL,
      settleQuickBillData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while settling quick bill" `, error);
    return error;
  }
  return undefined;
}

async function makeUpdateChargesRequest(updateChargesData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_CHARGES,
      updateChargesData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while updating charges" `, error);
  }
  return undefined;
}

async function makeUpdateDiscountRequest(updateDiscountData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_DISCOUNT,
      updateDiscountData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while updating discount" `, error);
  }
  return undefined;
}

async function makeUpdateCustomerRequest(updateCustomerData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_CUSTOMER,
      updateCustomerData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while updating customer" `, error);
  }
  return undefined;
}

async function makeUpdateDeliveryBoyRequest(updateDeliveryBoyData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_DELIVERY_BOY,
      updateDeliveryBoyData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while updating delivery boy" `, error);
  }
  return undefined;
}

async function makeUpdateCustomerAddressRequest(updateCustomerData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_CUSTOMER_ADDRESS,
      updateCustomerData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while updating customer" `, error);
  }
  return undefined;
}

async function makeSplitByPortionsRequest(splitPortionData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SPLIT_BILL_BY_PORTION,
      splitPortionData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while split by portion" `, error);
  }
  return undefined;
}

async function makeSplitByPercentageRequest(updatePercentageData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SPLIT_BILL_PY_PERCENTAGE,
      updatePercentageData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while split by percentage" `, error);
  }
  return undefined;
}

async function makeSplitByItemsRequest(splitItemsData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SPLIT_BILL_BY_ITEMS,
      splitItemsData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.log(`Message="Error while split by item" `, error);
  }
  return undefined;
}

async function checkIfBillNumberIsValidOrNot(resetData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_BILL_NUMBER_VALID_OR_NOT,
      resetData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(
      `Message="Error while checking is bill number validation" `,
      error,
    );
  }
  return undefined;
}

async function getWalletDetailsRequest(walletDetails) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.GET_WALLET_DETAILS,
      walletDetails,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(`Message="Error while getting wallet details" `, error);
  }
  return undefined;
}

async function checkDuePayExistRequest(walletDetails) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_DUE_PAY_EXIST,
      walletDetails,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while getting wallet details" `, error);
  }
  return undefined;
}

async function updateWaiterRequest(waiterDetails) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_WAITER,
      waiterDetails,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(`Message="Error while updating waiter" `, error);
  }
  return undefined;
}

async function settleOnlineOrderRequest(orderDetails) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SETTLE_ONLINE_ORDER,
      orderDetails,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(`Message="Error while settling online order" `, error);
  }
  return undefined;
}

async function getDateFromBackendRequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.COMMON.GET_DATE,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while settling online order" `, error);
  }
  return undefined;
}

async function checkBillPrintedRequest(orderDetails) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_BILL_PRINTED,
      orderDetails,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking print details" `, error);
  }
  return undefined;
}

async function updatePrintStatusRequest(orderDetails) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_PRINT_STATUS,
      orderDetails,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while updating print details" `, error);
  }
  return undefined;
}

async function sendCouponHistoryRequest() {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SEND_COUPON_HISTORY,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(`Message="Error while send coupon history" `, error);
  }
  return undefined;
}

async function addWaiterTipRequest(tipData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SAVE_WAITER_TIP,
      tipData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(`Message="Error while adding waiter tip" `, error);
  }
  return undefined;
}

async function updateOrderDataAsPerPaymentInfoRequest(orderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_ORDER_DATA_AS_PER_PAYMENT_INFO,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while updating order data as per payment info" `,
      error,
    );
  }
  return undefined;
}

async function updateOrderDataRequest(orderData) {
  try {
    const { data } = await localapiCall.put(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_ORDER_DATA,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while updating order data" `, error);
  }
  return undefined;
}

async function updatePaymentRequest(paymentData) {
  try {
    const { data } = await localapiCall.put(
      MASTER_POS_ENDPOINTS.PAYMENT.UPDATE_PAYMENT,
      paymentData,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(`Message="Error while updating payment" `, error);
  }
  return undefined;
}

async function updateItemsForReeloDiscount(discountData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_ITEMS_FOR_REELO_DISCOUNT,
      discountData,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while updating items for reelo discount" `,
      error,
    );
  }
  return undefined;
}

async function updateExtraDetailsForReeloDiscount(discountData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_REELO_EXTRA_DETAILS,
      discountData,
    );
    return data;
  } catch (error) {
    console.error(
      `Message="Error while updating extra details for reelo discount" `,
      error,
    );
  }
  return undefined;
}

async function sendRewardHistoryRequest(rewardData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.SEND_REWARD_HISTORY,
      rewardData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while sending reward data" `, error);
  }
  return undefined;
}

async function filterPreOrderByDateRequest(filterData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.FILTER_PRE_ORDER_BY_DATE,
      filterData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while pre order filter by date" `, error);
  }
  return undefined;
}

async function createUpdatePreOrderByDateRequest(preOrderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.CREATE_PRE_ORDER_BY_DATE,
      preOrderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while creating pre order" `, error);
  }
  return undefined;
}

async function updateEBillCheckStatusRequest(statusData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.UPDATE_EBILL_CHECK_STATUS,
      statusData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while updating e bill status check" `, error);
  }
  return undefined;
}

async function checkUserShiftStartedRequest(statusData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.CHECK_USER_SHIFT_STARTED,
      statusData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking user shift sarted" `, error);
  }
  return undefined;
}

async function checkStartDayRequest() {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.CHECK_FOR_START_DAY,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking day started" `, error);
  }
  return undefined;
}

async function startDayRequest(startDayData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.START_DAY,
      startDayData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while starting day" `, error);
  }
  return undefined;
}

async function checkDoesOrderIdExistRequest(orderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.DOES_ORDER_ID_EXIST,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking order id exist" `, error);
  }
  return undefined;
}

async function checkOrderSyncStatusRequest(orderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_ORDER_SYNC_STATUS,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking order sync status" `, error);
  }
  return undefined;
}

async function checkIfOrderIsSavedRequest(orderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_IF_ORDER_IS_SAVED,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while checking order save status" `, error);
  }
  return undefined;
}

async function updateOrderNoteRequest(orderNoteData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.ADD_OREDR_NOTE,
      orderNoteData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while updating order note" `, error);
  }
  return undefined;
}

async function getItemAddonsRequest(itemData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.GET_ITEM_OPTION,
      itemData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while getting item addons" `, error);
  }
  return undefined;
}

async function addZatcaDataRequest(orderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.ADD_ZATCA_STATUS,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while adding zatca data" `, error);
  }
  return undefined;
}

async function getRunningOrderDetialsRequest(orderData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.GET_RUNNING_ORDER_DETAILS,
      orderData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while adding getting data" `, error);
  }
  return undefined;
}
module.exports = {
  updateOrderNoteRequest,
  checkIfOrderIsSavedRequest,
  checkOrderSyncStatusRequest,
  checkDoesOrderIdExistRequest,
  startDayRequest,
  checkStartDayRequest,
  checkUserShiftStartedRequest,
  updateEBillCheckStatusRequest,
  createUpdatePreOrderByDateRequest,
  sendRewardHistoryRequest,
  updateItemsForReeloDiscount,
  updateOrderDataAsPerPaymentInfoRequest,
  addWaiterTipRequest,
  sendCouponHistoryRequest,
  updatePrintStatusRequest,
  checkBillPrintedRequest,
  getDateFromBackendRequest,
  settleOnlineOrderRequest,
  checkDuePayExistRequest,
  checkIfBillNumberIsValidOrNot,
  getNextKotOrderNumber,
  fetchSyncStatus,
  checkIsBillRunning,
  makeSaveOrderRequest,
  makeSettleOrderRequest,
  makeSettleQuickBillRequest,
  makeUpdateChargesRequest,
  makeUpdateDiscountRequest,
  makeUpdateCustomerRequest,
  makeUpdateDeliveryBoyRequest,
  makeUpdateCustomerAddressRequest,
  makeSplitByPortionsRequest,
  makeSplitByPercentageRequest,
  makeSplitByItemsRequest,
  getWalletDetailsRequest,
  updateWaiterRequest,
  updatePaymentRequest,
  updateExtraDetailsForReeloDiscount,
  filterPreOrderByDateRequest,
  updateOrderDataRequest,
  getItemAddonsRequest,
  addZatcaDataRequest,
  getRunningOrderDetialsRequest,
};
