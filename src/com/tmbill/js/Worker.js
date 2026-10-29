/* eslint-disable no-plusplus */
/* eslint-disable camelcase */

/**
 * printWorker.js — Electron Renderer Worker
 *
 * Responsibilities:
 *  - Maintains a serialised print queue (one job at a time)
 *  - Handles bill printing, KOT printing, PDF export, CSK image dispatch,
 *    and Base64 report submission
 *  - Structured logging with levels, job-scoped context, and timing
 *  - Per-job retry with back-off, hard timeout, and queue-overflow guard
 *  - Safe IPC listener teardown on window unload
 */
const { shell, ipcRenderer } = require('electron');
const { uniqueId, forIn } = require('lodash');
const remote = require('@electron/remote');
const readyState = require('ready-state');
const { machineId } = require('node-machine-id');
const desktopPath = require('path').join(require('os').homedir(), 'Desktop/');

const {
  PRINT_PDF,
  HOTELLOGO_MODIFIED,
  SEND_SHOW_SENT_REPORT_NOTIFICATION,
} = require('../util/IPC_Messages');
const { apiCall } = require('../services/APIService');
const { safeParse } = require('../util/RendererUtils');

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const CONSTANTS = Object.freeze({
  /** Maximum jobs held in queue before new arrivals are dropped */
  MAX_QUEUE_SIZE: 100,

  /** Maximum retry attempts per job before it is discarded */
  MAX_RETRIES: 2,

  /** Base delay (ms) between retries — doubles each attempt */
  RETRY_BASE_DELAY_MS: 300,

  /** Hard timeout (ms) for a single print job from start to finish */
  JOB_TIMEOUT_MS: 60_000,

  /** Settle delay (ms) for regular bill prints — lets layout paint */
  SETTLE_DELAY_BILL_MS: 200,

  /** Settle delay (ms) for KOT prints — much tighter */
  SETTLE_DELAY_KOT_MS: 10,

  /** Extra layout settle (ms) for CSK image capture */
  SETTLE_DELAY_CSK_MS: 400,

  /** Default thermal width (px) when no override is provided — 63 mm @ 96 dpi */
  DEFAULT_THERMAL_WIDTH_PX: Math.floor((63 * 96) / 25.4),

  /** Fallback body width reset value string */
  BODY_RESET_WIDTH: '79px',

  BACKOFFICE_REPORT_URL:
    'https://backoffice.tmbill.com/api/v1/submit-todays-report',
  BACKOFFICE_API_KEY: 'tmbill@12345',
  BACKOFFICE_SOURCE: 'atlantic_pos',
});

// ─────────────────────────────────────────────────────────────
// Structured Logger
// ─────────────────────────────────────────────────────────────

const LogLevel = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 });

/**
 * Minimum level to emit.
 * Set to LogLevel.DEBUG in development, LogLevel.INFO in production.
 * Controlled via the WORKER_LOG_LEVEL env var when available.
 */
const ACTIVE_LOG_LEVEL = (() => {
  try {
    const env = process?.env?.WORKER_LOG_LEVEL?.toUpperCase();
    return LogLevel[env] ?? LogLevel.INFO;
  } catch {
    return LogLevel.INFO;
  }
})();

/**
 * Emit a structured log line.
 * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} level
 * @param {string} message
 * @param {Record<string, unknown>} [ctx]  – extra key/value pairs
 */
function log(level, message, ctx = {}) {
  const numericLevel = LogLevel[level] ?? LogLevel.INFO;
  if (numericLevel < ACTIVE_LOG_LEVEL) return;

  // const ts = new Date().toISOString();
  const ctxStr = Object.entries(ctx)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(' ');
  const line = `[Worker] level="${level}" Message="${message}"${ctxStr ? ` ${ctxStr}` : ''}`;

  switch (level) {
    case 'WARN':
      console.warn(line);
      break;
    case 'ERROR':
      console.error(line);
      break;
    case 'DEBUG':
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

// Convenience shorthands
const logger = {
  debug: (msg, ctx) => log('DEBUG', msg, ctx),
  info: (msg, ctx) => log('INFO', msg, ctx),
  warn: (msg, ctx) => log('WARN', msg, ctx),
  error: (msg, ctx) => log('ERROR', msg, ctx),
};

/**
 * machineId() performs async OS-level I/O on every call.
 * Cached here — after logger is defined — so the .catch() handler can log safely.
 * Subsequent report submissions resolve instantly against the cached Promise.
 * @type {Promise<string>}
 */
const MACHINE_ID_PROMISE = machineId().catch((err) => {
  logger.warn('machineId() failed — using fallback', { error: err.message });
  return 'unknown-machine';
});

// ─────────────────────────────────────────────────────────────
// Queue State
// ─────────────────────────────────────────────────────────────

/** @type {Array<{ printData: object, retries: number }>} */
const printQueue = [];
let printingInProgress = false;

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Promisified sleep.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Races a promise against a hard timeout.
 * Rejects with a descriptive error if the timeout fires first.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label  – used in the error message
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label = 'operation') {
  let timerId;
  const timeoutP = new Promise((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms: ${label}`)),
      ms,
    );
  });
  return Promise.race([promise, timeoutP]).finally(() => clearTimeout(timerId));
}

/**
 * Safe ipcRenderer.send — swallows errors if the renderer is being torn down.
 * @param {string} channel
 * @param {...unknown} args
 */
function safeSend(channel, ...args) {
  try {
    ipcRenderer.send(channel, ...args);
  } catch (err) {
    logger.warn('ipcRenderer.send failed (renderer may be unloading)', {
      channel,
      error: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Logo Visibility
// ─────────────────────────────────────────────────────────────

function toggleLogoVisibility(showLogo) {
  const logoDiv = document.getElementById('workerhotellogoDivid');
  if (!logoDiv) {
    logger.warn('setStoreLogoElement: #workerhotellogoDivid not found');
    return;
  }

  if (showLogo) {
    logoDiv.style.display = 'flex';
  } else {
    logoDiv.style.display = 'none';
    logger.debug('Logo hidden');
  }
}
/**
 * Toggles the hotel-logo section on the worker page.
 * @param {{ showLogo: boolean, hotelogoFilepath?: string }} data
 */
function setStoreLogoElement(data) {
  const logoDiv = document.getElementById('workerhotellogoDivid');
  if (!logoDiv) {
    logger.warn('setStoreLogoElement: #workerhotellogoDivid not found');
    return;
  }

  if (data?.showLogo && data?.hotelogoFilepath) {
    const img = document.getElementById('hotellogoImage');
    if (img) img.src = `${data.hotelogoFilepath}?${uniqueId()}`;
    logoDiv.style.display = 'flex';
    logger.debug('Logo shown', { path: data.hotelogoFilepath });
  } else {
    logoDiv.style.display = 'none';
    logger.debug('Logo hidden');
  }
}

// ─────────────────────────────────────────────────────────────
// Back-office Base64 PDF Submission
// ─────────────────────────────────────────────────────────────

/**
 * Serialises a printed page as a Base64 PDF and posts it to the back-office.
 *
 * @param {string}  base64Content
 * @param {object}  storeDetails
 * @param {boolean} showLoader    – whether to emit IPC loader events
 * @param {string}  reportType
 */
async function sendPdfToBackend(
  base64Content,
  storeDetails,
  showLoader,
  reportType,
) {
  const MACHINE_ID = await MACHINE_ID_PROMISE;
  const extraInfo = safeParse(storeDetails.extra_info) ?? {};

  const payload = {
    store_id: storeDetails.store_id,
    username: storeDetails.username,
    store_name: storeDetails.store_name,
    email: extraInfo.notification_emails,
    notification_phone: extraInfo.contact_phone,
    tmpos_id: storeDetails.tmpos_id,
    timestamp: Date.now(),
    base64: base64Content,
    report_type: reportType,
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-tmbill-ikey': CONSTANTS.BACKOFFICE_API_KEY,
    'x-user': storeDetails.username,
    'x-tmbill-key': storeDetails.token || '',
    Authorization: `Bearer ${storeDetails.token}`,
    'x-tmbill-source': CONSTANTS.BACKOFFICE_SOURCE,
    'x-tmbill-storeid': storeDetails.store_id,
    machine_id: MACHINE_ID,
  };

  if (showLoader) {
    safeSend(SEND_SHOW_SENT_REPORT_NOTIFICATION, {
      processStarted: true,
      processCompleted: false,
    });
  }

  logger.info('Sending Base64 report to back-office', {
    store_id: storeDetails.store_id,
    report_type: reportType,
  });

  try {
    const response = await withTimeout(
      apiCall.post(CONSTANTS.BACKOFFICE_REPORT_URL, payload, { headers }),
      30_000,
      'sendPdfToBackend',
    );

    if (response?.status === 201) {
      logger.info('Base64 report accepted by back-office', { status: 201 });
      if (showLoader) {
        safeSend(SEND_SHOW_SENT_REPORT_NOTIFICATION, {
          processStarted: false,
          processCompleted: true,
        });
      }
    } else {
      const status = response?.status ?? 'unknown';
      logger.warn('Back-office returned non-201 status', { status });
      if (showLoader) {
        safeSend(SEND_SHOW_SENT_REPORT_NOTIFICATION, {
          processStarted: false,
          processCompleted: false,
          errorOccured: true,
        });
      }
    }
  } catch (error) {
    logger.error('Base64 report submission failed', { error: error.message });
    if (showLoader) {
      safeSend(SEND_SHOW_SENT_REPORT_NOTIFICATION, {
        processStarted: false,
        processCompleted: false,
        errorOccured: true,
      });
    }
    throw error; // let the caller decide whether to retry
  }
}

// ─────────────────────────────────────────────────────────────
// CSK Image Capture & Dispatch
// ─────────────────────────────────────────────────────────────

const workerWebContents = remote.getCurrentWebContents();
if (!workerWebContents) {
  // Nothing we can do without web contents — log and let subsequent calls surface the error
  logger.error(
    'remote.getCurrentWebContents() returned null — printing will not function',
  );
}

/**
 * Captures the current worker page as a PNG and sends the public URL to the
 * CSK socket listener via IPC.
 *
 * @param {object} printData
 */
async function sendImageToCSK(printData) {
  const originalBounds = remote.getCurrentWindow().getContentBounds();
  logger.info('CSK image capture started', { table_id: printData.table_id });

  try {
    const { devicePixelRatio = 1 } = await workerWebContents.executeJavaScript(
      '({ devicePixelRatio: window.devicePixelRatio || 1 })',
    );

    let finalWidthPx = CONSTANTS.DEFAULT_THERMAL_WIDTH_PX;
    const overrideWidth = Number(printData.printWidthForCSKBillPrint);
    if (Number.isFinite(overrideWidth) && overrideWidth > 0) {
      finalWidthPx = overrideWidth;
    }
    finalWidthPx = Math.floor(finalWidthPx);

    // --- Inject capture-time layout styles ---
    await workerWebContents.executeJavaScript(`
      (function () {
        const w = ${finalWidthPx};
        const b = document.body;
        b.style.cssText += ';width:' + w + 'px;min-width:' + w + 'px;max-width:' + w +
          'px;margin:0;padding:0;box-sizing:border-box;background:white;overflow:hidden;';

        document.querySelectorAll('div,table,tr,td,p,span,.bill-container').forEach(el => {
          el.style.width = '100%';
          el.style.maxWidth = '100%';
          el.style.boxSizing = 'border-box';
        });
        document.querySelectorAll('table').forEach(t => {
          t.style.tableLayout = 'fixed';
          t.style.width = '100%';
        });
        document.querySelectorAll('img').forEach(img => {
          img.style.display = 'block';
          img.style.margin = '0';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        });
      })();
    `);

    const { height: contentHeight } = await workerWebContents.executeJavaScript(
      '({ height: Math.max(document.body.scrollHeight + 10, document.documentElement.scrollHeight + 10) })',
    );

    const deviceWidth = Math.round(finalWidthPx * devicePixelRatio);
    const deviceHeight = Math.round(contentHeight * devicePixelRatio);

    remote.getCurrentWindow().setContentSize(deviceWidth, contentHeight);
    await sleep(CONSTANTS.SETTLE_DELAY_CSK_MS);

    const image = await workerWebContents.capturePage({
      x: 0,
      y: 0,
      width: deviceWidth,
      height: deviceHeight,
    });

    const buffer = image.toPNG();
    const fileName = `invoice-${Date.now()}.jpg`;

    if (!window.betteripcRenderer?.callMain) {
      throw new Error(
        'window.betteripcRenderer.callMain is not available — cannot save bill image',
      );
    }

    await window.betteripcRenderer.callMain('save-bill-print-image', {
      fileName,
      buffer,
    });

    const publicUrl = `http://localhost:8000/invoices/${fileName}`;
    logger.info('CSK image captured and saved', {
      fileName,
      table_id: printData.table_id,
    });

    safeSend('bill-print-link-to-csk', {
      socketUserId: printData.socketUserId,
      url: publicUrl,
      cskPrintEvent: printData.cskPrintEvent,
      table_id: printData.table_id,
    });
  } catch (err) {
    logger.error('CSK image capture failed', {
      error: err.message,
      table_id: printData.table_id,
    });
    throw err;
  } finally {
    // --- Restore layout ---
    remote.getCurrentWindow().setContentBounds(originalBounds);

    await workerWebContents
      .executeJavaScript(
        `
      (function () {
        const b = document.body;
        b.style.width = '${CONSTANTS.BODY_RESET_WIDTH}';
        b.style.minWidth = '';
        b.style.maxWidth = '${CONSTANTS.BODY_RESET_WIDTH}';
        b.style.margin = '';
        b.style.padding = '';
        b.style.boxSizing = '';
        b.style.background = '';
        b.style.overflow = '';

        document.querySelectorAll('div,table,tr,td,p,span,.bill-container').forEach(el => {
          el.style.width = '';
          el.style.maxWidth = '';
          el.style.boxSizing = '';
        });
        document.querySelectorAll('table').forEach(t => {
          t.style.tableLayout = '';
          t.style.width = '';
        });
        document.querySelectorAll('img').forEach(img => {
          img.style.display = '';
          img.style.margin = '';
          img.style.maxWidth = '';
          img.style.height = '';
        });
      })();
    `,
      )
      .catch((e) =>
        logger.warn('Layout reset script failed', { error: e.message }),
      );
  }
}

// ─────────────────────────────────────────────────────────────
// Queue Processing
// ─────────────────────────────────────────────────────────────

/**
 * Advances the queue — called after every job completes or errors.
 */
async function drainQueue() {
  logger.debug('Queue drain check', { pending: printQueue.length });

  if (printQueue.length === 0) {
    printingInProgress = false;
    return;
  }

  // eslint-disable-next-line no-use-before-define
  await processNextJob();
}

/**
 * Applies custom CSS overrides declared in `printData.styles`.
 * @param {object} printData
 */
function applyCustomStyles(printData) {
  if (!printData.styles) return;

  try {
    const styles = safeParse(printData.styles);
    if (!styles || typeof styles !== 'object') return;
    const active = styles.status;
    if (!active) return;

    const stylesCopy = { ...styles };
    delete stylesCopy.status;

    forIn(stylesCopy, (value) => {
      if (!value?.id) return;

      let selector = value.id;

      // KOT groupBy overrides
      if (printData.groupBycatkotitems) {
        if (selector === '#kotpreviewTable td.kot-itemtitle') {
          selector = '#disposableDivid span.kot-itemtitle';
        }
        if (selector === '#kotpreviewTable td.kot-itemqty') {
          selector = '#disposableDivid span.kot-itemqty';
        }
      }

      const cssProps = printData.size === 1 ? value.css_58mm : value.css_80mm;
      if (cssProps) {
        $(selector).css(cssProps);
      }
    });
  } catch (err) {
    logger.warn('Failed to apply custom styles', { error: err.message });
  }
}

/**
 * Configures container width based on paper size.
 * @param {object} printData
 */
function applyPaperSizeLayout(printData) {
  const logoDiv = document.getElementById('workerhotellogoDivid');

  if (printData.size === undefined || printData.type === undefined) {
    if (logoDiv) logoDiv.style.width = '79mm';
    return;
  }

  const divElement = printData.container;
  if (!divElement) return;

  const containers = document.getElementsByClassName(divElement);
  if (!containers?.length) return;

  const container = containers[0];
  const is58mm = printData.size === 1;

  if (is58mm) {
    if (
      !printData.pageconfigProvided &&
      !printData.sendImageToCSK &&
      !printData.printBillOnBothSide
    ) {
      container.style.width = '57mm';
      container.style.maxWidth = '57mm';
    }
    container.style.fontSize = '16px';
  } else {
    if (!printData.pageconfigProvided) {
      container.style.width = '76mm';
      container.style.maxWidth = '76mm';
    }
    if (logoDiv) logoDiv.style.width = '79mm';
  }
}

/**
 * Core job processor — handles a single dequeued print task.
 * @param {object} printData
 */
async function executeJob(printData) {
  try {
    if (!printData) throw new Error('printData missing');

    const jobCtx = {
      JobId: printData.job_id ?? 'n/a',
      deviceName: printData.deviceName ?? 'default',
    };
    const startTime = Date.now();

    logger.info('Job execution started', jobCtx);

    // ── 1. Render HTML into the worker page ──────────────────
    const printableDiv = document.getElementById('printableDivid');
    if (!printableDiv)
      throw new Error('#printableDivid element not found in worker page');

    if (!printData.content) {
      logger.warn('printData.content is empty — rendering blank page', jobCtx);
    }
    printableDiv.innerHTML = printData.content ?? '';

    toggleLogoVisibility(printData?.showLogo);

    const previewLogo = document.getElementById('hotellogoDivid');
    if (previewLogo) previewLogo.style.display = 'none';

    // ── 2. Apply layout / style overrides ────────────────────
    applyPaperSizeLayout(printData);
    applyCustomStyles(printData);

    if (printData.converttoPdf) {
      if (printData.container) {
        $(`.${printData.container}`).css({ 'max-width': '98%', width: '98%' });
      } else {
        logger.warn(
          'converttoPdf is set but printData.container is missing — skipping container CSS override',
          jobCtx,
        );
      }
      $('body').css({ 'max-width': '98%', width: '98%' });
    }

    // ── 3. Settle delay ───────────────────────────────────────
    const settleMs = printData.forKOTPrint
      ? CONSTANTS.SETTLE_DELAY_KOT_MS
      : CONSTANTS.SETTLE_DELAY_BILL_MS;
    await sleep(settleMs);

    if ($('#customqrcodeContainerid').length) {
      // Fire-and-forget: readyState.complete is not guaranteed to re-fire
      // if the page is already loaded. Log only — do not block the job.
      readyState.complete
        .then(() => logger.debug('readyState complete (QR context)', jobCtx))
        .catch((e) =>
          logger.warn('readyState.complete rejected', { error: e?.message }),
        );
    }

    // ── 4. CSK image dispatch ─────────────────────────────────
    if (printData.sendImageToCSK || printData.printBillOnBothSide) {
      // Call sendImageToCSK directly — no setTimeout wrapper.
      // Wrapping in setTimeout inside withTimeout creates a zombie: if the hard
      // timeout fires first, the inner callback keeps running, manipulating window
      // bounds and corrupting the next job's capture environment.
      await withTimeout(
        sendImageToCSK(printData),
        CONSTANTS.JOB_TIMEOUT_MS,
        'sendImageToCSK',
      );

      if (!printData.printBillOnBothSide) {
        logger.info('CSK-only job completed', {
          ...jobCtx,
          elapsedMs: Date.now() - startTime,
        });
        return;
      }
    }

    // ── 5. Base64 PDF → back-office ───────────────────────────
    if (printData.sendBase64String) {
      const pdfBuffer = await withTimeout(
        workerWebContents.printToPDF({}),
        CONSTANTS.JOB_TIMEOUT_MS,
        'printToPDF (base64)',
      );
      const base64Content = pdfBuffer.toString('base64');

      if (base64Content) {
        if (
          !printData.storeDetails ||
          typeof printData.storeDetails !== 'object'
        ) {
          logger.error(
            'sendBase64String is set but storeDetails is missing — skipping submission',
            jobCtx,
          );
        } else {
          await sendPdfToBackend(
            base64Content,
            printData.storeDetails,
            printData.showLoader,
            printData.report_type,
          );
        }
      } else {
        logger.warn(
          'printToPDF returned empty buffer — skipping back-office submission',
          jobCtx,
        );
      }

      if (!printData.printReportWhileSendingOnMail) {
        logger.info('Base64-only job completed (no physical print)', {
          ...jobCtx,
          elapsedMs: Date.now() - startTime,
        });
        return;
      }
    }

    // ── 6. PDF export to Desktop ──────────────────────────────
    if (printData.converttoPdf) {
      const pdfTitle =
        $('#reporttitleLabelID').html()?.trim() ||
        window.generateId?.() ||
        `report-${Date.now()}`;
      const datePrefix = window.moment?.().format('DD MMMM') ?? '';
      const outputPath = `${desktopPath}${datePrefix ? `${datePrefix}-` : ''}${pdfTitle}.pdf`;

      const pdfData = await withTimeout(
        workerWebContents.printToPDF({}),
        CONSTANTS.JOB_TIMEOUT_MS,
        'printToPDF (export)',
      );

      if (!window.fileSystem?.writeFile) {
        throw new Error(
          'window.fileSystem is not available — cannot save PDF to Desktop',
        );
      }

      await new Promise((resolve, reject) => {
        window.fileSystem.writeFile(outputPath, pdfData, (err) => {
          if (err) {
            logger.error('PDF write failed', {
              ...jobCtx,
              path: outputPath,
              error: err.message,
            });
            reject(err);
            return;
          }
          logger.info('PDF saved to Desktop', {
            ...jobCtx,
            path: outputPath,
            elapsedMs: Date.now() - startTime,
          });
          shell
            .openPath(outputPath)
            .then((errMsg) => {
              if (errMsg)
                logger.warn('shell.openPath returned error', {
                  path: outputPath,
                  shellError: errMsg,
                });
            })
            .catch((e) =>
              logger.warn('shell.openPath threw', { error: e.message }),
            );
          resolve();
        });
      });

      return;
    }

    // ── 7. Physical print ─────────────────────────────────────

    const printOptions = {
      silent: printData.silent ?? true, // undefined → Electron shows a dialog on some platforms
      fitToPageEnabled: true,
      printBackground: false,
      margins: { marginType: 'printableArea' },
    };
    if (printData.deviceName) {
      printOptions.deviceName = printData.deviceName;
    }

    await withTimeout(
      new Promise((resolve, reject) => {
        workerWebContents.print(printOptions, (success, errorType) => {
          if (success) resolve();
          else reject(new Error(`Electron print failed: ${errorType}`));
        });
      }),
      CONSTANTS.JOB_TIMEOUT_MS,
      `print (${printOptions.deviceName ?? 'default'})`,
    );

    const elapsed = Date.now() - startTime;
    logger.info('Job execution completed', { ...jobCtx, elapsedMs: elapsed });
    printableDiv.innerHTML = '';
  } catch (error) {
    console.error(error);
  } finally {
    printingInProgress = false;
  }
}

function isRetryable(err) {
  if (!err || !err.message) return true;
  const msg = err.message.toLowerCase();
  if (msg.includes('invalid printer')) return false;
  if (msg.includes('not found')) return false;
  if (msg.includes('missing')) return false;
  if (msg.includes('timeout')) return true; // usually retryable
  return true;
}

/**
 * Dequeues and executes the next pending job, with retry on failure.
 * Behavior: During retry back-off, printingInProgress stays TRUE
 * so NO new job starts until the retry is completely finished.
 */
async function processNextJob() {
  if (printingInProgress || printQueue.length === 0) return;

  printingInProgress = true;
  const task = printQueue.shift();

  if (!task?.printData) {
    logger.warn('Dequeued task has no printData — skipping');
    printingInProgress = false;
    await drainQueue();
    return;
  }

  const { printData } = task;
  const jobCtx = {
    JobId: printData.job_id ?? 'n/a',
    attempt: task.retries + 1,
  };

  logger.info('Dequeued job', { ...jobCtx, queueRemaining: printQueue.length });

  let retryScheduled = false;

  try {
    await executeJob(printData);
  } catch (err) {
    logger.error('Job execution error', { ...jobCtx, error: err.message });

    if (isRetryable(err) && task.retries < CONSTANTS.MAX_RETRIES) {
      const delay = CONSTANTS.RETRY_BASE_DELAY_MS * 2 ** task.retries;
      task.retries += 1;
      retryScheduled = true;

      logger.info('Scheduling retry', { ...jobCtx, delayMs: delay });

      printQueue.unshift(task); // retry has priority

      // Keep printingInProgress = true during back-off
      // → This enforces "no new job starts while retrying"
      await sleep(delay);
      await drainQueue();
      return;
    }

    logger.error('Job exceeded max retries — discarding', jobCtx);
  } finally {
    // Reset flag ONLY if we are not scheduled for another retry
    if (!retryScheduled) {
      printingInProgress = false;
    }
  }

  await drainQueue();
}

// ─────────────────────────────────────────────────────────────
// Public Entry Point — Add Print Task
// ─────────────────────────────────────────────────────────────

/**
 * Validates, enqueues, and (if idle) starts processing a new print job.
 * @param {string} rawData  – JSON-serialised print payload
 */
async function addPrintingTask(rawData) {
  const printData = safeParse(rawData);

  if (!printData || typeof printData !== 'object') {
    logger.warn('Received null or non-object print payload — ignoring');
    return;
  }

  const jobCtx = { JobId: printData.job_id ?? 'n/a' };

  // Guard against runaway queue growth
  if (printQueue.length >= CONSTANTS.MAX_QUEUE_SIZE) {
    logger.error('Print queue is full — dropping job', {
      ...jobCtx,
      queueSize: printQueue.length,
      maxSize: CONSTANTS.MAX_QUEUE_SIZE,
    });
    return;
  }

  const baseTask = { printData, retries: 0 };

  printQueue.push(baseTask);
  logger.info('Job enqueued', {
    ...jobCtx,
    printingInProgress,
    queueLength: printQueue.length,
  });

  if (!printingInProgress) {
    await processNextJob();
  }
}

// ─────────────────────────────────────────────────────────────
// Initialisation & IPC Bindings
// ─────────────────────────────────────────────────────────────

function initialize() {
  const logoDiv = document.getElementById('workerhotellogoDivid');
  if (logoDiv) {
    logoDiv.style.display = 'none';
  } else {
    logger.warn('initialize: #workerhotellogoDivid not found in DOM');
  }
  logger.info('Worker initialised');
}

// ── IPC: incoming print job ───────────────────────────────────
function onPrintPdf(event, rawData) {
  addPrintingTask(rawData).catch((err) =>
    logger.error('Unhandled error in addPrintingTask', { error: err.message }),
  );
}

// ── IPC: hotel logo updated ───────────────────────────────────
function onHotelLogoModified(event, rawData) {
  if (!rawData) return;
  try {
    setStoreLogoElement(safeParse(rawData));
  } catch (err) {
    logger.error('onHotelLogoModified: failed to parse payload', {
      error: err.message,
    });
  }
}

ipcRenderer.on(PRINT_PDF, onPrintPdf);
ipcRenderer.on(HOTELLOGO_MODIFIED, onHotelLogoModified);

// ── Safe IPC teardown on page unload ─────────────────────────
window.addEventListener('unload', () => {
  try {
    ipcRenderer.removeListener(PRINT_PDF, onPrintPdf);
    ipcRenderer.removeListener(HOTELLOGO_MODIFIED, onHotelLogoModified);
    logger.info('IPC listeners removed on unload');
  } catch (err) {
    // Nothing useful we can do here; best-effort only.
  }
});

// process.on('unhandledRejection', (err) => {
//   logger.error('Unhandled rejection', { error: err?.message });
//   printingInProgress = false;
//   drainQueue().catch(() => {});
// });

// process.on('uncaughtException', (err) => {
//   logger.error('Uncaught exception', { error: err?.message });
//   printingInProgress = false;
//   drainQueue().catch(() => {});
// });

window.onload = initialize;
