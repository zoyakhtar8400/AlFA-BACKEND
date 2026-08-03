const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = false;
autoUpdater.forceDevUpdateConfig = true;

let isSilent;
let isUserChecking;
let updateDownloaded = false;

autoUpdater.setFeedURL({
  provider: 's3',
  bucket: 'tmbill-resources',
  path: 'updates/Atlantic POS',
});

const dispatchMessage = (text) => {
  global.mainWindow.webContents.send('message', { text });
  console.log(`Messgae="${text}"`);
};

const changeUpdaterMenu = () => {};

autoUpdater.on('checking-for-update', () => {
  dispatchMessage('Checking for update...');
});

autoUpdater.on('error', (error) => {
  dispatchMessage(`Error in autoUpdater. ${error}`);
  changeUpdaterMenu({ label: 'Check for updates', enabled: true });
  // if (isSilent) return;
  // dialog.showErrorBox(
  //   'Error during the update',
  //   `Application couldn't be updated. Please try again or contact the support team.`,
  // );
});

autoUpdater.on('update-available', () => {
  dispatchMessage('Update available.');
  if (isSilent) {
    autoUpdater.downloadUpdate();
    return;
  }
  // let dialogResult = dialog.showMessageBoxSync({
  //   type: 'info',
  //   title: 'TMBill Atlantic POS',
  //   message: 'New updates are available, do you want update now?',
  //   defaultId: 0,
  //   cancelId: 1,
  //   buttons: ['Yes', 'No'],
  //   icon: './src/com/tmbill/assets/logo.ico',
  // });

  // if (dialogResult === 0) {
  //   autoUpdater.downloadUpdate();
  // } else {
  //   changeUpdaterMenu({ label: 'Check for updates', enabled: true });
  // }

  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', () => {
  dispatchMessage('Update not available.');
  changeUpdaterMenu({ label: 'Check for updates', enabled: true });
  if (isSilent) return;
  if (isUserChecking) {
    dialog.showMessageBox({
      title: 'No Updates',
      message: 'Current version is up-to-date.',
      icon: './src/com/tmbill/assets/logo.ico',
    });
  }
});

autoUpdater.on('update-downloaded', () => {
  dispatchMessage('Update downloaded.');
  updateDownloaded = true;
  changeUpdaterMenu({ label: 'Updates available', enabled: true });
  if (isSilent) return;
  dialog.showMessageBox(
    {
      title: 'Install Updates',
      message: 'Updates are ready to be installed.',
      defaultId: 0,
      cancelId: 1,
      buttons: ['Install and restart', 'Close'],
      icon: './src/com/tmbill/assets/logo.ico',
    },
    (buttonIndex) => {
      if (buttonIndex === 0) {
        setImmediate(() => autoUpdater.quitAndInstall());
      } else {
        changeUpdaterMenu({ label: 'Updates available', enabled: true });
      }
    },
  );
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  const perct = percent / 100;
  if (global.mainWindow) {
    global.mainWindow.setProgressBar(perct);
  }
});

function checkForUpdates({ silent, UserChecking }) {
  try {
    console.log('check for updates');
    // console.log(process.env.AWS_SECRET_ACCESS_KEY);
    isSilent = silent;
    isUserChecking = UserChecking;
    // changeUpdaterMenu({ label: 'Checking for updates...', enabled: false });
    if (updateDownloaded) {
      dialog.showMessageBox(
        {
          title: 'TMBill Atlantic POS Updates Available',
          message: 'New updates are available and ready to be installed.',
          defaultId: 0,
          cancelId: 1,
          buttons: ['Install and restart', 'Close'],
          icon: './src/com/tmbill/assets/logo.ico',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            setImmediate(() => autoUpdater.quitAndInstall());
          } else {
            changeUpdaterMenu({ label: 'Updates available', enabled: true });
          }
        },
      );
    } else {
      autoUpdater.checkForUpdates();
    }
  } catch (error) {
    console.log(error);
  }
  // autoUpdater.getFeedURL();
}

module.exports = { checkForUpdates };
