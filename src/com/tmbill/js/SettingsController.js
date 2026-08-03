/* eslint-disable camelcase */
/* eslint-disable func-names */
const { forEach } = require('lodash');
const debounce = require('lodash/debounce');
const { default: Swal } = require('sweetalert2');
const { showLoader } = require('./CommonUtils');
const { setLocalStorage, getLocalStorage } = require('../storage/localStorage');
const { SUPPORTED_LANGUAGES } = require('../util/Constants');
const {
  GET_SHORTCUTS,
  EXPORT_IMPORT_MSG,
  GET_PAYMENT_MODES_FOR_STRIP,
  GET_PAYMENT_MODES_FOR_STRIP_REPLY,
  OPEN_DIALOG_FOR_DIRECTORY,
  UPDATE_BILL_NUMBER,
  SET_LANGUAGE,
  CHECK_FOR_UPDATES,
  UPDATE_SETTNGS,
  EXTEND_CLOSE_DAY_TIME,
} = require('../util/IPC_Messages');
const {
  APP_THEME,
  SHOW_BILL_DETAILS_ON_TABLE,
  GROUP_KITCHENPRINTERS,
  SHOW_ITEM_DETAILS,
  SHOW_ITEMCODE_DETAILS,
  DISABLE_SAVEKOT_BUTTON,
  DISABLE_SAVEBILL_BUTTON,
  SHOW_SOLDITEMS_IN_REPORT,
  SHOW_ITEMNOTE,
  KOT_PRINT_VIEW,
  SHOW_BILLHISTORY_ONREPORT,
  SHOW_PAYMENTS_ONREPORT,
  SHOW_SUMMARYSTATS_ONREPORT,
  TABLENAME_AS_CUSTOMER_FORTAHD,
  DRAFT_PRINT_STATUS,
  DEFAULT_TAB,
  DEFAULT_QUICKKOT_CHECK,
  SEND_CUSTOMERDETAILSTODBOY_CHECK,
  SHOW_DUEPAYCHECK,
  DEFAULT_QUICKBILL_CHECK,
  PRINTBILL_ONORDER_ACCEPT,
  DISPLAYTIME_ON_TABLES,
  PRINTKOT_ONORDER_ACCEPT,
  QUICK_KOTPRINT_LABEL,
  TABLE_COVERS_REQUIRED,
  CAPTAIN_COVERS_REQUIRED,
  QUICK_BILLPRINT_LABEL,
  DISABLED_TABS,
  getNotificationsoundnames,
  PRINTTOLABEL_WITHKOT,
  KDWISE_KOTPRINT,
  BILL_ROUNDOFF,
  SHOW_ORDERID_ON_KOT,
  SHOW_STORELOGO,
  SHOW_DEFAULT_PAYMENT,
  START_BILLING_BY_SECTION,
  SHOW_STORENAME_ONKOT,
  AUTO_SYNC,
  SHOW_CUSTOMERON_KOT_CHECK,
  SHOW_CUSTOMERON_BILL_CHECK,
  SHOW_NEW_OLDKOT_AS_TITLE,
  SHOW_ORDERSTATE_DETAILS,
  PULLORDER_ONACCEPT,
  CUSTOMERINFO_OPTIONS,
  SHOW_ITEMPREPTIME,
  DEFAULT_SENDEBILL_CHECK,
  SORT_ITEMSBY,
  SEND_OTPFOR_ORDER,
  SEND_OTPFOR_RECEIPT,
  SHOW_BILLAMOUNT_INWORDS,
  ALLOW_DISCOUNTAFTER_PRINT,
  ALLOW_CHARGESAFTER_PRINT,
  SHOW_BILLNO_ONBILL,
  SHOW_ORDERID_ONBILL,
  ENABLE_TABLEWISE_PRINTING,
  SHOWNOTE_ON_BILLPRINT,
  SHOW_COVERSON_KOT,
  ALLOW_DISCOUNT_BEFORE_BILLSAVE,
  CLEARSTOREDATA_ON_LOGOUT,
  ROUNDOFF_UPTO_DECIMAL,
  SHOW_ITEMIMAGE,
  DEFAULT_PAYMENT_MODE,
  ALLOW_CUSTOMEREDIT,
  DEFAULT_PRINTOLDKOT_CHECK,
  DEFAULT_CANCELPRINTOLDKOT_CHECK,
  SHOW_CUSTOMERGST_ON_BILL_CHECK,
  CUSTOM_BILLNO_TITLE,
  ASK_PAYMODE_ON_SAVEBILL,
  SHOW_CUSTOMERAMTPAID_ONBILL,
  SHOW_FASTSETTLE_BUTTON,
  NEXT_RESET_DATE,
  TABLESTATUS_TAGON_KOT,
  ASKFOR_WAITER_BEFOREORDER,
  SHOW_WAITER_ONKOT,
  SHOW_WAITER_ONBILL,
  SHOW_CHARGESTAX_ONBILL,
  SHOW_DATEANDTIME_ONBILL,
  MASK_ORDERID,
  SHOW_KOTNOS_ONTABLE,
  SHOW_USERNAMEON_BILL,
  ALLOW_PREORDER,
  SHOW_CAPTAIN_ON_BILL,
  USE_SEPERATE_VIEWS,
  SHOW_ITEMHSNCODE_ON_BILL,
  DEFAULT_OPENITEM_TITLE,
  SHOW_PREORDER_DATE_FILTER,
  SHOW_CUSTOM_BILL_NUMBER,
  SHOW_SENDPAY_LINK_BUTTON,
  SHOW_BILL_PRINT_COUNT_ONRECEIPT,
  SHOW_INVOICE_QR_ONBILL,
  SHOW_BILLINGTYPE_ONKOT,
  SHOW_KOTITEMS_BYCATEGORY,
  SHOW_CUSTOM_QRS_ONBILL,
  USE_NEWPAYMENT_WINDOW,
  SHOW_ZATCA_INVOICEQR,
  ASKFOR_CUSTOM_QUICKORDERTYPE,
  SHOW_DISCOUNTREASON_ONBILL,
  SHOW_DEPARTMENT_TABLE,
  SHOW_VIRTUAL_KEYBOARD,
  PAYMENT_OPTIONS,
  SHOW_PAYMENTS_STRIP,
  ASK_CUSTOM_ORDER_ID,
  PRINT_ALL_IN_ONE_KOT,
  SHOW_CLEAR_SALES_REPORT,
  SEPERATE_BILLING_FOR_OL_ORDER,
  SHOW_BRAND_NAME_ON_BILL,
  SHOW_REMOT_KOT_OPTION,
  MUTE_NOTIFICATION,
  SHOW_PAYMENT_HISTORY_BUTTON,
  AUTO_ACCEPT_REMOTE_KOT,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  HIDE_ITEM_PRICE,
  SHOW_KOT_NUMBER_ON_BILL,
  SHOW_CAPTAIN_ON_KOT,
  MAKE_REASON_MANDATORY,
  SHOW_DIRECT_COMPLETE_BUTTON,
  DEFAULT_TRANSFERPRINTOLDKOT_CHECK,
  HIDE_LOADMENU_BUTTON,
  SHOW_TABLE_NAME_ON,
  SHOW_ORDER_TYPE_ON,
  SHOW_PAYMENT_MODE_ON,
  HIDE_ORDER_TYPE_IN_QUICKBILL,
  CUSTOM_KOTNO_TITLE,
  SHOW_ITEM_CHARGES_SEPERATELY,
  SHOW_CATEGORYWISE_ITEM_REPORT,
  SHOW_TERMINAL_USER_ON_KOT,
  SHOW_COVERS_ON_BILL,
  POSYTUDE_PORT,
  SET_CLOSEDAY_ENTERED_AMOUNT,
  SHOW_ONLINEORDER_OTP_ON_KOT,
  SHOW_COMPACT_ITEM_VIEW,
  PRINT_KD_WISE_FOR_OL_ORDER,
  PRINT_CATRGORY_WISE_KOT,
  PRINT_TABLE_WISE_KOT,
  OPEN_CASH_DRAWER_ON_SAVE_BILL,
  OPEN_CASH_DRAWER_ON_SAVE_AND_PRINT_BILL,
  OPEN_CASH_DRAWER_ON_SAVE_AND_SETTLE,
  OPEN_CASH_CRAWER_ON_PRINT_AND_SETTLE,
  OPEN_CASH_DRAWER_ON_PRINT_FROM_RECEIPT_SECTION,
  OPEN_CASH_DRAWER_FOR_ALL,
  OPEN_CASH_DRAWER_ON_PAYMENT_WINDOW,
  DISPLAY_WAITER_NAME_ON_TABLE,
  PRINT_KDWISE_AND_TABLEWISE_KOT_FROM_CSK,
  SHOW_CAPTAIN_NAME_ON_TABLE,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
  PRINT_WIDTH_FOR_CSK_BILL_PRINT,
  PRINT_BOTTOM_MARGIN_FOR_CSK_BILL_PRINT,
} = require('../util/SettingIDs');
const { initAccesslevelsforsettings } = require('./AccesslevelManager');
const { initializei18nforSettingswindowui } = require('./i18nController');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
const {
  updateSettings,
  getPaymentModes,
} = require('../renderer/helper/Settings.helper');
const {
  makeCheckDineinActiveKotRequest,
} = require('../renderer/helper/Kot.helper');

window.settingscriptLoaded = true;

window.isappreloadneed = false;
window.ISTABLEBILL_DETAILS_CHANGED = false;
window.ISITEMS_DETAILSOPTION_CHANGED = false;
let currentHowlerinstance;

function intializeLangugages() {
  forEach(SUPPORTED_LANGUAGES, (language, index) => {
    $('<option>')
      .val(language.value)
      .text(language.title)
      .attr('data-value', index)
      .appendTo('#applanguageSettingselect');
  });
  $('#applanguageSettingselect').val(getLocalStorage('lang'));
}

/**
 * Updates the current setting value
 * @param {*} id
 * @param {*} value
 */
function updateappSettings(id, value) {
  if (id && value && window.ipcRenderer) {
    const data = {
      id,
      value,
    };
    // updateSettings(data);
    window.ipcRenderer.send(UPDATE_SETTNGS, data);
    // window.ipcRenderer.send('pos-settings-updated', {});
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:settingControllerNotifications.SettingUpdated'),
    );
  }
}

/**
 *
 * @param {ID to update} id
 * @param {*} value
 */
function updateSettingsLocally(id, value) {
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    if (
      window.settingsConfig[id - 1] &&
      window.settingsConfig[id - 1].id === Number(id)
    ) {
      window.settingsConfig[id - 1].value = value;
    }
  }
}

function getPaymentPostProcess(paymentModes) {
  if (paymentModes && paymentModes.length) {
    forEach(paymentModes, (payment, _index) => {
      $('<option>')
        .val(payment.payment_mode_name)
        .text(payment.payment_mode_name)
        // .attr("data-value", index)
        .appendTo('#payOption1, #payOption2, #payOption3');
    });
    if (window.settingsConfig && window.settingsConfig.length > 0) {
      window.settingsConfig.forEach((element) => {
        switch (element.id) {
          case PAYMENT_OPTIONS:
            if (element.value) {
              try {
                const paymentOptions = JSON.parse(element.value);
                $('#payOption1').val(paymentOptions.paymentOption1);
                $('#payOption2').val(paymentOptions.paymentOption2);
                $('#payOption3').val(paymentOptions.paymentOption3);
              } catch (error) {
                console.error(error);
              }
            }
            break;

          default:
            break;
        }
      });
    }
  }
}

async function initPayOptions() {
  // window.ipcRenderer.send(GET_PAYMENT_MODES_FOR_STRIP, '');
  const payments = await getPaymentModes();
  getPaymentPostProcess(payments);
}
// get payments reply
window.ipcRenderer.on(GET_PAYMENT_MODES_FOR_STRIP_REPLY, (event, content) => {
  if (content) {
    const paymentModes = JSON.parse(content);
    forEach(paymentModes, (payment, _index) => {
      $('<option>')
        .val(payment.payment_mode_name)
        .text(payment.payment_mode_name)
        // .attr("data-value", index)
        .appendTo('#payOption1, #payOption2, #payOption3');
    });
    if (window.settingsConfig && window.settingsConfig.length > 0) {
      window.settingsConfig.forEach((element) => {
        switch (element.id) {
          case PAYMENT_OPTIONS:
            if (element.value) {
              try {
                const paymentOptions = JSON.parse(element.value);
                $('#payOption1').val(paymentOptions.paymentOption1);
                $('#payOption2').val(paymentOptions.paymentOption2);
                $('#payOption3').val(paymentOptions.paymentOption3);
              } catch (error) {
                console.error(error);
              }
            }
            break;

          default:
            break;
        }
      });
    }
  }
});

// get posytude ports
async function getPorts() {
  const ports = await window.betteripcRenderer.callMain(
    'IPC_EVENT:SERIAL_PORT:GET_PORTS',
    {},
  );
  if (ports) {
    forEach(ports.ports, (port, _index) => {
      $('<option>')
        .val(port.path)
        .text(port.path)
        // .attr("data-value", index)
        .appendTo('#postytudePorts');
    });
    if (window.settingsConfig && window.settingsConfig.length > 0) {
      window.settingsConfig.forEach((element) => {
        switch (element.id) {
          case POSYTUDE_PORT:
            if (element.value) {
              try {
                const posytudeport = JSON.parse(element.value);
                $('#postytudePorts').val(posytudeport.path);
              } catch (error) {
                console.error(error);
              }
            }
            break;
          default:
            break;
        }
      });
    }
  }
}
/**
 * Add's options to combo
 */
function addCustomerinfoonkotoptions() {
  CUSTOMERINFO_OPTIONS.forEach((element, index) => {
    $('<option>')
      .val(element)
      .text(element)
      .attr('data-value', index)
      .appendTo('#customeronkotCombo');
  });
}

function setNextresetdate() {
  if (window.storeDetails.reset_bill_time) {
    $('#nextbillresetsettingId').html(
      window
        .moment(window.storeDetails.reset_bill_time, 'x')
        .format('DD MMM YYYY hh:mm a'),
    );
  } else {
    $('#nextbillresetsettingId').html('');
  }
  if (window.storeDetails.reset_kot_time) {
    $('#nextkotresetsettingId').html(
      window
        .moment(window.storeDetails.reset_kot_time, 'x')
        .format('DD MMM YYYY hh:mm a'),
    );
  } else {
    $('#nextkotresetsettingId').html('');
  }
}

/**
 * Add's the listner to all elements having 'setting-id' data attribute
 */
async function addSettingslistener() {
  $("#settingswindoWrapperid input[type='checkbox'][setting-id]").on(
    'click',
    function () {
      const settingID = $(this).attr('setting-id');
      const status = $(this).is(':checked');
      const ismultivalue = $(this).attr('ismultivalue');
      const postAction = $(this).attr('post-action');
      let value = status ? '1' : '0';

      if (ismultivalue) {
        const values = [];
        $(`#settingswindoWrapperid input[setting-id=${settingID}]`).each(
          (index, element) => {
            values.push($(element).is(':checked') ? 1 : 0);
          },
        );
        $(`#settingswindoWrapperid select[setting-id=${settingID}]`).each(
          (index, element) => {
            values.push($(element).find('option:selected').attr('data-value'));
          },
        );
        if (values.length > 0) {
          value = values.join(',');
        }
      }

      updateappSettings(settingID, value);
      updateSettingsLocally(settingID, value);

      if (postAction) {
        switch (Number(postAction)) {
          case 1:
            window.ISITEMS_DETAILSOPTION_CHANGED = true;
            break;
          case 2:
            window.isappreloadneed = true;
            break;
          case 3:
            window.ISTABLEBILL_DETAILS_CHANGED = true;
            break;
          default:
            break;
        }
      }
    },
  );

  $('#customeronkotCombo').on('change', function () {
    const settingID = $(this).attr('setting-id');
    let value = $(this).attr('datavalue');
    const values = [];
    $(`#settingswindoWrapperid input[setting-id=${settingID}]`).each(
      (index, element) => {
        values.push($(element).is(':checked') ? 1 : 0);
      },
    );

    values.push($(this).find('option:selected').attr('data-value'));
    if (values.length > 0) {
      value = values.join(',');
    }

    updateappSettings(settingID, value);
    updateSettingsLocally(settingID, value);
  });

  $('#selectDbReplicaPath').on('click', async function () {
    const settingID = $(this).attr('setting-id');
    const value = await window.betteripcRenderer.callMain(
      OPEN_DIALOG_FOR_DIRECTORY,
      {},
    );
    updateappSettings(settingID, value);
  });

  // kotrunningtableordertagSettingcheck kotnewtableordertagSettingcheck
  $(
    '#kotrunningtableordertagSettingcheck,#kotnewtableordertagSettingcheck,#kotordertagSettingupdate',
  ).on('click', () => {
    const defaultSettings = {
      showNewordertag: $('#kotnewtableordertagSettingcheck').is(':checked'),
      newOrdertaglabel: $('#kotnewtableordertagSettinginput').val()
        ? $('#kotnewtableordertagSettinginput').val()
        : 'New Order',
      showrunningOrdertag: $('#kotrunningtableordertagSettingcheck').is(
        ':checked',
      ),
      runningOrdertaglabel: $('#kotrunningtableordertagSettinginput').val()
        ? $('#kotrunningtableordertagSettinginput').val()
        : 'Running Order',
    };

    const newOrdertaglabel = $('#kotnewtableordertagSettinginput').val();
    const runningOrdertaglabel = $(
      '#kotrunningtableordertagSettinginput',
    ).val();
    if (newOrdertaglabel) {
      if (newOrdertaglabel.length > 20) {
        window.notifyUser.showMessage(
          'error',
          'New order KOT tag length should be less than 20 characters',
        );
        return;
      }

      if (window.specialCharRegex.test(newOrdertaglabel)) {
        window.notifyUser.showMessage(
          'error',
          'Some special characters are not allowed in new order KOT tag',
        );
        return;
      }
    }

    if (runningOrdertaglabel) {
      if (runningOrdertaglabel.length > 20) {
        window.notifyUser.showMessage(
          'error',
          'Running KOT tag length should be less than 20 characters',
        );
        return;
      }

      if (window.specialCharRegex.test(runningOrdertaglabel)) {
        window.notifyUser.showMessage(
          'error',
          'Some special characters are not allowed in Running KOT tag ',
        );
        return;
      }
    }
    updateappSettings(TABLESTATUS_TAGON_KOT, JSON.stringify(defaultSettings));
    updateSettingsLocally(
      TABLESTATUS_TAGON_KOT,
      JSON.stringify(defaultSettings),
    );
  });
  $('#applanguageSettingselect').on('change', function () {
    setLocalStorage('lang', $(this).val());
    window.betteripcRenderer.callMain(SET_LANGUAGE, {
      selectedLanguage: $(this).val(),
    });
    window.isappreloadneed = true;
  });
}

/**
 * Initializes the settings window
 */
function initSettings() {
  $("input[name='usertheme']:checked").prop('checked', false);
  $("input[name='itemsortBy']:checked").prop('checked', false);
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    window.settingsConfig.forEach((element) => {
      switch (element.id) {
        case APP_THEME:
          $(`input[name='usertheme'][value=${element.value}]`).prop(
            'checked',
            true,
          );
          break;
        case SHOW_BILL_DETAILS_ON_TABLE:
          $('#showbilldetailscheckId').prop('checked', element.value === '1');
          break;
        case SHOW_ITEM_DETAILS:
          $('#showitemdetailscheckId').prop('checked', element.value === '1');
          break;
        case SHOW_ITEMCODE_DETAILS:
          $('#showitemcodedetailscheckId').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_SOLDITEMS_IN_REPORT:
          $('#showitemsinreportCheck').prop('checked', element.value === '1');
          break;
        case SHOW_ITEMNOTE:
          $('#showkotnotecheckId').prop('checked', element.value === '1');
          break;
        case TABLENAME_AS_CUSTOMER_FORTAHD:
          $('#tablenameasCustomercheck').prop('checked', element.value === '1');
          break;
        case DEFAULT_TAB:
          $(`input[name='currentTab'][value=${element.value}]`).prop(
            'checked',
            true,
          );
          break;
        case DEFAULT_QUICKKOT_CHECK:
          $('#quickprintkotCheck').prop('checked', element.value === '1');
          break;
        case DEFAULT_QUICKBILL_CHECK:
          $('#quickprintbillCheck').prop('checked', element.value === '1');
          break;
        case PRINTKOT_ONORDER_ACCEPT:
          $('#printkotonorderacceptCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case PRINTBILL_ONORDER_ACCEPT:
          $('#printbillonorderacceptCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case QUICK_KOTPRINT_LABEL:
          $('#quickkotlabelInputid').val(element.value);
          break;
        case QUICK_BILLPRINT_LABEL:
          $('#quickbilllabelInputid').val(element.value);
          break;
        case DISABLED_TABS:
          if (element.value === 'none') {
            $("input[name='disableTabcheck']").each((index, value) => {
              $(value).prop('checked', false);
            });
          } else {
            const disabledTabs = element.value.split(',');
            if (disabledTabs.length > 0) {
              $("input[name='disableTabcheck']").each((index, value) => {
                $(value).prop(
                  'checked',
                  disabledTabs.includes($(value).attr('value')),
                );
              });
            }
          }
          break;
        case PRINTTOLABEL_WITHKOT:
          $('#printlabelwithkotCombo').val(element.value);
          // $("#printlabelwithkotCheck").prop('checked', element.value == 1);
          break;
        case KDWISE_KOTPRINT:
          $('#printkdwiseCheck').prop('checked', element.value === '1');
          break;
        case SHOW_STORELOGO:
          $('#showlogoCheck').prop('checked', element.value === '1');
          break;
        case SHOW_STORENAME_ONKOT:
          $('#showstorenameCheck').prop('checked', element.value === '1');
          break;
        case AUTO_SYNC:
          $('#switchautoSync').prop('checked', element.value === '1');
          break;
        case SHOW_ORDERSTATE_DETAILS:
          $('#orderstatusontableCheck').prop('checked', element.value === '1');
          break;
        case PULLORDER_ONACCEPT:
          $('#pullorderonacceptCheck').prop('checked', element.value === '1');
          break;
        case SHOW_DEFAULT_PAYMENT:
          $('#showdefaultpayCheck').prop('checked', element.value === '1');
          break;
        case BILL_ROUNDOFF:
          $('#billroundoffCheck').prop('checked', element.value === '1');
          break;
        case SHOW_ORDERID_ON_KOT:
          // $("#showorderidonKOTcheck").prop("checked", element.value == 1);
          if (element.value) {
            try {
              const showOrderIdKotSettings = JSON.parse(element.value);
              $('#showOrderIdOnKOTinOnlineorder').prop(
                'checked',
                showOrderIdKotSettings.onlineOrder,
              );
              $('#showOrderIdOnKOTinquickCheck').prop(
                'checked',
                showOrderIdKotSettings.quick,
              );
            } catch (error) {
              console.error(error);
            }
          }
          break;
        case SHOW_CUSTOMERON_BILL_CHECK:
          $('#showcustomeronbillCheck').prop('checked', element.value === '1');
          break;
        case SHOW_CUSTOMERON_KOT_CHECK:
          if (element.value) {
            try {
              const values = String(element.value).split(',');
              $('#customeronkotDineincheck').prop('checked', values[0] === '1');
              $('#customeronkottacheck').prop('checked', values[1] === '1');
              $('#customeronkotquickcheck').prop('checked', values[2] === '1');
              $('#customeronkotCombo').prop('selectedIndex', values[3]);
            } catch (error) {
              console.error(error);
            }
          }

          break;
        case SHOW_ITEMPREPTIME:
          $('#showitempreptimecheckId').prop('checked', element.value === '1');
          break;
        case SHOW_NEW_OLDKOT_AS_TITLE:
          $('#showoldnewkottitlecheckId').prop(
            'checked',
            element.value === '1',
          );
          break;
        case START_BILLING_BY_SECTION:
          $('#seperatebillingbysecCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case DRAFT_PRINT_STATUS:
          $('#draftbillstatusCheck').prop('checked', element.value === '1');
          break;
        case SORT_ITEMSBY:
          $(`input[name='itemsortBy'][value=${element.value}]`).prop(
            'checked',
            true,
          );
          break;
        case SEND_OTPFOR_ORDER:
          $('#askotpforOrdercheck').prop('checked', element.value === '1');
          break;
        case SEND_OTPFOR_RECEIPT:
          $('#askotpforReceiptcheck').prop('checked', element.value === '1');
          break;
        case DEFAULT_SENDEBILL_CHECK:
          $('#defaultsendebillCheck').prop('checked', element.value === '1');
          break;
        case SHOW_BILLAMOUNT_INWORDS:
          $('#showbillamountinwordsCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case ALLOW_DISCOUNTAFTER_PRINT:
          $('#allowdiscountafterprintCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case ALLOW_CHARGESAFTER_PRINT:
          $('#allowchargesafterprintCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SEND_CUSTOMERDETAILSTODBOY_CHECK:
          $('#sendcustomerdetailstosboyCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_DUEPAYCHECK:
          $('#showduePaymentonbillCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case KOT_PRINT_VIEW:
          {
            let defaultView = element.value;
            try {
              defaultView = Number(defaultView);
            } catch (error) {
              defaultView = 1;
            }
            setTimeout(() => {
              $(
                `#kot-selection-preview-id img[kot-format="${defaultView}"]`,
              ).addClass('selectedFormat');
            }, 3000);
          }
          break;
        case DISABLE_SAVEKOT_BUTTON:
          $('#disablesavekotbuttonCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case DISABLE_SAVEBILL_BUTTON:
          $('#disablesavebillbuttonCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case TABLE_COVERS_REQUIRED:
          // $("#askposcoversCheck").prop("checked", element.value == 1);case CUSTOM_BILLNO_TITLE:
          if (element.value) {
            try {
              const coversSettings = JSON.parse(element.value);
              $('#askforCoversindineCheck').prop(
                'checked',
                coversSettings.dinein,
              );
              $('#askforCoversintakeawayCheck').prop(
                'checked',
                coversSettings.takeaway,
              );
              $('#askforCoversinquickCheck').prop(
                'checked',
                coversSettings.quick,
              );
            } catch (error) {
              console.error(error);
            }
          }

          break;
        case CAPTAIN_COVERS_REQUIRED:
          $('#askcaptaincoversCheck').prop('checked', element.value === '1');
          break;
        case DISPLAYTIME_ON_TABLES:
          $('#displaytimeontableCheck').prop('checked', element.value === '1');
          break;
        case GROUP_KITCHENPRINTERS:
          $('#groupkitchenPrinterscheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_ORDERID_ONBILL:
          $('#showorderidonbillCheck').prop('checked', element.value === '1');
          break;
        case SHOW_BILLNO_ONBILL:
          $('#showbillnoonbillCheck').prop('checked', element.value === '1');
          break;
        case SHOW_BILLHISTORY_ONREPORT:
          $('#showbillsonreportCheck').prop('checked', element.value === '1');
          break;
        case SHOW_PAYMENTS_ONREPORT:
          $('#showpaymentsonreportCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_SUMMARYSTATS_ONREPORT:
          $('#showsummaryonreportCheck').prop('checked', element.value === '1');
          break;
        case SHOW_CATEGORYWISE_ITEM_REPORT:
          $('#showcategorywiseitemreportCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case ENABLE_TABLEWISE_PRINTING:
          $('#enabletablewiseprintingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOWNOTE_ON_BILLPRINT:
          $('#shownoteonbillCheck').prop('checked', element.value === '1');
          break;
        case SHOW_COVERSON_KOT:
          $('#showcoversonkotCheck').prop('checked', element.value === '1');
          break;
        case ALLOW_DISCOUNT_BEFORE_BILLSAVE:
          $('#allowdiscountbeforesaveCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case CLEARSTOREDATA_ON_LOGOUT:
          $('#hidecleardataonlogoutCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case ROUNDOFF_UPTO_DECIMAL:
          $('#roundoffamountuptoInputid').val(element.value);
          break;
        case SHOW_ITEMIMAGE:
          $('#showitemsimageCheck').prop('checked', element.value === '1');
          break;
        case DEFAULT_PAYMENT_MODE:
          $('#defaultpaymentoptionCombo').val(element.value);
          break;
        case ALLOW_CUSTOMEREDIT:
          {
            let customereditSettings;
            if (element.value) {
              if (element.value.constructor === 'test'.constructor) {
                customereditSettings = JSON.parse(
                  window.settingsConfig[ALLOW_CUSTOMEREDIT - 1].value,
                );
              } else {
                customereditSettings = element.value;
              }
            }
            if (customereditSettings) {
              $('#alloweditcustomerindineCheck').prop(
                'checked',
                customereditSettings.dinein,
              );
              $('#alloweditcustomerintaCheck').prop(
                'checked',
                customereditSettings.takeaway,
              );
              $('#alloweditcustomerinhdCheck').prop(
                'checked',
                customereditSettings.delivery,
              );
              $('#alloweditcustomerinquickCheck').prop(
                'checked',
                customereditSettings.quick,
              );
            }
          }
          break;
        case DEFAULT_PRINTOLDKOT_CHECK:
          $('#defaultprintoldkotCheck').prop('checked', element.value === '1');
          break;
        case DEFAULT_CANCELPRINTOLDKOT_CHECK:
          $('#defaultcancelprintoldkotCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case DEFAULT_TRANSFERPRINTOLDKOT_CHECK:
          $('#defaulttransferprintoldkotCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CUSTOMERGST_ON_BILL_CHECK:
          $('#showcustomergstCheck').prop('checked', element.value === '1');
          break;
        case CUSTOM_BILLNO_TITLE:
          if (element.value) {
            try {
              const custombillSettings = JSON.parse(element.value);
              if (custombillSettings.dinein) {
                $('#customerbilldineinInput').val(custombillSettings.dinein);
              }
              if (custombillSettings.takeaway) {
                $('#customerbilltaInput').val(custombillSettings.takeaway);
              }
              if (custombillSettings.delivery) {
                $('#customerbillhdInput').val(custombillSettings.delivery);
              }
            } catch (error) {
              console.error(error);
            }
          }

          break;
        case ASK_PAYMODE_ON_SAVEBILL:
          $('#askpaymodeonsavebillCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_FASTSETTLE_BUTTON:
          $('#showfastsettlebuttonCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CUSTOMERAMTPAID_ONBILL:
          $('#showcustomerpadiamtCheck').prop('checked', element.value === '1');
          break;
        case ASKFOR_WAITER_BEFOREORDER:
          // $("#askforwaiterveforordersettingCheck").prop("checked", element.value === '1');
          if (element.value) {
            try {
              const waiterSettings = JSON.parse(element.value);
              $('#askforWaiterindineCheck').prop(
                'checked',
                waiterSettings.dinein,
              );
              $('#askforWaiterintakeawayCheck').prop(
                'checked',
                waiterSettings.takeaway,
              );
              $('#askforWaiterinquickCheck').prop(
                'checked',
                waiterSettings.quick,
              );
            } catch (error) {
              console.error(error);
            }
          }

          break;
        case SHOW_WAITER_ONKOT:
          $('#showwaiteronkotsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_WAITER_ONBILL:
          $('#showwaiteronbillsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CHARGESTAX_ONBILL:
          $('#showTaxOnChargeCheck').prop('checked', element.value === '1');
          break;

        case NEXT_RESET_DATE:
          setNextresetdate();
          break;
        case TABLESTATUS_TAGON_KOT:
          {
            let kotordertagSettings;
            if (element.value) {
              if (element.value.constructor === 'test'.constructor) {
                kotordertagSettings = JSON.parse(
                  window.settingsConfig[TABLESTATUS_TAGON_KOT - 1].value,
                );
              } else {
                kotordertagSettings = element.value;
              }
            }
            if (kotordertagSettings) {
              $('#kotnewtableordertagSettingcheck').prop(
                'checked',
                kotordertagSettings.showNewordertag,
              );
              $('#kotrunningtableordertagSettingcheck').prop(
                'checked',
                kotordertagSettings.showrunningOrdertag,
              );
              $('#kotnewtableordertagSettinginput').val(
                kotordertagSettings.newOrdertaglabel,
              );
              $('#kotrunningtableordertagSettinginput').val(
                kotordertagSettings.runningOrdertaglabel,
              );
            }
          }
          break;
        case SHOW_DATEANDTIME_ONBILL:
          $('#showdateonbillsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case MASK_ORDERID:
          $('#maskorderidsettingCheck').prop('checked', element.value === '1');
          break;
        case SHOW_KOTNOS_ONTABLE:
          $('#showtablekotnossettingsCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_USERNAMEON_BILL:
          $('#showusernameonBillsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case USE_SEPERATE_VIEWS:
          $('#useseperateviewSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_ITEMHSNCODE_ON_BILL:
          $('#showitemhsnonBillcheck').prop('checked', element.value === '1');
          break;
        case DEFAULT_OPENITEM_TITLE:
          $('#defaultitemnameInputid').val(element.value || '');
          break;
        case ALLOW_PREORDER:
          $('#allowpreorderSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_PREORDER_DATE_FILTER:
          $('#showpreordertableFiltercheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CUSTOM_BILL_NUMBER:
          $('#showcustombillnumberSettingscheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CAPTAIN_ON_BILL:
          $('#showcaptainonbillsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_SENDPAY_LINK_BUTTON:
          $('#showpaymentlinksettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_BILL_PRINT_COUNT_ONRECEIPT:
          $('#showprintcountinreceiptsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_INVOICE_QR_ONBILL:
          $('#showinvoiceqronbillsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_BILLINGTYPE_ONKOT:
          $('#showkottypeonkotprintsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_KOTITEMS_BYCATEGORY:
          $('#groupkotitemsbyCatonprintettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CUSTOM_QRS_ONBILL:
          $('#showcustomqronprintettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case USE_NEWPAYMENT_WINDOW:
          $('#usenewpaywindowsettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_ZATCA_INVOICEQR:
          $('#showzatcainvoiceqrSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case ASKFOR_CUSTOM_QUICKORDERTYPE:
          $('#askcustomQuickordertypeSettingscheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_DISCOUNTREASON_ONBILL:
          $('#showdiscreasononbillSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SHOW_DEPARTMENT_TABLE:
          $('#showtableDepartmentSettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_VIRTUAL_KEYBOARD:
          $('#showvirtualkeyboardSettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SHOW_PAYMENTS_STRIP:
          $('#showPaymentOptionsStrip').prop('checked', element.value === '1');
          break;

        case PAYMENT_OPTIONS:
          if (element.value) {
            try {
              const paymentOptions = JSON.parse(element.value);
              $('#payOption1').val(paymentOptions.paymentOption1);
              $('#payOption2').val(paymentOptions.paymentOption2);
              $('#payOption3').val(paymentOptions.paymentOption3);
            } catch (error) {
              console.error(error);
            }
          }
          break;

        case ASK_CUSTOM_ORDER_ID:
          $('#askcustomQuickorderIdSettingscheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case PRINT_ALL_IN_ONE_KOT:
          $('#printallinonekot').prop('checked', element.value === '1');
          break;

        case SHOW_CLEAR_SALES_REPORT:
          $('#clearSalesReportonlogoutCheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SEPERATE_BILLING_FOR_OL_ORDER:
          $('#seperateBillForOnlineOrder').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SHOW_BRAND_NAME_ON_BILL:
          $('#showBrandNameOnBill').prop('checked', element.value === '1');
          break;

        case SHOW_REMOT_KOT_OPTION:
          $('#showRemotKotOption').prop('checked', element.value === '1');
          break;

        case MUTE_NOTIFICATION:
          $('#muteNotification').prop('checked', element.value === '1');
          break;

        case SHOW_PAYMENT_HISTORY_BUTTON:
          $('#showPayHistoryButton').prop('checked', element.value === '1');
          break;

        case AUTO_ACCEPT_REMOTE_KOT:
          $('#autoAcceptRemoteKot').prop('checked', element.value === '1');
          break;

        case COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY:
          $('#countMidnightSale').prop('checked', element.value === '1');
          break;

        case HIDE_ITEM_PRICE:
          $('#hideItemPrice').prop('checked', element.value === '1');
          break;

        case SHOW_KOT_NUMBER_ON_BILL:
          // $('#showkotNumberSettingcheck').prop(
          //   'checked',
          //   element.value === '1',
          // );
          break;

        case SHOW_CAPTAIN_ON_KOT:
          $('#showcaptainuserSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SHOW_TERMINAL_USER_ON_KOT:
          $('#showterminaluserSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SHOW_ITEM_CHARGES_SEPERATELY:
          $('#showitemchargesSeperateSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case MAKE_REASON_MANDATORY:
          $('#reasonMandatoryInOldKot').prop('checked', element.value === '1');
          break;

        case SHOW_DIRECT_COMPLETE_BUTTON:
          $('#directCompleteOrderButton').prop(
            'checked',
            element.value === '1',
          );
          break;

        case HIDE_LOADMENU_BUTTON:
          $('#hideLoadMenuButton').prop('checked', element.value === '1');
          break;

        case SHOW_COVERS_ON_BILL:
          $('#showcoversonbillSettingcheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case SHOW_PAYMENT_MODE_ON:
          if (element.value) {
            try {
              const waiterSettings = JSON.parse(element.value);
              $('#showpaymentmodeindineCheck').prop(
                'checked',
                waiterSettings.dinein,
              );
              $('#showpaymentmodeintakeawayCheck').prop(
                'checked',
                waiterSettings.takeaway,
              );
              $('#showpaymentmodeinquickCheck').prop(
                'checked',
                waiterSettings.quick,
              );
            } catch (error) {
              console.error(error);
            }
          }
          break;

        case SHOW_ORDER_TYPE_ON:
          if (element.value) {
            try {
              const waiterSettings = JSON.parse(element.value);
              $('#showordertypeindineCheck').prop(
                'checked',
                waiterSettings.dinein,
              );
              $('#showordertypeintakeawayCheck').prop(
                'checked',
                waiterSettings.takeaway,
              );
              $('#showordertypeinquickCheck').prop(
                'checked',
                waiterSettings.quick,
              );
            } catch (error) {
              console.error(error);
            }
          }
          break;

        case SHOW_TABLE_NAME_ON:
          if (element.value) {
            try {
              const waiterSettings = JSON.parse(element.value);
              $('#showtablenameindineCheck').prop(
                'checked',
                waiterSettings.dinein,
              );
              $('#showtablenameintakeawayCheck').prop(
                'checked',
                waiterSettings.takeaway,
              );
              $('#showtablenameinquickCheck').prop(
                'checked',
                waiterSettings.quick,
              );
            } catch (error) {
              console.error(error);
            }
          }
          break;

        case HIDE_ORDER_TYPE_IN_QUICKBILL:
          $('#hideOrderTypeOnQuickBillKoTCheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case CUSTOM_KOTNO_TITLE:
          if (element.value) {
            try {
              const customKOTSettings = JSON.parse(element.value);
              if (customKOTSettings.dinein) {
                $('#customKOTdineinInput').val(customKOTSettings.dinein);
              }
              if (customKOTSettings.takeaway) {
                $('#customKOTtaInput').val(customKOTSettings.takeaway);
              }
              if (customKOTSettings.delivery) {
                $('#customKOTDeliveryInput').val(customKOTSettings.delivery);
              }
            } catch (error) {
              console.error(error);
            }
          }
          break;
        case POSYTUDE_PORT:
          if (element.value && element.value !== '0') {
            const portSettings = JSON.parse(element.value);
            $('#baudRateinputid').val(portSettings.baudRate);
            $('#dataBitsinputid').val(portSettings.dataBits);
            $('#stopBitsinputid').val(portSettings.stopBits);
            $('#postytudePorts').val(portSettings.path);
          }
          break;
        case SET_CLOSEDAY_ENTERED_AMOUNT:
          $('#setNextDayOpeningAmount').prop('checked', element.value === '1');
          break;
        case SHOW_ONLINEORDER_OTP_ON_KOT:
          $('#showonlieotponkotsettingid').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_COMPACT_ITEM_VIEW:
          $('#showcompactItemviewSettingCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case PRINT_KD_WISE_FOR_OL_ORDER:
          $('#printkdwisforolOrdereCheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case PRINT_CATRGORY_WISE_KOT:
          $('#printcategorywiseKotCheck').prop(
            'checked',
            element.value === '1',
          );
          break;

        case PRINT_TABLE_WISE_KOT:
          $('#printTablewiseKotCheck').prop('checked', element.value === '1');
          break;

        case OPEN_CASH_DRAWER_ON_SAVE_BILL:
          $('#openCashDrawerOnSaveBillId').prop(
            'checked',
            element.value === '1',
          );
          break;
        case OPEN_CASH_DRAWER_ON_SAVE_AND_PRINT_BILL:
          $('#openCashDrawerOnSaveAndPrintBillId').prop(
            'checked',
            element.value === '1',
          );
          break;
        case OPEN_CASH_DRAWER_ON_SAVE_AND_SETTLE:
          $('#openCashDrawerOnSaveAndSettleBillId').prop(
            'checked',
            element.value === '1',
          );
          break;
        case OPEN_CASH_CRAWER_ON_PRINT_AND_SETTLE:
          $('#openCashDrawerOnPrintAndSettleBillId').prop(
            'checked',
            element.value === '1',
          );
          break;
        case OPEN_CASH_DRAWER_ON_PRINT_FROM_RECEIPT_SECTION:
          $('#openCashDrawerOnPrintBillFromReceiptSectionId').prop(
            'checked',
            element.value === '1',
          );
          break;

        case OPEN_CASH_DRAWER_ON_PAYMENT_WINDOW:
          $('#openCashDrawerOnOpenPaymentWindowId').prop(
            'checked',
            element.value === '1',
          );
          break;

        case OPEN_CASH_DRAWER_FOR_ALL:
          $('#openCashDrawerOnForAllId').prop('checked', element.value === '1');
          break;
        case DISPLAY_WAITER_NAME_ON_TABLE:
          $('#displaywaiternameontableCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case SHOW_CAPTAIN_NAME_ON_TABLE:
          $('#displayCaptainNameontableCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case PRINT_KDWISE_AND_TABLEWISE_KOT_FROM_CSK:
          $('#printKDwiseAndTablewiseKotCheck').prop(
            'checked',
            element.value === '1',
          );
          break;
        case PRINT_WIDTH_FOR_CSK_BILL_PRINT:
          $('#handheldDevicePrintWidthInputid').val(element.value || 0);
          break;
        case PRINT_BOTTOM_MARGIN_FOR_CSK_BILL_PRINT:
          $('#handheldDevicePrintMarginBottomInputid').val(element.value || 0);
          break;
        default:
          break;
      }
    });
  }
  if (
    window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '0' ||
    !window.__IS_MASTER_POS__
  ) {
    setTimeout(() => {
      $('#dayCloseRow').addClass('temrinalExtendCloseDayClass');
      // $('#dayCloseRow').hide();
    }, 500);
  }
}

// function clearNextdates() {
//   $('#nextkotresetsettingId').html('');
//   $('#nextbillresetsettingId').html('');
// }

/**
 * Updates the quick bill and KOT labels
 */
async function updateQuickbilllabels() {
  let quickkotprintLabel = $('#quickkotlabelInputid').val();
  let quickbillprintLabel = $('#quickbilllabelInputid').val();
  if (!quickkotprintLabel) {
    quickkotprintLabel = 'KOT';
  }
  if (!quickbillprintLabel) {
    quickbillprintLabel = 'Bill';
  }

  if (quickkotprintLabel) {
    if (quickkotprintLabel.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'KOT print lable length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(quickkotprintLabel)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in KOT print lable',
      );
      return;
    }
  }

  if (quickbillprintLabel) {
    if (quickkotprintLabel.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Bill print lable length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(quickkotprintLabel)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Bill print lable',
      );
      return;
    }
  }

  updateappSettings(QUICK_KOTPRINT_LABEL, quickkotprintLabel);
  updateSettingsLocally(QUICK_KOTPRINT_LABEL, quickkotprintLabel);

  updateappSettings(QUICK_BILLPRINT_LABEL, quickbillprintLabel);
  updateSettingsLocally(QUICK_BILLPRINT_LABEL, quickbillprintLabel);
}

async function updateCustomerbilltitles() {
  const titlesettings = {
    dinein: 'Bill No',
    takeaway: 'Bill No',
    delivery: 'Bill No',
    quick: 'Bill No',
  };
  if ($('#customerbilldineinInput').val()) {
    Object.assign(titlesettings, {
      dinein: $('#customerbilldineinInput').val(),
    });
  }
  if ($('#customerbilltaInput').val()) {
    Object.assign(titlesettings, { takeaway: $('#customerbilltaInput').val() });
  }
  if ($('#customerbillhdInput').val()) {
    Object.assign(titlesettings, { delivery: $('#customerbillhdInput').val() });
  }

  if (titlesettings.dinein) {
    if (titlesettings.dinein.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Dine-in bill title length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(titlesettings.dinein)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Dine-in bill title',
      );
      return;
    }
  }

  if (titlesettings.takeaway) {
    if (titlesettings.takeaway.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Pickup bill title length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(titlesettings.takeaway)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Pickup bill title',
      );
      return;
    }
  }

  if (titlesettings.delivery) {
    if (titlesettings.delivery.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Delivery bill title length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(titlesettings.delivery)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Delivery bill title',
      );
      return;
    }
  }
  updateappSettings(CUSTOM_BILLNO_TITLE, JSON.stringify(titlesettings));
  updateSettingsLocally(CUSTOM_BILLNO_TITLE, titlesettings);
}

async function updateCustomKOTtitles() {
  const titlesettings = {
    dinein: 'KOT No',
    takeaway: 'KOT No',
    delivery: 'KOT No',
  };
  if ($('#customKOTdineinInput').val()) {
    Object.assign(titlesettings, { dinein: $('#customKOTdineinInput').val() });
  }
  if ($('#customKOTtaInput').val()) {
    Object.assign(titlesettings, { takeaway: $('#customKOTtaInput').val() });
  }
  if ($('#customKOTDeliveryInput').val()) {
    Object.assign(titlesettings, {
      delivery: $('#customKOTDeliveryInput').val(),
    });
  }

  if (titlesettings.dinein) {
    if (titlesettings.dinein.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Dine-in KOT title length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(titlesettings.dinein)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Dine-in KOT title',
      );
      return;
    }
  }

  if (titlesettings.takeaway) {
    if (titlesettings.takeaway.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Pickup KOT title length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(titlesettings.takeaway)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Pickup KOT title',
      );
      return;
    }
  }

  if (titlesettings.delivery) {
    if (titlesettings.delivery.length > 30) {
      window.notifyUser.showMessage(
        'error',
        'Delivery KOT title length should be less than 30 characters',
      );
      return;
    }

    if (window.specialCharRegex.test(titlesettings.delivery)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Delivery KOT title',
      );
      return;
    }
  }
  updateappSettings(CUSTOM_KOTNO_TITLE, JSON.stringify(titlesettings));
  updateSettingsLocally(CUSTOM_KOTNO_TITLE, titlesettings);
}

function updatePaymentOptions() {
  const paymentOption1 = $('#payOption1').val();
  const paymentOption2 = $('#payOption2').val();
  const paymentOption3 = $('#payOption3').val();
  const paymentOption4 = 'Other';

  if (
    paymentOption1 === paymentOption2 ||
    paymentOption2 === paymentOption3 ||
    paymentOption1 === paymentOption3
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:settingControllerNotifications.Seemslikeyouhaveaddedtwosamepaymentmethod',
      ),
    );
    return;
  }

  if (!paymentOption1) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:settingControllerNotifications.Pleaseselectpaymentoptionone',
      ),
    );
    return;
  }
  if (!paymentOption2) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:settingControllerNotifications.Pleaseselectpaymentoptiontwo',
      ),
    );
    return;
  }
  if (!paymentOption3) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:settingControllerNotifications.Pleaseselectpaymentoptionthree',
      ),
    );
    return;
  }
  const value = {
    paymentOption1,
    paymentOption2,
    paymentOption3,
    paymentOption4,
  };
  updateappSettings(PAYMENT_OPTIONS, JSON.stringify(value));
  updateSettingsLocally(PAYMENT_OPTIONS, value);
  window.isappreloadneed = true;
}

async function playnotificationSound(element, type) {
  if (currentHowlerinstance && currentHowlerinstance.playing()) {
    currentHowlerinstance.stop();
    window.Howler.unload(currentHowlerinstance);
    $(element).removeClass();
    $(element).addClass('fas fa-play circular-icon');
    return;
  }
  try {
    const sounds = getNotificationsoundnames();
    let destinationFile;
    switch (type) {
      case 1:
        destinationFile = sounds.SUCCESS.PATH;
        break;
      case 2:
        destinationFile = sounds.CANCEL.PATH;
        break;
      default:
        break;
    }
    if (destinationFile && window.fileSystem.existsSync(destinationFile)) {
      currentHowlerinstance = new window.Howl({
        src: [destinationFile],
        autoplay: false,
        volume: 0.8,
      });

      currentHowlerinstance.on('play', () => {
        $(element).removeClass();
        $(element).addClass('fas fa-stop circular-icon');
      });
      // Fires when the sound finishes playing.
      currentHowlerinstance.on('end', () => {
        $(element).removeClass();
        $(element).addClass('fas fa-play circular-icon');
        window.Howler.unload(currentHowlerinstance);
      });

      currentHowlerinstance.play();
    }
  } catch (error) {
    console.log(error);
  }
}

async function checkifnotificationsoundExists() {
  const sounds = getNotificationsoundnames();
  if (window.fileSystem.existsSync(sounds.SUCCESS.PATH)) {
    $('#selectnotification1id').removeClass();
    $('#selectnotification1id').addClass('normal-button success-button');
    $('#selectnotification1id').html('Selected');
    $('#playsoundID1').show();
  } else {
    $('#playsoundID1').hide();
  }
  if (window.fileSystem.existsSync(sounds.CANCEL.PATH)) {
    $('#selectnotification2id').removeClass();
    $('#selectnotification2id').addClass('normal-button success-button');
    $('#selectnotification2id').html('Selected');
    $('#playsoundID2').show();
  } else {
    $('#playsoundID2').hide();
  }

  // fileSystem
}

async function addNotificationsound(event, type) {
  const selectedFile = event.target.files[0];
  if (!selectedFile) {
    return;
  }
  const filesize = (selectedFile.size / 1024 / 1024).toFixed(4); // MB
  if (filesize > 2) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:settingControllerNotifications.MaxfilesizeistwoMB'),
      0,
    );
    return;
  }

  try {
    const sounds = getNotificationsoundnames();
    let destinationFile;
    switch (type) {
      case 1:
        destinationFile = sounds.SUCCESS.PATH;
        break;
      case 2:
        destinationFile = sounds.CANCEL.PATH;
        break;
      default:
        break;
    }
    if (destinationFile && selectedFile.path) {
      window.fileSystem.copyFile(selectedFile.path, destinationFile, (err) => {
        if (err) throw err;
        window.isappreloadneed = true;
        checkifnotificationsoundExists();
        if (currentHowlerinstance) {
          window.Howler.unload(currentHowlerinstance);
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}

window.reinitSettings = function () {
  initSettings();
  if (window.__IS_MASTER_POS__) {
    window.reloadhotelLogo();
  }
  checkifnotificationsoundExists();
};

async function updateExtendDayCloseTime() {
  const time = $('#extendMinutes').val();
  if (!time) {
    window.notifyUser.showMessage('error', 'Please select time');
    return;
  }
  const showExtendTime = getDayStatus(
    window.start_day_date,
    window.storeDetails.day_close_time,
  );
  if (showExtendTime && showExtendTime.remainingMinutesFor24h) {
    if (time > showExtendTime.remainingMinutesFor24h) {
      window.notifyUser.showMessage(
        'error',
        `You can extend time upto ${showExtendTime.remainingMinutesFor24h} minutes`,
      );
      return;
    }
  }
  const extendedTime = await window.betteripcRenderer.callMain(
    EXTEND_CLOSE_DAY_TIME,
    {
      closeTimeStr: window.storeDetails.day_close_time,
      extendMinutes: time,
    },
  );

  if (extendedTime) {
    Object.assign(window.storeDetails, {
      day_close_time: extendedTime,
    });

    window.notifyUser.showMessage('success', 'Close time extended');
    $('#extendMinutes').val('0');
    // window.storeDetails.day_close_time = extendedTime;
  }
}

function Initialize() {
  $('#settingsModal').modal('show');
  addCustomerinfoonkotoptions();

  // const useNewprinterconfig = getLocalStorage('USE_NEW_PRINTER_CONFIG');
  const useNewprinterconfig = true;
  if (useNewprinterconfig) {
    $('#printersettingDivid').load('Printer.html');
  } else {
    $('#printersettingDivid').load('PrinterSettings.html');
  }
  $('#profilesettingsDivid').load('Profile.html');

  if (!window.__IS_MASTER_POS__) {
    setTimeout(() => {
      // $('#generalTablink,#generalTab').hide();
      $('#shortcutsTablink,#shortcutsTablink').hide();
      // $('#profileTablink').hide();
      $('#fixdbissueButton').hide();
      $('#updatestoreinfoButton').hide();
      $('#formattingTablink').hide();
      $('#shortcutsTablink').hide();
    }, 100);
  }

  if (window.__IS_MASTER_POS__) {
    $('#settingsTablistid a[href="#generalTab"]').tab('show');
    $('#shortcutsettingsDivid').load('KeyShortcuts.html');
    // $('#profilesettingsDivid').load('Profile.html');
    $('#billformatSettingsid').load('Formatting.html');
  }

  $('input[name="usertheme"]').on('click', function () {
    const value = $(this).attr('value');
    if (value) {
      window.Config.theme = value;
      window.changeTheme();
      updateappSettings(APP_THEME, value);
      updateSettingsLocally(APP_THEME, value);
    }
  });
  $('input[name="itemsortBy"]').on('click', function () {
    const value = $(this).attr('value');
    if (value) {
      updateappSettings(SORT_ITEMSBY, value);
      updateSettingsLocally(SORT_ITEMSBY, value);
      window.isappreloadneed = true;
    }
  });

  $('#updatequickLabelsid').on('click', () => {
    updateQuickbilllabels();
  });

  $('#updateCustomerbilltitleid').on('click', () => {
    updateCustomerbilltitles();
  });

  $('#updateCustomKOTtitleid').on('click', () => {
    updateCustomKOTtitles();
  });

  // update payment options
  $('#updatePaymentOptions').on('click', () => {
    updatePaymentOptions();
  });

  $('input[name="currentTab"]').on('click', function () {
    const value = $(this).attr('value');
    if (value) {
      updateappSettings(DEFAULT_TAB, value);
      updateSettingsLocally(DEFAULT_TAB, value);
    }
  });

  $('input[name="disableTabcheck"]').on('click', async () => {
    const values = [];
    $("input[name='disableTabcheck']:checked").each((index, value) => {
      values.push($(value).attr('value'));
    });
    let value = 'none';
    if (values.length === 0) {
      value = 'none';
    } else {
      value = values.join(',');
    }

    if (value.includes('dineintabId')) {
      const isTableActive = await makeCheckDineinActiveKotRequest();
      if (isTableActive && isTableActive.length) {
        $('#disabledineinIdcheck').prop('checked', false);

        window.notifyUser.showMessage(
          'error',
          'Please settle all running dinein tables',
        );
        return;
      }
    }

    if (value.includes('deliverytabID')) {
      const isTableActive = window.allTableslist.find(
        (table) => table.order_type_flag === 2,
      );
      if (isTableActive) {
        $('#disabledeliveryIdcheck').prop('checked', false);

        window.notifyUser.showMessage(
          'error',
          'Please settle all running delivery tables',
        );
        return;
      }
    }

    if (value.includes('takeawaytabID')) {
      const isTableActive = window.allTableslist.find(
        (table) => table.order_type_flag === 1,
      );
      if (isTableActive) {
        $('#disabletakeawayIdcheck').prop('checked', false);
        window.notifyUser.showMessage(
          'error',
          'Please settle all running pickup tables',
        );
        return;
      }
    }
    if (value) {
      updateappSettings(DISABLED_TABS, value);
      updateSettingsLocally(DISABLED_TABS, value);
    }
    window.isappreloadneed = true;
  });

  $('#showitemdetailscheckId').on('click', function () {
    const status = $(this).is(':checked');
    const value = status ? '1' : '0';
    updateappSettings(SHOW_ITEM_DETAILS, value);
    updateSettingsLocally(SHOW_ITEM_DETAILS, value);
    window.ISITEMS_DETAILSOPTION_CHANGED = true;
  });

  $(
    '#alloweditcustomerindineCheck,#alloweditcustomerintaCheck,#alloweditcustomerinhdCheck,#alloweditcustomerinquickCheck',
  ).on('click', () => {
    const dineinChecked = $('#alloweditcustomerindineCheck').is(':checked');
    const takeawayChecked = $('#alloweditcustomerintaCheck').is(':checked');
    const deliveryChecked = $('#alloweditcustomerinhdCheck').is(':checked');
    const quickChecked = $('#alloweditcustomerinquickCheck').is(':checked');

    const value = {
      dinein: dineinChecked || undefined,
      takeaway: takeawayChecked || undefined,
      delivery: deliveryChecked || undefined,
      quick: quickChecked || undefined,
    };
    updateappSettings(ALLOW_CUSTOMEREDIT, JSON.stringify(value));
    updateSettingsLocally(ALLOW_CUSTOMEREDIT, value);
  });
  $(
    '#askforCoversindineCheck,#askforCoversintakeawayCheck,#askforCoversinhomedCheck,#askforCoversinquickCheck',
  ).on('click', () => {
    const dineinChecked = $('#askforCoversindineCheck').is(':checked');
    const takeawayChecked = $('#askforCoversintakeawayCheck').is(':checked');
    const quickChecked = $('#askforCoversinquickCheck').is(':checked');

    const value = {
      dinein: dineinChecked,
      takeaway: takeawayChecked,
      // delivery: deliveryChecked ? deliveryChecked : undefined,
      quick: quickChecked,
    };
    updateappSettings(TABLE_COVERS_REQUIRED, JSON.stringify(value));
    updateSettingsLocally(TABLE_COVERS_REQUIRED, value);
  });

  // ask for waiter
  $(
    '#askforWaiterindineCheck,#askforWaiterintakeawayCheck, #askforWaiterinquickCheck',
  ).on('click', () => {
    const dineinChecked = $('#askforWaiterindineCheck').is(':checked');
    const takeawayChecked = $('#askforWaiterintakeawayCheck').is(':checked');
    // const deliveryChecked = $("#askforCoversinhomedCheck").is(":checked");
    const quickChecked = $('#askforWaiterinquickCheck').is(':checked');

    const value = {
      dinein: dineinChecked,
      takeaway: takeawayChecked,
      quick: quickChecked,
    };
    updateappSettings(ASKFOR_WAITER_BEFOREORDER, JSON.stringify(value));
    updateSettingsLocally(ASKFOR_WAITER_BEFOREORDER, value);
  });

  // show payment mode on
  $(
    '#showpaymentmodeindineCheck, #showpaymentmodeintakeawayCheck, #showpaymentmodeinquickCheck',
  ).on('click', () => {
    const dineinChecked = $('#showpaymentmodeindineCheck').is(':checked');
    const takeawayChecked = $('#showpaymentmodeintakeawayCheck').is(':checked');
    const quickChecked = $('#showpaymentmodeinquickCheck').is(':checked');

    const value = {
      dinein: dineinChecked,
      takeaway: takeawayChecked,
      quick: quickChecked,
    };
    updateappSettings(SHOW_PAYMENT_MODE_ON, JSON.stringify(value));
    updateSettingsLocally(SHOW_PAYMENT_MODE_ON, value);
  });

  // show order type on
  $(
    '#showordertypeindineCheck, #showordertypeintakeawayCheck, #showordertypeinquickCheck',
  ).on('click', () => {
    const dineinChecked = $('#showordertypeindineCheck').is(':checked');
    const takeawayChecked = $('#showordertypeintakeawayCheck').is(':checked');
    const quickChecked = $('#showordertypeinquickCheck').is(':checked');

    const value = {
      dinein: dineinChecked,
      takeaway: takeawayChecked,
      quick: quickChecked,
    };
    updateappSettings(SHOW_ORDER_TYPE_ON, JSON.stringify(value));
    updateSettingsLocally(SHOW_ORDER_TYPE_ON, value);
  });

  // show table name on
  $(
    '#showtablenameindineCheck, #showtablenameintakeawayCheck, #showtablenameinquickCheck',
  ).on('click', () => {
    const dineinChecked = $('#showtablenameindineCheck').is(':checked');
    const takeawayChecked = $('#showtablenameintakeawayCheck').is(':checked');
    const quickChecked = $('#showtablenameinquickCheck').is(':checked');

    const value = {
      dinein: dineinChecked,
      takeaway: takeawayChecked,
      quick: quickChecked,
    };
    updateappSettings(SHOW_TABLE_NAME_ON, JSON.stringify(value));
    updateSettingsLocally(SHOW_TABLE_NAME_ON, value);
  });

  $('#showOrderIdOnKOTinOnlineorder,#showOrderIdOnKOTinquickCheck').on(
    'click',
    () => {
      const quickChecked = $('#showOrderIdOnKOTinquickCheck').is(':checked');
      const onlineorderChecked = $('#showOrderIdOnKOTinOnlineorder').is(
        ':checked',
      );

      const value = {
        quick: quickChecked,
        onlineOrder: onlineorderChecked,
      };
      updateappSettings(SHOW_ORDERID_ON_KOT, JSON.stringify(value));
      updateSettingsLocally(SHOW_ORDERID_ON_KOT, value);
    },
  );

  $('#printlabelwithkotCombo').on('change', function () {
    updateappSettings(PRINTTOLABEL_WITHKOT, this.value);
    updateSettingsLocally(PRINTTOLABEL_WITHKOT, this.value);
  });

  $('#defaultpaymentoptionCombo').on('change', function () {
    updateappSettings(DEFAULT_PAYMENT_MODE, this.value);
    updateSettingsLocally(DEFAULT_PAYMENT_MODE, this.value);
    window.isappreloadneed = true;
  });

  $('#setBillNumber').on(
    'click',
    debounce(async () => {
      const data = {
        store_id: global.storeDetails.store_id,
      };
      try {
        const axiosResponse = await apiCall.post(
          window.Config.links.getLatestBillNumber,
          data,
          {
            headers: getHeadersformposforrender(),
          },
        );
        const response = axiosResponse.data;
        if (response && response.status === 200 && response.offlineBillNumber) {
          showLoader({
            title: $.i18n.t('Updating bill number'),
            text: $.i18n.t('controller:orderController.pleaseWait'),
          });

          const result = await window.betteripcRenderer.callMain(
            UPDATE_BILL_NUMBER,
            {
              offlineBillNumber: Number(response.offlineBillNumber),
              onlineBillNumber: Number(response.onlineBillNumber),
              barBillNumber: Number(response.barBillNumber),
            },
          );
          if (result) {
            Swal.close();
            window.notifyUser.showMessage(
              'success',
              $.i18n.t(
                'controller:settingControllerNotifications.Billnumberupdated',
              ),
            );
          }
          // }
        } else {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:settingControllerNotifications.Billnumbernotupdated',
            ),
          );
        }
      } catch (error) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:settingControllerNotifications.Billnumbernotupdated',
          ),
        );
      }
    }, 200),
  );

  $('#showitemcodedetailscheckId').on('click', async function () {
    const status = $(this).is(':checked');
    const parentStatus = $('#showitemdetailscheckId').is(':checked');

    const value = status ? '1' : '0';
    if (value && !parentStatus) {
      await Swal.fire({
        title: $.i18n.t('controller:swalDataTranslations.Settings'),
        text: $.i18n.t(
          'controller:swalDataTranslations.Showitemdetailsneedtobechekced',
        ),
        width: '23em',
        confirmButtonText: $.i18n.t('controller:digitalOrderController.OK'),
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        customClass: {
          popup: 'tmbill-swal-pop-up',
        },
      });
      $(this).prop('checked', false);
      return;
    }
    updateappSettings(SHOW_ITEMCODE_DETAILS, value);
    updateSettingsLocally(SHOW_ITEMCODE_DETAILS, value);
    window.ISITEMS_DETAILSOPTION_CHANGED = true;
  });

  window.ipcRenderer.send(GET_SHORTCUTS, '');
  window.ipcRenderer.send('get-system-printers', '');
  getPorts();

  initSettings();

  $('#exportsettingsButton').on('click', () => {
    window.ipcRenderer.send(EXPORT_IMPORT_MSG.EXPORT_SETTINGS, '');
  });

  $('#checkforupdatedButton').on('click', () => {
    window.ipcRenderer.send(CHECK_FOR_UPDATES, '');
  });

  $('#importsettingsButton').on('click', () => {
    // showLoader({ title: 'Settings', text: 'importing settings please wait' });
    window.ipcRenderer.send(EXPORT_IMPORT_MSG.IMPORT_SETTINGS, '');
  });

  $('#showlogoCheck').on('click', function () {
    const status = $(this).is(':checked');
    const value = status ? '1' : '0';
    updateappSettings(SHOW_STORELOGO, value);
    updateSettingsLocally(SHOW_STORELOGO, value);
    window.showhotelLogoonbill = status;
    window.sendLogotoworkerfromRemote();
  });
  $('#roundoffamountuptoInputid').on('blur', function () {
    const { value } = this;
    if (Number(value) % 1 !== 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:settingControllerNotifications.Onlywholenumberisallowled',
        ),
        0,
      );
      return;
    }
    if (Number(value) === 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:settingControllerNotifications.Zeroisnotallowled'),
        0,
      );
      return;
    }
    if (Number(value) > 5) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:settingControllerNotifications.Valueshouldbelessthanfive',
        ),
        0,
      );
      return;
    }
    if (
      value &&
      !Number.isNaN(value) &&
      Number(value) <= 5 &&
      Number(value) >= 0
    ) {
      updateappSettings(ROUNDOFF_UPTO_DECIMAL, value);
      updateSettingsLocally(ROUNDOFF_UPTO_DECIMAL, value);
    } else {
      $('#roundoffamountuptoInputid').val(
        window.settingsConfig[ROUNDOFF_UPTO_DECIMAL - 1].value,
      );
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:settingControllerNotifications.Maxlimitisfive'),
        0,
      );
    }
  });

  initPayOptions();
  addSettingslistener();

  $('#hiddennotificationImport1').on('change', (event) => {
    addNotificationsound(event, 1);
  });
  $('#hiddennotificationImport2').on('change', (event) => {
    addNotificationsound(event, 2);
  });

  $('#selectnotification1id').on('click', () => {
    $('#hiddennotificationImport1').trigger('click');
  });
  $('#selectnotification2id').on('click', () => {
    $('#hiddennotificationImport2').trigger('click');
  });

  $('#playsoundID1').on('click', function () {
    playnotificationSound(this, 1);
  });
  $('#playsoundID2').on('click', function () {
    playnotificationSound(this, 2);
  });

  $('#handheldDevicePrintWidthInputid').on(
    'change',
    debounce(function () {
      const value = $(this).val();
      const settingID = $(this).attr('setting-id');
      const data = {
        id: settingID,
        value,
      };
      // updateSettings(data);
      window.ipcRenderer.send(UPDATE_SETTNGS, data);
      updateSettingsLocally(settingID, value);
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:settingControllerNotifications.SettingUpdated'),
      );
    }, 100),
  );

  $('#handheldDevicePrintMarginBottomInputid').on(
    'change',
    debounce(function () {
      const value = $(this).val();
      const settingID = $(this).attr('setting-id');
      const data = {
        id: settingID,
        value,
      };
      // updateSettings(data);
      window.ipcRenderer.send(UPDATE_SETTNGS, data);
      updateSettingsLocally(settingID, value);
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:settingControllerNotifications.SettingUpdated'),
      );
    }, 100),
  );

  $('#defaultitemnameInputid').on(
    'change',
    debounce(function () {
      const value = $(this).val();
      const settingID = $(this).attr('setting-id');
      const data = {
        id: settingID,
        value,
      };
      if (value) {
        if (value.length > 50) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:settingControllerNotifications.Defaultopenitemnamelengthshouldbelessthanthirtycharacters',
            ),
          );
          return;
        }

        if (window.specialCharRegex.test(value)) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:settingControllerNotifications.SomespecialcharactersarenotallowedinDefaultopenitemname',
            ),
          );
          return;
        }
      }
      // updateSettings(data);
      window.ipcRenderer.send(UPDATE_SETTNGS, data);
      updateSettingsLocally(settingID, value);
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:settingControllerNotifications.SettingUpdated'),
      );
    }, 100),
  );

  // getPorts();
  $('#updatePosytudeportbuttonid').on('click', () => {
    const baudRate = $('#baudRateinputid').val();
    const dataBits = $('#dataBitsinputid').val();
    const stopBits = $('#stopBitsinputid').val();
    const path = $('#postytudePorts').val();

    if (!path) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:settingControllerNotifications.Pleaseselectport'),
      );
      return;
    }

    if (!baudRate) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:settingControllerNotifications.PleaseenterbaudRate',
        ),
      );
      return;
    }

    if (!dataBits) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:settingControllerNotifications.PleaseenterdataBits',
        ),
      );
      return;
    }

    if (!stopBits) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:settingControllerNotifications.PleaseenterstopBits',
        ),
      );
      return;
    }

    let value = {
      path,
      baudRate: Number(baudRate),
      dataBits: Number(dataBits),
      parity: 'mark',
      stopBits: Number(stopBits),
    };
    value = JSON.stringify(value);
    updateappSettings(POSYTUDE_PORT, value);
    updateSettingsLocally(POSYTUDE_PORT, value);
    if (value) {
      window.betteripcRenderer.callMain(
        'IPC_EVENT:SERIAL_PORT:INIT_SERIALPORT',
        {},
      );
    }
    // window.isappreloadneed = true;
  });

  checkifnotificationsoundExists();
  initAccesslevelsforsettings();
  intializeLangugages();
  if ($.i18n) {
    initializei18nforSettingswindowui();
  } else {
    setTimeout(initializei18nforSettingswindowui, 400);
  }

  $('#settingsModal').on('hidden.bs.modal', () => {
    window.ipcRenderer.send('pos-settings-updated', {});
  });
  $('#settingsModal').on('shown.bs.modal', () => {
    // if (window.showExtendTimeOption) {
    //   $('#dayCloseRow').show();
    // }
    if (
      window.settingsConfig &&
      window.settingsConfig.length > 0 &&
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1'
    ) {
      const showExtendTime = getDayStatus(
        window.start_day_date,
        window.storeDetails.day_close_time,
      );
      if (showExtendTime.isDayClosed && !showExtendTime.twentyFourHoursPassed) {
        $('#dayCloseRow').show();
      }
    }
  });

  $('#updateExtendDayCloseTimeBtn').on('click', function () {
    updateExtendDayCloseTime();
  });
}

function getDayStatus(start_day_date, day_close_time) {
  const now = new Date();
  const startDate = new Date(start_day_date);

  const [hh, mm, ss] = day_close_time.split(':').map(Number);

  // Build close date
  const closeDate = new Date(startDate);
  closeDate.setHours(hh, mm, ss || 0, 0);

  // If close time is before or equal to start → next day
  if (closeDate <= startDate) {
    closeDate.setDate(closeDate.getDate() + 1);
  }

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  /* -----------------------------
     Status checks
     ----------------------------- */
  const elapsedMs = now.getTime() - startDate.getTime();

  const isDayClosed = now >= closeDate;
  const twentyFourHoursPassed = elapsedMs >= TWENTY_FOUR_HOURS_MS;

  /* -----------------------------
     Remaining minutes for 24h
     ----------------------------- */
  const remainingMsFor24h = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsedMs);

  const remainingMinutesFor24h = Math.ceil(remainingMsFor24h / (60 * 1000));

  let shouldShowExtendTime = false;
  if (isDayClosed) shouldShowExtendTime = true;
  if (twentyFourHoursPassed) shouldShowExtendTime = false;

  return {
    closingTimestamp: closeDate.getTime(),
    isDayClosed,
    twentyFourHoursPassed,
    remainingMinutesFor24h,
    shouldShowExtendTime,
  };
}

Initialize();
