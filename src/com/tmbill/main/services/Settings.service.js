const { Settings } = require('../../js/database');

async function getAppsettings() {
  let settingsConfig = [];
  try {
    settingsConfig = await Settings.findAll({
      raw: true,
      order: [['id', 'ASC']],
    });
  } catch (error) {
    settingsConfig = [];
  }
  return settingsConfig;
}

async function updateSettings(settings) {
  try {
    await Settings.update(
      {
        value: settings.value,
      },
      {
        where: {
          id: settings.id,
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

module.exports = {
  getAppsettings,
  updateSettings,
};
