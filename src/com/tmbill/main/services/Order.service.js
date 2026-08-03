/* eslint-disable no-console */
const { HttpStatusCode } = require('axios');
const {
  fetchKOTnumbers,
  saveBill,
  settleBill,
  settleQuickbill,
  updateCharges,
  updateDiscount,
  updateCustomerforanorder,
  updateDeliveryboy,
  getWalletdetails,
  checkifduepaymentExists,
  checkBillIsPrinted,
  updatePrintCountOfOrder,
  updateWaitertipDetails,
  getPreordersfilterby,
  addPreorderform,
  updateEbillstatus,
  updatePayment,
  isOrdersynced,
  checkOrderIdIsPresent,
  setOrderNote,
  getItemOptions,
  updateOrderItemsForReeloDiscount,
  getRunningOrderDetials,
} = require('../../main_controllers/Order');
const {
  issyncNeeded,
  sendCouponhistory,
  updateRewardhistory,
} = require('../../services/SyncService');
const {
  spillBillbyportion,
  spillBillbypercentage,
  spillBillbyitems,
} = require('../../main_controllers/SpiltOrder');
const { updateCustomerAddress } = require('../../main_controllers/Order/index');
const {
  checkBillNumberResetIsValidOrNot,
} = require('../../main_controllers/Utils/CheckResetDate');
const { settleOnlinebill } = require('../../js/MainIPClisteners');

const { checkIsOrderSaved } = require('../../main_controllers/Order/index');
const {
  updatekotItems,
} = require('../../main_controllers/Utils/itemLevelDiscount');
const { Bill } = require('../../js/database');
const {
  updateOrderDataAsPerPaymentInfo,
} = require('../../main_controllers/Order/index');
const { addZatcaStatus } = require('../../main_controllers/Utils/Zatca');

async function fetchNextBillKOTNumber() {
  try {
    const data = await fetchKOTnumbers();
    return data;
  } catch (error) {
    console.error(
      `Message="Error While Fetching Next Bill and KOT Number"`,
      error,
    );
  }
  return {};
}

async function getSyncstatus() {
  try {
    const result = await issyncNeeded(global.storeDetails.store_id);
    return { result };
  } catch (error) {
    console.error(`Message="Error While Getting Sync Status"`, error);
  }
  return { result: false };
}

async function requestSaveOrder(data) {
  try {
    if (data) {
      const responseData = await saveBill(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Save Order Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Saving Order" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSettleOrder(data) {
  try {
    if (data) {
      const responseData = await settleBill(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Settle Order Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Settling Order" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSettleQuickbill(data) {
  try {
    if (data) {
      const responseData = await settleQuickbill(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Settle QuickBill Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Settling QuickBill" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestupdateOrdercharges(data) {
  try {
    if (data) {
      const responseData = await updateCharges(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Update Order Charges Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Order Charges Payload" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestupdateOrderdiscount(data) {
  try {
    if (data) {
      const responseData = await updateDiscount(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Update Order Discount Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Order Discount Payload" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestupdateOrdercustomer(data) {
  try {
    if (data) {
      const result = await updateCustomerforanorder(data);
      const response = { status: result };
      return response;
    }
    console.warn(
      `Message="Invalid Update Order Customer Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Order Customer Payload" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdatedeliveryboy(data) {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      await updateDeliveryboy(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid Update Delivery Boy Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Delivery Boy" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return response;
}

async function requestUpdateCustomerAddress(data) {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      await updateCustomerAddress(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid Update Delivery Boy Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Delivery Boy" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return response;
}

async function requestCheckBillNumberIsValidOrNot(data) {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      await checkBillNumberResetIsValidOrNot(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check bill number Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error checking bill number" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return response;
}

async function requestGetWalletDetails(data) {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    if (data) {
      const result = await getWalletdetails(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
        ...result,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check bill number Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error checking bill number" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return response;
}
async function requestCheckDuePayExist(data) {
  let response;
  try {
    if (data) {
      response = await checkifduepaymentExists(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check bill number Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error checking bill number" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return response;
}

async function requestSplitbillbyportion(data) {
  try {
    if (data) {
      const result = await spillBillbyportion(data);
      return result;
    }
    console.warn(
      `Message="Invalid Split Bill by Portion Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Splitting Bill by Portion " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSplitbillbypercent(data) {
  try {
    if (data) {
      const result = await spillBillbypercentage(data);
      return result;
    }
    console.warn(
      `Message="Invalid Split Bill by Percent Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.log(
      `Message="Error While Splitting Bill by Percent " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSplitbillbyitems(data) {
  try {
    if (data) {
      const result = await spillBillbyitems(data);
      return result;
    }
    console.warn(
      `Message="Invalid Split Bill by Items Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Splitting Bill by Items " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSettleOnlinebill(data) {
  try {
    if (data) {
      await settleOnlinebill(data);
      return 'success';
    }
    console.warn(
      `Message="Invalid Settle online order payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While settling online order " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestCheckBillPrinted(data) {
  try {
    if (data) {
      const result = await checkBillIsPrinted(data);
      return result;
    }
    console.warn(
      `Message="Invalid check bill printed payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking bill printed" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdateBillPrintStatus(data) {
  try {
    if (data) {
      const result = await updatePrintCountOfOrder(data);
      return result;
    }
    console.warn(
      `Message="Invalid update bill status payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating bill print status" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSendCouponHistory(data) {
  try {
    if (data) {
      await sendCouponhistory({
        store_id: global.storeDetails.store_id,
      });
      return undefined;
    }
    console.warn(
      `Message="Invalid coupon history payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While sending coupon history" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSaveWaiterTip(data) {
  try {
    if (data) {
      await updateWaitertipDetails(data);
      return undefined;
    }
    console.warn(
      `Message="Invalid waiter tip payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While adding waiter tip" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdateOrderDataAsPerPayment(data) {
  try {
    if (data) {
      console.log(
        `Message="Invalid update order data as per payment info payload" Payload="${JSON.stringify(data)}"`,
      );
      const result = await updateOrderDataAsPerPaymentInfo(data);
      return result;
    }
    console.warn(
      `Message="Invalid update order data as per payment info payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating order data as per payment info" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestItemUpdatesForReeloDiscount(data) {
  try {
    if (data) {
      const result = await updateOrderItemsForReeloDiscount(data);
      return result;
    }
    console.warn(
      `Message="Invalid item update for reelo discount payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating items for reelo discount" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}
async function requestUpdateReeloExtraDetails(data) {
  try {
    if (data) {
      await Bill.update(
        {
          extra_details: data.extra_details,
        },
        {
          where: {
            order_id: data.order_id,
          },
        },
      );
    }
    console.warn(
      `Message="Invalid update extra details for reelo discount payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating extra details for reelo discount" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestSendRewardHistory(data) {
  try {
    if (data) {
      updateRewardhistory(data);
      return undefined;
    }
    console.warn(
      `Message="Invalid update extra details for reelo discount payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating extra details for reelo discount" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestFilterOrders(data) {
  try {
    if (data) {
      const response = await getPreordersfilterby(data);
      return response;
    }
    console.warn(
      `Message="Invalid filter orders payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While filtering orders" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdatePreOrderData(data) {
  try {
    if (data) {
      const response = await addPreorderform(data);
      return response;
    }
    console.warn(
      `Message="Invalid update pre order payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating preorder" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdateEBillStatusCheck(data) {
  try {
    if (data) {
      const response = await updateEbillstatus(data);
      return response;
    }
    console.warn(
      `Message="Invalid update update e bill check status payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating ebill status" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestCheckIfOrderIsSaved(data) {
  try {
    if (data) {
      const response = await checkIsOrderSaved(data);
      return response;
    }
    console.warn(
      `Message="Invalid check order is saved payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking order save" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdateOrder(data) {
  try {
    if (data && data.order_id) {
      const updateData = data;
      const orderID = data.order_id;
      delete updateData.order_id;

      const response = await Bill.update(updateData, {
        where: {
          order_id: orderID,
        },
      });
      return response;
    }
    console.warn(
      `Message="Invalid Update Order Order payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Order" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestFastSettle(data) {
  try {
    if (data) {
      const result = await updatePayment(data);
      return result;
    }
    console.warn(
      `Message="Invalid Fast Settle Order payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Fast Settling Order " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestOrdersyncstatus(data) {
  try {
    if (data && data.order_id) {
      const result = await isOrdersynced(data);
      return result;
    }
    console.warn(
      `Message="Invalid Order Sync Status payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Checking Order Sync Status " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestDoesorderIdexistcheck(data) {
  try {
    if (data && (data.order_id || data.orderId)) {
      const result = await checkOrderIdIsPresent(data.order_id || data.orderId);
      return result;
    }
    console.warn(
      `Message="Invalid Order ID Exist Check Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Checking Order ID Exist Check" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestisOrdersavedcheck(data) {
  try {
    if (data) {
      const result = await checkIsOrderSaved(data);
      return result;
    }
    console.warn(
      `Message="Invalid Is Order Saved Check Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Checking Is Order Saved Check Payload" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestisUpdateItemsdiscount(data) {
  try {
    if (data) {
      const response = await updatekotItems(data);
      return response;
    }
    console.warn(
      `Message="Invalid Update Items Discount Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Items Discount " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestAddOrderNote(data) {
  try {
    if (data) {
      const response = await setOrderNote(data);
      return response;
    }
    console.warn(
      `Message="Invalid Update Order Note Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Updating Order Note " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestGetItemAddons(data) {
  try {
    if (data) {
      const response = await getItemOptions(data);
      return response;
    }
    console.warn(
      `Message="Invalid Get Item addon Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Getting item addon " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestAddZatcaStatus(data) {
  try {
    if (data) {
      const response = await addZatcaStatus(data);
      return response;
    }
  } catch (error) {
    console.error(
      `Message="Error While adding zatca status " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestGetRunningOrderDetails(data) {
  try {
    if (data) {
      const response = await getRunningOrderDetials(data);
      return response;
    }
  } catch (error) {
    console.error(
      `Message="Error While adding zatca status " Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

module.exports = {
  requestisUpdateItemsdiscount,
  requestisOrdersavedcheck,
  requestDoesorderIdexistcheck,
  requestFastSettle,
  fetchNextBillKOTNumber,
  getSyncstatus,
  requestSaveOrder,
  requestSettleOrder,
  requestSettleQuickbill,
  requestupdateOrdercharges,
  requestupdateOrderdiscount,
  requestupdateOrdercustomer,
  requestUpdatedeliveryboy,
  requestSplitbillbyportion,
  requestSplitbillbypercent,
  requestSplitbillbyitems,
  requestUpdateCustomerAddress,
  requestCheckBillNumberIsValidOrNot,
  requestGetWalletDetails,
  requestCheckDuePayExist,
  requestSettleOnlinebill,
  requestCheckBillPrinted,
  requestUpdateBillPrintStatus,
  requestSendCouponHistory,
  requestSaveWaiterTip,
  requestItemUpdatesForReeloDiscount,
  requestUpdateOrderDataAsPerPayment,
  requestUpdateReeloExtraDetails,
  requestSendRewardHistory,
  requestFilterOrders,
  requestUpdatePreOrderData,
  requestUpdateEBillStatusCheck,
  requestUpdateOrder,
  requestOrdersyncstatus,
  requestCheckIfOrderIsSaved,
  requestAddOrderNote,
  requestGetItemAddons,
  requestAddZatcaStatus,
  requestGetRunningOrderDetails,
};
