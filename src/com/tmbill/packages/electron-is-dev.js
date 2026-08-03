let app;
try {
  app = process.type === 'browser' ? require('electron').app : require('@electron/remote').app;
} catch (e) {
  app = null;
}

const isEnvset = ['development', 'dev', 'testing'].includes(
  process.env.NODE_ENV,
);

const isDev = isEnvset && (app ? !app.isPackaged : true);

module.exports = isDev;
