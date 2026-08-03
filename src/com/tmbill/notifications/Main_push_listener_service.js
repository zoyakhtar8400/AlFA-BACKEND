const { ipcMain } = require('electron');
const {
  SERVER_MESSAGE_RECEIVED,
  SHOW_NOTIFICATION,
} = require('../util/IPC_Messages');

const stringConstructor = 'test'.constructor;

ipcMain.on(SERVER_MESSAGE_RECEIVED, (event, serverNotificationPayload) => {
  console.log(`Message="Notification Received in Main Process"`);
  if (serverNotificationPayload.constructor === stringConstructor) {
    // eslint-disable-next-line no-param-reassign
    serverNotificationPayload = JSON.parse(serverNotificationPayload);
  }

  const notifyData = {
    issystemNotification: true,
    data: serverNotificationPayload,
  };
  event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));
});
