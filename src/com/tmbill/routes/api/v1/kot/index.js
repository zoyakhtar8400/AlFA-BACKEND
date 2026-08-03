const express = require('express');
const {
  requestSavekot,
  requestGetoldkotdetails,
  requestChangekottable,
  requestupdateOldkotitem,
  requestSetinactiveKOT,
  requestTransferKOT,
  requestGetTransferKOTno,
  requestGetkotstatusfortable,
  requestisKotactivefortable,
  requestItemDiscountAppliedUpdateKotItems,
  requestisDineinKotactive,
  requestChangeOrderTypeAfterSaveKot,
  requestGetKOTItems,
} = require('../../../../main/services/KOT.service');

const commonRouter = express.Router();

async function saveKothandler(req, res) {
  const data = await requestSavekot(req.body);
  res.json(data);
}

async function requestGetoldkotdetailshandler(req, res) {
  const data = await requestGetoldkotdetails(req.body);
  res.json(data);
}

async function requestchangekotTablehandler(req, res) {
  const data = await requestChangekottable(req.body);
  res.json(data);
}

async function requestupdateOldkotitemhandler(req, res) {
  const data = await requestupdateOldkotitem(req.body);
  res.json(data);
}

async function requestInactiveKOThandler(req, res) {
  const data = await requestSetinactiveKOT(req.body);
  res.json(data);
}

async function requestTransferkothandler(req, res) {
  const data = await requestTransferKOT(req.body);
  res.json(data);
}

async function requestGetTransferKOTnokothandler(req, res) {
  const data = await requestGetTransferKOTno(req.body);
  res.json(data);
}

async function requestGetkotstatusfortablehandler(req, res) {
  const data = await requestGetkotstatusfortable(req.body);
  res.json(data);
}

async function requestisKotactivefortablehandler(req, res) {
  const data = await requestisKotactivefortable(req.body);
  res.json(data);
}

async function requestisDineinKotactivehandler(req, res) {
  const data = await requestisDineinKotactive();
  res.json(data);
}

async function itemDiscountAppliedUpdateItemhandler(req, res) {
  const data = await requestItemDiscountAppliedUpdateKotItems(req.body);
  res.json(data);
}

async function changeOrderTypeAfterSaveKothandler(req, res) {
  const data = await requestChangeOrderTypeAfterSaveKot(req.body);
  res.json(data);
}

async function requestGetRunningOrderItemshandler(req, res) {
  const data = await requestGetKOTItems(req.body);
  res.json(data);
}

commonRouter.post('/SaveKot', saveKothandler);
commonRouter.post('/GetOldKOT', requestGetoldkotdetailshandler);
commonRouter.post('/ChangeTable', requestchangekotTablehandler);
commonRouter.post('/UpdateOldKOTItem', requestupdateOldkotitemhandler);
commonRouter.post('/SetInactiveKOT', requestInactiveKOThandler);
commonRouter.post('/TransferKOT', requestTransferkothandler);
commonRouter.post('/GetTransferKOTNo', requestGetTransferKOTnokothandler);
commonRouter.post('/GetKOTStatusByTable', requestGetkotstatusfortablehandler);
commonRouter.post('/CheckActiveKOT', requestisKotactivefortablehandler);
commonRouter.get('/CheckDineInActiveKOT', requestisDineinKotactivehandler);
commonRouter.post('/ItemDiscountApplied', itemDiscountAppliedUpdateItemhandler);
commonRouter.post(
  '/ChangeOrderTypeAfterSaveKot',
  changeOrderTypeAfterSaveKothandler,
);
commonRouter.post('/GetRunningKOTItems', requestGetRunningOrderItemshandler);

module.exports = commonRouter;
