const { ipcMain } = require('electron');
const appSettingstore = require('../../packages/store');

ipcMain.on('SET_APPLICATION_TYPE', async (event, arg) => {
  try {
    if (arg?.type) await appSettingstore.set('TYPE', arg?.type || 'MASTER_POS');
    if (arg?.token) await appSettingstore.set('TOKEN', arg?.token);
  } catch (error) {
    console.error(error);
  }
});

async function isRunninginmastermode() {
  let isMaster = true;
  try {
    const type = await appSettingstore.get('TYPE');
    if (type === 'TERMINAL') {
      isMaster = false;
    }
  } catch (error) {
    console.error(`Message="Error While checking the master mode"`, error);
  }
  return isMaster;
}

async function getApplicationtypeset() {
  try {
    const type = await appSettingstore.getSync('TYPE');
    return type;
  } catch (error) {
    console.error(
      `Message="Error While Checking If Application Type is Set"`,
      error,
    );
  }
  return undefined;
}

async function isDevModeEnabled() {
  let enabled = false;
  try {
    const type = await appSettingstore.getSync('ENABLE_DEV_MODE');
    if (
      type &&
      ['S5VeehyTUP3Hc5N', '12noOiVrRZ2nLIUC', 'Ks9T9tQ9xzUn3rG'].includes(type)
    ) {
      enabled = true;
      process.env.FORCE_STAGING = true;
    }
  } catch (error) {
    console.error(error);
  }
  return enabled;
}

module.exports = {
  isRunninginmastermode,
  getApplicationtypeset,
  isDevModeEnabled,
};
