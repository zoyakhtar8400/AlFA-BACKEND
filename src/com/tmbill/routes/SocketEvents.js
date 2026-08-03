/* eslint-disable no-case-declarations */
const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const { ORDER, PRINT, KDS, EVENT_FLAGS } = require('../server/SocketEvents');
const {
  newbillhasbeenSavedAndPrint,
  sendSettledbillPrintrequest,
  newkotHasbeenplaced,
  sendKOTPrintrequest,
  sendbillPrintrequest,
  sendQuickBillPrintRequest,
  kotitemTransferred,
  oldkotcancelled,
  handleKotUpdatedRequest,
  newkotHasbeenUpdated,
  handleTableChanged,
  handleTableMerged,
  handleUpdateTableDetails,
  captainMessagereceived,
  handleTableSplitted,
} = require('../main_controllers/SocketrequestListeners');
const {
  getRunningOrderDataForOrderHub,
} = require('../main/services/SocketEvents.service');
const {
  FETCH_BILL_DATA_FOR_CSK_REPLY,
  SOCKET_EVENT_EMITTER,
} = require('../util/IPC_Messages');
const router = express.Router();

router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.body) {
    console.log('req.body', req.body);
    try {
      const data = req.body;
      if (data && data.event_name) {
        switch (data.event_name) {
          case ORDER.SAVE_AND_PRINT_BILL:
            const result = await getRunningOrderDataForOrderHub(data);

            // await global.betteripcMain.callFocusedRenderer(
            //   FETCH_BILL_DATA_FOR_CSK_REPLY,
            //   result,
            // );
            global.mainWindow.webContents.send(
              FETCH_BILL_DATA_FOR_CSK_REPLY,
              result,
            );

            break;

          case ORDER.KOT_SAVED:
            newkotHasbeenplaced(data);
            Object.assign(data, {
              event_name: ORDER.KOT_SAVED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case PRINT.KOT:
            sendKOTPrintrequest(data);

            break;

          case PRINT.BILL:
            if (data.forQuickbill && data.printContent) {
              sendQuickBillPrintRequest(data);
            } else {
              sendbillPrintrequest(data);
            }
            break;

          case ORDER.KOTITEM_TRANSFERRED:
            kotitemTransferred(data);
            Object.assign(data, {
              event_name: ORDER.KOTITEM_TRANSFERRED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case ORDER.KOT_CANCELLED:
            oldkotcancelled(data);
            Object.assign(data, {
              event_name: ORDER.KOTITEM_TRANSFERRED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case KDS.KOT_UPDATED:
            newkotHasbeenUpdated(data);
            break;

          case ORDER.KOT_UPDATED:
            handleKotUpdatedRequest(data);
            Object.assign(data, {
              event_name: ORDER.KOTITEM_TRANSFERRED,
              flag: EVENT_FLAGS.KOT_UPDATED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case PRINT.PRINT_SETTELED_BILL:
            sendSettledbillPrintrequest(data);
            break;

          case ORDER.BACKGROUND_BILL_SETTLEMENT:
            const settlementData = await getRunningOrderDataForOrderHub(data);

            await global.betteripcMain.callFocusedRenderer(
              FETCH_BILL_DATA_FOR_CSK_REPLY,
              settlementData,
            );
            break;

          case ORDER.TABLE_CHANGED:
            handleTableChanged(data);
            Object.assign(data, {
              event_name: ORDER.TABLE_CHANGED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case ORDER.TABLE_MERGED:
            handleTableMerged(data);
            Object.assign(data, {
              event_name: ORDER.TABLE_MERGED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case ORDER.TABLE_SPLITTED:
            handleTableSplitted(data);
            Object.assign(data, {
              event_name: ORDER.TABLE_SPLITTED,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case ORDER.UPDATE_TABLE_DETAILS:
            handleUpdateTableDetails(data);
            Object.assign(data, {
              event_name: ORDER.UPDATE_TABLE_DETAILS,
            });
            global.ipcEventEmitter.emit(SOCKET_EVENT_EMITTER, data);
            break;

          case ORDER.MESSAGE:
            captainMessagereceived(data);
            break;

          default:
            break;
        }
      }
      response.setStatus(200);
    } catch (error) {
      console.log('something went wrong');
      response.setStatus(400);
      response.setMessage('Something went wrong');
    }
  }
  console.log('response::', response);
  res.json(response);
});

module.exports = router;
