/* eslint-disable no-console */
const Sentry = require('@sentry/electron/main');
const { safeParseformain } = require('../../main_controllers/Utils');

// let SENTRY_ENABLED = false;

function isSentryenabled() {
  if (global.storeDetails && global.mainWindow) {
    const extraInfo = safeParseformain(global.storeDetails.extra_info);
    if (
      extraInfo &&
      extraInfo.misc_settings &&
      extraInfo.misc_settings?.sentry?.enabled
    ) {
      // SENTRY_ENABLED = true;
      Sentry.setUser({
        id: global.storeDetails.store_id,
        name: global.storeDetails.store_name,
      });
      return true;
    }
  }
  return false;
}

function sentryEventfilter(event) {
  if (isSentryenabled()) {
    return event;
  }
  return null;
}

function initSetup() {
  console.log(`Message="Sentry Initialized in the Main Process"`);
  Sentry.init({
    dsn: 'https://6bf0d95e2bbc8389f2cc6759c47105a1@sentry.tmbill.com/2',
    sampleRate: 0.5,
    tracesSampleRate: 0.5,
    ipcMode: Sentry.IPCMode.Classic,
    beforeSend: sentryEventfilter,
    beforeSendTransaction: sentryEventfilter,
    beforeBreadcrumb: sentryEventfilter,
    beforeSendSpan: sentryEventfilter,
  });
}

// eslint-disable-next-line no-unused-vars
async function sendInitcmdtorenderer() {
  if (global.storeDetails && global.mainWindow) {
    isSentryenabled();
    global.mainWindow.webContents.send('__SENTRY_INIT__', undefined);
  } else {
    setTimeout(() => {
      sendInitcmdtorenderer();
    }, 1000);
  }
}

async function initSentryformain() {
  initSetup();
}

module.exports = {
  initSentryformain,
};
