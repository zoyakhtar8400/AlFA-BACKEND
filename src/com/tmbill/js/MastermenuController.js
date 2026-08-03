/* eslint-disable camelcase */
const { MENU_ACTIONS } = require('../util/MasterMenuActions');
const {
  CHECKIF_DAYISTARTED_REPLY,
  CLOSE_DAY_REPLY,
  CLOSE_DAY,
  CHECKIF_DAYISTARTED,
  CHECK_USERSHIFTSTARTED,
  CHECK_PRECLOSESHIFT,
  CHECK_PRECLOSESHIFT_REPLY,
  CHECK_USERSHIFTSTARTED_REPLY,
  CLOSE_SHIFT,
  CLOSE_SHIFT_REPLY,
  START_USERSHIFT,
  START_USERSHIFT_REPLY,
  LOGOUT_ON_CLOSE_DAY_SHIFT,
  CHECK_IFBILL_IS_RUNNING,
  CHECK_IFBILL_IS_RUNNING_REPLY,
  CAPTAIN_IPC,
} = require('../util/IPC_Messages');

window.mastermenuScriptloaded = true;
const { initAccesslevelsformasters } = require('./AccesslevelManager');
const { forEach, debounce } = require('lodash');
const { initializei18nforMastermenumgmtwindowui } = require('./i18nController');
const { showLoader } = require('../util/MiscUtil');
const { initializeMastermenupermissions } = require('./PasscodeController');
const {
  exportstartenddayReport,
  exportStartEndShiftReport,
} = require('./ExportoexcelHelper');
const {
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  SET_CLOSEDAY_ENTERED_AMOUNT,
  SEND_BASE64_REPORT_WHILE_CLOSING_DAY,
  SHOW_WAITER_SUMMARY_REPORT,
  SHOW_DELIVERYBOY_SUMMARY_REPORT,
  SHOW_SOLDITEMS_IN_REPORT,
  SHOW_EXPENSE_REPORT,
  SHOW_DISCOUNT_SUMMARY_REPORT,
  SHOW_CATEGORYWISE_ITEM_REPORT,
  SHOW_DEU_PAYEMENT_SUMMARY_REPORT,
  SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY,
} = require('../util/SettingIDs');

let countMidnightSale = false;
let sendBase64String = false;
let showWaiterData = false;
let showDiscountData = false;
let showDeliveryBoyData = false;
let showSolditems = false;
let showExpenseData = false;
let showCategoryData = false;
let showDuePaymentData = false;
let showDuePaymentReceivableData = false;

function initialize() {
  $('#menu-types-list-id li[menu-type]').on('click', function () {
    $('#menu-types-list-id li').removeClass('selectedMenu');
    $(this).addClass('selectedMenu');
    openMenu($(this).attr('menu-type'));
    $(
      `#menu-data-container-id>li[menu-type!=${$(this).attr('menu-type')}]`,
    ).hide();
    $(
      `#menu-data-container-id>li[menu-type=${$(this).attr('menu-type')}]`,
    ).show();
    if (Number($(this).attr('menu-type')) === MENU_ACTIONS.MAIN_MENU.CAPTAIN) {
      window.ipcRenderer.send(
        CAPTAIN_IPC.GET_CAPTAINS,
        JSON.stringify({
          whereData: {
            store_id: window.storeDetails?.store_id,
          },
        }),
      );
    }
  });

  $('#collapseOne').on('shown.bs.collapse', () => {
    $('#accordionExample>i').removeClass();
    $('#accordionExample>i').addClass('fas fa-arrow-up');
    setCurrentdateifany();
  });

  $('#collapseOne').on('hidden.bs.collapse', () => {
    $('#accordionExample>i').removeClass();
    $('#accordionExample>i').addClass('fas fa-arrow-down');
  });

  $('#acount-submenu-id li[sub-menu-type]').on('click', function () {
    $('#menu-types-list-id li').removeClass('selectedMenu');
    $(this).addClass('selectedMenu');
    let values = $(this).attr('sub-menu-type');
    values = String(values).split(' ');

    if (Array.isArray(values)) {
      if (values.includes('popup')) {
        showPopup(values[0]);
      } else {
        openMenu(values[0]);
        $(
          `#menu-data-container-id>li[menu-type!=${$(this).attr('menu-type')}]`,
        ).hide();
        $(
          `#menu-data-container-id>li[menu-type=${$(this).attr('menu-type')}]`,
        ).show();
      }
    }
    event.stopPropagation();
  });
  setIPAddress();
  $('#menu-data-container-id>li').hide();
  selectDefaultwindow();
  initAccesslevelsformasters();
  initializeMastermenupermissions();
  // setTimeout(() => {
  //     $('#printButton').on('click', debounce(() => {
  //         content = JSON.parse(content);
  //         generateStartenddayreport(content, 'Start Close day report');
  //       }, 200));
  // }, 300);

  if ($.i18n) {
    initializei18nforMastermenumgmtwindowui();
  } else {
    setTimeout(initializei18nforMastermenumgmtwindowui, 400);
  }

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
  if (sendBase64String) {
    Object.assign(previewDetails, {
      storeDetails: window.storeDetails,
      sendBase64String,
      showLoader: false,
    });
  }

  if (reportData.bills.bills && reportData.bills.bills.length > 0) {
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
    data.showSolditems = true;
    data.shiftData = reportData.shift_data;
    renderReport(previewDetails);
  }
}

async function renderReport(previewDetails) {
  if (window.reportsscriptLoaded) {
    $('#reportprintBodyid').data('data', previewDetails);
    await redrawReportview();
  } else {
    $('#reportprintBodyid').data('data', previewDetails);
    $('#reportprintBodyid').load('Report.html', () => {
      redrawReportview();
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
}

function selectDefaultwindow() {
  if (window.isInsideMenuManagement) return;
  $('#menu-types-list-id>li[menu-type="1"]').click();
}


function setIPAddress() {
  $('#ipaddressField').empty();
  const icon = $('<i>', {
    class: 'fas fa-server',
  });
  $('#ipaddressField').append(icon);
  $('#ipaddressField').append(
    ` IP: ${String(window.globalIPAddress) ? window.globalIPAddress : ''}`,
  );
}

window.setIPAddress_fromremote = setIPAddress;

function openMenu(menukey) {
  switch (Number(menukey)) {
    case MENU_ACTIONS.MAIN_MENU.EXPENSE:
      if (!window.expenseTrackingscriptloaded)
        $(`#menu-data-container-id>li[menu-type=${menukey}]`).load(
          'expenses.html',
        );
      break;
    case MENU_ACTIONS.MAIN_MENU.CAPTAIN:
      if (!window.captainmgmtScriptloaded) {
        $(`#menu-data-container-id>li[menu-type=${menukey}]`).load(
          'CaptainManagement.html',
        );
      }

      break;
    case MENU_ACTIONS.MAIN_MENU.CUSTOMER:
      if (!window.customermgmtscriptLoaded) {
        $(`#menu-data-container-id>li[menu-type=${menukey}]`).load(
          'CustomerManagement.html',
        );
      }

      break;
    case MENU_ACTIONS.MAIN_MENU.WALLET:
      if (!window.walletmgmtScriptloaded) {
        $(`#menu-data-container-id>li[menu-type=${menukey}]`).load(
          'Wallet.html',
        );
      }
      break;
    default:
      break;
  }
}

window.openmasterMenufromremote = async function (params) {
  $(`#menu-types-list-id li[menu-type=${params.menuKey}]`).click();
  if (params.nextAction) {
    if ($(params.nextAction).length == 0) {
      setTimeout(() => {
        $(params.nextAction).click();
        if (params.data && params.data.length) {
          fillremoteactionData(params.data);
        }
      }, 200);
    } else {
      $(params.nextAction).click();
      if (params.data && params.data.length) {
        fillremoteactionData(params.data);
      }
    }
  }
};

/**
 * Load data into the fields
 * @param {Remove action data} data
 */
async function fillremoteactionData(data) {
  let delay = 3500;
  if (window.customersList && window.customersList.length) {
    delay = 100;
  }

  forEach(data, (info) => {
    if (info.window === 'wallet-modal') {
      if (Swal.isVisible()) {
        $(info.field).val(info.data);
      } else {
        setTimeout(() => {
          $(info.field).val(info.data);
        }, delay);
      }
    }
  });
}

function showPopup(menukey) {
  if (menukey) {
    switch (menukey) {
      case MENU_ACTIONS.SUB_MENU.CLOSE_DAY: // Close day popup
        ipcRenderer.send(CHECKIF_DAYISTARTED, undefined);

        break;
      case MENU_ACTIONS.SUB_MENU.START_USER_SHIFT: // Close day popup
        ipcRenderer.send(CHECK_USERSHIFTSTARTED, {
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
          shift_start_by_user: window.storeDetails.username,
        });
        break;
      case MENU_ACTIONS.SUB_MENU.CLOSE_USER_SHIFT: // Close day popup
        ipcRenderer.send(CHECK_PRECLOSESHIFT, {
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
  if (window.CURRENT_STARTDAYTIME) {
    $('#currnetstartdayendLabelid').html(
      `${$.i18n.t('controller:masterMenuController.startDate')}:${
        window.CURRENT_STARTDAYTIME
      }`,
    );
  }
}

ipcRenderer.on(CHECKIF_DAYISTARTED_REPLY, async (event, reply) => {
  try {
    reply = JSON.parse(reply);
    if (reply.isdayStarted && reply.id) {
      ipcRenderer.send(CHECK_IFBILL_IS_RUNNING, '');
      ipcRenderer.on(CHECK_IFBILL_IS_RUNNING_REPLY, async (event, resp) => {
        if (resp > 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:masterMenucontrollernotification.BillisrunningYoucannotcloseday',
            ),
          );
        } else {
          showCloseday(reply);
        }
      });
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

ipcRenderer.on(CLOSE_SHIFT_REPLY, async (event, reply) => {
  if (reply.cash_diff < 0) {
    await Swal.fire({
      title: `${$.i18n.t(
        'controller:swalDataTranslations.Cashshortageisof',
      )} ${Math.abs(reply.cash_diff).toFixed(ROUNDOFF_UPTO)}`,
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
  Object.assign(reply, { report_type: 'Start Close Shift report' });
  await getAndExportOrPrintReport(reply);
  // for time being this REMOTE_FORCE_LOGUT code is commented
  // ipcRenderer.send(REMOTE_FORCE_LOGUT);
});

ipcRenderer.on(CHECK_PRECLOSESHIFT_REPLY, async (event, reply) => {
  if (reply.shiftStarted) {
    ipcRenderer.send(CHECK_IFBILL_IS_RUNNING, '');
    ipcRenderer.on(CHECK_IFBILL_IS_RUNNING_REPLY, async (event, resp) => {
      if (resp > 0) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:masterMenucontrollernotification.BillisrunningYoucannotcloseshift',
          ),
        );
      } else {
        showCloseshift(reply);
      }
    });
    showCloseshift(reply);
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:masterMenuController.shiftIsNotStartedPleaseStartAShiftFirst',
      ),
    );
  }
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

ipcRenderer.on(START_USERSHIFT_REPLY, async (event, reply) => {});

// .append(createButton('Cancel', function() {
//    swal.close();
// }));

// get and export shift-wise report
async function getAndExportOrPrintReport(reply) {
  try {
    // if(reply.countMidnightSale && reply.isTimebetweenMidnightSale){
    //     reply.fromDate = moment(reply.fromDate).set("hour", 00).set("minute", 00).format('x');
    //     reply.toDate = moment(reply.toDate).subtract(1, 'days').set("hour", 23).set("minute", 59).format('x');
    // }

    Object.assign(reply, {
      showWaiterData,
      showDeliveryBoyData,
      showSolditems,
      showExpenseData,
      showDiscountData,
      showCategoryData,
      showDuePaymentData,
      showDuePaymentReceivableData,
    });
    const response = await window.betteripcRenderer.callMain(
      'get-shift-wise-report',
      {
        reply,
      },
    );
    Object.assign(response, { shift_data: reply });

    console.log('response::', response);
    if (response.catdataList && response.catdataList.length > 0) {
      response.catdataList.map((category) => {
        delete Object.assign(category, { name: category.category_name })
          .category_name;
      });
    }

    if (response) {
      setTimeout(() => {
        $('#printButton').on(
          'click',
          debounce(() => {
            const content = response;
            reply.report_type == 'Start Close Shift report'
              ? generateStartenddayreport(content, 'Start Close Shift report')
              : generateStartenddayreport(content, 'Start Close Day report');
          }, 200),
        );
      }, 900);

      setTimeout(() => {
        $('#exportButton').on(
          'click',
          debounce(() => {
            if (reply.report_type == 'Start Close Shift report') {
              exportStartEndShiftReport(response);
            } else {
              exportstartenddayReport(response);
            }
          }, 200),
        );
      }, 900);
    }

    const result = await window.Swal.fire({
      title:
        reply &&
        reply.report_type &&
        reply.report_type == 'Start Close Shift report'
          ? 'Generate close shift report'
          : 'Generate close day report',
      html: `<button type="button" role="button" tabindex="0" data-i18n=${$.i18n.t(
        'controller:swalDataTranslations.Export',
      )} id="exportButton" class="SwalBtn1 customSwalBtn has-i18n">Export</button>
            <button type="button" role="button" tabindex="0" data-i18n=${$.i18n.t(
              'controller:swalDataTranslations.Print',
            )}  id="printButton" class="SwalBtn1 customSwalBtn"> Print</button>`,
      allowOutsideClick: false,
      confirmButtonText: 'Log out',
    });

    if (result.isConfirmed) {
      window.ipcRenderer.send(LOGOUT_ON_CLOSE_DAY_SHIFT);
    }
  } catch (error) {
    console.log(error);
  }
}

async function showCloseday(params) {
  const result = await Swal.fire({
    title: $.i18n.t('controller:masterMenuController.Account.closeDay'),
    html: `<input type="text" placeholder="${$.i18n.t(
      'controller:masterMenuController.Enteramount',
    )}"  id="swalClosingAmountinputid" class="swal2-input startday-swal-input2" maxlength="400">
            <input type="text" placeholder="${$.i18n.t(
              'controller:masterMenuController.Account.comment',
            )}"  id="swalClosingcommentinputid" class="swal2-input startday-swal-input2" maxlength="400">`,
    focusConfirm: false,
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    // confirmButtonText: $.i18n.t('controller:masterMenuController.Account.OK'),
    confirmButtonText: $.i18n.t(
      'controller:masterMenuController.Account.closeDay',
    ),
    cancelButtonText: $.i18n.t(
      'controller:masterMenuController.Account.Cancel',
    ),
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    preConfirm() {
      const close_day_amount = $('#swalClosingAmountinputid').val();

      if (!close_day_amount) {
        Swal.showValidationMessage('Please enter close day amount');
        return false;
      }

      // let isnum = /^\d+$/.test(close_day_amount);
      const isnum = /^[0-9]*\.?[0-9]*$/.test(close_day_amount);
      if (!isnum) {
        Swal.showValidationMessage('Please enter valid amount');
        return false;
      }

      if (close_day_amount.length > 10) {
        Swal.showValidationMessage(
          'Amount length should be less than 10 digit',
        );
        return false;
      }

      const close_comment = $('#swalClosingcommentinputid').val();

      if (close_comment) {
        if (close_comment.length > 50) {
          showSwalwarning('Comment length should be less than 50 characters');
          return;
        }

        if (window.specialCharRegex.test(close_comment) > 50) {
          showSwalwarning('Special characters are not allowed');
        }
      }
    },
  });

  if (result && result.value) {
    const close_day_comment = $('#swalClosingcommentinputid').val();
    const close_day_amount = $('#swalClosingAmountinputid').val();

    const closedayInfo = {
      close_day_comment,
      current_closing_balance: 0,
      day_close_date: moment().format('x'),
      day_close_by_user: window.storeDetails.username,
      close_day_amount,
      countMidnightSale,
    };
    const nextDayinfo = {
      start_day_date: null,
      store_id: window.storeDetails.store_id,
      tmpos_id: window.storeDetails.tmpos_id,
      day_start_by_user: window.storeDetails.username,
      prev_closing_balance: 0,
    };
    if (
      window.settingsConfig[SET_CLOSEDAY_ENTERED_AMOUNT - 1] != undefined &&
      window.settingsConfig[SET_CLOSEDAY_ENTERED_AMOUNT - 1].value === '1'
    ) {
      Object.assign(closedayInfo, { nextDayOpeningAmount: close_day_amount });
    }
    showLoader({
      text: $.i18n.t('controller:masterMenuController.Pleasewait'),
      title: $.i18n.t('controller:masterMenuController.Closingday'),
    });
    ipcRenderer.send(
      CLOSE_DAY,
      JSON.stringify({ closedayInfo, nextDayinfo, id: params.id }),
    );
  }
}

async function showCloseshift(params) {
  const result = await Swal.fire({
    title: $.i18n.t('controller:masterMenuController.Account.closeShift'),
    html: `<input type="text" placeholder="${$.i18n.t(
      'controller:masterMenuController.Enteramount',
    )}"  id="swalClosingShiftAmountinputid" class="swal2-input startday-swal-input2" maxlength="400">
            <input type="text" placeholder="${$.i18n.t(
              'controller:masterMenuController.Account.comment',
            )}"  id="swal-input2" class="swal2-input startday-swal-input2" maxlength="400">`,
    focusConfirm: false,
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    // confirmButtonText: $.i18n.t('controller:masterMenuController.Account.OK'),
    confirmButtonText: $.i18n.t(
      'controller:masterMenuController.Account.closeShift',
    ),
    cancelButtonText: $.i18n.t(
      'controller:masterMenuController.Account.Cancel',
    ),
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    preConfirm() {
      const close_shift_amount = $('#swalClosingShiftAmountinputid').val();

      // let isnum = /^\d+$/.test(close_shift_amount);
      const isnum = /^[0-9]*\.?[0-9]*$/.test(close_shift_amount);

      if (!close_shift_amount) {
        Swal.showValidationMessage('Please enter close shift amount');
        return false;
      }

      if (!isnum) {
        Swal.showValidationMessage('Please enter valid amount');
        return false;
      }

      if (close_shift_amount.length > 10) {
        Swal.showValidationMessage(
          'Amount length should be less than 10 digit',
        );
        return false;
      }

      const close_comment = $('#swal-input2').val();

      if (close_comment) {
        if (close_comment.length > 50) {
          showSwalwarning('Comment length should be less than 50 characters');
          return;
        }

        if (window.specialCharRegex.test(close_comment) > 50) {
          showSwalwarning('Special characters are not allowed');
        }
      }
    },
  });

  if (result && result.value) {
    const shift_end_comment = $('#swal-input2').val();
    const close_shift_amount = $('#swalClosingShiftAmountinputid').val();

    const closeshiftInfo = {
      shift_end_comment,
      current_closing_balance: 0,
      shift_end_date: moment().format('x'),
      shift_end_by_user: window.storeDetails.username,
      close_shift_amount,
      countMidnightSale,
    };
    ipcRenderer.send(CLOSE_SHIFT, {
      closeshiftInfo,
      id: params.id,
      shift_start_date: params.shift_start_date,
      prev_closing_balance: params.prev_closing_balance,
    });
  }
}

async function showstartuserShift(params) {
  if (params && params.shiftStarted == false) {
    const result = await Swal.fire({
      title: $.i18n.t('controller:masterMenuController.Account.startShift'),
      html: `<input placeholder="${$.i18n.t(
        'controller:masterMenuController.openingBalance',
      )}" id="swal-input1" class="swal2-input">
                <input placeholder="${$.i18n.t(
                  'controller:masterMenuController.Account.startShift',
                )}" id="swal-input3" class="swal2-input">
                <input placeholder="${$.i18n.t(
                  'controller:masterMenuController.Account.comment',
                )}"  id="swal-input2" class="swal2-input" maxlength="400">`,
      focusConfirm: false,
      width: '28em',
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      // confirmButtonText: $.i18n.t('controller:masterMenuController.Account.OK'),
      confirmButtonText: $.i18n.t(
        'controller:masterMenuController.Account.startShift',
      ),
      cancelButtonText: $.i18n.t(
        'controller:masterMenuController.Account.Cancel',
      ),
      didOpen: () => {
        if (params.prev_closing_balance) {
          $('#swal-input1').val(
            Number(params.prev_closing_balance).toFixed(ROUNDOFF_UPTO),
          );
        }
        if (params.raw_cash_in_hand) {
          $('#swal-input1').val(
            Number(params.raw_cash_in_hand).toFixed(ROUNDOFF_UPTO),
          );
        }

        $('#swal-input3').daterangepicker({
          timePicker: true,
          singleDatePicker: true,
          startDate: moment(),
          locale: {
            format: 'YYYY-MM-DD HH:mm:ss A',
          },
        });
      },
      preConfirm: () => {
        const opening_balance = $('#swal-input1').val();

        if (opening_balance.length > 10) {
          showSwalwarning('Opening balance should be less than 10 digit');
          return;
        }
        if (opening_balance) {
          const isNumber = !isNaN(opening_balance);
          if (!isNumber) showSwalwarning('Invalid amount');
          return isNumber;
        }
        return true;
      },
    });

    if (result && result.value) {
      const shift_start_date = $('#swal-input3')
        .data('daterangepicker')
        .startDate.format('x');
      const shift_start_comment = $('#swal-input2').val();
      let opening_balance = $('#swal-input1').val();
      try {
        opening_balance = parseFloat(opening_balance);
      } catch (error) {
        opening_balance = 0;
      }
      const shiftData = {
        shift_start_date,
        shift_start_comment,
        opening_balance,
        store_id: window.storeDetails.store_id,
        tmpos_id: window.storeDetails.tmpos_id,
        shift_start_by_user: window.storeDetails.username,
      };

      window.ipcRenderer.send(START_USERSHIFT, shiftData);
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:masterMenuController.shiftIsAlreadyStarted'),
    );
  }
}

initialize();
