const { app } = require('electron');

function setupinstanceLock() {
  console.log(`Message="Setting Instance Lock"`);
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    console.log(
      'Message="Singletone lock is already acquired. Quitting the app."',
    );
    app.quit();
  } else {
    // eslint-disable-next-line no-unused-vars
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      console.log('second-instance started');
      // Someone tried to run a second instance, we should focus our window.
      if (global.mainWindow) {
        if (global.mainWindow.isMinimized()) global.mainWindow.restore();
        global.mainWindow.focus();
      }
    });
  }
}

module.exports = {
  setupinstanceLock,
};
