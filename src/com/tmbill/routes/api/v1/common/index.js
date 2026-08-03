const express = require('express');
const { HttpStatusCode } = require('axios');
const { ResponseMessage } = require('../../../../error/ResponseMessage');
const { getPrinters } = require('../../../../main/services/Printer.service');
const {
  fetchDateFromBackend,
} = require('../../../../main_controllers/Utils/CheckResetDate');
const {
  getAppsettings,
  updateSettings,
} = require('../../../../main/services/Settings.service');
const {
  requestAutoReduceInventory,
} = require('../../../../main/services/Invenotry.service');
const {
  requestCheckUsershiftStarted,
  requestStartDay,
  requestCheckForStartDay,
} = require('../../../../main/services/Usershift.service');
const {
  requestUpdateliveitemstatus,
  requestgetLivestatus,
  requestPasccodeaccesscheck,
  requestWaiterNotifications,
  requestOpenCashDrawer,
  requesStartEndDayDateData,
  requestGetPaymentModesData,
} = require('../../../../main/services/Common.service');

const commonRouter = express.Router();

async function healthCheck(req, res) {
  const response = new ResponseMessage(200, 'Store Services is Ok');
  res.json(response);
}

/**
 * GET_STOREDETAILS IPC Handler
 * @param {*} req
 * @param {*} res
 */
async function getPrinterhandler(req, res) {
  const printers = await getPrinters();
  res.json({ status: HttpStatusCode.Ok, printers });
}

async function getDatehandler(req, res) {
  const data = await fetchDateFromBackend();
  res.json(data);
}

async function getSettingshandler(req, res) {
  const data = await getAppsettings();
  res.json(data);
}

async function autoReduceInventoryHandler(req, res) {
  const data = await requestAutoReduceInventory(req.body);
  res.json(data);
}

async function checkUserShiftStartedHandler(req, res) {
  const data = await requestCheckUsershiftStarted(req.body);
  res.json(data);
}

async function startDayhandler(req, res) {
  const data = await requestStartDay(req.body);
  res.json(data);
}

async function updateSettingsHandler(req, res) {
  const data = await updateSettings(req.body);
  res.json(data);
}

async function checkForStartDayhandler(req, res) {
  const data = await requestCheckForStartDay();
  res.json(data);
}

async function requestUpdateliveitemstatushandler(req, res) {
  const data = await requestUpdateliveitemstatus(req.body);
  res.json(data);
}

async function requestGetlivestatushandler(req, res) {
  const data = await requestgetLivestatus(req.body);
  res.json(data);
}

async function checkPasscodeacesshandler(req, res) {
  const data = await requestPasccodeaccesscheck(req.body);
  res.json(data);
}

async function getWaiterNotificationsHandlerhandler(req, res) {
  const data = await requestWaiterNotifications(req.body);
  res.json(data);
}

async function requestStartEndDayDateData(req, res) {
  const data = await requesStartEndDayDateData(req.body);
  res.json(data);
}

async function requestGetPaymentModes(req, res) {
  const data = await requestGetPaymentModesData();
  res.json(data);
}

async function openCashDrawerhandler(req, res) {
  const data = await requestOpenCashDrawer(req.body);
  res.json(data);
}
commonRouter.get('/health', healthCheck);
commonRouter.get('/GetPrinters', getPrinterhandler);
commonRouter.get('/GetDate', getDatehandler);
commonRouter.get('/GetSettings', getSettingshandler);
commonRouter.post('/AutoReduceInventory', autoReduceInventoryHandler);
commonRouter.post('/CheckUserShiftStarted', checkUserShiftStartedHandler);
commonRouter.post('/CheckForStartDay', checkForStartDayhandler);
commonRouter.post('/StartDay', startDayhandler);
commonRouter.post('/UpdateSettings', updateSettingsHandler);
commonRouter.post('/UpdateLiveItemStatus', requestUpdateliveitemstatushandler);
commonRouter.post('/GetLiveStatus', requestGetlivestatushandler);
commonRouter.post('/CheckPasscodeAccess', checkPasscodeacesshandler);
commonRouter.post(
  '/GetWaiterNotifications',
  getWaiterNotificationsHandlerhandler,
);
commonRouter.get('/GetStartEndDayDateData', requestStartEndDayDateData);
commonRouter.get('/GetPaymentModes', requestGetPaymentModes);

// commonRouter.post('/OpenCashDrawer', openCashDrawerhandler);

module.exports = commonRouter;
