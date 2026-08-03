const { Menu, MenuItem } = require('electron');
const { MISC_IPC } = require('../util/IPC_Messages');
const connection = require('../js/database');
const { updateSettingsOnNotification } = require('./UpdateDataOnNotifications');

global.betteripcMain.answerRenderer(MISC_IPC.GET_MENU_ASYNC, async () => {
  const menu = new Menu();
  menu.append(new MenuItem({}));
  return menu;
});

global.betteripcMain.answerRenderer(
  'get-platform-mapping-details',
  async (params) => {
    const platformMappingDetails = await connection.PlatformMapping.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
      },
    });
    return platformMappingDetails;
  },
);

global.betteripcMain.answerRenderer(
  'update-publish-menu-value',
  async (params) => {
    await connection.PlatformMapping.update(
      {
        is_published: params.value,
      },
      {
        where: {
          store_id: params.store_id,
        },
      },
    );
  },
);

global.betteripcMain.answerRenderer('update-pos-settings', async (params) => {
  await updateSettingsOnNotification(params);
});
