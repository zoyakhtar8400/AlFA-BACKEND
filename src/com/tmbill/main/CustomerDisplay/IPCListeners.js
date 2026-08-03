const { ipcMain } = require('electron');
const { CD_EVENTS, CD_SETTING_ID } = require('./Events');
const { safeParseformain } = require('../../main_controllers/Utils');
const { ROUNDOFF_UPTO_DECIMAL } = require('../../util/SettingIDs');

async function getCustomerdisplaySetting() {
  try {
    if (
      global.settingsConfig &&
      global.settingsConfig[CD_SETTING_ID - 1] &&
      global.settingsConfig[CD_SETTING_ID - 1].value
    ) {
      return safeParseformain(global.settingsConfig[CD_SETTING_ID - 1].value);
    }
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function getRoundoffsetting() {
  try {
    if (
      global.settingsConfig &&
      global.settingsConfig[ROUNDOFF_UPTO_DECIMAL - 1] &&
      global.settingsConfig[ROUNDOFF_UPTO_DECIMAL - 1].value
    ) {
      return global.settingsConfig[ROUNDOFF_UPTO_DECIMAL - 1].value;
    }
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

ipcMain.handle(CD_EVENTS.GET_STORE_DETAILS, async () => {
  const settings = await getCustomerdisplaySetting();
  const roundOffSetting = await getRoundoffsetting();
  return {
    storeDetails: global.storeDetails,
    settings,
    roundOffSetting,
    selectedLanguage: global.selectedLanguage,
  };
});

ipcMain.on(CD_EVENTS.UPDATE_STATE, async (_a, b) => {
  if (
    global.customerDisplaywindow &&
    !global.customerDisplaywindow.isDestroyed()
  ) {
    global.customerDisplaywindow.webContents.send(CD_EVENTS.UPDATE_STATE, b);
  }
});

ipcMain.on(CD_EVENTS.REFRESH, async (_a, b) => {
  if (
    global.customerDisplaywindow &&
    !global.customerDisplaywindow.isDestroyed()
  ) {
    global.customerDisplaywindow.webContents.send(CD_EVENTS.REFRESH, b);
  }
});

module.exports = {
  getCustomerdisplaySetting,
};
