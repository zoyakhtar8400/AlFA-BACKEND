const { TitlebarColor } = require('custom-electron-titlebar');

//Add alll the themes here after adding theme css file
const THEME_NAMES = {
  SYSTEM: {
    NAME: 'system',
    TITLEBAR_COLOR: '#fff',
  },
  DARK: {
    NAME: 'dark',
    TITLEBAR_COLOR: '#1c1c1e',
  },
  LIGHT: {
    NAME: 'light',
    TITLEBAR_COLOR: '#fff',
  },
};

window.CURRENT_APP_THEME = THEME_NAMES.LIGHT.NAME;

/**
 * Change the theme according to the preference
 * @param {*} param0
 */
function Initializetheme({ apptitleBar }) {
  try {
    if (Config.theme == THEME_NAMES.SYSTEM.NAME) {
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        Config.theme = THEME_NAMES.DARK.NAME;
      } else {
        Config.theme = THEME_NAMES.LIGHT.NAME;
      }
    }
    clearThemefiles();
    addThemeFile(Config.theme);
    switch (Config.theme) {
      case THEME_NAMES.LIGHT.NAME:
        if (apptitleBar != undefined) {
          apptitleBar.updateBackground(
            TitlebarColor.fromHex(THEME_NAMES.LIGHT.TITLEBAR_COLOR),
          );
        }
        window.CURRENT_APP_THEME = THEME_NAMES.LIGHT.NAME;
        break;
      case THEME_NAMES.DARK.NAME:
        if (apptitleBar != undefined) {
          apptitleBar.updateBackground(
            TitlebarColor.fromHex(THEME_NAMES.DARK.TITLEBAR_COLOR),
          );
        }
        window.CURRENT_APP_THEME = THEME_NAMES.DARK.NAME;
        break;
      default:
        if (apptitleBar != undefined) {
          apptitleBar.updateBackground(
            TitlebarColor.fromHex(THEME_NAMES.LIGHT.TITLEBAR_COLOR),
          );
        }
        window.CURRENT_APP_THEME = undefined;
        break;
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Add's theme file to the document head
 * @param {Theme file name} fileName
 */
function addThemeFile(fileName) {
  $("head link[rel='stylesheet']")
    .last()
    .after(
      `<link rel='stylesheet' href='../css/theme/${
        fileName ? fileName : THEME_NAMES.LIGHT.NAME
      }.css' type='text/css' >`,
    );
}

/**
 * Clear all the theme files if added
 */
function clearThemefiles() {
  $('link[href="../css/theme/dark.css"]').remove();
  $('link[href="../css/theme/light.css"]').remove();
}

module.exports = {
  Initializetheme,
};
