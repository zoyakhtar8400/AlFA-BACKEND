const express = require('express');
const {
  loadMenurequest,
  requestGetdiscounts,
  requestItemoptions,
  requestAdditemnote,
  requestGetitemnotes,
  requestProductgroups,
  requestWaiters,
  requestGetPayments,
  requestGetPaymentsAsync,
  requestItemModifiers,
  updateItemStock,
  requestDeleteitemnote,
} = require('../../../../main/services/Catalog.service');
const {
  requestGetCustomer,
} = require('../../../../main/services/Customer.service');

const commonRouter = express.Router();

async function loadMenuhandler(req, res) {
  const data = await loadMenurequest();
  res.json(data);
}

async function getDiscountshandler(req, res) {
  const data = await requestGetdiscounts(req.body);
  res.json(data);
}

async function getItemsoptionhandler(req, res) {
  const data = await requestItemoptions(req.body);
  res.json(data);
}

async function getItemModifiershandler(req, res) {
  const data = await requestItemModifiers(req.body);
  res.json(data);
}

async function addItemnotehandler(req, res) {
  const data = await requestAdditemnote(req.body);
  res.json(data);
}

async function deleteItemnotehandler(req, res) {
  const data = await requestDeleteitemnote(req.body);
  res.json(data);
}

async function getItemnotehandler(req, res) {
  const data = await requestGetitemnotes(req.body);
  res.json(data);
}

async function getProductgrphandler(req, res) {
  const data = await requestProductgroups();
  res.json(data);
}

async function getWaitershandler(req, res) {
  const data = await requestWaiters();
  res.json(data);
}

async function getPaymentshandler(req, res) {
  const data = await requestGetPayments(req.body);
  res.json(data);
}

async function getPaymentsAsynchandler(req, res) {
  const data = await requestGetPaymentsAsync(req.body);
  res.json(data);
}

async function getCustomershandler(req, res) {
  const data = await requestGetCustomer();
  res.json(data);
}

async function updateItemStockhandler(req, res) {
  const data = await updateItemStock(req.body);
  res.json(data);
}

commonRouter.get('/LoadMenu', loadMenuhandler);
commonRouter.post('/GetDiscounts', getDiscountshandler);
commonRouter.post('/ItemOptions', getItemsoptionhandler);
commonRouter.get('/GetProductGroups', getProductgrphandler);
commonRouter.post('/AddItemNote', addItemnotehandler);
commonRouter.post('/DeleteItemNote', deleteItemnotehandler);
commonRouter.post('/GetItemNote', getItemnotehandler);
commonRouter.post('/GetWaiters', getWaitershandler);
commonRouter.get('/GetPayments', getPaymentshandler);
commonRouter.post('/GetPaymentsAsync', getPaymentsAsynchandler);
commonRouter.get('/GetCustomers', getCustomershandler);
commonRouter.post('/ItemModifiers', getItemModifiershandler);
commonRouter.post('/UpdateItemStock', updateItemStockhandler);

module.exports = commonRouter;
