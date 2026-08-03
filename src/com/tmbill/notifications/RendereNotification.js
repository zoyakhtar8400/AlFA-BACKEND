/**
 * Show's system notification
 * @param {Payload data} payload
 */
function showSystemnotification(payload) {
  if (payload && payload.body) {
    let body = payload.body;
    if (payload.body.constructor === 'test'.constructor) {
      body = JSON.parse(payload.body);
    }

    let msg = body.msg || '';
    let myNotification = new Notification(payload.title, {
      body: msg,
      title: payload.title || 'TMBill Atlantic POS',
      icon: payload.image,
    });

    myNotification.onclick = () => {
      let mainWindow = remote.getCurrentWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
      console.log('Notification clicked');
    };
  }
}

module.exports = {
  showSystemnotification,
};
