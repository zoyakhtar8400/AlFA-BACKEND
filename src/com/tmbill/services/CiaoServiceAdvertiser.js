const ciao = require('@homebridge/ciao');
const { ipcMain } = require('electron');
const uniqid = require('uniqid');
const ip = require('ip');
const { STORE_SWITCH_COMPLETED } = require('../util/IPC_Messages');
const { Config } = require('../config/config');

const responder = ciao.getResponder();

function getServiceoptions() {
  return {
    name: `TMBill Altantic ${uniqid()}`,
    type: 'http',
    port: 3000,
    txt: {
      secretKey: Config.cipherKey,
      url: `http://${ip.address()}:3000/`,
      storeName: global?.storeDetails?.store_name || '',
    },
  };
}

// create a service defining a web server running on port 3000
const service = responder.createService(getServiceoptions());

function publishService() {
  try {
    service.advertise().then(() => {
      console.log('Service is published :)');
    });
  } catch (error) {
    console.log(error);
  }
}

ipcMain.on(STORE_SWITCH_COMPLETED, async () => {
  console.log(STORE_SWITCH_COMPLETED);
  service.destroy().then(() => {
    publishService();
  });
});

publishService();
