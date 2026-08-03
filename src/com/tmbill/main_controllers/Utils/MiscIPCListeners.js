const { ipcMain } = require('electron');
const { MISC_IPC, SET_LANGUAGE } = require('../../util/IPC_Messages');
const { Store } = require('../../js/database');

ipcMain.on(MISC_IPC.GET_ALL_STORES_LIST, async (event) => {
  const storesList = await Store.findAll({
    attributes: ['store_id'],
    where: {},
    raw: true,
  });
  event.reply(MISC_IPC.GET_ALL_STORES_LIST, storesList);
});

global.betteripcMain.answerRenderer(SET_LANGUAGE, async (params) => {
  global.selectedLanguage = params.selectedLanguage;
});
