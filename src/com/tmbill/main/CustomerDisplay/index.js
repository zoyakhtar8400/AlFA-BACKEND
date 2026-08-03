const { app, screen, BrowserWindow } = require('electron');
const { enable: enableWebContents } = require('@electron/remote/main');
const path = require('path');
const url = require('url');
const { retryWithExponentialBackoff } = require('../../util/Retry');
const isDev = require('../../packages/electron-is-dev');
const { getCustomerdisplaySetting } = require('./IPCListeners');

let foundDisplay;

let enableFeature = false;
let customerDisplaysettings;

function initcustomerDisplaywindow() {
  if (foundDisplay && !global.customerDisplaywindow) {
    const options = {
      x: foundDisplay.bounds.x + 50,
      y: foundDisplay.bounds.y + 50,
      width: 900,
      height: 600,
      minHeight: 600,
      minWidth: 800,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        additionalArguments: [`--appVersion=${app.getVersion()}`],
      },
      show: false,
      titleBarStyle: 'hidden',
      // frame: false,
    };

    global.customerDisplaywindow = new BrowserWindow(options);

    const filetoLoad = '../../templates/CustomerDisplay/index.html';
    enableWebContents(global.customerDisplaywindow.webContents);
    global.customerDisplaywindow.loadURL(
      url.format({
        pathname: path.join(__dirname, filetoLoad),
        protocol: 'file:',
        slashes: true,
      }),
    );

    global.customerDisplaywindow.once('ready-to-show', () => {
      console.log('show window');
      global.customerDisplaywindow.show();
      if (isDev) {
        global.customerDisplaywindow.webContents.openDevTools();
      }
    });

    global.customerDisplaywindow.maximize();
  }
}

async function searchDisplay() {
  // check if customer display setting is enabled
  customerDisplaysettings = await getCustomerdisplaySetting();

  if (customerDisplaysettings && customerDisplaysettings.enabled) {
    enableFeature = true;
  }

  if (!enableFeature) {
    return;
  }

  const displays = screen.getAllDisplays();

  const externalDisplay = displays.find(
    (display) => display.bounds.x !== 0 || display.bounds.y !== 0,
  );

  if (externalDisplay && !externalDisplay.internal) {
    console.log(
      `Message="Secondary Display is found. Checking if customer display is enabled."`,
    );
    foundDisplay = externalDisplay;
    initcustomerDisplaywindow();
  }

  // If external display is not found and app is not packged use
  // the primary screen as external display
  if (!foundDisplay && isDev) {
    foundDisplay = screen.getPrimaryDisplay();
    initcustomerDisplaywindow();
  }
}

function preinitSearchdisplay() {
  retryWithExponentialBackoff(
    () => global.storeDetails !== undefined,
    5,
    5000,
    10000,
  )
    .then(() => {
      searchDisplay();
    })
    .catch((error) => {
      console.error(
        `Message="Error While Searching For Secondary Display"`,
        error,
      );
    });
}

setTimeout(() => {
  preinitSearchdisplay();
}, 10000);

module.exports = {
  searchDisplay,
};
