const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const { getBills, getPaymentmodes } = require('../main_controllers/Bill');
const { getWalletdetails } = require('../main_controllers/Wallet');
const router = express.Router();

/**
 * Returns table
 * @param {Parameters} params
 */
async function getSynchash(params) {
  let syncHash = '';
  try {
    syncHash = await serverdbConnection.Store.findOne({
      raw: true,
      attributes: ['sync_hash'],
      where: { store_id: params.store_id },
    });
    if (syncHash) {
      syncHash = syncHash.sync_hash;
    }
  } catch (error) {
    syncHash = '';
  }
  return syncHash;
}

router.get('/synchash', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    let syncHash = await getSynchash(req.query);
    response.syncHash = syncHash;
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.get('/paymentmodes', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.query && req.query.store_id) {
    // console.log(req.query);
    try {
      let paymentmodes = await getPaymentmodes(req.query.store_id);
      response.paymentmodes = paymentmodes;
      response.setStatus(200);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.get('/bills', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.query && req.query.store_id) {
    // console.log(req.query);
    try {
      let bills = await getBills(req.query);
      response.bills = bills;
      response.setStatus(200);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.post('/wallet', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.phone && req.body.store_id) {
    // console.log(req.query);
    try {
      let wallet = await getWalletdetails(req.body);
      response.wallet = wallet;
      response.setStatus(200);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

module.exports = router;
