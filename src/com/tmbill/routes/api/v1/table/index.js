const express = require('express');
const {
  requestDeletetable,
  requestFetchtablebilldata,
  requestSplittable,
  requestMergetable,
  requestGetBusyTablestable,
  requestUpdateTableState,
  requestUpdateTableColor,
  requestUpdateTableStatus,
  requestChangetablecolor,
  requestGettables,
  requestGetBusyTablesWithoutDetailstable,
  requestrunnigKotItems,
  requestGettablesDepartment,
} = require('../../../../main/services/Table.service');
const { updateTablestatus } = require('../../../../main_controllers/Order');
const { isDayStarted } = require('../../../../middleware/dayStarted');

const commonRouter = express.Router();

async function requestDeletetablehandler(req, res) {
  const data = await requestDeletetable(req.body);
  res.json(data);
}

async function requesttableDatahandler(req, res) {
  const data = await requestFetchtablebilldata(req.body);
  res.json(data);
}

async function requestSplittablehandler(req, res) {
  const data = await requestSplittable(req.body);
  res.json(data);
}

async function requestMergetablehandler(req, res) {
  const data = await requestMergetable(req.body);
  res.json(data);
}

async function requestBusyTableshandler(req, res) {
  const data = await requestGetBusyTablestable(req.body);
  res.json(data);
}

async function requestBusyTablesWithoutDetailshandler(req, res) {
  const data = await requestGetBusyTablesWithoutDetailstable();
  res.json(data);
}

async function requestUpdateTableStatehandler(req, res) {
  const data = await requestUpdateTableState(req.body);
  res.json(data);
}

async function requestUpdateTableColorhandler(req, res) {
  const data = await requestUpdateTableColor(req.body);
  res.json(data);
}

async function requestUpdateTableStatushandler(req, res) {
  const data = await requestUpdateTableStatus(req.body);
  res.json(data);
}

async function requestChangetablecolorhandler(req, res) {
  const data = await requestChangetablecolor(req.body);
  res.json(data);
}

async function updateTablestatushandler(req, res) {
  const data = await updateTablestatus(req.body);
  res.json(data);
}

async function requestGettableshandler(req, res) {
  const data = await requestGettables(req.query);
  res.json(data);
}

async function requestGettablesDepthandler(req, res) {
  const data = await requestGettablesDepartment(req.query);
  res.json(data);
}

async function requestGetTableItemsDatahandler(req, res) {
  const data = await requestrunnigKotItems(req.body);
  res.json(data);
}

commonRouter.get('/', requestGettableshandler);
commonRouter.get('/tableDepartments', requestGettablesDepthandler);
commonRouter.post('/Delete', requestDeletetablehandler);
commonRouter.post('/UpdateStatus', updateTablestatushandler);
commonRouter.post('/FetchBillTableData', requesttableDatahandler);
commonRouter.post('/SplitTable', requestSplittablehandler);
commonRouter.post('/MergeTable', requestMergetablehandler);
commonRouter.post('/GetBusyTables', requestBusyTableshandler);
commonRouter.post('/UpdateTableState', requestUpdateTableStatehandler);
commonRouter.post('/UpdateTableColor', requestUpdateTableColorhandler);
commonRouter.post('/UpdateTableStatus', requestUpdateTableStatushandler);
commonRouter.post('/ChangeColor', requestChangetablecolorhandler);
commonRouter.post('/GetTableItemsRunning', requestGetTableItemsDatahandler);
commonRouter.get(
  '/getBusyTablesWithoutDetails',
  requestBusyTablesWithoutDetailshandler,
);

module.exports = commonRouter;
