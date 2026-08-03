const { ORDER } = require('../server/SocketEvents');

function sendNotificationToOrderHub(content) {
  window.ipcRenderer.send(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, content);
}

module.exports = {
  sendNotificationToOrderHub,
};
