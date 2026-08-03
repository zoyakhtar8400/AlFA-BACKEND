const express = require('express');
require('../../../../main/services/Waiter.service');
const {
  requestgenerateTallyXML,
  requestexportTallyReport,
} = require('../../../../main/services/Tally.service');

const tallyRouter = express.Router();

async function requestgenerateTallyXMLhandler(req, res) {
  const data = await requestgenerateTallyXML(req.body);
  res.json(data);
}

async function requestexportTallyReporthandler(req, res) {
  const data = await requestexportTallyReport(req.body);
  res.json(data);
}

tallyRouter.post('/GenerateXML', requestgenerateTallyXMLhandler);
tallyRouter.post('/ExportReport', requestexportTallyReporthandler);

module.exports = tallyRouter;
