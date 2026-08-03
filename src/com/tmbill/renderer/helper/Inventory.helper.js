const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function autoReduceInventoryRequest() {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.COMMON.AUTO_REDUCE_INVENTORY,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

module.exports = {
  autoReduceInventoryRequest,
};
