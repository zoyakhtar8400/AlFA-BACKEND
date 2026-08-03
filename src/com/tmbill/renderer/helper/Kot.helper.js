const { default: Swal } = require('sweetalert2');
const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makeSaveKotRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.SAVE_KOT,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}

async function makeGetOldKotRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.GET_OLD_KOT,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}

async function makeChangeTableRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.CHANGE_TABLE,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}

async function makeUpdateKotItemRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.UPDATE_OLD_KOT_ITEM,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}

async function makeSetInactiveKotRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.SET_INACTIVE_KOT,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeTransferOldKotRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.TRANSFER_KOT,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}

async function makeUpdateTransferItemKotNumberRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.TRANSFER_ITEM_KOT_NUMBER,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}

async function makeGetKotStatusByTableRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.GET_KOT_STATUS_BY_TABLE,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeCheckActiveKotRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.CHECK_ACTIVE_KOT,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeCheckDineinActiveKotRequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.KOT.CHECK_DINEIN_ACTIVE_KOT,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeItemsUpdateItemDiscountAppliedRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.ITEM_LEVEL_DISCOUNT_APPLIED_UPDATE_ITEMS,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function changeOrderTypeAfterSaveKotRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.CHANGE_ORDER_TYPE_AFTER_SAVE_KOT,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetKOTItemRequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.KOT.GET_RUNNING_KOT_ITEMS,
      content,
    );
    return data;
  } catch (error) {
    if (Swal.isVisible()) Swal.close();
    console.error(error);
  }
  return undefined;
}
module.exports = {
  makeSaveKotRequest,
  makeGetOldKotRequest,
  makeChangeTableRequest,
  makeUpdateKotItemRequest,
  makeSetInactiveKotRequest,
  makeTransferOldKotRequest,
  makeUpdateTransferItemKotNumberRequest,
  makeGetKotStatusByTableRequest,
  makeCheckActiveKotRequest,
  makeItemsUpdateItemDiscountAppliedRequest,
  makeCheckDineinActiveKotRequest,
  changeOrderTypeAfterSaveKotRequest,
  makeGetKOTItemRequest,
};
