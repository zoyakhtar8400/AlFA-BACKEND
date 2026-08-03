/* eslint-disable no-console */
const { HttpStatusCode } = require('axios');
const {
  addCustomer,
  updateCustomerforanorder,
} = require('../../main_controllers/Order');
const { createWalletonremote } = require('../../main_controllers/Wallet');
const {
  syncCustomersifany,
  readdCustomers,
} = require('../../services/SyncService');
const { Customer } = require('../../js/database');

async function requestAddCustomer(data) {
  const responseData = { status: HttpStatusCode.Ok };
  try {
    if (data) {
      const customer = data;
      customer.store_id = global.storeDetails.store_id;
      let shouldcreateWallet = false;
      if (customer.createWallet) {
        shouldcreateWallet = customer.createWallet;
      }
      const response = await addCustomer(customer);
      if (customer.updateNameOnTable) {
        const customerupdateData = {
          customer,
          table_id: customer.table_id,
        };
        await updateCustomerforanorder(customerupdateData);
      }

      syncCustomersifany({
        store_id: global.storeDetails.store_id,
      });
      if (response && response.status === 200 && shouldcreateWallet) {
        createWalletonremote(customer);
      }
      return responseData;
    }
  } catch (error) {
    console.log(`Message="Error While Creating Customer Payload"`, error);
  }
  return responseData;
}

async function requestAddorUpdateCustomer(data) {
  const responseData = { status: HttpStatusCode.Ok };
  try {
    if (data) {
      const result = await addCustomer(data.customer);
      if (result && result.status === 200 && result.customer) {
        if (data.miscData) {
          const { miscData } = data;
          const customerupdateData = {
            order_id: miscData.order_id,
            customer: result.customer,
            table_id: miscData.table_id,
          };
          await updateCustomerforanorder(customerupdateData);
        }
      }
      syncCustomersifany({
        store_id: global.storeDetails.store_id,
      });
      return result;
    }
  } catch (error) {
    console.error(
      `Message="Error While Adding/Updating Customer Payload"`,
      error,
    );
  }
  return responseData;
}

async function requestGetCustomer() {
  let customers;
  try {
    customers = await Customer.findAll({
      raw: true,
      where: {
        store_id: global.storeDetails.store_id,
      },
    });
  } catch (error) {
    console.error(`Message="Error While fetching customers"`, error);
  }
  return customers;
}

async function reAddCustomerRequest() {
  try {
    const customers = await readdCustomers({
      store_id: global.storeDetails.store_id,
    });
    syncCustomersifany({
      store_id: global.storeDetails.store_id,
    });
    return customers;
  } catch (error) {
    console.error(`Message="Error While re adding customers"`, error);
  }
  return undefined;
}

module.exports = {
  reAddCustomerRequest,
  requestAddCustomer,
  requestGetCustomer,
  requestAddorUpdateCustomer,
};
