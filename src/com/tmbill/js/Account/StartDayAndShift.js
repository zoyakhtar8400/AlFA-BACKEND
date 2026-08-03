const { machineId } = require('node-machine-id');
const { getStartendDayData } = require('../../renderer/helper/Common.helper');
const { startDayRequest } = require('../../renderer/helper/Order.helper');
const { safeParse } = require('../../util/RendererUtils');
const { showLoader } = require('../CommonUtils');
const {
  SET_CLOSEDAY_ENTERED_AMOUNT,
  CURRENCY_DENOMINATION_COUNTS,
} = require('../../util/SettingIDs');
const { initalizei18nforStartDayAndShift } = require('../i18nController');
const { OPEN_CASH_DRAWER } = require('../../util/IPC_Messages');

/* eslint-disable camelcase */
window.startDayAndShiftWindowLoaded = true;

async function openCashDrawerRequest() {
  try {
    window.ipcRenderer.send(OPEN_CASH_DRAWER, {});
  } catch (error) {
    console.error(error);
  }
  // window.ipcRenderer.send('open-cash-drawer', {});
  return undefined;
}

async function startDayAndShift() {
  try {
    const data = $('#startDayAndShiftModal').attr('data');
    const params = safeParse(data);
    const start_day_comment = $('#startDayShiftCommentInputId').val();
    const opening_balance = $('#startDayAndShiftCashInDrawerId').val();
    const start_day_date = Date.now();
    const drawer_id = $('#startDayAndShiftCashDrawerInputId').val();

    if (opening_balance.length > 13) {
      window.notifyUser.showMessage(
        'error',
        'Cash in Drawer amount should be less than 13 digit',
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
    if (window.allspecialCharRegex.test(start_day_comment)) {
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
    // Changed limit to 6 characters
    if (drawer_id && drawer_id.length > 6) {
      window.notifyUser.showMessage(
        'error',
        'Cash Drawer ID should not exceed 6 characters',
      );
      return;
    }

    const startDayData = {
      start_day_date,
      shift_start_date: start_day_date,
      start_day_comment,
      shift_start_comment: start_day_comment,
      opening_balance,
      store_id: window.storeDetails.store_id,
      tmpos_id: window.storeDetails.tmpos_id,
      day_start_by_user: window.storeDetails.username,
      shift_start_by_user: window.storeDetails.username,
      revenue_id: window.revenue_id,
      drawer_id,
      id: params.id,
    };

    if (params && params.previousDayData && params.previousDayData.length) {
      const previousDayData =
        params.previousDayData[params.previousDayData.length - 1];
      if (previousDayData && previousDayData.day_close_date) {
        Object.assign(startDayData, {
          previous_close_day_date: previousDayData.day_close_date,
        });
      }
    }

    window.CURRENT_STARTDAYTIME = window
      .moment(Number(start_day_date))
      .format('YYYY-MM-DD hh:mm:ss A');
    window.CURRENT_STARTSHIFTTIME = window
      .moment(Number(start_day_date))
      .format('YYYY-MM-DD hh:mm:ss A');

    showLoader({
      title: 'Starting Day And Shift',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });

    const result = await startDayRequest(startDayData);
    if (result) {
      window.Swal.close();
      $('#startDayAndShiftModal').modal('hide');
      window.startEndDayDateData = await getStartendDayData({
        store_id: window.storeDetails.store_id,
      });
      window.start_day_date = start_day_date;
      window.checkPullPendingOrdersFromRemote();
    }
  } catch (error) {
    console.error(error);
    window.Swal.close();
  }
}

async function setRevenueId(params) {
  window.MACHINE_ID = await machineId();
  if (window.MACHINE_ID) {
    window.revenue_id = window.MACHINE_ID.slice(-4);
    // Set key & value
    $('#startDayAndShiftRevenueId_key').text(
      $.i18n.t('controller:account.RevenueID') + ':',
    );
    $('#startDayAndShiftRevenueId_value').text(window.revenue_id || '');
  }
}

$('#startDayAndShiftModal').on('shown.bs.modal', () => {
  const data = $('#startDayAndShiftModal').attr('data');
  const params = safeParse(data);
  // 🔹 Cash Drawer ID label + value
  $('#startDayAndShiftCashDrawerId_key').text(
    $.i18n.t('controller:account.CashdrawerID') + ' :',
  );
  const drawerIdFromBackend =
    (params && params.drawer_id) ||
    (params &&
      params.previousDayData &&
      params.previousDayData[0] &&
      params.previousDayData[0].drawer_id) ||
    '';
  $('#startDayAndShiftCashDrawerInputId').val(
    drawerIdFromBackend ? drawerIdFromBackend : '',
  );

  // Revenue ID
  if (window.revenue_id) {
    $('#startDayAndShiftRevenueId_key').text(
      $.i18n.t('controller:account.RevenueID') + ':',
    );
    $('#startDayAndShiftRevenueId_value').text(window.revenue_id);
  } else {
    setRevenueId();
  }

  $('#startDayAndShiftUsername_key').text(
    $.i18n.t('controller:account.Username') + ':',
  );
  $('#startDayAndShiftUsername_value').text(
    window.storeDetails?.username || '',
  );

  const formattedDate = window.moment().format('DD/MM/YYYY hh:mm A');
  $('#startDayAndShiftModalHeaderId').html(
    `${$.i18n.t('controller:account.startingDayAndShift')} - ${formattedDate}`,
  );

  updateGrandTotal();

  if (
    window.settingsConfig[SET_CLOSEDAY_ENTERED_AMOUNT - 1] !== undefined &&
    window.settingsConfig[SET_CLOSEDAY_ENTERED_AMOUNT - 1].value === '1'
  ) {
    $('#startDayAndShiftCashInDrawerId').val(params.prev_closing_balance);
  }
  // $('#startDayAndShiftCashInDrawerId').val(params.prev_closing_balance);
  const openingBalanceValue =
    Number($('#startDayAndShiftCashInDrawerId').val()) || 0;

  $('#startDayAndShiftOpeningBalanceId_key').text(
    $.i18n.t('controller:account.Openingbalance') + ':',
  );
  $('#startDayAndShiftOpeningBalanceId_value').text(
    `${window.storeDetails.currency} ${openingBalanceValue}`,
  );
  // ----- Previous Day/Shift History pills -----
  // set keys first (labels)
  $('#startDayAndShiftPreviousShiftClosingAmountId_key').text(
    $.i18n.t('controller:account.closingShiftDayAmountInDrawer') + ':',
  );
  $('#startDayAndShiftPreviousShiftUsernameId_key').text(
    $.i18n.t('controller:account.Lastusername') + ':',
  );
  $('#startDayAndShiftPreviousShiftClosingTimeId_key').text(
    $.i18n.t('controller:account.closingShiftDayTime') + ':',
  );
  $('#startDayAndShiftPreviousDayClosingbalance_key').text(
    $.i18n.t('controller:account.PreviousClosingBalance') + ':',
  );

  // default values
  $('#startDayAndShiftPreviousShiftClosingAmountId_value').text('-');
  $('#startDayAndShiftPreviousShiftUsernameId_value').text('-');
  $('#startDayAndShiftPreviousShiftClosingTimeId_value').text('-');
  $('#startDayAndShiftPreviousDayClosingbalance_value').text('-');

  if (params && params.previousDayData && params.previousDayData.length) {
    const previousDayData = params.previousDayData[0];
    const prevousformattedDate = window
      .moment(previousDayData.day_close_date)
      .format('DD/MM/YYYY hh:mm A');

    // closing amount in drawer
    if (previousDayData.current_closing_balance != null) {
      $('#startDayAndShiftPreviousShiftClosingAmountId_value').text(
        `${window.storeDetails.currency} ${previousDayData.current_closing_balance}`,
      );
      // previous closing balance (same value, unless you have a different field)
      $('#startDayAndShiftPreviousDayClosingbalance_value').text(
        `${window.storeDetails.currency} ${previousDayData.current_closing_balance}`,
      );
    }

    // last username
    if (previousDayData.day_close_by_user) {
      $('#startDayAndShiftPreviousShiftUsernameId_value').text(
        previousDayData.day_close_by_user,
      );
    }

    // closing time
    $('#startDayAndShiftPreviousShiftClosingTimeId_value').text(
      prevousformattedDate,
    );
  }

  $('.note-count').val('');
  $('.total').text(0);

  // Also update grand total if needed
  // updateGrandTotal();
});

function updateGrandTotal() {
  let sum = 0;
  $('.total').each(function () {
    sum += Number($(this).text()) || 0;
  });
  $('#startDayAndShiftCashInDrawerId').val(sum.toFixed(window.ROUNDOFF_UPTO));
  const amount = $('#startDayAndShiftCashInDrawerId').val() || 0;
  $('#startDayAndShiftOpeningBalanceId_value').text(
    `${window.storeDetails.currency} ${amount}`,
  );
}
function isDecimal(num) {
  return !Number.isInteger(num);
}

function initialize() {
  $('#startDayAndShiftUsername').html(
    `Username: ${window.storeDetails.username}`,
  );
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
    const $tbody = $('#startDayAndShitCashDenominationTableId tbody');

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

    // Consolidated handler for .note-count inside this table only
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
      $row.find('.total').text(total);

      updateGrandTotal();
    });
  });

  // Cash Drawer ID: show notification and trim when exceeding 6 characters
  $('#startDayAndShiftCashDrawerInputId').on('input', function () {
    const $this = $(this);
    const val = $this.val() || '';
    if (val.length > 11) {
      if (
        window &&
        window.notifyUser &&
        typeof window.notifyUser.showMessage === 'function'
      ) {
        window.notifyUser.showMessage(
          'error',
          'Cash Drawer ID should not exceed 11 characters',
        );
      }
      $this.val(val.slice(0, 11));
    }
  });

  $('#startCloseDayAndShiftButtonId').on('click', () => {
    startDayAndShift();
  });

  $('#startDayAndShiftCashInDrawerId').on('change', () => {
    const amount = $('#startDayAndShiftCashInDrawerId').val() || 0;
    $('#startDayAndShiftOpeningBalanceId_value').text(
      `${window.storeDetails.currency} ${amount}`,
    );
  });

  $('#startDayAndShiftModal').modal({
    backdrop: 'static',
    keyboard: false,
    show: false,
  });

  $('#openCashDrawerOnStartDayAndShiftbuttonid').on('click', async () => {
    openCashDrawerRequest();
  });

  initalizei18nforStartDayAndShift();
}
initialize();
