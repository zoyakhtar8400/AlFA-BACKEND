// eslint-disable-next-line import/no-extraneous-dependencies
const { Bonjour } = require('bonjour-service');
const { ipcMain } = require('electron');

let bonjour;

let discoveredStores = {};

// eslint-disable-next-line prefer-const
bonjour = new Bonjour();

let retryScancount = 0;

function sendStorestorenderer() {
  if (global.mainWindow) {
    global.mainWindow.webContents.send('MASTER_POS_DISCOVERED', {
      discoveredIps: Object.keys(discoveredStores),
      serversList: Object.values(discoveredStores),
    });
  }
}

function initBonjour() {
  if (bonjour) {
    console.log(`Message="Scanning For Bonjur Services"`);
    bonjour.find({ type: 'http' }, (service) => {
      if (
        String(service.name).includes('TMBill Altantic') &&
        service.txt !== undefined &&
        service.addresses &&
        service.addresses.length > 0 &&
        service.referer &&
        service.referer.address
      ) {
        Object.assign(discoveredStores, {
          [service.txt.storeName]: service,
        });
      }

      setTimeout(sendStorestorenderer, 3000);
    });
  }
  // console.log(bonjour,'from service discovery inside inour')
}

function retryBonjour() {
  if (Object.values(discoveredStores).length === 0 && retryScancount <= 5) {
    retryScancount += 1;
    const retryingAfter = (retryScancount + 1) * 1000;
    console.log(
      `Message="Recanning For Bonjur Services after ${retryingAfter}ms"`,
    );
    setTimeout(() => {
      discoveredStores = {};
      initBonjour();
    }, retryScancount * 1000);
  } else {
    setTimeout(sendStorestorenderer, 5000);
  }
}

ipcMain.on('INIT_SEARCH_MASTER', async () => {
  retryScancount = 0;
  initBonjour();
});

module.exports = {
  initBonjour,
  retryBonjour,
};
