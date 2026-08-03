const express = require('express');
const {
  getStoredetails,
  getAllstores,
  getStoresettings,
  deleteStore,
  getMultipricingsettings,
} = require('../../../../main/services/Store.service');

const storeRouter = express.Router();

/**
 * GET_STOREDETAILS IPC Handler
 * @param {*} req
 * @param {*} res
 */
async function getstoreDetailshandler(req, res) {
  const username = req.headers['x-api-user'];
  const type = req.headers['x-terminal-type'];
  const storeDetails = await getStoredetails({ username, type });
  res.json(storeDetails);
}

/**
 * GET_STOREDETAILS IPC Handler
 * @param {*} req
 * @param {*} res
 */
async function getallstoresHandler(req, res) {
  const storeDetails = await getAllstores();
  res.json(storeDetails);
}

async function getStoressettingsHandler(req, res) {
  const storeDetails = await getStoresettings();
  res.json(storeDetails);
}

async function getdeleteStoreHandler(req, res) {
  const storeDetails = await deleteStore(req.body);
  res.json(storeDetails);
}

async function getMultipricingHandler(req, res) {
  const result = await getMultipricingsettings(req.query);
  res.json(result);
}

storeRouter.get('/GetDetails', getstoreDetailshandler);
storeRouter.get('/GetAllStores', getallstoresHandler);
storeRouter.get('/GetStoreSettings', getStoressettingsHandler);
storeRouter.post('/DeleteStore', getdeleteStoreHandler);
storeRouter.get('/GetMultiPricing', getMultipricingHandler);

module.exports = storeRouter;
