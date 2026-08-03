const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function fetchSettings() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.STORE.GET_SETTINGS,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function updateSettings(settingsData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.UPDATE_SETTNGS,
      settingsData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function getPaymentModes() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.COMMON.GET_PAYMENT_MODES,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

module.exports = {
  fetchSettings,
  updateSettings,
  getPaymentModes,
};
