const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function addCustomerRequest(customerData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CUSTOMER.ADD_CUSTOMER,
      customerData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while adding customer" `, error);
  }
  return undefined;
}

async function addOrUpdateCustomerRequest(customerData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CUSTOMER.ADD_OR_UPDATE_CUSTOMER,
      customerData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while adding customer" `, error);
  }
  return undefined;
}

async function reAddCustomerInWindow(reply) {
  try {
    if (reply && Array.isArray(reply) && reply.length > 0) {
      window.customersList = reply;
    }
    if (window.customerscriptLoaded) window.remoterefreshCustomerstable();

    if (window.customermgmtscriptLoaded) {
      window.refreshCustomermgmttable();
    }
  } catch (error) {
    console.error(error);
  }
}

async function reAddCustomerRequest() {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CUSTOMER.RE_ADD_CUSTOMER,
      {},
    );
    if (data) {
      reAddCustomerInWindow(data);
    }
    return data;
  } catch (error) {
    console.error(`Message="Error while adding customer" `, error);
  }
  return undefined;
}

module.exports = {
  addCustomerRequest,
  addOrUpdateCustomerRequest,
  reAddCustomerRequest,
};
