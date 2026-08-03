const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makeGetAllStoresRequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.STORE.GET_ALL_STORES,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while get stores" `, error);
  }
  return undefined;
}

module.exports = {
  makeGetAllStoresRequest,
};
