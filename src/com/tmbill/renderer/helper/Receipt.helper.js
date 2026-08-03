const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makegetBillsrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.GET_BILL,
      content,
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

async function makegetBilldetailsrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.GET_BILL_DETAILS,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makegetPrintcountrequest(content) {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.RECEIPT.PRINT_COUNT,
      { params: content },
    );
    return data || 0;
  } catch (error) {
    console.error(error);
  }
  return 0;
}

async function makeupdatePrintcountrequest(content) {
  try {
    const { data } = await localapiCall.put(
      MASTER_POS_ENDPOINTS.RECEIPT.PRINT_COUNT,
      content,
    );
    return data || 0;
  } catch (error) {
    console.error(error);
  }
  return 0;
}

async function makeReduceinventoryrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.REDUCE_INVENTORY,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeReverseinventoryrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.REVERSE_INVENTORY,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeUpdatebillandpaymentrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.UPDATE_BILL_AND_PAYMENT,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetduepaytransactionsrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.GET_DUE_PAY_TRX,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeResyncbillrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.RESYNC,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeCancelitemmodificationrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.CANCEL_ITEM_MODIFIY,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeUpdateBillqtyrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.MODIFIY_BILL_QTY,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeGetpaymentsrequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.RECEIPT.GET_PAYMENTS,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeUpdateBillrequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.UPDATE_ORDER,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function makeSaveIRNResponserequest(content) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.RECEIPT.SAVE_IRN_RESPONSE,
      content,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

module.exports = {
  makeResyncbillrequest,
  makeGetduepaytransactionsrequest,
  makeUpdatebillandpaymentrequest,
  makegetBilldetailsrequest,
  makegetBillsrequest,
  makegetPrintcountrequest,
  makeupdatePrintcountrequest,
  makeReduceinventoryrequest,
  makeReverseinventoryrequest,
  makeGetpaymentsrequest,
  makeCancelitemmodificationrequest,
  makeUpdateBillqtyrequest,
  makeUpdateBillrequest,
  makeSaveIRNResponserequest,
};
