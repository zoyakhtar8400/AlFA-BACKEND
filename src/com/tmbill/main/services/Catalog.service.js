/* eslint-disable no-console */
const ip = require('ip');
const { HttpStatusCode } = require('axios');
const {
  getOrderwindowdetails,
  getDiscounts,
  getItemoptions,
  addItemnote,
  getKotitemnotes,
  getAllProductGroup,
  getWaiterslist,
  updateItemCurrentStock,
  deleteItemnote,
} = require('../../main_controllers/Order');
const { resolvesyncmenuConflict } = require('../../services/MiscServices');
const { Payment } = require('../../js/database');
const { getPayments } = require('../../main_controllers/Order/index');
const { getItemModifiers } = require('../../main_controllers/ItemModifiers');

async function getCatalog(params) {
  try {
    const orderwindowData = await getOrderwindowdetails(
      global.storeDetails.store_id,
      params,
    );
    global.globalIPAddress = ip.address();
    orderwindowData.ipAddress = global.globalIPAddress;
    return orderwindowData;
  } catch (error) {
    console.error(`Message="Error while getting order window details"`, error);
  }
  return undefined;
}

async function loadMenurequest() {
  let status = 'donotSync';
  try {
    if (global.storeDetails) {
      if (global.isLoadMenuInProgress) {
        return status;
      }
      // const result = await resolvesyncmenuConflict();
      const result = null;
      status = result ? 'donotSync' : 'sync';
    }
  } catch (error) {
    console.error(`Message="Error while Checking load menu request"`, error);
  }
  return status;
}

async function requestGetdiscounts(data) {
  let response = {};
  try {
    if (!data.store_id) {
      Object.assign(data, { store_id: global.storeDetails.store_id });
    }

    response = await getDiscounts(data);
  } catch (error) {
    console.error(`Message="Error While Getting Store Discounts"`, error);
  }
  return response;
}

async function requestItemoptions(data) {
  try {
    if (data) {
      const requestdata = data;
      requestdata.store_id = global.storeDetails.store_id;
      const result = await getItemoptions(requestdata);
      return result;
    }
    console.warn(
      `Message="Invalid Get Item Options Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Getting Item Options" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return {};
}

async function requestItemModifiers(data) {
  try {
    if (data) {
      const requestdata = data;
      requestdata.store_id = global.storeDetails.store_id;
      const result = await getItemModifiers(requestdata);
      return result;
    }
    console.warn(
      `Message="Invalid Get Item modifiers Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Getting Item modifiers" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return {};
}

async function requestAdditemnote(data) {
  const respone = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      await addItemnote(data);
      Object.assign(respone, {
        status: HttpStatusCode.Ok,
      });
      return respone;
    }
    console.warn(
      `Message="Invalid Add Item Note Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Adding Item Note" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return respone;
}

async function requestDeleteitemnote(data) {
  const respone = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      await deleteItemnote(data);
      Object.assign(respone, {
        status: HttpStatusCode.Ok,
      });
      return respone;
    }
    console.warn(
      `Message="Invalid Delete Item Note Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Deleting Item Note" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return respone;
}

async function updateItemStock(data) {
  const respone = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      await updateItemCurrentStock(data);
      Object.assign(respone, {
        status: HttpStatusCode.Ok,
      });
      return respone;
    }
    console.warn(
      `Message="Invalid update item stock Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating item stock" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return respone;
}
async function requestGetitemnotes(data) {
  const respone = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      const content = data;
      content.store_id = global.storeDetails.store_id;
      const result = await getKotitemnotes(content);
      Object.assign(respone, {
        status: HttpStatusCode.Ok,
        ...result,
      });
      return respone;
    }
    console.warn(
      `Message="Invalid Add Item Note Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Adding Item Note" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return respone;
}

async function requestProductgroups() {
  let list = [];
  try {
    list = await getAllProductGroup();
  } catch (error) {
    console.error(`Message="Error While Getting Product Groups"`, error);
  }
  return list;
}

async function requestWaiters() {
  let list = [];
  try {
    list = await getWaiterslist({});
  } catch (error) {
    console.error(`Message="Error While Getting Waiters"`, error);
  }
  return list;
}

async function requestGetPaymentsAsync(data) {
  try {
    if (data) {
      const result = await getPayments(data);
      return result;
    }
    console.warn(`Message="Invalid Get Payments Payload" `);
  } catch (error) {
    console.error(`Message="Error While Getting payments"`, error);
  }
  return {};
}
async function requestGetPayments() {
  try {
    const payments = await Payment.findAll({
      raw: true,
      where: {
        store_id: global.storeDetails.store_id,
      },
    });
    return payments;
  } catch (error) {
    console.error(`Message="Error While Getting payments"`, error);
  }
  return {};
}
module.exports = {
  getCatalog,
  loadMenurequest,
  requestGetdiscounts,
  requestItemoptions,
  requestAdditemnote,
  requestGetitemnotes,
  requestProductgroups,
  requestWaiters,
  requestGetPayments,
  requestGetPaymentsAsync,
  requestItemModifiers,
  updateItemStock,
  requestDeleteitemnote,
};
