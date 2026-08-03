/* eslint-disable camelcase */
const ip = require('ip');
const commandlineArgv = require('minimist')(process.argv);

const { apiCall } = require('../services/APIService');
const { USER_MODEL_IPC, REMOTE_FORCE_LOGUT } = require('../util/IPC_Messages');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');

async function getSysyteminfo() {
  let trackingInfo = {};
  try {
    trackingInfo = await window.betteripcRenderer.callMain(
      USER_MODEL_IPC.GET_USER_TRACKING_INFO,
      {},
    );
    Object.assign(trackingInfo, {
      appVersion: commandlineArgv.appVersion || '',
    });
  } catch (error) {
    console.error(error);
  }
  return trackingInfo;
}
async function sendtrackinforequest({ isLoggedin }) {
  try {
    const flag = isLoggedin ? 1 : 2;
    const trackingInfo = await getSysyteminfo();
    await apiCall
      .post(
        window.Config.links.sendtrackingInfo,
        {
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
          username: window.storeDetails.username,
          flag,
          firebase_token: window.firebaseToken,
          extra_details: { ...trackingInfo },
          masterIPAddress: window.globalIPAddress || ip.address(),
        },
        {
          headers: getHeadersformposforrender(),
        },
      )
      .catch((error) => {
        if ([401].includes(error?.response?.status)) {
          window.reloginfromremote();
        }
      });
  } catch (error) {
    console.log(error);
  }
}

async function makeClearTokenRequest() {
  try {
    await apiCall.post(
      window.Config.links.clearFirebaseToken,
      {
        store_id: window.storeDetails.store_id,
        username: window.storeDetails.username,
        subscription: window.firebaseToken,
        type: 5,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
  } catch (error) {
    console.error(error);
  }
}

function getActivationremainingdays(expiry_date) {
  const today = window.moment();
  const expiryDate = window.moment(expiry_date);
  const remainingDays = expiryDate.diff(today, 'days');
  return remainingDays;
}

function showExpirymodal(remainingDays) {
  if (remainingDays <= 0) {
    console.log(`Message="Subscription is expired. Logging out"`);
    window.ipcRenderer.send(REMOTE_FORCE_LOGUT);
  } else if (remainingDays < 7) {
    $(`#storeactivationModalid`).modal('toggle');
    $(`#leftactivationinfoContainerid .activationStatuscontainer div`).html(
      '● Active',
    );
    $(
      `#leftactivationinfoContainerid .remainingDayscontainer .valuelabel`,
    ).html(remainingDays);
    $(`#leftactivationinfoContainerid .storenamecontainer .valuelabel`).html(
      window.storeDetails.store_name,
    );
  }
}

function checkLocalexpirydate() {
  if (window.storeDetails && window.storeDetails.activation_expires_at) {
    const remainingDays = getActivationremainingdays(
      window.storeDetails.activation_expires_at,
    );
    showExpirymodal(remainingDays);
  }
}

async function checkStoreactivationexpiry() {
  if (navigator.onLine) {
    try {
      const result = await apiCall.post(
        window.Config.links.getStoreexpirydate,
        { store_id: window.storeDetails.store_id },
        {
          headers: getHeadersformposforrender(),
        },
      );
      if ([200, '200'].includes(result.data.status)) {
        if (result.data.activation_expires_at) {
          const remainingDays = getActivationremainingdays(
            result.data.activation_expires_at,
          );
          showExpirymodal(remainingDays);
        }
      }
    } catch (error) {
      if ([401].includes(error?.response?.status)) {
        window.reloginfromremote();
      }
      checkLocalexpirydate();
    }
  } else if (window.storeDetails && window.storeDetails.activation_expires_at) {
    checkLocalexpirydate();
  }
}

// Add count decimals prototype
// eslint-disable-next-line no-extend-native
Number.prototype.countDecimals = function () {
  if (Math.floor(this.valueOf()) === this.valueOf()) return 0;
  return this.toString().split('.')[1].length || 0;
};

function countDecimalsfromstring(stringtoCheck) {
  if (Math.floor(stringtoCheck.valueOf()) === stringtoCheck.valueOf()) return 0;
  return stringtoCheck.toString().split('.')[1].length || 0;
}

/**
 * Send update to channel that the order is pulled
 * @param {*} param0
 */
async function sendOrderpulledupdatetochannel({ order_ref_id }) {
  try {
    await apiCall.post(
      window.Config.links.updatedPulledstatus,
      {
        store_id: window.channelStoreidlist,
        order_id: order_ref_id,
        pulled: 1,
        store_name: window.storeDetails.store_name,
      },
      {
        headers: {
          'x-user': window.storeDetails.username,
          'x-tmbill-key': window.ordersAPIKey || '',
          Authorization: `apikey ${window.ordersAPIKey}`,
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  makeClearTokenRequest,
  countDecimalsfromstring,
  sendtrackinforequest,
  checkStoreactivationexpiry,
  getActivationremainingdays,
  sendOrderpulledupdatetochannel,
  getSysyteminfo,
};
