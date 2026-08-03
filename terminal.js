/* eslint-disable func-names */
/* eslint-disable no-console */
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const fileSystem = require('fs');
const path = require('path');
const url = require('url');
const {
  setupTitlebar,
  attachTitlebarToWindow,
} = require('custom-electron-titlebar/main');
require('./src/com/tmbill/main_controllers/TitleBar');
require('./src/com/tmbill/main/ServiceDiscovery');
require('./src/com/tmbill/js/ModuleImportHelper');
require('./src/com/tmbill/main/utils/Settings.store');
const { enable: enableWebContents } = require('@electron/remote/main');
const isDev = require('./src/com/tmbill/packages/electron-is-dev');
const { Config: appConfig } = require('./src/com/tmbill/config/config');
const { initSentryformain } = require('./src/com/tmbill/main/sentry');

global.Config = appConfig;
// eslint-disable-next-line no-use-before-define
initialize();

// require('@electron/remote/main').initialize();

const umzug = require('./src/com/tmbill/database/UmzufConfig');
require('./src/com/tmbill/notifications/Main_push_listener_service');

const { initializeWorkerwindow } = require('./src/com/tmbill/Worker');
const { DEVMODE_SECRET } = require('./src/com/tmbill/util/Constants');
require('./src/com/tmbill/main_controllers/Mainprocessmisc');
require('./src/com/tmbill/main_controllers/SyncListeners');
const {
  checkForUpdates,
} = require('./src/com/tmbill/main_controllers/AutoUpdater');
const { setupinstanceLock } = require('./src/com/tmbill/main/utils/Lock');
const { Settings, Store } = require('./src/com/tmbill/js/database');
const { CURRENT_STORE } = require('./src/com/tmbill/util/SettingIDs');
const {
  resetCurrentaccesslevel,
} = require('./src/com/tmbill/js/AccesslevelManager');
const {
  RELOAD_APP,
  REMOTE_FORCE_LOGUT,
  CHECK_FOR_UPDATES,
  TOGGLE_FULLSCREEN,
} = require('./src/com/tmbill/util/IPC_Messages');
const {
  HandleExitEventForTerminal,
} = require('./src/com/tmbill/main_controllers/ExitHandler');
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
 * Opens the login window.
 */
async function createWindow() {
  console.log('load main window');
  commandlineArgs = process.argv.slice(2);

  await umzug.Up();

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
        `--appType=TERMINAL`,
      ],
      preload: path.join(__dirname, './Preload.js'),
    },
    show: false,
    titleBarStyle: 'hidden',
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

  global.mainWindow.once('ready-to-show', () => {
    console.log('show window');
    global.mainWindow.show();
    if (splashscreenWindow) {
      splashscreenWindow.close();
    }

    setTimeout(() => {
      checkForUpdates({ silent: false, UserChecking: false });
    }, 3000);

    if (
      global.Config.isDev ||
      (commandlineArgs && commandlineArgs.includes(DEVMODE_SECRET)) ||
      ['development', 'testing'].includes(process.env.NODE_ENV)
    ) {
      global.mainWindow.webContents.openDevTools();
    }
  });

  global.mainWindow.on('close', HandleExitEventForTerminal);

  initializeWorkerwindow(global.mainWindow);
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

app.on('ready', openSplashscren);
// app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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

  global.Config.DBConfig.path = `${app.getPath('home') + global.Config.DBConfig.directory}/terminal.sqlite`;

  // Initialize sentry
  initSentryformain();
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
      arg.storeDetails.settings = {
        userlogged: true,
        expirationDate: date.getTime(),
      };

      // Check if the previous store and current store
      // is same if yes the update the details
      // else add the new store
      await Store.upsert(arg.storeDetails, {
        fields: ['store_id'],
      });

      global.storeDetails = arg.storeDetails;

      global.settingsConfig = arg.settings;

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

      // Reset access level
      resetCurrentaccesslevel();
      // Restart the advertiser
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
  }
}

/**
 * Log out post processing
 * @param {Parameters if any} params
 */
async function logoutPostprocess() {
  try {
    await openLogin();
  } catch (error) {
    console.log(error);
  }
}

ipcMain.on(REMOTE_FORCE_LOGUT, async (event) => {
  await updateStoresettings();
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

ipcMain.on(TOGGLE_FULLSCREEN, async (event, content) => {
  global.mainWindow.setFullScreen(content.isFullScreen);
});

global.reloginfromremote = async function () {
  if (global.mainWindow) {
    global.mainWindow.webContents.send('RELOGIN_STORE', undefined);
    updateStoresettings();
  }
};

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

// If development environment
if (isDev) {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require, node/no-unpublished-require
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  });
}
