const os = require('os');

function getHeadersformposforrender(isFormdata) {
  const headers = {};

  if (window.storeDetails) {
    Object.assign(headers, {
      'x-user': window.storeDetails.username,
      'x-tmbill-key': window.storeDetails.token || '',
      Authorization: `Bearer ${window.storeDetails.token}`,
      'x-tmbill-source': 'atlantic_pos',
      'x-tmbill-storeid': window.storeDetails.store_id,
      machine_id: window.MACHINE_ID,
      'X-Machine-Id': String(window.MACHINE_ID),
      'X-Store-Id': String(window.storeDetails.store_id),
      'X-Terminal-Type': window.__IS_MASTER_POS__ ? 'POS' : 'Terminal',
      'X-App-Version': window.APP_VERSION,
      'X-Platform': os.platform(),
      'X-OS-Version': os.release(),
      'X-Electron-Version': process.versions.electron,
      'X-Local-IP': window.globalIPAddress,
      // 'X-Global-IP': globalIp || '',
    });
    if (isFormdata) {
      Object.assign(headers, {
        'Content-Type': 'multipart/form-data',
      });
    }

    if (!window.__IS_MASTER_POS__) {
      Object.assign(headers, {
        'x-user': window.storeDetails.master_pos_username,
      });
    }
  }
  return headers;
}

function getHeadersforchannelforrender(isFormdata) {
  const headers = {};
  if (window.storeDetails && window.ordersAPIKey) {
    Object.assign(headers, {
      'x-user': window.storeDetails.username,
      'x-tmbill-key': window.ordersAPIKey || '',
      Authorization: `apikey ${window.ordersAPIKey}`,
    });
    if (isFormdata) {
      Object.assign(headers, {
        'Content-Type': 'multipart/form-data',
      });
    }
  }
  return headers;
}

module.exports = { getHeadersformposforrender, getHeadersforchannelforrender };
