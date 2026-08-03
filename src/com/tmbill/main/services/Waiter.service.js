const {
  getWaiterNotification,
  closeRunningNotification,
} = require('../../main_controllers/WaiterNotification');

async function requestGetWaiternotifications(data) {
  try {
    if (data && data.store_id) {
      const response = await getWaiterNotification(data);
      return response;
    }
    console.warn(
      `Message="Invalid Get Waiter Notifications Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Getting Waiter Notifications " Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

async function requestcloseRunningNotification(data) {
  try {
    if (data) {
      const response = await closeRunningNotification(data);
      return response;
    }
    console.warn(
      `Message="Invalid Close Running Notification Status Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Closing Running Notification Status." Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

module.exports = {
  requestGetWaiternotifications,
  requestcloseRunningNotification,
};
