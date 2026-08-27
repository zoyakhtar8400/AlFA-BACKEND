const express = require('express');
const {
  requestGetReportData,
  requestUpdateCustomerToDuePayment,
  requestUpdateDueAndAddTransaction,
  requestcheckIfAmountIsAvailablehandler,
} = require('../../../../main/services/Report.service');

const repportRouter = express.Router();

async function requestGetReportDatahandler(req, res) {
  if (req.query && req.query.store_id) {
    if (!global.storeDetails) global.storeDetails = {};
    global.storeDetails.store_id = req.query.store_id;
  }
  const data = await requestGetReportData(req.query);
  res.json(data);
}

// // Temporary route to delete bills for testing
// repportRouter.get('/deleteBills', async (req, res) => {
//   const { Op } = require('sequelize');
//   try {
//     const deleted = await global.serverdbConnection.Order.destroy({
//       where: {
//         created_time: {
//           [Op.between]: ['2026-08-25 00:00:00', '2026-08-25 23:59:59']
//         }
//       }
//     });
//     res.json({ success: true, deleted });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

async function requestUpdateCustomerToDuePaymenthandler(req, res) {
  const data = await requestUpdateCustomerToDuePayment(req.body);
  res.json(data);
}

async function updateDueAndAddTransactionhandler(req, res) {
  const data = await requestUpdateDueAndAddTransaction(req.body);
  res.json(data);
}

async function checkIfAmountIsAvailablehandler(req, res) {
  const data = await requestcheckIfAmountIsAvailablehandler(req.body);
  res.json(data);
}
repportRouter.get('/getReportData', requestGetReportDatahandler);
repportRouter.post(
  '/updateCustomerToDuePayment',
  requestUpdateCustomerToDuePaymenthandler,
);
repportRouter.post(
  '/updateDueAndAddTransaction',
  updateDueAndAddTransactionhandler,
);
repportRouter.post(
  '/checkIfAmountIsAvailable',
  checkIfAmountIsAvailablehandler,
);

module.exports = repportRouter;
