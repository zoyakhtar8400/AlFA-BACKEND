/* eslint-disable global-require */
const path = require('path');
const url = require('url');
require('./src/com/tmbill/main_controllers/TitleBar');
const { enable: enableWebContents } = require('@electron/remote/main');
const { BrowserWindow, app, Menu, ipcMain } = require('electron');

require('@electron/remote/main').initialize();

const {
  setupTitlebar,
  attachTitlebarToWindow,
} = require('custom-electron-titlebar/main');
const { APP_TYPE } = require('./src/com/tmbill/constant');
const {
  getApplicationtypeset,
  isDevModeEnabled,
} = require('./src/com/tmbill/main/utils/Settings.store');

function loadEntrypoint(appType) {
  let runasMaster = appType === APP_TYPE.MASTER_POS;

  /**
   * This env is set in dev2 script
   * To run multiple instance of the application run
   * npm run master in first terminal
   * and run
   * npm run terminal in second terminal
   */
  if (process.env.RUN_AS_TERMINAL) {
    runasMaster = false;
  }

  global.__IS_MASTER_POS__ = runasMaster;

  if (runasMaster) {
    console.log(`Message="Initializing Master Mode"`);
    require('./master');
  } else {
    console.log(`Message="Initializing Terminal Mode"`);
    require('./terminal');
  }
}

function askForapplicationtype() {
  setupTitlebar();
  const splashscreenWindow = new BrowserWindow({
    width: 600,
    height: 600,
    // frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    titleBarStyle: 'hidden',
  });
  enableWebContents(splashscreenWindow.webContents);

  Menu.setApplicationMenu(null);
  splashscreenWindow.setMenu(null);
  splashscreenWindow.loadURL(
    url.format({
      pathname: path.join(
        __dirname,
        './src/com/tmbill/templates/ApplicationType.html',
      ),
      protocol: 'file:',
      slashes: true,
    }),
  );
  attachTitlebarToWindow(splashscreenWindow);
}

ipcMain.on('SET_APPLICATION_TYPE_DONE', () => {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit(0);
});

async function init() {
  const appType = await getApplicationtypeset();
  const checkIsDevEnabled = await isDevModeEnabled();
  if (checkIsDevEnabled) {
    process.env.NODE_ENV = 'testing';
  }

  if (!appType) {
    loadEntrypoint(APP_TYPE.MASTER_POS);
  } else {
    /**
     * If Application type is set then load entrypoint
     */
    loadEntrypoint(appType);
  }
}

init();
