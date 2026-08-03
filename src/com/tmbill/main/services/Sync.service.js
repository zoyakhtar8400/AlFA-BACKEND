const { debounce } = require('lodash');
const { startSync } = require('../../services/SyncService');

const debouncedstartSync = debounce(async (event, content) => {
  console.log('start sync::');
  await startSync(event, content || {}, false);
}, 8000); // 8000

function initSyncrequest(params) {
  try {
    debouncedstartSync(undefined, params);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  initSyncrequest,
};
