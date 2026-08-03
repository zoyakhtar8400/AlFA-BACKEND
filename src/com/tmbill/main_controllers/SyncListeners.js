const { sendPasscodeactivity } = require('../services/SyncService');
const { SYNC_LISTENERS_IPC } = require('../util/IPC_Messages');

global.betteripcMain.answerRenderer(
  SYNC_LISTENERS_IPC.LOG_PASSCODE_ACTIVITY,
  async () => {
    const result = await sendPasscodeactivity({
      store_id: global.storeDetails.store_id,
    });
    return result;
  },
);

async function sendLogpasscodeactivity(params) {
  const result = await sendPasscodeactivity(params);
  return result;
}

module.exports = {
  sendLogpasscodeactivity,
};
