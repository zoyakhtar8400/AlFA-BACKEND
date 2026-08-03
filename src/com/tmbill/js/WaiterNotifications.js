const { debounce } = require('lodash');
const { showLoader } = require('./CommonUtils');
const {
  getWaiterNotificationsRequest,
} = require('../renderer/helper/Common.helper');

function Initialize() {
  setTimeout(() => {
    $('#openNotificationsbuttonid').on(
      'click',
      debounce(() => {
        renderOpenNotifications();
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#closedNotificationsbuttonid').on(
      'click',
      debounce(() => {
        renderClosedNotifications();
        $('#pullRemotekotButton').hide();
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#allnotificationsbuttonid').on(
      'click',
      debounce(() => {
        renderAllNotifications();
      }, 200),
    );
  }, 3000);
}

async function renderOpenNotifications() {
  $('#waiterNotificationstListID').empty();
  $('#openNotificationsbuttonid').addClass('active');
  $('#closedNotificationsbuttonid').removeClass('active');
  $('#allnotificationsbuttonid').removeClass('active');

  $('#waiterNotificationsModal').modal('show');
  const openNotifications = await getWaiterNotificationsRequest({
    status: [0],
    store_id: window.storeDetails.store_id,
  });

  if (openNotifications && openNotifications.length) {
    if (openNotifications.length <= 3) {
      $('#paginateNotification').empty();
      openNotifications.forEach((notifiation) => {
        showNotification(notifiation, 1);
      });
    }
    if (openNotifications.length > 3) {
      $('#paginateNotification').pagination({
        dataSource: openNotifications,
        pageSize: 3,
        callback(data, pagination) {
          if (data && data.length) {
            data.forEach((notifiation) => {
              showNotification(notifiation, 1);
            });
          }
        },
      });
    }
  }

  if (openNotifications.length == 0) {
    $('#NotificationNotFound').show();
  }
}

async function renderClosedNotifications() {
  $('#waiterNotificationstListID').empty();
  $('#openNotificationsbuttonid').removeClass('active');
  $('#closedNotificationsbuttonid').addClass('active');
  $('#allnotificationsbuttonid').removeClass('active');

  const closedNotifications = await getWaiterNotificationsRequest({
    status: [1],
    store_id: window.storeDetails.store_id,
  });

  if (closedNotifications && closedNotifications.length) {
    if (closedNotifications.length <= 4) {
      $('#paginateNotification').empty();

      closedNotifications.forEach((notifiation) => {
        showNotification(notifiation, 2);
      });
    }
    if (closedNotifications.length > 4) {
      $('#paginateNotification').pagination({
        dataSource: closedNotifications,
        pageSize: 4,
        callback(data, pagination) {
          if (data && data.length) {
            $('#waiterNotificationstListID').empty();
            data.forEach((notifiation) => {
              showNotification(notifiation, 2);
            });
          }
        },
      });
    }
  }

  if (closedNotifications.length == 0) {
    // Swal.close();
    $('#NotificationNotFound').show();
  }
}

async function renderAllNotifications() {
  $('#waiterNotificationstListID').empty();
  $('#openNotificationsbuttonid').removeClass('active');
  $('#closedNotificationsbuttonid').removeClass('active');
  $('#allnotificationsbuttonid').addClass('active');

  $('#waiterNotificationsModal').modal('show');
  const allNotifications = await getWaiterNotificationsRequest({
    status: [0, 1],
    store_id: window.storeDetails.store_id,
  });

  if (allNotifications && allNotifications.length) {
    if (allNotifications.length <= 4) {
      allNotifications.forEach((notifiation) => {
        $('#paginateNotification').empty();
        showNotification(notifiation, 2);
      });
    }
    if (allNotifications.length > 4) {
      $('#paginateNotification').pagination({
        dataSource: allNotifications,
        pageSize: 4,
        callback(data, pagination) {
          $('#waiterNotificationstListID').empty();

          if (data && data.length) {
            data.forEach((notifiation) => {
              showNotification(notifiation, 2);
            });
          }
        },
      });
    }
  }

  if (allNotifications.length == 0) {
    // Swal.close();

    $('#NotificationNotFound').show();
  }
}
async function openNotificationsListModal() {
  $('#waiterNotificationstListID').empty();
  $('#openNotificationsbuttonid').addClass('active');
  $('#closedNotificationsbuttonid').removeClass('active');
  $('#allnotificationsbuttonid').removeClass('active');

  $('#waiterNotificationsModal').modal('show');
  const openNotifications = await getWaiterNotificationsRequest({
    status: [0],
    store_id: window.storeDetails.store_id,
  });

  if (openNotifications && openNotifications.length) {
    if (openNotifications.length <= 3) {
      $('#paginateNotification').empty();

      openNotifications.forEach((notifiation) => {
        showNotification(notifiation, 1);
      });
    }
    if (openNotifications.length > 3) {
      $('#paginateNotification').pagination({
        dataSource: openNotifications,
        pageSize: 3,
        callback(data, pagination) {
          if (data && data.length) {
            $('#waiterNotificationstListID').empty();
            data.forEach((notifiation) => {
              showNotification(notifiation, 1);
            });
          }
        },
      });
    }
  }

  if (openNotifications.length == 0) {
    $('#NotificationNotFound').show();
  }
}

async function showNotification(notification, isOpenNotification = 1) {
  if (notification && notification.constructor == Object) {
    const kotCard = $('<li>', {
      class: 'card w-100 remoteKotCard',
    });
    const cardBody = $('<div>', {
      class: 'card-body waiter-notification-card-body',
      html: '',
    });

    let notificationTitle;
    if (notification.Message) {
      notificationTitle = $('<div>', {
        class: 'has-i18n waiter-notification-title',
        html: `Title - ${notification.Message}`,
      });
    }

    let tableName;
    if (notification.table_id) {
      const table = allTableslist.find((o) => o.id == notification.table_id);

      tableName = table.table_name;
      tableName = $('<div>', {
        class: 'bold remoteKotTableid',
        // id:'remoteKotTableid',
        html: `${$.i18n.t(
          'controller:remoteKotController.Table',
        )}: ${tableName}`,
      });
    }

    let notifiationDate;
    if (notification.created_at) {
      const d = new Date(parseInt(notification.created_at));
      const formattedDate = moment(d).format('DD MMMM YYYY hh:mm A');
      notifiationDate = $('<div>', {
        class: '',
        text: `Placed at - ${formattedDate}`,
        title: formattedDate,
      });
    }

    cardBody.append(notificationTitle);
    cardBody.append(tableName);
    cardBody.append(notifiationDate);
    if (notification.status == 1) {
      let notifiationCloseDate;
      if (notification.updated_at) {
        const d = new Date(parseInt(notification.updated_at));
        const formattedDate = moment(d).format('DD MMMM YYYY hh:mm A');
        notifiationCloseDate = $('<div>', {
          class: '',
          text: `Closed at - ${formattedDate}`,
          title: formattedDate,
        });
      }
      cardBody.append(notifiationCloseDate);
    }

    const buttonsWrapper = $('<div>', {
      class: 'd-flex waiter-notification-actions-container',
    });
    if (notification.status == 0) {
      const closeButton = $('<button>', {
        class: 'btn btn-outline-success closeWaiterNotificationButton',
        html: 'Close Request',
      })
        .attr('notification_data', JSON.stringify(notification))
        .click(function (e) {
          $('#waiterNotificationstListID li').removeClass('selected-order');
          $(this).closest('li').addClass('selected-order');
          const notificationData = $(this).attr('notification_data');
          if (notificationData != undefined) {
            sendCloseNotificationStatus(
              JSON.parse(notificationData),
              isOpenNotification,
            );
          }
        });
      buttonsWrapper.append(closeButton);
      cardBody.append(buttonsWrapper);
    } else {
      const closeButton = $('<button>', {
        class: 'btn btn-outline-primary closeWaiterNotificationButton',
        html: 'Open Request',
      })
        .attr('notification_data', JSON.stringify(notification))
        .click(function (e) {
          $('#waiterNotificationstListID li').removeClass('selected-order');
          $(this).closest('li').addClass('selected-order');
          const notificationData = $(this).attr('notification_data');
          if (notificationData != undefined) {
            sendOpenNotificationStatus(
              JSON.parse(notificationData),
              isOpenNotification,
            );
          }
        });
      buttonsWrapper.append(closeButton);
      cardBody.append(buttonsWrapper);
    }

    kotCard.append(cardBody);

    $('#waiterNotificationstListID').append(kotCard);
  }
}

async function sendCloseNotificationStatus(
  notificationData,
  isOpenNotification,
) {
  const data = {
    id: notificationData.id,
    status: 1,
    updated_at: Date.now(),
  };
  const updateResponse = await betteripcRenderer.callMain(
    'close-running-notification',
    data,
  );
  if (updateResponse) {
    if (isOpenNotification == 1) {
      renderOpenNotifications();
    } else {
      renderAllNotifications();
    }
  }
}

async function sendOpenNotificationStatus(
  notificationData,
  isOpenNotification,
) {
  const data = {
    id: notificationData.id,
    status: 0,
    created_at: Date.now(),
  };
  const updateResponse = await betteripcRenderer.callMain(
    'close-running-notification',
    data,
  );
  if (updateResponse) {
    if (isOpenNotification == 2) {
      renderClosedNotifications();
    } else {
      renderAllNotifications();
    }
  }
}

Initialize();

module.exports = {
  openNotificationsListModal,
};
