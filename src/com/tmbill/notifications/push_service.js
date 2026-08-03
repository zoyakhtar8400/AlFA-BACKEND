/* eslint-disable camelcase */
const { ipcRenderer } = require('electron');
const { find } = require('lodash');
const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require('../packages/electron-push-receiver-v2/constant');
const {
  getNotificationsoundnames,
  MUTE_NOTIFICATION,
  AUTO_ACCEPT_REMOTE_KOT,
  AUTO_SETTLE_BILL_ON_ONLINE_PAYENT,
  PAYMENT_SOUND_ALERT,
  ONLINE_CANCEL_KOT_PRINT,
} = require('../util/SettingIDs');
const {
  SERVER_MESSAGE_RECEIVED,
  UPDATE_ONLINEORDER_STATUS,
  SWITCH_STORE,
  ONLINEORDER_IPC,
  REMOTE_FORCE_LOGUT,
  LOAD_PAYMENT_MODES_REQUEST_FROM_SERVER,
  LOAD_USERS_REQUEST_FROM_SERVER,
  LOAD_ACCESS_LEVEL_REQUEST_FROM_SERVER,
  LOAD_SETTING_REQUEST_FROM_SERVER,
  PAYMENT_RECEIVED,
  CLOSE_NOTIFICATION_VIEW,
  RETRY_PULL_ONLINE_ORDER,
  ASSISTANCE_REQUESTED,
  FETCH_BILL_DATA_FOR_CSK,
  GET_TABLE_ID,
  UPDATE_TIP_AMOUNT_FOR_REMOTE_ORDER,
  CHECK_IF_ORDER_IS_PULLED,
  REMOTE_KOT_PLACED,
  RELOAD_APP,
} = require('../util/IPC_Messages');
const { ORDERS_NOTIFICATION } = require('../util/OrderStates');
const { autoAcceptRemoteKot } = require('../js/RemoteKot');
const {
  precalculateDetailsCheck,
  sendDiscountupdate,
  resetCurrentdiscount,
} = require('../js/calculations');
const {
  getHeadersforchannelforrender,
  getHeadersformposforrender,
} = require('../util/MiscServer.renderer');
const { DIGITAL_ORDER_IPC } = require('../constant/IPCEvents');
const { sendSubscription } = require('../serviceworker/subscription');
const { openTableReservationModal } = require('../js/Modals/TableReservation');
const { apiCall } = require('../services/APIService');
const {
  updateOrderDataAsPerPaymentInfoRequest,
} = require('../renderer/helper/Order.helper');
const {
  sendNotificationEvent,
  sendSettleBillEvent,
  sendCloseNotificationevent,
  sendKotsavedevent,
} = require('../js/ClientrequestHandler');
const {
  pullDigitalOrderOnAccept,
  printCancelledOnlineOrerKot,
} = require('./DigitalOrder');
const { setLocalStorage, getLocalStorage } = require('../storage');
const { sleep } = require('../util/MiscUtil');
const { safeParse } = require('../util/RendererUtils');

let howlsuccessnotificationSound;
let howlcancelnotificationSound;
let howlwiaterNotificationSound;
const stringConstructor = 'test'.constructor;

const notifyOnly = false;
window.firebaseToken = undefined;

// update payment info
async function initUpdateOrderDataAsPerPaymentInfo(data) {
  const response = await updateOrderDataAsPerPaymentInfoRequest(data);
  return response;
}

async function handleDigitalordercancelled(notificationData) {
  try {
    if (notificationData && notificationData.order_id) {
      console.log(
        `Message="Digital Order Cancelled" OrderID="${notificationData.order_id}"`,
      );
      const response = await window.betteripcRenderer.callMain(
        DIGITAL_ORDER_IPC.ORDER_CANCELLED,
        {
          order_id: notificationData.order_id,
          order_state: 'cancelled',
        },
      );

      if (response) {
        sendKotsavedevent(response);
      }
      if (
        window.settingsConfig[ONLINE_CANCEL_KOT_PRINT - 1] &&
        window.settingsConfig[ONLINE_CANCEL_KOT_PRINT - 1].value === '1'
      ) {
        printCancelledOnlineOrerKot(notificationData.order_id);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleonlineordercancelled(notificationData) {
  try {
    console.log(
      `Message="Online Order Cancelled" OrderID=${notificationData.order_id} StoreID= OrderState="${notificationData.new_status}"`,
    );
    const { order_id } = notificationData;
    const { new_status } = notificationData;
    const store_id = notificationData.store_ref_id;
    ipcRenderer.send(
      UPDATE_ONLINEORDER_STATUS,
      JSON.stringify({ order_id, new_status, store_id }),
    );
    window.betteripcRenderer.callMain(ONLINEORDER_IPC.PULL_CANCELLED_ORDER, {
      order_id,
      new_status,
      store_id,
    });
  } catch (error) {
    console.error(error);
  }
}

async function digitalOrderaccepted(notificationData) {
  try {
    if (!window.digiScreenloaded) {
      if ($('#digitalOrdersIcon').is(':visible')) {
        $('.modal').modal('hide');
        $('#digitalOrdersIcon').click();
      }
    }
    pullDigitalOrderOnAccept(notificationData);
  } catch (error) {
    console.error(`Message="Error While Pulling Digital Order"`, error);
  }
}

function orderAutoAccepted() {
  if ($('#digitalordersWrapperid').is(':visible')) {
    $('#runningdigitalordersButton').click();
  }
}
async function pullDigitalOrderOnautoSettle(notificationData) {
  try {
    if (!window.__IS_MASTER_POS__) {
      console.log(
        `Message="Trying to pull online order on terminal" order_id=${notificationData?.order_id}`,
      );
      return;
    }
    console.log(
      `Messgae='Pull digital order on auto settle' order_id=${notificationData?.order_id}`,
    );
    if (!window.digiScreenloaded) {
      // if ($('#digitalOrdersIcon').is(':visible')) {
      //   $('#digitalOrdersIcon').click();
      // }
      // else {
      //   setTimeout(() => {
      //     $('#digitalOrdersIcon').click();
      //   }, 350);
      // }
    }

    const isOrderPulled = await window.betteripcRenderer.callMain(
      CHECK_IF_ORDER_IS_PULLED,
      { order_id: notificationData?.order_id },
    );

    console.log('isOrderPulled::', isOrderPulled);
    if (!isOrderPulled) {
      pullDigitalOrderOnAccept(notificationData);
    }
  } catch (error) {
    console.error(`Message="Error While Pulling Digital Order"`, error);
  }
}

function autoSettleBill(tableIdToSettle, notificationData) {
  let table;
  let tableId;
  if (tableIdToSettle) {
    tableId = `table_${tableIdToSettle.table_id}`;
    table = $(`#${tableId}`);
    ipcRenderer.send(
      FETCH_BILL_DATA_FOR_CSK,
      JSON.stringify({
        table_id: tableIdToSettle.table_id,
        settleBill: true,
        autoSettled: true,
      }),
    );
  }
  if (table && table.length > 0) {
    // unused
  } else if (
    notificationData.order.order_id &&
    !notificationData.order.table_id
  ) {
    window.settleQuickBillOnQrPayment(notificationData.order);
  }
  ipcRenderer.send(CLOSE_NOTIFICATION_VIEW, {
    target: `paymentClass${notificationData.order.bill_number}`,
  });
  setTimeout(() => {
    $(`.paymentClass${notificationData.order.bill_number}`).hide();
    // window.stopHowler();
  }, 120);
}

function clickelementifVisible(elementSelected) {
  if ($(elementSelected).is(':visible')) {
    $(elementSelected).click();
  } else {
    setTimeout(() => {
      $(elementSelected).click();
    }, 350);
  }
}

/**
 * Mimics the click for a current notification type
 * @param {Order type} type
 */
function checkNotificationtypeandtakeaction(type) {
  switch (type) {
    case ORDERS_NOTIFICATION.NEW_ORDER:
      $('#neworderButton').click();
      break;
    case ORDERS_NOTIFICATION.NEW_ORDER_ALT:
      $('#neworderButton').click();
      break;
    case ORDERS_NOTIFICATION.CANCELLED_ORDER:
      clickelementifVisible('#cancelledordersButton');
      break;
    case ORDERS_NOTIFICATION.DIGITAL_ORDER:
      clickelementifVisible('#newdigitalorderButton');
      break;
    case ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED:
      clickelementifVisible('#cancelleddigitalordersButton');
      break;
    case ORDERS_NOTIFICATION.REMOTE_KOT:
      clickelementifVisible('#remoteKot');
      break;
    default:
      break;
  }
}

window.pushnotificationListener = async (_, serverNotificationPayload) => {
  sendNotificationEvent(serverNotificationPayload);
  if (serverNotificationPayload) {
    // eslint-disable-next-line no-param-reassign
    serverNotificationPayload = safeParse(serverNotificationPayload);
  }

  console.log(
    `Message="FCM Notification Received" Payload="${JSON.stringify(
      serverNotificationPayload?.notification,
    )}"`,
  );

  // if (Swal.isVisible()) Swal.close();
  if (
    serverNotificationPayload !== undefined &&
    serverNotificationPayload.notification &&
    serverNotificationPayload.notification.body !== undefined
  ) {
    // clearTimeout(timeoutId);
    // var timeoutId = setTimeout(() => {
    //   window.stopHowler();
    // }, 7000);
    try {
      let notificationData = serverNotificationPayload.notification.body;

      if (notificationData.constructor === stringConstructor) {
        notificationData = safeParse(
          serverNotificationPayload.notification.body,
        );
      }
      if (notificationData && notificationData.msg) {
        const storeidofNotification = notificationData?.store_id;
        // Check if notification has store_id
        if (
          storeidofNotification &&
          window.alladdedStoreslist &&
          Array.isArray(window.alladdedStoreslist) &&
          window.alladdedStoreslist.length &&
          !window.alladdedStoreslist.includes(storeidofNotification)
        ) {
          console.log(
            `Message="Notification Received of another store. Ignoring.." CurrentStore="${window.storeDetails.store_id}" StoreidofNotification="${storeidofNotification}"`,
          );
          return;
        }

        if (
          notificationData.flag === ORDERS_NOTIFICATION.FCM_NOTIFICATION_TEST
        ) {
          if (notificationData.token === window.testFCMToken) {
            window.requestedFCMTokenVerified = true;
          }
          return;
        }

        let flag = ORDERS_NOTIFICATION.NEW_ORDER;
        if (notificationData.flag) {
          flag = Number(notificationData.flag);
        }

        if (
          flag === ORDERS_NOTIFICATION.PAYMENT_RECEIVED &&
          !window.__IS_MASTER_POS__ &&
          !window.showPaymentNotification
        ) {
          return;
        }
        // if digital order doesn't have access level
        if (
          // flag === ORDERS_NOTIFICATION.DIGITAL_ORDER &&
          [
            ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED,
            ORDERS_NOTIFICATION.CANCELLED_ORDER,
            ORDERS_NOTIFICATION.NEW_ORDER,
            ORDERS_NOTIFICATION.NEW_ORDER_ALT,
            ORDERS_NOTIFICATION.DIGITAL_ORDER,
            ORDERS_NOTIFICATION.REFUND_INITIATED,
          ].includes(flag) &&
          !window.isDigitalOrderVisible
        ) {
          return;
        }

        if (flag === ORDERS_NOTIFICATION.FORCE_LOGOUT) {
          ipcRenderer.send(REMOTE_FORCE_LOGUT);
          return;
        }

        if (
          [
            ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED,
            ORDERS_NOTIFICATION.CANCELLED_ORDER,
            ORDERS_NOTIFICATION.NEW_ORDER,
            ORDERS_NOTIFICATION.NEW_ORDER_ALT,
            ORDERS_NOTIFICATION.DIGITAL_ORDER,
            ORDERS_NOTIFICATION.TABLE_RESERVATION,
            ORDERS_NOTIFICATION.REFUND_INITIATED,
          ].includes(flag) &&
          !window.__IS_MASTER_POS__
        ) {
          return;
        }
        if (
          !window.__IS_MASTER_POS__ &&
          [ORDERS_NOTIFICATION.ASSISTANCE_REQUESTED].includes(flag)
        ) {
          // check table is present
          const table = $(`#table_${notificationData.table_id}`);
          if (!table.length) {
            return;
          }
        }
        ipcRenderer.send(SERVER_MESSAGE_RECEIVED, serverNotificationPayload);
        // Check if the notification is for cancelled order if yes then
        // set the order status for that bill to cancelled if it is
        // pulled into tmbill
        if (
          flag === ORDERS_NOTIFICATION.CANCELLED_ORDER &&
          notificationData.order_id &&
          notificationData.new_status
        ) {
          handleonlineordercancelled(notificationData);
          return;
        }

        console.log('flag::', flag);
        if (flag === ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED) {
          handleDigitalordercancelled(notificationData);
          // return;
        }

        // auto accpet remote kot
        let autoAccept;
        if (
          flag === ORDERS_NOTIFICATION.REMOTE_KOT &&
          window.settingsConfig[AUTO_ACCEPT_REMOTE_KOT - 1]
        ) {
          autoAccept =
            window.settingsConfig[AUTO_ACCEPT_REMOTE_KOT - 1].value === '1';
        }

        if (autoAccept) {
          if (window.settingsConfig[MUTE_NOTIFICATION - 1]) {
            if (window.settingsConfig[MUTE_NOTIFICATION - 1].value === '0') {
              window.PlayHowlerbyid(howlcancelnotificationSound);
              setTimeout(() => {
                window.stopHowler();
              }, 7000);
            }
          }
          if (window.__IS_MASTER_POS__) {
            autoAcceptRemoteKot({
              remote_kot_id: notificationData.order.remote_kot_id,
            });
          }
          return;
        }

        if (!autoAccept && flag === ORDERS_NOTIFICATION.REMOTE_KOT) {
          ipcRenderer.send(REMOTE_KOT_PLACED, notificationData);
        }

        if (flag === ORDERS_NOTIFICATION.CANCELLED_ORDER) {
          setTimeout(() => {
            if (
              window.settingsConfig[MUTE_NOTIFICATION - 1] &&
              flag !== ORDERS_NOTIFICATION.PAYMENT_RECEIVED
            ) {
              if (window.settingsConfig[MUTE_NOTIFICATION - 1].value === '0') {
                window.PlayHowlerbyid(howlsuccessnotificationSound);
              }
            }
          }, 100);

          bs4Toast.show(
            serverNotificationPayload.notification.title || 'TMBill Channel',
            notificationData.msg || 'You have got a new sorder',
            {},
            {
              icon: {
                type: 'image',
                src: serverNotificationPayload.notification.image,
              },
            },
          );
        }
        // toast notification
        if (
          [
            ORDERS_NOTIFICATION.REMOTE_KOT,
            ORDERS_NOTIFICATION.PAYMENT_RECEIVED,
            ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED,
            ORDERS_NOTIFICATION.NEW_ORDER,
            ORDERS_NOTIFICATION.NEW_ORDER_ALT,
            // ORDERS_NOTIFICATION.CANCELLED_ORDER,
            ORDERS_NOTIFICATION.DIGITAL_ORDER,
            ORDERS_NOTIFICATION.TABLE_RESERVATION,
            ORDERS_NOTIFICATION.REFUND_INITIATED,
          ].includes(flag)
        ) {
          let playPaymentAlert = false;
          if (window.settingsConfig[PAYMENT_SOUND_ALERT - 1]) {
            playPaymentAlert =
              window.settingsConfig[PAYMENT_SOUND_ALERT - 1].value === '1';
          }

          let tableIdToSettle;
          if (flag === ORDERS_NOTIFICATION.PAYMENT_RECEIVED) {
            // payment sound

            if (playPaymentAlert) {
              let table_name = '';

              if (
                !notificationData.order.table_id &&
                notificationData.order.order_id
              ) {
                // get table id for order id and set it to notification data
                const table_id = await window.betteripcRenderer.callMain(
                  GET_TABLE_ID,
                  {
                    order_id: notificationData.order.order_id,
                  },
                );
                if (table_id) {
                  Object.assign(notificationData.order, { table_id });
                }
              }
              if (notificationData.order.table_id) {
                const table = find(window.allTableslist, {
                  id: notificationData.order.table_id,
                });
                if (table && table.table_name) {
                  table_name = table?.table_name;
                }
              }

              let currency = '';
              if (window.storeDetails?.currency_name) {
                const currency_array =
                  window.storeDetails.currency_name.split(' ');
                if (currency_array.length > 1) {
                  // eslint-disable-next-line prefer-destructuring
                  currency = currency_array[1];
                } else if (currency_array[0]) {
                  // eslint-disable-next-line prefer-destructuring
                  currency = currency_array[0];
                }
              }

              const textString = ` ${Number(
                notificationData.order.payment.amount,
              )} ${currency} received on  ${table_name} `;

              // let textString = `${Number(
              //   notificationData.order.payment.amount,
              // )} received on table 1
              // `;
              window.playPaymentSound(textString);
            }

            // if order is of quick bill
            if (window.__IS_MASTER_POS__) {
              if (
                !notificationData.order.table_id &&
                notificationData.order.order_id
              ) {
                window.updateQuickBillPaymentOnQrPayment(
                  notificationData,
                  tableIdToSettle,
                );
              } else {
                // add customer data and update payment info of that order
                // tableIdToSettle = await betteripcRenderer.callMain(
                //   UPDATE_ORDERDATA_AS_PER_PAYMENT_INFO,
                //   notificationData.order,
                // );
                tableIdToSettle = await initUpdateOrderDataAsPerPaymentInfo(
                  notificationData.order,
                );
                const payment_info = { ...notificationData, tableIdToSettle };
                ipcRenderer.send(PAYMENT_RECEIVED, payment_info);
              }
            }
          }
          setTimeout(() => {
            if (
              window.settingsConfig[MUTE_NOTIFICATION - 1] &&
              flag !== ORDERS_NOTIFICATION.PAYMENT_RECEIVED
            ) {
              if (window.settingsConfig[MUTE_NOTIFICATION - 1].value === '0') {
                window.PlayHowlerbyid(howlsuccessnotificationSound);
              }
            }
          }, 100);

          setTimeout(() => {
            if (
              window.settingsConfig[MUTE_NOTIFICATION - 1] &&
              flag === ORDERS_NOTIFICATION.PAYMENT_RECEIVED &&
              !playPaymentAlert
            ) {
              if (window.settingsConfig[MUTE_NOTIFICATION - 1].value === '0') {
                window.PlayHowlerbyid(howlsuccessnotificationSound);
              }
            }
          }, 100);

          // $('.closePaymentNotificationModal').click();

          let table_name = tableIdToSettle?.table_name;
          if (!tableIdToSettle?.table_name) {
            table_name = '';
          }
          if (notificationData?.order?.billing_type === 8) {
            table_name = 'Digital order';
          }
          if (notificationData?.order?.billing_type === 0) {
            table_name = 'Quick bill';
          }

          if (!table_name) {
            // find table
            const table = window.allTableslist.find(
              (t) => Number(t.id) === Number(notificationData?.order?.table_id),
            );
            if (table) {
              table_name = table.table_name;
            }
          }

          bs4Toast.show(
            serverNotificationPayload.notification.title || 'TMBill Channel',
            notificationData.msg || 'You have got a new sorder',
            flag === ORDERS_NOTIFICATION.PAYMENT_RECEIVED
              ? {
                  // table: tableIdToSettle
                  //   ? tableIdToSettle.table_name
                  //   : notificationData?.order?.order_id && 'Quick bill',
                  table: table_name,
                  amount: notificationData.order.payment.amount,
                  billNo: notificationData.order.bill_number,
                }
              : {},
            {
              buttons: [
                {
                  text: $.i18n.t('notificationScreen.CheckLater'),
                  class: 'btn viweNotification checkLaterButton',
                  callback: (id) => {
                    // $(`#${id}`).hide();
                    $(`#${id}`).toast('hide');
                    window.stopHowler();
                  },
                },
                {
                  text:
                    // flag == ORDERS_NOTIFICATION.PAYMENT_RECEIVED
                    [
                      ORDERS_NOTIFICATION.PAYMENT_RECEIVED,
                      ORDERS_NOTIFICATION.TABLE_RESERVATION,
                    ].includes(flag)
                      ? $.i18n.t('notificationScreen.View')
                      : $.i18n.t('notificationScreen.ViewOrder'),
                  class: 'btn viweNotification viewOrderButton',
                  callback: (id) => {
                    switch (flag) {
                      case ORDERS_NOTIFICATION.REMOTE_KOT:
                        if ($('#remoteKot').is(':visible')) {
                          $('#remoteKot').click();
                        } else {
                          window.openwindowFromremote('order');
                          setTimeout(() => {
                            $('#remoteKot').click();
                          }, 350);
                        }
                        // $(`#${id}`).hide();
                        $(`#${id}`).toast('hide');
                        window.stopHowler();
                        $('.bs4ToastWrapper').hide();
                        break;

                      case ORDERS_NOTIFICATION.PAYMENT_RECEIVED:
                        if ($('#paymentsList').is(':visible')) {
                          $('#paymentsList').click();
                        } else {
                          // setTimeout(() => {
                          //   $('#paymentsList').click();
                          // }, 350);
                        }
                        // $(`#${id}`).hide();
                        $(`#${id}`).toast('hide');
                        window.stopHowler();
                        break;

                      case ORDERS_NOTIFICATION.TABLE_RESERVATION:
                        openTableReservationModal();
                        // $(`#${id}`).hide();
                        $(`#${id}`).toast('hide');
                        window.stopHowler();
                        break;

                      case ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED:
                      case ORDERS_NOTIFICATION.DIGITAL_ORDER:
                      case ORDERS_NOTIFICATION.REFUND_INITIATED:
                        window.PlayHowlerbyid(
                          flag === ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED
                            ? howlcancelnotificationSound
                            : howlsuccessnotificationSound,
                        );

                        if (
                          notificationData.store_id &&
                          window.storeDetails &&
                          window.storeDetails.store_id !==
                            notificationData.store_id
                        ) {
                          ipcRenderer.send(SWITCH_STORE, {
                            store_id: notificationData.store_id,
                            miscActions: {
                              openWindow: 'digital',
                              clickAction: '#newdigitalorderButton',
                            },
                          });
                          window.stopHowler();
                          return;
                        }
                        checkNotificationtypeandtakeaction(flag);
                        window.openwindowFromremote('digital');
                        // $(`#${id}`).hide();
                        $(`#${id}`).toast('hide');

                        window.stopHowler();
                        break;
                      case ORDERS_NOTIFICATION.NEW_ORDER:
                      case ORDERS_NOTIFICATION.NEW_ORDER_ALT:
                        if (
                          notificationData.store_id &&
                          window.storeDetails &&
                          window.storeDetails.store_id !==
                            notificationData.store_id
                        ) {
                          ipcRenderer.send(SWITCH_STORE, {
                            store_id: notificationData.store_id,
                            miscActions: {
                              openWindow: 'online',
                              clickAction: '#neworderButton',
                            },
                          });
                          window.stopHowler();
                        } else {
                          window.openwindowFromremote('online');
                          $('#neworderButton').click();
                        }

                        break;
                      default:
                        checkNotificationtypeandtakeaction(flag);
                        break;
                    }
                  },
                },
                {
                  text: $.i18n.t('notificationScreen.SettleBill'),
                  class: 'btn viweNotification settleButton',
                  callback: (id) => {
                    let table;
                    let tableId;
                    if (tableIdToSettle) {
                      tableId = `table_${tableIdToSettle.table_id}`;
                      table = $(`#${tableId}`);
                      if (window.__IS_MASTER_POS__) {
                        ipcRenderer.send(
                          FETCH_BILL_DATA_FOR_CSK,
                          JSON.stringify({
                            table_id: tableIdToSettle.table_id,
                            settleBill: true,
                          }),
                        );
                      } else {
                        const data = {
                          table_id: tableIdToSettle.table_id,
                          settleBill: true,
                        };

                        sendSettleBillEvent(data);
                        // call settle bill event to poss
                      }
                    } else if (!window.__IS_MASTER_POS__) {
                      const data = {
                        table_id: notificationData.order.table_id,
                        settleBill: true,
                      };

                      sendSettleBillEvent(data);

                      // call settle bill event to poss
                    }
                    if (table && table.length > 0) {
                      // unused
                    } else if (
                      notificationData.order.order_id &&
                      !notificationData.order.table_id
                    ) {
                      window.settleQuickBillOnQrPayment(notificationData.order);
                    }
                    // ipcRenderer.send(CLOSE_NOTIFICATION_VIEW, {
                    //   target: `paymentClass${notificationData.order.bill_number}`,
                    // });
                    sendCloseNotificationevent({
                      target: `paymentClass${notificationData.order.bill_number}`,
                    });
                    // $(`#${id}`).hide();
                    $(`#${id}`).toast('hide');
                    window.stopHowler();
                  },
                },
              ],
              icon: {
                type: 'image',
                src: serverNotificationPayload.notification.image,
              },
              remote_kot_id: notificationData?.order?.remote_kot_id,
            },
          );
          let autoSettlebillOnPaymentReceived = false;
          if (window.settingsConfig[AUTO_SETTLE_BILL_ON_ONLINE_PAYENT - 1]) {
            autoSettlebillOnPaymentReceived =
              window.settingsConfig[AUTO_SETTLE_BILL_ON_ONLINE_PAYENT - 1]
                .value === '1';
          }
          if (
            autoSettlebillOnPaymentReceived &&
            flag === ORDERS_NOTIFICATION.PAYMENT_RECEIVED
          ) {
            // check if settle is in process
            // added queue for settlment so no need to add this
            // const interval = setInterval(() => {
            //   if (!window.settlebillisinProgress) {
            //     clearInterval(interval); // Stop the interval
            //     autoSettleBill(tableIdToSettle, notificationData);
            //     if (notificationData?.order?.bill_number)
            //       $(
            //         `.paymentClass${notificationData.order.bill_number}`,
            //       ).hide();
            //   }
            // }, 150);
            autoSettleBill(tableIdToSettle, notificationData);
            if (notificationData?.order?.bill_number)
              $(`.paymentClass${notificationData.order.bill_number}`).hide();
          }
        }

        if ([ORDERS_NOTIFICATION.ASSISTANCE_REQUESTED].includes(flag)) {
          ipcRenderer.send(ASSISTANCE_REQUESTED, notificationData);
          setTimeout(() => {
            if (window.settingsConfig[MUTE_NOTIFICATION - 1]) {
              if (window.settingsConfig[MUTE_NOTIFICATION - 1].value === '0') {
                window.PlayHowlerbyid(howlwiaterNotificationSound);
              }
            }
          }, 100);
          bs4Toast.show(
            serverNotificationPayload.notification.title || 'Table order',
            notificationData.msg || 'You have got a new request',
            {},
            {
              buttons: [
                {
                  text: 'Check Later',
                  class: 'btn viweNotification checkLaterButton',
                  callback: (id) => {
                    // $(`#${id}`).hide();
                    $(`#${id}`).toast('hide');
                    window.stopHowler();
                    Object.assign(notificationData, { status: 0 });
                    if (window.__IS_MASTER_POS__) {
                      ipcRenderer.send('add-notification-in-database', {
                        notificationData,
                      });
                    }
                    ipcRenderer.send(CLOSE_NOTIFICATION_VIEW, {
                      target: `tableClass${notificationData.table_id}`,
                    });
                  },
                },
                {
                  text: 'Close Request',
                  class: 'btn viweNotification checkLaterButton',
                  callback: (id) => {
                    // $(`#${id}`).hide();
                    $(`#${id}`).toast('hide');

                    window.stopHowler();
                    Object.assign(notificationData, { status: 1 });
                    if (window.__IS_MASTER_POS__) {
                      ipcRenderer.send('add-notification-in-database', {
                        notificationData,
                      });
                    }
                    ipcRenderer.send(CLOSE_NOTIFICATION_VIEW, {
                      target: `tableClass${notificationData.table_id}`,
                    });
                  },
                },
              ],
              icon: {
                type: 'image',
                src: serverNotificationPayload.notification.image,
              },
              table_id: notificationData.table_id,
            },
            notificationData,
          );
        }

        if (
          window.__IS_MASTER_POS__ &&
          flag === ORDERS_NOTIFICATION.WAITER_TIP
        ) {
          if (notificationData?.data?.order_id) {
            // check if bill is saved or not and update tip amount
            await window.betteripcRenderer.callMain(
              UPDATE_TIP_AMOUNT_FOR_REMOTE_ORDER,
              {
                // table_id: notificationData.data.table_id,
                tip_amount: notificationData.data.tip_amount,
                order_id: notificationData.data.order_id,
              },
            );
          }
        }

        if (
          [
            ORDERS_NOTIFICATION.REMOTE_KOT,
            ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED,
            ORDERS_NOTIFICATION.NEW_ORDER,
            ORDERS_NOTIFICATION.NEW_ORDER_ALT,
            // ORDERS_NOTIFICATION.CANCELLED_ORDER,
            ORDERS_NOTIFICATION.DIGITAL_ORDER,
            // ORDERS_NOTIFICATION.ONLINE_ORDER_AUTO_ACCEPTED,
            ORDERS_NOTIFICATION.ASSISTANCE_REQUESTED,
            ORDERS_NOTIFICATION.TABLE_RESERVATION,
          ].includes(flag)
        ) {
          const element = document.getElementsByClassName('settleButton');
          if (element && element[0]) element[0].style.display = 'none';
          const checkLater =
            document.getElementsByClassName('checkLaterButton');
          if (checkLater && checkLater[0]) checkLater[0].style.display = '';
        } else {
          const element = document.getElementsByClassName('settleButton');
          if (element && element[0]) element[0].style.display = '';
          const checkLater =
            document.getElementsByClassName('checkLaterButton');
          if (checkLater && checkLater[0]) checkLater[0].style.display = 'none';
        }

        if (flag === ORDERS_NOTIFICATION.ORDER_ACCEPTED_STOP_NOTIFICATION) {
          setTimeout(() => {
            window.stopHowler();
          }, 7000);
          $('.closeorderNotificationModal').click();
        }
        // to settle bill
        if ([ORDERS_NOTIFICATION.SETTLE_BILL].includes(flag)) {
          const tableId = `table_${notificationData.data.table_id}`;
          const table = $(`#${tableId}`);

          switch (notificationData.data.action) {
            case 'SAVE':
              if (table && table.length > 0) {
                if (
                  window.globalcurrenttableId &&
                  window.globalcurrenttableId === tableId
                ) {
                  $('#print_n_savebillButton').click();
                } else {
                  $(table).click();
                  $('#print_n_savebillButton').click();
                }
              }
              break;

            case 'SETTLE':
              if (table && table.length > 0) {
                if (
                  window.globalcurrenttableId &&
                  window.globalcurrenttableId === tableId
                ) {
                  $('#settlebillButton').click();
                } else {
                  $(table).click();
                  $('#settlebillButton').click();
                }
              }
              break;

            case 'DISCOUNT':
              // let tableId = `table_${notificationData.table_id}`;
              {
                const currenttableButton = $(`#${tableId}`);
                if (
                  window.globalcurrenttableId &&
                  window.globalcurrenttableId === tableId
                ) {
                  $(table).click();
                } else {
                  $(table).click();
                }
                setTimeout(async () => {
                  resetCurrentdiscount(currenttableButton[0]);
                  if (
                    currenttableButton[0].data.details.bill_number === 0 &&
                    currenttableButton[0].data.details.order_id === 0
                  ) {
                    window.notifyUser.showMessage(
                      'error',
                      'Please Save bill first',
                    );
                    return;
                  }
                  const { discountData } = notificationData.data;
                  if (currenttableButton[0] && discountData) {
                    currenttableButton[0].data.details.discount =
                      discountData.rate;
                    currenttableButton[0].data.details.discount_type =
                      discountData.discount_type;
                    currenttableButton[0].data.details.discounted_product_groups =
                      discountData.product_groups;
                    currenttableButton[0].data.details.discount_title =
                      discountData.discount_name;
                  }
                  await precalculateDetailsCheck(currenttableButton[0]);

                  const paymentData = {
                    table_id: notificationData.data.table_id,
                    data: discountData,
                    order_id: currenttableButton[0].data.details.bill_number,
                  };

                  sendDiscountupdate(
                    currenttableButton[0],
                    'dineintabId',
                    paymentData,
                  );
                }, 300);
              }

              break;

            default:
              break;
          }
        }

        // Order status update notifications
        // refer JSON reponse for more info
        if (flag === ORDERS_NOTIFICATION.ORDER_STATUS_UPDATE) {
          if (notificationData.msg) {
            window.notifyUser.showMessage('success', notificationData.msg, 0);
          }
        }

        // if flag = 5 then fetch order, pull and print
        if (flag === ORDERS_NOTIFICATION.AUTO_ACCEPTED) {
          // getting order id
          // fetch order
          // let order_id = '136964712414';
          const order_id = notificationData.order;
          const response = await apiCall.post(
            global.Config.links.getsingleChannelorder,
            {
              order_id,
              store_id: window.channelStoreidlist,
            },
            {
              headers: getHeadersforchannelforrender(),
            },
          );
          if (response) {
            const jsonData = JSON.parse(response.data.data.json_data);
            response.data.data.json_data = jsonData;
            setTimeout(() => {
              window.pullOnlineOrderFromRemote(response.data.data, order_id);
            }, 5000);
          }
          orderAutoAccepted();
        }

        // Digital Order auto accepted
        if (
          flag === ORDERS_NOTIFICATION.ONLINE_ORDER_AUTO_ACCEPTED &&
          window.__IS_MASTER_POS__
        ) {
          digitalOrderaccepted(notificationData);
          orderAutoAccepted();
        }

        // check auto pull on order auto settled
        if (flag === ORDERS_NOTIFICATION.AUTO_SETTLED) {
          setTimeout(() => {
            pullDigitalOrderOnautoSettle(notificationData);
          }, 45000);
        }

        if (flag === ORDERS_NOTIFICATION.ORDER_ACCEPTED_STOP_NOTIFICATION) {
          setTimeout(() => {
            pullDigitalOrderOnautoSettle(notificationData);
          }, 60000);
        }

        if (flag === ORDERS_NOTIFICATION.ORDER_DISPATCHED_CHANGE_STATUS) {
          if (
            notificationData.store_id &&
            window.storeDetails &&
            notificationData.store_id === window.storeDetails.store_id
          ) {
            if (!window.digiScreenloaded) {
              if ($('#digitalOrdersIcon').is(':visible')) {
                $('#digitalOrdersIcon').click();
              }
              // else {
              //   setTimeout(() => {
              //     $('#digitalOrdersIcon').click();
              //   }, 350);
              // }
            }

            const { order_id } = notificationData;
            setTimeout(() => {
              window.changeOrderStatusRemotely(order_id);
            }, 200);
          }
        }

        // if flag = 6 then load menu
        if (flag === ORDERS_NOTIFICATION.DO_LOAD_MENU) {
          switch (notificationData.settings_updated) {
            case 0:
              break;

            case 1:
              if (
                notificationData &&
                notificationData.store_list &&
                notificationData.store_list.includes(
                  window.storeDetails.store_id,
                )
              ) {
                window.betteripcRenderer.callMain(
                  'load-menu-request-from-server',
                  {},
                );
              }
              break;

            case 2:
              console.log('load settings request');
              if (
                notificationData &&
                notificationData.store_list &&
                notificationData.store_list.includes(
                  window.storeDetails.store_id,
                )
              ) {
                setTimeout(() => {
                  window.betteripcRenderer.callMain(
                    LOAD_SETTING_REQUEST_FROM_SERVER,
                    {},
                  );
                  ipcRenderer.send('pos-settings-updated', {});
                }, 400);
              }
              break;

            case 3:
              if (
                notificationData &&
                notificationData.store_list &&
                notificationData.store_list.includes(
                  window.storeDetails.store_id,
                )
              ) {
                window.betteripcRenderer.callMain(
                  LOAD_USERS_REQUEST_FROM_SERVER,
                  {},
                );
              }
              break;

            case 4:
              if (
                notificationData &&
                notificationData.store_list &&
                notificationData.store_list.includes(
                  window.storeDetails.store_id,
                )
              ) {
                window.betteripcRenderer.callMain(
                  LOAD_ACCESS_LEVEL_REQUEST_FROM_SERVER,
                  {},
                );
                // ipcMain.callMain('')
              }
              break;

            case 5:
              if (
                notificationData &&
                notificationData.store_list &&
                notificationData.store_list.includes(
                  window.storeDetails.store_id,
                )
              ) {
                window.betteripcRenderer.callMain(
                  'load-outlet-settings-request-from-server',
                  {},
                );
              }
              break;

            case 6:
              if (
                notificationData &&
                notificationData.store_list &&
                notificationData.store_list.includes(
                  window.storeDetails.store_id,
                )
              ) {
                window.betteripcRenderer.callMain(
                  LOAD_PAYMENT_MODES_REQUEST_FROM_SERVER,
                  {},
                );
              }
              break;
            default:
              break;
          }
        }

        if (flag === ORDERS_NOTIFICATION.MERCHANT_AGREED_CANCELLATION) {
          clickelementifVisible('#runningdigitalordersButton');
        }

        // if (!window.Swal.isVisible()) {
        //   window.stopHowler();
        // }
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    console.error('Error parsing notification');
    console.error(serverNotificationPayload);
    window.notifyUser.showMessage('success', 'New notification');
  }
};

/**
 * Starts FCM Service
 * @param {*} senderId
 */
function initializeService() {
  // ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId);
  ipcRenderer.send(START_NOTIFICATION_SERVICE, {});
}

ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  if (token) {
    setLocalStorage('firebaseToken', token);
    window.firebaseToken = token;
    sendSubscription({
      store_id: window.storeDetails.store_id,
      firebaseToken: window.firebaseToken,
    });
  } else {
    const firebaseToken = getLocalStorage('firebaseToken');
    if (firebaseToken) {
      window.firebaseToken = firebaseToken;
    }
  }
});

ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
  console.log('notification error', error);
});

ipcRenderer.on(RETRY_PULL_ONLINE_ORDER, (_, data) => {
  digitalOrderaccepted(data);
});

ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
  setLocalStorage('firebaseToken', token);
  window.firebaseToken = token;
  sendSubscription({
    store_id: window.storeDetails.store_id,
    firebaseToken: window.firebaseToken,
  });
});

ipcRenderer.on(NOTIFICATION_RECEIVED, window.pushnotificationListener);

/**
 * Initialize howler
 */
function intializeNotification() {
  const sounds = getNotificationsoundnames();
  let howlsuccessnotificationSoundpath = sounds.SUCCESS.DEFAULT;
  let howlcancelnotificationSoundSoundpath = sounds.CANCEL.DEFAULT;
  let howewiatercallingNotificationSoundpath = sounds.WAITER_CALLING.DEFAULT;
  if (window.fileSystem.existsSync(sounds.SUCCESS.PATH)) {
    howlsuccessnotificationSoundpath = sounds.SUCCESS.PATH;
  }
  if (window.fileSystem.existsSync(sounds.CANCEL.PATH)) {
    howlcancelnotificationSoundSoundpath = sounds.CANCEL.PATH;
  }

  if (window.fileSystem.existsSync(sounds.WAITER_CALLING.PATH)) {
    howewiatercallingNotificationSoundpath = sounds.CANCEL.PATH;
  }

  howlsuccessnotificationSound = new window.Howl({
    src: [howlsuccessnotificationSoundpath],
    autoplay: false,
    loop: true,
    volume: 0.8,
  });

  howlcancelnotificationSound = new window.Howl({
    src: [howlcancelnotificationSoundSoundpath],
    autoplay: false,
    loop: true,
    volume: 0.8,
  });

  howlwiaterNotificationSound = new window.Howl({
    src: [howewiatercallingNotificationSoundpath],
    autoplay: false,
    loop: true,
    volume: 0.8,
  });
}

// remote intializeNotification();
window.intializeNotification_fromremote = () => {
  intializeNotification();
};

window.PlayHowlerbyid = async (howlerId) => {
  if (howlerId !== undefined && !notifyOnly && !howlerId.playing()) {
    howlerId.play();
  }
  if (howlerId === undefined && howlsuccessnotificationSound !== undefined) {
    howlsuccessnotificationSound.play();
  }
};

window.sendWaiterNoitification = async (notificationData) => {
  Object.assign(notificationData, { status: 0 });
  ipcRenderer.send('add-notification-in-database', {
    notificationData,
  });
};

window.stopHowler = async () => {
  // console.log('stopHowler');
  if (howlsuccessnotificationSound !== undefined) {
    howlsuccessnotificationSound.stop();
  }
  if (howlcancelnotificationSound !== undefined) {
    howlcancelnotificationSound.stop();
  }
  if (howlwiaterNotificationSound !== undefined) {
    howlwiaterNotificationSound.stop();
  }
};

function setupFCM() {
  setTimeout(() => {
    initializeService();
  }, 10000);
}

setupFCM();
