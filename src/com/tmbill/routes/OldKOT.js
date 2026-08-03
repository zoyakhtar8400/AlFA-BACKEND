const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();
const {
  getOldKOTdetails,
  updateOldkot,
  setinactiveForoldkot,
} = require('../main_controllers/OldKOT');
const { transferKOTItem } = require('../main_controllers/Order');
const connection = require('../js/database');

router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (
    req.query.store_id &&
    req.query.table_id &&
    req.query.order_type_flag !== undefined
  ) {
    try {
      const result = await getOldKOTdetails(req.query);
      response.setStatus(200);
      response.data = result;
    } catch (error) {
      response.setStatus(400);
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.patch('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.body && req.body.updateStatus !== undefined) {
    try {
      if (req.body.table_id) {
        const doesbillExists = await connection.Bill.findOne({
          where: {
            table_id: Number(req.body.table_id),
            order_state: 'pending',
          },
          raw: true,
        });

        if (doesbillExists !== null) {
          if (!global.allowModifyBill) {
            response.status = 'failure';
            response.message = 'Cannot modify saved bill';
            global.isSaveKOtInProgress = false;
            response.setStatus(400);
            return response;
          }
        }
      }
      const result = await updateOldkot(req.body);
      response.setStatus(200);
      response.setMessage(result);
    } catch (error) {
      response.setStatus(400);
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});
router.post('/transferitem', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body) {
    try {
      if (req.body.currentTable) {
        const doesbillExists = await connection.Bill.findOne({
          where: {
            table_id: Number(req.body.currentTable),
            order_state: 'pending',
          },
          raw: true,
        });
        if (doesbillExists !== null) {
          response.setStatus(400);
          return response;
        }
      }
      const result = await transferKOTItem(req.body);
      response = result;
    } catch (error) {
      response.setStatus(400);
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

router.post('/setinactivekot', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body) {
    try {
      const result = await setinactiveForoldkot(req.body);
      response = result;
    } catch (error) {
      response.setStatus(400);
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid Parameters.');
  }
  res.json(response);
});

module.exports = router;
