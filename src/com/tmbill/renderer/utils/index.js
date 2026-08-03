const { sleep } = require('../../util/MiscUtil');

const USE_SLEEP = true;

function waitForRender(timeout = 100) {
  if (USE_SLEEP) {
    return sleep(timeout);
  }
  // Fast path: app is visible → use proper render sync
  if (!document.hidden) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }

  // Background path → no rAF, use MessageChannel + timeout
  return new Promise((resolve) => {
    let done = false;

    const channel = new MessageChannel();

    const finish = () => {
      if (done) return;
      done = true;

      channel.port1.onmessage = null;
      channel.port1.close();
      channel.port2.close();

      resolve();
    };

    channel.port1.onmessage = finish;

    // Trigger immediately (no rAF dependency)
    channel.port2.postMessage(null);

    // Safety fallback
    setTimeout(finish, timeout);
  });
}

/**
 * Evaluates whether a value should be treated as "true"
 * in a controlled, production-safe way.
 */
function isTrueLike(value) {
  if (value == null) return false; // null / undefined

  // Fast path for actual booleans
  if (typeof value === 'boolean') return value;

  // Numbers: only 1 is considered true
  if (typeof value === 'number') return value === 1;

  // Strings: normalize and whitelist
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  // Everything else (objects, arrays, symbols, etc.)
  return false;
}

module.exports = {
  waitForRender,
  isTrueLike,
};
