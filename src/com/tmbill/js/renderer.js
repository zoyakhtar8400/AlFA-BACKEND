/* eslint-disable no-useless-escape */
/* eslint-disable no-labels */
/* eslint-disable strict */

'use strict';

window.moment = require('moment');
window._ = require('lodash');
const { json2excel } = require('js2excel');
window.XLSX = require('../util/xlsx');
window.request = require('request-promise');
window.ipcRenderer = require('electron').ipcRenderer;
window.remote = require('@electron/remote');
window.elog = require('electron-log');
const fs = require('fs');
window.Howl = require('howler').Howl;
window.Howler = require('howler').Howler;
window.uniqid = require('uniqid');
const os = require('os');
const { customAlphabet } = require('nanoid');
const { ipcRenderer: betteripcRenderer } = require('electron-better-ipc');

// window.elog.transports.file.maxSize = 50048576; // Set the file size to 50MB

window.fileSystem = fs;
window.json2excel = json2excel;
window.betteripcRenderer = betteripcRenderer;

window.Swal = require('../util/Notification').Swal;
const { Config: appConfig } = require('../config/config');

window.Config = appConfig;

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const numberCharacters = '0123456789';
window.nanoid = customAlphabet(alphabet, 13);
const numnanoid = customAlphabet(numberCharacters, 4);
window.specialCharRegex = /[`!$%^*+\=\[\]{}'"\\|<>\?~]/;
window.allspecialCharRegex = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
window.someSpecialCharRegex = /[`!$%^*\=\[\]{}'"\\|\?~]/;
window.onlyNumberRegex = /\d+/;
window.emailRegex = /\S+@\S+\.\S+/;

function getMacaddress() {
  let address = '';
  let mac = '';
  const networkInterfaces = os.networkInterfaces();
  if (networkInterfaces) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
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
    address = mac ? parseInt(mac.replace(/\:|\D+/gi, ''), 10).toString(36) : '';
    if (address && address.length > 5) {
      address = address.substring(0, 5);
    }
  }

  window.MAC_ADDRESS_PREFIX = address;
}

function getRandomuniquenumber() {
  return numnanoid();
}

window.generateId = (size = 15) => {
  let id = window.nanoid(size);
  if (window.MAC_ADDRESS_PREFIX) {
    id = `${window.MAC_ADDRESS_PREFIX}${id}${getRandomuniquenumber()}`;
  }
  return id;
};

getMacaddress();

Object.assign(console, window.elog.functions);

// window.poper=require('@popperjs/core');
