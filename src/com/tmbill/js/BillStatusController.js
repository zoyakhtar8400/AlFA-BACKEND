const { initializei18nforBillstatuswindowui } = require('./i18nController');
const { MAKE_CANCEL_BILL_REASON_MANDATORY } = require('../util/SettingIDs');
const { VOID_REASONS } = require('../util/Constants');

window.billStatusscriptLoaded = true;
let isReasonCompulsory = false;

/**
 * Intitialize
 */
function Initialize() {
  console.log('bill status loaded.....');
  $('#cancelbillButtonid').on('click', () => {
    const reason = $('#reasonFieldid').val();
    if (
      window.settingsConfig[MAKE_CANCEL_BILL_REASON_MANDATORY - 1] != undefined
    ) {
      isReasonCompulsory =
        window.settingsConfig[MAKE_CANCEL_BILL_REASON_MANDATORY - 1].value ==
        '1';
    }
    if (isReasonCompulsory && !reason) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderWindowNotifications.Pleaseaddreason'),
      );
      return;
    }
    settleBillFromRemote('cancelled', reason);
    $('#reasonFieldid').val('');
  });

  $('#freebillButtonid').on('click', () => {
    const reason = $('#reasonFieldid').val();
    if (window.settingsConfig[MAKE_CANCEL_BILL_REASON_MANDATORY - 1]) {
      isReasonCompulsory =
        window.settingsConfig[MAKE_CANCEL_BILL_REASON_MANDATORY - 1].value ===
        '1';
    }
    if (isReasonCompulsory && !reason) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderWindowNotifications.Pleaseaddreason'),
      );
      return;
    }
    settleBillFromRemote('free', reason);
    $('#reasonFieldid').val('');
  });

  $('#billstatusModal').modal('show');

  if ($.i18n) {
    initializei18nforBillstatuswindowui();
  } else {
    setTimeout(initializei18nforallReportsswindowui, 400);
  }
  // $('#reasonFieldid option:gt(0)').remove();
  // VOID_REASONS.forEach((reason) => {
  //   const option = $('<option>').val(reason).text(reason);
  //   $('#reasonFieldid').append(option);
  // });
  $('#reasonFieldid')
    .autocomplete({
      source: VOID_REASONS,
    })
    .on('focus', function () {
      // Trigger search on focus with empty value
      $(this).autocomplete('search', ' ');
    });

  $('#billstatusModal').on('hidden.bs.modal', () => {
    $('#reasonFieldid').val('');
  });
}

Initialize();
