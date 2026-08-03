/* eslint-disable camelcase */
// function getClosingTimestamp(start_day_date, day_close_time) {
//   const [hh, mm, ss] = day_close_time.split(':').map(Number);

const { SHOW_CLOSE_DAY_WINDOW } = require('../../util/IPC_Messages');

//   const startDay = new Date(start_day_date);
//   const closeDate = new Date(startDay);

//   // Closing always next day
//   closeDate.setDate(closeDate.getDate() + 1);
//   closeDate.setHours(hh, mm, ss, 0);

//   return closeDate.getTime();
// }

window.ipcRenderer.on(SHOW_CLOSE_DAY_WINDOW, async (event, reply) => {
  try {
    $('#menuManagementIcon').click();
    setTimeout(() => {
      $('#closeDaybuttonid').click();
    }, 100);
  } catch (error) {
    console.error(error);
  }
});

function getClosingTimestamp(start_day_date, day_close_time) {
  const [hh, mm, ss] = day_close_time.split(':').map(Number);

  const startDay = new Date(start_day_date);
  const closeDate = new Date(startDay);

  // Set close time on the same date initially
  closeDate.setHours(hh, mm, ss, 0);

  // If closing time is before start time → it means closing is next day
  if (closeDate.getTime() <= startDay.getTime()) {
    closeDate.setDate(closeDate.getDate() + 1);
  }

  return closeDate.getTime();
}

function isDayClosed(start_day_date, day_close_time) {
  const closingTimestamp = getClosingTimestamp(start_day_date, day_close_time);
  const now = Date.now();

  return now >= closingTimestamp;
}

function showDayClosePopup() {
  window.Swal.fire({
    title: 'Day Closed',
    html: `
      <div style="font-size:17px; margin-top:8px;">
        You cannot continue because the business day is closed.<br>
        Please perform <b>Day Close</b> to unlock the system.
      </div>
    `,
    icon: 'warning',
    backdrop: 'rgba(0,0,0,0.7)',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: 'Proceed to Day Close',
    confirmButtonColor: '#f44336',
  }).then((result) => {
    console.log('then block');
    if (result.isConfirmed) {
      $('#menuManagementIcon').click();
      setTimeout(() => {
        $('#closeDaybuttonid').click();
      }, 100);
    }
  });
}

const scheduleDayClosePopup = (() => {
  console.log('schedule day close');
  let timerSet = false; // prevents multiple timers
  let timerId = null; // so we can clear existing timer

  return function (start_day_date, day_close_time) {
    if (timerSet) return; // already scheduled → exit

    timerSet = true; // lock future calls

    const closingTimestamp = getClosingTimestamp(
      start_day_date,
      day_close_time,
    );

    const now = Date.now();

    // If time already passed → show popup immediately
    if (now >= closingTimestamp) {
      showDayClosePopup();
      return;
    }

    const timeLeft = closingTimestamp - now;

    // Clear any existing timer (safety)
    if (timerId) clearTimeout(timerId);

    // Create new timer
    timerId = setTimeout(() => {
      showDayClosePopup();
    }, timeLeft);
  };
})();
