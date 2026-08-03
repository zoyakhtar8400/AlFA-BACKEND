/* eslint-disable no-console */
const jwt = require('jsonwebtoken');
const { HttpStatusCode } = require('axios');
const { ResponseMessage } = require('../error/ResponseMessage');
const { Config } = require('../config/config');
const connection = require('../js/database');
const isDev = require('../packages/electron-is-dev');
const { safeParseformain } = require('../main_controllers/Utils');

/**
 * Called upon every secured resource access request is made
 * @param {Current request} req
 * @param {*} res
 * @param {*} next
 */
const auth = (req, res, next) => {
  next();
};

const socketAuth = (socket, next) => {
  next();
};

const localAuth = (req, res, next) => {
  next();
};

async function isPOSUserLoggedIn(req, res, next) {
  next();
}

module.exports = {
  auth,
  socketAuth,
  isPOSUserLoggedIn,
  localAuth,
};

