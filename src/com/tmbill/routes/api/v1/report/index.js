const express = require('express');
const {
  requestGetReportData,
  requestUpdateCustomerToDuePayment,
  requestUpdateDueAndAddTransaction,
  requestcheckIfAmountIsAvailablehandler,
} = require('../../../../main/services/Report.service');

const repportRouter = express.Router();

async function requestGetReportDatahandler(req, res) {
  const data = await requestGetReportData(req.query);
  res.json(data);
}

async function requestUpdateCustomerToDuePaymenthandler(req, res) {
  const data = await requestUpdateCustomerToDuePayment(req.body);
  res.json(data);
}

async function updateDueAndAddTransactionhandler(req, res) {
  const data = await requestUpdateDueAndAddTransaction(req.body);
  res.json(data);
}

async function checkIfAmountIsAvailablehandler(req, res) {
  const data = await requestcheckIfAmountIsAvailablehandler(req.body);
  res.json(data);
}
repportRouter.get('/getReportData', requestGetReportDatahandler);
repportRouter.post(
  '/updateCustomerToDuePayment',
  requestUpdateCustomerToDuePaymenthandler,
);
repportRouter.post(
  '/updateDueAndAddTransaction',
  updateDueAndAddTransactionhandler,
);
repportRouter.post(
  '/checkIfAmountIsAvailable',
  checkIfAmountIsAvailablehandler,
);

module.exports = repportRouter;
