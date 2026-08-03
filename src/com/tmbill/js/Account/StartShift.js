// StartShift.js - UPDATED: show notifications when inputs exceed allowed lengths
const { machineId } = require('node-machine-id');
const { startShiftRequest } = require('../../renderer/helper/Account.helper');
const { getStartendDayData } = require('../../renderer/helper/Common.helper');
const { startDayRequest } = require('../../renderer/helper/Order.helper');
const { safeParse } = require('../../util/RendererUtils');
const { showLoader } = require('../CommonUtils');
const { getDenominationData } = require('./utils');
const { initalizei18nforStartShift } = require('../i18nController');
const { CURRENCY_DENOMINATION_COUNTS } = require('../../util/SettingIDs');
const { OPEN_CASH_DRAWER } = require('../../util/IPC_Messages');

/* eslint-disable camelcase */
window.startShiftWindowLoaded = true;

async function openCashDrawerRequest() {
  try {
    window.ipcRenderer.send(OPEN_CASH_DRAWER, {});
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function startShift(params) {
  try {
    const shift_start_comment = $('#startShiftCommentInputId').val();
    const opening_balance = $('#startShiftCashInDrawerId').val();
    const drawer_id = $('#startShiftCashDrawerInputId').val();
    const shift_start_date = Date.now();

    if (opening_balance.length > 11) {
      window.notifyUser.showMessage(
        'error',
        'Cash in Drawer amount should be less than 11 digit',
      );
      return;
    }

    if (window.allspecialCharRegex.test(drawer_id)) {
      window.notifyUser.showMessage(
        'error',
        'Special characters are not allowed in drawer id',
      );
      return;
    }

    if (window.allspecialCharRegex.test(shift_start_comment)) {
      window.notifyUser.showMessage(
        'error',
        'Special characters are not allowed in comment',
      );
      return;
    }

    if (opening_balance && opening_balance < 0) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid cash drawer amount',
      );
      return;
    }

    // ✅ ONLY validate length if drawer_id has a value
    // Changed limit to 6 characters (show notification earlier on input too)
    if (drawer_id && drawer_id.length > 11) {
      window.notifyUser.showMessage(
        'error',
        'Cash Drawer ID should not exceed 11 characters',
      );
      return;
    }

    const shiftData = {
      shift_start_date,
      shift_start_comment,
      opening_balance,
      store_id: window.storeDetails.store_id,
      tmpos_id: window.storeDetails.tmpos_id,
      shift_start_by_user: window.storeDetails.username,
      revenue_id: window.revenue_id,
      drawer_id,
    };

    window.CURRENT_STARTSHIFTTIME = window
      .moment(Number(shift_start_date))
      .format('YYYY-MM-DD hh:mm:ss A');

    const denominationEntries = getDenominationData(
      'startShiftCashDenominationTableId',
    );

    if (denominationEntries) {
      Object.assign(shiftData, {
        shift_start_currency_denomination: {
          cash_denominations: denominationEntries,
        },
      });
    }

    showLoader({
      title: 'Starting Shift',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });

    const result = await startShiftRequest(shiftData);
    if (result) {
      window.Swal.close();
      $('#startShiftModal').modal('hide');
      window.startEndDayDateData = await getStartendDayData({
        store_id: window.storeDetails.store_id,
      });
    }
  } catch (error) {
    console.error(error);
    window.Swal.close();
  }
}

function updateGrandTotal() {
  let sum = 0;
  $('.total').each(function () {
    sum += Number($(this).text()) || 0;
  });
  $('#startShiftCashInDrawerId').val(sum.toFixed(window.ROUNDOFF_UPTO));
  const amount = $('#startShiftCashInDrawerId').val() || 0;
  $('#startShiftOpeningBalanceId_value').text(
    `${window.storeDetails.currency} ${amount}`,
  );
}

async function setRevenueId() {
  window.MACHINE_ID = await machineId();
  if (window.MACHINE_ID) {
    window.revenue_id = window.MACHINE_ID.slice(-4);
  }
}

$('#startShiftModal').on('shown.bs.modal', () => {
  const data = $('#startShiftModal').attr('data');
  const params = safeParse(data) || {};

  // ===== Header =====
  const formattedDate = window.moment().format('DD/MM/YYYY hh:mm A');
  $('#startShiftModalHeaderId').html(
    `${$.i18n.t('controller:account.Startingshift')} - ${formattedDate}`,
  );

  // ===== Session Info – Revenue ID, Username, Cash Drawer ID =====

  // Revenue ID pill
  if (window.revenue_id) {
    $('#startShiftRevenueId_key').text(
      $.i18n.t('controller:account.RevenueID') + ':',
    );
    $('#startShiftRevenueId_value').text(window.revenue_id || '');
  } else {
    setRevenueId();
  }

  // Username pill
  $('#startShiftUsernameId_key').text(
    $.i18n.t('controller:account.Username') + ':',
  );
  $('#startShiftUsernameId_value').text(
    (window.storeDetails && window.storeDetails.username) || '',
  );

  // ✅ FIXED: Cash Drawer ID - Set label and get from correct input
  $('#startShiftCashDrawerId_key').text(
    `${$.i18n.t('controller:account.CashdrawerID')}:`,
  );

  // If coming from a previous shift, pre-fill it and make readonly
  const drawerFromBackend =
    params && params.response && params.response.drawer_id
      ? String(params.response.drawer_id)
      : '';

  if (drawerFromBackend) {
    $('#startShiftCashDrawerInputId')
      .val(drawerFromBackend)
      .prop('readonly', true);
  } else {
    $('#startShiftCashDrawerInputId').val('').prop('readonly', false);
  }

  // Opening balance comes from the "Total Cash In Drawer" input
  const openingBalanceValue = Number($('#startShiftCashInDrawerId').val()) || 0;

  $('#startShiftOpeningBalanceId_value').text(
    `${window.storeDetails.currency} ${openingBalanceValue}`,
  );

  // ===== Previous Shift History – pills (display-only, no inputs) =====
  $('#startShiftPreviousShiftClosingAmountId_key').text(
    $.i18n.t('controller:account.Closingshiftamountindrawer') + ':',
  );
  $('#startShiftPreviousShiftUsernameId_key').text(
    $.i18n.t('controller:account.Lastusername') + ':',
  );
  $('#startShiftPreviousShiftClosingTimeId_key').text(
    $.i18n.t('controller:account.Closingshifttime') + ':',
  );

  // Default values
  $('#startShiftPreviousShiftClosingAmountId_value').text('-');
  $('#startShiftPreviousShiftUsernameId_value').text('-');
  $('#startShiftPreviousShiftClosingTimeId_value').text('-');

  // Fill from backend if we have previous shift data
  if (params && params.previousShiftData && params.previousShiftData.length) {
    const previousShiftData = params.previousShiftData[0];

    // Closing shift amount in drawer
    if (previousShiftData.current_closing_balance != null) {
      $('#startShiftPreviousShiftClosingAmountId_value').text(
        `${window.storeDetails.currency} ${previousShiftData.current_closing_balance}`,
      );
    }

    // Last username
    if (previousShiftData.shift_end_by_user) {
      $('#startShiftPreviousShiftUsernameId_value').text(
        previousShiftData.shift_end_by_user,
      );
    }

    // Closing shift time
    if (previousShiftData.shift_end_date) {
      const previousFormattedDate = window
        .moment(previousShiftData.shift_end_date)
        .format('DD/MM/YYYY hh:mm A');
      $('#startShiftPreviousShiftClosingTimeId_value').text(
        previousFormattedDate,
      );
    }
  }

  // ===== Reset denominations & totals =====
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
    const $tbody = $('#startShiftCashDenominationTableId tbody');

    denominations.forEach((denom) => {
      const row = `
        <tr data-denomination="${denom}">
          <td>${!isDecimal(Number(denom)) ? window.storeDetails.currency : window.storeDetails.sub_currency_name} ${denom}</td>
          <td><input type="number" min="0" class="note-count" /></td>
          <td class="total row-total">0</td>
        </tr>
      `;
      $tbody.append(row);
    });

    // Consolidated handler for .note-count to avoid duplicate handlers and show notifications
    $tbody.on('input', '.note-count', function () {
      // keep only digits
      let rawVal = $(this).val() || '';
      // strip non-digits (this keeps behavior consistent)
      rawVal = rawVal.replace(/\D/g, '');

      // if user typed more than 5 digits, notify and trim
      if (rawVal.length > 5) {
        // notify user (error)
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

    // Prevent certain keys ('.', 'e', '+', '-') in note-count entry
    $tbody.on('keydown', '.note-count', (e) => {
      const invalidKeys = ['.', 'e', '-', '+'];
      if (invalidKeys.includes(e.key)) {
        e.preventDefault();
      }
    });

    // Also ensure change event calculates correctly (in case of paste etc.)
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

  // Cash Drawer ID: show notification and trim when exceeding 6 characters
  $('#startShiftCashDrawerInputId').on('input', function () {
    const $this = $(this);
    const val = $this.val() || '';
    if (val.length > 6) {
      if (
        window &&
        window.notifyUser &&
        typeof window.notifyUser.showMessage === 'function'
      ) {
        window.notifyUser.showMessage(
          'error',
          'Cash Drawer ID should not exceed 6 characters',
        );
      }
      $this.val(val.slice(0, 6));
    }
  });

  $('#startShiftCashInDrawerId').on('change', () => {
    const amount = $('#startShiftCashInDrawerId').val() || 0;
    $('#startShiftOpeningBalanceId_value').text(
      `${window.storeDetails.currency} ${amount}`,
    );
  });

  $('#startShiftButtonId').on('click', () => {
    startShift();
  });

  $('#openCashDrawerOnStartShiftbuttonid').on('click', async () => {
    openCashDrawerRequest();
  });

  $('#startShiftModal').modal({
    backdrop: 'static',
    keyboard: false,
    show: false,
  });

  initalizei18nforStartShift();
}

initialize();
// StartShift.js
