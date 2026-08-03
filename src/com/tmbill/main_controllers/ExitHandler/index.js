/* eslint-disable camelcase */
const { dialog, app } = require('electron');
const {
  checkIfsyncisneeded,
  startSync,
} = require('../../services/SyncService');
const { checkIfKOTIsRunning } = require('../Order');
const connection = require('../../js/database');
const { sleep } = require('../Utils');
const { apiCall } = require('../../services/APIService');
const {
  checkDayisstarted,
  checkDayisstartedForExitHandler,
} = require('../../js/MainIPClisteners');

function shouldShowDayClosePopup(start_day_date, day_close_time) {
  const [hh, mm, ss] = day_close_time.split(':').map(Number);

  const startDay = new Date(start_day_date);
  const closeDate = new Date(startDay);

  // If closing time is same-day or next-day we handle automatically:
  const now = Date.now();

  // Build closing timestamp
  closeDate.setHours(hh, mm, ss, 0);
  if (closeDate.getTime() <= startDay.getTime()) {
    // closing is next day (e.g., 01:59 AM)
    closeDate.setDate(closeDate.getDate() + 1);
  }

  const closingTime = closeDate.getTime();

  // 1 hour buffer (before & after)
  const BUFFER = 1 * 60 * 60 * 1000;
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  // if (startDay.getTime() < closingTime - TWO_HOURS) {
  //   return false;
  // }

  if (closingTime < closingTime - TWO_HOURS) {
    return false;
  }

  if (now >= closingTime) {
    // BUFFER
    // closingTime - BUFFER
    return true; // show popup
  }

  return false; // don't show popup
}

function showDialog({ type, buttons, title, message, icon }) {
  const options = {
    type: type || 'warning',
    buttons,
    title: title || 'TMBill',
    message,
    icon: icon || './src/com/tmbill/assets/logo.ico',
  };

  // Synchronous usage
  const dialogResult = dialog.showMessageBoxSync(global.mainWindow, options);
  return dialogResult;
}

async function updateStoresettings() {
  try {
    await connection.Store.update(
      { settings: { userlogged: false } },
      { where: { store_id: global.storeDetails.store_id } },
    );

    if (global.addLoginValidationForCskTerminalUsers) {
      await connection.UserLoginStatus.update(
        { status: 0 },
        {
          where: {
            id: Number(global.storeDetails.id),
            store_id: global.storeDetails.store_id,
          },
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
}

async function HandleExitEvent(event) {
  event.preventDefault();
  // eslint-disable-next-line no-param-reassign
  event.returnValue = false;
  let showClosepopup = false;
  let skipChecks = false;

  const senderWindow = event.sender;

  if (senderWindow && String(event.sender.getTitle() || '').includes('Login')) {
    skipChecks = true;
    showClosepopup = true;
  }

  if (!skipChecks && global.storeDetails) {
    // isBillRunning = await checkIfKOTIsRunning();
    const isSyncneeded = await checkIfsyncisneeded(
      global.storeDetails.store_id,
      global.storeDetails.username,
    );

    const isBillRunning = await checkIfKOTIsRunning();

    if (isBillRunning && isBillRunning.length) {
      // event.preventDefault();
      // Synchronous usage
      const dialogResult = showDialog({
        type: 'warning',
        buttons: ['Settle Now', 'Later'],
        title: 'TMBill',
        message: 'Kindly settle the running orders.',
        icon: './src/com/tmbill/assets/logo.ico',
      });

      // Settle Now
      if (dialogResult === 0) {
        event.preventDefault();
        senderWindow.focus();
        return;
      }
      if (dialogResult === 1) {
        showClosepopup = true;
      }
    }

    if (isSyncneeded) {
      // Synchronous usage
      const dialogResult = showDialog({
        type: 'warning',
        buttons: ['Sync Now', 'Later'],
        title: 'TMBill',
        message:
          'Your Invoice/Bill data are not synced yet. Do you really want to sync it?.',
        icon: './src/com/tmbill/assets/logo.ico',
      });
      // Sync Now Clicked
      if (dialogResult === 0) {
        event.preventDefault();
        senderWindow.focus();
        const data = { silentSync: true, logout: false };
        await startSync(undefined, data, false);
        return;
      }
      if (dialogResult === 1) {
        showClosepopup = true;
      }
    }

    if (global.fetchReportAsPerCloseDay) {
      const shouldShowClosedayAlert = shouldShowDayClosePopup(
        global.start_day_date,
        global.storeDetails.day_close_time,
      );
      if (shouldShowClosedayAlert) {
        const dialogResult = showDialog({
          type: 'warning',
          buttons: ['Later', 'Close Now'],
          title: 'TMBill',
          message:
            'Your day is not closed yet. Do you really want to close it?.',
          icon: './src/com/tmbill/assets/logo.ico',
        });
        if (dialogResult === 1) {
          event.preventDefault();
          senderWindow.focus();
          checkDayisstartedForExitHandler({
            store_id: global.storeDetails.store_id,
            tmpos_id: global.storeDetails.tmpos_id,
            shift_start_by_user: global.storeDetails.username,
          });
          return;
        }
        if (dialogResult === 0) {
          showClosepopup = true;
        }
      }
    }
    if (!isSyncneeded && !isBillRunning.length) {
      showClosepopup = true;
    }
  }

  if (global.dbOperationisinprogress) {
    console.log(`Message="DB Operation is in progress.."`);
    await sleep(2500);
  }

  let exitMessage = 'Do you really want to exit ?';
  if (global.dbOperationisinprogress) {
    exitMessage += ` Some operations are in progress.`;
  }

  if (showClosepopup) {
    const dialogResult = showDialog({
      type: 'warning',
      buttons: ['Yes', 'No'],
      title: 'TMBill',
      message: exitMessage,
      icon: './src/com/tmbill/assets/logo.ico',
    });
    if (dialogResult === 1) {
      event.preventDefault();
      senderWindow.focus();
      return;
    }
    // Check if logout on close is on
    if (dialogResult === 0) {
      if (
        global.storeDetails &&
        global.storeDetails.logout_after_close_pos_app
      ) {
        console.log('logout on close pos');
        await updateStoresettings();
      }
      app.exit(0);
    }
  }
}

async function HandleExitEventForTerminal(event) {
  event.preventDefault();
  // eslint-disable-next-line no-param-reassign
  event.returnValue = false;
  const senderWindow = event.sender;

  const dialogResult = showDialog({
    type: 'warning',
    buttons: ['Yes', 'No'],
    title: 'TMBill',
    message: 'Do you really want to exit ?',
    icon: './src/com/tmbill/assets/logo.ico',
  });
  if (dialogResult === 1) {
    event.preventDefault();
    senderWindow.focus();
    return;
  }
  // Check if logout on close is on
  if (dialogResult === 0) {
    global.mainWindow.webContents.send('logout-user', {});
    app.exit(0);
  }
}

module.exports = {
  HandleExitEvent,
  HandleExitEventForTerminal,
};
