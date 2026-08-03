/* eslint-disable no-console */
const { setLocalStorage } = require('../../storage');
const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function fetchDatefromserver() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.COMMON.GET_DATE,
    );
    if (data && data.status) {
      if (window.Swal.isVisible()) window.Swal.close();
      setLocalStorage('current-date', data?.data?.date);
    }
  } catch (error) {
    console.error(error);
  }
}

async function setupPrinters(data) {
  if (data) {
    try {
      const tempPrinter = data;
      if (tempPrinter && tempPrinter.length > 0) {
        window.printersList = tempPrinter;
        tempPrinter.forEach((element) => {
          if (element.id === 1) {
            window.KOT_Printer = {
              no_of_prints: element.no_of_prints,
              deviceName: element.device_name,
              size: element.printer_size,
              printer_type: element.printer_type,
            };
            try {
              window.KOT_Printer.more_info = JSON.parse(element.more_info);
            } catch (error) {
              console.log(error);
              window.KOT_Printer.more_info = {};
            }
          }

          if (element.id === 2) {
            window.Bill_Printer = {
              no_of_prints: element.no_of_prints,
              deviceName: element.device_name,
              size: element.printer_size,
            };
          }
        });
      } else {
        window.printersList = [];
      }
    } catch (error) {
      window.printersList = [];
    }
  }
}

async function getPrinters() {
  try {
    window.ipcRenderer.send('get-printers', {});
  } catch (error) {
    console.error(error);
  }
}

async function getRunningBills() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.ORDER.CHECK_RUNNING_BILL,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function fetchStoredetails() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.STORE.GET_DETAILS,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function fetchallStoredetails() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.STORE.GET_ALL_STORES,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function fetchStoresettings() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.STORE.GET_SETTINGS,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function deleteStore(params) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.STORE.DELETE,
      params,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function fetchMultipricingSettings() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.STORE.GET_MULTIPRICING_SETTING,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}
module.exports = {
  fetchDatefromserver,
  getPrinters,
  setupPrinters,
  getRunningBills,
  fetchStoredetails,
  fetchallStoredetails,
  fetchStoresettings,
  deleteStore,
  fetchMultipricingSettings,
};
