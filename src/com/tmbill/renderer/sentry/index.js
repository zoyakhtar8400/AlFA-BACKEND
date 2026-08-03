/* eslint-disable no-console */
const Sentry = require('@sentry/electron/renderer');
const { safeParse } = require('../../util/RendererUtils');

// let SENTRY_ENABLED = false;

function isSentryenabled() {
  if (window.storeDetails && window.storeDetails.extra_info) {
    const extraInfo = safeParse(window.storeDetails.extra_info);
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

async function initSetup() {
  console.log(`Message="Sentry Initialized in the Renderer Process"`);

  Sentry.init({
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: false,
        beforeAddRecordingEvent: sentryEventfilter,
        beforeErrorSampling: sentryEventfilter,
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // beforeSendTransaction
    beforeSend: sentryEventfilter,
    beforeSendTransaction: sentryEventfilter,
    beforeBreadcrumb: sentryEventfilter,
    beforeSendSpan: sentryEventfilter,
  });

  if (window.storeDetails) {
    Sentry.setUser({
      id: window.storeDetails.store_id,
      name: window.storeDetails.store_name,
    });
  }
  // setTimeout(() => {
  //   throw new Error('POS Sentry Test Error 4');
  // }, 4000);
}

async function initSentryforrenderer() {
  if (window.storeDetails) {
    initSetup();
  } else {
    setTimeout(() => {
      initSentryforrenderer();
    }, 500);
  }
}

window.ipcRenderer.on('__SENTRY_INIT__', () => {
  initSentryforrenderer();
});

setTimeout(() => {
  initSentryforrenderer();
}, 400);
