/* eslint-disable no-use-before-define */
const { PushReceiver } = require('@eneris/push-receiver');

const { ipcMain, app } = require('electron');
const Store = require('../store');

const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require('./constant');
const { RESET_FCM_TOKEN } = require('../../util/IPC_Messages');

const configFile = Store;
const MAX_PERSISTENT_IDS = 500;
const TOKEN_REFRESH_DAYS = 15;
let isReinitializing = false;

const FCM_CONFIG = {
  apiKey: 'AIzaSyCPk0N82VK1ZQOs_aCvOs4e_1i1UL5CTsU',
  projectId: 'tmbillchannel',
  messagingSenderId: '992602538917',
  appId: '1:992602538917:web:11b24c98d7018ff68c9e4c',
};

// To be sure that start is called only once
let started = false;
let fcmclientInstance;
let isFCMSocketclosed = true;
let _webContents = null;

// ─── Logging Helpers ──────────────────────────────────────────────────────────

const log = {
  info: (msg, ...args) => console.log(`[FCM] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[FCM] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[FCM] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[FCM] ${msg}`, ...args),
};

function safeGetCredentials() {
  try {
    return configFile.getSync('credentials') || null;
  } catch {
    return null;
  }
}

/**
 * Wipes local credentials and IDs.
 * This forces registerIfNeeded() to generate fresh crypto keys.
 */
function hardResettoken() {
  try {
    const currentSettings = configFile.getSync(); // get entire settings object
    delete currentSettings.credentials;
    delete currentSettings.persistentIds;
    currentSettings.tokenSetDate = 1000000000000; // number, not string
    configFile.setSync(currentSettings);
  } catch (error) {
    log.error('Error while hard resetting token');
  }
}

function destroyFCM() {
  try {
    if (fcmclientInstance) {
      log.info('Destroying FCM instance...');
      fcmclientInstance.destroy();
      fcmclientInstance = null;
    }
    started = false;
    isReinitializing = false;
  } catch (error) {
    log.error('Error while destroying FCM:', error);
  }
}

async function reconnectFCM() {
  try {
    if (!isReinitializing && fcmclientInstance) {
      await fcmclientInstance.connect();
    }
  } catch (error) {
    log.error(error);
  }
}

async function reinitFCM() {
  if (!isReinitializing && fcmclientInstance && isFCMSocketclosed) {
    log.info(
      `Message="Reinitializing FCM Connection as network state is changed"`,
    );
    reconnectFCM();
  }
}
function isTokenExpired(timestamp) {
  const expiryMs = TOKEN_REFRESH_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - Number(timestamp) > expiryMs;
}

function sendTokenToRenderer(receivedToken) {
  const token =
    receivedToken ||
    fcmclientInstance?.fcmToken ||
    safeGetCredentials()?.fcm?.token;
  if (token && _webContents && !_webContents.isDestroyed()) {
    _webContents.send(NOTIFICATION_SERVICE_STARTED, token);
  }
}

function handleFCMNotification(notification) {
  try {
    log.info('New Message Received');
    const currentpersistentIds = configFile.getSync('persistentIds') || [];
    // Dedup check before storing
    if (currentpersistentIds.includes(notification.persistentId)) {
      log.debug('Duplicate notification ignored:', notification.persistentId);
      return;
    }

    configFile.setSync('persistentIds', [
      ...currentpersistentIds.slice(-MAX_PERSISTENT_IDS),
      notification.persistentId,
    ]);
    // Notify the renderer process that a new notification has been received
    // And check if window is not destroyed for darwin Apps
    if (
      _webContents &&
      !_webContents.isDestroyed() &&
      notification.message &&
      !currentpersistentIds.includes(notification.persistentId)
    ) {
      _webContents.send(NOTIFICATION_RECEIVED, notification.message);
    }
  } catch (error) {
    console.error('Error while handling FCM notification', error?.message);
  }
}

function refreshFCMToken(informRenderer) {
  try {
    log.info('Checking FCM token age...');
    let tokenExpired = false;
    const tokenSetDate = configFile.getSync('tokenSetDate');
    if (tokenSetDate) {
      tokenExpired = isTokenExpired(tokenSetDate);
      if (tokenExpired) {
        log.info(`Message="Token is expired.Refreshing tokens"`);
        hardResettoken();
        destroyFCM();
        if (informRenderer) {
          setTimeout(sendTokenToRenderer, 30000);
        }
      } else {
        log.info(
          `Token is fresh (set ${Math.round((Date.now() - tokenSetDate) / 86400000)} days ago)`,
        );
      }
    } else {
      configFile.setSync('tokenSetDate', Date.now());
    }
  } catch (error) {
    log.error(`Message="Error while refreshing token" Error=`, error);
  }
}

function handleOnCredentialsChanged({ newCredentials }) {
  try {
    log.info('FCM credentials updated');
    const currentSettings = configFile.getSync(); // get entire settings object
    currentSettings.credentials = newCredentials;
    currentSettings.tokenSetDate = Date.now(); // number, not string
    configFile.setSync(currentSettings);
    // We notify the renderer about the new token
    if (_webContents && !_webContents.isDestroyed()) {
      sendTokenToRenderer(newCredentials?.fcm?.token);
    }
  } catch (error) {
    console.error('Error while handling credentials changedd', error?.message);
  }
}

async function initFCM() {
  // Prevent concurrent reinit calls
  if (isReinitializing) {
    log.debug('Reinit already in progress, skipping');
    return;
  }
  const credentials = configFile.getSync('credentials') || undefined;
  const persistentIds = configFile.getSync('persistentIds') || [];

  if (started && fcmclientInstance) {
    log.info('FCM is already initialized');
    sendTokenToRenderer();
    return;
  }
  if (fcmclientInstance) {
    destroyFCM();
  }
  try {
    log.info('Initializing FCM PushReceiver...');
    isReinitializing = true;
    started = true;
    fcmclientInstance = new PushReceiver({
      debug: false,
      persistentIds: persistentIds || [], // Recover stored ids of all previous notifications
      firebase: FCM_CONFIG,
      heartbeatIntervalMs: 30000,
      credentials, // Insert credentials here after the first run
    });

    fcmclientInstance.onCredentialsChanged(handleOnCredentialsChanged);

    fcmclientInstance.onNotification(handleFCMNotification);
    fcmclientInstance.on('ON_CONNECT', () => {
      log.debug(`Message="FCM Socket Connected"`);
      isFCMSocketclosed = false;
    });

    fcmclientInstance.on('ON_DISCONNECT', () => {
      log.debug(`Message="FCM Socket Disconnected."`);
      isFCMSocketclosed = true;
    });
    fcmclientInstance.onReady(() => {
      log.info('FCM ready');
      started = true;
      isReinitializing = false;
      isFCMSocketclosed = false;
      setTimeout(sendTokenToRenderer, 5000);
    });

    if (fcmclientInstance) {
      await fcmclientInstance?.connect();
      await fcmclientInstance?.whenReady;
    }
  } catch (e) {
    log.error('Failed to initialize FCM:', e);
    // Forward error to the renderer process
    if (_webContents && !_webContents.isDestroyed()) {
      _webContents.send(NOTIFICATION_SERVICE_ERROR, e.message);
    }
  } finally {
    isReinitializing = false;
  }
}

// To be call from the main process
async function setup(webContents) {
  _webContents = webContents;
  ipcMain.removeAllListeners(START_NOTIFICATION_SERVICE);
  refreshFCMToken(false);
  // Will be called by the renderer process
  ipcMain.on(START_NOTIFICATION_SERVICE, async (_) => {
    initFCM();
  });
}

global.betteripcMain.answerRenderer(RESET_FCM_TOKEN, () => {
  log.info('Manual FCM token reset requested. Exiting app');
  hardResettoken();
  destroyFCM();
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 5000);
});

ipcMain.on('online-status-changed', (event, status) => {
  if (status === 'online') {
    setTimeout(reinitFCM, 10000);
  }
});

module.exports = {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
  setup,
};
