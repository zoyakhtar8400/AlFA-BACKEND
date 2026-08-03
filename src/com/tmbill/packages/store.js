const electron = require('electron');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const writeFileAtomic = require('write-file-atomic');
const { get: _get, has: _has, set: _set, unset: _unset } = require('lodash');

const defaultConfig = {
  atomicSave: true,
  fileName: 'settings.json',
  numSpaces: 2,
  prettify: false,
};

// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString();
};

/** @internal */
let config = {
  ...defaultConfig,
};

/**
 * Returns the Electron instance. The developer may define
 * a custom Electron instance by using `configure()`.
 *
 * @returns The Electron instance.
 * @internal
 */
function getElectron() {
  return config.electron ?? electron;
}

/**
 * Returns the Electron app. The app may need be accessed
 * via `Remote` depending on whether this code is running
 * in the main or renderer process.
 *
 * @returns The Electron app.
 * @internal
 */
function getElectronApp() {
  const e = getElectron();
  const app = e.app ?? e.remote.app;

  return app;
}

/**
 * Returns the path to the settings directory. The path
 * may be customized by the developer by using
 * `configure()`.
 *
 * @returns The path to the settings directory.
 * @internal
 */
function getSettingsDirPath() {
  return config.dir ?? getElectronApp().getPath('userData');
}

/**
 * Returns the path to the settings file. The file name
 * may be customized by the developer using `configure()`.
 *
 * @returns The path to the settings file.
 * @internal
 */
function getSettingsFilePath() {
  const dir = getSettingsDirPath();

  return path.join(dir, config.fileName);
}

/**
 * Ensures that the settings file exists. If it does not
 * exist, then it is created.
 *
 * @returns A promise which resolves when the settings file exists.
 * @internal
 */
function ensureSettingsFile() {
  const filePath = getSettingsFilePath();

  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // eslint-disable-next-line no-use-before-define
          saveSettings({}).then(resolve, reject);
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
}

/**
 * Ensures that the settings file exists. If it does not
 * exist, then it is created.
 *
 * @internal
 */
function ensureSettingsFileSync() {
  const filePath = getSettingsFilePath();

  try {
    fs.statSync(filePath);
  } catch (err) {
    const e = err;
    if (e) {
      if (e.code === 'ENOENT') {
        // eslint-disable-next-line no-use-before-define
        saveSettingsSync({});
      } else {
        throw err;
      }
    }
  }
}

/**
 * Ensures that the settings directory exists. If it does
 * not exist, then it is created.
 *
 * @returns A promise which resolves when the settings dir exists.
 * @internal
 */
function ensureSettingsDir() {
  const dirPath = getSettingsDirPath();

  return new Promise((resolve, reject) => {
    fs.stat(dirPath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          mkdirp(dirPath).then(() => resolve(), reject);
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
}

/**
 * Ensures that the settings directory exists. If it does
 * not exist, then it is created.
 *
 * @internal
 */
function ensureSettingsDirSync() {
  const dirPath = getSettingsDirPath();

  try {
    fs.statSync(dirPath);
  } catch (err) {
    const e = err;
    if (e) {
      if (e.code === 'ENOENT') {
        mkdirp.sync(dirPath);
      }
    } else {
      throw err;
    }
  }
}

/**
 * First ensures that the settings file exists then loads
 * the settings from the disk.
 *
 * @returns A promise which resolves with the settings object.
 * @internal
 */
function loadSettings() {
  return ensureSettingsFile().then(() => {
    const filePath = getSettingsFilePath();

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (err2) {
            reject(err2);
          }
        }
      });
    });
  });
}

/**
 * First ensures that the settings file exists then loads
 * the settings from the disk.
 *
 * @returns The settings object.
 * @internal
 */
function loadSettingsSync() {
  const filePath = getSettingsFilePath();

  ensureSettingsFileSync();

  const data = fs.readFileSync(filePath, 'utf-8');

  return JSON.parse(data);
}

/**
 * Saves the settings to the disk.
 *
 * @param obj The settings object to save.
 * @returns A promise which resolves when the settings have been saved.
 * @internal
 */
function saveSettings(obj) {
  return ensureSettingsDir().then(() => {
    const filePath = getSettingsFilePath();
    const numSpaces = config.prettify ? config.numSpaces : 0;
    const data = JSON.stringify(obj, null, numSpaces);

    return new Promise((resolve, reject) => {
      if (config.atomicSave) {
        writeFileAtomic(filePath, data, (err) =>
          err ? reject(err) : resolve(),
        );
      } else {
        fs.writeFile(filePath, data, (err) => (err ? reject(err) : resolve()));
      }
    });
  });
}

/**
 * Saves the settings to the disk.
 *
 * @param obj The settings object to save.
 * @internal
 */
function saveSettingsSync(obj) {
  const filePath = getSettingsFilePath();
  const numSpaces = config.prettify ? config.numSpaces : 0;
  const data = JSON.stringify(obj, null, numSpaces);

  ensureSettingsDirSync();

  if (config.atomicSave) {
    writeFileAtomic.sync(filePath, data);
  } else {
    fs.writeFileSync(filePath, data);
  }
}

/**
 * Returns the path to the settings file.
 *
 * In general, the settings file is stored in your app's
 * user data directory in a file called `settings.json`.
 * The default user data directory varies by system.
 *
 * - **macOS** - `~/Library/Application\ Support/<Your App>`
 * - **Windows** - `%APPDATA%/<Your App>`
 * - **Linux** - Either `$XDG_CONFIG_HOME/<Your App>` or
 * `~/.config/<Your App>`
 *
 * Although it is not recommended, you may change the name
 * or location of the settings file using
 * [[configure|configure()]].
 *
 * @returns The path to the settings file.
 * @example
 *
 * Get the path to the settings file.
 *
 *     settings.file();
 *     // => /home/nathan/.config/MyApp/settings.json
 */
function file() {
  return getSettingsFilePath();
}

/**
 * Sets the configuration for Electron Settings. To reset
 * to defaults, use [[reset|reset()]].
 *
 * Defaults:
 *
 *     {
 *       atomicSave: true,
 *       fileName: 'settings.json',
 *       numSpaces: 2,
 *       prettify: false
 *     }
 *
 * @param customConfig The custom configuration to use.
 * @example
 *
 * Update the filename to `cool-settings.json` and prettify
 * the output.
 *
 *     settings.configure({
 *       fileName: 'cool-settings.json',
 *       prettify: true
 *     });
 */
function configure(customConfig) {
  config = { ...config, ...customConfig };
}

/**
 * Resets the Electron Settings configuration to defaults.
 *
 * @example
 *
 * Reset configuration to defaults.
 *
 *     settings.reset();
 */
function reset() {
  config = { ...defaultConfig };
}

/**
 * Checks if the given key path exists. For sync,
 * use [[hasSync|hasSync()]].
 *
 * @category Core
 * @param keyPath The key path to check.
 * @returns A promise which resolves to `true` if the
 * `keyPath` exists, else `false`.
 * @example
 *
 * Check if the value at `color.name` exists.
 *
 *     // Given:
 *     //
 *     // {
 *     //   "color": {
 *     //     "name": "cerulean",
 *     //     "code": {
 *     //       "rgb": [0, 179, 230],
 *     //       "hex": "#003BE6"
 *     //     }
 *     //   }
 *     // }
 *
 *     const exists = await settings.has('color.name');
 *     // => true
 *
 * @example
 *
 * Check if the value at `color.hue` exists.
 *
 *     const h = 'hue';
 *     const exists = await settings.has(['color', h]);
 *     // => false
 *
 *  @example
 *
 * Check if the value at `color.code.rgb[1]` exists.
 *
 *     const exists = await settings.has(color.code.rgb[1]);
 *     // => true
 */
async function has(keyPath) {
  const obj = await loadSettings();

  return _has(obj, keyPath);
}

/**
 * Checks if the given key path exists. For async,
 * use [[hasSync|hasSync()]].
 *
 * @category Core
 * @param keyPath The key path to check.
 * @returns `true` if the `keyPath` exists, else `false`.
 * @example
 *
 * Check if the value at `color.name` exists.
 *
 *     // Given:
 *     //
 *     // {
 *     //   "color": {
 *     //     "name": "cerulean",
 *     //     "code": {
 *     //       "rgb": [0, 179, 230],
 *     //       "hex": "#003BE6"
 *     //     }
 *     //   }
 *     // }
 *
 *     const exists = settings.hasSync('color.name');
 *     // => true
 *
 * @example
 *
 * Check if the value at `color.hue` exists.
 *
 *     const h = 'hue';
 *     const exists = settings.hasSync(['color', h]);
 *     // => false
 *
 * @example
 *
 * Check if the value at `color.code.rgb[1]` exists.
 *
 *     const exists = settings.hasSync(color.code.rgb[1]);
 *     // => true
 */
function hasSync(keyPath) {
  const obj = loadSettingsSync();

  return _has(obj, keyPath);
}

async function get(keyPath) {
  const obj = await loadSettings();

  if (keyPath) {
    return _get(obj, keyPath);
  }
  return obj;
}

function getSync(keyPath) {
  const obj = loadSettingsSync();

  if (keyPath) {
    return _get(obj, keyPath);
  }
  return obj;
}

async function set(...args) {
  if (args.length === 1) {
    const [value] = args;

    return saveSettings(value);
  }
  const [keyPath, value] = args;
  const obj = await loadSettings();

  _set(obj, keyPath, value);

  return saveSettings(obj);
}

function setSync(...args) {
  if (args.length === 1) {
    const [value] = args;

    saveSettingsSync(value);
  } else {
    const [keyPath, value] = args;
    const obj = loadSettingsSync();

    _set(obj, keyPath, value);

    saveSettingsSync(obj);
  }
}

async function unset(keyPath) {
  if (keyPath) {
    const obj = await loadSettings();

    _unset(obj, keyPath);

    return saveSettings(obj);
  }
  // Unset all settings by saving empty object.
  return saveSettings({});
}

function unsetSync(keyPath) {
  if (keyPath) {
    const obj = loadSettingsSync();

    _unset(obj, keyPath);

    saveSettingsSync(obj);
  } else {
    // Unset all settings by saving empty object.
    saveSettingsSync({});
  }
}

module.exports = {
  file,
  configure,
  reset,
  has,
  hasSync,
  get,
  getSync,
  set,
  setSync,
  unset,
  unsetSync,
};
