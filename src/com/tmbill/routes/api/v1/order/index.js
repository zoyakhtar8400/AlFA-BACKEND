const express = require('express');
const { HttpStatusCode } = require('axios');
const {
  checkBillIsRunning,
  updateWaiter,
} = require('../../../../main_controllers/Order');
const { getCatalog } = require('../../../../main/services/Catalog.service');
const {
  fetchNextBillKOTNumber,
  getSyncstatus,
  requestSaveOrder,
  requestSettleOrder,
  requestSettleQuickbill,
  requestupdateOrdercharges,
  requestupdateOrderdiscount,
  requestupdateOrdercustomer,
  requestUpdatedeliveryboy,
  requestSplitbillbyportion,
  requestSplitbillbypercent,
  requestSplitbillbyitems,
  requestUpdateCustomerAddress,
  requestCheckBillNumberIsValidOrNot,
  requestGetWalletDetails,
  requestCheckDuePayExist,
  requestSettleOnlinebill,
  requestCheckBillPrinted,
  requestUpdateBillPrintStatus,
  requestSaveWaiterTip,
  requestUpdateOrderDataAsPerPayment,
  requestItemUpdatesForReeloDiscount,
  requestUpdateReeloExtraDetails,
  requestSendRewardHistory,
  requestFilterOrders,
  requestUpdatePreOrderData,
  requestUpdateEBillStatusCheck,
  requestUpdateOrder,
  requestFastSettle,
  requestOrdersyncstatus,
  requestDoesorderIdexistcheck,
  requestisOrdersavedcheck,
  requestisUpdateItemsdiscount,
  requestCheckIfOrderIsSaved,
  requestSendCouponHistory,
  requestAddOrderNote,
  requestGetItemAddons,
  requestAddZatcaStatus,
  requestGetRunningOrderDetails,
} = require('../../../../main/services/Order.service');
const { initSyncrequest } = require('../../../../main/services/Sync.service');

const orderRouter = express.Router();

async function runningbillHandler(req, res) {
  const result = await checkBillIsRunning();
  res.json(result);
}

async function getOrderwindowDetailsHandler(req, res) {
  const result = await getCatalog(req.body);
  res.json(result);
}

async function fetchNextbillnkothandler(req, res) {
  const result = await fetchNextBillKOTNumber();
  res.json(result);
}

async function getSyncstatushandler(req, res) {
  const result = await getSyncstatus();
  res.json(result);
}

async function saveOrderhandler(req, res) {
  const result = await requestSaveOrder(req.body);
  res.json(result);
}

async function settleOrderhandler(req, res) {
  const result = await requestSettleOrder(req.body);
  res.json(result);
}

async function settleQuickbillhandler(req, res) {
  const result = await requestSettleQuickbill(req.body);
  res.json(result);
}

async function updateChargeshandler(req, res) {
  const result = await requestupdateOrdercharges(req.body);
  res.json(result);
}

async function updateDiscounthandler(req, res) {
  const result = await requestupdateOrderdiscount(req.body);
  res.json(result);
}

async function updateCustomerhandler(req, res) {
  const result = await requestupdateOrdercustomer(req.body);
  res.json(result);
}

async function updateDeliveryboyhandler(req, res) {
  const result = await requestUpdatedeliveryboy(req.body);
  res.json(result);
}

async function updateCustomerAddress(req, res) {
  const result = await requestUpdateCustomerAddress(req.body);
  res.json(result);
}

async function checkBillNumberResetIsValidhandler(req, res) {
  const result = await requestCheckBillNumberIsValidOrNot(req.body);
  res.json(result);
}

async function getWalletDetailshandler(req, res) {
  const result = await requestGetWalletDetails(req.body);
  res.json(result);
}

async function checkDuePayExisthandler(req, res) {
  const result = await requestCheckDuePayExist(req.body);
  res.json(result);
}

async function updateWaiterHandler(req, res) {
  const result = await updateWaiter(req.body);
  res.json(result);
}

async function settleOnlineOrderhandler(req, res) {
  const result = await requestSettleOnlinebill(req.body);
  res.json(result);
}

async function checkBillPrintedhandler(req, res) {
  const result = await requestCheckBillPrinted(req.body);
  res.json(result);
}

async function updateBillPrintStatusHandler(req, res) {
  const result = await requestUpdateBillPrintStatus(req.body);
  res.json(result);
}

async function sendCouponHistoryHandler(req, res) {
  const result = await requestSendCouponHistory(req.body);
  res.json(result);
}

async function saveWaiterTipHandler(req, res) {
  const result = await requestSaveWaiterTip(req.body);
  res.json(result);
}

async function updatePaymentDataAsperpaymentInfohandler(req, res) {
  const result = await requestUpdateOrderDataAsPerPayment(req.body);
  res.json(result);
}

async function updateItemsforReeloDiscounthandler(req, res) {
  const result = await requestItemUpdatesForReeloDiscount(req.body);
  res.json(result);
}

async function updateReeloExtraDetails(req, res) {
  const result = await requestUpdateReeloExtraDetails(req.body);
  res.json(result);
}

async function sendRewardHistoryHandler(req, res) {
  const result = await requestSendRewardHistory(req.body);
  res.json(result);
}

async function filterPreOrderByDateHandler(req, res) {
  const result = await requestFilterOrders(req.body);
  res.json(result);
}

async function updatePreOrderDatahandler(req, res) {
  const result = await requestUpdatePreOrderData(req.body);
  res.json(result);
}

async function updateEBillCheckStatushandler(req, res) {
  const result = await requestUpdateEBillStatusCheck(req.body);
  res.json(result);
}

async function checkIfOrderIsSavedhandler(req, res) {
  const result = await requestCheckIfOrderIsSaved(req.body);
  res.json(result);
}

async function splitbillByportionhandler(req, res) {
  const result = await requestSplitbillbyportion(req.body);
  res.json(result);
}

async function splitbillBypercentagehandler(req, res) {
  const result = await requestSplitbillbypercent(req.body);
  res.json(result);
}

async function splitbillByitemshandler(req, res) {
  const result = await requestSplitbillbyitems(req.body);
  res.json(result);
}

// this endpoint can be used to update any order details by passing the order id

async function requestUpdateOrderhandler(req, res) {
  const result = await requestUpdateOrder(req.body);
  res.json(result);
}

async function fastSettlehandler(req, res) {
  const result = await requestFastSettle(req.body);
  res.json(result);
}

async function requestOrdersyncstatushandler(req, res) {
  const result = await requestOrdersyncstatus(req.body);
  res.json(result);
}

async function requestDoesorderIdexistcheckhandler(req, res) {
  const result = await requestDoesorderIdexistcheck(req.body);
  res.json(result);
}

async function requestisOrdersavedcheckhandler(req, res) {
  const result = await requestisOrdersavedcheck(req.body);
  res.json(result);
}

async function requestisupdatekotItemsdiscounthandler(req, res) {
  const result = await requestisUpdateItemsdiscount(req.body);
  res.json(result);
}

async function requestAddOrdernotehandler(req, res) {
  const result = await requestAddOrderNote(req.body);
  res.json(result);
}

async function requestItemOptionshandler(req, res) {
  const result = await requestGetItemAddons(req.body);
  res.json(result);
}

async function requestAddZatcaStatushandler(req, res) {
  const result = await requestAddZatcaStatus(req.body);
  res.json(result);
}

async function requestGetRunningOrderDtailshandler(req, res) {
  const result = await requestGetRunningOrderDetails(req.body);
  res.json(result);
}
async function initSyncrequesthandler(req, res) {
  initSyncrequest(req.body);
  res.json({
    status: HttpStatusCode.Ok,
    message: 'Request Queued',
  });
}

orderRouter.post('/Sync', initSyncrequesthandler);
orderRouter.post('/UpdateItemDiscount', requestisupdatekotItemsdiscounthandler);
orderRouter.post('/OrderIDExist', requestDoesorderIdexistcheckhandler);
orderRouter.post('/IsOrderSaved', requestisOrdersavedcheckhandler);
orderRouter.post('/FastSettle', fastSettlehandler);
orderRouter.put('/UpdateOrder', requestUpdateOrderhandler);
orderRouter.post('/SyncStatus', requestOrdersyncstatushandler);
orderRouter.get('/CheckBillisRunning', runningbillHandler);
orderRouter.post('/GetOrderWindowDetails', getOrderwindowDetailsHandler);
orderRouter.get('/FetchNextBillnKOT', fetchNextbillnkothandler);
orderRouter.get('/GetSyncStatus', getSyncstatushandler);
orderRouter.post('/SaveOrder', saveOrderhandler);
orderRouter.post('/SettleOrder', settleOrderhandler);
orderRouter.post('/SettleQuickBill', settleQuickbillhandler);
orderRouter.post('/UpdateCharges', updateChargeshandler);
orderRouter.post('/UpdateDiscount', updateDiscounthandler);
orderRouter.post('/UpdateCustomer', updateCustomerhandler);
orderRouter.post('/UpdateDeliveryboy', updateDeliveryboyhandler);
orderRouter.post('/UpdateCustomerAddress', updateCustomerAddress);
orderRouter.post(
  '/CheckBillNumberResetIsValid',
  checkBillNumberResetIsValidhandler,
);
orderRouter.post('/GetWalletDetails', getWalletDetailshandler);
orderRouter.post('/CheckDuePayExist', checkDuePayExisthandler);
orderRouter.post('/UpdateWaiter', updateWaiterHandler);
orderRouter.post('/SettleOnlineOrder', settleOnlineOrderhandler);
orderRouter.post('/CheckBillPrinted', checkBillPrintedhandler);
orderRouter.post('/UpdatePrintStatusOfOrder', updateBillPrintStatusHandler);
orderRouter.post('/SendCouponHistory', sendCouponHistoryHandler);
orderRouter.post('/SaveWaiterTip', saveWaiterTipHandler);
orderRouter.post(
  '/UpdateOrderDataAsperPaymentinfo',
  updatePaymentDataAsperpaymentInfohandler,
);
orderRouter.post(
  '/UpdateItemsForReeloDiscount',
  updateItemsforReeloDiscounthandler,
);
orderRouter.post('/UpdateReeloExtraDetails', updateReeloExtraDetails);
orderRouter.post('/SendRewardHistory', sendRewardHistoryHandler);
orderRouter.post('/FilterPreOrderByDate', filterPreOrderByDateHandler);
orderRouter.post('/UpdatePreOrderData', updatePreOrderDatahandler);
orderRouter.post('/UpdateEBillCheckStatus', updateEBillCheckStatushandler);
orderRouter.post('/CheckOrderIsSaved', checkIfOrderIsSavedhandler);
orderRouter.post('/GetItemOptions', requestItemOptionshandler);

// Split Order
orderRouter.post('/SplitOrderbyPortion', splitbillByportionhandler);
orderRouter.post('/SplitOrderbyPercentage', splitbillBypercentagehandler);
orderRouter.post('/SplitOrderbyItems', splitbillByitemshandler);
orderRouter.post('/AddOrderNote', requestAddOrdernotehandler);

orderRouter.post('/AddZatcaStatus', requestAddZatcaStatushandler);
orderRouter.post(
  '/GetRunningOrderDetails',
  requestGetRunningOrderDtailshandler,
);

module.exports = orderRouter;
