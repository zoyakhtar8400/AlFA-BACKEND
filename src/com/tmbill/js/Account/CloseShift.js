// CloseShift.js - FIXED VERSION
/* eslint-disable camelcase */
const {
  makeSettledBillByPaymentsModeRequest,
  makeCloseShiftRequest,
  getOrderSummaryRequest,
} = require('../../renderer/helper/Account.helper');
const { OPEN_CASH_DRAWER } = require('../../util/IPC_Messages');
const { safeParse } = require('../../util/RendererUtils');
const {
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  CURRENCY_DENOMINATION_COUNTS,
} = require('../../util/SettingIDs');
const { initAccountAccessLevels } = require('../AccesslevelManager');
const { initalizei18nforCloseShift } = require('../i18nController');
const { getDenominationData, getPaymentTransactionsData } = require('./utils');

window.closeShiftWindowLoaded = true;
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

async function closeShiftPostProcess(reply) {
  if (reply.cash_diff < 0) {
    await window.Swal.fire({
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
  await window.getAndExportOrPrintReport({}, reply);
}

async function closeShift() {
  const shift_end_comment = $('#closeShiftCommentInputId').val();
  const close_shift_amount = $('#closeShiftCashInDrawerId').val();
  const data = $('#closeShiftModal').attr('data');
  const params = safeParse(data);

  if (close_shift_amount.length > 13) {
    window.notifyUser.showMessage(
      'error',
      'Cash in Drawer amount should be less than 13 digit',
    );
    return;
  }
  if (window.allspecialCharRegex.test(shift_end_comment)) {
    window.notifyUser.showMessage(
      'error',
      'Special characters are not allowed in comment',
    );
    return;
  }

  if (close_shift_amount && close_shift_amount < 0) {
    window.notifyUser.showMessage(
      'error',
      'Please enter valid cash drawer amount',
    );
    return;
  }

  const closeshiftInfo = {
    shift_end_comment,
    current_closing_balance: 0,
    shift_end_date: window.moment().format('x'),
    shift_end_by_user: window.storeDetails.username,
    close_shift_amount,
    countMidnightSale,
    shift_start_date: params.shift_start_date,
  };

  const denominationEntries = getDenominationData(
    'closeShiftCashDenominationTableId',
  );
  const transactionEntries = getPaymentTransactionsData(
    'closeShiftTransactionsTableId',
  );

  if (denominationEntries) {
    Object.assign(closeshiftInfo, {
      shift_end_currency_denomination: {
        cash_denominations: denominationEntries,
      },
    });
  }
  if (transactionEntries) {
    Object.assign(closeshiftInfo, {
      shift_end_transactions: { paymentTransactions: transactionEntries },
    });
  }

  $('#CloseShiftButtonId').prop('disabled', true);

  const result = await makeCloseShiftRequest({
    closeshiftInfo,
    id: params.id,
    shift_start_date: params.shift_start_date,
    prev_closing_balance: params.prev_closing_balance,
  });
  if (result && result.status === 200) {
    await closeShiftPostProcess(result);
  }
}

function updateGrandTotal() {
  let sum = 0;
  $('.total').each(function () {
    sum += Number($(this).text()) || 0;
  });
  $('#closeShiftCashInDrawerId').val(sum.toFixed(window.ROUNDOFF_UPTO));
  $('#closeDayAndShiftCashInDrawerId').val(sum.toFixed(window.ROUNDOFF_UPTO));
  $(`[data-payment="Cash"]`)
    .find('.actualAmount')
    .val(sum.toFixed(window.ROUNDOFF_UPTO));
}

async function getSettledBillByPaymentsModeRequest({ fromDate }) {
  const params = {
    fromDate,
    toDate: window.moment().format('x'),
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  };
  const result = await makeSettledBillByPaymentsModeRequest(params);
  if (result && result.length) {
    const $tbody = $('#closeShiftTransactionsTableId tbody');
    $('#closeShiftTransactionsTableId').find('tr:not(:first)').remove();

    result.forEach((payment) => {
      const row = `
        <tr data-payment="${payment.payment_option}">
          <td>${payment.payment_option}</td>
          <td class="transaction-count closeShiftTransactionCount">${payment.count}</td>
          <td class="settledAmount closeShiftSettledAmount">${Number(payment.amount).toFixed(window.ROUNDOFF_UPTO)}</td>
          <td><input type="number" min="0" class="actualAmount" /></td>
          <td class="amountVarience closeShiftVarianceAmount"></td>
        </tr>
      `;
      $tbody.append(row);
    });
    // On input change, update total
    $('.actualAmount').on('input', function () {
      const $row = $(this).closest('tr');
      let actualAmount = $(this).val();
      if (actualAmount < 0) {
        $(this).val(0);
        return;
      }
      if (actualAmount) {
        if (actualAmount.length > 10) {
          actualAmount = actualAmount.slice(0, 10);
          $(this).val(actualAmount);
        }
      }
      const settledAmount = parseFloat($row.find('.settledAmount').text()) || 0;
      const expenses = Number($('#closeShiftExpenseTotalId_value').text()) || 0;

      const variance =
        Number(actualAmount) + Number(expenses) - Number(settledAmount);
      $row.find('.amountVarience').text(variance.toFixed(2));
      if ($($row).attr('data-payment') === 'Cash') {
        $('#closeShiftCashInDrawerId').val(actualAmount);
      }
    });
  }
}

$('#closeShiftModal').on('shown.bs.modal', async () => {
  const data = $('#closeShiftModal').attr('data');
  const params = safeParse(data);
  let fromDate = params.shift_start_date;
  if (countMidnightSale) {
    fromDate = window.moment().subtract(1, 'days').startOf('day').format('x');
  }
  await getSettledBillByPaymentsModeRequest({
    fromDate: Number(fromDate), // params.shift_start_date,
  });
  initAccountAccessLevels();

  $('#closeShiftRevenueId_key').text(
    $.i18n.t('controller:account.RevenueID') + ':',
  );
  $('#closeShiftRevenueId_value').text(window.revenue_id || '');

  $('#closeShiftUsernameId_key').text(
    $.i18n.t('controller:account.Username') + ':',
  );
  $('#closeShiftUsernameId_value').text(
    (window.storeDetails && window.storeDetails.username) || '',
  );
  const formattedDate = window.moment().format('DD/MM/YYYY hh:mm A');
  $('#closeShiftModalHeaderId').html(
    `${$.i18n.t('controller:account.Closingshift')} - ${formattedDate}`,
  );
  $('#closeShiftOpeningBalanceId_key').text(
    $.i18n.t('controller:account.Openingbalance') + ':',
  );
  $('#closeShiftOpeningBalanceId_value').text(
    `${window.storeDetails.currency} ${params.opening_balance}`,
  );
  $('#closeShiftExpenseTotalId_value').text(0);
  $('#closeShiftExpenseTotalId_key').text(
    $.i18n.t('controller:account.Expenses') + ':',
  );

  // ✅ FIXED: Set Cash Drawer ID label
  $('#closeShiftCashDrawerId_key').text(
    $.i18n.t('controller:account.CashdrawerID') + ':',
  );

  // ✅ FIXED: Set Cash Drawer ID value (display-only from params)
  const cashDrawerId =
    params && params.drawer_id ? String(params.drawer_id) : '-';
  $('#closeShiftCashdrawerId').text(cashDrawerId);

  $('#closeShiftCommentInputId').val('');
  const orderSummaryData = await getOrderSummaryRequest({
    fromDate: Number(fromDate),
    toDate: Number(window.moment().format('x')),
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  });

  if (orderSummaryData) {
    if (orderSummaryData.orderSummary) {
      const { totalFulfilledOrders, totalCancelledOrders, totalFreeOrders } =
        orderSummaryData.orderSummary;
      $('#closeShiftFulfilledOrdersCountId_key').text(
        $.i18n.t('controller:account.Fullfieldorders') + ':',
      );
      $('#closeShiftCancelledOrdersCountId_key').text(
        $.i18n.t('controller:account.Cancelledorders') + ':',
      );
      $('#closeShiftComplementaryOrdersCountId_key').text(
        $.i18n.t('controller:account.Complementaryorders') + ':',
      );
      $('#closeShiftFulfilledOrdersCountId_value').text(0);
      $('#closeShiftCancelledOrdersCountId_value').text(0);
      $('#closeShiftComplementaryOrdersCountId_value').text(0);

      // Fill values from API
      if (orderSummaryData && orderSummaryData.orderSummary) {
        const { totalFulfilledOrders, totalCancelledOrders, totalFreeOrders } =
          orderSummaryData.orderSummary;

        $('#closeShiftFulfilledOrdersCountId_value').text(
          totalFulfilledOrders || 0,
        );
        $('#closeShiftCancelledOrdersCountId_value').text(
          totalCancelledOrders || 0,
        );
        $('#closeShiftComplementaryOrdersCountId_value').text(
          totalFreeOrders || 0,
        );
      }
    }

    if (orderSummaryData.expenses && orderSummaryData.expenses.expensesTotal) {
      $('#closeShiftExpenseTotalId_value').text(
        orderSummaryData.expenses.expensesTotal,
      );
    } else {
      $('#closeShiftExpenseTotalId_value').text(0);
    }
  }
  $('.note-count').val('');
  $('.total').text(0);
  updateGrandTotal();
});

function isDecimal(num) {
  return !Number.isInteger(num);
}

function initialize() {
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
    const $tbody = $('#closeShiftCashDenominationTableId tbody');

    denominations.forEach((denom) => {
      const row = `
        <tr data-denomination="${denom}">
          <td>${!isDecimal(Number(denom)) ? window.storeDetails.currency : window.storeDetails.sub_currency_name} ${denom}</td>
          <td><input type="number" min="0" class="note-count" maxlength="5" /></td>
          <td class="total row-total">0</td>
        </tr>
      `;
      $tbody.append(row);
    });

    // Consolidated delegated handlers for the denomination table only
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

    // Prevent invalid keys
    $tbody.on('keydown', '.note-count', (e) => {
      const invalidKeys = ['.', 'e', '-', '+'];
      if (invalidKeys.includes(e.key)) {
        e.preventDefault();
      }
    });

    // Normalize paste / change events
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
      $row.find('.total').text(total);

      updateGrandTotal();
    });
  });

  $('#CloseShiftButtonId').on('click', () => {
    closeShift();
  });

  $('#openCashDrawerOnCloseShiftbuttonid').on('click', async () => {
    openCashDrawerRequest();
  });

  $('#closeShiftCashInDrawerId').on('change', function () {
    $(`[data-payment="Cash"]`).find('.actualAmount').val($(this).val());
    $('[data-payment="Cash"]').find('.actualAmount').trigger('input');
  });

  initalizei18nforCloseShift();

  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] != undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }
}
initialize();
