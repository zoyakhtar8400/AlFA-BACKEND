const connection = require('../../js/database');
const {
  reduceInventoryoforder,
  reverseInventoryrequest,
} = require('../../main_controllers/Inventory');
const {
  getreceiptprintCount,
  updatereceiptprintCount,
  getOrderduetransactions,
  setSyncstatus,
} = require('../../main_controllers/Order');
const Receipt = require('../../main_controllers/Receipt');
const {
  cancelItemModifyBill,
  updateModifyBillQuantity,
  updateOrderLevelValues,
} = require('../../main_controllers/modifyBill');
const { sendLivesyncrequest } = require('../../services/SyncService');
const { OrderState } = require('../../util/DBUtil');

const receiptModel = new Receipt(connection);

async function getBills(params) {
  try {
    const rawBills = await receiptModel.getBills2(
      params,
      global.storeDetails.store_id,
    );
    const billsdata = {
      bills: rawBills,
      params,
    };
    // Check if it is a request for report data.
    if (params.report) {
      await receiptModel.getTodaysreport(params, billsdata);
    }
    return billsdata;
  } catch (error) {
    console.error(`Message="Error While Getting Bills for receipt"`, error);
  }
  return undefined;
}

async function getBillitemdetails(args) {
  try {
    const rawBills = await receiptModel.getBillitems(args.order_id);
    const charges = await receiptModel.getCharges(args.order_id);
    const discountHistory = await connection.SectionwiseDiscounthistory.findAll(
      {
        where: {
          order_id: args.order_id,
        },
      },
    );
    const billData = {
      items: rawBills,
      charges,
      discountHistory,
    };
    if (args.is_pre_order) {
      const preorder = await receiptModel.getPreorder(args.order_id);
      Object.assign(billData, {
        preorderInfo: preorder,
      });
    }
    return billData;
  } catch (error) {
    console.error(
      `Message="Error While Getting Bill Details for receipt"`,
      error,
    );
  }
  return undefined;
}

async function getPrintcount(params) {
  try {
    const data = await getreceiptprintCount(params);
    return data;
  } catch (error) {
    console.error(`Message="Error While Getting Print Order"`, error);
  }
  return 0;
}

async function updatePrintcount(params) {
  try {
    const data = await updatereceiptprintCount(params);
    return data;
  } catch (error) {
    console.error(`Message="Error While Updating Order Print Count"`, error);
  }
  return undefined;
}

async function requestreduceInventory(params) {
  try {
    const orderidList = params.orders || [];
    if (orderidList && orderidList.length) {
      const result = await reduceInventoryoforder(orderidList);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Reducing Inventory"`, error);
  }
  return undefined;
}

async function requestreverseInventory(params) {
  try {
    if (params) {
      const result = await reverseInventoryrequest(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Reversing Inventory"`, error);
  }
  return undefined;
}

async function requestupdateBillandpayment(args) {
  try {
    if (args) {
      const result = await receiptModel.updateBill(args);
      if (result && result.status === 'success') {
        const returndata = { ...args };
        Object.assign(returndata, { result });
        // event.reply(RECEIPTWINDOW_IPC.UPDATE_BILLS_AND_PAY_REPLY, returndata);
        sendLivesyncrequest();
        return returndata;
      }
    }
  } catch (error) {
    console.error(`Message="Error While Updating Bill and Payment"`, error);
  }
  return undefined;
}

async function requestGetduepaymenttrx(params) {
  try {
    if (params) {
      const result = await getOrderduetransactions(params);
      return result;
    }
  } catch (error) {
    console.error(
      `Message="Error While Getting Due Payment Transactions"`,
      error,
    );
  }
  return undefined;
}

async function requestSetBillsyncstatus(params) {
  try {
    if (params) {
      const result = await setSyncstatus(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Setting Bill Sync Status"`, error);
  }
  return undefined;
}

async function requestGetPaymentsforreceipt() {
  try {
    const payments = await connection.Payment.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: global.storeDetails.store_id,
      },
    });
    const data = {
      payments,
      status: OrderState,
    };
    return data;
  } catch (error) {
    console.error(`Message="Error While Getting Payment list"`, error);
  }
  return undefined;
}

async function requestcancelItemModifyBill(params) {
  try {
    if (params) {
      const result = await cancelItemModifyBill(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Cancel Item Modify Bill"`, error);
  }
  return undefined;
}

async function requestupdateModifyBillQuantity(params) {
  try {
    if (params) {
      const result = await updateModifyBillQuantity(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Modify Bill Quantity"`, error);
  }
  return undefined;
}

async function requestupdateOrderLevelValues(params) {
  try {
    if (params) {
      const result = await updateOrderLevelValues(params);
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While Updating Order Level Values"`, error);
  }
  return undefined;
}

async function requestSaveIRNResponse(params) {
  try {
    if (params) {
      const result = await connection.IRNHistory.create({
        store_id: global.storeDetails.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
        type: 1,
        ref_id: params.response.ref_id,
        irn_no: params.response.irnResponse.respObj.irn,
        irn_response: params.response.irnResponse,
      });
      return result;
    }
  } catch (error) {
    console.error(`Message="Error While adding IRN response"`, error);
  }
  return undefined;
}

module.exports = {
  requestSetBillsyncstatus,
  getBillitemdetails,
  getBills,
  getPrintcount,
  updatePrintcount,
  requestreduceInventory,
  requestreverseInventory,
  requestupdateBillandpayment,
  requestGetduepaymenttrx,
  requestGetPaymentsforreceipt,
  requestcancelItemModifyBill,
  requestupdateModifyBillQuantity,
  requestupdateOrderLevelValues,
  requestSaveIRNResponse,
};
