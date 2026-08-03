const { ipcMain } = require('electron');
const { ipcMain: betteripcMain } = require('electron-better-ipc');

const { Settings, Sequelize } = require('../../js/database');
const {
  UPDATE_SETTNGS,
  UPDATE_SETTNGS_REPLY,
} = require('../../util/IPC_Messages');
const { safeParseformain } = require('../../main_controllers/Utils');

ipcMain.on(UPDATE_SETTNGS, async (event, content) => {
  if (content) {
    try {
      const settings = safeParseformain(content);
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
      event.reply(UPDATE_SETTNGS_REPLY, undefined);
    } catch (error) {
      console.log(error);
    }
  }
});

betteripcMain.answerRenderer('get-terminal-settings', async (params) => {
  try {
    const settings = await Settings.findAll({
      raw: true,
      where: {
        id: {
          [Sequelize.Op.in]: params.settingId,
        },
      },
    });
    return settings;
  } catch (error) {
    console.error('Messgae=Error while fetching setting on id basis', error);
  }
});
