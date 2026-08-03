const { SYNC_BILL, OPEN_CASH_DRAWER } = require('../../util/IPC_Messages');
const {
  MASTER_POS_ENDPOINTS,
  TIME_OUT_FOR_RENDERER_APIS,
} = require('../config');
const { localapiCall } = require('../services/APIService');

async function getLiveStatusRequest(statusData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.GET_LIVE_STATUS_DATA,
      statusData,
      {
        timeout: TIME_OUT_FOR_RENDERER_APIS,
      },
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function updateLiveStatusDataRequest(statusData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.UPDATE_LIVE_ITEM_STATUS_DATA,
      statusData,
      {
        timeout: TIME_OUT_FOR_RENDERER_APIS,
      },
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function sendSyncrequest(params) {
  try {
    if (window.__IS_MASTER_POS__) {
      window.ipcRenderer.send(SYNC_BILL, JSON.stringify(params));
    } else {
      const { data } = await localapiCall.post(
        MASTER_POS_ENDPOINTS.ORDER.SYNC,
        params,
        {
          timeout: TIME_OUT_FOR_RENDERER_APIS,
        },
      );
      return data;
    }
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function checkPasscodeRequest(passcodeData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.CHECK_PASSCODE,
      passcodeData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function getWaiterNotificationsRequest(requestData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.GET_WAITER_NOTIFICATIONS,
      requestData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}
async function openCashDrawerRequest() {
  try {
    window.ipcRenderer.send(OPEN_CASH_DRAWER, {});
  } catch (error) {
    console.error(error);
  }
  // window.ipcRenderer.send('open-cash-drawer', {});
  return undefined;
}
async function getStartendDayData(params) {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.COMMON.GET_START_END_DAY_DATA,
      params,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}
module.exports = {
  getLiveStatusRequest,
  updateLiveStatusDataRequest,
  sendSyncrequest,
  checkPasscodeRequest,
  getWaiterNotificationsRequest,
  openCashDrawerRequest,
  getStartendDayData,
};
