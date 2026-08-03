// SyncManager.js
let lastSyncTime = 0;

let syncTimeInterval = 5; // default to 5s; override if needed

function setSyncInterval(seconds) {
  // if (seconds) {
  syncTimeInterval = seconds;
  // }
}

// Unified throttled startSync wrapper
const throttledStartSync = throttle(
  async (
    event,
    content = { silentSync: true, logout: false },
    force = false,
  ) => {
    const now = Date.now();

    if (force || now - lastSyncTime >= syncTimeInterval * 1000) {
      lastSyncTime = now;
      const result = await startSync(event, content, false);
      if (global.mainwindow?.webContents) {
        global.mainwindow.webContents.send(SYNC_BILL_REPLY, result);
      }
    }
  },
  syncTimeInterval * 1000,
  { leading: true, trailing: false },
);

module.exports = {
  throttledStartSync,
  setSyncInterval,
};
