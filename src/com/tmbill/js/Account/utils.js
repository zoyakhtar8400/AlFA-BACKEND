/* eslint-disable camelcase */
function getDenominationData(tableId) {
  const result = [];

  $(`#${tableId} tbody tr`).each(function () {
    const currency = Number($(this).data('denomination'));
    const note_count = Number($(this).find('.note-count').val()) || 0;
    const total = Number($(this).find('.row-total').text()) || 0;

    if (note_count > 0 || total > 0) {
      const obj = {
        currency,
        note_count,
        total: total.toFixed(window.ROUNDOFF_UPTO),
      };
      result.push(obj);
    }
  });
  return result;
}

function getPaymentTransactionsData(tableId) {
  const result = [];

  $(`#${tableId} tbody tr`).each(function () {
    const payment_mode = $(this).data('payment');
    const transaction_count =
      parseInt($(this).find('.transaction-count').text()) || 0;
    const settledAmount = Number($(this).find('.settledAmount').text()) || 0;
    const actualAmount = Number($(this).find('.actualAmount').val()) || 0;
    const varienceAmount = Number($(this).find('.amountVarience').text()) || 0;

    if (transaction_count > 0 || settledAmount > 0) {
      const obj = {
        payment_mode,
        transactions: Number(transaction_count),
        settledAmount: Number(settledAmount.toFixed(window.ROUNDOFF_UPTO)),
        actualAmount: Number(actualAmount.toFixed(window.ROUNDOFF_UPTO)),
        varienceAmount: Number(varienceAmount.toFixed(window.ROUNDOFF_UPTO)),
      };
      result.push(obj);
    }
  });

  return result;
}

const { SHOW_CLOSE_DAY_WINDOW } = require('../../util/IPC_Messages');
const { safeParse } = require('../../util/RendererUtils');

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
//       console.log('is less than 2');
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

function showDayClosePopup({ start_day_date, day_close_time }) {
  const extra_info = safeParse(window.storeDetails.extra_info);
  day_close_time = window.storeDetails.day_close_time;
  if (extra_info && extra_info.day_close_time) {
    day_close_time = extra_info.day_close_time;
  }

  let extendend_time;
  if (window.storeDetails.day_close_time !== day_close_time) {
    extendend_time = window.storeDetails.day_close_time;
    if (extendend_time) {
      extendend_time = window
        .moment(extendend_time, 'HH:mm:ss')
        .format('hh:mm A');
    }
  }

  // Format Start Day Date
  window.showExtendTimeOption = true;
  const formattedStartDay = window
    .moment(start_day_date)
    .format('DD-MM-YYYY hh:mm A');

  // Format Close Time
  const formattedCloseTime = window
    .moment(day_close_time, 'HH:mm:ss')
    .format('hh:mm A');

  // let htmlContent = `<div style="font-size:17px; margin-top:8px;" class="has-i18n">
  //   <span data-i18n="dayClosePopup.mainMessage1"></span><br>
  //   <span data-i18n="dayClosePopup.mainMessage2"></span>
  //   <b data-i18n="dayClosePopup.dayClose"></b>
  //   <span data-i18n="dayClosePopup.toContinue"></span><br><br>

  //   <div style="font-size:15px; color:#444;">
  //     <b data-i18n="dayClosePopup.dayStartedAt"></b> ${formattedStartDay}<br>
  //     <b data-i18n="dayClosePopup.dayClosingTime"></b> ${formattedCloseTime}
  //   </div><br>

  //   <span style="color:#757575; font-style:italic; font-size:13px" data-i18n="dayClosePopup.extendTimeMessage">
  //     Need extra time? Extend it from:<br>
  //     Settings → General → Extend Day Close Time
  //   </span>
  // </div>`;

  let htmlContent = `
  <div class="has-i18n" style="text-align:center; padding:10px 5px;">

    <!-- Main Message -->
    <div style="font-size:15px; color:#444; margin-bottom:15px;"
         data-i18n="dayClosePopup.reachedMessage">
      The outlet closing time has been reached.
    </div>

    <!-- Timing Info -->
    <div style="font-size:14px; color:#555; margin-bottom:18px;">
      <div>
        <b data-i18n="dayClosePopup.dayStartedAt" class="has-i18n">Start Day Time: </b>
        ${formattedStartDay}
      </div>
      <div>
        <b data-i18n="dayClosePopup.dayClosingTime">Outlet Closing Time: </b>
        ${formattedCloseTime}
      </div>
      ${
        extendend_time
          ? `<div>
        <b data-i18n="dayClosePopup.dayClosingTime">Extended Closing Time: </b>
        ${extendend_time}
      </div>`
          : ''
      }
    </div>

    <!-- Footer Info -->
    <div style="font-size:13px; color:#777; line-height:1.4;"
         data-i18n="dayClosePopup.extendTimeMessage">
      You may proceed with Day Close or extend the closing time from<br>
      <b>Settings → General → Extend Day Close Time</b>
    </div>

  </div>
`;

  if (!window.__IS_MASTER_POS__) {
    htmlContent = `<div style="font-size:17px; margin-top:8px;" class="has-i18n">
      <span data-i18n="dayClosePopup.mainMessage1"></span><br>
      <span data-i18n="dayClosePopup.mainMessage2"></span> 
      <b data-i18n="dayClosePopup.dayClose"></b> 
      <span data-i18n="dayClosePopup.toContinue"></span><br><br>

      <div style="font-size:15px; color:#444;">
        <b data-i18n="dayClosePopup.dayStartedAt"></b> ${formattedStartDay}<br>
        <b data-i18n="dayClosePopup.dayClosingTime"></b> ${formattedCloseTime}
      </div>
    </div>`;
  }

  window.Swal.fire({
    title: $.i18n.t('dayClosePopup.title'),
    html: htmlContent,
    icon: 'warning',
    backdrop: 'rgba(0,0,0,0.7)',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: true,
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: window.__IS_MASTER_POS__
      ? $.i18n.t('dayClosePopup.proceedDayClose')
      : $.i18n.t('dayClosePopup.proceedShiftClose'),
    confirmButtonColor: '#f44336',
  }).then((result) => {
    if (result.isConfirmed) {
      if (window.__IS_MASTER_POS__) {
        $('#menuManagementIcon').click();
        setTimeout(() => {
          $('#closeDaybuttonid').click();
        }, 100);
      } else {
        $('#menuManagementIcon').click();
        setTimeout(() => {
          $('#closeShiftbuttonid').click();
        }, 100);
      }
    }
  });

  // ✅ Translate SweetAlert immediately after render
  if ($.i18n && $.i18n.language !== 'en') {
    setTimeout(() => {
      $('.swal2-html-container .has-i18n').localize();
    }, 100);
  }
}

const scheduleDayClosePopup = (() => {
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
      showDayClosePopup({ start_day_date, day_close_time });
      return;
    }

    const timeLeft = closingTimestamp - now;

    // Clear any existing timer (safety)
    if (timerId) clearTimeout(timerId);

    // Create new timer
    timerId = setTimeout(() => {
      showDayClosePopup({ start_day_date, day_close_time });
    }, timeLeft);
  };
})();

module.exports = {
  getDenominationData,
  getPaymentTransactionsData,
  isDayClosed,
  showDayClosePopup,
  scheduleDayClosePopup,
};
