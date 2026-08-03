const express = require('express');
const {
  getBills,
  settleMultipleOrders,
  updateMultipleOrders,
} = require('../../../../main_controllers/OrderSettlement');

const orderSettlementRouter = express.Router();

async function getBillshandler(req, res) {
  const data = await getBills(req.body);
  res.json(data);
}

async function settleMultipleOrdershandler(req, res) {
  const data = await settleMultipleOrders(req.body);
  res.json(data);
}

async function updateMultipleOrdershandler(req, res) {
  const data = await updateMultipleOrders(req.body);
  res.json(data);
}

orderSettlementRouter.post('/GetBills', getBillshandler);
orderSettlementRouter.post(
  '/SettleMultipleOrders',
  settleMultipleOrdershandler,
);
orderSettlementRouter.post(
  '/UpdateMultipleOrders',
  updateMultipleOrdershandler,
);

module.exports = orderSettlementRouter;
