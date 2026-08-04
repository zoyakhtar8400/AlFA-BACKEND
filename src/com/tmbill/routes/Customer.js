const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();
let { addCustomer } = require('../main_controllers/Order');
const {
  requestAddorUpdateCustomer,
} = require('../main/services/Customer.service');
const { CUSTOMER_UPDATED } = require('../util/IPC_Messages');

// async function sendCustomertompos(customer) {
//     const { Config } = require('../config/config');
//     let request = require('request-promise');
//     let options = {
//         method: 'POST',
//         uri: Config.links.addCustomer,
//         form: JSON.stringify(customer),
//         json: true,
//         headers: {
//             'x-user': global.storeDetails.username,
//             'Authorization': `Bearer ${global.storeDetails.token}`
//         }
//     };
//     try {
//         let response = await request(options);
//         if (response && response.status) {
//             if (response.status == 200) {
//                 return 'successs';
//             } else if (result.status == 300) {
//                 reloginfromremote();
//                 return 'error';
//             }
//         }

//         return 'error';
//     } catch (error) {
//         return 'error';
//     }
// }
async function getCustomer(params) {
  let customers = [];
  try {
    let where = { store_id: params.store_id };
    if (params.phone) {
      where.phone = params.phone;
    }
    if (params.name) {
      where.name = params.name;
    }
    customers = global.serverdbConnection.Customer.findAll({
      where,
    });
  } catch (error) {
    customers = [];
  }
  return customers;
}
router.get('/', async (req, res) => {
  let response = new ResponseMessage(200, '');
  const queryParams = { ...req.query, store_id: req.query.store_id || 'STORE_1' };
  let customers = await getCustomer(queryParams);
  response.customers = customers;
  response.data = customers;
  response.setStatus(200);
  res.json(response);
});

router.post('/', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body.name && req.body.phone && req.body.store_id) {
    let result = await addCustomer(req.body);
    response = result;
    // let status = await sendCustomertompos(req.body);
    // if (status == 'success') {
    //     let result = await addCustomer(req.body);
    //     response = result;
    // } else {
    //     response.setStatus(400);
    //     response.setMessage('Something went wrong.');
    // }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid parameters.');
  }
  res.json(response);
});

router.post('/AddorUpdate', async (req, res) => {
  let response = new ResponseMessage(200, '');
  const { customer } = req.body;
  if (customer.name && customer.phone && customer.store_id) {
    const data = await requestAddorUpdateCustomer(req.body);
    global.mainWindow.webContents.send(CUSTOMER_UPDATED, req.body);
    response = data;
  } else {
    response.setStatus(400);
    response.setMessage('Invalid parameters.');
  }
  res.json(response);
});

module.exports = router;
