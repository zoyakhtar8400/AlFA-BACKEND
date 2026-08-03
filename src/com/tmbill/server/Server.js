/* eslint-disable no-console */
require('dotenv').config();
try {
  const electronCheck = require('electron');
  if (typeof electronCheck === 'string' || !electronCheck || !electronCheck.ipcMain) {
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    const mockElectron = {
      ipcMain: {
        on: () => { },
        once: () => { },
        handle: () => { },
        removeListener: () => { },
        removeAllListeners: () => { },
        emit: () => { },
      },
      app: {
        getPath: () => './public',
        getVersion: () => '1.0.0',
        on: () => { },
        quit: () => { },
        isPackaged: false,
      },
      BrowserWindow: class {
        static fromWebContents() {
          return {
            minimize() { },
            maximize() { },
            unmaximize() { },
            close() { },
            isMaximized() { return false; },
            webContents: { send() { } },
          };
        }
        loadURL() { }
        setMenu() { }
        show() { }
      },
      Menu: { setApplicationMenu() { }, getApplicationMenu() { return { items: [] }; } },
    };

    const mockBetterIpc = {
      answerRenderer: () => { },
      callRenderer: () => { },
      callFocusedRenderer: () => { },
    };

    global.betteripcMain = mockBetterIpc;
    global.ipcMain = mockElectron.ipcMain;

    Module.prototype.require = function (moduleName) {
      if (moduleName === 'electron' || moduleName === '@electron/remote' || moduleName === '@electron/remote/main') {
        return mockElectron;
      }
      if (moduleName === 'electron-better-ipc') {
        return {
          ipcMain: mockBetterIpc,
        };
      }
      return originalRequire.apply(this, arguments);
    };
  }
} catch (e) {
  // fallback if error
}

require('../js/ModuleImportHelper');

const express = require('express');

const expressApp = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const server = require('http').createServer(expressApp);
const io = require('socket.io')(server);
const connection = require('../js/database');

const { ROUTES } = require('../util/ServerUtils');
const { ResponseMessage } = require('../error/ResponseMessage');
const errorHandler = require('../error/error-handler');
const { auth, socketAuth, localAuth } = require('../middleware/auth');
const loginRouter = require('../routes/Login');
const tableRouter = require('../routes/Table');
const depRouter = require('../routes/Department');
const orderRouter = require('../routes/Order');
const kotRouter = require('../routes/KOT');
const terminalRouter = require('../routes/Terminal');
const customerRouter = require('../routes/Customer');
const oldkotRouter = require('../routes/OldKOT');
const menuRouter = require('../routes/Menu');
const kdsRouter = require('../routes/KDS');
const socketEvents = require('../routes/SocketEvents');

const apiRouter = require('../routes/api/v1');
const { convertQueryParams } = require('../middleware/queryParser');
const path = require('path');
let app;
try {
  // eslint-disable-next-line global-require
  const electron = require('electron');
  app = electron.app;
} catch (e) {
  app = null;
}

process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    console.warn('Process STDOUT error: EPIPE');
  }
});

io.use(socketAuth);
require('./ServerSocketlisteners')(io);
require('../services/ServerAdvertiser');
// require('../services/CiaoServiceAdvertiser');

expressApp.use(express.static('public'));
const invoicesDir = (app && typeof app.getPath === 'function')
  ? path.join(app.getPath('userData'), 'public')
  : path.join(__dirname, '../../public');
expressApp.use(express.static(path.join(invoicesDir)));
expressApp.use(bodyParser.json({ limit: '10mb' }));
expressApp.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
expressApp.use(cors());
// expressApp.use(convertQueryParams);

const menuCatalogRouter = require('../routes/MenuRoutes');
const billingRouter = require('../routes/Billing');


expressApp.use(errorHandler);
expressApp.use(loginRouter);
expressApp.use(ROUTES.TABLE, auth, tableRouter);
expressApp.use('/api/tables', auth, tableRouter);

expressApp.use(ROUTES.DEPARTMENT, auth, depRouter);

expressApp.use(ROUTES.ORDER, auth, orderRouter);
expressApp.use('/api/orders', auth, orderRouter);

expressApp.use(ROUTES.KOT, kotRouter);

expressApp.use(ROUTES.CUSTOMER, auth, customerRouter);
expressApp.use(ROUTES.OLD_KOT, auth, oldkotRouter);
expressApp.use(ROUTES.MENU, auth, menuRouter);

expressApp.use('/api', auth, menuCatalogRouter);
expressApp.use('/api/billing', auth, billingRouter);
expressApp.use('/api/payments', auth, billingRouter);

expressApp.use(ROUTES.KDS, auth, kdsRouter);
expressApp.use(ROUTES.TERMINAL, auth, terminalRouter);
expressApp.use(ROUTES.SOCKETEVENTS, auth, socketEvents);

expressApp.use(ROUTES.API, localAuth, apiRouter);

// eslint-disable-next-line no-unused-vars
expressApp.get('*', (req, res, next) => {
  res.json(new ResponseMessage(404, 'No Mapping Found'));
});

const { Config } = require('../config/config');
if (!global.Config) {
  global.Config = Config;
}

const PORT = (global.Config && global.Config.server_port) || process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Express Server is running on port ${PORT}`);
});

/**
 * Initialize the connection
 * @param {Parameters} params
 */
async function serverInitializer() {
  global.serverdbConnection = connection;
}

serverInitializer();

module.exports = {
  serverInitializer,
  expressApp,
};
