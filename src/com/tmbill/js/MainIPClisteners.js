/* eslint-disable camelcase */
const { ipcMain } = require('electron');
const { dialog } = require('electron');
const ip = require('ip');
const { Config } = require('../config/config');
const Receipt = require('../main_controllers/Receipt');
const { OrderState, BillingTypes } = require('../util/DBUtil');
const { OFFLINE_ORDERSTATES } = require('../util/OrderStates');
const {
  CURRENT_STORE,
  ROUNDOFF_UPTO_DECIMAL,
  AUTO_SYNC,
} = require('../util/SettingIDs');
const { resetCurrentaccesslevel } = require('./AccesslevelManager');
const TableUtils = require('../util/TableUtils');
require('../main_controllers/ManuManagement/index');
const {
  GET_BUSY_TABLES,
  GET_BUSY_TABLES_REPLY,
  CLOSE_DAY_REPLY,
  CLOSE_DAY,
  LOAD_MENU,
  LOAD_MENU_REPLY,
  SET_KOT_INACTIVE,
  SET_KOT_INACTIVE_REPLY,
  INIT_SYNC_REPLY,
  INIT_SYNC,
  GET_SETTNGS,
  GET_SETTNGS_REPLY,
  UPDATE_SETTNGS,
  UPDATE_SETTNGS_REPLY,
  GET_ORDERWINDOW_DETAILS,
  GET_ORDERWINDOW_DETAILS_REPLY,
  SAVE_KOT_REPLY,
  SAVE_KOT,
  SAVE_BILL_REPLY,
  SAVE_BILL,
  SETTLE_BILL_REPLY,
  SETTLE_BILL,
  SETTLE_QUICK_BILL_REPLY,
  SETTLE_QUICK_BILL,
  GET_BILLS_REPLY,
  GET_BILLS,
  DELETE_TABLE_REPLY,
  DELETE_TABLE,
  GET_OLD_KOT,
  GET_OLD_KOT_REPLY,
  GET_PAYMENTS_REPLY,
  GET_PAYMENTS,
  GET_DISCOUNTS,
  GET_DISCOUNTS_REPLY,
  UPDATE_PAYMENTS_REPLY,
  UPDATE_PAYMENTS,
  UPDATE_CHARGES_REPLY,
  UPDATE_CHARGES,
  UPDATE_DISCOUNT_REPLY,
  UPDATE_DISCOUNT,
  UPDATE_SELECTEDCUSTOMER_REPLY,
  UPDATE_SELECTEDCUSTOMER,
  ADD_CUSTOMER,
  ADD_CUSTOMER_REPLY,
  CHANGE_TABLE_DETAILS,
  CHANGE_TABLE_DETAILS_REPLY,
  UPDATE_TABLECOLOR_REPLY,
  UPDATE_TABLECOLOR,
  UPDATE_OLDKOTITEM,
  FETCH_BILLTABLE_DATA,
  FETCH_BILLTABLE_DATA_REPLY,
  FETCH_KOTBILL_NUMBER,
  FETCH_KOTBILL_NUMBER_REPLY,
  UPDATE_DELIVERY_BOY,
  GET_SHORTCUTS,
  GET_SHORTCUTS_REPLY,
  UPDATE_SHORTCUTS_REPLY,
  UPDATE_SHORTCUTS,
  GET_ITEMOPTIONS_REPLY,
  GET_ITEMOPTIONS,
  ADD_PRINTER,
  PRINTERS_IPC,
  ADD_PRINTER_REPLY,
  UDATE_STORE_DETAILS_REPLY,
  UDATE_STORE_DETAILS,
  GET_ALLSTORE_REPLY,
  GET_ALLSTORE,
  GET_STOREDETAILS,
  GET_STOREDETAILS_REPLY,
  SWITCH_STORE_REPLY,
  SWITCH_STORE,
  ADD_ITEMNOTES,
  GET_ITEMNOTES,
  GET_ITEMNOTES_REPLY,
  PULL_DIGITALORDER,
  UPDATE_TABLESTATE_REPLY,
  UPDATE_TABLESTATE,
  SAVE_ONLINEBILL,
  SAVE_ONLINEBILL_REPLY,
  SETTLE_ONLINEBILL,
  SETTLE_ONLINEBILL_REPLY,
  NEW_TABLEADDED,
  SPLIT_TABLE,
  SPLIT_TABLE_REPLY,
  MERGE_TABLE,
  MERGE_TABLE_REPLY,
  CHECKIF_DAYISTARTED_REPLY,
  UPDATE_ONLINEORDER_STATUS_REPLY,
  UPDATE_ONLINEORDER_STATUS,
  CHECKIF_DAYISTARTED,
  UPDATE_ONLINEDELIVERY_BOY,
  CAPTAIN_IPC,
  ORDER_IPC,
  TRANSFER_OLDKOT,
  WALLET_IPC,
  GET_PAYMENTS_ASYNC,
  FETCH_ASYNC_KOTBILL_NUMBER,
  RECEIPTWINDOW_IPC,
  GET_PAYMENT_MODES_FOR_STRIP,
  GET_PAYMENT_MODES_FOR_STRIP_REPLY,
  CHECK_IFBILL_IS_RUNNING,
  CHECK_IFBILL_IS_RUNNING_REPLY,
  GET_REPORT_NUMBER,
  OPEN_DIALOG_FOR_DIRECTORY,
  UPDATE_BILL_NUMBER,
  CHECK_BILL_PRINTED,
  GET_ITEMS_BY_PRODUCT_GROUP,
  GET_ALL_PRODUCT_GROUP,
  GET_RUNNING_ORDER_ITEMS,
  TRANSFER_ITEM_KOT_NUMBER,
  UPDATE_MALL_REPORT_ID,
  UPDATE_FAST_SETTLE_PAYMENT,
  UPDATE_FAST_SETTLE_PAYMENT_REPLY,
  CHECK_IS_KOT_ACTIVE_FOR_CSK,
  UPDATE_ORDERDATA_AS_PER_PAYMENT_INFO,
  GET_DELIVERY_BOY_DATA,
  SAVE_BILL_FOR_CSK,
  SAVE_BILL_FOR_CSK_REPLY,
  FETCH_BILL_DATA_FOR_CSK,
  FETCH_BILL_DATA_FOR_CSK_REPLY,
  UPDATE_PRINT_STATUS_OF_ORDER,
  ADD_BHARATPE_QR_IN_DATABASE,
  CHECK_IF_ORDER_IS_PULLED,
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL,
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY,
  UPDATE_OLDKOTITEM_REPLY,
  ITEM_DISCOUNT_APPLIED_UPDATE_KOT_ITEMS,
  START_CATEGORY_SHOW_CRON_JOB,
  CHECK_ORDER_IS_SAVED,
  UPDATE_TIP_AMOUNT_FOR_REMOTE_ORDER,
  SETTLE_BILL_IN_BACKGROUND,
  SETTLE_BILL_IN_BACKGROUND_REPLY,
  SET_RESERVATION_ID_TO_TABLE,
  CREATE_TABLE_RESERVATION_RECORD,
  GET_TABLE_ID,
  UPDATE_ITEM_DETAILS_LOCALLY,
  ADD_ITEM_LOCALLY,
  UPDATE_CATEGORY_STATUS,
  ADD_CATEGORY_LOCALLY,
  ADD_KITCHEN_DEPT_LOCALLY,
  EXPORT_TALLY_REPORT,
  ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL,
  SHOW_SENT_REPORT_NOTIFICATION,
  SEND_SHOW_SENT_REPORT_NOTIFICATION,
  CHECK_BILL_NUMBER_RESET_IS_VALID,
  UPDATE_STOCK_QTY,
  GET_NEWORRUNNING_KOT_TAG,
  UPDATE_ONLINE_ORDER_KDS_KOT_STATUS,
  CHECK_IF_REMOTE_KOT_IS_PULLED,
  SHOW_CLOSE_DAY_WINDOW,
  EXTEND_CLOSE_DAY_TIME,
} = require('../util/IPC_Messages');

const {
  startloadCatalog,
  issyncNeeded,
  sendReduceinventoryrequest,
  readdCustomers,
  sendCouponhistory,
  syncStartenddaydata,
  syncCustomersifany,
  updateRewardhistory,
  sendLivesyncrequest,
} = require('../services/SyncService');
const {
  startloadCatalogRequestFromServer,
} = require('../services/loadMenuOnNotification');
require('../main_controllers/ExportImportcsv');
const {
  setStartdayotherdetails,
  getReportNumber,
} = require('../main_controllers/Reports');
require('../main_controllers/Expenses');
require('../main_controllers/Dashboard');
const { mastermenuInitializer } = require('../main_controllers/MasterMenu');
const {
  addItemnote,
  getKotitemnotes,
  getItemoptions,
  updateDeliveryboy,
  fetchKOTnumbers,
  getOrderwindowdetails,
  saveKOT,
  saveBill,
  saveDigitalorder,
  settleBill,
  settleQuickbill,
  getrunningorderDetails,
  updateCustomerforanorder,
  updateCharges,
  updatePayment,
  updateDiscount,
  addCustomer,
  transferKOTItem,
  getOrderdetails,
  getWalletdetails,
  updateliveitemstatus,
  getOrderduetransactions,
  updateTablestatus,
  getrunningKotitems,
  updateBill,
  getTables,
  updateEbillstatus,
  getWaiterslist,
  updateWaiter,
  changeTableforkot,
  checkifduepaymentExists,
  getResettedbillkotifexist,
  getDiscounts,
  setSyncstatus,
  addPreorderform,
  getPreordersfilterby,
  getOrderbillnumber,
  updatereceiptprintCount,
  getreceiptprintCount,
  isOrdersynced,
  checkIfKOTIsRunning,
  checkBillIsRunning,
  checkOrderIdIsPresent,
  getResettedOnlinebill,
  updateBillNumber,
  checkBillIsPrinted,
  getItemsByProductGroup,
  getAllProductGroup,
  getKotNumberForTransferItem,
  changeTableColor,
  checkIsKotActiveForTable,
  updateOrderItemsForReeloDiscount,
  initializeAccesslevles,
  pad,
  updateWaitertipDetails,
  getResettedordernumberifexist,
  updatePrintCountOfOrder,
  setTables,
  getNewOrRunnigTagForOrder,
  updatekotstatus,
} = require('../main_controllers/Order');
const {
  getOldKOTdetails,
  updateOldkot,
  setinactiveForoldkot,
} = require('../main_controllers/OldKOT');
const {
  cancelItemModifyBill,
  updateOrderLevelValues,
  updateModifyBillQuantity,
} = require('../main_controllers/modifyBill');
require('../main_controllers/Bill');
const {
  getUserwallets,
  createWallet,
  checkIfamountavaiableinwallet,
  updateDuepaymentandaddtransaction,
  getTransactions,
  createWalletonremote,
  walletTopup,
  walletInitializer,
  getCustomernothavingwallets,
} = require('../main_controllers/Wallet');
require('../main_controllers/SpiltOrder');
require('../main_controllers/User');
const { resolvesyncmenuConflict } = require('../services/MiscServices');
const {
  setDateForMidnightOrder,
  checkIfTimeForMidnightReport,
  sleep,
} = require('../util/MiscUtil');
const { CHARGE_TYPES, BILL_PREFIX_FOR } = require('../util/Constants');
const {
  updateSettingsOnNotification,
} = require('../main_controllers/UpdateDataOnNotifications');
const connection = require('./database');
const {
  reduceInventoryoforder,
  reverseInventoryrequest,
} = require('../main_controllers/Inventory');
const {
  updateQRCodeinorder,
  checkIfOrderIsPulled,
  checkIsOrderSaved,
  updateTipAmountForRemoteOrder,
  getTableidOfOrder,
  updateOrderDataAsPerPaymentInfo,
  getPayments,
  saveBillPrintImage,
  clearInvoicesDirectory,
  checkIfRemoteKotIsPulled,
} = require('../main_controllers/Order/index');
const { safeParseformain } = require('../main_controllers/Utils');
const { checkOrderPaymentTotalDiff } = require('../main_controllers/APICalls');
const {
  updatekotItems,
} = require('../main_controllers/Utils/itemLevelDiscount');
const { startCategoryTimeJob } = require('../util/Jobs');
const {
  addWaiterNotificationToDatabase,
  getWaiterNotification,
  closeRunningNotification,
} = require('../main_controllers/WaiterNotification');
const {
  setRservationIdToTable,
  createReservationRecord,
} = require('../main_controllers/TableRservation');
const { exportTallyReport } = require('../main_controllers/TallyReport');
const {
  updateItemDetails,
  addNewItemLocally,
  updateCategoryStatusLocally,
  addNewCategoryLocally,
  addNewKitchenDeptLocally,
  addNewCategoryLocallyWithoutAccessLevel,
} = require('../main_controllers/ManuManagement/index');
const {
  checkBillNumberResetIsValidOrNot,
  fetchDateFromBackend,
} = require('../main_controllers/Utils/CheckResetDate');
const {
  extendCloseDayTime,
} = require('../main_controllers/Utils/ExtendCloseDayTime');
require('../main_controllers/CustomerDisplay');
require('../main_controllers/DigitalOrder');

let globalIPAddress = ip.address();
global.settingsConfig = undefined;
global.ROUNDOFF_UPTO = 2;
global.isLoadMenuInProgress = false;
let receiptModel;
let bill_number_length = 0;
let autoSyncmode = false;

/**
 * Initialize the connection and other models
 * @param {Parameters} params
 */
async function initializeListeners(params) {
  initSettings();
  receiptModel = new Receipt(connection);
  mastermenuInitializer({ syncStartenddaydata });
  walletInitializer({ syncStartenddaydata });
  setTimeout(() => {
    checkOrderPaymentTotalDiff();
  }, 10000);
  clearInvoicesDirectory();
}

async function setBillnumberlengthformain() {
  if (
    global.storeDetails &&
    global.storeDetails.extra_info &&
    global.storeDetails.extra_info
  ) {
    const extra_info = safeParseformain(global.storeDetails.extra_info);
    bill_number_length = Number(extra_info.bill_number_length);
    initializeAccesslevles();
    setTables();
  }
}
/**
 * Fetch the app settings
 */
async function initSettings() {
  if (connection) {
    try {
      settingsConfig = await connection.Settings.findAll({
        raw: true,
        order: [['id', 'ASC']],
      });

      if (
        settingsConfig &&
        settingsConfig[ROUNDOFF_UPTO_DECIMAL - 1] != undefined
      ) {
        global.ROUNDOFF_UPTO = settingsConfig[ROUNDOFF_UPTO_DECIMAL - 1].value;
        if (!ROUNDOFF_UPTO || isNaN(ROUNDOFF_UPTO)) {
          gloabal.ROUNDOFF_UPTO = 2;
        }
      } else {
        gloabal.ROUNDOFF_UPTO = 2;
      }

      if (settingsConfig && settingsConfig[AUTO_SYNC - 1] != undefined) {
        autoSyncmode = settingsConfig[AUTO_SYNC - 1].value === '1';
      }
    } catch (error) {}
  }
}

ipcMain.on('online-status-changed', (event, status) => {
  console.log(`Message="System is ${status}"`);
  if (
    status === 'online' &&
    (autoSyncmode ||
      global.storeDetails?.live_tracking_enabled ||
      global.storeDetails?.loyalty_enabled)
  ) {
    sendLivesyncrequest(true);
  }
  global.internetConnectionavailable = status === 'online';
});

ipcMain.on(CHECKIF_DAYISTARTED, checkDayisstarted);
ipcMain.on(ORDER_IPC.CHECK_SYNC_STATUS, checkSynctstatus);
ipcMain.on(WALLET_IPC.GET_DATA, getWalletrequesthandler);
ipcMain.on(WALLET_IPC.CREATE, createWalletrequesthandler);

global.betteripcMain.answerRenderer(
  ORDER_IPC.ADD_UPDATE_CUSTOMER,
  async (params) => {
    const result = await addCustomer(params.customer);
    if (result && result.status === 200 && result.customer) {
      if (params.miscData) {
        const { miscData } = params;
        const customerupdateData = {
          order_id: miscData.order_id,
          customer: result.customer,
          table_id: miscData.table_id,
        };
        await updateCustomerforanorder(customerupdateData);
      }
    }
    syncCustomersifany({
      connection,
      store_id: global.storeDetails.store_id,
    });
    return result;
  },
);

betteripcMain.answerRenderer('get-kot-staus-as-per-kds', async (params) => {
  const kotResult = await connection.KOT.findAll({
    where: {
      table_id: params['table_id '] || params.table_id,
      is_active: 1,
    },
    raw: true,
  });
  const kot_status = [];
  kotResult.map((kot) => {
    kot_status.push(kot.status);
  });

  return kot_status;
});

betteripcMain.answerRenderer('load-menu-request-from-server', async () => {
  if (global.storeDetails) {
    startloadCatalogRequestFromServer({
      loadmenuLink: Config.links.loadmenu,
      store_id: global.storeDetails.store_id,
      connection,
      message: INIT_SYNC_REPLY,
    });
  }
});

betteripcMain.answerRenderer('cancel-item-modify-bill', async (params) => {
  const result = await cancelItemModifyBill(params);
  return result;
});

betteripcMain.answerRenderer('update-order-level-values', async (params) => {
  const result = await updateOrderLevelValues(params);
  return result;
});

betteripcMain.answerRenderer('save-bill-print-image', async (params) => {
  const result = await saveBillPrintImage(params);
  return result;
});

betteripcMain.answerRenderer(
  'update-items-for-reelo-discount',
  async (params) => {
    const result = await updateOrderItemsForReeloDiscount(params);
  },
);

betteripcMain.answerRenderer(
  'update-items-for-reelo-discount',
  async (params) => {
    const result = await updateOrderItemsForReeloDiscount(params);
  },
);

betteripcMain.answerRenderer('update-reelo-extraDetails', async (params) => {
  await connection.Bill.update(
    {
      extra_details: params.extra_details,
    },
    {
      where: {
        order_id: params.order_id,
      },
    },
  );
});

betteripcMain.answerRenderer(GET_DELIVERY_BOY_DATA, async (params) => {
  const result = await connection.DeliveryBoy.findAll({
    raw: true,
    where: {
      store_id: params.store_id,
    },
  });
  return result;
});

betteripcMain.answerRenderer(
  ORDER_IPC.RESYNC_BILLS_BETWEEN_DATE,
  async (params) => {
    const result = await setSyncstatus(params);
    return result;
  },
);

// save irn respone
betteripcMain.answerRenderer('save-irn-response', async (params) => {
  const result = await connection.IRNHistory.create({
    store_id: storeDetails.store_id,
    tmpos_id: storeDetails.tmpos_id,
    type: 1,
    ref_id: params.response.ref_id,
    irn_no: params.response.irnResponse.respObj.irn,
    irn_response: params.response.irnResponse,
  });
  return result;
});

betteripcMain.answerRenderer(ORDER_IPC.UPDATE_WAITER, async (params) => {
  const result = await updateWaiter(params);
  return result;
});

betteripcMain.answerRenderer(ORDER_IPC.GET_WAITERS, async (params) => {
  const result = await getWaiterslist(params);
  return result;
});

betteripcMain.answerRenderer(GET_PAYMENTS_ASYNC, async (params) => {
  const payments = await connection.Payment.findAll({
    raw: true,
    where: {
      // NEW STOREWISE CHANGE 17 JAN 2020
      store_id: global.storeDetails.store_id,
    },
  });
  return payments;
});

betteripcMain.answerRenderer(
  ORDER_IPC.UPDATE_LIVEITEMSTATUS_DATA,
  async (params) => {
    const result = await updateliveitemstatus(params);
    return result;
  },
);

ipcMain.on(ORDER_IPC.GET_ORDER_TABLES, async (event, params) => {
  const tables = await getTables(params.store_id);
  event.reply(ORDER_IPC.GET_ORDER_TABLES_REPLY, tables);
});

betteripcMain.answerRenderer(ORDER_IPC.GET_LIVESTATUS_DATA, async (params) => {
  const result = await getrunningKotitems(params);
  return result;
});

betteripcMain.answerRenderer(ORDER_IPC.GET_DUETRANS_DETAILS, async (params) => {
  const result = await getOrderduetransactions(params);
  return result;
});

betteripcMain.answerRenderer(
  WALLET_IPC.CHECKIF_AMOUNT_AVAILABLE,
  async (params) => {
    params.connection = connection;
    const result = await checkIfamountavaiableinwallet(params);
    return result;
  },
);

betteripcMain.answerRenderer(
  WALLET_IPC.UPDATE_DUEAND_ADDTRANS,
  async (params) => {
    params.connection = connection;
    const result = await updateDuepaymentandaddtransaction(params);
    return result;
  },
);

betteripcMain.answerRenderer(WALLET_IPC.GET_TRANSACTIONS, async (params) => {
  params.connection = connection;
  const result = await getTransactions(params);
  return result;
});
betteripcMain.answerRenderer(WALLET_IPC.TOPUP, async (params) => {
  params.connection = connection;
  const result = await walletTopup(params);
  return result;
});
betteripcMain.answerRenderer(WALLET_IPC.GET_CUSTOMERS, async () => {
  const params = {
    connection,
    store_id: global.storeDetails.store_id,
  };
  const result = await getCustomernothavingwallets(params);
  return result;
});

betteripcMain.answerRenderer(PULL_DIGITALORDER, async (params) => {
  const response = await saveDigitalorder(params);
  return response;
});

betteripcMain.answerRenderer(CHECK_IF_ORDER_IS_PULLED, async (params) => {
  const response = await checkIfOrderIsPulled(params.order_id);
  return response;
});

betteripcMain.answerRenderer(CHECK_IF_REMOTE_KOT_IS_PULLED, async (params) => {
  const response = await checkIfRemoteKotIsPulled(params.order_id);
  return response;
});

betteripcMain.answerRenderer('update-digital-order-status', async (params) => {
  const result = await connection.Bill.findOne({
    where: {
      order_id: params.order_id,
    },
  });
  if (result) {
    const response = await connection.Bill.update(
      {
        order_state: String(params.order_state).toLowerCase(),
        sync_status: 0,
      },
      {
        where: {
          order_id: params.order_id,
        },
      },
    );
    if (response) {
      sendLivesyncrequest();
    }
  }
});
betteripcMain.answerRenderer(
  ORDER_IPC.UPDATE_EBILLCHECK_STATUS,
  async (params) => {
    const result = await updateEbillstatus(params);
    return result;
  },
);

betteripcMain.answerRenderer(FETCH_ASYNC_KOTBILL_NUMBER, async (params) => {
  const data = await fetchKOTnumbers();
  return data;
});

betteripcMain.answerRenderer(
  ORDER_IPC.CREATEUPDATE_PRE_ORDER_DATA,
  async (params) => {
    const data = await addPreorderform(params);
    return data;
  },
);

betteripcMain.answerRenderer(
  ORDER_IPC.FILTER_PRE_ORDER_BYDATE,
  async (params) => {
    const data = await getPreordersfilterby(params);
    return data;
  },
);

betteripcMain.answerRenderer(
  ORDER_IPC.CHECK_IF_DUE_PAY_EXIST,
  async (params) => {
    const data = await checkifduepaymentExists(params);
    return data;
  },
);

betteripcMain.answerRenderer(
  ORDER_IPC.GET_STOREDETAILS_ASYNC,
  async (params) => {
    await getStoredetailsforremote();
    const settings = await getAppsettings();
    return {
      storeDetails: global.storeDetails,
      settings,
    };
  },
);

betteripcMain.answerRenderer(ORDER_IPC.GET_BILL_NUMBER, async (params) => {
  const data = await getOrderbillnumber({ ...params });
  return data;
});

betteripcMain.answerRenderer(GET_TABLE_ID, async (params) => {
  const data = await getTableidOfOrder(params);
  return data;
});

betteripcMain.answerRenderer(
  PRINTERS_IPC.UPDATE_RECEIPT_PRINT_COUNT,
  async (params) => {
    const data = await updatereceiptprintCount({ ...params });
    return data;
  },
);

betteripcMain.answerRenderer(
  PRINTERS_IPC.GET_RECEIPT_PRINT_COUNT,
  async (params) => {
    const data = await getreceiptprintCount({ ...params });
    return data;
  },
);

betteripcMain.answerRenderer(
  ORDER_IPC.CHECK_IFORDER_SYNCED,
  async ({ order_id }) => {
    const result = await isOrdersynced({ order_id });
    return result;
  },
);

betteripcMain.answerRenderer(
  ORDER_IPC.SEND_REWARDHISTORY_STATUS_UPDATE,
  ({ status, order_id }) => {
    updateRewardhistory({ status, order_id });
  },
);

betteripcMain.answerRenderer(
  ORDER_IPC.SENT_MULTIPLE_REDUCEINVENTORY_REQUEST,
  async (content) => {
    if (content) {
      const result = await reduceInventoryoforder(content);
      return result;
    }
  },
);

betteripcMain.answerRenderer(
  UPDATE_ORDERDATA_AS_PER_PAYMENT_INFO,
  async (content) => {
    updateOrderDataAsPerPaymentInfo(content);
  },
);

betteripcMain.answerRenderer(OPEN_DIALOG_FOR_DIRECTORY, async (params) => {
  let destinationDirectory;
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result && result.filePaths && result.filePaths.length) {
    destinationDirectory = result.filePaths[0];
  }
  return destinationDirectory;
});

betteripcMain.answerRenderer('pull-remote-kot', async (params) => {
  const result = await saveKOT(params);
  return result;
});

betteripcMain.answerRenderer(GET_ITEMS_BY_PRODUCT_GROUP, async (params) => {
  const result = await getItemsByProductGroup(params);
  return result;
});

betteripcMain.answerRenderer('change-color', async (params) => {
  const result = await changeTableColor(params);
  return result;
});

betteripcMain.answerRenderer(GET_ALL_PRODUCT_GROUP, async () => {
  const result = await getAllProductGroup();
  return result;
});

// check kot is active for table
betteripcMain.answerRenderer(CHECK_IS_KOT_ACTIVE_FOR_CSK, async (params) => {
  const result = await checkIsKotActiveForTable(params);
  return result;
});

// check kot is active for table
betteripcMain.answerRenderer(ADD_BHARATPE_QR_IN_DATABASE, async (params) => {
  const result = await updateQRCodeinorder(params);
  return result;
});

// update mall report number
betteripcMain.answerRenderer(UPDATE_MALL_REPORT_ID, async (params) => {
  const mallReportNumber = await connection.Tempnumbers.findOne({
    raw: true,
    where: { id: 1 },
  });

  reportNumber = mallReportNumber.mall_report_id;
  let numberToUpdate;
  let result;
  if (reportNumber < 9999) {
    numberToUpdate = reportNumber + 1;
    result = await connection.Tempnumbers.update(
      { mall_report_id: numberToUpdate },
      { where: { id: 1 } },
    );
  } else {
    numberToUpdate = 1;
    result = await connection.Tempnumbers.update(
      { mall_report_id: numberToUpdate },
      { where: { id: 1 } },
    );
  }
  return mallReportNumber.mall_report_id;
});

// check if bill is saved or not
betteripcMain.answerRenderer(CHECK_ORDER_IS_SAVED, async (params) => {
  const result = await checkIsOrderSaved(params);
  return result;
});

// update tip amount for remote 0rder
betteripcMain.answerRenderer(
  UPDATE_TIP_AMOUNT_FOR_REMOTE_ORDER,
  async (params) => {
    const result = await updateTipAmountForRemoteOrder(params);
    return result;
  },
);

// update reservation id for table
betteripcMain.answerRenderer(SET_RESERVATION_ID_TO_TABLE, async (params) => {
  const result = await setRservationIdToTable(params);
  return result;
});

// create reservation record
betteripcMain.answerRenderer(
  CREATE_TABLE_RESERVATION_RECORD,
  async (params) => {
    const result = await createReservationRecord(params);
    return result;
  },
);

betteripcMain.answerRenderer(EXTEND_CLOSE_DAY_TIME, async (params) => {
  const result = await extendCloseDayTime(params);
  return result;
});

global.betteripcMain.answerRenderer(
  CHECK_BILL_NUMBER_RESET_IS_VALID,
  async (params) => {
    const result = await checkBillNumberResetIsValidOrNot(params);
    return result;
  },
);

ipcMain.on(FETCH_KOTBILL_NUMBER, async (event) => {
  try {
    const data = await fetchKOTnumbers();
    if (data) event.reply(FETCH_KOTBILL_NUMBER_REPLY, JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
});
async function getWalletrequesthandler(event, params) {
  try {
    params.connection = connection;
    const result = await getUserwallets(params);
    event.reply(WALLET_IPC.GET_DATA_REPLY, result);
  } catch (error) {}
}

async function createWalletrequesthandler(event, params) {
  try {
    params.connection = connection;
    const result = await createWallet(params);
    event.reply(WALLET_IPC.CREATE_REPLY, result);
  } catch (error) {}
}

async function checkDayisstarted(event, content) {
  try {
    const result = await connection.StartcloseDay.isdayStarted(
      connection,
      global.storeDetails.store_id,
    );
    const response = await connection.UserShift.checkIfshiftstarted(content);
    event.reply(CHECKIF_DAYISTARTED_REPLY, { result, response });
  } catch (error) {
    console.error(error);
  }
}

async function checkDayisstartedForExitHandler(content) {
  try {
    const result = await connection.StartcloseDay.isdayStarted(
      connection,
      global.storeDetails.store_id,
    );
    const response = await connection.UserShift.checkIfshiftstarted(content);
    // event.reply(CHECKIF_DAYISTARTED_REPLY, { result, response });
    global.mainWindow.webContents.send(SHOW_CLOSE_DAY_WINDOW, {
      result,
      response,
    });
  } catch (error) {
    console.error(error);
  }
}

async function checkSynctstatus(event, status) {
  try {
    const result = await issyncNeeded(global.storeDetails.store_id);
    event.reply(ORDER_IPC.CHECK_SYNC_STATUS_REPLY, JSON.stringify({ result }));
  } catch (error) {}
}

ipcMain.on(CAPTAIN_IPC.ADD_CAPTAIN, async (event, content) => {
  if (content) {
    const response = {};
    try {
      content = JSON.parse(content);
      if (content) {
        const result = await connection.User.create(content);
        response.result = result;
        response.message = 'User added.';
        response.status = 'success';
      }
    } catch (error) {
      response.error = error;
      response.message = 'User not added.';
      response.status = 'error';
      if (
        error &&
        error.parent &&
        error.parent.errno &&
        error.parent.errno == 19
      ) {
        response.message = 'Username exists';
        response.status = 'error';
      }
    }
    event.reply(CAPTAIN_IPC.ADD_CAPTAIN_REPLY, JSON.stringify(response));
  }
});

ipcMain.on(CAPTAIN_IPC.GET_CAPTAINS, async (event, content) => {
  if (content) {
    const response = {};
    try {
      content = JSON.parse(content);
      if (content) {
        const captains = await connection.User.findAll({
          raw: true,
          include: [
            {
              model: connection.UserLoginStatus,
              attributes: ['status'],
            },
          ],
          where: content.whereData,
        });
        response.captains = captains;
      }
    } catch (error) {
      console.log(error);
    }
    event.reply(CAPTAIN_IPC.GET_CAPTAINS_REPLY, JSON.stringify(response));
  }
});

ipcMain.on(ADD_ITEMNOTES, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      if (content) {
        await addItemnote(content);
      }
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(GET_ITEMNOTES, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      content.store_id = global.storeDetails.store_id;
      const data = await getKotitemnotes(content);
      event.reply(GET_ITEMNOTES_REPLY, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(GET_ITEMOPTIONS, async (event, content) => {
  if (content) {
    try {
      const requestdata = JSON.parse(content);
      requestdata.store_id = global.storeDetails.store_id;
      const data = await getItemoptions(requestdata);
      event.reply(GET_ITEMOPTIONS_REPLY, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(UPDATE_DELIVERY_BOY, async (event, content) => {
  if (content) {
    try {
      const data = JSON.parse(content);
      updateDeliveryboy(data);
    } catch (error) {}
  }
});
ipcMain.on(FETCH_KOTBILL_NUMBER, async (event, status) => {
  try {
    const data = await fetchKOTnumbers();
    if (data) event.reply(FETCH_KOTBILL_NUMBER_REPLY, JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(ADD_CUSTOMER, async (event, status) => {
  if (status) {
    try {
      const customer = JSON.parse(status);
      if (customer) {
        customer.store_id = global.storeDetails.store_id;
        let shouldcreateWallet = false;
        if (customer.createWallet) {
          shouldcreateWallet = customer.createWallet;
        }
        const response = await addCustomer(customer);
        event.reply(ADD_CUSTOMER_REPLY, JSON.stringify(response));
        syncCustomersifany({
          connection,
          store_id: global.storeDetails.store_id,
        });
        if (response && response.status === 200 && shouldcreateWallet) {
          createWalletonremote(customer);
        }
        return;
      }
    } catch (error) {}
  }
  event.reply(
    ADD_CUSTOMER_REPLY,
    JSON.stringify({ status: 400, message: 'error' }),
  );
});

ipcMain.on(UPDATE_TABLECOLOR, async (event, content) => {
  if (content) {
    try {
      const details = JSON.parse(content);
      if (details && details.table_id) {
        await connection.Table.update(
          {
            table_color: details.table_color,
            table_action_flag: details.table_action_flag,
          },
          {
            where: {
              id: details.table_id,
            },
          },
        );
        await connection.KOT.increment(['draftprint_status'], {
          by: 1,
          where: {
            table_id: details.table_id,
            is_active: 1,
          },
        });
        event.reply(UPDATE_TABLECOLOR_REPLY, 'success');
      }
    } catch (error) {}
  }
});

ipcMain.on(ORDER_IPC.GET_CUSTOMERS, async (event, content) => {
  try {
    const customers = await connection.Customer.findAll({
      raw: true,
      where: {
        store_id: global.storeDetails.store_id,
      },
    });

    event.reply(ORDER_IPC.GET_CUSTOMERS_REPLY, JSON.stringify(customers));
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(CHANGE_TABLE_DETAILS, async (event, details) => {
  if (details) {
    try {
      const changeTabledata = JSON.parse(details);
      const status = await changeTableforkot(changeTabledata);
      event.reply(CHANGE_TABLE_DETAILS_REPLY, status);
    } catch (error) {
      console.log(error);
    }
  }
});

/**
 * Selected customer updates
 */
ipcMain.on(UPDATE_SELECTEDCUSTOMER, async (event, status) => {
  if (status) {
    try {
      const customerupdateData = JSON.parse(status);
      const result = await updateCustomerforanorder(customerupdateData);
      const response = { status: result };
      event.reply(UPDATE_SELECTEDCUSTOMER_REPLY, response);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(GET_ORDERWINDOW_DETAILS, async (event, status) => {
  try {
    const orderwindowData = await getOrderwindowdetails(
      global.storeDetails.store_id,
      status,
    );
    globalIPAddress = ip.address();
    orderwindowData.ipAddress = globalIPAddress;
    event.reply(GET_ORDERWINDOW_DETAILS_REPLY, JSON.stringify(orderwindowData));
  } catch (error) {
    console.log(error);
  }
});

// ipcMain.on(UPDATE_SETTNGS, async (event, content) => {
//   if (content && connection) {
//     try {
//       const settings = safeParseformain(content);
//       await connection.Settings.update(
//         {
//           value: settings.value,
//         },
//         {
//           where: {
//             id: settings.id,
//           },
//         },
//       );
//       event.reply(UPDATE_SETTNGS_REPLY, undefined);
//     } catch (error) {
//       console.log(error);
//     }
//   }
// });

async function getAppsettings() {
  let settingsConfig = [];
  try {
    settingsConfig = await connection.Settings.findAll({
      raw: true,
      order: [['id', 'ASC']],
    });
  } catch (error) {
    settingsConfig = [];
  }
  return settingsConfig;
}

betteripcMain.answerRenderer(ORDER_IPC.GET_SETTNGS_ASYNC, async (params) => {
  const result = await getAppsettings();
  return result;
});

betteripcMain.answerRenderer('get-mulitpricing-setting', async (params) => {
  const result = await connection.MultipricingSettings.findOne({
    raw: true,
    where: {
      store_id: global.storeDetails.store_id,
    },
  });
  if (result && result.settings) {
    global.multipricingSetting = JSON.parse(result.settings);
  } else {
    global.multipricingSetting = undefined;
  }
  return result;
});
ipcMain.on(GET_SETTNGS, async (event, status) => {
  try {
    const settingsConfig = await getAppsettings();
    event.reply(GET_SETTNGS_REPLY, settingsConfig);
  } catch (error) {}
});

ipcMain.on(INIT_SYNC, (event, status) => {
  if (global.storeDetails) {
    startloadCatalog({
      loadmenuLink: Config.links.loadmenu,
      store_id: global.storeDetails.store_id,
      connection,
      message: INIT_SYNC_REPLY,
      event,
    });
  }
});

ipcMain.on(SET_KOT_INACTIVE, (event, data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      setinactiveForoldkot(data);
      event.reply(
        SET_KOT_INACTIVE_REPLY,
        JSON.stringify({
          table_id: data.table_id,
          deleteTable: data.deleteTable,
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(LOAD_MENU, async (event, status) => {
  if (global.storeDetails && connection) {
    if (global.isLoadMenuInProgress) {
      return;
    }
    const result = await resolvesyncmenuConflict();
    event.reply(LOAD_MENU_REPLY, result ? 'donotSync' : 'sync');
  } else {
    event.reply(LOAD_MENU_REPLY, 'donotSync');
  }
});

ipcMain.on(GET_BUSY_TABLES, async (event, status) => {
  if (connection) {
    try {
      const busyTables = await connection.KOT.getBusytables();
      if (busyTables && busyTables.length > 0) {
        event.reply(GET_BUSY_TABLES_REPLY, busyTables);
      }
    } catch (error) {
      console.error(error);
    }
  }
});

ipcMain.on(UPDATE_TABLESTATE, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      const result = await connection.Table.updateorderState(
        content.order_state,
        content.id,
      );
      event.reply(UPDATE_TABLESTATE_REPLY, undefined);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(DELETE_TABLE, async (event, table_id) => {
  if (table_id) {
    const responseData = {};
    try {
      await connection.Table.destroy({
        where: { id: table_id },
      });
      responseData.status = 'success';
      responseData.table_id = table_id;
    } catch (error) {
      responseData.status = 'failure';
    }
    event.reply(DELETE_TABLE_REPLY, JSON.stringify(responseData));
  }
});

/**
 * Returns the current store details
 */
ipcMain.on(GET_STOREDETAILS, async (event, args) => {
  try {
    await getStoredetailsforremote();
    const settings = await getAppsettings();
    event.reply(GET_STOREDETAILS_REPLY, {
      storeDetails: global.storeDetails,
      settings,
    });
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(GET_ALLSTORE, async (event, content) => {
  try {
    const result = await connection.Store.findAll({
      raw: true,
    });
    event.reply(GET_ALLSTORE_REPLY, JSON.stringify(result));
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(SWITCH_STORE, async (event, params) => {
  const response = {};
  const { store_id } = params;
  try {
    if (store_id) {
      await connection.Settings.update(
        { value: store_id },
        {
          where: {
            id: CURRENT_STORE,
          },
        },
      );

      const result = await connection.Store.findAll({
        raw: true,
        limit: 1,
        where: {
          store_id,
        },
      });
      if (result != undefined && result.length > 0) {
        global.storeDetails = result[0];
        const logoutneeded = isLogoutrequired();
        const channellogoutNeeded = ischannelLogoutrequired();
        response.channellogoutNeeded = channellogoutNeeded;
        response.logoutneeded = logoutneeded;
        if (params.miscActions) {
          Object.assign(response, { miscActions: params.miscActions });
        }
        const extra_info = safeParseformain(storeDetails.extra_info);
        if (
          storeDetails &&
          storeDetails.extra_info &&
          extra_info.pos_settings
        ) {
          const param = {};
          Object.assign(param, { settings: extra_info.pos_settings });
          await updateSettingsOnNotification(param);
          response.pos_settings = extra_info.pos_settings;
        }

        if (global.storeDetails && global.storeDetails.token) {
          response.token = global.storeDetails.token;
          response.username = global.storeDetails.username;
        }

        setBillnumberlengthformain();
        resetCurrentaccesslevel();
      }
    }
  } catch (error) {
    console.log(error);
  }
  response.status = 'success';
  event.reply(SWITCH_STORE_REPLY, response);
});

/**
 * Tells if user needs to logout or not
 */
function isLogoutrequired() {
  if (
    global.storeDetails != undefined &&
    global.storeDetails.settings != undefined
  ) {
    try {
      const settings = JSON.parse(global.storeDetails.settings);
      if (settings.userlogged) {
        return false;
      }
      return true;
    } catch (error) {}
  }
  return false;
}

/**
 * Tells if user needs to logout or not
 */
function ischannelLogoutrequired() {
  if (
    global.storeDetails != undefined &&
    global.storeDetails.settings != undefined
  ) {
    try {
      const settings = JSON.parse(global.storeDetails.settings);
      if (settings.userlogged) {
        return false;
      }
      return true;
    } catch (error) {}
  }
  return false;
}
/**
 * Updates the  store settings
 */
ipcMain.on('update-store-settings', async (event, content) => {
  if (content) {
    try {
      const settings = JSON.parse(content);
      await connection.Store.update(
        { settings },
        {
          where: { store_id: global.storeDetails.store_id },
        },
      );
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(UDATE_STORE_DETAILS, async (event, content) => {
  if (content) {
    try {
      const updateDetails = JSON.parse(content);
      const result = await connection.Store.update(updateDetails, {
        where: {
          // NEW STOREWISE CHANGE 17 JAN 2020
          store_id: global.storeDetails.store_id,
        },
      });
      const newDetails = await connection.Store.findAll({
        raw: true,
        limit: 1,
        where: {
          // NEW STOREWISE CHANGE 17 JAN 2020
          store_id: global.storeDetails.store_id,
        },
      });
      if (newDetails != undefined && newDetails.length > 0) {
        global.storeDetails = newDetails[0];
      }
      event.reply(
        UDATE_STORE_DETAILS_REPLY,
        JSON.stringify(global.storeDetails),
      );
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(GET_BILLS, async (event, params) => {
  if (params && global.storeDetails) {
    const raw_bills = await receiptModel.getBills2(
      params,
      global.storeDetails.store_id,
    );
    const billsdata = {
      bills: raw_bills,
      params,
    };
    // Check if it is a request for report data.
    if (params.report) {
      await receiptModel.getTodaysreport(params, billsdata);
    }
    event.reply(GET_BILLS_REPLY, `${JSON.stringify(billsdata)}`);
  }
});

/**
 * Get bill item event listener
 */
ipcMain.on('get-bill-items', async (event, args) => {
  try {
    const raw_bills = await receiptModel.getBillitems(args.order_id);
    const charges = await receiptModel.getCharges(args.order_id);
    const discountHistory = await connection.SectionwiseDiscounthistory.findAll(
      {
        where: {
          order_id: args.order_id,
        },
      },
    );

    const billData = {
      items: raw_bills,
      charges,
      discountHistory,
    };
    if (args.is_pre_order) {
      const preorder = await receiptModel.getPreorder(args.order_id);
      Object.assign(billData, {
        preorderInfo: preorder,
      });
    }
    event.reply('get-bill-items-reply', `${JSON.stringify(billData)}`);
  } catch (error) {}
});

/**
 * Update bill status and payment listener
 */
ipcMain.on(RECEIPTWINDOW_IPC.UPDATE_BILLS_AND_PAY, async (event, args) => {
  if (args) {
    const result = await receiptModel.updateBill(args);
    if (result && result.status === 'success') {
      const returndata = { ...args };
      Object.assign(returndata, { result });
      event.reply(RECEIPTWINDOW_IPC.UPDATE_BILLS_AND_PAY_REPLY, returndata);
      sendLivesyncrequest();
    }
  }
});

ipcMain.on(UPDATE_SHORTCUTS, async (event, content) => {
  if (content && connection) {
    try {
      const shortcut = JSON.parse(content);
      await connection.Shortcuts.update(
        {
          value: shortcut.value,
        },
        {
          where: {
            id: shortcut.id,
          },
        },
      );
      event.reply(UPDATE_SHORTCUTS_REPLY, undefined);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(GET_SHORTCUTS, async (event, status) => {
  try {
    const shortcuts = await connection.Shortcuts.findAll({
      raw: true,
      order: ['name'],
    });
    event.reply(GET_SHORTCUTS_REPLY, JSON.stringify({ shortcuts }));
  } catch (error) {
    console.log(error);
  }
});

betteripcMain.answerRenderer(
  ORDER_IPC.GET_PAYMENT_LIST_ASYNC,
  async (params) => {
    const payments = await getPayments(params);
    return payments;
  },
);

ipcMain.on(GET_PAYMENT_MODES_FOR_STRIP, async (event, content) => {
  try {
    const payments = await connection.Payment.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: global.storeDetails.store_id,
      },
    });
    event.reply(GET_PAYMENT_MODES_FOR_STRIP_REPLY, JSON.stringify(payments));
  } catch (error) {}
});

ipcMain.on(CHECK_IFBILL_IS_RUNNING, async (event) => {
  // let response = await checkIfKOTIsRunning();
  const response = await checkBillIsRunning();
  event.reply(CHECK_IFBILL_IS_RUNNING_REPLY, response.length);
});

ipcMain.on(GET_PAYMENTS, async (event, status) => {
  if (status) {
    const response = await getPayments(status);
    event.reply(GET_PAYMENTS_REPLY, response);
  }
});

ipcMain.on(ORDER_IPC.GET_WALLET_DETAILS, requestwalletDetails);

async function requestwalletDetails(event, data) {
  try {
    const response = await getWalletdetails(data);
    event.reply(ORDER_IPC.GET_WALLET_DETAILS_REPLY, response);
  } catch (error) {}
}

ipcMain.on(UPDATE_PAYMENTS, async (event, content) => {
  if (content && connection) {
    try {
      const paymentData = JSON.parse(content);
      const result = await updatePayment(paymentData);
      event.reply(UPDATE_PAYMENTS_REPLY, result);
    } catch (error) {
      console.log(error);
    }
  }
});

betteripcMain.answerRenderer(GET_NEWORRUNNING_KOT_TAG, async (data) => {
  if (data) {
    const savetipResult = await getNewOrRunnigTagForOrder(data);
    return savetipResult;
  }
});

betteripcMain.answerRenderer('save-waiter-tip', async (data) => {
  if (data) {
    const savetipResult = await updateWaitertipDetails(data);
    return savetipResult;
  }
});
ipcMain.on(UPDATE_FAST_SETTLE_PAYMENT, async (event, content) => {
  if (content && connection) {
    try {
      const paymentData = JSON.parse(content);
      const result = await updatePayment(paymentData);
      event.reply(UPDATE_FAST_SETTLE_PAYMENT_REPLY, result);
    } catch (error) {
      console.log(error);
    }
  }
});

/**
 * Get payments
 */
ipcMain.on(GET_DISCOUNTS, async (event, status) => {
  if (status) {
    const data = JSON.parse(status);
    Object.assign(data, { store_id: global.storeDetails.store_id });
    const response = await getDiscounts(data);
    event.reply(GET_DISCOUNTS_REPLY, JSON.stringify(response));
  }
});

ipcMain.on(UPDATE_DISCOUNT, async (event, content) => {
  if (content && connection) {
    try {
      const discountData = JSON.parse(content);
      const result = await updateDiscount(discountData);
      event.reply(UPDATE_DISCOUNT_REPLY, result);
      return;
    } catch (error) {
      console.log(error);
    }
    event.reply(UPDATE_DISCOUNT_REPLY, 'error');
  }
});

/**
 * Returns the order status and payments list
 */
ipcMain.on('get-status-n-payments', async (event, content) => {
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
    event.reply('get-status-n-payments-reply', JSON.stringify(data));
  } catch (error) {}
});

/**
 * Returns additional charges
 */
ipcMain.on('get-charges', async (event, content) => {
  try {
    const charges = await connection.Charges.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: global.storeDetails.store_id,
      },
    });
    event.reply('get-charges-reply', JSON.stringify(charges));
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(UPDATE_CHARGES, async (event, content) => {
  if (content) {
    try {
      const data = JSON.parse(content);
      const reply = await updateCharges(data);
      event.reply(UPDATE_CHARGES_REPLY, reply);
    } catch (error) {
      console.log(error);
    }
  }
});

/**
 * KOT Methods
 */

ipcMain.on(SAVE_KOT, async (event, content) => {
  if (content) {
    try {
      const data = JSON.parse(content);
      const responseData = await saveKOT(data);
      event.reply(SAVE_KOT_REPLY, JSON.stringify(responseData));
    } catch (error) {
      console.log(error);
    }
  }
});

/**
 * Save Bill
 */

ipcMain.on(SAVE_BILL, async (event, content) => {
  if (content) {
    try {
      const billData = JSON.parse(content);
      const responseData = await saveBill(billData);
      event.reply(SAVE_BILL_REPLY, JSON.stringify(responseData));
    } catch (error) {
      console.error(error);
    }
  }
});

/**
 * Save Bill
 */

ipcMain.on(SAVE_BILL_FOR_CSK, async (event, content) => {
  if (content) {
    try {
      const billData = JSON.parse(content);
      const responseData = await saveBill(billData);
      // Forward _ctx_table_id for concurrent request context isolation
      if (billData._ctx_table_id) {
        responseData._ctx_table_id = billData._ctx_table_id;
      }
      event.reply(SAVE_BILL_FOR_CSK_REPLY, JSON.stringify(responseData));
    } catch (error) {
      event.reply(
        SAVE_BILL_FOR_CSK_REPLY,
        JSON.stringify({ status: 'failure' }),
      );
      console.error(error);
    }
  }
});

ipcMain.handle(SAVE_BILL_FOR_CSK, async (event, content) => {
  if (content) {
    try {
      const billData = JSON.parse(content);
      const responseData = await saveBill(billData);
      // Forward _ctx_table_id for concurrent request context isolation
      if (billData._ctx_table_id) {
        responseData._ctx_table_id = billData._ctx_table_id;
      }
      return JSON.stringify(responseData);
    } catch (error) {
      console.error(error);
    }
  }
});

ipcMain.on(SETTLE_QUICK_BILL, async (event, content) => {
  if (content) {
    const responseData = await settleQuickbill(JSON.parse(content));
    event.reply(SETTLE_QUICK_BILL_REPLY, JSON.stringify(responseData));
  }
});

ipcMain.on(SETTLE_BILL, async (event, content) => {
  if (content) {
    const responseData = await settleBill(JSON.parse(content));
    event.reply(SETTLE_BILL_REPLY, JSON.stringify(responseData));
  }
});

ipcMain.on(SETTLE_BILL_IN_BACKGROUND, async (event, content) => {
  if (content) {
    const responseData = await settleBill(JSON.parse(content));
    event.reply(SETTLE_BILL_IN_BACKGROUND_REPLY, JSON.stringify(responseData));
  }
});

betteripcMain.answerRenderer(TRANSFER_OLDKOT, async (data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      const response = await transferKOTItem(data);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
});

betteripcMain.answerRenderer(EXPORT_TALLY_REPORT, async (data) => {
  if (data) {
    try {
      // data = JSON.parse(data);
      const response = await exportTallyReport(data);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
});

betteripcMain.answerRenderer(TRANSFER_ITEM_KOT_NUMBER, async (data) => {
  if (data) {
    try {
      // data = JSON.parse(data);
      const response = await getKotNumberForTransferItem(data);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
});

betteripcMain.answerRenderer(
  ITEM_DISCOUNT_APPLIED_UPDATE_KOT_ITEMS,
  async (data) => {
    if (data) {
      try {
        // data = JSON.parse(data);
        const response = await updatekotItems(data);
        return response;
      } catch (error) {
        console.log(error);
      }
    }
  },
);

betteripcMain.answerRenderer(
  UPDATE_ONLINE_ORDER_KDS_KOT_STATUS,
  async (data) => {
    if (data) {
      try {
        // data = JSON.parse(data);
        const response = await updatekotstatus(data);
        return response;
      } catch (error) {
        console.log(error);
      }
    }
  },
);

ipcMain.on(GET_OLD_KOT, async (event, status) => {
  if (status) {
    try {
      const data = JSON.parse(status);
      if (data) {
        const response = await getOldKOTdetails(data);
        if (response) event.reply(GET_OLD_KOT_REPLY, JSON.stringify(response));
      }
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(UPDATE_OLDKOTITEM, async (event, content) => {
  if (content) {
    try {
      const data = JSON.parse(content);
      const result = await updateOldkot(data);
      if (result) event.reply(UPDATE_OLDKOTITEM_REPLY, result);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on('modifybill-update-quantity', async (event, content) => {
  if (content) {
    try {
      const data = JSON.parse(content);
      const result = await updateModifyBillQuantity(data);
      event.reply('modifybill-update-quantity-reply', result);
    } catch (error) {
      console.log(error);
    }
  }
});

/**
 * Gets the current bill table data
 */

ipcMain.on(FETCH_BILLTABLE_DATA, async (event, content) => {
  if (content) {
    const responseData = await getrunningorderDetails(JSON.parse(content));
    event.reply(FETCH_BILLTABLE_DATA_REPLY, JSON.stringify(responseData));
  }
});

ipcMain.handle(FETCH_BILL_DATA_FOR_CSK, async (event, content) => {
  if (content) {
    const reqContent = JSON.parse(content);
    if (reqContent && reqContent.settleBill) {
      await sleep(1000);
    }
    const responseData = await getrunningorderDetails(JSON.parse(content));
    if (reqContent && reqContent.settleBill) {
      Object.assign(responseData, { settleBill: true });
      if (reqContent.username) {
        Object.assign(responseData, { username: reqContent.username });
      }
    }
    if (reqContent && reqContent.isRequestFromCsk) {
      Object.assign(responseData, { isRequestFromCsk: true });
    }
    if (reqContent && reqContent.printBill) {
      Object.assign(responseData, { printBill: true });
    }

    if (reqContent && reqContent.payment_mode) {
      Object.assign(responseData, { payment_mode: reqContent.payment_mode });
    }

    if (reqContent && reqContent.cust_paid_amount) {
      Object.assign(responseData, {
        cust_paid_amount: reqContent.cust_paid_amount,
        return_amount: reqContent.return_amount,
      });
    }

    if (reqContent && reqContent.autoSettled) {
      Object.assign(responseData, { autoSettled: true });
    }

    if (reqContent && reqContent.sendImageToCSK) {
      Object.assign(responseData, { sendImageToCSK: true });
    }

    if (reqContent && reqContent.printBillOnBothSide) {
      Object.assign(responseData, { printBillOnBothSide: true });
    }

    if (reqContent && reqContent.socketUserId) {
      Object.assign(responseData, { socketUserId: reqContent.socketUserId });
    }

    if (reqContent && reqContent.printWidth) {
      Object.assign(responseData, { printWidth: reqContent.printWidth });
    }

    if (reqContent && reqContent.cskPrintEvent) {
      Object.assign(responseData, { cskPrintEvent: reqContent.cskPrintEvent });
    }

    if (reqContent && reqContent.username) {
      Object.assign(responseData, { username: reqContent.username });
    }

    return JSON.stringify(responseData);
    // event.reply(FETCH_BILL_DATA_FOR_CSK_REPLY, JSON.stringify(responseData));
  }
});

ipcMain.on(FETCH_BILL_DATA_FOR_CSK, async (event, content) => {
  if (content) {
    const reqContent = safeParseformain(content);
    if (reqContent && reqContent.settleBill) {
      await sleep(1000);
    }
    const responseData = await getrunningorderDetails(
      safeParseformain(content),
    );
    if (reqContent && reqContent.settleBill) {
      Object.assign(responseData, { settleBill: true });
      if (reqContent.username) {
        Object.assign(responseData, { username: reqContent.username });
      }
    }
    if (reqContent && reqContent.isRequestFromCsk) {
      Object.assign(responseData, { isRequestFromCsk: true });
    }
    if (reqContent && reqContent.printBill) {
      Object.assign(responseData, { printBill: true });
    }

    if (reqContent && reqContent.payment_mode) {
      Object.assign(responseData, { payment_mode: reqContent.payment_mode });
    }

    if (reqContent && reqContent.cust_paid_amount) {
      Object.assign(responseData, {
        cust_paid_amount: reqContent.cust_paid_amount,
        return_amount: reqContent.return_amount,
      });
    }

    if (reqContent && reqContent.autoSettled) {
      Object.assign(responseData, { autoSettled: true });
    }

    if (reqContent && reqContent.sendImageToCSK) {
      Object.assign(responseData, { sendImageToCSK: true });
    }

    if (reqContent && reqContent.printBillOnBothSide) {
      Object.assign(responseData, { printBillOnBothSide: true });
    }

    if (reqContent && reqContent.socketUserId) {
      Object.assign(responseData, { socketUserId: reqContent.socketUserId });
    }

    if (reqContent && reqContent.printWidth) {
      Object.assign(responseData, { printWidth: reqContent.printWidth });
    }

    if (reqContent && reqContent.cskPrintEvent) {
      Object.assign(responseData, { cskPrintEvent: reqContent.cskPrintEvent });
    }

    if (reqContent && reqContent.username) {
      Object.assign(responseData, { username: reqContent.username });
    }

    // return JSON.stringify(responseData);
    event.reply(FETCH_BILL_DATA_FOR_CSK_REPLY, JSON.stringify(responseData));
  }
});

ipcMain.on(FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL, async (event, content) => {
  if (content) {
    const responseData = await getrunningorderDetails(
      safeParseformain(content),
    );
    event.reply(
      FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY,
      JSON.stringify(responseData),
    );
  }
});

ipcMain.on(ORDER_IPC.UPDATE_TABLESTATUS, async (event, content) => {
  const responseData = await updateTablestatus(content);
  event.reply(ORDER_IPC.UPDATE_TABLESTATUS_REPLY, responseData);
});

betteripcMain.answerRenderer(
  ORDER_IPC.SAVE_ONLINEBILL_ASYNC,
  async (orderDetails) => {
    const response = await saveOnlinebill(orderDetails);
    return response;
  },
);

ipcMain.on(SAVE_ONLINEBILL, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      const response = await saveOnlinebill(content);
      event.reply(SAVE_ONLINEBILL_REPLY, JSON.stringify(response));
      if (response.tableDetails) {
        event.reply(NEW_TABLEADDED, JSON.stringify(response.tableDetails));
      }
    } catch (error) {
      console.log(error);
    }
  }
});
ipcMain.on(SETTLE_ONLINEBILL, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      await settleOnlinebill(content);
      event.reply(SETTLE_ONLINEBILL_REPLY, JSON.stringify(content));
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(UPDATE_ONLINEORDER_STATUS, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      const responseData = await updateOnlineorderstatus(content);
      event.reply(UPDATE_ONLINEORDER_STATUS_REPLY, responseData);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(SPLIT_TABLE, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      const tableDetails = await connection.Table.create(content.tableDetails);
      event.reply(
        SPLIT_TABLE_REPLY,
        JSON.stringify({
          tableDetails: tableDetails.get({ plain: true }),
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(MERGE_TABLE, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);

      await connection.KOT.update(
        {
          table_id: content.parentTable,
          table_name: content.parentTablename || '',
          sync_status: 0,
        },
        {
          where: {
            table_id: content.currentTable,
            is_active: 1,
          },
        },
      );

      await connection.Table.destroy({
        where: { id: content.currentTable },
      });

      sendLivesyncrequest();
      const responseData = {
        message: 'success',
        table_id: content.currentTable,
      };
      event.reply(MERGE_TABLE_REPLY, responseData);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(UPDATE_ONLINEDELIVERY_BOY, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      await updateonlineDeliveryboy(content);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(ORDER_IPC.RE_ADD_CUSTOMERS, async (event, content) => {
  try {
    const customers = await readdCustomers({
      connection,
      store_id: global.storeDetails.store_id,
    });
    event.reply(ORDER_IPC.RE_ADD_CUSTOMERS_REPLY, JSON.stringify(customers));
    syncCustomersifany({
      connection,
      store_id: global.storeDetails.store_id,
    });
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(ORDER_IPC.SENT_REDUCEINVENTORY_REQUEST, async (event, content) => {
  console.log('send reduce inventory');
  if (content) {
    try {
      content = JSON.parse(content);
      content.connection = connection;
      content.store_id = global.storeDetails.store_id;
      const result = await sendReduceinventoryrequest(content);
      if (result)
        event.reply(
          ORDER_IPC.SENT_REDUCEINVENTORY_REQUEST_REPLY,
          JSON.stringify(result),
        );
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(ORDER_IPC.SENT_REVERSEINVENTORY_REQUEST, async (event, content) => {
  if (content) {
    try {
      content = JSON.parse(content);
      const result = await reverseInventoryrequest(content);
      if (result)
        event.reply(
          ORDER_IPC.SENT_REVERSEINVENTORY_REQUEST_REPLY,
          JSON.stringify(result),
        );
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(ORDER_IPC.SEND_COUPON_HISTORY, async (event, content) => {
  try {
    await sendCouponhistory({
      store_id: global.storeDetails.store_id,
    });
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(ORDER_IPC.GET_ORDER_DETAILS, async (event, content) => {
  let response;
  try {
    content = JSON.parse(content);
    if (content && content.order_id) {
      response = await getOrderdetails(content.order_id);
      response.requestFrom = content.requestFrom;
    }
  } catch (error) {
    console.log(error);
  }
  event.reply(ORDER_IPC.GET_ORDER_DETAILS_REPLY, JSON.stringify(response));
});

ipcMain.on(ORDER_IPC.CHECK_FORSTARTDAY, async (event, content) => {
  try {
    const response = await connection.StartcloseDay.checkforStartday();
    event.reply(ORDER_IPC.CHECK_FORSTARTDAY_REPLY, JSON.stringify(response));
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(ORDER_IPC.CHECK_USERSHIFTSTARTED, async (event, content) => {
  try {
    const response = await connection.UserShift.checkIfshiftstarted(content);
    event.reply(ORDER_IPC.CHECK_USERSHIFTSTARTED_REPLY, response);
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(ORDER_IPC.START_DAY, async (event, content) => {
  try {
    content = JSON.parse(content);
    const response = await connection.StartcloseDay.addStartday(content);
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(CLOSE_DAY, async (event, content) => {
  try {
    content = JSON.parse(content);
    closeDay(content, event);
  } catch (error) {
    console.log(error);
  }
});

betteripcMain.answerRenderer(GET_REPORT_NUMBER, async (params) => {
  const reportNumber = await getReportNumber();
  return reportNumber;
});

ipcMain.on('check-bill-is-running', async (event) => {
  const response = await checkBillIsRunning();
  event.reply('check-bill-is-running-reply', response.length);
});

betteripcMain.answerRenderer(
  ORDER_IPC.CHECK_ORDERID_IS_PRESENT,
  async (params) => {
    const result = await checkOrderIdIsPresent(params.orderId);
    return result;
  },
);

// fetch and update fill number from backoffice
betteripcMain.answerRenderer(UPDATE_BILL_NUMBER, async (params) => {
  const result = await updateBillNumber(params);
  return result;
});

// check if bill is printed or not
betteripcMain.answerRenderer(CHECK_BILL_PRINTED, async (params) => {
  const result = await checkBillIsPrinted(params);
  return result;
});

// update print count
betteripcMain.answerRenderer(UPDATE_PRINT_STATUS_OF_ORDER, async (params) => {
  const result = await updatePrintCountOfOrder(params);
  return result;
});

betteripcMain.answerRenderer(GET_RUNNING_ORDER_ITEMS, async (params) => {
  const responseData = await getrunningorderDetails(JSON.parse(params));
  return responseData;
});

// update item details
betteripcMain.answerRenderer(UPDATE_ITEM_DETAILS_LOCALLY, async (params) => {
  const responseData = await updateItemDetails(params);
  return responseData;
});

// Add new item
betteripcMain.answerRenderer(ADD_ITEM_LOCALLY, async (params) => {
  const responseData = await addNewItemLocally(params);
  return responseData;
});

// Add new category
betteripcMain.answerRenderer(ADD_CATEGORY_LOCALLY, async (params) => {
  const responseData = await addNewCategoryLocally(params);
  return responseData;
});

// Add new category
betteripcMain.answerRenderer(
  ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL,
  async (params) => {
    const responseData = await addNewCategoryLocallyWithoutAccessLevel(params);
    return responseData;
  },
);

// add new kitchen dept
betteripcMain.answerRenderer(ADD_KITCHEN_DEPT_LOCALLY, async (params) => {
  const responseData = await addNewKitchenDeptLocally(params);
  return responseData;
});

// update category status
betteripcMain.answerRenderer(UPDATE_CATEGORY_STATUS, async (params) => {
  const responseData = await updateCategoryStatusLocally(params);
  return responseData;
});

async function closeDay(content, event) {
  try {
    const response = await connection.StartcloseDay.updateCloseday(content);
    await setStartdayotherdetails(
      content.id,
      content?.closedayInfo?.current_closing_balance,
      response,
      content?.closedayInfo?.countMidnightSale,
      content?.closedayInfo?.nextDayOpeningAmount,
    );
    const startendDaydetails = await connection.StartcloseDay.findAll({
      raw: true,
      where: {
        id: content.id,
      },
    });
    const isTimebetweenMidnightSale = checkIfTimeForMidnightReport();
    Object.assign(response, {
      insertedstartenddayId: content.id,
      startendDaydetails,
      isTimebetweenMidnightSale,
    });

    event.reply(CLOSE_DAY_REPLY, response);
    syncStartenddaydata(connection, {
      store_id: global.storeDetails.store_id,
      tmpos_id: global.storeDetails.tmpos_id,
    });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Updates the delivery boy data
 * @param {Update data} params
 */
async function updateonlineDeliveryboy(params) {
  try {
    const updateData = {};
    if (params.delivery_boy_name) {
      Object.assign(updateData, {
        delivery_boy_name: params.delivery_boy_name,
        delivery_boy_phone: params.delivery_boy_mobile,
        sync_status: 0,
      });
    }
    if (params.rbt_temprature) {
      Object.assign(updateData, { rbt_temprature: params.rbt_temprature });
    }
    await connection.Bill.update(updateData, {
      where: {
        order_id: params.order_id,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function settleOnlinebill(details) {
  if (details) {
    const billupdateData = {
      order_state: OrderState.FULFILLED,
      sync_status: 0,
    };
    await connection.Bill.update(billupdateData, {
      where: { table_name: details.table_name },
    });
    await connection.Table.destroy({
      where: { id: details.id },
    });
  }
}

async function updateOnlineorderstatus(params) {
  const responseData = {};
  if (params && params.new_status && params.order_id) {
    let order_state = OrderState.FULFILLED;
    if (
      String(params.new_status).toLowerCase() ===
      String(OrderState.CANCELLED).toLowerCase()
    ) {
      order_state = OrderState.CANCELLED;
    }
    const billupdateData = {
      order_state,
      sync_status: 0,
    };
    await connection.Bill.update(billupdateData, {
      where: { order_id: params.order_id },
    });

    const result = await connection.Bill.findOne({
      where: { order_id: params.order_id },
      limit: 1,
      raw: true,
      attributes: ['table_name'],
    });
    if (result && result.table_name) {
      await connection.Table.destroy({
        where: {
          table_name: result.table_name,
        },
      });
      responseData.table_name = result.table_name;
      responseData.order_state = order_state;
    }
    responseData.order_id = params.order_id;
  }
  return responseData;
}

/**
 * Save the pullled online order
 * @param {current bill details} details
 */
async function saveOnlinebill(details) {
  const response = {
    createTablefororder: details.createTablefororder,
    silentPull: details.silentPull,
  };
  let StoreID;
  let OrderID;
  try {
    // Check the mapping for the store id
    const mappingResult = await connection.StoreMapper.findAll({
      raw: true,
      limit: 1,
      attributes: ['tmpos_store_id'],
      where: {
        tmchannel_store_id: details.merchant_ref_id,
      },
    });
    // Check if result exist
    if (mappingResult.length > 0) {
      const { billDetails } = details;
      const { items } = details;
      const { charges } = details;
      const { paymentDetails } = details;
      details.store_id = mappingResult[0].tmpos_store_id;
      billDetails.store_id = mappingResult[0].tmpos_store_id;

      OrderID = billDetails.order_id;
      StoreID = billDetails.store_id;
      // Get the user of that store
      const getstoreUser = await connection.Store.findAll({
        raw: true,
        limit: 1,
        attributes: ['username'],
        where: {
          store_id: billDetails.store_id,
        },
      });

      if (getstoreUser && getstoreUser.length > 0) {
        billDetails.user_id = getstoreUser[0].username;
      }
      const billing_type = getBillingflag(details.channel);
      billDetails.billing_type = billing_type;
      billDetails.order_kotflag = 2; // Set order as placed

      Object.assign(response, {
        order_id: billDetails.order_id,
        order_ref_id: details.order_ref_id,
      });
      // find and add previous order id in extra_details
      const prevOrder_id = await connection.Bill.findOne({
        raw: true,
        attributes: ['order_id'],
        order: [['id', 'DESC']],
        where: {
          store_id: global.storeDetails.store_id,
        },
      });

      if (!billDetails.extra_details) {
        const extra_details = {};
        Object.assign(billDetails, { extra_details });
      }
      if (prevOrder_id) {
        Object.assign(billDetails.extra_details, {
          previous_order_id: prevOrder_id.order_id,
        });
      }
      const isbillSaved = await connection.Bill.findOne({
        where: {
          order_id: billDetails.order_id,
        },
      });
      if (isbillSaved) {
        console.log(
          `Message="Updating online order" OrderID=${billDetails.order_id} StoreID=${billDetails.store_id} `,
        );
        const updateOrderdata = {
          order_state: billDetails.order_state,
          sync_status: 0,
        };
        if (billDetails.order_state !== isbillSaved.order_state) {
          Object.assign(updateOrderdata, {
            order_state: billDetails.order_state,
            sync_status: 0,
          });
        }
        await connection.Bill.update(updateOrderdata, {
          where: {
            order_id: billDetails.order_id,
          },
        });
        response.status = 'success';
        response.msg = 'Order status updated';
        return response;
      }
      Object.assign(billDetails, {
        order_state: OrderState.PENDING,
        sync_status: 0,
        bill_prefix_for: BILL_PREFIX_FOR.ONLINE_ORDERS_BILLING,
      });
      console.log(
        `Message="Pulling online order" OrderID=${billDetails.order_id} StoreID=${billDetails.store_id} `,
      );
      const billResult = await connection.Bill.create(billDetails);
      if (billResult != undefined && billResult.id != 0) {
        if (paymentDetails && paymentDetails.length > 0) {
          await connection.BillPayment.destroy({
            where: {
              order_id: billDetails.order_id,
            },
          });
          await connection.BillPayment.bulkCreate(paymentDetails);
        }
        let tableDetails = {
          table_name: billDetails.table_name,
          isactive: 1,
          department: details.defaultDepartmentid,
          order_type_flag: 4, // Online Order
          store_id: billDetails.store_id,
          order_state: OFFLINE_ORDERSTATES.PLACED,
          table_color: TableUtils.Colors.BILL_SAVED,
        };
        if (details.createTablefororder) {
          const resultEntity = await connection.Table.create(tableDetails);
          if (resultEntity) {
            tableDetails = resultEntity.get({ plain: true });
            response.tableDetails = tableDetails;
          }
        }
        let quantity = billDetails.quantity ? billDetails.quantity : 0;
        for (curretItem of items) {
          curretItem.bill_id = billResult.id;
          // curretItem.title = curretItem.baseTitle;
          // Get the item product group kitchen dep
          const itemdetails = await connection.Item.findOne({
            raw: true,
            where: {
              title: {
                [connection.Sequelize.Op.like]: `%${String(
                  curretItem.baseTitle,
                ).trim()}%`,
              },
              // title: curretItem.baseTitle,
              store_id: billDetails.store_id,
            },
          });
          if (itemdetails) {
            const productGroupsdetails = await connection.ProductGroup.findOne({
              raw: true,
              where: {
                product_group_id: itemdetails.product_group,
                store_id: billDetails.store_id,
              },
            });
            Object.assign(curretItem, {
              item_id: itemdetails.item_refid,
              kitchen_dept: itemdetails.kitchen_dept,
              product_group_id: itemdetails.product_group,
              product_group_name:
                (productGroupsdetails &&
                  productGroupsdetails.product_group_name) ||
                '',
              hsn_code: curretItem.hsn_code || '',
            });
          }
          const billitemresult = await connection.BillItem.create(curretItem);
          // Check addons
          if (
            itemdetails &&
            itemdetails.option_group_ref_id &&
            billitemresult &&
            curretItem.addons &&
            curretItem.addons.length
          ) {
            for (const addon of curretItem.addons) {
              const optionDetails = await connection.Options.findOne({
                raw: true,
                where: {
                  item_ref_id: itemdetails.item_refid,
                  store_id: billDetails.store_id,
                },
              });
              const opt_grp_ref_id =
                optionDetails.opt_grp_ref_ids &&
                optionDetails.opt_grp_ref_ids.substring(
                  0,
                  optionDetails.opt_grp_ref_ids.indexOf(','),
                );

              const opt_group_name = await connection.OptionGroup.findOne({
                raw: true,
                attributes: ['title'],
                where: {
                  ref_id: opt_grp_ref_id,
                },
              });

              if (optionDetails) {
                // let optiongroupidlist = String(optionDetails.opt_grp_ref_ids).split(',');
                // const optiongroupDetails = await connection.OptionGroup.findOne({
                //     raw: true,
                //     where: {
                //         ref_id: {
                //             [connection.Sequelize.Op.in]: optiongroupidlist,
                //         },
                //     }
                // });

                await connection.BillItemOption.create({
                  order_id: billDetails.order_id,
                  order_item_id: billitemresult.id,
                  option_group_ref_id: optionDetails.opt_grp_ref_ids,
                  option_ref_id: optionDetails.ref_id,
                  option_group_name: opt_group_name?.title,
                  title: addon.title,
                  qty: 1,
                  price: addon.price,
                  total: addon.price,
                  total_with_tax: addon.price,
                  // tax_value: addon.option_tax_amount,
                  type: 1,
                  item_ref_id: itemdetails.item_refid,
                  // tax_name: item.item_tax_name,
                  // is_devidable: item.item_is_devidable,
                  option_id: optionDetails.id,
                  // tax_per: item.item_tax_per
                });
              }
            }
          }

          if (curretItem.charges && curretItem.charges.length) {
            for (const itemCharge of curretItem.charges) {
              const hasTaxes = itemCharge.taxes && itemCharge.taxes.length;
              let tax_title = '';
              if (hasTaxes) {
                tax_title = itemCharge.taxes[0].title;
              }
              await connection.Orderchildcharges.create({
                order_id: billDetails.order_id,
                order_item_id: billitemresult.id,
                charge_title: itemCharge.title,
                per_fixed: CHARGE_TYPES.FIXED,
                calculated_charge: itemCharge.value,
                calculated_tax: 0,
                charge_amount: itemCharge.value,
                calculate_tax_for_item_charges: 0,
                tax_title,
                tax_divided: hasTaxes ? 1 : 0,
              });
            }
          }
        }
        if (quantity === 0) {
          quantity = items.length;
        }

        if (charges && charges.length > 0) {
          for (charge of charges) {
            await connection.BillCharges.create(charge);
          }
        }

        let insertedBillno = billResult.id;
        // check for seperate bill numbers for online orders
        if (details.seperateBillNumber) {
          nextBill = await getResettedOnlinebill({ forKot: false });
        } else {
          nextBill = await getResettedbillkotifexist({ forKot: false });
        }
        // let nextOrderNumber = await getResettedordernumberifexist();
        // const nextBill = await getResettedbillkotifexist({ forKot: false });
        if (nextBill) insertedBillno = nextBill;
        let padBillNumber = insertedBillno;
        if (padBillNumber && bill_number_length) {
          padBillNumber = pad(insertedBillno, bill_number_length);
        }

        const billnumberUpdatedata = {
          bill_number: insertedBillno,
          quantity,
          sync_status: 0,
        };
        // if(nextOrderNumber && billDetails && billDetails.extra_details){
        //     Object.assign(billDetails.extra_details, {order_number: nextOrderNumber});
        //     Object.assign(billnumberUpdatedata, {extra_details: billDetails.extra_details});
        // }
        // if (global.storeDetails.bill_number_prefix) {
        //     let custom_bill_number = `${ global.storeDetails.bill_number_prefix }${ insertedBillno } `
        //     Object.assign(billnumberUpdatedata, {
        //         custom_bill_number
        //     });
        // }

        if (
          details.seperateBillNumber &&
          global.storeDetails.secondary_bill_prefix
        ) {
          const custom_bill_number = `${global.storeDetails.secondary_bill_prefix}${padBillNumber} `;
          Object.assign(billnumberUpdatedata, {
            custom_bill_number,
          });
        } else if (global.storeDetails.bill_number_prefix) {
          const custom_bill_number = `${global.storeDetails.bill_number_prefix}${padBillNumber} `;
          Object.assign(billnumberUpdatedata, {
            custom_bill_number,
          });
        }
        Object.assign(billnumberUpdatedata, {
          order_state: OrderState.FULFILLED,
        });

        // check for midnight sale

        if (billDetails.countMidnightSale) {
          const result = setDateForMidnightOrder();
          if (result) {
            const { orderDate, created_time } = result;
            Object.assign(billnumberUpdatedata, {
              my_order_date: orderDate,
              created_time,
            });
          }
        }

        await connection.Bill.update(billnumberUpdatedata, {
          where: {
            id: billResult.id,
          },
        });
        if (details.seperateBillNumber) {
          await connection.Tempnumbers.increment(['secondary_bill_number'], {
            by: 1,
            where: { id: 1 },
          });
        } else {
          await connection.Tempnumbers.increment(['bill_number'], {
            by: 1,
            where: { id: 1 },
          });
        }

        response.status = 'success';
        response.msg = 'Order Pulled';
        response.addnewCustomer = details.addnewCustomer;
        if (details.addnewCustomer && details.customer) {
          response.customer = details.customer;
        }
      } else {
        response.status = 'error';
        console.error(
          `Message="Error occured while saving online order" OrderID=${billDetails.order_id} StoreID=${billDetails.store_id} `,
        );
      }
    } else {
      response.status = 'error';
      response.msg = 'No store mapping found.Please contact TMBill team.';
    }
  } catch (error) {
    console.error(error);
    console.error(
      `Message="Pulling online order failed" OrderID=${OrderID} StoreID=${StoreID} `,
    );
    response.error = error;
  }
  return response;
}

function getBillingflag(type) {
  let billingType = 0;
  if (type) {
    BillingTypes.forEach((element, index) => {
      if (String(element).toLowerCase() === String(type).toLowerCase()) {
        billingType = index;
      }
    });
  }
  return billingType;
}

ipcMain.on(SEND_SHOW_SENT_REPORT_NOTIFICATION, (event, data) => {
  global.mainWindow.webContents.send(SHOW_SENT_REPORT_NOTIFICATION, {
    data,
  });
});

ipcMain.on('add-notification-in-database', async (event, data) => {
  await addWaiterNotificationToDatabase(data);
});

ipcMain.on('fetch-date-from-backend', async (event, data) => {
  await fetchDateFromBackend();
});

betteripcMain.answerRenderer('get-waiter-notifications', async (data) => {
  const response = await getWaiterNotification(data);
  return response;
});

betteripcMain.answerRenderer('close-running-notification', async (data) => {
  const response = await closeRunningNotification(data);
  return response;
});

ipcMain.on('call-update-stock-event', async (event, data) => {
  global.ipcEventEmitter.emit(UPDATE_STOCK_QTY, data);
});

// start category cron job
// ipcMain.on(START_CATEGORY_SHOW_CRON_JOB, (event, data) => {
//   startCategoryTimeJob(data);
// });

global.initializeMainIpcListenersFromRemote = initializeListeners;
module.exports = {
  initializeListeners,
  setBillnumberlengthformain,
  settleOnlinebill,
  checkDayisstarted,
  checkDayisstartedForExitHandler,
};
