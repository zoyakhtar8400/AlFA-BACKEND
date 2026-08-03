const express = require('express');

const printRouter = express.Router();

async function printHandler(req, res) {}

printRouter.post('/', printHandler);

module.exports = printRouter;
