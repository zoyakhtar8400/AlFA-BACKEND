global.moment = require('moment');
const os = require('os');
const { ipcMain: ipc } = require('electron-better-ipc');
const EventEmitter = require('events');

global.betteripcMain = ipc;
global.uniqid = require('uniqid');
const { customAlphabet } = require('nanoid');
const ElectronLog = require('electron-log');

class IpcEvents extends EventEmitter {}
global.ipcEventEmitter = new IpcEvents();

ElectronLog.transports.file.maxSize = 50048576; // Set the file size to 50MB

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const numberCharacters = '0123456789';
global.nanoid = customAlphabet(alphabet, 13);
const numnanoid = customAlphabet(numberCharacters, 4);

function getRandomuniquenumber(size = 4) {
  return numnanoid(size);
}

global.generateId = (size = 15) => {
  let id = global.nanoid(size);
  if (global.MAC_ADDRESS_PREFIX) {
    id = `${global.MAC_ADDRESS_PREFIX}${id}${getRandomuniquenumber()}`;
  }
  return id;
};

global.generateNumId = getRandomuniquenumber;

function getMacaddress() {
  let address = '';
  let mac = '';
  const networkInterfaces = os.networkInterfaces();
  if (networkInterfaces) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in, no-labels
    loop: for (const interfaceKey in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceKey];
      const { length } = networkInterface;
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < length; i++) {
        if (
          networkInterface[i] !== undefined &&
          networkInterface[i].mac &&
          networkInterface[i].mac !== '00:00:00:00:00:00'
        ) {
          mac = networkInterface[i].mac;
          // eslint-disable-next-line no-labels
          break loop;
        }
      }
    }

    // eslint-disable-next-line no-useless-escape
    address = mac ? parseInt(mac.replace(/\:|\D+/gi, ''), 10).toString(36) : '';
    if (address && address.length > 5) {
      address = address.substring(0, 5);
    }
  }
  // console.log({ address });
  global.MAC_ADDRESS_PREFIX = address;
}

getMacaddress();

Object.assign(console, ElectronLog.functions);
