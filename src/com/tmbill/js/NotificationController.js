let currentTimer = undefined;

let notificationsList = [];

function initializeNotification() {
  let notificationWrapper = $('<div>', {
    class: 'notifications-wrapper',
    id: 'notifications-wrapperid',
  });
  let notificationsTitle = $('<label>', {
    html: $.i18n.t('notificationScreen.NotificationTitle'),
    class: 'notifications-title',
  });
  let notificationsList = $('<ul>', {
    class: 'notifications-list',
    id: 'notifications-list-id',
  });
  let notificationsClear = $('<label>', {
    html: $.i18n.t('notificationScreen.clearAll'),
    class: 'notifications-title',
  }).on('click', () => {
    clearNotifications({ clearOld: true });
    $('#notificationIconid').popover('hide');
  });

  notificationWrapper.append(notificationsTitle);
  notificationWrapper.append(notificationsList);
  notificationWrapper.append(notificationsClear);

  //Close the popup if it leaves the popover
  $(document).on('mouseleave', '#notifications-wrapperid', function () {
    $('#notificationIconid').popover('hide');
  });

  //This will be triggered when the mouse is entered
  //on the list of filter and clears the settimeout
  //when will be triggered after 5 seconds when
  //the popover is open.By cancelling it we don't have
  //to worry about accidental popover closes.
  $(document).on('mouseenter', '#notifications-wrapperid', function () {
    clearTimeout(currentTimer);
  });

  //Add a settimeout of 5 seconds to close
  //the popover if user doesnot interact with
  //the filter list
  $('#notificationIconid').on('click', function () {
    currentTimer = setTimeout(() => {
      $('#notificationIconid').popover('hide');
    }, 5000);
  });
  let options = {
    content: notificationWrapper[0],
    html: true,
    id: 'demo',
  };
  $('#notificationIconid').popover(options);
  $('#notificationIconid').on('inserted.bs.popover', function () {
    addPopoverstyle($(this).attr('aria-describedby'));
    // $('#notification-badgeid').html('99+');
  });
  $('#notificationIconid').on('hidden.bs.popover', function () {
    clearNotifications({ clearOld: false });
  });
}

function clearNotifications({ clearOld }) {
  $('#notification-badgeid').html('');
  if (clearOld) {
    notificationsList = [];
    $('#notifications-list-id').empty();
  }
}

function addPopoverstyle(popperId) {
  if (popperId) {
    $(`#${popperId}`).addClass('notifications-popover');
  }
  shownotificationsIfexists();
}

function shownotificationsIfexists() {
  $('#notifications-list-id').empty();
  for (const notification of notificationsList) {
    let notificationItem = $('<li>', {
      class: 'row',
    });
    let iconWrapper = $('<div>', {
      class: 'd-flex icon-wrapper col-sm-2',
    });
    let icon = $('<div>', {
      class: 'notification-icon dash-icons',
      html: '&nbsp',
    });

    if (notification.icon) {
      $(icon).css('background', `url('${notification.icon}')`);
    } else if (notification.title && String(notification.title).length > 0) {
      icon.html(String(notification.title).charAt(0).toUpperCase());
    }

    let parentWrapper = $('<div>', {
      class: 'notification-itemdata-wrapper col-sm-10',
    });
    let titleWrapper = $('<div>', {
      class: 'notification-title-wrapper',
    });
    let title = $('<label>', {
      // html: notification.title,
      class: 'notification-item-title',
    });
    let date = notification.date;
    if (date && moment(date).isValid) {
      date = moment(date).format('hh:mm A');
    } else {
      date = moment().format('hh:mm A');
    }
    let arrivalDate = $('<label>', {
      html: date,
      class: 'notification-item-date',
    });

    let data = $('<div>', {
      class: 'notification-item-data',
      html: notification.data,
    });
    iconWrapper.append(icon);

    titleWrapper.append(title);
    titleWrapper.append(arrivalDate);
    parentWrapper.append(titleWrapper);
    parentWrapper.append(data);
    // moment().format('hh:mm A')

    notificationItem.append(iconWrapper);
    notificationItem.append(parentWrapper);
    $('#notifications-list-id').append(notificationItem);
  }
}

async function pushNotification(params) {
  notificationsList.push(params);
  incrementNotificationcount();
}

function incrementNotificationcount() {
  let count = notificationsList.length;
  if (count >= 99) {
    count = '99+';
  }
  $('#notification-badgeid').html(count);
}

module.exports = {
  pushNotification,
};
initializeNotification();
