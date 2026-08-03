const commandlineArgv = require('minimist')(process.argv);
const { APP_TYPE } = require('./src/com/tmbill/constant');

function checkEnv() {
  let isMasterpos = commandlineArgv.appType === APP_TYPE.MASTER_POS;

  /**
   * This env is set in dev2 script
   * To run multiple instance of the application run
   * npm run master in first terminal
   * and run
   * npm run terminal in second terminal
   */
  if (process.env.RUN_AS_TERMINAL) {
    isMasterpos = false;
  }

  window.__IS_MASTER_POS__ = isMasterpos;
}
// window.addEventListener('DOMContentLoaded', () => {});
checkEnv();
