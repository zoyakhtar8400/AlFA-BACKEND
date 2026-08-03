const { safeParse } = require('../../util/RendererUtils');
const {
  MASTER_POS_ENDPOINTS,
  TIME_OUT_FOR_RENDERER_APIS,
} = require('../config');
const { localapiCall } = require('../services/APIService');

function addTerminalfilters(params) {
  if (
    !window.__IS_MASTER_POS__ &&
    window.storeDetails &&
    window.storeDetails.access_levels
  ) {
    const accessLevel = safeParse(window.storeDetails.access_levels);
    let includeDepartments = [];
    if (accessLevel?.order_window?.table_departments) {
      includeDepartments = accessLevel?.order_window?.table_departments || [];
    }

    let includeCategories = [];
    if (accessLevel?.order_window?.item_categories) {
      includeCategories = accessLevel?.order_window?.item_categories || [];
    }

    Object.assign(params, {
      includeDepartments: includeDepartments.toString(),
      includeCategories: includeCategories.toString(),
    });
  }
}

async function getOrderWindowDetails(params) {
  try {
    addTerminalfilters(params);
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.ORDER.GET_ORDERWINDOW_DETAILS,
      params,
      {
        timeout: 120000,
      },
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function doLoadMenu() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.CATALOG.LOAD_MENU,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetDiscountRequest(discountData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_DISCOUNT,
      discountData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetItemsOptionRequest(optionsData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_ITEM_OPTIONS,
      optionsData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeAddItemNoteRequest(itemData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.ADD_ITEM_NOTE,
      itemData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeDeleteItemNoteRequest(itemData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.DELETE_ITEM_NOTE,
      itemData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetItemNoteRequest(getItemData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_ITEM_NOTE,
      getItemData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetProductgrpsRequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.CATALOG.GET_PRODUCT_GROUPS,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetCustomerRequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.CATALOG.GET_CUSTOMER,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetWaitersRequest(waiterData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_WAITERS,
      waiterData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetPaymentsRequest(paymentData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_PAYMENTS,
      paymentData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetPaymentsAsyncRequest(payData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_PAYMENTS_ASYNC,
      payData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetItemModifiersRequest(modifiersData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.GET_ITEM_MODIFIERS,
      modifiersData,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeUpdateItemStockRequest(itemStock) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.CATALOG.UPDATE_ITEM_STOCK,
      itemStock,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

module.exports = {
  getOrderWindowDetails,
  doLoadMenu,
  makeGetDiscountRequest,
  makeGetItemsOptionRequest,
  makeAddItemNoteRequest,
  makeGetItemNoteRequest,
  makeGetProductgrpsRequest,
  makeGetCustomerRequest,
  makeGetWaitersRequest,
  makeGetPaymentsRequest,
  makeGetPaymentsAsyncRequest,
  makeGetItemModifiersRequest,
  makeUpdateItemStockRequest,
  makeDeleteItemNoteRequest,
};
