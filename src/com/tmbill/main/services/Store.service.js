/* eslint-disable no-console */
const { HttpStatusCode } = require('axios');
const { cloneDeep } = require('lodash');
const { Store, MultipricingSettings, User } = require('../../js/database');
const { getAppsettings } = require('./Settings.service');

async function getUser(username) {
  const result = await User.findOne({
    raw: true,
    limit: 1,
    where: {
      username,
      store_id: global.storeDetails.store_id,
    },
  });
  return result;
}

async function getStoredetails({ username, type }) {
  try {
    await global.getStoredetailsforremote();
    const settings = await getAppsettings();

    const storeDetailstosent = cloneDeep(global.storeDetails);
    if (username && type === 'TERMINAL') {
      const userDetails = await getUser(username);
      if (
        userDetails &&
        userDetails.terminal_access_levels &&
        userDetails.is_terminal_app
      ) {
        console.log(
          `Override the access level for terminal by fetching it from db`,
        );
        // Override the access level for terminal by fetching it from db
        Object.assign(storeDetailstosent, {
          access_levels: userDetails.terminal_access_levels,
        });
      }

      // override the username
      storeDetailstosent.master_pos_username = storeDetailstosent.username;
      storeDetailstosent.username = username;
      storeDetailstosent.password = userDetails.password;
    }
    return {
      storeDetails: storeDetailstosent,
      settings,
    };
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function getStoresettings() {
  let settings = [];
  try {
    settings = await getAppsettings();
  } catch (error) {
    console.error(error);
  }
  return settings;
}

async function getAllstores() {
  let storeslist = [];
  try {
    storeslist = await Store.findAll({
      raw: true,
    });
  } catch (error) {
    console.log(error);
  }
  return storeslist;
}

async function deleteStore(params) {
  const response = { status: HttpStatusCode.NonAuthoritativeInformation };
  try {
    if (
      params &&
      params.store_id &&
      global.storeDetails.store_id !== params.store_id
    ) {
      await Store.destroy({
        where: {
          store_id: params.store_id,
        },
      });
      Object.assign(response, { status: HttpStatusCode.Ok });
    }
  } catch (error) {
    console.error(error);
  }
  return response;
}

async function getMultipricingsettings(params) {
  try {
    const result = await MultipricingSettings.findOne({
      raw: true,
      where: {
        store_id: params.store_id || global.storeDetails.store_id,
      },
    });

    // Set the global setting if the current store id is same
    if (params.store_id === global.storeDetails.store_id) {
      if (result && result.settings) {
        global.multipricingSetting = JSON.parse(result.settings);
      } else {
        global.multipricingSetting = undefined;
      }
    }
    return result;
  } catch (error) {
    console.error(`Message="Error While Getting MultiPricing Settings"`, error);
  }
  return {};
}

module.exports = {
  getStoredetails,
  getAllstores,
  getStoresettings,
  deleteStore,
  getMultipricingsettings,
};
