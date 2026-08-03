const express = require('express');
const {
  updateCategoriesActiveStatus,
  updateItemActiveStatus,
  getKDSMenu,
  getServedKOTs,
} = require('../main_controllers/KDS');
const { settleAllKDSkotandorders } = require('../main_controllers/KOT');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();
const {
  getRunningtableswithdetails,
  getrunningKotitems,
  updateliveitemstatus,
  updateKotdata,
  updateorderKotdata,
  getsettledKots,
} = require('../main_controllers/Order');
const { STATUS_UPDATED_RELOAD_APP } = require('../util/IPC_Messages');
const { getHeadersformpos } = require('../services/MiscServices');
const { apiCall } = require('../services/APIService');

router.get('/runningtables', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    const data = {};
    const tables = await getRunningtableswithdetails(req.query);
    const settledOrders = await getsettledKots(req.query);
    Object.assign(data, { tables, settledOrders });
    response.data = data;
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.patch('/kotitem', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.kot_item_id) {
    let itemsData = req.body;
    try {
      response = await updateliveitemstatus(itemsData);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid parameters');
  }
  res.json(response);
});

router.patch('/kot', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.kot_id) {
    try {
      response = await updateKotdata(req.body);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid parameters');
  }
  res.json(response);
});

router.patch('/orderkot', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.order_id) {
    try {
      response = await updateorderKotdata(req.body);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid parameters');
  }
  res.json(response);
});

router.patch('/settleall', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.order_id) {
    try {
      response = await settleAllKDSkotandorders(req.body);
    } catch (error) {
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  } else {
    response.setStatus(400);
    response.setMessage('Invalid parameters');
  }
  res.json(response);
});

router.get('/kotitem', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    let items = await getrunningKotitems(req.query);
    response.data = { items };
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

// disable category
router.patch('/setCategoryActiveStatus', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.body && req.body.store_id) {
    if (req.body.categories && Array.isArray(req.body.categories)) {
      const categoryResult = await updateCategoriesActiveStatus(
        req.body.categories,
        req.body.store_id,
      );
      Object.assign(response, {
        category: categoryResult,
      });
    }

    if (req.body.items && Array.isArray(req.body.items)) {
      const itemsResult = await updateItemActiveStatus(
        req.body.items,
        req.body.store_id,
      );
      Object.assign(response, {
        item: itemsResult,
      });
    }

    // update backend values

    if (req?.body?.categories?.length || req?.body?.items?.length) {
      try {
        const payload = {
          tmpos_id: global.storeDetails.tmpos_id,
          store_id: global.storeDetails.store_id,
          menu_id: Number(global.menu_id),
          categoryList: req?.body?.categories,
          itemsList: req?.body?.items,
        };

        await apiCall.post(
          global.Config.links.multiCategoryEnableDisable,
          payload,
          {
            headers: getHeadersformpos(),
          },
        );
      } catch (error) {
        console.log(
          `Message="Error while updating categories and items from kds" Error=`,
          error,
        );
      }
    }

    try {
      let posItem = await global.serverdbConnection.Item.findOne({
        raw: true,
        where: {
          store_id: req.body.store_id,
        },
      });
      let menu_id = undefined;
      if (posItem) {
        menu_id = posItem.tmpos_menu_id;
        let payload = req.body;
        Object.assign(payload, { menu_id: [Number(menu_id)] });
        let axiosresponse = await apiCall.post(
          Config.links.itemEnableDisable,
          {
            store_id: req.body.store_id,
            items: req.body.items,
            categories: req.body.categories,
            menu_id: [menu_id],
          },
          { headers: getHeadersformpos() },
        );
      }
    } catch (err) {
      console.log('err::', err);
    }

    response.setStatus(200);
    response.setMessage('Status Updated Successfully.');
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  if (response && response.status == 200) {
    global.mainWindow.webContents.send(STATUS_UPDATED_RELOAD_APP, response);
  }
  res.json(response);
});

router.get('/menu', async (req, res) => {
  let response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    const result = await getKDSMenu(req.query.store_id);
    response = result;
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.get('/servedKots', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    const data = {};
    const servedKOTs = await getServedKOTs(req.query);
    Object.assign(data, { servedKOTs });
    response.data = data;
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});
module.exports = router;
