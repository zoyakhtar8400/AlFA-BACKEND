/* eslint-disable func-names */
/* eslint-disable no-console */
// const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fileSystem = require('fs');
const { debounce } = require('lodash');

const {
  setupTitlebar,
  attachTitlebarToWindow,
} = require('custom-electron-titlebar/main');
require('./src/com/tmbill/main_controllers/TitleBar');
require('./src/com/tmbill/js/ModuleImportHelper');
require('./src/com/tmbill/main/utils/Settings.store');
const path = require('path');
const url = require('url');
const { enable: enableWebContents } = require('@electron/remote/main');
// const { setup: setupPushReceiver } = require('electron-push-receiver');
const {
  setup: setupPushReceiver,
} = require('./src/com/tmbill/packages/electron-push-receiver-v2');
const isDev = require('./src/com/tmbill/packages/electron-is-dev');
const { Config: appConfig } = require('./src/com/tmbill/config/config');
const { initSentryformain } = require('./src/com/tmbill/main/sentry');
// const registerPrintIPC = require('./src/com/tmbill/main/IPC/printIPC');

global.Config = appConfig;

// require('@electron/remote/main').initialize();

const {
  SYNC_BILL,
  SYNC_BILL_REPLY,
  ORDER_IPC,
  RELOAD_APP,
  DESTROY_USER_SESSION,
  REMOTE_FORCE_LOGUT,
  LOGOUT_ON_CLOSE_DAY_SHIFT,
  CHECK_FOR_UPDATES,
  DATA_SYNCING_ON_LOGOUT,
  TOGGLE_FULLSCREEN,
  LOGOUT_USER,
} = require('./src/com/tmbill/util/IPC_Messages');
const umzug = require('./src/com/tmbill/database/UmzufConfig');
require('./src/com/tmbill/main_controllers/IPCListeners');
const {
  checkIfsyncisneeded,
  startSync,
  deletestoreData,
  createSyncinterval,
  throttledStartSync,
  callStartSync,
  controlledStartSync,
} = require('./src/com/tmbill/services/SyncService');
require('./src/com/tmbill/notifications/Main_push_listener_service');
const {
  initializeListeners,
  setBillnumberlengthformain,
} = require('./src/com/tmbill/js/MainIPClisteners');

initializeListeners();
const { CURRENT_STORE } = require('./src/com/tmbill/util/SettingIDs');
const {
  destroyallJobs,
  startcronJob,
  startdatabasebackupJob,
} = require('./src/com/tmbill/util/Jobs');
const { checkPortinuse } = require('./src/com/tmbill/util/CheckPort');
const {
  resetCurrentaccesslevel,
} = require('./src/com/tmbill/js/AccesslevelManager');
const { initializeWorkerwindow } = require('./src/com/tmbill/Worker');
const { DEVMODE_SECRET } = require('./src/com/tmbill/util/Constants');
require('./src/com/tmbill/main_controllers/OnlineOrder');
require('./src/com/tmbill/main_controllers/Mainprocessmisc');
require('./src/com/tmbill/main_controllers/SyncListeners');
require('./src/com/tmbill/main_controllers/Utils/MiscIPCListeners');
const {
  deleteSalesRecord,
} = require('./src/com/tmbill/main_controllers/DeleteSalesRecord');
const {
  HandleExitEvent,
} = require('./src/com/tmbill/main_controllers/ExitHandler');
const {
  paymentDiffcallAPI,
} = require('./src/com/tmbill/main_controllers/APICalls');
const {
  deleteNotificationsOfBeforeThirtyDays,
} = require('./src/com/tmbill/main_controllers/WaiterNotification');
const {
  checkForUpdates,
} = require('./src/com/tmbill/main_controllers/AutoUpdater');
const { setupinstanceLock } = require('./src/com/tmbill/main/utils/Lock');
const {
  Settings,
  Store,
  StoreMapper,
  UserLoginStatus,
} = require('./src/com/tmbill/js/database');
const {
  updateSettingsOnNotification,
} = require('./src/com/tmbill/main_controllers/UpdateDataOnNotifications');
const { safeParseformain } = require('./src/com/tmbill/main_controllers/Utils');
const {
  startItemOutBoxJob,
  stopItemOutBoxJob,
} = require('./src/com/tmbill/main/services/ItemStock.service');
require('./src/com/tmbill/main/IPC/Printer.ipc');
require('./src/com/tmbill/main/IPC/Settings.ipc');
require('./src/com/tmbill/main/CustomerDisplay');

global.mainWindow = undefined;
let splashscreenWindow;
global.currentPlatform = process.platform;
let commandlineArgs;
// Current store details
global.storeDetails = undefined;
let eventObject;

setupTitlebar();
async function initServer() {
  // eslint-disable-next-line global-require
  require('./src/com/tmbill/server/Server');
}
/**
 * Returns the window to load
 */
function getWindowtoload() {
  let filetoLoad = global.Config.template.LOGIN;

  if (global.storeDetails && global.storeDetails.settings) {
    try {
      const settings = JSON.parse(global.storeDetails.settings);
      if (settings.userlogged) {
        filetoLoad = global.Config.template.HOME;
      }
      if (settings.expirationDate) {
        // Handle this case
      }
    } catch (error) {
      console.error(error);
    }
  }
  return filetoLoad;
}

/**
 * Get the current store details
 */
async function getStoredetails() {
  try {
    const storeResult = await Settings.findOne({
      raw: true,
      limit: 1,
      attributes: ['value'],
      where: {
        id: CURRENT_STORE,
      },
    });

    if (storeResult) {
      const currentstoreID = storeResult.value;
      if (currentstoreID) {
        const result = await Store.findAll({
          raw: true,
          limit: 1,
          include: [
            {
              model: StoreMapper,
              attributes: ['tmchannel_store_id'],
            },
          ],
          where: {
            store_id: currentstoreID,
          },
        });
        if (result && result.length > 0) {
          // eslint-disable-next-line prefer-destructuring
          global.storeDetails = result[0];
          setBillnumberlengthformain();
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  return global.storeDetails;
}

global.getStoredetailsforremote = async function () {
  await getStoredetails();
};

function showPortinuse() {
  const options = {
    type: 'error',
    buttons: ['Continue without server', 'Close app'],
    defaultId: 1,
    title: 'Port is in use.',
    message: 'Seems like other application is using the port we use.',
    detail:
      "Please restart the application.If the problem still persist restart the computer.You can still use the POS but KDS and CSK app won't work.",
  };

  // Synchronous usage
  const dialogResult = dialog.showMessageBoxSync(global.mainWindow, options);
  if (dialogResult && dialogResult === 1) {
    app.quit();
  }
}

/**
 * Opens the login window.
 */
async function createWindow() {
  console.log('load main window');
  commandlineArgs = process.argv.slice(2);

  try {
    await umzug.Up();
  } catch (err) {
    console.warn('Database migration warning:', err.message);
  }

  try {
    await getStoredetails();
  } catch (err) {
    console.warn('Store details warning:', err.message);
  }

  if (process.platform === 'win32') {
    app.setAppUserModelId('com.techmainstay.tmbill');
  }
  app.setAppUserModelId(process.execPath);
  const options = {
    width: 900,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      additionalArguments: [
        `--appVersion=${app.getVersion()}`,
        `--appType=MASTER_POS`,
      ],
      preload: path.join(__dirname, './Preload.js'),
    },
    show: false,
    titleBarStyle: 'hidden',
    // fullscreenable: true, // Allows fullscreen mode
    // skipTaskbar: true,
    // frame: false,
  };

  // if (process.platform !== 'darwin') {
  //   Object.assign(options, {
  //     titleBarStyle: 'hidden',
  //   });
  // }

  global.mainWindow = new BrowserWindow(options);
  enableWebContents(global.mainWindow.webContents);
  Menu.setApplicationMenu(null);

  const filetoLoad = getWindowtoload();
  global.mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, filetoLoad),
      protocol: 'file:',
      slashes: true,
    }),
  );

  global.mainWindow.on('closed', () => {
    global.mainWindow = null;
  });

  global.mainWindow.setMenu(null);
  setupPushReceiver(global.mainWindow.webContents);

  global.mainWindow.once('ready-to-show', () => {
    console.log('show window');
    global.mainWindow.show();
    if (splashscreenWindow) {
      splashscreenWindow.close();
    }
    // checkForUpdates({ silent: true });
    // setTimeout(checkForUpdates, 10000);

    createSyncinterval();
    deleteNotificationsOfBeforeThirtyDays();
    setTimeout(() => {
      if (global.storeDetails && global.storeDetails?.extra_info) {
        const extraInfo = JSON.parse(global.storeDetails?.extra_info);
        if (extraInfo && extraInfo.auto_update_pos) {
          checkForUpdates({ silent: false, UserChecking: false });
        }
      }
    }, 100);

    if (
      global.Config.isDev ||
      (commandlineArgs && commandlineArgs.includes(DEVMODE_SECRET)) ||
      ['development', 'testing'].includes(process.env.NODE_ENV)
    ) {
      global.mainWindow.webContents.openDevTools();
    }
  });

  global.mainWindow.on('close', HandleExitEvent);

  checkPortinuse(3000)
    .then(({ portOccupied }) => {
      if (portOccupied) {
        // Show warning
        showPortinuse();
      } else {
        initServer();
      }
    })
    .catch((error) => {
      console.error(error);
    });

  umzug.checkifresetisRequired2();
  startcronJob({ callBack: umzug.checkifresetisRequired2 });
  initializeWorkerwindow(global.mainWindow);
  startdatabasebackupJob();
  attachTitlebarToWindow(global.mainWindow);
}

/**
 * Opens splash screen window.
 */
function openSplashscren() {
  splashscreenWindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
  });
  splashscreenWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, global.Config.template.SPLASH),
      protocol: 'file:',
      slashes: true,
    }),
  );
  createWindow();
}

app.on('ready', () => {
  // eslint-disable-next-line no-use-before-define
  initialize();
  openSplashscren();
});
// app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  destroyallJobs();
  stopItemOutBoxJob();
});

app.on('activate', () => {
  if (global.mainWindow === null) {
    createWindow();
  }
});

if (!process.env.MULTI_SETUP) {
  setupinstanceLock();
}

/**
 * This will initialize the config file with
 * the database path
 */
function initialize() {
  const dir = app.getPath('home') + global.Config.DBConfig.directory;
  if (!fileSystem.existsSync(dir)) {
    fileSystem.mkdirSync(dir);
  }
  global.Config.sourcePath = __dirname;
  global.Config.basePath = path.join(__dirname, '/src/com/tmbill/migrations');

  global.Config.DBConfig.path =
    app.getPath('home') +
    global.Config.DBConfig.directory +
    global.Config.DBConfig.DBName;

  // Initialize sentry
  initSentryformain();
  // setTimeout(() => {
  //   startItemOutBoxJob();
  // }, 25000);
}

/**
 * Updates the settings for a store
 */
async function updateStoresettings() {
  try {
    await Store.update(
      { settings: { userlogged: false } },
      { where: { store_id: global.storeDetails.store_id } },
    );
  } catch (error) {
    console.log(error);
  }
}

/**
 * Called after successful login
 * @param {Store details} arg
 */
async function loginPostprocessing(arg) {
  if (arg) {
    try {
      console.log('login success');
      const date = new Date();
      date.setDate(date.getDate() + 10);
      // eslint-disable-next-line no-param-reassign
      arg.storedetails.settings = {
        userlogged: true,
        expirationDate: date.getTime(),
      };
      let notificationEmails = [];
      if (arg.storedetails.config.notification_emails) {
        notificationEmails =
          arg.storedetails.config.notification_emails.split(',');
      }
      let contactPhone = [];
      if (arg.storedetails.config.contact_phone) {
        contactPhone = arg.storedetails.config.contact_phone.split(',');
      }
      const extraInfo = {
        pincode: arg.storedetails.pin_code || null,
        gstNo: arg.storedetails.gst_no || null,
        isHBIntegrate: arg.storedetails.hostbook_integration || null,
        isReeloIntegrate: arg.storedetails.config.reelo_integration || null,
        channels_enabled: arg.storedetails.config.channels_enabled || null,
        enable_multipricing: arg.storedetails.config.enable_multipricing || 0,
        enable_customer_loyalty:
          arg.storedetails.config.enable_customer_loyalty || 0,
        bharatpe_integration: arg.storedetails.config.bharatpe_integration || 0,
        phonepe_integration: arg.storedetails.config.phonepe_integration || 0,
        zomato_pay_integration:
          arg.storedetails.config.zomato_pay_integration || 0,
        sunmi_integration: arg.storedetails.config.sunmi_integration || 0,
        tally_integration: arg.storedetails.config.tally_integration || 0,
        call_center: arg.storedetails.config.call_center || null,
        bill_number_length: arg.storedetails.config.bill_number_length || 0,
        auto_update_pos: arg.storedetails.config.auto_update_pos || 0,
        verify_pos_system_date:
          arg.storedetails.config.verify_pos_system_date || 0,
        pos_settings: arg.storedetails.pos_settings || null,
        reset_order_no_date:
          arg.storedetails.config.reset_order_no_date || null,
        reset_order_no_in_days:
          arg.storedetails.config.reset_order_no_in_days || null,
        generateOrderTypeWiseOrderNumber:
          arg.storedetails.config.generateOrderTypeWiseOrderNumber || 0,
        partial_order_accept:
          arg.storedetails?.ondc?.partial_accept_order || null,
        allow_cancel_item: arg.storedetails?.ondc?.allow_cancel_item || null,
        notification_emails: notificationEmails,
        contact_phone: contactPhone,
        dial_code: arg.storedetails.dial_code,
        misc_settings: arg?.storedetails?.misc_settings,
        extra_details: arg?.storedetails?.extra_details,
        day_close_time: arg?.storedetails?.day_close_time,
      };

      Object.assign(arg.storedetails, { extra_info: extraInfo });
      // Check if the previous store and current store
      // is same if yes the update the details
      // else add the new store
      await umzug.addorupdateStore(arg.storedetails);
      global.storeDetails = arg.storedetails;

      // Update the current store settings
      await Settings.update(
        { value: global.storeDetails.store_id },
        {
          where: {
            id: CURRENT_STORE,
          },
        },
      );

      await Store.update(
        { settings: { userlogged: true, expirationDate: date.getTime() } },
        { where: { store_id: global.storeDetails.store_id } },
      );

      updateSettingsOnNotification({ settings: arg.storedetails.pos_settings });

      // Reset access level
      resetCurrentaccesslevel();
      // let currentAccesslevels = JSON.parse(global.storeDetails.access_levels);
      if (
        global.storeDetails &&
        global.storeDetails.access_levels &&
        global.storeDetails.access_levels.order_window
      ) {
        global.allowModifyBill =
          global.storeDetails.access_levels.order_window.modify_bill_after_save;
      }

      setBillnumberlengthformain();
      initializeListeners();
      // Restart the advertiser
      if (global.mainWindow) {
        setTimeout(() => {
          if (global.mainWindow && !global.mainWindow.isDestroyed()) {
            global.mainWindow.webContents.send(
              'NEW_STORE_ADDED_UPDATED',
              undefined,
            );
          }
        }, 2000);
      }

      // add user in login status
      // if(window.addLoginValidationForCskTerminalUsers){
      let MACHINE_ID = 'fallback_machine_id';
      try {
        // eslint-disable-next-line global-require
        const { machineId } = require('node-machine-id');
        MACHINE_ID = await machineId();
      } catch (err) {
        console.error('Failed to retrieve machineId:', err);
      }
      const userDetails = {
        id: arg.storedetails.id,
        username: arg.storedetails.username,
        name: arg.storedetails.person_name,
        store_id: arg.storedetails.store_id,
        status: 1,
        machine_id: MACHINE_ID,
      };
      const userLoginStatus = await UserLoginStatus.findAll({
        raw: true,
        limit: 1,
        where: {
          id: Number(arg.storedetails.id),
          store_id: arg.storedetails.store_id,
          // captain_user_access: 1,
        },
      });

      if (userLoginStatus && userLoginStatus.length) {
        await UserLoginStatus.update(
          { status: 1, machine_id: MACHINE_ID },
          {
            where: {
              id: Number(arg.storedetails.id),
              store_id: arg.storedetails.store_id,
            },
          },
        );
      } else {
        await UserLoginStatus.create(userDetails);
      }
      // }
    } catch (error) {
      console.error(error);
    }
  }
  // mainWindow.webContents.
  global.mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './src/com/tmbill/templates/Home.html'),
      protocol: 'file:',
      slashes: true,
    }),
  );
}

ipcMain.on('login-success', async (event, arg) => {
  try {
    loginPostprocessing(JSON.parse(arg));
    if (!eventObject) {
      eventObject = event;
    }
  } catch (error) {
    console.error(error);
  }
});

ipcMain.on(RELOAD_APP, async (event, { name }) => {
  try {
    if (name) {
      switch (name) {
        case 'main':
          if (global.mainWindow && global.mainWindow.webContents) {
            global.mainWindow.webContents.reload();
          }
          break;

        default:
          break;
      }
    }
    if (!eventObject) {
      eventObject = event;
    }
  } catch (error) {
    console.error(error);
  }
});

ipcMain.on(DESTROY_USER_SESSION, async (event) => {
  updateStoresettings();
  if (!eventObject) {
    eventObject = event;
  }
});

/**
 * Deletes the current store details
 */
async function deletecurrentStore() {
  await deletestoreData(global.storeDetails.store_id);
  await Store.destroy({
    where: {
      store_id: global.storeDetails.store_id,
    },
  });
}

// delete sales record data
async function deleteRecords() {
  await deleteSalesRecord(global.storeDetails.store_id);
}

global.deletecurrentStorefromremote = function () {
  deletecurrentStore();
};

global.deleteSalesRecordfromremote = function () {
  deleteRecords();
};

ipcMain.on('is-sync-needed', async (event) => {
  const result = await checkIfsyncisneeded(
    global.storeDetails.store_id,
    global.storeDetails.username,
  );
  if (!eventObject) {
    eventObject = event;
  }
  if (result) {
    const options = {
      type: 'warning',
      buttons: ['OKs', 'Sync'],
      defaultId: 1,
      title: 'Question',
      message: "Some Bill's are not synced.",
      detail: "Please sync bill's first.",
    };

    // Synchronous usage
    const dialogResult = dialog.showMessageBoxSync(global.mainWindow, options);
    if (dialogResult && dialogResult === 1) {
      try {
        const data = { silentSync: false, logout: false };
        await startSync(event, data, false);
      } catch (error) {
        console.log(error);
      }
    }
  }
});

async function updateUserLoginStatus() {
  await UserLoginStatus.update(
    { status: 0 },
    {
      where: {
        id: Number(global.storeDetails.id),
        store_id: global.storeDetails.store_id,
      },
    },
  );
}

function loadLoginwindow() {
  global.mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './src/com/tmbill/templates/login.html'),
      protocol: 'file:',
      slashes: true,
    }),
  );
}

/**
 * Opens the login window
 */
async function openLogin() {
  if (global.mainWindow) {
    await updateStoresettings();
    loadLoginwindow();
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send(LOGOUT_USER, {});
    }
    if (global.addLoginValidationForCskTerminalUsers) {
      updateUserLoginStatus();
    }
  }
}

/**
 * Log out post processing
 * @param {Parameters if any} params
 */
async function logoutPostprocess(event, params) {
  await paymentDiffcallAPI();
  try {
    if (params && params.addStore) {
      loadLoginwindow();
      return;
    }

    // if bills are running then while clear sales report should not logout
    if (params && params.runnigBill && params.runnigBill > 0) {
      return;
    }

    const result = await checkIfsyncisneeded(
      global.storeDetails.store_id,
      global.storeDetails.username,
    );

    // Check if store remove option is checked..
    let deleteStorechecked = false;
    if (params) {
      if (params.deleteStore) {
        deleteStorechecked = true;
      }
    }

    let deleteSaleRecordchecked = false;
    if (params) {
      if (params.deleteSaleRecord) {
        deleteSaleRecordchecked = true;
      }
    }

    const isOnline = params && params.isOnline ? params.isOnline : false;
    if (
      result &&
      isOnline &&
      (global.storeDetails.live_tracking_enabled ||
        global.storeDetails.loyalty_enabled)
    ) {
      const options = {
        type: 'warning',
        buttons: ['OK', 'Sync'],
        defaultId: 1,
        title: 'Question',
        message: "Some Bill's are not synced.",
        detail: "Please sync bill's first.",
      };
      // Synchronous usage
      const dialogResult = dialog.showMessageBoxSync(
        global.mainWindow,
        options,
      );
      if (dialogResult === 1) {
        try {
          const data = { silentSync: false, logout: true, showPrompt: true };
          if (global.mainWindow && !global.mainWindow.isDestroyed()) {
            global.mainWindow.webContents.send(DATA_SYNCING_ON_LOGOUT, {});
          }
          startSync(event, data, deleteStorechecked, deleteSaleRecordchecked);
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      if (deleteStorechecked) {
        await deletecurrentStore();
      }
      if (deleteSaleRecordchecked) {
        await deleteRecords();
      }
      if (global.addLoginValidationForCskTerminalUsers) {
        updateUserLoginStatus();
      }
      await openLogin();
    }
  } catch (error) {
    console.log(error);
  }
}

ipcMain.on(LOGOUT_ON_CLOSE_DAY_SHIFT, async (event) => {
  await updateStoresettings();
  openLogin();
  if (!eventObject) {
    eventObject = event;
  }
});

ipcMain.on(TOGGLE_FULLSCREEN, async (event, content) => {
  global.mainWindow.setFullScreen(content.isFullScreen);
});

ipcMain.on(REMOTE_FORCE_LOGUT, async (event) => {
  await updateStoresettings();
  await deletestoreData(global.storeDetails.store_id);
  openLogin();
  if (!eventObject) {
    eventObject = event;
  }
});

ipcMain.on('logout', async (event, arg) => {
  logoutPostprocess(event, arg);
  if (!eventObject) {
    eventObject = event;
  }
});

ipcMain.on(CHECK_FOR_UPDATES, async () => {
  checkForUpdates({ silent: false, UserChecking: true });
});

global.openloginfromRemote = function () {
  openLogin();
};

ipcMain.on('__RELOGIN__', async () => {
  openLogin();
});

global.reloginfromremote = async function () {
  if (global.mainWindow) {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('RELOGIN_STORE', undefined);
    }
    updateStoresettings();
  }
};

let syncTimeInterval = 80;
if (global.syncTimeInterval) {
  syncTimeInterval = Number(global.syncTimeInterval);
}

const debouncedstartSync = debounce(async (event, content) => {
  const result = await startSync(event, JSON.parse(content), false);
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send(SYNC_BILL_REPLY, result);
  }
}, syncTimeInterval * 1000);

ipcMain.on(SYNC_BILL, async (event, content) => {
  if (content) {
    const response = safeParseformain(content);
    if (response.forceSync) {
      const result = await startSync(event, JSON.parse(content), false);
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send(SYNC_BILL_REPLY, result);
      }
    } else {
      await debouncedstartSync(event, content);
    }
    if (!eventObject) {
      eventObject = event;
    }
  }
});

ipcMain.on(SYNC_BILL, async (event, content) => {
  if (content) {
    const response = safeParseformain(content);
    // if (response.forceSync) {
    //   const result = await startSync(event, JSON.parse(content), false);
    //   global.mainWindow.webContents.send(SYNC_BILL_REPLY, result);
    // } else {
    //   await throttledStartSync(event, JSON.parse(content), false);
    // }
    // callStartSync({ event, content, forceSync: response.forceSync });
    if (response.forceSync) {
      const result = await startSync(event, JSON.parse(content), false);
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send(SYNC_BILL_REPLY, result);
      }
    } else {
      await controlledStartSync(event, JSON.parse(content), false);
    }
    if (!eventObject) {
      eventObject = event;
    }
  }
});

ipcMain.on('get-system-printers', async (event) => {
  if (global.mainWindow) {
    const printers = await global.mainWindow.webContents.getPrintersAsync();
    if (printers) {
      event.reply('get-system-printers-reply', JSON.stringify(printers));
    }
    if (!eventObject) {
      eventObject = event;
    }
  }
});

global.betteripcMain.answerRenderer(
  ORDER_IPC.DELETE_STORE_ASYNC,
  async (params) => {
    // console.log(params);
    if (
      params &&
      params.store_id &&
      global.storeDetails.store_id !== params.store_id
    ) {
      await Store.destroy({
        where: {
          store_id: params.store_id,
        },
      });
      return { status: 200 };
    }
    return { status: 203 };
  },
);

// If development environment
if (isDev) {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require, node/no-unpublished-require
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  });
}
