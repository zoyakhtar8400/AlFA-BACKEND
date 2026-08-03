/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/**
 *
 * Optional time integrity check for TMBill POS.
 * Only runs if the outlet has `strictTimeCheck: true` in their settings.
 *
 * Covers:
 *  - NTP skew detection via 3-source fallback chain
 *  - Offline grace window with clock-backward detection
 *  - Timezone-safe business date derivation from trusted UTC + outlet timezone
 *  - All thresholds configurable per outlet from NestJS settings
 *
 */

const https = require('https');
const { dialog, app, ipcMain } = require('electron');
const store = require('../../packages/store');

const TIME_FETCH_AGENT = new https.Agent({ rejectUnauthorized: false });

// ─── Keys used in electron-store ────────────────────────────────────────────
const KEY_LAST_TRUSTED_UTC = 'lastVerifiedTrustedUTC';
const KEY_LAST_LOCAL_AT_VERIFY = 'lastLocalTimeAtVerify';
const KEY_OFFLINE_LAUNCH_COUNT = 'offlineLaunchCount';

// ─── Default thresholds (all overridable from outlet settings) ───────────────
const DEFAULTS = {
  allowedSkewMinutes: 5, // max tolerated difference between NTP and local clock
  offlineGraceMinutes: 480, // 8 hours — max time allowed without NTP verification
  maxOfflineLaunches: null, // null = disabled; set a number to limit offline launches
};

// ─── Trusted time sources ────────────────────────────────────────────────────

/**
 * Fetches UTC ms from the Date response header of Cloudflare's trace endpoint.
 */
function fetchCloudflareTime() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      { hostname: '1.1.1.1', path: '/cdn-cgi/trace', agent: TIME_FETCH_AGENT },
      (res) => {
        const serverDate = res.headers.date;

        // Consume the response data to free up memory
        res.resume();

        if (!serverDate) {
          reject(new Error('Cloudflare: no Date header'));
          return; // Exit the callback cleanly
        }

        const ts = new Date(serverDate).getTime();
        if (Number.isNaN(ts)) {
          reject(new Error('Cloudflare: invalid Date header'));
          return; // Exit the callback cleanly
        }

        resolve(ts);
      },
    );

    req.on('error', (e) => {
      reject(new Error(`Cloudflare: ${e.message}`));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Cloudflare: timeout'));
    });
  });
}

/**
 * Fetches UTC ms from the Date response header of Google.
 */
function fetchGoogleTime() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      { hostname: 'www.google.com', path: '/', agent: TIME_FETCH_AGENT },
      (res) => {
        const serverDate = res.headers.date;
        res.resume();

        if (!serverDate) {
          reject(new Error('Google: no Date header'));
          return; // Stops execution without returning a specific value
        }

        const ts = new Date(serverDate).getTime();
        if (Number.isNaN(ts)) {
          reject(new Error('Google: invalid Date header'));
          return; // Stops execution
        }

        resolve(ts);
      },
    );

    req.on('error', (e) => {
      reject(new Error(`Google: ${e.message}`));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Google: timeout'));
    });
  });
}

/**
 * Tries each source in order, returns the first success.
 * Throws only if ALL sources fail.
 */
async function fetchTrustedTime() {
  const sources = [
    { name: 'Cloudflare', fn: fetchCloudflareTime },
    { name: 'Google', fn: fetchGoogleTime },
  ];

  const errors = [];

  for (const source of sources) {
    try {
      const ts = await source.fn();
      console.log(`[TimeGuard] Message="Verified via ${source.name}"`);
      return ts;
    } catch (err) {
      console.warn(`[TimeGuard] Message="${source.name} failed"`, err.message);
      errors.push(`${source.name}: ${err.message}`);
    }
  }

  throw new Error(`All time sources failed:\n${errors.join('\n')}`);
}

// ─── Core guard ──────────────────────────────────────────────────────────────

/**
 * Runs the time integrity check using the outlet's configured thresholds.
 *
 * @param {object} settings - Outlet settings from NestJS
 * @param {boolean} settings.strictTimeCheck         - Master switch (should already be true when calling this)
 * @param {number}  settings.allowedSkewMinutes      - Max NTP skew tolerated (default: 5 min)
 * @param {number}  settings.offlineGraceMinutes     - Max offline window allowed (default: 480 min / 8h)
 * @param {number|null} settings.maxOfflineLaunches  - Max launches while offline, null = no limit
 *
 * @returns {Promise<{ valid: boolean, reason: string, trustedUTC?: number, offlineMode?: boolean }>}
 */
async function runTimeGuard(settings = {}) {
  const {
    allowedSkewMinutes = DEFAULTS.allowedSkewMinutes,
    offlineGraceMinutes = DEFAULTS.offlineGraceMinutes,
    maxOfflineLaunches = DEFAULTS.maxOfflineLaunches,
  } = settings;

  const MAX_SKEW_MS = allowedSkewMinutes * 60 * 1000;
  const MAX_OFFLINE_MS = offlineGraceMinutes * 60 * 1000;

  let trustedUTC = null;

  // ── Step 1: Try to get trusted time from internet ──────────────────────────
  try {
    trustedUTC = await fetchTrustedTime();

    // Persist verified reference points
    store.set(KEY_LAST_TRUSTED_UTC, trustedUTC);
    store.set(KEY_LAST_LOCAL_AT_VERIFY, Date.now());
    store.set(KEY_OFFLINE_LAUNCH_COUNT, 0); // reset offline launch counter
  } catch (err) {
    console.warn(
      '[TimeGuard] Message="Offline — falling back to cached verification"',
      err.message,
    );
  }

  // ── Step 2: Online path ────────────────────────────────────────────────────
  if (trustedUTC !== null) {
    const skewMs = Math.abs(Date.now() - trustedUTC);

    if (skewMs > MAX_SKEW_MS) {
      const skewMin = Math.round(skewMs / 60000);
      const direction = Date.now() > trustedUTC ? 'ahead' : 'behind';
      return {
        valid: false,
        reason: `System clock is ${skewMin} minute(s) ${direction} of the actual time. Please correct your system date & time and relaunch.`,
      };
    }

    return {
      valid: true,
      reason: 'ok',
      trustedUTC,
      offlineMode: false,
    };
  }

  // ── Step 3: Offline path ───────────────────────────────────────────────────
  const lastTrustedUTC = store.get(KEY_LAST_TRUSTED_UTC);
  const lastLocalTime = store.get(KEY_LAST_LOCAL_AT_VERIFY);

  // Never successfully verified online on this device
  if (!lastTrustedUTC || !lastLocalTime) {
    return {
      valid: false,
      reason:
        'System time has never been verified on this device. Please connect to the internet and relaunch.',
    };
  }

  const localNow = Date.now();

  // Detect clock moved backward since last verification
  if (localNow < lastLocalTime) {
    return {
      valid: false,
      reason:
        'System clock was moved backward. Please correct your system date & time and relaunch.',
    };
  }

  const elapsedMs = localNow - lastLocalTime;

  // Offline too long
  if (elapsedMs > MAX_OFFLINE_MS) {
    const elapsedHours = Math.round(elapsedMs / 3600000);
    const graceHours = Math.round(offlineGraceMinutes / 60);
    return {
      valid: false,
      reason: `Device has been offline for ${elapsedHours}h (limit: ${graceHours}h). Please connect to the internet to verify system time.`,
    };
  }

  // Optional: offline launch counter
  if (maxOfflineLaunches !== null) {
    const offlineLaunches = (store.get(KEY_OFFLINE_LAUNCH_COUNT) ?? 0) + 1;

    if (offlineLaunches > maxOfflineLaunches) {
      return {
        valid: false,
        reason: `Maximum offline launches (${maxOfflineLaunches}) exceeded. Please connect to the internet and relaunch.`,
      };
    }

    store.set(KEY_OFFLINE_LAUNCH_COUNT, offlineLaunches);
  }

  // Estimate real time for business date derivation
  const estimatedTrustedUTC = lastTrustedUTC + elapsedMs;

  return {
    valid: true,
    reason: 'offline-grace',
    trustedUTC: estimatedTrustedUTC,
    offlineMode: true,
    offlineElapsedMinutes: Math.round(elapsedMs / 60000),
  };
}

// ─── Time guard integration ───────────────────────────────────────────────────

/**
 * Called by the renderer (via IPC) after login, once outlet settings
 * are fetched from NestJS. This is the only place time guard runs.
 *
 * @param {object} settings - Full outlet settings object from NestJS API
 */
async function checkAndInitTimeguard(settings) {
  // Feature disabled for this outlet — skip entirely
  if (!settings.strictTimeCheck) {
    console.log(
      '[TimeGuard] Message="Time integrity check disabled for this outlet"',
    );
    return { blocked: false };
  }

  console.log('[TimeGuard] Message="Running time integrity check"');

  const result = await runTimeGuard({
    allowedSkewMinutes: settings.allowedSkewMinutes,
    offlineGraceMinutes: settings.offlineGraceMinutes,
    maxOfflineLaunches: settings.maxOfflineLaunches ?? null,
  });

  console.log(
    '[TimeGuard] Message="Time integrity check result" Valid="%s" Reason="%s"',
    result.valid,
    result.reason,
  );

  if (!result.valid) {
    // Show blocking error dialog — user cannot proceed
    await dialog.showMessageBox(global.mainWindow, {
      type: 'error',
      title: 'System Clock Error',
      message: 'Access Denied — System Time Issue',
      detail: result.reason,
      buttons: ['Quit'],
      defaultId: 0,
    });
    app.exit(0);
    return { blocked: true };
  }

  // If offline grace mode, notify renderer to show a non-blocking warning banner
  if (result.offlineMode) {
    global.mainWindow?.webContents.send('time-guard:offline-warning', {
      offlineElapsedMinutes: result.offlineElapsedMinutes,
    });
  }

  return {
    blocked: false,
    trustedUTC: result.trustedUTC,
    offlineMode: result.offlineMode,
  };
}

let _periodicTimerId = null;

function stopPeriodicTimeCheck() {
  if (_periodicTimerId !== null) {
    clearInterval(_periodicTimerId);
    _periodicTimerId = null;
    console.log('[TimeGuard] Message="Periodic check stopped"');
  }
}

/**
 * If the outlet has strictTimeCheck enabled, re-verify every 15 minutes
 * to catch clock changes mid-session. Call this after initial check passes.
 *
 * @param {object} settings - Same outlet settings object
 */
function startPeriodicTimeCheck(settings) {
  if (!settings.strictTimeCheck) return;

  // Clear any existing timer before starting a new one
  stopPeriodicTimeCheck();

  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  _periodicTimerId = setInterval(async () => {
    if (!global.mainWindow) {
      stopPeriodicTimeCheck();
      return;
    }

    const result = await runTimeGuard(settings);

    if (!result.valid) {
      console.warn(
        `[TimeGuard] Message="Periodic check failed" Reason="${result.reason}"`,
      );

      stopPeriodicTimeCheck();
      // Notify renderer — you can show a modal and give the user 30s to save work
      global.mainWindow?.webContents.send('time-guard:violation', {
        reason: result.reason,
      });

      // Then force quit after a short delay
      setTimeout(() => {
        app.exit(0);
      }, 30_000);
    }
  }, INTERVAL_MS);
}

/**
 * Exposed via IPC to the renderer, which should call this after login with the
 */
ipcMain.handle('time-guard:check', async (_event, timeSettings) => {
  const result = await checkAndInitTimeguard(timeSettings);
  if (!result.blocked) {
    startPeriodicTimeCheck(timeSettings);
  }
  return result;
});

/**
 * require('./src/com/tmbill/main/services/TimeGuard.service') in master.js
 * Example to call this
 * ipcRenderer.invoke("time-guard:check", {strictTimeCheck:true});
 */

// module.exports = { checkAndInitTimeguard };
