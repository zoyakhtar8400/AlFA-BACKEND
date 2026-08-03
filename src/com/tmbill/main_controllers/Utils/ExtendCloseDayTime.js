/* eslint-disable camelcase */
const { Store } = require('../../js/database');
const { SET_STOREDETAILS } = require('../../util/IPC_Messages');

async function extendCloseDayTime({ extendMinutes }) {
  console.log(`Message="Day extended by ${extendMinutes} minutes"`);

  // Current time
  const date = new Date();

  // Add minutes from NOW
  date.setMinutes(date.getMinutes() + Number(extendMinutes));

  // Format to HH:mm:ss
  const extendedTime = date.toTimeString().slice(0, 8);

  await Store.update(
    {
      day_close_time: extendedTime,
    },
    {
      where: {
        store_id: global.storeDetails.store_id,
      },
    },
  );

  const storeDetail = await Store.findOne({
    raw: true,
    where: {
      store_id: global.storeDetails.store_id,
    },
  });

  // Sync store details everywhere
  global.mainWindow.webContents.send('set-store-details', {
    storeDetails: storeDetail,
  });

  global.ipcEventEmitter.emit(SET_STOREDETAILS, {
    storeDetails: storeDetail,
  });

  global.storeDetails = storeDetail;

  return extendedTime;
}

// function getClosingTimestamp(start_day_date, day_close_time) {
//   const [hh, mm, ss] = day_close_time.split(':').map(Number);

//   const startDay = new Date(start_day_date);
//   const closeDate = new Date(startDay);

//   // Set close time on the same date initially
//   closeDate.setHours(hh, mm, ss, 0);

//   const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

//   // If closing time is before start time → it means closing is next day
//   if (closeDate.getTime() <= startDay.getTime()) {
//     // this is for start day before 2 hour but in different day support day started at 11:50 pm and day close time is 01:30 AM
//     if (startDay.getTime() - closeDate.getTime() <= TWO_HOURS_MS) {
//       closeDate.setDate(closeDate.getDate() + 2);
//     } else {
//       closeDate.setDate(closeDate.getDate() + 1);
//     }
//   } else if (closeDate.getTime() - startDay.getTime() <= TWO_HOURS_MS) {
//     // if day started before 2 hours of close day time then consider closing is next day
//     closeDate.setDate(closeDate.getDate() + 1);
//   }

//   return closeDate.getTime();
// }

function getClosingTimestamp(start_day_date, day_close_time) {
  const startDate = new Date(start_day_date);

  const [hh, mm, ss] = day_close_time.split(':').map(Number);

  // Create close date on SAME day first
  const closeDate = new Date(startDate);
  closeDate.setHours(hh, mm, ss || 0, 0);

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  // Case 1: Close time is before or equal to start time → next day
  if (closeDate <= startDate) {
    closeDate.setDate(closeDate.getDate() + 1);
  }

  // Case 2: Start time is within last 2 hours & close is early morning
  const endOfDay = new Date(startDate);
  endOfDay.setHours(23, 59, 59, 999);

  const timeLeftInDay = endOfDay - startDate;

  // if (timeLeftInDay <= TWO_HOURS_MS && closeDate - startDate <= TWO_HOURS_MS) {
  //   closeDate.setDate(closeDate.getDate() + 1);
  // }

  if (closeDate - startDate <= TWO_HOURS_MS) {
    closeDate.setDate(closeDate.getDate() + 1);
  }

  return closeDate.getTime();
}

function isDayClosed(start_day_date, day_close_time) {
  const closingTimestamp = getClosingTimestamp(start_day_date, day_close_time);
  const now = Date.now();

  return now >= closingTimestamp;
}

module.exports = {
  extendCloseDayTime,
  isDayClosed,
};
