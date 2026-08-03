/* eslint-disable no-param-reassign */
const { ipcMain } = require('electron');
const forEach = require('lodash/forEach');
const {
  ORDER,
  PRINT,
  KDS,
  EVENT_FLAGS,
  GLOBAL_EVENT,
} = require('./SocketEvents');
const {
  sendKOTPrintrequest,
  sendbillPrintrequest,
  kotitemstatusChanged,
  newkotHasbeenplaced,
  captainMessagereceived,
  oldkotcancelled,
  kotitemTransferred,
  newbillhasbeenSaved,
  newbillhasbeenSettled,
  newkotHasbeenUpdated,
  newbillhasbeenSavedAndPrint,
  chargesupdatedonTable,
  closeNotificationView,
  handleTableSplitted,
  handleTableMerged,
  handleTableChanged,
  handleTableClicked,
  handleKotUpdatedRequest,
  sendQuickBillPrintRequest,
  sendSettledbillPrintrequest,
  handleRefreshTable,
  handleOrderUpdatedFromOrderSettlementwindow,
  handleUpdateTableDetails,
  handleCustomerUpdated,
  acceptRemoteKot,
} = require('../main_controllers/SocketrequestListeners');

const {
  PAYMENT_RECEIVED,
  REFRESH_TABLES_EVENT,
  GET_ORDER_TOTAL,
  SEND_ORDER_TOTAL,
  CLOSE_NOTIFICATION_VIEW,
  ASSISTANCE_REQUESTED,
  SEND_BACKGROUND_SETTLEMENT_REQUEST,
  UPDATE_STOCK_QTY,
  LOGOUT_USER,
  SOCKET_EVENT_EMITTER,
  REMOTE_KOT_PLACED,
  SET_STOREDETAILS,
} = require('../util/IPC_Messages');
const { safeParseformain } = require('../main_controllers/Utils');
const { sleep } = require('../util/MiscUtil');

const stringConstructor = 'test'.constructor;
let io;

const connectedClientslist = [];
const socketsConnections = {};

/**
 * Called on client disconnects
 */
function onDisconnect(reason, client) {
  client.disconnect(true);
  client.removeAllListeners();
  connectedClientslist.splice(connectedClientslist.indexOf(client), 1);
  delete socketsConnections[client.id];
  const { userData } = client;
  console.log(`diconnected ${userData.username}- ${client.id}`);
  console.log(
    `--- connected users count:${Object.values(socketsConnections).length} ---`,
  );
}

function garbageCollectconnection() {
  forEach(socketsConnections, (connection) => {
    if (!connection.connected) {
      connection.close();
    }
  });
}

function onConnect(client) {
  connectedClientslist.push(client);
  const { userData } = client;
  console.log(`new connection from ${userData.username} - ${client.id}`);
  Object.assign(socketsConnections, {
    [client.id]: client,
  });
  console.log(
    `connected users count:${Object.values(socketsConnections).length}`,
  );

  client.on('disconnect', (reason) => {
    onDisconnect(reason, client);
  });

  client.on('error', (err) => {
    console.error('Socket error added for epipe:', err);
  });

  client.on(PRINT.KOT, async (data) => {
    // console.log('PRINT.KOT::', data);
    if (data) {
      const kotData = safeParseformain(data);
      console.log('kot print socket event::', kotData.kot_number);
    }
    sendKOTPrintrequest(data);
  });

  client.on(PRINT.BILL, async (data) => {
    data = safeParseformain(data);
    if (data.forQuickbill && data.printContent) {
      sendQuickBillPrintRequest(data);
    } else {
      if (data.sendImageToCSK || data.printBillOnBothSide) {
        Object.assign(data, {
          socketUserId: client.id,
        });
      }
      sendbillPrintrequest(data);
    }
  });

  client.on(PRINT.PRINT_SETTELED_BILL, async (data) => {
    data = safeParseformain(data);
    sendSettledbillPrintrequest(data);
  });

  client.on(ORDER.DRAFT_BILL_PRINTED, async (data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { is_Draft_bill: true });
    } else {
      Object.assign(data, { is_Draft_bill: true });
    }
    if (data.isTerminalPrint) {
      Object.assign(data, { doNotPrintBill: true });
    }
    sendbillPrintrequest(data);
  });

  client.on(ORDER.KOT_SAVED, async (data) => {
    client.broadcast.emit(ORDER.KOT_SAVED, data);
    newkotHasbeenplaced(data);
  });

  client.on(ORDER.KOT_UPDATED, async (data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.KOT_UPDATED });
      data = JSON.stringify(data);
    }
    handleKotUpdatedRequest(data);
    client.broadcast.emit(ORDER.KOT_UPDATED, data);
  });

  client.on(ORDER.BILL_SAVED, async (data) => {
    client.broadcast.emit(ORDER.BILL_SAVED, data);
    newbillhasbeenSaved(data);
  });

  client.on(ORDER.SAVE_AND_PRINT_BILL, async (data) => {
    // client.broadcast.emit(ORDER.BILL_SETTLED, data);
    console.log(
      `Message="ORDER.SAVE_AND_PRINT_BILL" data=${JSON.stringify(data)}`,
    );
    data = safeParseformain(data);

    if (data && (data.sendImageToCSK || data.printBillOnBothSide)) {
      Object.assign(data, {
        socketUserId: client.id,
      });
    }
    newbillhasbeenSavedAndPrint(data);
  });

  client.on(ORDER.BILL_SETTLED, async (data) => {
    client.broadcast.emit(ORDER.BILL_SETTLED, data);
    newbillhasbeenSettled(data);
  });

  client.on(ORDER.MESSAGE, async (data) => {
    data.username = client.userData.username;
    captainMessagereceived(data);
  });

  client.on(KDS.ITEM_STATUS_CHANGED, async (data) => {
    client.broadcast.emit(KDS.ITEM_STATUS_CHANGED, data);
    kotitemstatusChanged(data);
  });

  client.on(KDS.KOT_UPDATED, async (data) => {
    client.broadcast.emit(KDS.KOT_UPDATED, data);
    newkotHasbeenUpdated(data);
  });
  client.on(KDS.KOT_STATUS_UPDATES, async (data) => {
    client.broadcast.emit(KDS.KOT_STATUS_UPDATES, data);
  });

  client.on(KDS.SETTLE_ALL_KOT, async (data) => {
    client.broadcast.emit(KDS.SETTLE_ALL_KOT, data);
  });

  client.on(GLOBAL_EVENT.SEND_NOTIFICATION, async (data) => {
    client.broadcast.emit(GLOBAL_EVENT.SEND_NOTIFICATION, data);
  });

  // Old KOT events
  client.on(ORDER.KOT_CANCELLED, async (data) => {
    client.broadcast.emit(ORDER.KOT_CANCELLED, data);
    oldkotcancelled(data);
  });
  client.on(ORDER.KOTITEM_TRANSFERRED, async (data) => {
    client.broadcast.emit(ORDER.KOTITEM_TRANSFERRED, data);
    kotitemTransferred(data);
  });

  client.on(ORDER.CHARGES_UPDATED, async (data) => {
    client.broadcast.emit(ORDER.CHARGES_UPDATED, data);
    chargesupdatedonTable(data);
  });

  client.on(ORDER.TABLE_SPLITTED, async (data) => {
    client.broadcast.emit(ORDER.TABLE_SPLITTED, data);
    handleTableSplitted(data);
  });

  client.on(ORDER.TABLE_MERGED, async (data) => {
    client.broadcast.emit(ORDER.TABLE_MERGED, data);
    handleTableMerged(data);
  });

  client.on(ORDER.TABLE_CHANGED, async (data) => {
    client.broadcast.emit(ORDER.TABLE_CHANGED, data);
    handleTableChanged(data);
  });

  client.on(ORDER.TABLE_CLICKED, async (data) => {
    client.broadcast.emit(ORDER.TABLE_CLICKED, data);
    handleTableClicked(data);
  });

  client.on(ORDER.UPDATE_TABLE_DETAILS, async (data) => {
    client.broadcast.emit(ORDER.UPDATE_TABLE_DETAILS, data);
    handleUpdateTableDetails(data);
  });

  client.on(ORDER.REFRESH_TABLES, async (data) => {
    client.broadcast.emit(ORDER.REFRESH_TABLES, data);
    handleRefreshTable(data);
  });
  client.on(GLOBAL_EVENT.CUSTOMER_UPDATED, async (data) => {
    client.broadcast.emit(GLOBAL_EVENT.CUSTOMER_UPDATED, data);
    handleCustomerUpdated(data);
  });

  client.on(ORDER.BACKGROUND_BILL_SETTLEMENT, async (data) => {
    global.mainWindow.webContents.send(
      SEND_BACKGROUND_SETTLEMENT_REQUEST,
      data,
    );
  });

  client.on(ORDER.KOT_TOTAL, async (data) => {
    global.mainWindow.webContents.send(GET_ORDER_TOTAL, data);
  });

  client.on(ORDER.UPDATE_TABLE_COLOR, async (data) => {
    client.broadcast.emit(ORDER.UPDATE_TABLE_COLOR, data);
    global.mainWindow.webContents.send(ORDER.UPDATE_TABLE_COLOR, data);
  });

  client.on(GLOBAL_EVENT.UPDATE_STOCK, async (data) => {
    client.broadcast.emit(GLOBAL_EVENT.UPDATE_STOCK, data);
    global.mainWindow.webContents.send(UPDATE_STOCK_QTY, data);
  });

  client.on(ORDER.CLOSE_NOTIFICATION_VIEW, async (data) => {
    client.broadcast.emit(ORDER.CLOSE_NOTIFICATION_VIEW, data);
    closeNotificationView(data);
  });

  client.on(ORDER.ACCEPT_REMOTE_KOT, async (data) => {
    acceptRemoteKot(data);
  });

  client.on(ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW, async (data) => {
    client.broadcast.emit(ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW, data);
    handleOrderUpdatedFromOrderSettlementwindow(data);
  });

  garbageCollectconnection(client);
}

function initialize(currentIO) {
  io = currentIO;
  io.on('connection', onConnect);
  console.log(`Socket connection is listening..`);
}
try {
  ipcMain.on(ORDER.BILL_SAVED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.BILL_SAVED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.BILL_SAVED, data);
  });

  ipcMain.on(GLOBAL_EVENT.MENU_UPDATED, async (_event, data) => {
    try {
      console.log('pos-menu-updated');
      io.emit(GLOBAL_EVENT.POS_MENU_UPDATED, data);
    } catch (error) {
      console.log(
        'Message=Error while calling menu updated socket event',
        error,
      );
    }
  });

  ipcMain.on(GLOBAL_EVENT.POS_SETTINGS_UPDATED, async () => {
    io.emit(GLOBAL_EVENT.POS_SETTINGS_UPDATED, {});
  });

  ipcMain.on(ORDER.KOT_SAVED, async (_event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.KOT_SAVED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.KOT_SAVED, data);
  });

  ipcMain.on(ORDER.KOT_UPDATED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.KOT_UPDATED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.KOT_UPDATED, data);
  });

  ipcMain.on(ORDER.KOTITEM_TRANSFERRED, async (event, data) => {
    io.emit(ORDER.KOTITEM_TRANSFERRED, data);
  });

  ipcMain.on(ORDER.BILL_SETTLED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.BILL_SETTLED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.BILL_SETTLED, data);
  });

  ipcMain.on(PRINT.KOT_PRINTED, async (event, data) => {
    io.emit(PRINT.KOT_PRINTED, data);
  });

  ipcMain.on(KDS.ITEM_STATUS_CHANGED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.ITEM_STATUS_CHANGED });
      data = JSON.stringify(data);
    }
    io.emit(KDS.ITEM_STATUS_CHANGED, data);
  });

  ipcMain.on(ORDER.CHARGES_UPDATED, async (event, data) => {
    io.emit(ORDER.CHARGES_UPDATED, data);
  });

  ipcMain.on(CLOSE_NOTIFICATION_VIEW, async (event, data) => {
    io.emit(ORDER.CLOSE_NOTIFICATION_VIEW, data);
  });

  ipcMain.on(ORDER.TABLE_CLICKED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.TABLE_CLICKED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.TABLE_CLICKED, data);
  });

  ipcMain.on(ORDER.UPDATE_TABLE_DETAILS, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.UPDATE_TABLE_DETAILS });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.UPDATE_TABLE_DETAILS, data);
  });

  ipcMain.on(ORDER.QUICK_BILL_PLACED, async (event, data) => {
    io.emit(ORDER.QUICK_BILL_PLACED, data);
  });

  ipcMain.on(ORDER.TABLE_SPLITTED, async (event, data) => {
    io.emit(ORDER.TABLE_SPLITTED, data);
  });

  ipcMain.on(ORDER.TABLE_MERGED, async (event, data) => {
    io.emit(ORDER.TABLE_MERGED, data);
  });

  ipcMain.on(ORDER.TABLE_CHANGED, async (event, data) => {
    io.emit(ORDER.TABLE_CHANGED, data);
  });

  ipcMain.on(PAYMENT_RECEIVED, async (event, data) => {
    io.emit(ORDER.PAYMENT_RECEIVED, data);
  });

  ipcMain.on(ASSISTANCE_REQUESTED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.ASSISTANCE_REQUIRED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.ASSISTANCE_REQUIRED, data);
  });

  ipcMain.on(REMOTE_KOT_PLACED, async (event, data) => {
    console.log('REMOTE_KOT_PLACED::', data);
    io.emit(ORDER.REMOTE_KOT_PLACED, data);
  });

  ipcMain.on(REFRESH_TABLES_EVENT, async (event, data) => {
    io.emit(ORDER.REFRESH_TABLES, data);
  });

  ipcMain.on(GLOBAL_EVENT.SEND_NOTIFICATION, async (event, data) => {
    io.emit(GLOBAL_EVENT.SEND_NOTIFICATION, data);
  });

  ipcMain.on(ORDER.UPDATE_TABLE_COLOR, async (event, data) => {
    io.emit(ORDER.UPDATE_TABLE_COLOR, data);
  });

  ipcMain.on(SEND_ORDER_TOTAL, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.SEND_ORDER_TOTAL });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.SEND_ORDER_TOTAL, data);
  });

  ipcMain.on(ORDER.DRAFT_BILL_PRINTED, async (event, data) => {
    if (data && data.constructor === stringConstructor) {
      data = JSON.parse(data);
      Object.assign(data, { flag: EVENT_FLAGS.DRAFT_BILL_PRINTED });
      data = JSON.stringify(data);
    }
    io.emit(ORDER.DRAFT_BILL_PRINTED, data);
  });

  ipcMain.on(GLOBAL_EVENT.CUSTOMER_UPDATED, async (event, data) => {
    io.emit(GLOBAL_EVENT.CUSTOMER_UPDATED, data);
  });

  global.ipcEventEmitter.on(UPDATE_STOCK_QTY, async (data) => {
    global.mainWindow.webContents.send(UPDATE_STOCK_QTY, data);
    io.emit(GLOBAL_EVENT.UPDATE_STOCK, data);
  });

  ipcMain.on(LOGOUT_USER, async (event, data) => {
    io.emit(GLOBAL_EVENT.LOGOUT_USER, data);
  });

  ipcMain.on(ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW, async (event, data) => {
    io.emit(ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW, data);
  });

  ipcMain.on('bill-print-link-to-csk', async (event, data) => {
    io.to(data.socketUserId).emit('bill-print-url', data);
  });
} catch (error) {
  console.error('error while emmiting events', error);
}

// emit events that are placed through rest API's
// io.emit(ORDER.KOT_SAVED, data);

global.ipcEventEmitter.on(SOCKET_EVENT_EMITTER, async (data) => {
  const EVENT_NAME = data.event_name;
  delete data.event_name;
  io.emit(EVENT_NAME, data);
});

ipcMain.on(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, async (event, data) => {
  io.emit(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, data);
});

global.ipcEventEmitter.on(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, async (data) => {
  io.emit(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, data);
});

global.ipcEventEmitter.on(SET_STOREDETAILS, async (data) => {
  io.emit(SET_STOREDETAILS, data);
});
module.exports = initialize;
