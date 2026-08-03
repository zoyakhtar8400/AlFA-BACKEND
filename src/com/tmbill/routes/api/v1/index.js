const express = require('express');
const { ResponseMessage } = require('../../../error/ResponseMessage');
const orderRouter = require('./order');
const storeRouter = require('./store');
const commonRouter = require('./common');
const catalogRouter = require('./catalog');
const kotRouter = require('./kot');
const tableRouter = require('./table');
const paymentRouter = require('./payment');
const customerRouter = require('./customer');
const waiterRouter = require('./waiter');
const reservationRouter = require('./reservation');
const tallyRouter = require('./tally');
const printRouter = require('./print');
const receiptRouter = require('./receipt');
const reportRouter = require('./report');
const orderSettlementRouter = require('./OrderSettlement');
const accountRouter = require('./account');

const router = express.Router();

async function healthCheck(req, res) {
  const response = new ResponseMessage(200, 'Ok');
  res.json(response);
}

router.get('/health', healthCheck);
router.use('/v1/order', orderRouter);
router.use('/v1/store', storeRouter);
router.use('/v1/common', commonRouter);
router.use('/v1/catalog', catalogRouter);
router.use('/v1/kot', kotRouter);
router.use('/v1/table', tableRouter);
router.use('/v1/payment', paymentRouter);
router.use('/v1/customer', customerRouter);
router.use('/v1/waiter', waiterRouter);
router.use('/v1/reservation', reservationRouter);
router.use('/v1/tally', tallyRouter);
router.use('/v1/print', printRouter);
router.use('/v1/receipt', receiptRouter);
router.use('/v1/report', reportRouter);
router.use('/v1/orderSettlement', orderSettlementRouter);
router.use('/v1/account', accountRouter);

module.exports = router;
