const express = require('express');
require('../../../../main/services/Payment.service');
const {
  getBillitemdetails,
  getBills,
  getPrintcount,
  updatePrintcount,
  requestreduceInventory,
  requestreverseInventory,
  requestupdateBillandpayment,
  requestGetduepaymenttrx,
  requestSetBillsyncstatus,
  requestGetPaymentsforreceipt,
  requestcancelItemModifyBill,
  requestupdateModifyBillQuantity,
  requestupdateOrderLevelValues,
  requestSaveIRNResponse,
} = require('../../../../main/services/Receipt.service');

const receiptRouter = express.Router();

async function getBillitemdetailshandler(req, res) {
  const data = await getBillitemdetails(req.body);
  res.json(data);
}

async function getBillshandler(req, res) {
  const data = await getBills(req.body);
  res.json(data);
}

async function getPrintcounthandler(req, res) {
  const data = await getPrintcount(req.query);
  res.json(data);
}

async function updatePrintcounthandler(req, res) {
  const data = await updatePrintcount(req.body);
  res.json(data);
}
async function requestreduceInventoryhandler(req, res) {
  const data = await requestreduceInventory(req.body);
  res.json(data);
}

async function requestreversenventoryhandler(req, res) {
  const data = await requestreverseInventory(req.body);
  res.json(data);
}

async function requestupdateBillandpaymenthandler(req, res) {
  const data = await requestupdateBillandpayment(req.body);
  res.json(data);
}

async function requestGetduepaymenttrxhandler(req, res) {
  const data = await requestGetduepaymenttrx(req.body);
  res.json(data);
}

async function requestSetBillsyncstatushandler(req, res) {
  const data = await requestSetBillsyncstatus(req.body);
  res.json(data);
}

async function requestGetPaymentshandler(req, res) {
  const data = await requestGetPaymentsforreceipt();
  res.json(data);
}

async function requestcancelItemModifyBillhandler(req, res) {
  const data = await requestcancelItemModifyBill(req.body);
  res.json(data);
}

async function requestupdateModifyBillQuantityhandler(req, res) {
  const data = await requestupdateModifyBillQuantity(req.body);
  res.json(data);
}

async function requestupdateOrderLevelValueshandler(req, res) {
  const data = await requestupdateOrderLevelValues(req.body);
  res.json(data);
}

async function requestSaveIRNResponsehandler(req, res) {
  const data = await requestSaveIRNResponse(req.body);
  res.json(data);
}

receiptRouter.post('/GetBills', getBillshandler);
receiptRouter.post('/GetBillDetails', getBillitemdetailshandler);
receiptRouter.get('/PrintCount', getPrintcounthandler);
receiptRouter.put('/PrintCount', updatePrintcounthandler);
receiptRouter.post('/ReduceInventory', requestreduceInventoryhandler);
receiptRouter.post('/ReverseInventory', requestreversenventoryhandler);
receiptRouter.post('/UpdateBillnPayment', requestupdateBillandpaymenthandler);
receiptRouter.post('/GetDuePayTrx', requestGetduepaymenttrxhandler);
receiptRouter.post('/ResyncBill', requestSetBillsyncstatushandler);
receiptRouter.get('/Payments', requestGetPaymentshandler);

receiptRouter.post('/CancelItemModify', requestcancelItemModifyBillhandler);
receiptRouter.post('/ModifyBillQty', requestupdateModifyBillQuantityhandler);
receiptRouter.post('/UpdateOrder', requestupdateOrderLevelValueshandler);
receiptRouter.post('/SaveIrnResponse', requestSaveIRNResponsehandler);

module.exports = receiptRouter;
