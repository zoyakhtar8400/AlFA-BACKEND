const express = require('express');
const {
  requestGetpayments,
  requestUpdatepayments,
} = require('../../../../main/services/Payment.service');

const paymentRouter = express.Router();

async function getPaymentshandler(req, res) {
  const data = await requestGetpayments(req.body);
  res.json(data);
}

async function updatePaymentshandler(req, res) {
  const data = await requestUpdatepayments(req.body);
  res.json(data);
}

paymentRouter.get('/', getPaymentshandler);
paymentRouter.put('/', updatePaymentshandler);

module.exports = paymentRouter;
