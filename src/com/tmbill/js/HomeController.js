/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable func-names */
require('../hooks/i18n');
require('../renderer/sentry');

const fs = require('fs');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const { Config: appConfig } = require('../config/config');

window.Config = appConfig;
const {
  ORDER_IPC,
  NEW_STORE_ADDED_UPDATED,
  DESTROY_USER_SESSION,
  TOGGLE_FULLSCREEN,
  RESET_FCM_TOKEN,
} = require('../util/IPC_Messages');
const { APP_WINDOWS } = require('../util/Constants');
const { PRINTER_SIZES_REFID } = require('../util/PrintersUtil');
const { SWALCHECKINPUT, SWALCHECKINPUTFORSALEREPORT } = require('./RawButtons');
const {
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  CLEARSTOREDATA_ON_LOGOUT,
  SHOW_CLEAR_SALES_REPORT,
  SHOW_FULLSCEEN,
  GENERAL_SETTING_IDS,
  APP_THEME,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
} = require('../util/SettingIDs');
const {
  SWITCH_STORE_REPLY,
  STORE_SWITCH_COMPLETED,
  SWITCH_STORE,
  SHOW_NOTIFICATION,
  UDATE_STORE_DETAILS_REPLY,
} = require('../util/IPC_Messages');
require('../notifications/push_service');
const { Initializetheme } = require('../util/ThemeEngine');
require('./NotificationController');
// require('../renderer/utils/idleDetector');

const stringConstructor = 'test'.constructor;
const {
  inittoplevelsAccess,
  resetCurrentaccesslevel,
} = require('./AccesslevelManager');
const {
  sendtrackinforequest,
  checkStoreactivationexpiry,
  makeClearTokenRequest,
} = require('./Helperfunctions');
const { sendSubscription } = require('../serviceworker/subscription');
const { Swal } = require('../util/Notification');
const { askForreload } = require('./CommonUtils');
const { initializei18nforHomectrlwindowui } = require('./i18nController');
const {
  addPasscodecheckbeforeelements,
  addPasscodepermissions,
} = require('./PasscodeController');
const { fetchAllstores } = require('./RendererUtils');
const { setLocalStorage, getLocalStorage } = require('../storage');
const {
  fetchDatefromserver,
  getPrinters,
  getRunningBills,
  fetchStoredetails,
  fetchallStoredetails,
  fetchStoresettings,
  deleteStore,
  setupPrinters,
} = require('../renderer/helper/Home.helper');
const { updateSettings } = require('../renderer/helper/Settings.helper');
const { safeParse } = require('../util/RendererUtils');
const { checkIfMasterisreachable } = require('../renderer/SocketClient');
const { apiCall } = require('../services/APIService');
const { APP_TYPE } = require('../constant');
require('../renderer/sentry');
const { initializei18nforOrderSettlement } = require('./i18nController');
const { showDayClosePopup, isDayClosed } = require('./Account/utils');

window.clearPreviousinfo = false;
let updateMarginsrequired = false;
/**
 * Global variables
 */
window.reduceInventorystatus = false;
window.KOT_Printer = undefined;
window.Bill_Printer = undefined;
window.ordersAPIKey = undefined;
window.printersList = [];
window.systemPrinters = [];
window.settingsConfig = [];
window.channelloginSuccess = false;
let apptitleBar;
let currentWindow;
let windowSizeState = false;

window.ipcRenderer.on('set-date', (event, content) => {
  if (content) {
    if (Swal.isVisible()) Swal.close();
    setLocalStorage('current-date', content?.data?.date);
    window.currentDateFetchedFromBackend = content?.data?.date.split(' ')[0];
  }
});
window.ipcRenderer.on('logout-user', async () => {
  const masterPOSEndpoint = getLocalStorage('MASTER_POS_URL');
  await apiCall.post(`${masterPOSEndpoint}logout`, {
    username: window.storeDetails.username,
    isTerminal: true,
  });
});

function showswalLoader({ title, text, showConfirmButton, showLoader = true }) {
  Swal.fire({
    title,
    html: text,
    showConfirmButton,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      if (showLoader) Swal.showLoading();
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

/**
 * Logout user
 * @param {Whether to show user logout prompt} silentLogut
 */
async function logOut(silentLogut) {
  if (window.__IS_MASTER_POS__ && silentLogut !== undefined && !silentLogut) {
    if (
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1' &&
      isDayClosed(window.start_day_date, window.storeDetails.day_close_time)
    ) {
      showDayClosePopup({
        start_day_date: window.start_day_date,
        day_close_time: window.storeDetails.day_close_time,
      });
      return;
    }
    const result = await Swal.fire({
      title: $.i18n.t('controller:homeController.doYouReallyWantToLogout'),
      html: `${
        window.settingsConfig[CLEARSTOREDATA_ON_LOGOUT - 1] &&
        window.settingsConfig[CLEARSTOREDATA_ON_LOGOUT - 1].value === '1'
          ? ''
          : SWALCHECKINPUT
      }
                ${
                  window.settingsConfig[SHOW_CLEAR_SALES_REPORT - 1] &&
                  window.settingsConfig[SHOW_CLEAR_SALES_REPORT - 1].value ===
                    '0'
                    ? ''
                    : SWALCHECKINPUTFORSALEREPORT
                }`,
      confirmButtonText: $.i18n.t('controller:homeController.Yes'),
      cancelButtonText: $.i18n.t('controller:homeController.No'),
      showCancelButton: true,
      customClass: {
        popup: 'tmbill-swal-pop-up',
      },
      didOpen: () => {
        $('.swal2-html-container .has-i18n').localize();
      },
    });

    const askDeletStore = $('#swalinputcheckId').is(':checked');
    const deleteSaleReport = $('#clearReportinputcheckId').is(':checked');

    let runnigBills;
    if (deleteSaleReport) {
      const pendingBills = await getRunningBills();
      if (pendingBills && pendingBills.length > 0) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:homecontrollerNotifications.Billisrunningyoucannotlogout',
          ),
        );
      }
    }

    if (result && result.value) {
      if (navigator.onLine) {
        showswalLoader({
          title: $.i18n.t('controller:homeController.loggingOut'),
          text: $.i18n.t('controller:homeController.pleaseWait'),
        });
        try {
          // await window.betteripcRenderer.callMain(RESET_FCM_TOKEN, {});
          await makeClearTokenRequest();
          await sendtrackinforequest({ isLoggedin: false });
        } catch (error) {
          console.error(error);
        }
      }
      if (askDeletStore || deleteSaleReport) {
        if (askDeletStore && deleteSaleReport) {
          window.ipcRenderer.send('logout', {
            deleteStore: true,
            deleteSaleRecord: true,
            runnigBill: runnigBills,
            isOnline: navigator.onLine,
          });
        } else if (askDeletStore) {
          window.ipcRenderer.send('logout', {
            deleteStore: true,
            isOnline: navigator.onLine,
          });
        } else if (deleteSaleReport) {
          window.ipcRenderer.send('logout', {
            deleteSaleRecord: true,
            isOnline: navigator.onLine,
            runnigBill: runnigBills,
          });
        }

        // ipcRenderer.send('logout', {
        //     deleteStore: true,
        //     isOnline: navigator.onLine
        // });
      } else {
        window.ipcRenderer.send('logout', {
          isOnline: navigator.onLine,
        });
      }
    }
    if (Swal.isVisible()) Swal.close();
  } else {
    const result = await Swal.fire({
      title: $.i18n.t('controller:homeController.doYouReallyWantToLogout'),
      confirmButtonText: $.i18n.t('controller:homeController.Yes'),
      cancelButtonText: $.i18n.t('controller:homeController.No'),
      showCancelButton: true,
      customClass: {
        popup: 'tmbill-swal-pop-up',
      },
      didOpen: () => {
        $('.swal2-html-container .has-i18n').localize();
      },
    });
    if (result?.isConfirmed) {
      const masterPOSEndpoint = getLocalStorage('MASTER_POS_URL');
      await apiCall.post(`${masterPOSEndpoint}logout`, {
        username: window.storeDetails.username,
        isTerminal: true,
      });
      window.ipcRenderer.send('logout', undefined);
    }
  }
}

function startSubscription() {
  if (window.__IS_MASTER_POS__) {
    sendSubscription({
      store_id: window.storeDetails.store_id,
      firebaseToken: window.firebaseToken,
    });
  }
}

/**
 * Check for logo
 */
async function checkforHotellogo() {
  window.hotelogoFilepath = `${window.remote.app.getPath('userData')}/${
    window.storeDetails.store_id
  }`;
  let logoExists = false;
  if (fs.existsSync(`${window.hotelogoFilepath}.jpg`)) {
    window.hotelogoFilepath = `${window.hotelogoFilepath}.jpg`;
    logoExists = true;
  }
  if (!logoExists) {
    window.hotelogoFilepath = undefined;
  }
  if (window.orderWindowloaded) {
    window.sendLogotoworkerfromRemote();
  }
}

/**
 * Intializes the store details
 * @param {} content
 */
function initializeStoredetails(content) {
  if (content) {
    const tempStore = content.storeDetails;
    window.settingsConfig = content.settings;
    if (tempStore) {
      window.storeDetails = tempStore;
      const contactToPerson = JSON.parse(content.storeDetails.point_of_contact);
      if (apptitleBar) {
        apptitleBar.updateTitle(
          `${window.__IS_MASTER_POS__ ? 'Master POS ' : 'Terminal'} ${window.storeDetails.store_name} - ${window.storeDetails.username} - ` +
            ` Need quick support? Call now: ${
              contactToPerson && contactToPerson.poc_contact_no
                ? contactToPerson.poc_contact_no
                : ''
            } ${
              contactToPerson && contactToPerson.poc_alternate_contact_no
                ? ('|',
                  contactToPerson && contactToPerson.poc_alternate_contact_no)
                : ''
            }`,
        );
      }

      if (window.storeDetails && window.storeDetails.settings) {
        try {
          if (window.storeDetails.settings.constructor === stringConstructor) {
            window.storeSettings = safeParse(window.storeDetails.settings);
          }
          if (window.storeSettings && window.storeSettings.channelloginDone) {
            if (window.storeSettings.channelloginDone) {
              window.channelloginSuccess = true;
              if (
                window.storeSettings.channelloginDetails &&
                window.storeSettings.channelloginDetails.api_key &&
                window.storeSettings.channelloginDetails.tmpos_id
              ) {
                window.ordersAPIKey =
                  window.storeSettings.channelloginDetails.api_key;
                window.tmpos_id =
                  window.storeSettings.channelloginDetails.tmpos_id;
                window.channelStoreidlist =
                  window.storeSettings.channelloginDetails.stores_list;
              }
            } else {
              window.channelloginSuccess = false;
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
      if (
        window.storeDetails.reduce_inventory &&
        window.storeDetails.reduce_inventory === '1' &&
        window.storeDetails.warehouse_id
      ) {
        window.reduceInventorystatus = true;
      } else {
        window.reduceInventorystatus = false;
      }
      // Current currency for the selected store
      window.currency =
        window.storeDetails && window.storeDetails.currency
          ? ` ${window.storeDetails.currency} `
          : 'Rs. ';
      if (window.storeDetails.country === 'Bahrain') {
        window.currency = window.currency.trim();
        window.currency = window.currency.replace('.', '');
        window.currency += '.';
      }

      const terminal_access_levels = getLocalStorage('terminal_access_levels');
      if (!window.__IS_MASTER_POS__ && terminal_access_levels) {
        window.storeDetails.access_levels = terminal_access_levels;
      }
      checkforHotellogo();
      window.intializeNotification_fromremote();
      inittoplevelsAccess();
      addPasscodepermissions();

      if (window.__IS_MASTER_POS__) {
        setTimeout(() => {
          sendtrackinforequest({ isLoggedin: true });
          checkStoreactivationexpiry();
        }, 1000);
      }
      // Send Subscription
      setTimeout(startSubscription, 2000);
    }
  }

  fetchAllstores();
}

// No need to convert this IPC to rest as it fetches printers assigned to current device
window.ipcRenderer.on('get-system-printers-reply', (event, content) => {
  if (content) {
    const tempPrinters = JSON.parse(content);
    if (tempPrinters && tempPrinters.length > 0) {
      window.systemPrinters = tempPrinters;
      if (window.printersettingsscriptLoaded) {
        window.addSystemprinters();
      }
    }
  }
});

async function askremoteStoreprompt(storeID) {
  Swal.fire({
    title: $.i18n.t('controller:homeController.doYouWantToRemoveTheStore'),
    showCancelButton: true,
    confirmButtonText: $.i18n.t('controller:homeController.Remove'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      actions: 'tmbill-swal-actions',
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      const result2 = await deleteStore({ store_id: storeID });
      // console.log(result2);
      if (result2 && result2.status === 200) {
        window.notifyUser.showMessage(
          'success',
          $.i18n.t('controller:homeController.storeRemoved'),
        );
      }
    }
  });
}

function clearPreviousstoreData() {
  window.clearPreviousinfo = true;
  $('#refreshButton').click();
  if (window.receiptsWindowloaded) {
    $('#receiptTable').DataTable().clear().draw();
    $('#receiptitemsTable').find('tr:not(:first)').remove();
  }
  if (window.onlineordersWindowloaded) {
    $('#onlineorderslistID').empty();
    window.clearonlineOrdersdetails();
  }
  if (window.expenseTrackingscriptloaded) {
    window.clearExpensesdatafromremote();
  }
  if (window.allreportsscriptLoaded) {
    window.clearreportDatafromremote();
  }

  if (window.dashboardWindowloaded) {
    setTimeout(() => {
      window.refreshDashboardifneeded(true); // Force reload
    }, 2000);
  }
}

window.ipcRenderer.on('set-access-levels', (event, content) => {
  Object.assign(window.storeDetails, { access_levels: content.access_levels });
  inittoplevelsAccess();
  addPasscodepermissions();
});

window.ipcRenderer.on('set-store-details', async (event, response) => {
  if (window.__IS_MASTER_POS__) {
    const { storeDetails, doRoundOff, roundOffUpto } = response;
    if (storeDetails.store_name !== window.storeDetails.store_name) {
      const contactToPerson = JSON.parse(storeDetails.point_of_contact);
      if (apptitleBar) {
        apptitleBar.updateTitle(
          `${storeDetails.store_name} - ${storeDetails.username} - ` +
            ` Need quick support? Call now: ${
              contactToPerson && contactToPerson.poc_contact_no
                ? contactToPerson.poc_contact_no
                : ''
            } ${
              contactToPerson && contactToPerson.poc_alternate_contact_no
                ? ('|',
                  contactToPerson && contactToPerson.poc_alternate_contact_no)
                : ''
            }`,
        );
      }
    }
    if (storeDetails) window.storeDetails = storeDetails;
    if (doRoundOff) window.DO_BILL_ROUNDOFF = doRoundOff;
    if (roundOffUpto) {
      window.ROUNDOFF_UPTO = roundOffUpto;
    }
  }
});

/**
 * Now change the settings of current store
 * @param {Selected store id} selectedStoreid
 */
function switchStore(selectedStoreid) {
  Swal.fire({
    title: $.i18n.t('controller:homeController.switchingStores'),
    text: $.i18n.t(
      'controller:homeController.hangOnThereSitBackAndRelaxWhileWeswitchStore',
    ),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      window.ipcRenderer.send(SWITCH_STORE, {
        store_id: String(selectedStoreid),
      });
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

/**
 * Show the pop up to change store
 */
function showSwitchstorepopupnew(storesData) {
  const storeOptions = {};
  const filteredData = {};
  const htmlContent = $('<div>', {
    class: 'swal-storelist-container selectable-list-container',
  });
  const storeslist = $('<ul>', {
    id: 'swalswitchStorelist',
    class: 'swal-storelist selectable-list',
  });

  storesData.forEach((store) => {
    if (window.storeDetails.store_name !== store.store_name) {
      storeOptions[store.store_name] = store.store_name;
      filteredData[store.store_name] = store.store_id;
    }
    const item = $('<li>', {
      class: `swal-storelist-item }`,
      html: `<button>${store.store_name}</button>`,
    }).attr('store_id', store.store_id);

    if (window.storeDetails.store_name === store.store_name) {
      item.addClass('selected');
    } else {
      item.append(`<i class='fas fa-times-circle'/>`);
    }
    storeslist.append(item);
    // index++;
  });

  htmlContent.append(storeslist);
  Swal.fire({
    title: $.i18n.t('controller:homeController.switchOutlet'),
    html: htmlContent,
    didOpen: () => {
      $('#swalswitchStorelist li button').on('click', (e) => {
        const selectedStoreid = $(e.target).parent().attr('store_id');
        if (selectedStoreid) {
          if (window.storeDetails.store_id === selectedStoreid) {
            Swal.close();
          } else {
            switchStore(selectedStoreid);
          }
        }
      });
      $('#swalswitchStorelist li i').on('click', async (e) => {
        const selectedStoreid = $(e.target).parent().attr('store_id');
        if (selectedStoreid) {
          if (window.storeDetails.store_id === selectedStoreid) {
            Swal.close();
          } else {
            askremoteStoreprompt(selectedStoreid);
          }
        }
      });
    },
    width: '23em',
    focusConfirm: false,
    confirmButtonText: $.i18n.t('controller:homeController.addOutlet'),
    allowOutsideClick: false,
    showCancelButton: true,
    cancelButtonText: $.i18n.t('controller:homeController.Cancel'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      actions: 'tmbill-swal-actions',
    },
  }).then((result) => {
    if (result.value) {
      window.ipcRenderer.send('logout', { addStore: true });
    }
  });
}

/**
 * Opens settings window
 */
function openSettingsWindow() {
  // chooseTheme();
  if (!window.settingscriptLoaded) {
    $('#settingsModalBodyid').load('Settings.html');
  } else {
    $('#settingsModal').modal('show');
    window.reinitSettings();
    if (window.printersettingsscriptLoaded) {
      window.addSystemprinters();
    }
  }
}

/**
 * Opens the window
 * @param {Window to open} windowToopen
 */
function openWindow(windowToopen) {
  if (currentWindow === windowToopen) {
    return;
  }
  $('#expenseManagementwindowWrapperid').hide();

  $('#fcmTestwindowWrapperid').hide();

  $('#menu-wapper-id li').removeClass('selected-menu');
  currentWindow = windowToopen;

  switch (windowToopen) {
    case 'order':
      if (!window.orderWindowloaded) {
        $('#orderwindowWrapperid').load('Table.html');
      } else {
        window.refreshOrderwindowifneeded();
      }
      $('#orderwindowWrapperid').show();
      $('#receiptwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#reportswindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();

      $('#order-li-item').addClass('selected-menu');
      break;

    case 'orderSettlement':
      if (!window.orderSettlementWindowloaded) {
        $('#orderSettlementwindowWrapperid').load(
          'OrderSettlement/OrderSettlementWindow.html',
        );
      } else {
        window.refreshOrderSettlementwindowfromremote();
      }
      $('#orderSettlementwindowWrapperid').show();
      $('#orderwindowWrapperid').hide();
      $('#receiptwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#reportswindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#itemmastermenuwindowWrapper').hide();

      $('#order-settlement-li-item').addClass('selected-menu');
      break;
    case 'receipt':
      if (!window.receiptsWindowloaded) {
        $('#receiptwindowWrapperid').load('Receipts.html');
      } else {
        window.refreshReceiptwindowfromremote();
      }
      $('#receiptwindowWrapperid').show();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#reportswindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();

      $('#receipt-li-item').addClass('selected-menu');
      break;
    case 'dashboard':
      if (!window.dashboardWindowloaded) {
        showswalLoader({
          title: $.i18n.t('controller:homeController.Dashboard'),
          text: $.i18n.t('controller:homeController.loadingDashboard'),
        });
        $('#dashwindowWrapperid').load('Dashboard.html', () => {
          setTimeout(() => {
            if (Swal.isVisible()) Swal.close();
          }, 1000);
        });
      } else {
        window.refreshDashboardifneeded();
      }
      $('#dashwindowWrapperid').show();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#reportswindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();

      $('#dashboard-li-item').addClass('selected-menu');
      break;
    case 'online':
      if (!window.onlineordersWindowloaded) {
        $('#onlineorderswindowWrapperid').load('Onlineorders.html');
      }
      $('#onlineorderswindowWrapperid').show();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#reportswindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();
      $('#online-li-item').addClass('selected-menu');
      break;
    case 'allreports':
      if (!window.allreportsscriptLoaded) {
        $('#reportswindowWrapperid').load('Allreports.html');
      }

      $('#reportswindowWrapperid').show();
      $('#onlineorderswindowWrapperid').hide();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();
      $('#allreports-li-item').addClass('selected-menu');
      break;
    case 'master':
      if (!window.mastermenuScriptloaded) {
        $('#mastermenuwindowWrapperid').load('Mastermenu.html');
      }
      $('#mastermenuwindowWrapperid').show();
      $('#reportswindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();

      $('#mastermenu-li-item').addClass('selected-menu');
      break;

    case 'menuManagement':
      if (!window.menuManagamentScriptloaded) {
        $('#menuManagementwindowWrapperid').load('MenuManagement.html');
      }
      // show/hide respective wrappers
      $('#menuManagementwindowWrapperid').show();
      $('#reportswindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();

      // close message container
      $('#checkAllShiftCloseValidationMessageContianerId').hide();

      // highlight the menu item
      $('#menu-wapper-id li').removeClass('selected-menu');

      // If you changed HTML to use unique li id:
      // $('#menuManagement-li-item').addClass('selected-menu');

      // Or if you prefer to use the anchor -> li traversal (works without changing HTML)
      $('#menuManagementIcon').closest('li').addClass('selected-menu');

      break;

      if (!window.menuManagamentScriptloaded) {
        $('#menuManagementwindowWrapperid').load('MenuManagement.html');
      }
      $('#menuManagementwindowWrapperid').show();
      $('#reportswindowWrapperid').hide();
      $('#onlineorderswindowWrapperid').hide();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#digitalorderswindowWrapperid').hide();
      // $('#mastermenuwindowWrapperid').show();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();

      // close messgae container
      $('#checkAllShiftCloseValidationMessageContianerId').hide();
      // $('#mastermenu-li-item').addClass('selected-menu');
      break;
    case 'digital':
      console.log(
        'window.digitalOrderswindowloaded::',
        window.digitalOrderswindowloaded,
      );
      if (!window.digitalOrderswindowloaded) {
        $('#digitalorderswindowWrapperid').load('Digitalorders.html');
      }
      $('#digitalorderswindowWrapperid').show();
      $('#onlineorderswindowWrapperid').hide();
      $('#receiptwindowWrapperid').hide();
      $('#orderwindowWrapperid').hide();
      $('#dashwindowWrapperid').hide();
      $('#reportswindowWrapperid').hide();
      $('#mastermenuwindowWrapperid').hide();
      $('#menuManagementwindowWrapperid').hide();
      $('#itemsManagementwindowWrapperid').hide();
      $('#crmwindowWrapperid').hide();
      $('#userManagementwindowWrapperid').hide();
      $('#walletManagementwindowWrapperid').hide();
      $('#orderSettlementwindowWrapperid').hide();
      $('#digital-li-item').addClass('selected-menu');
      break;
    case 'settings':
      openSettingsWindow();
      break;
    default:
      break;
  }
}

async function showChangeoutlet() {
  try {
    const storesList = await fetchallStoredetails();
    // console.log(storesList);
    try {
      if (storesList && storesList.length > 0) {
        showSwitchstorepopupnew(storesList);
      }
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.error(error);
  }
}

function initSetupForTerminal() {
  try {
    $('#dashboardIcon,#mastermenuIcon').hide();
    $(
      '#digitalOrdersIcon,#onlineorderIcon,#changeStoreicon,#customLinksIconId',
    ).hide();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Initialize the action listeners
 */
function addActionListeners() {
  addPasscodecheckbeforeelements();
  $('#logoutIcon').on('click', () => {
    logOut(false);
  });

  $('#settingsButton').on('click', function () {
    openSettingsWindow();
    // $(this).contextMenu();
  });

  $('#receiptIcon').on('click', () => {
    openWindow('receipt');
  });

  $('#orderIcon').on('click', () => {
    openWindow('order');
  });

  // $('#orderSettlementIcon').on('click', () => {
  //   openWindow('orderSettlement');
  // });

  $('#orderSettlementIcon').on('click', () => {
    openWindow('orderSettlement');

    // Wait for content to load, then initialize i18n
    setTimeout(() => {
      initializei18nforOrderSettlement();
    }, 300);
  });

  $('#dashboardIcon').on('click', () => {
    openWindow('dashboard');
  });

  $('#allreportsIcon').on('click', () => {
    openWindow('allreports');
  });
  $('#mastermenuIcon').on('click', () => {
    openWindow('master');
  });

  $('#menuManagementIcon').on('click', () => {
    openWindow('menuManagement');
  });

  $('#digitalOrdersIcon').on('click', () => {
    openWindow('digital');
  });

  $('#onlineorderIcon').on('click', () => {});

  $('#changeStoreicon').on('click', () => {
    showChangeoutlet();
  });

  $('#fullScreenIcon').on('click', () => {
    const fullscreenIcon = document.getElementById('fullScreenIcon');
    if (windowSizeState) {
      windowSizeState = !windowSizeState;
      window.ipcRenderer.send(TOGGLE_FULLSCREEN, { isFullScreen: true });
      fullscreenIcon.classList.remove('fa-expand');
      fullscreenIcon.classList.add('fa-compress');
    } else {
      windowSizeState = !windowSizeState;
      window.ipcRenderer.send(TOGGLE_FULLSCREEN, { isFullScreen: false });
      fullscreenIcon.classList.remove('fa-compress');
      fullscreenIcon.classList.add('fa-expand');
    }
  });

  $('#settingsModal,#userpasscodeModalid').modal({
    show: false,
    backdrop: 'static',
  });

  $('#posDisconnectedModalid').modal({
    backdrop: 'static',
    keyboard: false,
    show: false,
  });

  $('#checkSocketConnectionButtonid').on('click', () => {
    checkIfMasterisreachable()
      .then((apistatus) => {
        if (!status && !apistatus) {
          console.warn(`Message="Looks Like Master POS Is Not Live."`);
          // We can show some ui here and set the UI flag
          $('#posDisconnectedModalid').modal('show');
        } else {
          $('#posDisconnectedModalid').modal('hide');
        }
      })
      .catch((e) => console.error(e));
  });

  $('#settingsModal').on('hidden.bs.modal', () => {
    if (window.orderWindowloaded) {
      window.reloadOrdersettings();
    }
  });

  if (!window.__IS_MASTER_POS__) {
    initSetupForTerminal();
  }
}

function actionsAfterstorechange(params) {
  if (params.openWindow) {
    openWindow(params.openWindow);
  }
  if (params.clickAction) {
    $(params.clickAction).click();
  }
}

function openWhatsnew() {
  if (!window.whatsnewscriptLoaded) {
    $('#changelogModalBodyid').load('Changelog.html');
  } else {
    $('#changelogModal').modal('show');
  }
}

function initializeSettingscontext() {
  $.contextMenu({
    selector: '#settingsButton',
    className: 'settingsButton-custom-menu',
    trigger: 'none',
    position() {},
    callback(key, options) {
      if (key && options.$trigger && options.$trigger.length > 0) {
        switch (key) {
          case 'logout':
            logOut(false);
            break;
          case 'settings':
            openSettingsWindow();
            break;
          case 'whatsnew':
            openWhatsnew();
            break;
          default:
            break;
        }
      }
    },
    items: {
      whatsnew: { name: $.i18n.t('controller:homeController.whatsNew') },
      settings: { name: $.i18n.t('controller:homeController.openSettings') },
      // "logout": { name: "Logout" },
    },
  });
}

async function fetchandInitsettings() {
  const receivedSettings = await fetchStoresettings();
  let terminalSettings;
  if (!window.__IS_MASTER_POS__) {
    terminalSettings = await window.betteripcRenderer.callMain(
      'get-terminal-settings',
      {
        settingId: [APP_THEME],
      },
    );
  }
  if (receivedSettings && receivedSettings.length) {
    try {
      window.settingsConfig = receivedSettings;
      if (window.settingsConfig && window.settingsConfig.length > 0) {
        let themeSettings = window.settingsConfig[0];
        if (
          !window.__IS_MASTER_POS__ &&
          terminalSettings &&
          terminalSettings.length
        ) {
          themeSettings = terminalSettings[0];
        }
        if (themeSettings && themeSettings.value) {
          window.Config.theme = themeSettings.value;
        }
      }
      Initializetheme({ apptitleBar });
    } catch (error) {
      window.settingsConfig = [];
    }
    if (window.settingsConfig[SHOW_FULLSCEEN - 1] !== undefined) {
      if (window.settingsConfig[SHOW_FULLSCEEN - 1].value !== '1') {
        windowSizeState = true;
      }
    }
  } else {
    window.settingsConfig = [];
  }
}

function initialSetup() {
  openWindow('order');
  initializeSettingscontext();
  setTimeout(() => {
    fetchDatefromserver();
  }, 1000);
  fetchandInitsettings();
}

/**
 * Sends bill details to the requested window
 * @param {Bill details} content
 */
function sendBilldetailsbywindow(content) {
  if (
    content &&
    content.requestFrom &&
    content.billDetails &&
    Array.isArray(content.billDetails) &&
    content.billDetails.length > 0
  ) {
    switch (content.requestFrom) {
      case APP_WINDOWS.ORDER:
        break;
      case APP_WINDOWS.REPORT:
        if (window.allreportsscriptLoaded)
          window.showOrderdetailsfromremote_forreport(content);
        break;
      default:
        break;
    }
  }
}

window.ipcRenderer.on(
  ORDER_IPC.GET_ORDER_DETAILS_REPLY,
  async (event, content) => {
    if (Swal.isVisible()) Swal.close();
    try {
      sendBilldetailsbywindow(JSON.parse(content));
    } catch (error) {
      console.log(error);
    }
  },
);

initialSetup();

/**
 * Create a custome title bar for a window
 */
async function createtitleBar() {
  try {
    // let platform = process.platform;
    // if (platform !== 'darwin') {
    const menu = new window.remote.Menu();
    menu.append(new window.remote.MenuItem({}));
    apptitleBar = new Titlebar({
      backgroundColor: TitlebarColor.fromHex('#fff'),
      icon: '../assets/logo.ico',
    });
    // }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Application Entry Point
 */
function initializeTitlebar() {
  Initializetheme({ apptitleBar });
  createtitleBar();
}

/**
 * Show's system notification
 * @param {Payload data} payload
 */
function showSystemnotification(payload) {
  if (payload && payload.body) {
    let { body } = payload;
    if (payload.body.constructor === 'test'.constructor) {
      body = JSON.parse(payload.body);
    }

    const msg = body.msg ? body.msg : '';
    const myNotification = new Notification(payload.title, {
      body: msg,
      title: payload.title || 'TMBill Atlantic POS',
      icon: payload.image,
    });

    myNotification.onclick = () => {
      const mainWindow = window.remote.getCurrentWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    };
  }
}

window.ipcRenderer.on(SHOW_NOTIFICATION, (event, content) => {
  if (content) {
    try {
      let data = content;
      if (content.constructor === 'test'.constructor) {
        data = JSON.parse(content);
      }
      if (data.issystemNotification && data.issystemNotification) {
        let payload;
        if (window.channelloginSuccess) {
          payload = data.data.notification;
        } else {
          payload = data.data.notification;
        }
        showSystemnotification(payload);
      } else {
        if (Swal.isVisible()) Swal.close();
        if (data.showPrompt && data.promptTitle) {
          showswalLoader({
            title: data.promptTitle,
            text: data.promptText,
            showConfirmButton: data.showConfirmButton || false,
            showLoader: data.showLoader || false,
          });
        } else {
          window.notifyUser.showMessage(data.type, data.message, data.delay);
        }
        if (data.data) {
          console.log(JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.log('Notification parse error', error);
    }
  }
});

function getPreviewmargins() {
  const currentsizeId = $('#preview-footer-actionsid').attr('size');
  let currentSize = '80mm';
  if (currentsizeId) {
    switch (Number(currentsizeId)) {
      case PRINTER_SIZES_REFID.PRINTER_58MM.ID:
        currentSize = PRINTER_SIZES_REFID.PRINTER_58MM.SIZE;
        break;
      case PRINTER_SIZES_REFID.PRINTER_80MM.ID:
        currentSize = PRINTER_SIZES_REFID.PRINTER_80MM.SIZE;
        break;
      default:
        break;
    }
  }

  const leftMargin = $('#currentleftMarginlabel').html();
  currentSize = Number(String(currentSize).replace('mm', ''));
  const widthDecrementcounter = Number($('#currentrightMarginlabel').html());
  if (currentSize > widthDecrementcounter) {
    currentSize -= widthDecrementcounter;
  }

  return [`${leftMargin}px`, `${currentSize}mm`];
}

function sendUpdatemarginsrequest() {
  const value = getPreviewmargins().join(' ');
  const size = $('#preview-footer-actionsid').attr('size');

  if (size && value && window.settingsConfig) {
    switch (Number(size)) {
      case PRINTER_SIZES_REFID.PRINTER_58MM.ID:
        window.settingsConfig[PRINTER_58_CONFIG - 1].value = value;
        updateSettings({
          id: PRINTER_58_CONFIG,
          value,
        });
        break;
      case PRINTER_SIZES_REFID.PRINTER_80MM.ID:
        window.settingsConfig[PRINTER_80_CONFIG - 1].value = value;
        updateSettings({
          id: PRINTER_80_CONFIG,
          value,
        });
        break;
      default:
        break;
    }
  }
}

function updateMargins(increment, _targetElement) {
  updateMarginsrequired = true;
  let currentCounter = $(_targetElement).html();
  try {
    currentCounter = Number(currentCounter);
  } catch (error) {
    currentCounter = 0;
  }
  // eslint-disable-next-line no-unused-expressions
  if (increment) {
    currentCounter += 1;
  } else {
    currentCounter -= 1;
  }

  if (currentCounter < 0) {
    currentCounter = 0;
  }
  $(_targetElement).html(currentCounter);

  const margins = getPreviewmargins();

  $('#previewContainerid').css({
    'margin-left': margins[0],
    width: margins[1],
  });
}

function addPreviewlisteners() {
  $('#previewModal').on('hidden.bs.modal', () => {
    if (updateMarginsrequired) {
      sendUpdatemarginsrequest();
    }
    updateMarginsrequired = false;
  });

  $('#preview-footer-actionsid').hide();
  $('#showPrinterconfig').attr('value', '2');

  $('#showPrinterconfig').on('click', function () {
    $(this).removeClass();
    if ($(this).attr('value') === '1') {
      $(this).addClass('fas fa-arrow-down');
      $(this).attr('value', '2');
      $('#preview-footer-actionsid').hide();
    } else {
      $(this).addClass('fas fa-arrow-up');
      $(this).attr('value', '1');
      $('#preview-footer-actionsid').show();
    }
  });

  $('#minusleftMarginid').on('click', () => {
    updateMargins(false, '#currentleftMarginlabel');
  });
  $('#plusleftMarginid').on('click', () => {
    updateMargins(true, '#currentleftMarginlabel');
  });

  $('#minusrightMarginid').on('click', () => {
    updateMargins(false, '#currentrightMarginlabel');
  });
  $('#plusrightMarginid').on('click', () => {
    updateMargins(true, '#currentrightMarginlabel');
  });
}
/**
 * Global function to open a window
 */
window.openwindowFromremote = function (param) {
  if (param) {
    openWindow(param);
  }
};

async function relogin() {
  window.ipcRenderer.send('__RELOGIN__');
}

async function fetchandInitstoredata() {
  try {
    const data = await fetchStoredetails();
    initializeStoredetails(data);
  } catch (error) {
    console.error(error);
  }
}

window.ipcRenderer.on(UDATE_STORE_DETAILS_REPLY, async (event, content) => {
  if (content) {
    initializeStoredetails(content);
  } else {
    fetchandInitstoredata();
  }
});

window.ipcRenderer.on('RELOGIN_STORE', () => {
  setTimeout(relogin, 2000);
  window.ipcRenderer.send(DESTROY_USER_SESSION);
});

window.ipcRenderer.on(NEW_STORE_ADDED_UPDATED, () => {
  window.ipcRenderer.send(STORE_SWITCH_COMPLETED);
});

window.ipcRenderer.on('get-printers-reply', (event, content) => {
  if (content) {
    setupPrinters(safeParse(content));
  }
});

async function initializetmbillApp() {
  await fetchandInitstoredata();
  $('.se-pre-con').fadeOut('slow');
  addActionListeners();
  getPrinters();
  addPreviewlisteners();

  setTimeout(() => {
    if ($.i18n) {
      initializei18nforHomectrlwindowui();
    } else {
      setTimeout(initializei18nforHomectrlwindowui, 400);
    }
  }, 500);
}

window.reloginfromremote = function () {
  // relogin();
  setTimeout(relogin, 2000);
};

window.changeTheme = function () {
  Initializetheme({ apptitleBar });
};

window.ipcRenderer.on(SWITCH_STORE_REPLY, (event, content) => {
  if (content) {
    try {
      if (content.logoutneeded) {
        if (content.logoutneeded) {
          Swal.close();
          logOut(true);
          return;
        }
      }
      if (content.channellogoutNeeded) {
        if (content.channellogoutNeeded) {
          window.channelloginSuccess = false;
        }
      }
      if (content.miscActions) {
        actionsAfterstorechange(content.miscActions);
      }
      if (content.pos_settings) {
        window.settingsConfig = content.pos_settings;
      }

      if (content.token) {
        setLocalStorage('TOKEN', content.token);
        setLocalStorage('X_USERNAME', content.userName);
      }
    } catch (error) {
      console.log(error);
    }
  }
  Swal.close();
  resetCurrentaccesslevel();
  fetchandInitstoredata();
  clearPreviousstoreData();
  window.notifyUser.showMessage(
    'success',
    $.i18n.t('controller:homeController.switchCompletedReloadIsRecommended'),
  );
  setTimeout(() => {
    askForreload();
  }, 400);

  window.ipcRenderer.send(STORE_SWITCH_COMPLETED, '');
});

initializeTitlebar();
initializetmbillApp();

module.exports = {
  openWindow,
};
