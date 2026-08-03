const { BrowserWindow } = require('electron');
const { enable: enableWebContents } = require('@electron/remote/main');
const commandlineArgv = require('minimist')(process.argv.slice(2));
const {
  PRINTERS_IPC,
  PRINT_PDF,
  HOTELLOGO_MODIFIED,
  MISC_IPC,
} = require('../util/IPC_Messages');

function initializeWorkerwindow(parent) {
  const options = {
    parent,
    modal: false,
    width: 400,
    height: 600,
    show: commandlineArgv.showWorker || false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  };

  global.currentprintworkerWindow = new BrowserWindow(options);
  enableWebContents(global.currentprintworkerWindow.webContents);
  if (commandlineArgv.showWorker) {
    global.currentprintworkerWindow.webContents.openDevTools();
  }
  global.currentprintworkerWindow.loadFile(
    './src/com/tmbill/templates/Worker.html',
  );
  global.currentprintworkerWindow.on('closed', () => {
    global.currentprintworkerWindow = null;
    global.workerWindowopened = false;
  });
  global.currentprintworkerWindow.webContents.on('did-finish-load', () => {
    global.workerWindowopened = true;
    // setTimeout(sendLogotoWorker, 400);
  });
}

function openworkerDevtool() {
  try {
    if (global.currentprintworkerWindow)
      global.currentprintworkerWindow.webContents.openDevTools();
  } catch (error) {
    console.log(error);
  }
}

global.betteripcMain.answerRenderer(
  PRINTERS_IPC.PRINT_WINDOW_AYNC,
  async (printData) => {
    global.currentprintworkerWindow.webContents.send(
      PRINT_PDF,
      JSON.stringify(printData),
    );
    return true;
  },
);

global.betteripcMain.answerRenderer(
  PRINTERS_IPC.HOTELLOGO_MODIFIED,
  async (printData) => {
    global.currentprintworkerWindow.webContents.send(
      HOTELLOGO_MODIFIED,
      JSON.stringify(printData),
    );
  },
);

global.betteripcMain.answerRenderer(MISC_IPC.OPEN_DEV_TOOLS, async () => {
  openworkerDevtool();
});

module.exports = {
  initializeWorkerwindow,
};

// const { BrowserWindow, ipcMain } = require('electron');
// const { enable: enableWebContents } = require('@electron/remote/main');
// const { PRINTERS_IPC, PRINT_PDF } = require('../util/IPC_Messages');

// function createPrintWorker(parent, printData) {
//   return new Promise((resolve, reject) => {
//     const win = new BrowserWindow({
//       parent,
//       width: 400,
//       height: 600,
//       // show: commandlineArgv.showWorker || false,
//       show: true,
//       webPreferences: {
//         nodeIntegration: true,
//         contextIsolation: false,
//       },
//     });

//     enableWebContents(win.webContents);

//     win.loadFile('./src/com/tmbill/templates/Worker.html');

//     win.webContents.once('did-finish-load', () => {
//       win.webContents.send(PRINT_PDF, JSON.stringify(printData));
//     });

//     // ✅ success from renderer
//     const doneHandler = () => {
//       // cleanup();
//       resolve(true);
//     };

//     // ❌ error from renderer
//     const errorHandler = (_e, err) => {
//       // cleanup();
//       reject(err);
//     };

//     function cleanup() {
//       win.webContents.removeListener('ipc-message', doneHandler);
//       win.webContents.removeListener('ipc-message', errorHandler);
//       if (!win.isDestroyed()) win.destroy();
//     }

//     win.webContents.on('ipc-message', (_e, channel, data) => {
//       if (channel === 'PRINT_DONE') doneHandler(data);
//       if (channel === 'PRINT_FAILED') errorHandler(data);
//     });

//     win.on('closed', () => {
//       cleanup();
//     });
//   });
// }
// function createPrintWorker(parent, printData) {
//   return new Promise((resolve, reject) => {
//     let finished = false;

//     const win = new BrowserWindow({
//       parent,
//       width: 400,
//       height: 600,
//       show: false, // keep hidden in production
//       webPreferences: {
//         nodeIntegration: true,
//         contextIsolation: false,
//       },
//     });

//     enableWebContents(win.webContents);
//     if (commandlineArgv.showWorker) {
//       win.webContents.openDevTools();
//     }

//     const safeCleanup = (err) => {
//       if (finished) return;
//       finished = true;

//       try {
//         if (!win.isDestroyed()) {
//           win.close();
//         }
//       } catch (e) {
//         console.error('cleanup error', e);
//       }

//       err ? reject(err) : resolve(true);
//     };

//     win.loadFile('./src/com/tmbill/templates/Worker.html');

//     win.webContents.once('did-finish-load', () => {
//       win.webContents.send(PRINT_PDF, JSON.stringify(printData));
//     });

//     // ✅ listen ONCE
//     ipcMain.on('PRINT_DONE', (event) => {
//       // console.log('print done lsitening:', event.sender.id);
//       // console.log('win.webContents.id:', win.webContents.id);
//       // if (event.sender.id === win.webContents.id) {
//       safeCleanup();
//       // }
//     });

//     ipcMain.on('PRINT_FAILED', (event, err) => {
//       // if (event.sender === win.webContents) {
//       safeCleanup(err);
//       // }
//     });

//     // ✅ failsafe (printer stuck / renderer crash)
//     setTimeout(() => {
//       safeCleanup(new Error('Print timeout'));
//     }, 15000);

//     win.on('closed', () => {
//       finished = true;
//     });
//   });
// }

// function createPrintWorker(parent, printData) {
//   return new Promise((resolve, reject) => {
//     let finished = false;
//     const workerId = `print-${Date.now()}-${Math.random()}`;

//     const win = new BrowserWindow({
//       parent,
//       width: 400,
//       height: 600,
//       show: false,
//       webPreferences: {
//         nodeIntegration: true,
//         contextIsolation: false,
//       },
//     });

//     enableWebContents(win.webContents);

//     const DONE = `PRINT_DONE_${workerId}`;
//     const FAIL = `PRINT_FAILED_${workerId}`;

//     const safeCleanup = (err) => {
//       console.log('safe cleanup called');
//       if (finished) return;
//       finished = true;

//       ipcMain.removeAllListeners(DONE);
//       ipcMain.removeAllListeners(FAIL);

//       if (!win.isDestroyed()) win.destroy();

//       err ? reject(err) : resolve(true);
//     };

//     win.loadFile('./src/com/tmbill/templates/Worker.html');

//     win.webContents.once('did-finish-load', () => {
//       win.webContents.send(PRINT_PDF, { workerId, printData });
//     });

//     ipcMain.once(DONE, () => safeCleanup());
//     ipcMain.once(FAIL, (_e, err) => safeCleanup(err));

//     setTimeout(() => {
//       safeCleanup(new Error('Print timeout'));
//     }, 60000);
//   });
// }

// module.exports = { createPrintWorker };
