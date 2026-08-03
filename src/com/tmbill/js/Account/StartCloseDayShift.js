/* eslint-disable camelcase */
const { debounce } = require('lodash');
const {
  makeCheckPreCloseShiftRequest,
  makeCheckUserShiftStartedRequest,
  checkIfBillIsRunningRequest,
  getshiftwiseReportRequest,
  checkIfKOTIsRunningRequest,
  checkIfAllShiftAreClosedRequest,
} = require('../../renderer/helper/Account.helper');
const { ACCOUNT } = require('../../util/Constants');
const {
  CHECKIF_DAYISTARTED,
  START_USERSHIFT_REPLY,
  CLOSE_DAY_REPLY,
  CHECK_USERSHIFTSTARTED_REPLY,
  CHECKIF_DAYISTARTED_REPLY,
} = require('../../util/IPC_Messages');
const {
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  SEND_BASE64_REPORT_WHILE_CLOSING_DAY,
  SHOW_WAITER_SUMMARY_REPORT,
  SHOW_DISCOUNT_SUMMARY_REPORT,
  SHOW_DELIVERYBOY_SUMMARY_REPORT,
  SHOW_SOLDITEMS_IN_REPORT,
  SHOW_EXPENSE_REPORT,
  SHOW_DEU_PAYEMENT_SUMMARY_REPORT,
  SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY,
  SHOW_CATEGORYWISE_ITEM_REPORT,
  ALLOW_CLOSE_SHIFT_DESPITE_SAVE_BILL,
  SHOW_CANCELITEMS_IN_REPORT,
  SHOW_WALLET_SUMMARY_REPORT,
  SHOW_KDWISE_SUMMARY_REPORT,
  SEND_BASE64_REPORT_OF_CLOSE_SHIFT,
  PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_CLOSE_DAY_REPORT,
  PRINT_REPORT_WHILE_SENDING_ON_MAIL_OF_CLOSE_SHIFT,
} = require('../../util/SettingIDs');
const { formatAMPM } = require('../../util/MiscUtil');
const {
  exportStartEndShiftReport,
  exportstartenddayReport,
} = require('../ExportoexcelHelper');
const { safeParse } = require('../../util/RendererUtils');
const { showLoader } = require('../CommonUtils');
const { default: Swal } = require('sweetalert2');

let countMidnightSale = false;
let sendBase64String = false;
let printReportWhileSendingOnMailForCloseDayReport = false;
let printReportWhileSendingOnMailForCloseShiftReport = false;
let sendBase64StringOnCloseShift = false;
let showWaiterData = false;
let showDiscountData = false;
let showDeliveryBoyData = false;
let showSolditems = false;
let showExpenseData = false;
let showCategoryData = false;
let showDuePaymentData = false;
let showDuePaymentReceivableData = false;
let allowCloseShiftDespiteSaveBill = false;
let showCancelitems = false;
let showWalletData = false;
let showKDWiseItemsData = false;

async function renderReport(previewDetails) {
  if (window.reportsscriptLoaded) {
    $('#reportprintBodyid').data('data', previewDetails);
    await window.redrawReportview();
  } else {
    $('#reportprintBodyid').data('data', previewDetails);
    $('#reportprintBodyid').load('Report.html', () => {
      window.redrawReportview();
    });
  }
  if (previewDetails.converttoPdf) {
    setTimeout(() => {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:allReports.PDFGenerated'),
      );
    }, 300);
  }
  console.log('--- renderReport END ---');
}
async function generateStartenddayreport(reportData, report_type) {
  const data = {};
  const previewDetails = {
    data,
    report_type,
  };
  if (reportData.fromDate && reportData.toDate) {
    const date1 = new Date(parseInt(reportData.fromDate));
    const formattedDate = formatAMPM(date1, false);
    const date2 = new Date(parseInt(reportData.toDate));
    const formattedDate2 = formatAMPM(date2, false);
    data.customDatetitle = `Between ${formattedDate} to ${formattedDate2}`;
  }

  // check if send base64 is allowed
  if (
    (report_type === 'Start Close Day report' && sendBase64String) ||
    (report_type === 'Start Close Shift report' && sendBase64StringOnCloseShift)
  ) {
    Object.assign(previewDetails, {
      storeDetails: window.storeDetails,
      sendBase64String:
        report_type === 'Start Close Shift report'
          ? sendBase64StringOnCloseShift
          : sendBase64String,
      printReportWhileSendingOnMail:
        report_type === 'Start Close Shift report'
          ? printReportWhileSendingOnMailForCloseShiftReport
          : printReportWhileSendingOnMailForCloseDayReport,
      showLoader: true,
    });
  }

  if (
    reportData &&
    reportData.bills &&
    reportData.bills.bills &&
    reportData.bills.bills.length > 0
  ) {
    data.bills = reportData.bills.bills;
    data.payments = reportData.paymentDetails;
    data.catwisedataList = reportData.catdataList;
    data.closeDaysoldItems = reportData.soldItems;
    data.orderTypeWiseOrders = reportData.orderTypeWiseOrders;
    data.catdataList = reportData.catdataList;
    data.expenses_list = reportData.expenses_list;
    data.waiterSummary = reportData.waiterSummary;
    data.deliveryboySummary = reportData.deliveryboySummary;
    data.discountSummary = reportData.discountSummary;
    data.duePaymentSummary = reportData.duePaymentSummary;
    data.duePaymentReceivableSummary = reportData.duePaymentReceivableSummary;
    data.kdWiseItemSummary = reportData.kdWiseItemSummary;
    data.cancelledItems = reportData.cancelledItems;
    data.soldItems = reportData.soldItems;
    data.walletSummary = reportData.walletSummary;
    data.expenses_list = reportData.expenses_list;
    data.discountSummary = reportData.discountSummary;
    data.invoice_range = reportData.shift_data.invoice_range;
    data.totalBills = reportData.bills.bills.length;
    data.showSolditems = true;
    data.shiftData = reportData.shift_data;

    if (
      reportData &&
      reportData.shift_data &&
      reportData.shift_data.report_type !== 'Start Close Day report' &&
      !sendBase64StringOnCloseShift
    ) {
      Object.assign(previewDetails, {
        sendBase64String: false,
      });
    }

    if (
      reportData &&
      reportData.shift_data &&
      reportData.shift_data.report_type !== 'Start Close Day report' &&
      !printReportWhileSendingOnMailForCloseShiftReport
    ) {
      Object.assign(previewDetails, {
        printReportWhileSendingOnMail: false,
      });
    }
    if (
      reportData &&
      reportData.shift_data &&
      reportData.shift_data.day_close_currency_denomination
    ) {
      data.closing_currency_denomination = safeParse(
        reportData.shift_data.day_close_currency_denomination,
      );
    }

    if (
      reportData &&
      reportData.shift_data &&
      reportData.shift_data.day_close_transactions
    ) {
      data.dayShift_end_transactions = safeParse(
        reportData.shift_data.day_close_transactions,
      );
    }
    if (
      reportData &&
      reportData.shift_data &&
      reportData.shift_data.shift_end_currency_denomination
    ) {
      data.closing_currency_denomination = safeParse(
        reportData.shift_data.shift_end_currency_denomination,
      );
    }
    if (
      reportData &&
      reportData.shift_data &&
      reportData.shift_data.shift_end_transactions
    ) {
      data.dayShift_end_transactions = safeParse(
        reportData.shift_data.shift_end_transactions,
      );
    }
    console.log(
      `Messgae="Generate start day end day report", previewDetails=${JSON.stringify(previewDetails)}`,
    );
    renderReport(previewDetails);
  }
}

ipcRenderer.on(CHECKIF_DAYISTARTED_REPLY, async (event, reply) => {
  try {
    console.log('reply', reply);
    const { result } = reply;
    if (result && !result.start_day_date) {
      window.initCheckDayStartedFromRemote();
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          'Day is not started yet. Please start day first',
        );
      }, 1000);
      return;
    }
    if (result.isdayStarted && result.id) {
      const fromDate = result.start_day_date;
      const toDate = Number(window.moment().format('x'));
      const allShiftClosed = await checkIfAllShiftAreClosedRequest({
        username: window.storeDetails.username,
        fromDate,
        toDate,
      });

      if (allShiftClosed && allShiftClosed.length) {
        const users = allShiftClosed
          .map((item) => item.shift_start_by_user)
          .join(', ');
        const message = `Shift started by <b>${users}</b> are not closed yet. Please close them first`;
        $('#checkAllShiftCloseValidationMessageId').html(message);
        $('#checkAllShiftCloseValidationMessageContianerId').show();
        return;
      }
      $('#checkAllShiftCloseValidationMessageContianerId').hide();

      const isKOTRunning = await checkIfKOTIsRunningRequest({
        fromDate,
        toDate,
      });
      if (isKOTRunning) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:masterMenucontrollernotification.TableisrunningYoucannotcloseday',
          ),
        );
        return;
      }
      const isBillRunning = await checkIfBillIsRunningRequest();
      console.log('isBillRunning:', isBillRunning);
      if (isBillRunning && isBillRunning.length) {
        const orderIds = isBillRunning.map((item) => item.order_id).join(',');
        console.log(`Message="Running order id's" order_id=${orderIds}`);
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:masterMenucontrollernotification.BillisrunningYoucannotcloseshift',
          ),
        );
        return;
      }

      showCloseday(reply);
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:masterMenuController.pleaseStartADayFirst'),
      );
    }
  } catch (error) {}
});

ipcRenderer.on(CHECK_USERSHIFTSTARTED_REPLY, async (event, reply) => {
  try {
    showstartuserShift(reply);
  } catch (error) {}
});

ipcRenderer.on(CLOSE_DAY_REPLY, async (event, reply) => {
  const closeDayResponse = reply.startendDaydetails[0];
  if (Swal.isVisible()) Swal.close();

  if (reply.startendDaydetails[0].cash_diff < 0) {
    await Swal.fire({
      title: `${$.i18n.t(
        'controller:swalDataTranslations.Cashshortageisof',
      )} ${Math.abs(
        reply.startendDaydetails[0].cash_diff.toFixed(ROUNDOFF_UPTO),
      )}`,
      html: '',
      focusConfirm: true,
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
      },
      confirmButtonText: $.i18n.t('controller:masterMenuController.Account.OK'),
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }
  // Allow user to generate the report
  // await showExportcloseddayreportpopup(reply);
  delete Object.assign(closeDayResponse, {
    fromDate: closeDayResponse.start_day_date,
  }).start_day_date;
  delete Object.assign(closeDayResponse, {
    toDate: closeDayResponse.day_close_date,
  }).day_close_date;
  delete Object.assign(closeDayResponse, {
    username: closeDayResponse.day_close_by_user,
  }).day_close_by_user;

  Object.assign(closeDayResponse, { countMidnightSale });
  Object.assign(closeDayResponse, {
    isTimebetweenMidnightSale: reply.isTimebetweenMidnightSale,
  });

  Object.assign(closeDayResponse, { report_type: 'Start Close Day report' });
  await getAndExportOrPrintReport(closeDayResponse);
  checkforStartdayfromremote();
});

ipcRenderer.on(START_USERSHIFT_REPLY, async () => {});

// .append(createButton('Cancel', function() {
//    swal.close();
// }));

// get and export shift-wise report
window.getAndExportOrPrintReport = async (reply, closeShiftResponse) => {
  try {
    // if(reply.countMidnightSale && reply.isTimebetweenMidnightSale){
    //     reply.fromDate = moment(reply.fromDate).set("hour", 00).set("minute", 00).format('x');
    //     reply.toDate = moment(reply.toDate).subtract(1, 'days').set("hour", 23).set("minute", 59).format('x');
    // }

    console.log(
      `Messgae="Generating close day and shift report" response=${JSON.stringify(reply)}`,
    );

    showLoader({
      title: 'Generating Report',
      text: $.i18n.t(
        'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
      ),
    });
    console.log('[CLOSE DAY] showKDWiseItemsData:', showKDWiseItemsData);

    Object.assign(reply, {
      showWaiterData,
      showDeliveryBoyData,
      showSolditems,
      showExpenseData,
      showDiscountData,
      showCategoryData,
      showDuePaymentData,
      showDuePaymentReceivableData,
      showCancelitems,
      showWalletData,
      showKDWiseItemsData,
    });

    if (
      reply.report_type === 'Start Close Day report' ||
      reply.report_type === 'Start Close Shift report'
    ) {
      reply.showKDWiseItemsData = true;
    }

    // const response = await window.betteripcRenderer.callMain(
    //   'get-shift-wise-report',
    //   {
    //     reply,
    //   },
    // );
    let response = {};
    if (reply.fromDate) {
      response = await getshiftwiseReportRequest({ reply });
      console.log(
        `Message="Get shift wise report response" response=${JSON.stringify(reply)}`,
      );
      Object.assign(response, { shift_data: reply });
    }
    let shiftresponse = {};

    if (closeShiftResponse) {
      Object.assign(closeShiftResponse, {
        showWaiterData,
        showDeliveryBoyData,
        showSolditems,
        showExpenseData,
        showDiscountData,
        showCategoryData,
        showDuePaymentData,
        showDuePaymentReceivableData,
        showCancelitems,
        showWalletData,
        showKDWiseItemsData,
      });
      // shiftresponse = await window.betteripcRenderer.callMain(
      //   'get-shift-wise-report',
      //   {
      //     reply: closeShiftResponse,
      //   },
      // );
      shiftresponse = await getshiftwiseReportRequest({
        reply: closeShiftResponse,
      });

      console.log(
        `Message="Get shift wise report response", shiftresponse=${JSON.stringify(shiftresponse)}`,
      );

      Object.assign(shiftresponse, { shift_data: closeShiftResponse });
    }

    if (response.catdataList && response.catdataList.length > 0) {
      response.catdataList.map((category) => {
        delete Object.assign(category, { name: category.category_name })
          .category_name;
      });
    }

    Swal.close();
    if (response) {
      $('#exportAndPrintDayShiftReportModal').modal('show');
      // setTimeout(() => {
      //   $('#printButton').on(
      //     'click',
      //     debounce(() => {
      //       const content = response;
      //       reply.report_type == 'Start Close Shift report'
      //         ? generateStartenddayreport(content, 'Start Close Shift report')
      //         : generateStartenddayreport(content, 'Start Close Day report');
      //     }, 200),
      //   );
      // }, 900);

      // setTimeout(() => {
      //   $('#exportButton').on(
      //     'click',
      //     debounce(() => {
      //       if (reply.report_type == 'Start Close Shift report') {
      //         exportStartEndShiftReport(response);
      //       } else {
      //         exportstartenddayReport(response);
      //       }
      //     }, 200),
      //   );
      // }, 900);

      // export close day report

      const isCloseDayAndShiftModalOpen = $('#closeDayAndShiftModal').is(
        ':visible',
      );
      if (isCloseDayAndShiftModalOpen) {
        $('#exportCloseDayReportButtonId').show();
        $('#printCloseDayReportButtonId').show();
      } else {
        $('#exportCloseDayReportButtonId').hide();
        $('#printCloseDayReportButtonId').hide();
      }

      $('#exportCloseDayReportButtonId')
        .off('click')
        .on(
          'click',
          debounce(() => {
            const content = response;
            console.log(`Message="Export close day report button clicked"`);
            exportstartenddayReport(content, 'Start Close Day report');
          }, 200),
        );

      // print close day report
      // $('#printCloseDayReportButtonId')
      //   .off('click')
      //   .on(
      //     'click',
      //     debounce(() => {
      //       const content = response;

      //       generateStartenddayreport(content, 'Start Close Day report');
      //     }, 200),
      //   );
      $('#printCloseDayReportButtonId')
        .off('click')
        .on(
          'click',
          debounce(() => {
            const content = response;
            const originalSendBase64 = sendBase64String;
            const originalPrintFlag =
              printReportWhileSendingOnMailForCloseDayReport;
            try {
              sendBase64String = true;
              printReportWhileSendingOnMailForCloseDayReport = true;
              generateStartenddayreport(content, 'Start Close Day report');
            } finally {
              sendBase64String = originalSendBase64;
              printReportWhileSendingOnMailForCloseDayReport =
                originalPrintFlag;
            }
          }, 200),
        );

      // export close shift report
      $('#exportCloseShiftReportButtonId')
        .off('click')
        .on(
          'click',
          debounce(() => {
            const content = shiftresponse;
            console.log(`Message="Export close shift report button clicked"`);
            exportStartEndShiftReport(content, 'Start Close Shift report');
          }, 200),
        );

      // print close shift report
      $('#printCloseShiftReportButtonId')
        .off('click')
        .on(
          'click',
          debounce(() => {
            console.log(`Message="Print close shift report button clicked"`);
            const content = shiftresponse;
            generateStartenddayreport(content, 'Start Close Shift report');
          }, 200),
        );

      // print close shift report
      $('#afterCloseDayShiftLogoutButtonId')
        .off('click')
        .on(
          'click',
          debounce(() => {
            console.log(`Message="Close day and shift logout button clicked"`);
            // window.ipcRenderer.send(LOGOUT_ON_CLOSE_DAY_SHIFT);
            window.ipcRenderer.send('__RELOGIN__');
          }, 200),
        );
    }

    // const result = await window.Swal.fire({
    //   title:
    //     reply &&
    //     reply.report_type &&
    //     reply.report_type == 'Start Close Shift report'
    //       ? 'Generate close shift report'
    //       : 'Generate close day report',
    //   html: `<button type="button" role="button" tabindex="0" data-i18n=${$.i18n.t(
    //     'controller:swalDataTranslations.Export',
    //   )} id="exportButton" class="SwalBtn1 customSwalBtn has-i18n">Export</button>
    //             <button type="button" role="button" tabindex="0" data-i18n=${$.i18n.t(
    //               'controller:swalDataTranslations.Print',
    //             )}  id="printButton" class="SwalBtn1 customSwalBtn"> Print</button>`,
    //   allowOutsideClick: false,
    //   confirmButtonText: 'Log out',
    // });

    // if (result.isConfirmed) {
    //   window.ipcRenderer.send(LOGOUT_ON_CLOSE_DAY_SHIFT);
    // }
  } catch (error) {
    console.error(error);
  }
};

async function showCloseday(params) {
  //  show modal of close day
  if (!window.closeDayAndShiftWindowLoaded) {
    $('#CloseDayAndShiftwindowWrapperid').load('Account/CloseDayAndShift.html');
  }

  // $('#menuManagementwindowWrapperid').hide();
  // $('#CloseDayAndShiftwindowWrapperid').show();
  setTimeout(() => {
    $('#closeDayAndShiftModal').attr('data', JSON.stringify(params));
    $('#closeDayAndShiftModal').modal('show');
  }, 500);
}

async function showCloseshift(params) {
  if (!window.closeShiftWindowLoaded) {
    $('#CloseShiftwindowWrapperid').load('Account/CloseShift.html');
  }

  // $('#menuManagementwindowWrapperid').hide();
  // $('#CloseDayAndShiftwindowWrapperid').show();
  setTimeout(() => {
    $('#closeShiftModal').attr('data', JSON.stringify(params));
    $('#closeShiftModal').modal('show');
  }, 500);
}

async function showstartuserShift(params) {
  if (params && params.shiftStarted === false) {
    if (!window.startShiftWindowLoaded) {
      $('#StartShiftwindowWrapperid').load('Account/StartNewShift.html');
    }

    setTimeout(() => {
      $('#startShiftModal').attr('data', JSON.stringify(params));
      $('#startShiftModal').modal('show');
    }, 500);
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:masterMenuController.shiftIsAlreadyStarted'),
    );
  }
}

async function initCheckPreCloseShiftRequest(data) {
  try {
    const reply = await makeCheckPreCloseShiftRequest(data);
    if (reply.shiftStarted) {
      if (!allowCloseShiftDespiteSaveBill) {
        const isBillRunning = await checkIfBillIsRunningRequest();
        if (isBillRunning && isBillRunning.length) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:masterMenucontrollernotification.BillisrunningYoucannotcloseshift',
            ),
          );
          return;
        }
      }
      showCloseshift(reply);
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:masterMenuController.shiftIsNotStartedPleaseStartAShiftFirst',
        ),
      );
    }
  } catch (error) {
    console.error(error);
  }
}

async function initCheckUserShiftStarted(data) {
  try {
    const reply = await makeCheckUserShiftStartedRequest(data);
    showstartuserShift(reply);
  } catch (error) {
    console.error(error);
  }
}

function showPopup(menukey) {
  if (menukey) {
    switch (menukey) {
      case ACCOUNT.CLOSE_DAY: // Close day popup
        ipcRenderer.send(CHECKIF_DAYISTARTED, {
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
          shift_start_by_user: window.storeDetails.username,
        });
        break;
      case ACCOUNT.START_SHIFT:
        initCheckUserShiftStarted({
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
          shift_start_by_user: window.storeDetails.username,
        });
        break;
      case ACCOUNT.CLOSE_SHIFT: // Close day popup
        initCheckPreCloseShiftRequest({
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
          shift_start_by_user: window.storeDetails.username,
        });
        break;
      default:
        break;
    }
  }
}
async function setCurrentdateifany() {
  if (!window.CURRENT_STARTDAYTIME || !window.CURRENT_STARTSHIFTTIME) {
    setTimeout(() => {
      setCurrentdateifany();
    }, 1000);
  }
  if (window.CURRENT_STARTDAYTIME) {
    $('#currnetstartdayendLabelid').html(
      `${$.i18n.t('controller:masterMenuController.startDate')}${
        window.CURRENT_STARTDAYTIME
      }`,
    );
  }

  if (window.CURRENT_STARTSHIFTTIME) {
    $('#currnetstartShiftendLabelid').html(
      $.i18n.t('controller:masterMenuController.startDate') +
        window.CURRENT_STARTSHIFTTIME,
    );
  }
}

function isCloseTimeMoreThan6HoursAway(start_day_date, day_close_time) {
  const now = moment();
  const startMoment = moment(start_day_date);

  const [hh, mm, ss] = day_close_time.split(':').map(Number);

  let scheduledClose = startMoment.clone().set({
    hour: hh,
    minute: mm,
    second: ss,
    millisecond: 0,
  });

  // If close time is earlier than start time → next day
  if (scheduledClose.isSameOrBefore(startMoment)) {
    scheduledClose.add(1, 'day');
  }

  const diffInHours = scheduledClose.diff(now, 'hours', true); // fractional

  return diffInHours > 6;
}

function initialize() {
  setCurrentdateifany();
  $('#closeDaybuttonid').on('click', async () => {
    // const isMoreThan6Hours = isCloseTimeMoreThan6HoursAway(
    //   window.start_day_date,
    //   window.storeDetails.day_close_time,
    // );
    // console.log('isMoreThan6Hours::', isMoreThan6Hours);
    // if (isMoreThan6Hours) {
    //   const formattedCloseTime = window
    //     .moment(window.storeDetails.day_close_time, 'HH:mm:ss')
    //     .format('hh:mm A');
    //   const result = await Swal.fire({
    //     title: 'Early Close Warning',
    //     icon: 'warning',
    //     html: `
    //   You are trying to close the day <b>more than 6 hours before</b> the scheduled close time.<br><br>

    // <b>Day Closing Time:</b><br>
    // <span style="font-size:16px; color:#444;">
    //   ${formattedCloseTime}
    // </span><br><br>

    // What would you like to proceed with?
    // `,
    //     showCancelButton: true,
    //     showDenyButton: true,
    //     confirmButtonText: 'Close Day',
    //     denyButtonText: 'Close Shift',
    //     cancelButtonText: 'Cancel',
    //     reverseButtons: true,
    //     allowOutsideClick: false,
    //   });

    //   if (result.isConfirmed) {
    //     showPopup('close-day');
    //   }

    //   if (result.isDenied) {
    //     showPopup('close-shift');
    //   }
    //   return;
    // }
    showPopup('close-day');
  });

  $('#closeShiftbuttonid').on('click', () => {
    showPopup('close-shift');
  });

  $('#startShiftbuttonid').on('click', () => {
    showPopup('start-shift');
  });

  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] != undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }

  if (
    window.settingsConfig[SEND_BASE64_REPORT_WHILE_CLOSING_DAY - 1] != undefined
  ) {
    sendBase64String =
      window.settingsConfig[SEND_BASE64_REPORT_WHILE_CLOSING_DAY - 1].value ==
      '1';
  }

  if (
    window.settingsConfig[
      PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_CLOSE_DAY_REPORT - 1
    ] != undefined
  ) {
    printReportWhileSendingOnMailForCloseDayReport =
      window.settingsConfig[
        PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_CLOSE_DAY_REPORT - 1
      ].value == '1';
  }

  if (
    window.settingsConfig[
      PRINT_REPORT_WHILE_SENDING_ON_MAIL_OF_CLOSE_SHIFT - 1
    ] != undefined
  ) {
    printReportWhileSendingOnMailForCloseShiftReport =
      window.settingsConfig[
        PRINT_REPORT_WHILE_SENDING_ON_MAIL_OF_CLOSE_SHIFT - 1
      ].value == '1';
  }

  if (
    window.settingsConfig[SEND_BASE64_REPORT_OF_CLOSE_SHIFT - 1] != undefined
  ) {
    sendBase64StringOnCloseShift =
      window.settingsConfig[SEND_BASE64_REPORT_OF_CLOSE_SHIFT - 1].value == '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showWaiterData =
      window.settingsConfig[SHOW_WAITER_SUMMARY_REPORT - 1].value == '1';
  }
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDiscountData =
      window.settingsConfig[SHOW_DISCOUNT_SUMMARY_REPORT - 1].value === '1';
  }
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDeliveryBoyData =
      window.settingsConfig[SHOW_DELIVERYBOY_SUMMARY_REPORT - 1].value == '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showSolditems =
      window.settingsConfig[SHOW_SOLDITEMS_IN_REPORT - 1].value == '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showExpenseData =
      window.settingsConfig[SHOW_EXPENSE_REPORT - 1].value == '1';
  }
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDuePaymentData =
      window.settingsConfig[SHOW_DEU_PAYEMENT_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDuePaymentReceivableData =
      window.settingsConfig[SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY - 1].value ===
      '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showCategoryData =
      window.settingsConfig[SHOW_CATEGORYWISE_ITEM_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    allowCloseShiftDespiteSaveBill =
      window.settingsConfig[ALLOW_CLOSE_SHIFT_DESPITE_SAVE_BILL - 1].value ===
      '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showCancelitems =
      window.settingsConfig[SHOW_CANCELITEMS_IN_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showWalletData =
      window.settingsConfig[SHOW_WALLET_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showKDWiseItemsData =
      window.settingsConfig[SHOW_KDWISE_SUMMARY_REPORT - 1].value === '1';
  }

  $('#exportAndPrintDayShiftReportModal').modal({
    backdrop: 'static',
    keyboard: false,
    show: false,
  });
}

initialize();
