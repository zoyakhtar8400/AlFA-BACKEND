const express = require('express');
const {
  requestGetWaiternotifications,
  requestcloseRunningNotification,
} = require('../../../../main/services/Waiter.service');

const waiterRouter = express.Router();

async function requestGetWaiternotificationshandler(req, res) {
  const data = await requestGetWaiternotifications(req.body);
  res.json(data);
}

async function requestcloseRunningNotificationhandler(req, res) {
  const data = await requestcloseRunningNotification(req.body);
  res.json(data);
}

waiterRouter.post('/Notifications', requestGetWaiternotificationshandler);
waiterRouter.post('/CloseNotification', requestcloseRunningNotificationhandler);

module.exports = waiterRouter;
