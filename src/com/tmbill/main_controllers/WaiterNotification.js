const { WaiterNotification, Sequelize } = require('../js/database');

async function addWaiterNotificationToDatabase({ notificationData }) {
  try {
    if (!notificationData) return;
    const notifiation = {
      store_id: notificationData.store_id,
      Message: notificationData.msg,
      username: global.storeDetails.username,
      table_id: notificationData.table_id,
      status: notificationData.status || 0,
    };

    await WaiterNotification.create(notifiation);
  } catch (error) {
    console.log('error:', error);
  }
}

async function getWaiterNotification(params) {
  try {
    const notifications = await WaiterNotification.findAll({
      raw: true,
      order: [['id', 'DESC']],
      where: {
        store_id: params?.store_id || global.storeDetails?.store_id,
        status: {
          [Sequelize.Op.in]: params?.status || [],
        },
      },
    });
    return notifications;
  } catch (error) {
    console.log(error);
  }
  return undefined;
}

async function closeRunningNotification(params) {
  try {
    const response = await WaiterNotification.update(params, {
      where: {
        id: params.id,
      },
    });

    return response;
  } catch (error) {
    console.log(error);
  }
  return undefined;
}

async function deleteNotificationsOfBeforeThirtyDays() {
  const date = global.moment().subtract(30, 'days').format('x');
  await WaiterNotification.destroy({
    where: {
      created_at: {
        [Sequelize.Op.lt]: date,
      },
    },
  });
}

module.exports = {
  addWaiterNotificationToDatabase,
  getWaiterNotification,
  closeRunningNotification,
  deleteNotificationsOfBeforeThirtyDays,
};
