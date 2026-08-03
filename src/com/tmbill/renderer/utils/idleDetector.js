/* eslint-disable prefer-destructuring */
let controller;
let idleDetector;

async function starteIdleDetector(thresholdTime) {
  try {
    if (controller) {
      controller.abort();
    }
    controller = new AbortController();
    const signal = controller.signal;

    if (idleDetector) {
      idleDetector.removeEventListener('change'); // Remove previous listener
      idleDetector = null; // Clear the previous detector reference
    }

    idleDetector = new window.IdleDetector();
    idleDetector.addEventListener('change', async () => {
      const userState = idleDetector.userState;
      const screenState = idleDetector.screenState;
      console.log(`Message="Idle change: ${userState}, ${screenState}."`);
      if (userState === 'idle') {
        controller.abort();
        window.ipcRenderer.send('SET_APPLICATION_TYPE_DONE');
        // starteIdleDetector(60000);
        resetIdleDetector(thresholdTime);
      }
    });

    await idleDetector.start({
      threshold: thresholdTime, // 5400000, // 900000,
      signal,
    });
    console.log('IdleDetector is active.');
  } catch (err) {
    // Deal with initialization errors like permission denied,
    // running outside of top-level frame, etc.
    console.error(err.name, err.message);
  }
}

async function checkIfIdleDetectorIsavailable(threshold) {
  if ('IdleDetector' in window) {
    // Idle Detector API supported
    starteIdleDetector(threshold);
  }
}

function resetIdleDetector(thresholdTime) {
  console.log('Resetting IdleDetector...');
  startIdleDetector(thresholdTime); // Restart the idle detector immediately
}

// setTimeout(() => {
//   checkIfIdleDetectorIsavailable(1800000);
// }, 10000);

module.exports = {
  checkIfIdleDetectorIsavailable,
};
