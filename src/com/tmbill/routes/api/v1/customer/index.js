const express = require('express');
const {
  requestAddCustomer,
  requestAddorUpdateCustomer,
  requestGetCustomer,
  reAddCustomerRequest,
} = require('../../../../main/services/Customer.service');

const commonRouter = express.Router();

async function requestAddCustomerhandler(req, res) {
  const data = await requestAddCustomer(req.body);
  res.json(data);
}

async function requestGetcustomerhandler(req, res) {
  const data = await requestGetCustomer();
  res.json(data);
}

async function requestAddorUpdateCustomerhandler(req, res) {
  const data = await requestAddorUpdateCustomer(req.body);
  res.json(data);
}

async function reAddCustomerhandler(req, res) {
  const data = await reAddCustomerRequest(req.body);
  res.json(data);
}

commonRouter.get('/', requestGetcustomerhandler);
commonRouter.post('/', requestAddCustomerhandler);
commonRouter.post('/AddorUpdate', requestAddorUpdateCustomerhandler);
commonRouter.post('/ReAddCustomer', reAddCustomerhandler);

module.exports = commonRouter;
