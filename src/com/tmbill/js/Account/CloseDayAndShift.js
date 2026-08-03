/* eslint-disable radix */
/* eslint-disable camelcase */
const {
  makeSettledBillByPaymentsModeRequest,
  makeCloseDayShiftRequest,
  getOrderSummaryRequest,
  checkIfKOTIsRunningRequest,
  checkIfBillIsRunningRequest,
} = require('../../renderer/helper/Account.helper');
const { OPEN_CASH_DRAWER } = require('../../util/IPC_Messages');
const { safeParse } = require('../../util/RendererUtils');
const {
  SET_CLOSEDAY_ENTERED_AMOUNT,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  CURRENCY_DENOMINATION_COUNTS,
} = require('../../util/SettingIDs');
const { initAccountAccessLevels } = require('../AccesslevelManager');
const { showLoader } = require('../CommonUtils');
const { initalizei18nforCloseDayAndShift } = require('../i18nController');
const { getDenominationData, getPaymentTransactionsData } = require('./utils');

window.closeDayAndShiftWindowLoaded = true;
let countMidnightSale = false;
async function openCashDrawerRequest() {
  try {
    window.ipcRenderer.send(OPEN_CASH_DRAWER, {});
  } catch (error) {
    console.error(error);
  }
  // window.ipcRenderer.send('open-cash-drawer', {});
  return undefined;
}

async function closeDayAndShiftPostProcess(reply) {
  const closeDayResponse = reply.startendDaydetails[0];
  const closeShiftResponse = reply.closeUserShiftResponse;

  if (window.Swal.isVisible()) window.Swal.close();

  if (reply.startendDaydetails[0].cash_diff < 0) {
    await window.Swal.fire({
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
  console.log(
    `Message="Close shift post process response" response=${JSON.stringify(closeShiftResponse)}`,
  );
  console.log(
    `Message="Close day post process response" response=${JSON.stringify(closeDayResponse)}`,
  );

  await window.getAndExportOrPrintReport(closeDayResponse, closeShiftResponse);
  // checkforStartdayfromremote();
}

async function closeDayAndShift() {
  let params = $('#closeDayAndShiftModal').attr('data');
  params = safeParse(params);

  // this check is for after opening modal is there any order placed from order hub or terminal
  const fromDate = params.result.start_day_date;
  const toDate = Number(window.moment().format('x'));

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
    $('#closeDayAndShiftModal').modal('hide');
    return;
  }
  const isBillRunning = await checkIfBillIsRunningRequest();
  if (isBillRunning && isBillRunning.length) {
    const orderIds = isBillRunning.map((item) => item.order_id).join(',');
    console.log(`Message="Running order id's" order_id=${orderIds}`);
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:masterMenucontrollernotification.BillisrunningYoucannotcloseshift',
      ),
    );
    $('#closeDayAndShiftModal').modal('hide');
    return;
  }

  const close_day_comment = $('#closeDayAndShiftCommentInputId').val();
  const close_day_amount = $('#closeDayAndShiftCashInDrawerId').val();
  if (close_day_amount.length > 13) {
    window.notifyUser.showMessage(
      'error',
      'Cash in Drawer amount should be less than 13 digit',
    );
    return;
  }

  if (window.allspecialCharRegex.test(close_day_comment)) {
    window.notifyUser.showMessage(
      'error',
      'Special characters are not allowed in comment',
    );
    return;
  }

  if (close_day_amount && close_day_amount < 0) {
    window.notifyUser.showMessage(
      'error',
      'Please enter valid cash drawer amount',
    );
    return;
  }

  const closedayInfo = {
    close_day_comment,

    current_closing_balance: 0,
    day_close_date: window.moment().format('x'),
    day_close_by_user: window.storeDetails.username,
    close_day_amount,
    close_shift_amount: close_day_amount,
    start_day_date: params.result.start_day_date,
    countMidnightSale,
    sync_flag: 0,
  };
  const closeshiftInfo = {
    shift_end_comment: close_day_comment,
    current_closing_balance: 0,
    shift_end_date: window.moment().format('x'),
    shift_end_by_user: window.storeDetails.username,
    shift_start_by_user: window.storeDetails.username,
    close_shift_amount: close_day_amount,
    countMidnightSale,
    shift_start_date: params.response.shift_start_date,
  };
  const nextDayinfo = {
    start_day_date: null,
    store_id: window.storeDetails.store_id,
    tmpos_id: window.storeDetails.tmpos_id,
    day_start_by_user: window.storeDetails.username,
    prev_closing_balance: 0,
  };
  const denominationEntries = getDenominationData(
    'closeDayAndShiftCashDenominationTableId',
  );
  const transactionEntries = getPaymentTransactionsData(
    'closeDayAndShiftTransactionsTableForShiftid',
  );
  if (denominationEntries) {
    Object.assign(closeshiftInfo, {
      shift_end_currency_denomination: {
        cash_denominations: denominationEntries,
      },
    });
    Object.assign(closedayInfo, {
      day_close_currency_denomination: {
        cash_denominations: denominationEntries,
      },
    });
  }
  if (transactionEntries) {
    Object.assign(closeshiftInfo, {
      shift_end_transactions: { paymentTransactions: transactionEntries },
    });
    Object.assign(closedayInfo, {
      day_close_transactions: { paymentTransactions: transactionEntries },
    });
  }
  if (
    window.settingsConfig[SET_CLOSEDAY_ENTERED_AMOUNT - 1] !== undefined &&
    window.settingsConfig[SET_CLOSEDAY_ENTERED_AMOUNT - 1].value === '1'
  ) {
    Object.assign(closedayInfo, { nextDayOpeningAmount: close_day_amount });
  }
  showLoader({
    text: $.i18n.t('controller:masterMenuController.Pleasewait'),
    title: 'Closing Day And Shift',
  });

  $('#CloseDayAndShiftButtonId').prop('disabled', true);
  const result = await makeCloseDayShiftRequest({
    closedayInfo,
    nextDayinfo,
    id: params.result.id,
    closeshiftInfo,
  });
  window.Swal.close();
  if (result && result.status === 200) {
    closeDayAndShiftPostProcess(result);
  }

  if (result && result.status === 'failed') {
    window.notifyUser.showMessage('error', result.message);
  }
}

function updateGrandTotal() {
  let sum = 0;
  $('.total').each(function () {
    sum += Number($(this).text()) || 0;
  });
  $('#closeDayAndShiftCashInDrawerId').val(sum.toFixed(window.ROUNDOFF_UPTO));
  $(`[data-payment="Cash"]`)
    .find('.actualAmount')
    .val(sum.toFixed(window.ROUNDOFF_UPTO));
}

async function getSettledBillByPaymentsModeRequest({ fromDate }) {
  let shiftStartDate = fromDate;
  // if (countMidnightSale) {
  //   shiftStartDate = window
  //     .moment()
  //     .subtract(1, 'days')
  //     .startOf('day')
  //     .format('x');
  // }

  const params = {
    fromDate: Number(shiftStartDate),
    toDate: window.moment().format('x'),
    // user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  };
  const result = await makeSettledBillByPaymentsModeRequest(params);
  console.log(
    `Message="makeSettledBillByPaymentsModeRequest"`,
    JSON.stringify(result),
  );
  if (result && result.length) {
    const $tbody = $('#closeDayAndShiftTransactionsForDayTableId tbody');
    $('#closeDayAndShiftTransactionsForDayTableId')
      .find('tr:not(:first)')
      .remove();

    result.forEach((payment) => {
      const row = `
          <tr data-payment="${payment.payment_option}">
            <td>${payment.payment_option}</td>
            <td>${payment.count}</td>
            <td class="settledAmount">${Number(payment.amount).toFixed(window.ROUNDOFF_UPTO)}</td>
            
          </tr>
        `;
      $tbody.append(row);
    });
  }
}

async function getSettledBillByPaymentsModeRequestForShift({ fromDate }) {
  let shiftStartDate = fromDate;
  // if (countMidnightSale) {
  //   shiftStartDate = window
  //     .moment()
  //     .subtract(1, 'days')
  //     .startOf('day')
  //     .format('x');
  // }
  const params = {
    fromDate: Number(shiftStartDate),
    toDate: window.moment().format('x'),
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  };
  const result = await makeSettledBillByPaymentsModeRequest(params);
  if (result && result.length) {
    const $tbody = $('#closeDayAndShiftTransactionsTableForShiftid tbody');
    $('#closeDayAndShiftTransactionsTableForShiftid')
      .find('tr:not(:first)')
      .remove();

    result.forEach((payment) => {
      const row = `
          <tr data-payment="${payment.payment_option}">
            <td>${payment.payment_option}</td>
            <td class="closeDayTransactionCount transaction-count">${payment.count}</td>
            <td class="settledAmount closeDaySettledAmount">${Number(payment.amount).toFixed(window.ROUNDOFF_UPTO)}</td>
            <td><input type="number" min="0" class="actualAmount" maxlength="10" /></td>
            <td class="amountVarience closeDayVarianceAmount"></td>
          </tr>
        `;
      $tbody.append(row);
    });
    // On input change, update total
    $('.actualAmount').on('input', function () {
      const $row = $(this).closest('tr');
      let actualAmount = $(this).val() || 0;
      if (actualAmount < 0) {
        $(this).val(0);
        return;
      }
      if (actualAmount) {
        // actualAmount = actualAmount.replace(/(\..*)\./g, '$1');
        // $(this).val(actualAmount);
        if (actualAmount.length > 10) {
          actualAmount = actualAmount.slice(0, 10);
          $(this).val(actualAmount);
        }
      }

      const settledAmount = parseFloat($row.find('.settledAmount').text()) || 0;
      const expenses = Number($('#closeDayShiftExpensesId_value').text()) || 0;
      console.log('expenses', expenses);
      const variance =
        Number(actualAmount) + Number(expenses) - Number(settledAmount);
      $row.find('.amountVarience').text(variance.toFixed(2));

      if ($($row).attr('data-payment') === 'Cash') {
        $('#closeDayAndShiftCashInDrawerId').val(actualAmount);
      }
    });
  }
}

$('#closeDayAndShiftModal').on('shown.bs.modal', async () => {
  console.log('checking it');
  const data = $('#closeDayAndShiftModal').attr('data');
  const params = safeParse(data);

  let dayStartDate = params.result.start_day_date;
  // if (countMidnightSale) {
  //   dayStartDate = window
  //     .moment()
  //     .subtract(1, 'days')
  //     .startOf('day')
  //     .format('x');
  // }

  let shiftStartDate = params.response.shift_start_date;
  // if (countMidnightSale) {
  //   shiftStartDate = window
  //     .moment()
  //     .subtract(1, 'days')
  //     .startOf('day')
  //     .format('x');
  // }

  await getSettledBillByPaymentsModeRequest({
    fromDate: Number(dayStartDate),
  });
  await getSettledBillByPaymentsModeRequestForShift({
    fromDate: Number(shiftStartDate),
  });
  initAccountAccessLevels();

  $('#closeDayShiftRevenueId_key').text(
    $.i18n.t('controller:account.RevenueID') + ':',
  );
  $('#closeDayShiftRevenueId').text(window.revenue_id);

  $('#closeDayShiftUsername_key').text(
    $.i18n.t('controller:account.Username') + ':',
  );
  $('#closeDayShiftUsername').text(window.storeDetails?.username);

  const formattedDate = window.moment().format('DD/MM/YYYY hh:mm A');
  $('#closeDayShiftModalHeader').html(
    `${$.i18n.t('controller:account.Closingdayandshift')} - ${formattedDate}`,
  );

  $('#closeDayShiftOpeningBanlanceId_key').text(
    $.i18n.t('controller:account.Openingbalance') + ':',
  );

  $('#closeDayShiftOpeningBanlanceId').text(
    `${window.storeDetails.currency} ${params.response.opening_balance}`,
  );

  $('#closeDayAndShiftCommentInputId').val('');

  // Cash Drawer ID label (left side)
  $('#closeDayShiftCashdrawerId_key').text(
    $.i18n.t('controller:account.CashdrawerID') + ':',
  );

  // Cash Drawer ID value (right side)
  if (params && params.response && params.response.drawer_id) {
    $('#closeDayShiftCashdrawerId').text(params.response.drawer_id);
  } else {
    // fallback if drawer id is missing
    $('#closeDayShiftCashdrawerId').text('-');
  }

  // shift data
  const orderSummaryData = await getOrderSummaryRequest({
    fromDate: params.response.shift_start_date,
    toDate: Number(window.moment().format('x')),
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  });

  console.log(
    `Message="Day order summary data, shift data" response=${JSON.stringify(orderSummaryData)}`,
  );

  if (orderSummaryData) {
    if (orderSummaryData.orderSummary) {
      const { totalFulfilledOrders, totalCancelledOrders, totalFreeOrders } =
        orderSummaryData.orderSummary;
      $('#closeDayShiftFulfilledOrdersId').html(` ${totalFulfilledOrders}`);
      $('#closeDayShiftCancelledOrdersId').html(` ${totalCancelledOrders}`);
      $('#closeDayShiftComplementaryOrdersId').html(` ${totalFreeOrders}`);
    }
    if (orderSummaryData.expenses && orderSummaryData.expenses.expensesTotal) {
      $('#closeDayShiftExpensesForDayId').html(
        ` ${orderSummaryData.expenses.expensesTotal}`,
      );
    }
  }

  // day data
  // shift data
  const dayOrderSummaryData = await getOrderSummaryRequest({
    fromDate: params.result.start_day_date,
    toDate: Number(window.moment().format('x')),
    // user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  });

  console.log(
    `Message="Day order summary data, day data" response=${JSON.stringify(dayOrderSummaryData)}`,
  );
  // ----- Expenses (DAY) -----
  $('#closeDayShiftExpensesId_key').text(
    $.i18n.t('controller:account.Expenses') + ':',
  );
  $('#closeDayShiftExpensesId_value').text(0);

  if (
    dayOrderSummaryData.expenses &&
    dayOrderSummaryData.expenses.expensesTotal
  ) {
    $('#closeDayShiftExpensesId_value').text(
      dayOrderSummaryData.expenses.expensesTotal,
    );

    if (
      dayOrderSummaryData.expenses &&
      dayOrderSummaryData.expenses.expensesTotal
    ) {
      $('#closeDayShiftExpensesId_key').text(
        $.i18n.t('controller:account.Expenses') + ':',
      );
      $('#closeDayShiftExpensesId_value').text(
        orderSummaryData?.expenses?.expensesTotal ?? 0,
      );
    }
  }
  $('.note-count').val('');
  $('.total').text(0);

  // Also update grand total if needed
  updateGrandTotal();
});

function isDecimal(num) {
  return !Number.isInteger(num);
}
function initialize() {
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !== undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }
  let denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];

  if (window.settingsConfig[CURRENCY_DENOMINATION_COUNTS - 1] !== undefined) {
    let currencyDenominations =
      window.settingsConfig[CURRENCY_DENOMINATION_COUNTS - 1].value;

    if (currencyDenominations && currencyDenominations != 0) {
      currencyDenominations = currencyDenominations.split(',');
      if (currencyDenominations && currencyDenominations.length) {
        denominations = currencyDenominations;
      }
    }
  }

  // Populate table body
  $(() => {
    const $tbody = $('#closeDayAndShiftCashDenominationTableId tbody');

    denominations.forEach((denom) => {
      const row = `
          <tr data-denomination="${denom}">
                        <td>${!isDecimal(Number(denom)) ? window.storeDetails.currency : window.storeDetails.sub_currency_name} ${denom}</td>

            <td><input type="number" min="0" class="note-count" maxlength="5"/></td>
            <td class="total row-total">0</td>
          </tr>
        `;
      $tbody.append(row);
    });

    // Consolidated handler for .note-count inside this denomination table only
    $tbody.on('input', '.note-count', function () {
      // normalize value to digits only
      let rawVal = $(this).val() || '';
      rawVal = rawVal.replace(/\D/g, '');

      // if user typed more than 5 digits, notify and trim
      if (rawVal.length > 5) {
        if (
          window &&
          window.notifyUser &&
          typeof window.notifyUser.showMessage === 'function'
        ) {
          window.notifyUser.showMessage(
            'error',
            'Denomination count should not exceed 5 digits',
          );
        }
        rawVal = rawVal.slice(0, 5);
      }

      $(this).val(rawVal);

      // update row total
      const $row = $(this).closest('tr');
      const count = parseInt(rawVal, 10) || 0;
      const denom = Number($row.data('denomination')) || 0;
      const total = denom * count;
      $row.find('.total').text(total.toFixed(window.ROUNDOFF_UPTO));

      updateGrandTotal();
    });

    // Prevent invalid keys for these inputs
    $tbody.on('keydown', '.note-count', (e) => {
      const invalidKeys = ['.', 'e', '-', '+'];
      if (invalidKeys.includes(e.key)) {
        e.preventDefault();
      }
    });

    // Also handle change event to ensure paste / external changes are normalized
    $tbody.on('change', '.note-count', function () {
      let val = $(this).val() || '';
      val = val.replace(/\D/g, '');
      if (val.length > 5) {
        val = val.slice(0, 5);
      }
      $(this).val(val);

      const $row = $(this).closest('tr');
      const count = parseInt(val, 10) || 0;
      const denomination =
        parseInt($row.data('denomination')) ||
        Number($row.data('denomination'));
      const total = denomination * count;
      $row.find('.total').text(total.toFixed(window.ROUNDOFF_UPTO));

      updateGrandTotal();
    });
  });
  $('#closeDayAndShiftCashInDrawerId').on('change', function () {
    $(`[data-payment="Cash"]`).find('.actualAmount').val($(this).val());
    $('[data-payment="Cash"]').find('.actualAmount').trigger('input');
  });

  $('#CloseDayAndShiftButtonId').on('click', () => {
    closeDayAndShift();
  });

  $('#openCashDrawerOnCloseDayAndShiftbuttonid').on('click', async () => {
    openCashDrawerRequest();
  });

  initalizei18nforCloseDayAndShift();
}
initialize();
