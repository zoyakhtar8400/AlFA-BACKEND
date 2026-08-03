const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');

const router = express.Router();
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const { app } = require('electron');
const fs = require('fs');
const { getSettings } = require('../main_controllers/Order');
const { Config } = require('../config/config');

/**
 * Authenticate user
 * @param {Post data} postData
 */
async function authenticateUser(postData) {
  const response = new ResponseMessage();
  try {
    const userWhere = { username: postData.username };
    let result = await global.serverdbConnection.User.findAll({
      raw: true,
      limit: 1,
      where: userWhere,
    });

    if (result && result.length > 0) {
      result = result[0];
      let isValidPassword = false;
      try {
        const bytes = CryptoJS.AES.decrypt(result.password, Config.cipherKey);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        if (plaintext === postData.password) isValidPassword = true;
      } catch (e) {}
      if (result.password === postData.password) isValidPassword = true;

      if (isValidPassword) {
        response.setMessage('Success');
        response.setStatus(200);
        const token = jwt.sign(
          {
            id: result.id,
            username: result.username,
            store_id: result.store_id || 'STORE_1',
          },
          Config.JWT_SECRET,
          {
            expiresIn: '50d',
          },
        );
        response.token = token;
        response.data = {
          id: result.id,
          username: result.username,
          name: result.name || 'Admin',
          store_id: result.store_id || 'STORE_1',
        };
        return response;
      }
    }
    response.setStatus(401);
    response.setMessage('Username or password is invalid.');
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    response.setStatus(401);
    response.setMessage('Username or Password is invalid.');
  }
  return response;
}

router.post('/login', async (req, res) => {
  try {
    const postData = req.body;
    if (postData && postData.username && postData.password) {
      const response = await authenticateUser(postData);
      res.json(response);
    } else {
      res.json(new ResponseMessage(400, 'Invalid Params'));
    }
  } catch (error) {
    console.log(error);
  }
});

router.post('/logout', async (req, res) => {
  try {
    const postData = req.body;
    if (postData && postData.username) {
      await global.serverdbConnection.UserLoginStatus.update(
        { status: 0 },
        {
          where: {
            username: postData.username,
            store_id: global.storeDetails.store_id,
          },
        },
      );
      res.json(new ResponseMessage(400, 'logged out successfully'));
    } else {
      res.json(new ResponseMessage(400, 'Invalid Params'));
    }
  } catch (error) {
    console.log(error);
  }
});
router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

module.exports = router;
