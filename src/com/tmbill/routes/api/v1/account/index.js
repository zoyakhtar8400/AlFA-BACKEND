const express = require('express');
const {
  checkPreCloseShift,
  CloseShift,
  getSettledBillsAsPerPaymentModeRequest,
  StartShift,
  CloseDayAndShift,
  checkUserShiftStarted,
  checkIfBillIsRunningModeRequest,
  getOrderSummaryhandlerRequest,
  getShiftwiseReporthandlerRequest,
  checkIfKOTIsRunningModeRequest,
  checkIfAllShiftsAreClosedRequest,
} = require('../../../../main/services/Account.service');

const accountRouter = express.Router();

async function checkPreCloseShifthandler(req, res) {
  const data = await checkPreCloseShift(req.body);
  res.json(data);
}

async function checkUserShiftStartedhandler(req, res) {
  const data = await checkUserShiftStarted(req.body);
  res.json(data);
}

async function startShifthandler(req, res) {
  const data = await StartShift(req.body);
  res.json(data);
}

async function CloseShifthandler(req, res) {
  const data = await CloseShift(req.body);
  res.json(data);
}

async function CloseDayAndShifthandler(req, res) {
  const data = await CloseDayAndShift(req.body);
  res.json(data);
}

async function getSettledBillsByPaymentModehandler(req, res) {
  const data = await getSettledBillsAsPerPaymentModeRequest(req.body);
  res.json(data);
}

async function checkIfBillIsRunningModehandler(req, res) {
  const data = await checkIfBillIsRunningModeRequest(req.body);
  res.json(data);
}

async function checkIfKOTIsRunningModehandler(req, res) {
  const data = await checkIfKOTIsRunningModeRequest(req.body);
  res.json(data);
}

async function checkIfAllShiftsAreClosedModehandler(req, res) {
  const data = await checkIfAllShiftsAreClosedRequest(req.body);
  res.json(data);
}

async function getOrderSummaryhandler(req, res) {
  const data = await getOrderSummaryhandlerRequest(req.body);
  res.json(data);
}

async function getShiftwiseReporthandler(req, res) {
  const data = await getShiftwiseReporthandlerRequest(req.body);
  res.json(data);
}

accountRouter.post('/CheckPreCloseShift', checkPreCloseShifthandler);
accountRouter.post('/CheckUserShiftStarted', checkUserShiftStartedhandler);
accountRouter.post('/StartShift', startShifthandler);
accountRouter.post('/CloseShift', CloseShifthandler);
accountRouter.post('/CloseDayAndShift', CloseDayAndShifthandler);
accountRouter.post(
  '/GetSettledBillsByPaymentMode',
  getSettledBillsByPaymentModehandler,
);
accountRouter.get('/CheckIfBillIsRunning', checkIfBillIsRunningModehandler);
accountRouter.post('/CheckIfKOTIsRunning', checkIfKOTIsRunningModehandler);
accountRouter.post(
  '/CheckIfAllShiftsAreClosed',
  checkIfAllShiftsAreClosedModehandler,
);
accountRouter.post('/GetOrderSummary', getOrderSummaryhandler);
accountRouter.post('/GetShiftwiseReport', getShiftwiseReporthandler);

module.exports = accountRouter;
