/* eslint-disable no-console */
const os = require('os');
const { ipcMain } = require('electron');
const uniqid = require('uniqid');
const bonjour = require('bonjour')();
const ip = require('ip');
const { Config } = require('../config/config');
const { STORE_SWITCH_COMPLETED } = require('../util/IPC_Messages');

function getServiceoptions() {
  return {
    name: `TMBill Altantic ${uniqid()}`,
    type: 'http',
    port: 3000,
    txt: {
      secretKey: Config.cipherKey,
      url: `http://${ip.address()}:3000/`,
      storeName: (global.storeDetails && global.storeDetails.store_name) || '',
      username: (global.storeDetails && global.storeDetails.username) || '',
    },
  };
}

// browse for all http services
// bonjour.find({ type: 'http' }, function (service) {
//     console.log('Found an HTTP server:', service)
// });
function hasValidInterface() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      // Only check external, non-internal IPv4
      if (!net.internal && net.family === 'IPv4') {
        return true;
      }
    }
  }
  return false;
}

function publishService() {
  try {
    if (hasValidInterface()) {
      bonjour.publish(getServiceoptions());
    }
    // console.log(service);
  } catch (error) {
    console.log(error);
  }
}

ipcMain.on(STORE_SWITCH_COMPLETED, async () => {
  console.log(STORE_SWITCH_COMPLETED);
  bonjour.unpublishAll();
  publishService();
});

publishService();
