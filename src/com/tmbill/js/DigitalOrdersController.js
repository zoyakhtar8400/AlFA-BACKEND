/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-undef */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
window.digitalOrderswindowloaded = true;
const { forEach, debounce, sumBy } = require('lodash');
const { HttpStatusCode, default: axios, options } = require('axios');
const { default: Swal } = require('sweetalert2');
const { safeParse, addPadding } = require('../util/RendererUtils');
const { sleep } = require('../util/MiscUtil');
const { showLoader } = require('./CommonUtils');
const { PRINTER_SIZES_REFID } = require('../util/PrintersUtil');
const { sendBillsettledevent } = require('./ClientrequestHandler');
const { loadProgressbar } = require('./Stepprogress-bar');
const {
  ACCEPT_BUTTON,
  REJECT_BUTTON,
  DISPATCH_BUTTON,
  FOOD_READY_BUTTON,
  ORDER_COMPLETE_BUTTON,
  ORDER_DETAILS_BUTTON,
  LOAD_MORE_ELEMENT_DIGITAL,
  ORDER_PAIDSTATUS,
  RBT_BUTTON,
  PARTIAL_ACCEPT_BUTTON,
  RETURN_BUTTON,
  DIRECT_COMPLETE,
  ORDER_MAC_BUTTON,
  ACCEPT_REFUND_BUTTON,
  REJECT_REFUND_BUTTON,
  SWIGGY_CONTACT_SUPPORT_BUTTON,
} = require('./RawButtons');
const { NO_ORDERSFOUND } = require('../util/SVGElements');
const {
  PULL_DIGITALORDER,
  ORDER_IPC,
  UPDATE_ONLINEDELIVERY_BOY,
  FETCH_KOTBILL_NUMBER,
  PRINTERS_IPC,
  CHECK_IF_ORDER_IS_PULLED,
  UPDATE_ONLINE_ORDER_KDS_KOT_STATUS,
} = require('../util/IPC_Messages');
const {
  ORDERS_NAMESTATE,
  ONLINE_ORDER_NAME_STATES,
  ORDERSTATEFOR_REDUCEINVENTORY,
} = require('../util/OrderStates');
const {
  PRINTBILL_ONORDER_ACCEPT,
  PRINTKOT_ONORDER_ACCEPT,
  PRINTERS,
  SHOW_STORENAME_ONKOT,
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  PULLORDER_ONACCEPT,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  PRINT_ALL_IN_ONE_KOT,
  SEPERATE_BILLING_FOR_OL_ORDER,
  SHOW_ONLINEORDER_OTP_ON_KOT,
  ONLINE_ORDER_CHANGE_TAB_DELAY,
  PRINT_KD_WISE_FOR_OL_ORDER,
  SHOW_DIRECT_COMPLETE_BUTTON,
  SHOW_PREPARATION_TIME,
  ASK_FOR_ONLINE_ORDER_PREP_TIME,
  SHOW_COMPLETE_ONLINE_ORDER_ID,
  SHOW_ADDONS_SEPERATELY_FOR_ONLINE_OREDERS,
  AUTO_OUTOF_STOCK,
  SHOW_ONLINEORDER_OTP_ON_BILL,
} = require('../util/SettingIDs');
const MESSAGES = require('./RawButtons').generateMessages(window.storeDetails);
const {
  REJECT_REASON,
  ONDC_REJECT_REASON,
  ONDC_RETURN_REASON,
  ZOMATO_REJECT_REASON,
  ONDC_REASON_CODES,
  DELIVEROO_REJECT_REASON,
  HUNGERSTATION_REJECT_REASONS,
  KEETA_REJECT_REASON,
  KEETA_REFUND_REJECT_REASON,
  TALABAT_REJECT_REASONS,
  SWIGGY_REJECT_REASON,
} = require('../util/RejectReason');
const {
  initializei18nforDigitalwindowui,
  iinitializei18nforDigitalordersbuttons,
} = require('./i18nController');
const {
  DIGITAL_BILLING_FLAG,
  UPSALE_BILLING_FLAG,
  ONDC_BILLING_FLAG,
  RAFEEQ_BILLING_FLAG,
  PRINTER_ACTION_TYPES,
  DELIVEROO_BILLING_FLAG,
  SMILES_BILLING_FLAG,
  EATEASY_BILLING_FLAG,
  CAREEM_BILLING_FLAG,
  ZOMATO_BILLING_FLAG,
  SWIGGY_BILLING_FLAG,
  MAGICPIN_BILLING_FLAG,
  HUNGERSATATION_BILLING_FLAG,
  NOONFOOD_BILLING_FLAG,
  KEETA_BILLING_FLAG,
  TALABAT_BILLING_FLAG,
  TALABAT_ORDER_TYPES,
} = require('../util/Constants');
const {
  OnlineBillingTypeByName,
  BillingTypes,
  OnlineBillingTypeByNumber,
  OrderState,
  ONLINEPLATFORM_PAYMENTMODES,
  digitalBillingTypeByName,
  ARABIC_BIILING_TYPES_BYNAME,
  OnlineOrderBillingTypesByNumber,
  URBANPIPER_ORDER_TYPES,
  ORDERS_NOT_INCLUDING_TAX,
} = require('../util/DBUtil');
const { apiCall } = require('../services/APIService');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const {
  showCountdown,
  showCountdownForOnlineOrder,
  showCountdownForMACButton,
} = require('./timer');
const { askforriderBodytemp } = require('./ZomatoRBT');
const { GULF_COUNTRIES } = require('./UIutils/MiscUtils');
const {
  autoReduceInventoryRequest,
} = require('../renderer/helper/Inventory.helper');
const {
  makeGetPaymentsAsyncRequest,
} = require('../renderer/helper/Catalog.helper');
const { updateOrderDataRequest } = require('../renderer/helper/Order.helper');
const { ORDER_SOURCE_FOR_PRINT } = require('../constant');
const {
  getPrinterbyordertype,
  getPrinterbykitchendepartment,
  getPrinterbyCategory,
} = require('./Printer/Helper');
const { mapItemstocategory } = require('./UIutils/ItemCategoryMapping');
const {
  renderDeliveryBoysForDigitalOrder,
  searchDeliveryBoy,
} = require('./Modals/DeliveryBoy');
const { sendRewardhistory } = require('./OrderMisc');
const {
  contactSupport,
  showOutOfStockItemsPopup,
  maskCustomerPhone,
} = require('./DigitalOrder/utils');
const { sendPointruleactionifexists } = require('./LoyaltyController');
// require('../services/SSEService');

let ProgressBar;
let currentOffset = 0;
const LABELPRINTER_FOR_ONLINE = [1, 3];
let cachedbillingType;
let tabSwitchDelay = 5;
let bill_number_length = 0;
window.digiScreenloaded = true;
let orderitemTemplate;
const currency =
  window.storeDetails !== undefined && window.storeDetails.currency
    ? window.storeDetails.currency
    : 'Rs ';

let printolOrderKdWise = false;
let showDirectCompleteButton = false;
let partial_accept_order = false;
let allow_cancel_item = false;
let showPreparationtimeCounter = false;
window.isDigitalBillSaveisinprocess = false;
let askForPreparationTime = false;
let showAddonsSeperately = true;
let reduceStock = false;
let isCallCenterEnabled = false;

async function initAutoReduceInventory() {
  await autoReduceInventoryRequest();
}

async function initGetPaymentAsync() {
  const response = await makeGetPaymentsAsyncRequest();
  return response;
}

function Initialize() {
  $('#updatepaystatDigitalorder').hide();
  $('#digitaldeliveryboyCombo').hide();
  $('#digital-states-list-id li i').hide();
  $('#more-digitalfilters-divid').hide();

  $('#updatepaystatDigitalorder').click(
    debounce((e) => {
      updateOrderpayment();
    }, 300),
  );

  $('#canceldigitalorderdunzoTaskbuttonid').click(
    debounce((e) => {
      canceldunzoTask();
    }, 300),
  );

  $('#printdigitalonlinekotButton').click(
    debounce((e) => {
      generateOnlinekot(false);
    }, 300),
  );
  $('#printdigitalonlinebillButton').click(
    debounce((e) => {
      printonelineBill(false);
    }, 300),
  );

  $('#digital-states-list-id li').click(function (e) {
    clearcurrentOrderdetails();

    $('#digitaldeliveryboyCombo').hide();
    $('.orderdetails-dboyinfo-label').hide();
    $('.orderdetails-person-name-div').hide();
    $('.orderdetails-person-phone-div').hide();

    if ($(this).length > 0) {
      $('#digital-states-list-id li i').css('display', 'none');
      const currentItem = $(this).get(0).getAttribute('action-type');
      $(this).find('i').css('display', '');

      if (currentItem == 'running') {
        $('#more-digitalfilters-divid').css('display', '');
      } else {
        $('#more-digitalfilters-divid').css('display', 'none');
      }
    }

    filterListener(this);
  });

  $('#running-digitalfilers-div-id button,#digiplatform-filters-div-id img').on(
    'click',
    function () {
      filterListener(this);
    },
  );

  // orderitemTemplate = $('OrderItem.html').load();   FinalOrderTemplate NewOrderTemplate
  $.get('FinalOrderTemplate.html', (data) => {
    orderitemTemplate = data;
  });
  initializeStep_Progress();
  // Hide delivery section on page load
  $('#digitaldeliveryboyCombo').hide();
  $('.orderdetails-dboyinfo-label').hide();
  $('.orderdetails-person-name-div').hide();
  $('.orderdetails-person-phone-div').hide();

  // $('#digitaldeliveryboyCombo').on('change', () => {
  //   updateOrderdeliveryboydetails();
  // });
  $('#digitaldeliveryboyCombo').on('click', () => {
    // updateOrderdeliveryboydetails();
    $('#digideliveryBoyModal').modal('show');
    renderDeliveryBoysForDigitalOrder();
  });

  $('#applydigiDeliveryBoyButton').on('click', () => {
    // updateOrderdeliveryboydetails();
    updateOrderdeliveryboydetails();
  });

  $('#pulldigitalorderButton').on(
    'click',
    debounce(() => {
      showPullingorder();
    }, 200),
  );

  // addDeliveryboys();

  setTimeout(() => {
    $('#digital-states-list-id li:first').click();
  }, 300);

  $('#digiorderstoreSettingsbuttonid').click((e) => {
    opendigiStoresettings();
  });

  $('#searchdigiDeliveryBoyid').on(
    'keyup',
    debounce(() => {
      searchDeliveryBoy($(`#searchdigiDeliveryBoyid`).val(), true);
    }, 300),
  );
  initializeSearchlisteners();
  if ($.i18n) {
    initializei18nforDigitalwindowui();
  } else {
    setTimeout(initializei18nforDigitalwindowui, 400);
  }

  if (window.showPrintBill) {
    $('#printdigitalonlinebillButton').show();
  } else {
    $('#printdigitalonlinebillButton').hide();
  }

  if (window.showPrintKot) {
    $('#printdigitalonlinekotButton').show();
  } else {
    $('#printdigitalonlinekotButton').hide();
  }

  if (window.settingsConfig[ONLINE_ORDER_CHANGE_TAB_DELAY - 1] !== undefined) {
    tabSwitchDelay =
      window.settingsConfig[ONLINE_ORDER_CHANGE_TAB_DELAY - 1].value;
    tabSwitchDelay = Number(tabSwitchDelay);
  }

  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParse(global.storeDetails.extra_info);
    bill_number_length = Number(extra_info.bill_number_length);
    partial_accept_order = extra_info.partial_order_accept;
    allow_cancel_item = extra_info.allow_cancel_item;
  }

  if (window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1] !== undefined) {
    printolOrderKdWise =
      window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1].value;
  }

  if (window.settingsConfig[SHOW_DIRECT_COMPLETE_BUTTON - 1] !== undefined) {
    showDirectCompleteButton =
      window.settingsConfig[SHOW_DIRECT_COMPLETE_BUTTON - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_PREPARATION_TIME - 1] !== undefined) {
    showPreparationtimeCounter =
      window.settingsConfig[SHOW_PREPARATION_TIME - 1].value === '1';
  }

  if (window.settingsConfig[ASK_FOR_ONLINE_ORDER_PREP_TIME - 1] !== undefined) {
    askForPreparationTime =
      window.settingsConfig[ASK_FOR_ONLINE_ORDER_PREP_TIME - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_COMPLETE_ONLINE_ORDER_ID - 1] !== undefined) {
    showCompleteOrderId =
      window.settingsConfig[SHOW_COMPLETE_ONLINE_ORDER_ID - 1].value === '1';
  }
  if (window.settingsConfig[AUTO_OUTOF_STOCK - 1]) {
    reduceStock = window.settingsConfig[AUTO_OUTOF_STOCK - 1].value === '1';
  }

  if (
    window.settingsConfig[SHOW_ADDONS_SEPERATELY_FOR_ONLINE_OREDERS - 1] !==
    undefined
  ) {
    showAddonsSeperately =
      window.settingsConfig[SHOW_ADDONS_SEPERATELY_FOR_ONLINE_OREDERS - 1]
        .value === '1';
  }

  setTimeout(() => {
    if (GULF_COUNTRIES.includes(window.storeDetails.country)) {
      $('#digitalabatfilterButton').show();
      $('#digiKeetafilterButton').show();
      $('#digicareemfilterButton').show();
      $('#diginoonfoodfilterButton').show();
      $('#digideliveroofilterButton').show();
      $('#digiHungerStationfilterButton').show();
      $('#digiJahezfilterButton').show();
      $('#digirafeeqfilterButton').show();
      $('#digitmbillordersfilterButton').show();
    } else {
      $('#digizomatofilterButton').show();
      $('#digiswiggyfilterButton').show();
      $('#digiONDCfilterButton').show();
      $('#digitmbillfilterButton').show();
      $('#digidunzofilterButton').show();
      $('#digidotpefilterButton').show();
      $('#digimagicpinfilterButton').show();
      $('#diginoonfoodfilterButton').hide();
    }
  }, 100);
}

/**
 * Open store settings window
 */
function opendigiStoresettings() {
  if (window.opendigiStoreScriptloaded) {
    // initAccesslevelsforonlineorderssettings()
    $('#digiordersettingsModal').modal('show');
  } else {
    $('#digisettingsModalBodyid').load(
      'DigiOrderStoreSettings.html',
      async () => {
        // initAccesslevelsforonlineorderssettings()
        $('#digiordersettingsModal').modal('show');
      },
    );
  }
}

function initializeSearchlisteners() {
  $('#digitalordersearchInputid').on('keypress', (e) => {
    if (e.which == 13) {
      searchOrders();
    }
  });
  $('#digitalordersearchButtonid').on(
    'click',
    debounce(() => {
      searchOrders();
    }, 300),
  );

  $('#digitalordersdatefilter').daterangepicker({
    drops: 'down',
    timePicker: true,
    autoUpdateInput: false,
    showDropdowns: true,
    minYear: 1950,
    // startDate: moment(),
    locale: {
      format: 'DD MMMM YYYY',
    },
  });
  $('#digitalordersdatefilter').on(
    'apply.daterangepicker',
    function (ev, picker) {
      $(this).val(
        `${picker.startDate.format('DD MMMM YYYY')} - ${picker.endDate.format(
          'DD MMMM YYYY',
        )}`,
      );
      searchOrders();
    },
  );
}

function searchOrders() {
  const currentFilter = $(`#digital-states-list-id li>i:visible:first`);
  if (currentFilter.length === 0) {
    $(`#digital-states-list-id li>i:first`).click();
  } else {
    $(currentFilter).click();
  }
}

function showPullingorder() {
  Swal.fire({
    title: $.i18n.t('controller:digitalOrderController.pullingOrder'),
    text: $.i18n.t(
      'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
    ),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      sendPullorderrequest();
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });
}

function getSelectedorder() {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0) {
    let order_data = $(selectedBill).attr('order_data');
    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
      }
    }
    return order_data;
  }
}

async function canceldunzoTask() {
  const orderDetails = getSelectedorder();
  if (!orderDetails) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
    return;
  }

  const { value: reason } = await Swal.fire({
    title: $.i18n.t('controller:digitalOrderController.reasonToReject'),
    input: 'text',
    width: '28em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    inputPlaceholder: $.i18n.t(
      'controller:digitalOrderController.selectAReason',
    ),
    showCancelButton: true,
    customClass: {
      popup: 'tmbill-swal-pop-up',
      content: 'tmbill-swal-title-class',
      input: 'tmbill-swal-input2',
    },
  });

  Swal.fire({
    title: $.i18n.t('controller:digitalOrderController.sendingRequest'),
    text: $.i18n.t(
      'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
    ),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });

  try {
    const options = {
      method: 'POST',
      uri: Config.links.cancelDunzotask,
      body: {
        store_id: orderDetails.store_id,
        order_id: orderDetails.order_id,
        reason,
      },
      json: true,
      rejectUnauthorized: false,
    };
    const result = await request(options);
    if (result) {
      if (result.status === 201) {
        window.notifyUser.showMessage('success', result.msg);
      } else if (result.msg) {
        window.notifyUser.showMessage('error', result.msg);
      }
    }
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.somethingWentWrong'),
    );
  }
  Swal.isVisible() && Swal.close();
}

async function sendPullorderrequest() {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0) {
    let order_data = $(selectedBill).attr('order_data');
    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
      }
    }
    if (!order_data) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.invalidDetails'),
      );
      return;
    }
    const { order_state } = order_data;
    if (order_state && String(order_state).toLowerCase() == 'placed') {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.acceptTheOrderFirst'),
      );
      return;
    }

    const items = order_data.tmpos_order_child;
    if (items.constructor == Array && items.length > 0) {
      items.forEach((element) => {
        if (element && element.price == 0 && element.total !== 0) {
          const price = element.total / element.quantity;
          Object.assign(element, { price: price.toFixed(ROUNDOFF_UPTO) });
        }
      });
    }
    if (order_data != undefined && order_data.constructor == Object) {
      pullOrder(order_data);
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}

async function updateOrderpayment() {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0) {
    let order_data = $(selectedBill).attr('order_data');
    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
        return;
      }
    }
    if (order_data) {
      try {
        const paymentsdata = await initGetPaymentAsync();
        let paymentsList;
        if (paymentsdata.payments) {
          paymentsList = paymentsdata.payments;
        }
        if (
          paymentsList &&
          Array.isArray(paymentsList) &&
          paymentsList.length > 0
        ) {
          const options = {};
          paymentsList.forEach((element) => {
            options[element.payment_mode_name] = element.payment_mode_name;
          });
          // Create payment grid HTML
          let paymentHTML = `<div id="digitalPaymentList" class="digital-payment-container">`;

          paymentsList.forEach((pay) => {
            const iconName = String(pay.payment_mode_name).toLowerCase();

            paymentHTML += `
    <div class="digital-payment-card" data-payment="${pay.payment_mode_name}">
        <img src="https://backoffice.tmbill.com/public/images/payment-icons/${iconName}.png"
             onerror="this.src='https://backoffice.tmbill.com/public/images/payment-icons/default.png'"
             class="digital-payment-icon"/>
        <div>${pay.payment_mode_name}</div>
    </div>
  `;
          });

          paymentHTML += `</div>`;

          const result = await Swal.fire({
            title: $.i18n.t(
              'controller:digitalOrderController.selectPaymentMethod',
            ),
            html: paymentHTML,
            showCancelButton: true,
            confirmButtonText: $.i18n.t('controller:digitalOrderController.OK'),
            cancelButtonText: $.i18n.t(
              'controller:digitalOrderController.Cancel',
            ),
            reverseButtons: true,

            customClass: {
              popup: 'digital-payment-swal',
            },
            didOpen: () => {
              let selectedPayment = null;

              $('.digital-payment-card').on('click', function () {
                $('.digital-payment-card').removeClass('selected');
                $(this).addClass('selected');
                selectedPayment = $(this).data('payment');
                $('#digitalPaymentList').attr(
                  'selected-payment',
                  selectedPayment,
                );
              });
            },
            preConfirm: () => {
              const selected = $('#digitalPaymentList').attr(
                'selected-payment',
              );
              if (!selected) {
                Swal.showValidationMessage('Please select a payment method');
              }
              return selected;
            },
          });

          if (result && result.value) {
            Swal.fire({
              title: $.i18n.t(
                'controller:digitalOrderController.updatingOrderStatus',
              ),
              text: $.i18n.t(
                'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
              ),
              showConfirmButton: false,
              width: '23em',
              allowOutsideClick: false,
              allowEscapeKey: false,
              showLoaderOnConfirm: true,
              didOpen: () => {
                Swal.showLoading();
                sendUpdatepaymentrequest({
                  pay_mode: result.value,
                  order_id: order_data.order_id,
                });
              },
              customClass: {
                popup: 'tmbill-swal-pop-up',
              },
            });
          }
        } else {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:digitalOrderController.noPaymentMethodsFound'),
          );
        }
      } catch (error) {}
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}

async function sendUpdatepaymentrequest({ pay_mode, order_id }) {
  try {
    const options = {
      method: 'PUT',
      uri: Config.links.updatedigitalPaymode,
      body: { pay_mode, order_id },
      json: true,
      rejectUnauthorized: false,
    };
    const result = await request(options);
    if (result) {
      if (result.status === 200) {
        window.notifyUser.showMessage('success', result.msg);
        const selectedBill = $(
          '#digitalorderslistID li.selected-order button.order-details',
        );
        if (selectedBill.length > 0) {
          let order_data = $(selectedBill).attr('order_data');
          order_data = safeParse(order_data);
          if (order_data && order_data.tmpos_order_payment) {
            Object.assign(order_data.tmpos_order_payment[0], {
              payment_option: pay_mode,
            });
            $(selectedBill).attr('order_data', JSON.stringify(order_data));
            $('#digitalorderslistID li.selected-order')
              .find('#list-order-item-amount-label-id')
              .html(`${order_data.order_total} (${pay_mode})`);
          }
        }
        updateOrderDataRequest({
          order_id,
          updatePayment: pay_mode,
        });
        window.betteripcRenderer.callMain(
          ORDER_IPC.UPDATE_DIGITAL_ORDER_PAYMENT,
          {
            order_id,
            updatePayment: pay_mode,
          },
        );
        window.refreshDashboard = true;
      } else if (result.msg) {
        window.notifyUser.showMessage('error', result.msg);
      }
    }
  } catch (error) {
    console.log(error);
  }
}
/**
 *  Prints the bill
 * @param {*} silentPrint
 */
async function printonelineBill(silentPrint, orderData) {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );

  if (selectedBill.length > 0 || orderData) {
    let order_data;
    if (orderData) {
      order_data = orderData;
    } else {
      order_data = $(selectedBill).attr('order_data');
    }

    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
      }
    }

    if (!order_data) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
      );
      return;
    }
    const { order_state } = order_data;
    if (
      !silentPrint &&
      order_state &&
      String(order_state).toLowerCase() === 'placed'
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.acceptTheOrderFirst'),
      );
      return;
    }

    const items = [];
    if (order_data !== undefined && order_data.constructor === Object) {
      let bill_number;
      const customDate = $('#digitalorderslistID li.selected-order')
        .find('#list-order-item-date-label-id')
        .html();

      if (
        order_data.tmpos_order_child != undefined &&
        order_data.tmpos_order_child.length > 0
      ) {
        bill_number = order_data.order_id;
        const istax_dividable = 0;
        const taxName = window.currentTaxname;

        // Get bill number
        let savedBillnumber = await window.betteripcRenderer.callMain(
          ORDER_IPC.GET_BILL_NUMBER,
          { order_id: bill_number },
        );

        if (bill_number_length && savedBillnumber) {
          savedBillnumber = addPadding(savedBillnumber, bill_number_length);
        }
        let bogoOfferName = null;
        let bogoOfferPercent = null;
        order_data.tmpos_order_child.forEach((element) => {
          const tempItem = { ...element };
          if (
            element.extra_details &&
            element.extra_details.get_y_items &&
            element.extra_details.get_y_items.length > 0
          ) {
            const offer = element.extra_details.get_y_items[0];

            if (offer.offer_name) {
              bogoOfferName = offer.offer_name;
            }

            if (offer.perct_off) {
              bogoOfferPercent = parseFloat(offer.perct_off);
            }
          }
          if (
            tempItem &&
            tempItem.extra_details &&
            tempItem.extra_details.alternative_title
          ) {
            Object.assign(tempItem, {
              alternative_title: tempItem.extra_details.alternative_title,
            });
          }
          tempItem.item_price = element.price;
          tempItem.title = element.title;
          tempItem.amount = element.total;
          tempItem.quantity = element.quantity;
          if (
            showAddonsSeperately &&
            element.order_child_options &&
            element.order_child_options.length
          ) {
            tempItem.addons = element.order_child_options;
            tempItem.addons.forEach((addon) => {
              if (
                addon &&
                addon.extra_details &&
                addon.extra_details.alternative_title
              ) {
                Object.assign(addon, {
                  alternative_title: addon.extra_details.alternative_title,
                });
              }
            });
          }
          if (!showAddonsSeperately) {
            delete tempItem.extra_details;
          }
          let { discount } = tempItem;
          if (discount) {
            tempItem.isOnlineOrderBill = true;
          }
          if (tempItem.discount && tempItem.discount_type == 1) {
            discount =
              (tempItem.price * tempItem.quantity * tempItem.discount) / 100;
            if (discount) {
              tempItem.discount = discount;
            }
          }

          if (element.price == 0) {
            tempItem.item_price = '-';
          } else {
            tempItem.item_price = element.price;
          }

          let posItem = window.allItemsList.find(
            (o) => Number(o.item_refid) === Number(element.item_id),
          );
          if (!posItem && window.platformCatalogueitems) {
            posItem = window.platformCatalogueitems.find(
              (o) => Number(o.item_id) === Number(element.item_id),
            );
          }
          if (posItem && !element.product_group_id) {
            Object.assign(tempItem, {
              product_group_id: posItem.product_group_id,
            });
          }
          if (
            posItem &&
            posItem.product_group_name &&
            !element.product_group_name
          ) {
            Object.assign(tempItem, {
              product_group_name: posItem.product_group_name,
            });
          }

          const product_group = window.globalproductGroups.find(
            (e) => e.id === tempItem.product_group_id,
          );
          if (product_group && product_group.product_group_name) {
            tempItem.product_group_name = product_group.product_group_name;
          }
          Object.assign(tempItem, {
            item_tax_per: element.tax_per,
            item_tax_value: element.tax_value,
            item_tax_method: element.tax_method,
            item_is_devidable: element.is_devidable,
            tax_name: element.tax_name,
          });

          if (
            element.order_child_charges &&
            element.order_child_charges.length
          ) {
            const itemlevelCharges = [];
            for (const currentCharge of element.order_child_charges) {
              let chargeAmount = currentCharge.charge_amount;

              // for zomato order order level charges coming on item level
              // and on item getting charges of all qty but we expect charge of one qty
              if (
                order_data.billing_type !== 8 &&
                order_data.billing_type !== 5 &&
                currentCharge.per_fixed === 0
              ) {
                chargeAmount /= element.quantity;
              }

              itemlevelCharges.push({
                title: currentCharge.charge_title,
                per_or_fixed: currentCharge.per_fixed,
                calculated_charge: currentCharge.calculated_charge,
                calculated_tax: currentCharge.calculated_tax,
                amount: chargeAmount,
                // amount: currentCharge.calculated_charge,
                calculate_tax_for_item_charges:
                  currentCharge.calculated_tax > 0 ? 1 : 0,
                is_tax_applicable: currentCharge.is_tax_applicable,
                tax_amount: currentCharge.tax_amount,
                is_tax_included: currentCharge.is_tax_included,
              });
            }
            Object.assign(tempItem, {
              itemlevelCharges,
            });
          }

          if (
            element &&
            element.extra_details &&
            element.extra_details.item_note
          ) {
            Object.assign(tempItem, {
              note: element.extra_details.item_note,
            });
          }
          if (
            bogoOfferName &&
            items.length > 0 &&
            Number(tempItem.item_price) <
              Number(items[items.length - 1].item_price)
          ) {
            tempItem.discount_name = bogoOfferName;
            tempItem.discount_rate = bogoOfferPercent;
            tempItem.discount_type = 1;
          }
          items.push(tempItem);
        });

        const deliveryBy = undefined;
        let payMode = '';
        if (
          order_data.tmpos_order_payment != undefined &&
          order_data.tmpos_order_payment.length > 0
        ) {
          if (order_data.tmpos_order_payment.length > 1) {
            payMode = 'Split';
          } else if (
            order_data.tmpos_order_payment[0] != undefined &&
            order_data.tmpos_order_payment[0].payment_option != undefined
          ) {
            payMode = order_data.tmpos_order_payment[0].payment_option;
          }
        }

        let customer;
        const showotponBill = '';
        if (order_data.phone) {
          customer = {
            name: order_data.cust_name,
            phone: order_data.phone,
          };

          // Keep existing manual address logic
          if (order_data.line_1) {
            customer.address_line1 = order_data.line_1;
          }

          if (order_data.line_2) {
            customer.address_line2 = order_data.line_2;
          }

          // 🔹 Support new structured address (safe for old orders)
          if (order_data.extra_details && order_data.extra_details.address) {
            const addr = order_data.extra_details.address;

            if (addr.area) customer.area = addr.area;
            if (addr.block) customer.block = addr.block;
            if (addr.street) customer.street = addr.street;
            if (addr.lane) customer.lane = addr.lane;
            if (addr.building) customer.building = addr.building;
            if (addr.flat) customer.flat = addr.flat;
            if (addr.floor) customer.floor = addr.floor;
            if (addr.pincode) customer.pincode = addr.pincode;
            if (addr.landmark) customer.landmark = addr.landmark;
            if (addr.label) customer.label = addr.label;
          }

          // Keep existing segment logic
          if (order_data.extra_details && order_data.extra_details.segments) {
            customer.segments = order_data.extra_details.segments;
          }
        }
        let extdeliveryBoy;

        if (
          order_data.delivery_boy_name &&
          order_data.delivery_boy_phone &&
          order_data.delivery_boy_phone !== '0'
        ) {
          extdeliveryBoy = {};
          extdeliveryBoy.name = order_data.delivery_boy_name;
          extdeliveryBoy.phone = order_data.delivery_boy_phone;
        }
        let tableName = 'Digital Order';
        if (order_data.table_no) {
          tableName += ` Table -${order_data.table_no}`;
        }

        if (order_data.room_no) {
          tableName = order_data.room_no;
        }

        if (
          [...Object.values(OnlineBillingTypeByName)].includes(
            order_data.billing_type,
          )
        ) {
          tableName = String(
            window.orderTypes[Number(order_data.billing_type)].order_type || '',
          ).toLowerCase();
          if (payMode == 'ONLINE') {
            payMode = 'Online Paid';
          }
        }

        if (order_data.billing_type == 104) {
          payMode = 'Online Paid';
        }
        if (
          // order_data.billing_type === 107 &&
          ![
            ZOMATO_BILLING_FLAG,
            SWIGGY_BILLING_FLAG,
            MAGICPIN_BILLING_FLAG,
          ].includes(order_data.billing_type) &&
          order_data.external_order_id &&
          order_data.external_order_id !== '0'
        ) {
          Object.assign(order_data.extra_details, {
            external_order_id: order_data.external_order_id,
          });
        }

        let showOnlineOrderOtpOnBill = false;
        if (
          order_data &&
          order_data.extra_details &&
          order_data.extra_details.otp &&
          window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_BILL - 1] != undefined
        ) {
          showOnlineOrderOtpOnBill =
            window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_BILL - 1].value ==
            '1';
        }

        const previewDetails = {
          bill_number,
          tableName,
          // discount: Number(order_data.order_level_discount.toFixed(2)),
          discount_type: 0,
          tax_name: taxName || window.currentTaxname,
          istax_dividable,
          items,
          discounttoApply:
            order_data.order_level_discount &&
            Number(order_data.order_level_discount.toFixed(ROUNDOFF_UPTO)),
          isOnlinebill: true,
          onlinechargesTotal:
            order_data.order_level_total_charges &&
            Number(order_data.order_level_total_charges.toFixed(ROUNDOFF_UPTO)),
          showCustomerinfo: true,
          payment_mode: payMode,
          onlinetaxesTotal:
            order_data.order_level_total_taxes &&
            Number(order_data.order_level_total_taxes.toFixed(ROUNDOFF_UPTO)),
          customer,
          showotponBill,
          extdeliveryBoy,
          deliveryBy,
          customDate,
          paymentAdded: payMode,
          order_type_flag: order_data.delivery_type,
          coupon: order_data.coupan_code,
          couponDisounttype: order_data.coupan_type,
          couponDisounttotal: order_data.coupan_calculated_amt,
          couponDisount: order_data.coupan_value,
          couponDisountamt: order_data.coupan_value,
          billType: order_data.billing_type,
          extra_details: order_data.extra_details,
          order_note: order_data.instructions || '',
          showOnlineOrderOtpOnBill,
          otp: order_data?.extra_details?.otp || '',
          payment_qr_url: order_data?.extra_details.payment_qr_url,
        };
        if (order_data.order_later_datetime) {
          Object.assign(previewDetails, {
            is_pre_order: true,
            pre_order_datetime: moment(order_data.order_later_datetime)
              .utc()
              .format('DD MMMM YYYY hh:mm A'),
          });
        }

        if (previewDetails.coupon && previewDetails.couponDisount) {
          previewDetails.discount -= previewDetails.couponDisount;
          if (previewDetails.discount < 0) {
            previewDetails.discount = 0;
          }
        }

        if (savedBillnumber) {
          Object.assign(previewDetails, { order_id: savedBillnumber });
        }

        if (
          order_data.tmpos_order_charges &&
          order_data.tmpos_order_charges.length
        ) {
          // charges: order_data.tmpos_order_charges
          const tempCharges = [];
          forEach(order_data.tmpos_order_charges, (charge) => {
            const tempCharge = {
              amount: Number(charge.charge_amount),
              title: charge.title,
              is_tax_included: charge.is_tax_included,
              calculated_tax: charge.calculated_tax,
              per_or_fixed: charge.per_or_fixed,
              billing_flag: 8,
              tax_amount: charge.tax_amount,
              is_tax_applicable: charge.calculated_tax,
              tax_amount: charge.tax_amount,
              is_tax_included: charge.is_tax_included,
              value: charge.value,
            };
            if (!charge.charge_amount) {
              Object.assign(tempCharge, { per_or_fixed: 0 });
            } else {
              Object.assign(tempCharge, {
                amount: Number(charge.charge_amount),
              });
            }
            tempCharges.push(tempCharge);
          });
          Object.assign(previewDetails, { charges: tempCharges });
        }

        if (
          order_data.delivery_boy_name &&
          order_data.delivery_boy_name !== '0'
        ) {
          Object.assign(previewDetails, {
            deliveryboyName: order_data.delivery_boy_name,
          });
        }

        const pageConfig = await setPageconfigifany();
        if (pageConfig && pageConfig.margins) {
          previewDetails.pageConfig = pageConfig;
          pageconfigProvided = true;
        } else {
          pageconfigProvided = false;
        }
        previewDetails.pageConfig = pageConfig;

        let billing_type = order_data.billing_type;
        const app_source = order_data.app_source;
        if (billing_type === 8 && order_data.delivery_type) {
          switch (order_data.delivery_type) {
            case 'dinein':
              billing_type = 1;
              break;
            case 'pickup':
              billing_type = 2;
              break;
            case 'delivery':
              billing_type = 3;
              break;
            default:
              break;
          }
        }
        let getPrinters;
        if (
          window.printersList !== undefined &&
          window.printersList.length >= PRINTERS.DINEIN_BILL
        ) {
          if (app_source && app_source === 'kiosk') {
            getPrinters = await getPrinterbyordertype({
              action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
              app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
              billing_type: String(billing_type),
            });
          } else {
            getPrinters = await getPrinterbyordertype({
              action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
              app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
              billing_type: String(billing_type),
            });
          }
        }
        await window.printBillfromqueue({
          previewDetails,
          billing_type: order_data.billing_type,
          printers: getPrinters,
        });
      }
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}

/**
 * Prints KOT
 * @param {*} silentPrint
 */
async function generateOnlinekot(silentPrint, orderData) {
  // console.log(`Message="Generate Online KOT"`);
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0 || orderData) {
    let order_data;
    if (orderData) {
      order_data = orderData;
    } else {
      order_data = $(selectedBill).attr('order_data');
    }
    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
      }
    }
    // console.log(`Message="Generate Online KOT order data"`, order_data);
    if (!order_data) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.invalidDetails'),
      );
      return;
    }
    const { order_state } = order_data;
    if (
      !silentPrint &&
      order_state &&
      String(order_state).toLowerCase() == 'placed'
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.acceptTheOrderFirst'),
      );
      return;
    }

    // console.log('order_data::', order_data);
    const note = order_data.instructions;
    let { billing_type } = order_data;
    if (billing_type === 8 && order_data.delivery_type) {
      switch (order_data.delivery_type) {
        case 'dinein':
          billing_type = 1;
          break;
        case 'pickup':
          billing_type = 2;
          break;
        case 'delivery':
          billing_type = 3;
          break;
        default:
          break;
      }
    }

    const app_source = order_data.app_source;

    // Get the storename
    // Check if the store name is to be printed
    // on KOT or not
    let showStorenamonkot;
    let printAllInOneKot = false;
    let showOnlineOrderOtpOnKot = false;
    if (window.settingsConfig[SHOW_STORENAME_ONKOT - 1] != undefined) {
      const status =
        window.settingsConfig[SHOW_STORENAME_ONKOT - 1].value == '1';
      if (status) {
        showStorenamonkot = window.storeDetails.store_name;
      }
      if (
        status &&
        order_data &&
        order_data.extra_details &&
        order_data.extra_details.channel_restaurant_name
      ) {
        showStorenamonkot = order_data.extra_details.channel_restaurant_name;
      }
    }

    if (window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1] != undefined) {
      printAllInOneKot =
        window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1].value === '1';
    }
    if (window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1] != undefined) {
      printolOrderKdWise =
        window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1].value === '1';
    }
    if (
      order_data &&
      order_data.extra_details &&
      order_data.extra_details.otp &&
      window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_KOT - 1] != undefined
    ) {
      showOnlineOrderOtpOnKot =
        window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_KOT - 1].value == '1';
    }

    // let tableName = 'Digital Order'
    // let tableName = `Digital order (${order_data?.delivery_type})`;
    let tableName = `${order_data?.delivery_type}`;
    if (order_data.table_no) {
      tableName = order_data.table_no;
    }

    if (
      [...Object.values(OnlineBillingTypeByName)].includes(
        order_data.billing_type,
      )
    ) {
      tableName = `${OnlineBillingTypeByNumber[order_data.billing_type]} Order`;
    }

    const currentItems = [...order_data.tmpos_order_child];
    currentItems.forEach((item) => {
      if (item && item.extra_details && item.extra_details.alternative_title) {
        Object.assign(item, {
          alternative_title: item.extra_details.alternative_title,
        });
      }

      if (item && item.extra_details) {
        item.extra_details.printOnKOTAndBill = {};
      }

      item.amount = item.total;

      if (item && item.item_note) {
        Object.assign(item, {
          note: item.item_note,
        });
      }

      if (item && item.extra_details && item.extra_details.item_note) {
        Object.assign(item, {
          note: item.extra_details.item_note,
        });
      }
      if (
        showAddonsSeperately &&
        item.order_child_options &&
        item.order_child_options.length
      ) {
        item.addons = item.order_child_options;
        item.addons.forEach((addon) => {
          if (
            addon &&
            addon.extra_details &&
            addon.extra_details.alternative_title
          ) {
            Object.assign(addon, {
              alternative_title: addon.extra_details.alternative_title,
            });
          }
        });
      }
    });

    if (
      // order_data.billing_type === 107 &&
      ![
        ZOMATO_BILLING_FLAG,
        SWIGGY_BILLING_FLAG,
        MAGICPIN_BILLING_FLAG,
      ].includes(order_data.billing_type) &&
      order_data.external_order_id &&
      order_data.external_order_id !== '0'
    ) {
      Object.assign(order_data.extra_details, {
        external_order_id: order_data.external_order_id,
      });
    }
    if (currentItems && currentItems.length > 0) {
      if (currentItems && currentItems.length > 0) {
        try {
          const isLabelprinter = false;
          const more_info = {};
          const params = {
            items: currentItems,
            tableName,
            order_id: order_data.order_id,
            // username: `Order ID:${order_data.order_id}`,
            kotNote: note,
            forQuickbill: false,
            isLabelprinter,
            more_info,
            showStorenamonkot,
            showOnlineOrderOtpOnKot,
            billing_type: order_data.billing_type,
            otp: order_data?.extra_details?.otp || '',
            delivery_id: order_data?.dunzo_task_json?.external_order_id || 0,
            isOnlinebill: true,
            extra_details: order_data.extra_details,
            orderTime: order_data.orderDateTime,
            order_type_mode: order_data.delivery_type,
          };

          if (order_data.table_no) {
            Object.assign(params, {
              tableName: `Table:${order_data.table_no}`,
              // username: order_data.order_id
            });
          }

          if (order_data.room_no) {
            Object.assign(params, {
              tableName: order_data.room_no,
            });
          }
          if (order_data.order_later_datetime) {
            Object.assign(params, {
              is_pre_order: true,
              pre_order_datetime: moment(order_data.order_later_datetime)
                .utc()
                .format('DD MMMM YYYY hh:mm A'),
            });
          }
          if (order_data.phone && order_data.cust_name) {
            Object.assign(params, {
              customer: {
                name: order_data.cust_name,
                phone: order_data.phone,
              },
            });

            if (order_data.extra_details && order_data.extra_details.segments) {
              params.customer.segments = order_data.extra_details.segments;
            }
          }
          if (!showAddonsSeperately) {
            currentItems.map((item) => {
              delete item.extra_details;
            });
          }

          if (Number(printolOrderKdWise)) {
            // items mapping for kitchen department
            currentItems.map((item) => {
              let posItem = allItemsList.find(
                (o) => o.item_refid == item.item_id,
              );
              // console.log('posItem:', posItem);
              if (!posItem && window.platformCatalogueitems) {
                posItem = window.platformCatalogueitems.find(
                  (o) => o.item_id == Number(item.item_id),
                );
              }
              // console.log('pos item2:', posItem);
              if (posItem && !item.kitchen_dept) {
                Object.assign(item, { kitchen_dept: posItem.kitchen_dept });
              }
              // console.log(`Message="POS Item"`, posItem);
            });

            // $('#kitchenDepartmentDiv').addClass('kitchendept');
            const filteredList = window.groupItemsbyDepsforremote(currentItems);
            // console.log(`Message="FilteredList"`, filteredList);
            window.addKitchenprinterifnotadded_fromremote();
            // eslint-disable-next-line no-restricted-syntax
            for (const element of window.kitchenDepartments) {
              const groupFilter = _.find(filteredList, [
                'kitchen_dept',
                element.id,
              ]);
              // console.log(`Message="Group filter"`, groupFilter);
              if (groupFilter) {
                // await sleep(1200);
                const data = {
                  items: groupFilter.items,
                  kitchenDepartment:
                    window.kitchenDepartmentsidsmap[element.id],
                  tableName,
                  order_id: order_data.order_id,
                  // username: `Order ID:${order_data.order_id}`,
                  kotNote: note,
                  forQuickbill: false,
                  isLabelprinter,
                  more_info,
                  showStorenamonkot,
                  billing_type: order_data.billing_type,
                  showOnlineOrderOtpOnKot,
                  otp: order_data?.extra_details?.otp || '',
                  isOnlinebill: true,
                  extra_details: order_data.extra_details,
                  orderTime: order_data.orderDateTime,
                };
                if (order_data.room_no) {
                  Object.assign(data, {
                    tableName: order_data.room_no,
                  });
                }

                let getPrinters;
                if (app_source === 'kiosk') {
                  getPrinters = await getPrinterbykitchendepartment({
                    action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                    department_name: element.kitchen_dept_name,
                  });
                } else {
                  getPrinters = await getPrinterbykitchendepartment({
                    action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                    department_name: element.kitchen_dept_name,
                  });
                }

                Object.assign(data, {
                  job_id: window.generateId(10),
                });

                console.log(
                  `[OnlineOrdeer]Message="Printing Kitchen Dept KOT" KitchenDept="${element.kitchen_dept_name}" JobId="${data?.job_id}"`,
                );

                await generateKOTPreview(data, getPrinters);

                if ([1, 2].includes(window.printtoLabelprinter)) {
                  await renderkotViewforLabel(previewDetails);
                }
              }
            }

            if (printAllInOneKot) {
              // $('#kitchenDepartmentDiv').removeClass('kitchendept');
              // await sleep(1200);
              // await generateKOTPreview(params);
              let getPrinters = [];
              const PRINTERNAME = PRINTERS.ONLINE_KOT;
              if (!isLabelprinter) {
                if (app_source === 'kiosk') {
                  getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                  });
                } else {
                  getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                  });
                }
                Object.assign(params, {
                  job_id: window.generateId(10),
                });

                console.log(
                  `[OnlineOrdeer]Message="Printing Kitchen Dept KOT all in one KOT" JobId="${params?.job_id}"`,
                );
                await generateKOTPreview(params, getPrinters);
              }
              if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
                printkottoLabelprinter(params);
              }
            }
          } else if (window.printCategorywiseKot) {
            const PRINTERNAME = PRINTERS.ONLINE_KOT;
            const filteredList = mapItemstocategory(params.items);
            // Now Print KOT by filtering the above filtered
            // list of departments along with their items
            for (const [key, value] of Object.entries(filteredList)) {
              if (value) {
                const content = { ...params };
                content.items = value;
                // await generateKOTPreview(content);

                if (app_source === 'kiosk') {
                  const getPrinters = await getPrinterbyCategory({
                    action_type: PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                    category_name: key,
                  });
                  await generateKOTPreview(content, getPrinters);
                } else {
                  const getPrinters = await getPrinterbyCategory({
                    action_type: PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                    category_name: key,
                  });
                  Object.assign(content, {
                    job_id: window.generateId(10),
                  });

                  console.log(
                    `[OnlineOrdeer]Message="Printing CategoryWise KOT" CategoryName="${key}" JobId="${content?.job_id}"`,
                  );
                  await generateKOTPreview(content, getPrinters);
                }
              }
            }
            if (printAllInOneKot) {
              // $('#kitchenDepartmentDiv').removeClass('kitchendept');
              Object.assign(params, {
                job_id: window.generateId(10),
              });

              console.log(
                `[OnlineOrdeer]Message="Printing CategoryWise all in one KOT"  JobId="${params?.job_id}"`,
              );
              if (!isLabelprinter) {
                if (app_source === 'kiosk') {
                  const getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                  });
                  await generateKOTPreview(params, getPrinters);
                } else {
                  const getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                  });
                  await generateKOTPreview(params, getPrinters);
                }
              }
              if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
                printkottoLabelprinter(params);
              }
            }
          } else {
            // $('#kitchenDepartmentDiv').removeClass('kitchendept');
            // await generateKOTPreview(params);
            Object.assign(params, {
              job_id: window.generateId(10),
            });

            console.log(
              `[OnlineOrdeer]Message="Printing KOT"  JobId="${params?.job_id}"`,
            );
            if (!isLabelprinter) {
              if (app_source === 'kiosk') {
                const getPrinters = await getPrinterbyordertype({
                  action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                  app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                  billing_type: String(billing_type),
                });
                await generateKOTPreview(params, getPrinters);
              } else {
                const getPrinters = await getPrinterbyordertype({
                  action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                  app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                  billing_type: String(billing_type),
                });
                await generateKOTPreview(params, getPrinters);
              }
            }
            if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
              printkottoLabelprinter(params);
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.noItems'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}
/**
 * Writes the details to the document to render
 * the data
 * @param {KOT Preview details} previewDetails
 */
async function renderkotViewforLabel(previewDetails) {
  previewDetails.isLabelprinter = true;
  if (window.kotpreviewscriptLoaded == true) {
    $('#kotpreviewBodyid').data('data', previewDetails);
    await showkotPreview();
  } else {
    $('#kotpreviewBodyid').data('data', previewDetails);
  }
  await sendPrintKOT(6); // label printer index
}

/**
 * Generates the KOT Preview
 * @param {Parameters} params
 */
async function generateKOTPreview(params, printers) {
  const previewDetails = {
    items: params.items,
    tableName: params.tableName,
    tax_name: '',
    istax_dividable: '',
    kot_type: 'KOT',
    username: params.username,
    isLabelprinter: params.isLabelprinter,
    more_info: params.more_info,
    note: params.kotNote,
    order_id: params.order_id,
    billingType: params.billing_type,
    kitchenDepartment: params.kitchenDepartment,
    showOnlineOrderOtpOnKot: params.showOnlineOrderOtpOnKot,
    otp: params.otp,
    delivery_id: params.delivery_id,
    isOnlinebill: true,
    extra_details: params.extra_details,
    orderTime: params.orderTime,
    order_type_mode: params.order_type_mode,
  };
  if (params.showStorenamonkot != undefined) {
    previewDetails.showStorenamonkot = params.showStorenamonkot;
  }

  if (params.customer) {
    Object.assign(previewDetails, { customer: params.customer });
  }
  if (params.is_pre_order) {
    Object.assign(previewDetails, {
      is_pre_order: true,
      pre_order_datetime: moment(params.order_later_datetime)
        .utc()
        .format('DD MMMM YYYY hh:mm A'),
    });
  }

  if (
    window.tablestatusTagonkotsettings &&
    window.tablestatusTagonkotsettings.showNewordertag &&
    window.tablestatusTagonkotsettings.newOrdertaglabel
  ) {
    previewDetails.tablestatuskotprintTag =
      window.tablestatusTagonkotsettings.newOrdertaglabel;
  }

  console.log(
    `[OnlineOrder] Message="Add KOT print job in queue" JobId="${previewDetails?.job_id}"`,
  );
  await window.printKotfromqueue({
    previewDetails,
    printers,
  });
}

/**
 * Send's print kot request
 */
async function sendPrintKOT(isLabelprinter, printerIndex) {
  let printData;
  // let PRINTERNAME = isLabelprinter ? PRINTERS.LABEL : PRINTERS.ONLINE_KOT;
  let PRINTERNAME;
  if (printerIndex) {
    PRINTERNAME = printerIndex;
  } else {
    PRINTERNAME = isLabelprinter ? PRINTERS.LABEL : PRINTERS.ONLINE_KOT;
  }
  let printkotFlag = true;
  const forKOTPrint = true;
  if (
    window.printersList != undefined &&
    window.printersList.length >= PRINTERNAME
  ) {
    printkotFlag = window.printersList[PRINTERNAME - 1]?.activate == 1;
    if (!printkotFlag) {
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:digitalOrderController.KOTPrintIsDisabled'),
        );
      }, 500);
      return true;
    }
    printData = {
      content: $('#kotpreviewBodyid').html(),
      deviceName: window.printersList[PRINTERNAME - 1].device_name
        ? window.printersList[PRINTERNAME - 1].device_name
        : '',
      silent: true,
      copies: window.printersList[PRINTERNAME - 1].no_of_prints,
      size: window.printersList[PRINTERNAME - 1].printer_size,
      type: 1,
      container: 'kotpreviewContainer',
      forKOTPrint,
    };
  } else {
    printData = {
      content: $('#kotpreviewBodyid').html(),
      deviceName: '',
      silent: true,
      type: 1,
      forKOTPrint,
    };
  }
  betteripcRenderer.callMain(PRINTERS_IPC.PRINT_WINDOW_AYNC, printData);
}

/**
 * Call's the preview method which will render
 * the KOT Label info and then send's the print request
 * @param {Data to print} data
 */
async function printkottoLabelprinter(params) {
  if (
    window.printersList[PRINTERS.LABEL - 1] != undefined &&
    window.printersList[PRINTERS.LABEL - 1].device_name != undefined &&
    window.printersList[PRINTERS.LABEL - 1].more_info != undefined
  ) {
    const printkotFlag = window.printersList[PRINTERS.LABEL - 1].activate === 1;
    if (!printkotFlag) {
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:digitalOrderController.labelPrintIsDisabled'),
        );
      }, 500);
      return true;
    }

    try {
      const current_more_info = safeParse(
        window.printersList[PRINTERS.LABEL - 1].more_info,
      );
      if (!current_more_info.width) {
        current_more_info.width = '2';
      }
      params.more_info = current_more_info;
      params.isLabelprinter = true;
      await generateKOTPreview(params);
      sendPrintKOT(true);
    } catch (error) {}
  }
}

/**
 * Adds no orders found svg
 */
function addNoordersfound() {
  $('#digitalorderslistID').append($(NO_ORDERSFOUND));
  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:digitalOrderController.UhOhNoOrdersFound'),
  );
}

/**
 * Set the margins to the preview if there are any
 */
async function setPageconfigifany() {
  let currentPrinter = 2;

  if (
    window.printersList != undefined &&
    window.printersList.length >= PRINTERS.DINEIN_BILL
  ) {
    const size = window.printersList[PRINTERS.DINEIN_BILL - 1].printer_size;
    currentPrinter = Number(size);
  }
  if (currentPrinter && window.settingsConfig) {
    let margins;
    $('#preview-footer-actionsid').attr('size', currentPrinter);
    let currentSize = '80mm';
    switch (currentPrinter) {
      case PRINTER_SIZES_REFID.PRINTER_58MM.ID:
        margins = window.settingsConfig[PRINTER_58_CONFIG - 1].value;
        currentSize = PRINTER_SIZES_REFID.PRINTER_58MM.SIZE;
        $('#previewContainerid').css({
          width: PRINTER_SIZES_REFID.PRINTER_58MM.SIZE,
        });
        break;
      case PRINTER_SIZES_REFID.PRINTER_80MM.ID:
        currentSize = PRINTER_SIZES_REFID.PRINTER_80MM.SIZE;
        margins = window.settingsConfig[PRINTER_80_CONFIG - 1].value;
        $('#previewContainerid').css({
          width: PRINTER_SIZES_REFID.PRINTER_80MM.SIZE,
        });
        break;
      default:
        break;
    }

    if (margins) {
      try {
        // $('#previewContainerid').css({ 'margin': margins });
        const rawmargins = String(margins).split(' ');
        if (rawmargins && rawmargins.length == 2) {
          $('#currentleftMarginlabel').html(rawmargins[0].replace('px', ''));

          if (rawmargins[1]) {
            const currentWidth = Number(rawmargins[1].replace('mm', ''));
            currentSize = Number(currentSize.replace('mm', ''));
            if (currentSize > currentWidth) {
              const widthDecrementcounter = currentSize - currentWidth;
              if (widthDecrementcounter > 0) {
                $('#currentrightMarginlabel').html(widthDecrementcounter);
              } else {
                $('#currentrightMarginlabel').html(0);
              }
            }
          }
        }
      } catch (error) {
        margins = undefined;
      }
    } else {
      $('#currentleftMarginlabel').html('0');
      $('#currentrightMarginlabel').html('0');
    }
    const pageConfig = {
      margins,
    };
    return pageConfig;
  }
}

function addDeliveryboys() {
  $('#digitaldeliveryboyCombo option:gt(0)').remove();
  if (window.deliveryBoys && window.deliveryBoys.length) {
    window.deliveryBoys.forEach((dboy) => {
      $('<option>')
        .val(dboy.id)
        .text(dboy.name)
        .attr('phone', dboy.phone)
        .appendTo('#digitaldeliveryboyCombo');
    });
  }
}

function updateOrderdeliveryboydetails() {
  Swal.fire({
    title: $.i18n.t('controller:digitalOrderController.updateOrder'),
    text: $.i18n.t(
      'controller:digitalOrderController.updatingDeliveryBoyDetails',
    ),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: $.i18n.t('controller:digitalOrderController.OK'),
    cancelButtonText: $.i18n.t('controller:digitalOrderController.Cancel'),
    didOpen: () => {
      Swal.showLoading();
      sendUpdatedeliveryboyrequest();
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

async function sendUpdatedeliveryboyrequest() {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0) {
    let order_data = $(selectedBill).attr('order_data');
    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
        return;
      }

      if (!order_data) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:digitalOrderController.invalidDetails'),
        );
        Swal.close();
        return;
      }

      const postData = {
        delivery_boy_name: $(
          "input:radio[name='digideliveryBoyButton']:checked",
        ).text(),
        delivery_boy_phone: $(
          "input:radio[name='digideliveryBoyButton']:checked",
        ).attr('phone'),
        store_id: order_data.store_id,
        order_id: order_data.order_id,
      };

      const options = {
        method: 'PUT',
        uri: Config.links.updateDeliveryboy,
        body: postData,
        json: true,
        rejectUnauthorized: false,
      };
      try {
        // const response = await request(options);
        const response = await apiCall.put(
          Config.links.updateDeliveryboy,
          postData,
          {
            headers: {
              machine_id: window.MACHINE_ID,
            },
          },
        );
        if (response && response.status && response.status === 200) {
          window.notifyUser.showMessage(
            'success',
            response.msg
              ? response.msg
              : $.i18n.t(
                  'controller:digitalOrderController.Deliveryboyupdated',
                ),
          );

          const deliveryboyInfo = `${postData.delivery_boy_name}|${postData.delivery_boy_phone}`;

          $('#digideliveryBoyModal').modal('hide');
          if (deliveryboyInfo) {
            $('#digitalorderslistID li.selected-order')
              .find('#list-order-dboydetailsdiv-id')
              .show();
            $('#digitalorderslistID li.selected-order')
              .find('#list-order-dboydetailslabel-id')
              .html(deliveryboyInfo);
          } else {
            $('#digitalorderslistID li.selected-order')
              .find('#list-order-dboydetailsdiv-id')
              .hide();
          }

          $('#digitalorderdetails-dboyname-id').text(
            postData.delivery_boy_name,
          );
          $('#digitalorderdetails-dboyphone-id').text(
            postData.delivery_boy_phone,
          );

          order_data.deliveryboyName = postData.delivery_boy_name;
          order_data.deliveryboyPhone = postData.delivery_boy_phone;

          order_data.delivery_boy_name = postData.delivery_boy_name;
          order_data.delivery_boy_phone = postData.delivery_boy_phone;

          order_data.deliveryboyName = postData.delivery_boy_name;
          order_data.deliveryboyPhone = postData.delivery_boy_phone;

          order_data.delivery_boy_name = postData.delivery_boy_name;
          order_data.delivery_boy_phone = postData.delivery_boy_phone;

          $(selectedBill).attr('order_data', JSON.stringify(order_data));
          showOrderdetails(order_data);
          Object.assign(postData, {
            delivery_boy_mobile: postData.delivery_boy_phone,
          });
          ipcRenderer.send(UPDATE_ONLINEDELIVERY_BOY, JSON.stringify(postData));
        } else {
          window.notifyUser.showMessage(
            'error',
            response.msg
              ? response.msg
              : $.i18n.t(
                  'controller:digitalOrderController.deliveryBoyNotUpdated',
                ),
          );
        }
      } catch (error) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:digitalOrderController.deliveryBoyNotUpdated'),
        );
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
  Swal.close();
}
/**
 * Prints KOT and Bill in silent mode
 */
async function printkotandBill() {
  if (
    window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1] != undefined &&
    window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1].value == '1'
  ) {
    await generateOnlinekot(true);
  }

  if (
    window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1] != undefined &&
    window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1].value == '1'
  ) {
    await sleep(300);

    await printonelineBill(true);
  }
}

function initializeStep_Progress() {
  ProgressBar = loadProgressbar('digitalstep-progress-id');
  $('#digitalstep-progress-id').empty();
  if (ProgressBar) ProgressBar.singleStepAnimation = 500;
}

/**
 * listener
 * @param {Filter type} filter
 */
function filterListener(filter) {
  let order_type = $(filter).attr('action-type');
  const is_platform_filter = $(filter).attr('is_platform_filter');
  const shouldappendOrders = $(filter).attr('append_orders');
  let online_action = '';
  let appendOrders = false;
  if (shouldappendOrders != undefined && shouldappendOrders) {
    appendOrders = true;
  }

  if (is_platform_filter) {
    const parent = $('#digital-states-list-id li i:visible').parent();
    if (parent == undefined || parent.length == 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:onlineordernotification.Pleaseselecttheorderstateabove',
        ),
        0,
      );
      return;
    }
    online_action = order_type;
    order_type = $(parent).attr('action-type');
  }
  // window.notifyUser.showMessage(
  //   'error',
  //   $.i18n.t('controller:digitalOrderController.Nointernetconnection'),
  //   0,
  // );

  if (order_type) {
    Swal.fire({
      title: $.i18n.t('controller:digitalOrderController.fetchingOrders'),
      text: $.i18n.t(
        'controller:digitalOrderController.hangonThereSitBackAndRelaxWhileWeFetchYourOrders',
      ),
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      // showLoaderOnConfirm: true,
      didOpen: () => {
        Swal.showLoading();
        fetchOrders(
          order_type,
          `${online_action}`,
          currentOffset,
          appendOrders,
          is_platform_filter,
        );
      },
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
      },
    });
  }
}

function getEnabledchannels() {
  if (
    !cachedbillingType &&
    window.storeDetails &&
    window.storeDetails.extra_info
  ) {
    cachedbillingType = [
      DIGITAL_BILLING_FLAG,
      UPSALE_BILLING_FLAG,
      ONDC_BILLING_FLAG,
      RAFEEQ_BILLING_FLAG,
    ];
    try {
      const extra_info = safeParse(window.storeDetails.extra_info);
      if (extra_info && extra_info.channels_enabled) {
        if (extra_info.channels_enabled.zomato) {
          cachedbillingType.push(OnlineBillingTypeByName.ZOMATO);
        }

        if (extra_info.channels_enabled.swiggy) {
          cachedbillingType.push(OnlineBillingTypeByName.SWIGGY);
        }

        if (extra_info.channels_enabled.dotpe) {
          cachedbillingType.push(OnlineBillingTypeByName.DOTPE);
        }

        if (extra_info.channels_enabled.magicpin) {
          cachedbillingType.push(OnlineBillingTypeByName.MAGIC_PIN);
        }

        if (extra_info.channels_enabled.careem) {
          cachedbillingType.push(OnlineBillingTypeByName.CAREEM);
        }

        if (extra_info.channels_enabled.talabat) {
          cachedbillingType.push(OnlineBillingTypeByName.TALABAT);
        }

        if (extra_info.channels_enabled.noonfood) {
          cachedbillingType.push(OnlineBillingTypeByName.NOONFOOD);
        }

        if (extra_info.channels_enabled.ubereats) {
          cachedbillingType.push(OnlineBillingTypeByName.UBEREATS);
        }

        if (extra_info.channels_enabled.radyes) {
          cachedbillingType.push(OnlineBillingTypeByName.RADYES);
        }

        if (extra_info.channels_enabled.deliveroo) {
          cachedbillingType.push(OnlineBillingTypeByName.DELIVEROO);
        }

        if (extra_info.channels_enabled.dunzo) {
          cachedbillingType.push(OnlineBillingTypeByName.DUNZO);
        }

        if (extra_info.channels_enabled.fidoo) {
          cachedbillingType.push(OnlineBillingTypeByName.FIDOO);
        }

        if (extra_info.channels_enabled.jahez) {
          cachedbillingType.push(OnlineBillingTypeByName.JAHEZ);
        }

        if (extra_info.channels_enabled.amazon) {
          cachedbillingType.push(OnlineBillingTypeByName.AMAZON);
        }

        if (extra_info.channels_enabled.mrsool) {
          cachedbillingType.push(OnlineBillingTypeByName.MRSOOL);
        }

        if (extra_info.channels_enabled.thrive) {
          cachedbillingType.push(OnlineBillingTypeByName.THRIVE);
        }

        if (extra_info.channels_enabled.cultfit) {
          cachedbillingType.push(OnlineBillingTypeByName.CULTFIT);
        }

        if (extra_info.channels_enabled.gupshup) {
          cachedbillingType.push(OnlineBillingTypeByName.GUPSHUP);
        }

        if (extra_info.channels_enabled.inresto) {
          cachedbillingType.push(OnlineBillingTypeByName.INRESTO);
        }

        if (extra_info.channels_enabled.justeat) {
          cachedbillingType.push(OnlineBillingTypeByName.JUSTEAT);
        }

        if (extra_info.channels_enabled.scootsy) {
          cachedbillingType.push(OnlineBillingTypeByName.SCOOTSY);
        }

        if (extra_info.channels_enabled.chatfood) {
          cachedbillingType.push(OnlineBillingTypeByName.CHATFOOD);
        }
        if (extra_info.channels_enabled.flipdish) {
          cachedbillingType.push(OnlineBillingTypeByName.FLIPDISH);
        }
        if (extra_info.channels_enabled.eazydiner) {
          cachedbillingType.push(OnlineBillingTypeByName.EAZYDINER);
        }
        if (extra_info.channels_enabled.foodpanda) {
          cachedbillingType.push(OnlineBillingTypeByName.FOODPANDA);
        }
        if (extra_info.channels_enabled.swiggystore) {
          cachedbillingType.push(OnlineBillingTypeByName.SWIGGYSTORE);
        }
        if (extra_info.channels_enabled.zomatomarket) {
          cachedbillingType.push(OnlineBillingTypeByName.ZOMATOMARKET);
        }

        if (extra_info.channels_enabled.hungerstation) {
          cachedbillingType.push(OnlineBillingTypeByName.HUNGERSTATION);
        }
        if (extra_info.channels_enabled.eateasy) {
          cachedbillingType.push(OnlineBillingTypeByName.EATEASY);
        }

        if (extra_info.channels_enabled.smiles) {
          cachedbillingType.push(OnlineBillingTypeByName.SMILES);
        }

        if (extra_info.channels_enabled.instashop) {
          cachedbillingType.push(OnlineBillingTypeByName.INSTASHOP);
        }

        if (extra_info.channels_enabled.toyou) {
          cachedbillingType.push(OnlineBillingTypeByName.TOYOU);
        }

        if (extra_info.channels_enabled.beanz) {
          cachedbillingType.push(OnlineBillingTypeByName.BEANZ);
        }

        if (extra_info.channels_enabled.cari) {
          cachedbillingType.push(OnlineBillingTypeByName.CARI);
        }

        if (extra_info.channels_enabled.dca) {
          cachedbillingType.push(OnlineBillingTypeByName.DCA);
        }

        if (extra_info.channels_enabled.ordable) {
          cachedbillingType.push(OnlineBillingTypeByName.ORDABLE);
        }

        if (extra_info.channels_enabled.thechefz) {
          cachedbillingType.push(OnlineBillingTypeByName.THECHEFZ);
        }

        if (extra_info.call_center) {
          isCallCenterEnabled = true;
        }

        // if (extra_info.channels_enabled.grubtech) {
        cachedbillingType.push(OnlineBillingTypeByName.GRUBTECH);
        cachedbillingType.push(OnlineBillingTypeByName.GRAB);
        cachedbillingType.push(OnlineBillingTypeByName.GLOVO);
        cachedbillingType.push(OnlineBillingTypeByName.WOLT);
        cachedbillingType.push(OnlineBillingTypeByName.BOLT);
        cachedbillingType.push(OnlineBillingTypeByName.YEMEKSEPETI);
        cachedbillingType.push(OnlineBillingTypeByName.GETIR);
        cachedbillingType.push(OnlineBillingTypeByName.THE_ENTERTAINER);
        cachedbillingType.push(OnlineBillingTypeByName.ELMENUS);
        cachedbillingType.push(OnlineBillingTypeByName.HIMENUS);
        cachedbillingType.push(OnlineBillingTypeByName.TALABNA);
        cachedbillingType.push(OnlineBillingTypeByName.TABSQUARE);
        cachedbillingType.push(OnlineBillingTypeByName.JUMIA);
        cachedbillingType.push(OnlineBillingTypeByName.COFE);
        cachedbillingType.push(OnlineBillingTypeByName.TKYR);
        cachedbillingType.push(OnlineBillingTypeByName.YALAH);
        cachedbillingType.push(OnlineBillingTypeByName.DIGIBYTES);
        cachedbillingType.push(OnlineBillingTypeByName.REST_LABS);
        cachedbillingType.push(OnlineBillingTypeByName.GREEB);
        cachedbillingType.push(OnlineBillingTypeByName.NINJA_SIDES);
        cachedbillingType.push(OnlineBillingTypeByName.MANNASAT);
        cachedbillingType.push(OnlineBillingTypeByName.CIAO);
        cachedbillingType.push(OnlineBillingTypeByName.KEETA);
        cachedbillingType.push(OnlineBillingTypeByName.TAKER);

        // }
      }
      if (
        cachedbillingType.includes(4) ||
        cachedbillingType.includes(5) ||
        cachedbillingType.includes(19) ||
        cachedbillingType.includes(14) ||
        cachedbillingType.includes(43)
      ) {
        $('#digiorderstoreSettingsbuttonid').show();
      } else {
        $('#digiorderstoreSettingsbuttonid').hide();
      }
    } catch (error) {
      console.error(error);
    }
  }
  return cachedbillingType;
}

/**
 *  Fetch the online orders
 * @param {*} order_type
 * @param {*} online_action
 * @param {*} offset
 * @param {*} appendOrders
 * @param {*} is_platform_filter
 */
async function fetchOrders(
  order_type,
  online_action,
  offset,
  appendOrders,
  is_platform_filter,
) {
  stopHowler();
  // Remove animation class
  $('#digital-states-list-id li').removeClass('animated-div');
  clearcurrentOrderdetails();

  showCountdown({
    seconds: tabSwitchDelay || 5,
    elementtoDisable: '#digital-states-list-id li,button.online-action-button',
    timerElement: '#digitalnextactionCountdownid .values',
  });

  if (!appendOrders) {
    $('#digitalorderslistID').empty();
    currentOffset = 0;
    offset = 0;
  }

  // If Swiggy and Zomato is enabled then add billing_type
  if (!cachedbillingType) {
    getEnabledchannels();
  }

  let billing_type = cachedbillingType;
  if (is_platform_filter) {
    billing_type = [Number(online_action)];
  }

  const postData = {
    offset,
    store_id: window.storeDetails.store_id,
    flag: order_type === 'running' ? 2 : 1,
    order_state: order_type === 'running' ? 'placed' : order_type,
    add_limit: 1,
    search: $(`#digitalordersearchInputid`).val(),
    billing_type,
    callcenter: isCallCenterEnabled,
  };

  if ($('#digitalordersdatefilter').val()) {
    const fromDate = $('#digitalordersdatefilter').data(
      'daterangepicker',
    ).startDate;
    const toDate = $('#digitalordersdatefilter').data(
      'daterangepicker',
    ).endDate;
    if (fromDate && toDate) {
      Object.assign(postData, {
        fromDate: fromDate.format('YYYY-MM-DD HH:mm:ss'),
        toDate: toDate.format('YYYY-MM-DD HH:mm:ss'),
      });
    }
  }

  try {
    const axiosResult = await apiCall.post(
      Config.links.digitalOrders,
      postData,
      {
        headers: {
          machine_id: window.MACHINE_ID,
        },
      },
    );
    const result = axiosResult.data;
    if (appendOrders) {
      $('#digitalloadmoreOrdersbutton').remove();
    }
    if (
      result &&
      result.status != undefined &&
      result.status == 200 &&
      result.data != undefined
    ) {
      const orderDetails = result.data;
      if (
        orderDetails &&
        Array.isArray(orderDetails) &&
        orderDetails.length > 0
      ) {
        orderDetails.forEach(async (order) => {
          const doesExist = $('#digitalorderslistID').find(
            `[order-id='${order.order_id}']`,
          );
          if (doesExist.length === 0) await createOrder(order);
        });
        iinitializei18nforDigitalordersbuttons();
        currentOffset += orderDetails.length;
        addPaginationifrequired(order_type, online_action, is_platform_filter);

        if (Swal.isVisible()) Swal.close();

        $('#digitalordersdatefilter,#digitalordersearchInputid').val('');
        return true;
      }
      Swal.close();
      if (!appendOrders) addNoordersfound();
    }
    Swal.close();
    return false;
  } catch (error) {
    Swal.close();
    console.log(error);
  }
  Swal.close();
  $('#digitalordersdatefilter,#digitalordersearchInputid').val('');
  return false;
}

/**
 *
 * @param {The next state name} new_status
 * @param {*} message
 * @param {*} order_id
 * @param {*} prev_state
 * @param {*} store_id
 */
async function senddigiorderUpdateRequest({
  new_status,
  message,
  order_id,
  prev_status,
  cur_state,
  store_id,
  phone,
  billingType,
}) {
  if (String(cur_state).toLowerCase() === 'completed') {
    cur_state = 'fulfilled';
  }
  const postData = {
    new_order_state: String(cur_state).toLowerCase(),
    message,
    store_id,
    order_id,
    phone,
    upsale_order:
      Number(billingType) === OnlineBillingTypeByName.UPSALE ? 1 : 0,
    source: 'atlantic_pos',
    username: window.storeDetails.username,
  };

  const options = {
    method: 'PUT',
    uri: Config.links.updatedigitalOrder,
    body: postData,
    json: true,
    rejectUnauthorized: false,
  };

  try {
    // const result = await request(options);
    const response = await apiCall.put(
      Config.links.updatedigitalOrder,
      postData,
    );
    if (response && response.data && response.data.status) {
      const result = response.data;
      // Swal.close();
      if (result.status == 200) {
        window.notifyUser.showMessage('success', result.msg, 0);
        await orderupdatePostprocessing(store_id, order_id, cur_state, phone);
        // await betteripcRenderer.callMain('update-digital-order-status', {order_id, order_state: String(cur_state).toLowerCase()});
      } else if (result.msg) {
        window.notifyUser.showMessage('error', result.msg, 0);
      }
      return true;
    }
    Swal.close();
    return false;
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.somethingWentWrong'),
    );
    console.log(error);
  }
  Swal.isVisible() && Swal.close();
}

async function sendOnlineorderupdateRequest(params) {
  try {
    console.log(
      `Message="Sending online order status update request" Channel="${
        window.orderTypes[Number(params.billingType)].order_type
      }" OrderID="${params.order_id}" OrderState="${
        params.cur_state
      }" OrderPreviousState="${params.prev_status}"`,
    );
    const payload = {
      order_id: params.order_id,
      external_order_id: params.order_id,
      store_id: params.store_id,
      order_state: params.cur_state,
      prev_order_state: params.prev_status,
      source: 'atlantic_pos',
      username: window.storeDetails.username,
      // rejection_message_id: Number(params.rejection_message_id),
      message: params.message,
      phone: params.phone,
      rejected_item_ids: params.rejected_item_ids,
      next_available_time: params.next_available_time,
    };

    if (params?.rejection_message_id) {
      Object.assign(payload, {
        rejection_message_id: Number(params.rejection_message_id),
      });
    }
    if (params.message) {
      Object.assign(payload, {
        message: params.message,
      });
    }

    if (String(payload.order_state).toLowerCase() === 'completed') {
      Object.assign(payload, {
        order_state: 'Fulfilled',
      });
    }

    const { data } = await apiCall.post(
      Config.links.updateChannelOrderStatus,
      payload,
      {
        headers: getHeadersformposforrender(),
      },
    );
    Swal.close();

    if (data.statusCode === HttpStatusCode.Ok) {
      notifyUser.showMessage('success', data.message);
      await orderupdatePostprocessing(
        params.store_id,
        params.order_id,
        params.cur_state,
        params.phone,
      );
    } else {
      console.error(
        `Message="Error While Sending online order status update request" Channel="${
          window.orderTypes[Number(params.billingType)].order_type
        }" OrderID= "${error?.message}"`,
      );
      notifyUser.showMessage(
        'error',
        data.message ||
          $.i18n.t('controller:digitalOrderController.Somethingwentwrong'),
      );
    }
  } catch (error) {
    const reaons = error?.response?.data || {};
    console.error(
      `Message="Error While Sending online order status update request" Channel="${
        window.orderTypes[Number(params.billingType)].order_type
      }" Reason="${JSON.stringify(reaons)}"`,
      error?.message,
    );
    Swal.close();
  }
}

async function sendONDCRejectStatusRequest(params) {
  try {
    console.log(
      `Message=Sending ONDC reject request Order_id=${params.order_id}`,
    );
    const payload = {
      order_id: params.order_id,
      store_id: params.store_id,
      cancellation_reason_code: String(params.cancellation_reason_code),
    };

    const { data } = await apiCall.post(Config.links.rejectONDCOrder, payload, {
      headers: getHeadersformposforrender(),
    });
    // Swal.close();

    if (
      data.statusCode === HttpStatusCode.Ok ||
      data.status === HttpStatusCode.Ok
    ) {
      notifyUser.showMessage('success', data.message);
      await orderupdatePostprocessing(
        params.store_id,
        params.order_id,
        params.cur_state,
        params.phone,
      );
    } else {
      console.log(
        `Message="Error While Sending online order status update request" OrderID= "${error?.message}"`,
      );
      notifyUser.showMessage(
        'error',
        data.message ||
          $.i18n.t('controller:digitalOrderController.Somethingwentwrong'),
      );
    }
  } catch (error) {
    const reaons = error?.response?.data || {};
    console.log(
      `Message="Error While Sending online order status update request" OrderID= "${error?.message}"`,
    );
    Swal.close();
  }
}
/**
 * appends load more button to the list
 * and attaches the on click listener.
 * @param {Order type} order_type
 */
async function addPaginationifrequired(
  order_type,
  online_action,
  is_platform_filter,
) {
  if (order_type) {
    switch (toTitleCase(order_type)) {
      case ONLINE_ORDER_NAME_STATES.CANCELLED:
      case ONLINE_ORDER_NAME_STATES.FULFILLED:
        $('#digitalorderslistID').append(LOAD_MORE_ELEMENT_DIGITAL);
        $('#digitalloadmoreOrdersbutton').attr('action-type', order_type);
        $('#digitalloadmoreOrdersbutton').attr('append_orders', true);

        $('#digitalloadmoreOrdersbutton').on('click', function () {
          filterListener(this);
        });

        break;
      default:
        break;
    }
  }
}

/**
 * Creates a new order from a template and from order details
 * @param {Order to be displayed} order
 */
async function createOrder(currentOrderdetails) {
  if (
    orderitemTemplate != undefined &&
    currentOrderdetails &&
    currentOrderdetails.constructor == Object
  ) {
    const temp = orderitemTemplate;

    const paidStatus = false;
    const { instructions } = currentOrderdetails;
    const isDigitalorder =
      currentOrderdetails.billing_type === DIGITAL_BILLING_FLAG;
    let checkforRbtemp = false;

    const listItem = $(
      `<li class="list-group-item list-order-item" id="digitalorder-list-item">${
        temp
      }</li>`,
    ).attr('order-id', currentOrderdetails.order_id);

    $(listItem).find('#list-order-item-actions-div-id').empty();

    $(listItem)
      .find('#list-order-storenameid')
      .text(
        currentOrderdetails.extra_details &&
          currentOrderdetails.extra_details.channel_restaurant_name
          ? currentOrderdetails.extra_details.channel_restaurant_name
          : window.storeDetails.store_name,
      );

    if (currentOrderdetails.order_state != undefined) {
      $(listItem)
        .find('#list-order-item-status-label-id')
        .text(
          $.i18n.t(
            `controller:digiorderState.${currentOrderdetails.order_state
              .replace(/ /g, '')
              .toLowerCase()}`,
          ),
        );
    }

    if (instructions) {
      $(listItem)
        .find('#list-order-item-instruction-label-id')
        .css('display', '');
      $(listItem)
        .find('#list-order-item-instruction-label-id')
        .html(String(instructions))
        .prop('title', String(instructions));
    } else {
      $(listItem)
        .find('#list-order-item-instruction-label-id')
        .css('display', 'none');
    }

    if (
      Number(currentOrderdetails.billing_type) === KEETA_BILLING_FLAG &&
      currentOrderdetails.extra_details
    ) {
      const extra_details = safeParse(currentOrderdetails.extra_details);
      if (
        extra_details.keeta &&
        extra_details.keeta.isRefundOrder &&
        extra_details.keeta.isRefundOrder === 1
      ) {
        $(listItem)
          .find('#list-order-refund-status-label-id')
          .css('display', '');
        $(listItem)
          .find('#list-order-refund-status-label-id')
          .html(`Refund Initiated`)
          .prop('title', 'Refund Initiated');
      }

      if (
        extra_details.keeta &&
        extra_details.keeta.isRefundOrder &&
        extra_details.keeta.isRefundOrder === 2
      ) {
        $(listItem)
          .find('#list-order-refund-status-label-id')
          .css('display', '');
        $(listItem)
          .find('#list-order-refund-status-label-id')
          .html(`Refund Accepted`)
          .prop('title', 'Refund Accepted')
          .css('color', 'green');
      }

      if (
        extra_details.keeta &&
        extra_details.keeta.isRefundOrder &&
        extra_details.keeta.isRefundOrder === 3
      ) {
        $(listItem)
          .find('#list-order-refund-status-label-id')
          .css('display', '');
        $(listItem)
          .find('#list-order-refund-status-label-id')
          .html(`Refund Rejected`)
          .prop('title', 'Refund Rejected')
          .css('color', 'red');
      }
    } else {
      $(listItem)
        .find('#list-order-refund-status-label-id')
        .css('display', 'none');
    }

    if (
      Number(currentOrderdetails.billing_type) === SWIGGY_BILLING_FLAG &&
      currentOrderdetails.extra_details
    ) {
      const extra_details = safeParse(currentOrderdetails.extra_details);
      if (
        extra_details.channel &&
        extra_details.channel === 'swiggy' &&
        extra_details.order_edit
      ) {
        $(listItem).find('#list-edit-order-label-id').css('display', '');
        $(listItem)
          .find('#list-edit-order-label-id')
          .html(`Order Edited`)
          .prop('title', 'Order Edited');
      }
    } else {
      $(listItem).find('#list-edit-order-label-id').css('display', 'none');
    }

    if (
      Number(currentOrderdetails.billing_type) === SWIGGY_BILLING_FLAG &&
      currentOrderdetails.extra_details
    ) {
      const extra_details = safeParse(currentOrderdetails.extra_details);
      if (
        extra_details.channel &&
        extra_details.channel === 'swiggy' &&
        extra_details.pin
      ) {
        $(listItem).find('#list-customer-pin-code-label-id').css('display', '');
        $(listItem)
          .find('#list-customer-pin-code-label-id')
          .html(`PIN: ${extra_details.pin}`)
          .prop('title', 'PIN');
      }
    } else {
      $(listItem)
        .find('#list-customer-pin-code-label-id')
        .css('display', 'none');
    }

    if (
      currentOrderdetails.dunzo_task_id ||
      currentOrderdetails.dunzo_request_id
    ) {
      $(listItem).find('#list-order-dunzodetails-id').show();
      $(listItem)
        .find('#list-order-dunzodetailstaskidlabel-id')
        .html(
          `${
            currentOrderdetails?.dunzo_task_json?.partner
              ? currentOrderdetails?.dunzo_task_json?.partner
              : ''
          } task id- ${
            currentOrderdetails.dunzo_task_id
              ? currentOrderdetails.dunzo_task_id
              : currentOrderdetails.dunzo_request_id
          }`,
        );
    } else {
      $(listItem).find('#list-order-dunzodetails-id').hide();
    }

    // show preparation time
    if (
      showPreparationtimeCounter &&
      String(currentOrderdetails.order_state).toLowerCase() ==
        String(ONLINE_ORDER_NAME_STATES.ACKNOWLEDGED).toLowerCase()
    ) {
      // find prep time
      let prepTime = 0;
      let prepTimeInSecond = 0;
      if (window.platformCatalogueitems.length || window.allItemsList) {
        currentOrderdetails.tmpos_order_child.map((item) => {
          let posItem;
          if (window.platformCatalogueitems.length) {
            posItem = window.platformCatalogueitems.find(
              (o) =>
                o.item_id == item.item_id &&
                String(o.title).trim().toLowerCase() ==
                  String(item.title).trim().toLowerCase(),
            );
          }

          if (!posItem && window.allItemsList) {
            posItem = window.allItemsList.find(
              (o) =>
                o.item_refid == item.item_id &&
                String(o.title).trim().toLowerCase() ==
                  String(item.title).trim().toLowerCase(),
            );
          }
          // if (posItem) {
          prepTime += Number(posItem?.preparation_time) || 30;
          // }
        });
        const avgPrepTime =
          prepTime / Number(currentOrderdetails.tmpos_order_child.length);
        prepTimeInSecond = avgPrepTime * 60;
      } else {
        prepTimeInSecond = 1800;
      }
      // order created time
      const orderDate = moment(currentOrderdetails.orderDateTime)
        .utc()
        .format('DD MMMM YYYY hh:mm A');
      const targetDateTime = new Date(orderDate);
      const currentDateTime = new Date();

      // Calculate the time difference in milliseconds
      const timeDifferenceMilliseconds = currentDateTime - targetDateTime;

      // Calculate the time difference in seconds
      const timeDifferenceSeconds = timeDifferenceMilliseconds / 1000;
      let order_date_time = prepTimeInSecond - timeDifferenceSeconds;
      order_date_time = Math.floor(order_date_time);

      // show timer
      const timerElement = $('<label>', {
        id: `countdown_${currentOrderdetails.order_id}`,
        class: 'order-countdown',
      });
      $(listItem).find('#list-order-item-status-label-id').after(timerElement);
      showCountdownForOnlineOrder(
        `#countdown_${currentOrderdetails.order_id}`,
        order_date_time,
      );
    }
    if (currentOrderdetails.reason) {
      $(listItem).find('#list-order-reason-id').show();
      $(listItem)
        .find('#list-order-reasonidlabel-id')
        .html(currentOrderdetails.reason);
    } else {
      $(listItem).find('#list-order-reason-id').hide();
    }

    $(listItem)
      .find('#list-order-item-channel-img')
      .attr('src', '../assets/logo.ico')
      .attr('alt', 'Digital Order');

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.UPSALE) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', '../assets/images/aggrs/tmbill_upsale.png')
        .attr('alt', 'UpSale Order');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.ZOMATO) {
      if (
        currentOrderdetails.extra_details &&
        currentOrderdetails.extra_details.order_tags &&
        currentOrderdetails.extra_details.order_tags.length
      ) {
        $(listItem)
          .find('#list-order-item-channel-img')
          .attr(
            'src',
            'https://cdn.tmbill.com/backoffice/dashboard/zomato-instant.png',
          )
          .attr('alt', 'Zomato Instant Order');
      } else {
        $(listItem)
          .find('#list-order-item-channel-img')
          .attr(
            'src',
            'https://cdn.tmbill.com/backoffice/transparent/zomato.png',
          )
          .attr('alt', 'Zomato Order');
      }
      checkforRbtemp = true;
    }

    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.MAGIC_PIN
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/channel/magicpin.png')
        .attr('alt', 'MagicPin Order');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.DOTPE) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/channel/dotpe.png')
        .attr('alt', 'DotPe Order');
    }

    // if (currentOrderdetails.billing_type == OnlineBillingTypeByName.RAFEEQ) {
    //   $(listItem)
    //     .find('#list-order-item-channel-img')
    //     .attr('src', 'https://cdn.tmbill.com/channel/dotpe.png')
    //     .attr('alt', 'DotPe Order');
    // }
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.SWIGGY) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', '../assets/images/aggrs/tmbill_swiggy.png')
        .attr('alt', 'Swiggy Order');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.ONDC) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', '../assets/images/aggrs/tmbill_ondc.jpg')
        .attr('alt', 'Swiggy Order');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.RAFEEQ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/channel/rafeeq.png')
        .attr('alt', 'Rafeeq Order');
    }

    // careem
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.CAREEM) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/careem.png')
        .attr('alt', 'Rafeeq Order');
    }

    // talabat
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.TALABAT) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/talabat.png')
        .attr('alt', 'Rafeeq Order');
    }

    // noon food
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.NOONFOOD) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/noonfood.png')
        .attr('alt', 'Rafeeq Order');
    }

    // ubereats
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.UBEREATS) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/ubereats.png')
        .attr('alt', 'Rafeeq Order');
    }

    // delivero
    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.DELIVEROO
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/deliveroo.png',
        )
        .attr('alt', 'Rafeeq Order');
    }

    // dunzo
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.DUNZO) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/transparent/dunzo.png')
        .attr('alt', 'Dunzo Order');
    }

    // fidoo
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.FIDOO) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/fidoo.png')
        .attr('alt', 'Fidoo Order');
    }

    // jahez
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.JAHEZ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/jahez.png')
        .attr('alt', 'Jahez Order');
    }

    // amzaon
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.AMAZON) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/amazon.png')
        .attr('alt', 'Amazon Order');
    }

    // marsool
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.MRSOOL) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/mrsool.png')
        .attr('alt', 'Marsool Order');
    }

    // thirve
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.THRIVE) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/thrive.png')
        .attr('alt', 'Thrive Order');
    }

    // cultfit
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.CULTFIT) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/cultfit.png')
        .attr('alt', 'Cultfit Order');
    }

    // gupshup
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.GUPSHUP) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/gupshup.png')
        .attr('alt', 'Gupshup Order');
    }

    // inresto
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.INRESTO) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/inresto.png')
        .attr('alt', 'Inresto Order');
    }

    // justeat
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.JUSTEAT) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/justeat.png')
        .attr('alt', 'Justeat Order');
    }

    // scootsy
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.SCOOTSY) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/scootsy.png')
        .attr('alt', 'Scootsy Order');
    }

    // chatfood
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.CHATFOOD) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/chatfood.png')
        .attr('alt', 'Chatfood Order');
    }

    // flipdish
    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.FLIPDISH) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/flipdish.png')
        .attr('alt', 'Flipdish Order');
    }

    // eazydiner
    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.EAZYDINER
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/eazydiner.png',
        )
        .attr('alt', 'Eazydiner Order');
    }

    // foodpanda
    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.FOODPANDA
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/foodpanda.png',
        )
        .attr('alt', 'Food Panda Order');
    }

    // swiggystore
    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.SWIGGYSTORE
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/swiggystore.png',
        )
        .attr('alt', 'Swiggy Store');
    }

    // zomatomarket
    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.ZOMATOMARKET
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/zomatomarket.png',
        )
        .attr('alt', 'Zomato market');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.RADYES) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/radyes.png')
        .attr('alt', 'Radyes');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.EATEASY) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/eateasy.png')
        .attr('alt', 'Eateasy');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.SMILES) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/smiles.png')
        .attr('alt', 'Smiles');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.TOYOU) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/toyou.png')
        .attr('alt', 'Toyou');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.BEANZ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/beanz.png')
        .attr('alt', 'Beanz');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.CARI) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/cari.png')
        .attr('alt', 'Cari');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.ORDABLE) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/ordable.png')
        .attr('alt', 'Ordable');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.DCA) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/dca.png')
        .attr('alt', 'DCA');
    }

    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.INSTASHOP
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/instashop.png',
        )
        .attr('alt', 'Instashop');
    }

    if (
      currentOrderdetails.billing_type === OnlineBillingTypeByName.HUNGERSTATION
    ) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr(
          'src',
          'https://cdn.tmbill.com/backoffice/dashboard/hungerstation.png',
        )
        .attr('alt', 'Hungerstation');
    }

    if (currentOrderdetails.billing_type === OnlineBillingTypeByName.KEETA) {
      $(listItem)
        .find('#list-order-item-channel-img')
        .attr('src', 'https://cdn.tmbill.com/backoffice/dashboard/keeta.png')
        .attr('alt', 'Hungerstation');
    }

    if (currentOrderdetails?.dunzo_task_json?.external_order_id) {
      $(listItem)
        .find('#list-order-item-external-id-label-id')
        .css({ 'font-size': '13px' })
        .attr(
          'title',
          `External ID:${currentOrderdetails?.dunzo_task_json?.external_order_id}`,
        )
        .text(
          `Delivery ID:${
            currentOrderdetails?.dunzo_task_json?.external_order_id
          }`,
        );
    }

    if (currentOrderdetails.order_id) {
      let orderId = currentOrderdetails.order_id;
      if (!showCompleteOrderId) {
        const id = currentOrderdetails.order_id.slice(-4);
        orderId = `****${id}`;
      }
      $(listItem)
        .find('#list-order-item-id-label-id')
        .css({ 'font-size': '13px' })
        .attr('title', `Order ID:${currentOrderdetails.order_id}`)
        .text(`Order ID: ${orderId}`);
    }
    if (
      // currentOrderdetails.billing_type === 107 &&
      currentOrderdetails.external_order_id &&
      currentOrderdetails.external_order_id !== '0'
    ) {
      $(listItem)
        .find('#list-order-item-external-id-label-id')
        .css({ 'font-size': '13px' })
        .attr(
          'title',
          `External Order ID:${currentOrderdetails.external_order_id}`,
        )
        .text(`External Order ID: ${currentOrderdetails.external_order_id}`);
    }
    if (currentOrderdetails.orderDateTime) {
      const formattedDate = moment(currentOrderdetails.orderDateTime)
        .utc()
        .format('DD MMMM YYYY hh:mm A');
      $(listItem)
        .find('#list-order-item-date-label-id')
        .attr('title', formattedDate)
        .text(formattedDate);
    }
    if (
      currentOrderdetails.extra_details &&
      currentOrderdetails.extra_details.order_tags &&
      currentOrderdetails.extra_details.order_tags.length
    ) {
      currentOrderdetails.extra_details.order_tags.forEach((tag) => {
        const tagLabel = $('<label>', {
          html: tag.content,
          title: tag.content,
          style: 'font-weight:bold',
        });
        $(listItem).find('#list-order-instantordertagid').append(tagLabel);
      });
    }

    if (isDigitalorder && currentOrderdetails.digi_order_type === 1) {
      if (currentOrderdetails.order_later_datetime) {
        $(listItem)
          .find('#list-order-item-otp')
          .css({ 'font-size': '11px' })
          .attr('title', `Delivery date`)
          .text(
            `Pre-${moment(currentOrderdetails.order_later_datetime)
              .utc()
              .format('DD MMMM YYYY hh:mm A')}`,
          );
      }
      // $(listItem).find('#list-order-item-otp').text('OTP:');
      $(listItem).find('#list-order-preorderid').text(`Pre-Ordered`);
    } else if (!isDigitalorder) {
      if (currentOrderdetails?.extra_details?.bag_return_otp) {
        $('#list-order-return-otp').show();
        $(listItem)
          .find('#list-order-return-otp')
          .css({ 'font-size': '11px' })
          .attr('title', `Order Return OTP`)
          .text(
            `Return OTP : ${
              (currentOrderdetails &&
                currentOrderdetails.extra_details &&
                currentOrderdetails.extra_details.bag_return_otp) ||
              ''
            }`,
          );
      } else {
        $(this, '#list-order-return-otp').hide();
      }

      if (
        currentOrderdetails &&
        currentOrderdetails.extra_details &&
        currentOrderdetails.extra_details.otp
      ) {
        $(listItem)
          .find('#list-order-item-otp')
          .css({ 'font-size': '11px' })
          .attr('title', `Order OTP`)
          .text(
            `OTP : ${
              (currentOrderdetails &&
                currentOrderdetails.extra_details &&
                currentOrderdetails.extra_details.otp) ||
              ''
            }`,
          );
      } else {
        $('#list-order-item-otp').hide();
      }

      if (
        currentOrderdetails &&
        currentOrderdetails.extra_details &&
        currentOrderdetails.extra_details.start_preparing_at
      ) {
        const formatted = moment(
          currentOrderdetails.extra_details.start_preparing_at,
        ).format('DD-MM-YY hh:mm A');
        $(listItem)
          .find('#schedule-order-time')
          .css({ 'font-size': '11px' })
          .attr('title', `Order OTP`)
          .text(`Prepare at : ${formatted || ''}`);
      } else {
        $('#list-order-item-otp').hide();
      }
    }
    // Add the delivery type
    let { delivery_type } = currentOrderdetails;
    if (delivery_type && window.selectedLanguage !== 'en') {
      const orderType = Object.values(window.orderTypes).find(
        (item) => item.order_type === delivery_type,
      );
      const arabic_delivery_type = orderType?.alternative_title;
      // ARABIC_BIILING_TYPES_BYNAME[String(delivery_type)];
      if (arabic_delivery_type) delivery_type = arabic_delivery_type;
    }
    if (delivery_type === 'dinein' && currentOrderdetails.table_no) {
      delivery_type += ` - Table/Room No:${currentOrderdetails.table_no}`;
    }
    if (delivery_type === 'dinein' && currentOrderdetails.room_no) {
      delivery_type += ` - Table/Room No:${currentOrderdetails.room_no}`;
    }

    if (delivery_type) {
      $(listItem)
        .find('#list-order-deliverytype-labelid')
        .text(String(delivery_type));
    }

    if (currentOrderdetails.order_total) {
      let { order_total } = currentOrderdetails;
      if (typeof order_total === Number) {
        order_total = order_total.toFixed(ROUNDOFF_UPTO);
      } else {
        order_total = Number(order_total).toFixed(ROUNDOFF_UPTO);
      }
      order_total = `${currency} ${order_total}`;

      if (
        currentOrderdetails.tmpos_order_payment &&
        Array.isArray(currentOrderdetails.tmpos_order_payment)
      ) {
        const payments = currentOrderdetails.tmpos_order_payment
          .map((elem) => elem.payment_option)
          .join(',');
        if (payments) {
          order_total += ` (${payments})`;
        }
      }
      // currentOrder
      $(listItem).find('#list-order-item-amount-label-id').text(order_total);
    }

    let donotaddPaidstatus = false;

    switch (toTitleCase(currentOrderdetails.order_state)) {
      case ONLINE_ORDER_NAME_STATES.PLACED:
        const rejectButton = $(REJECT_BUTTON)
          .attr('order_id', currentOrderdetails.order_id)
          .attr('phone', currentOrderdetails.phone)
          .attr('billing_type', currentOrderdetails.billing_type)
          .attr('items', JSON.stringify(currentOrderdetails.tmpos_order_child))
          .attr('platform_id', currentOrderdetails?.extra_details?.platform_id)
          .attr('order_edited', currentOrderdetails?.extra_details?.order_edit)
          .attr('channel', currentOrderdetails?.extra_details?.channel)
          .click(
            debounce(function (e) {
              updateOrderstatus(this);
            }, 300),
          );
        $(listItem)
          .find('#list-order-item-actions-div-id')
          .append(rejectButton);

        if (
          currentOrderdetails.billing_type == ONDC_BILLING_FLAG &&
          partial_accept_order &&
          allow_cancel_item
        ) {
          const partialacceptButton = $(PARTIAL_ACCEPT_BUTTON)
            .attr('order_id', currentOrderdetails.order_id)
            .attr('phone', currentOrderdetails.phone)
            .attr('billing_type', currentOrderdetails.billing_type)
            .click(
              debounce((e) => {
                showPatialAcceptWindow(currentOrderdetails);
              }, 300),
            );
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(partialacceptButton);
        }

        const acceptButton = $(ACCEPT_BUTTON)
          .attr('order_id', currentOrderdetails.order_id)
          .attr('phone', currentOrderdetails.phone)
          .attr('billing_type', currentOrderdetails.billing_type)
          .click(
            debounce(function (e) {
              updateOrderstatus(this);
            }, 300),
          );
        $(listItem)
          .find('#list-order-item-actions-div-id')
          .append(acceptButton);
        if (
          Number(currentOrderdetails.billing_type) === KEETA_BILLING_FLAG &&
          currentOrderdetails.extra_details
        ) {
          const extra_details = safeParse(currentOrderdetails.extra_details);
          if (
            extra_details.keeta &&
            extra_details.keeta.isRefundOrder &&
            extra_details.keeta.isRefundOrder === 1
          ) {
            const acceptRefundButton = $(ACCEPT_REFUND_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .attr(
                'platform_id',
                currentOrderdetails.extra_details.platform_id,
              )
              .click(
                debounce(function (e) {
                  acceptRefund(this);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(acceptRefundButton);

            const rejectRefundButton = $(REJECT_REFUND_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .attr(
                'platform_id',
                currentOrderdetails.extra_details.platform_id,
              )
              .click(
                debounce(function (e) {
                  rejectRefund(this);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(rejectRefundButton);
          }
        }

        break;
      case ONLINE_ORDER_NAME_STATES.ACKNOWLEDGED:
        if (
          [
            NOONFOOD_BILLING_FLAG,
            HUNGERSATATION_BILLING_FLAG,
            KEETA_BILLING_FLAG,
            TALABAT_BILLING_FLAG,
          ].includes(currentOrderdetails.billing_type)
        ) {
          const rejectAfteAcceptButton = $(REJECT_BUTTON)
            .attr('order_id', currentOrderdetails.order_id)
            .attr('phone', currentOrderdetails.phone)
            .attr('billing_type', currentOrderdetails.billing_type)
            .attr('prev_state', 'Acknowledged')
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(rejectAfteAcceptButton);
        }

        if (currentOrderdetails.billing_type === DELIVEROO_BILLING_FLAG) {
          if (!currentOrderdetails.extra_details.asap) {
            const readyButton = $(FOOD_READY_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .click(
                debounce(function (e) {
                  updateOrderstatus(this);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(readyButton);
          }
        } else {
          const readyButton = $(FOOD_READY_BUTTON)
            .attr('order_id', currentOrderdetails.order_id)
            .attr('phone', currentOrderdetails.phone)
            .attr('billing_type', currentOrderdetails.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(readyButton);
        }
        if (
          showDirectCompleteButton &&
          currentOrderdetails.billing_type !== ONDC_BILLING_FLAG
        ) {
          const directComplete = $(DIRECT_COMPLETE)
            .attr('order_id', currentOrderdetails.order_id)
            .attr('phone', currentOrderdetails.phone)
            .attr('billing_type', currentOrderdetails.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(directComplete);
        }
        if (
          Number(currentOrderdetails.billing_type) === KEETA_BILLING_FLAG &&
          currentOrderdetails.extra_details
        ) {
          const extra_details = safeParse(currentOrderdetails.extra_details);
          if (
            extra_details.keeta &&
            extra_details.keeta.isRefundOrder &&
            extra_details.keeta.isRefundOrder === 1
          ) {
            const acceptRefundButton = $(ACCEPT_REFUND_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .attr(
                'platform_id',
                currentOrderdetails.extra_details.platform_id,
              )
              .click(
                debounce(function (e) {
                  acceptRefund(this);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(acceptRefundButton);

            const rejectRefundButton = $(REJECT_REFUND_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .attr(
                'platform_id',
                currentOrderdetails.extra_details.platform_id,
              )
              .click(
                debounce(function (e) {
                  rejectRefund(this);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(rejectRefundButton);
          }
        }

        if (
          Number(currentOrderdetails.billing_type) === SWIGGY_BILLING_FLAG &&
          currentOrderdetails.extra_details
        ) {
          const extra_details = safeParse(currentOrderdetails.extra_details);
          if (extra_details.channel === 'swiggy') {
            const contactSupportButton = $(SWIGGY_CONTACT_SUPPORT_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .attr(
                'platform_id',
                currentOrderdetails.extra_details.platform_id,
              )
              .click(
                debounce(function (e) {
                  contactSupport(currentOrderdetails.order_id);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(contactSupportButton);
          }
        }
        break;
      case ONLINE_ORDER_NAME_STATES.FOOD_READY:
        if (currentOrderdetails.billing_type !== ONDC_BILLING_FLAG) {
          let showDispathButton = true;
          let showCompleteButton = false;
          if (currentOrderdetails.billing_type === DELIVEROO_BILLING_FLAG) {
            if (currentOrderdetails.extra_details.asap) {
              showDispathButton = false;
            }
          }

          if (
            currentOrderdetails.billing_type === CAREEM_BILLING_FLAG &&
            currentOrderdetails.app_source === 'careem'
          ) {
            showDispathButton = false;
          }
          if (
            currentOrderdetails.billing_type === SWIGGY_BILLING_FLAG &&
            currentOrderdetails.extra_details?.channel === 'swiggy'
          ) {
            showDispathButton = false;
            showCompleteButton = false;
          }
          if (
            currentOrderdetails.billing_type === EATEASY_BILLING_FLAG &&
            currentOrderdetails.extra_details &&
            currentOrderdetails.extra_details.channel === 'eateasy'
          ) {
            showDispathButton = false;
            showCompleteButton = true;
          }
          if (
            currentOrderdetails.billing_type === HUNGERSATATION_BILLING_FLAG ||
            currentOrderdetails.billing_type === TALABAT_BILLING_FLAG
          ) {
            showDispathButton = false;
            showCompleteButton = true;
          }

          if (currentOrderdetails.billing_type === KEETA_BILLING_FLAG) {
            showDispathButton = false;
            showCompleteButton = false;
          }
          if (
            currentOrderdetails.billing_type === TALABAT_BILLING_FLAG &&
            currentOrderdetails.delivery_type ===
              TALABAT_ORDER_TYPES.OWN_DELIVERY
          ) {
            showCompleteButton = false;
          }
          if (showCompleteButton) {
            const completeButton = $(ORDER_COMPLETE_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('store_id', currentOrderdetails.store_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .click(
                debounce(function (e) {
                  updateOrderstatus(this);
                }, 300),
              );

            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(completeButton);
          }
          if (showDispathButton) {
            const dispatchButton = $(DISPATCH_BUTTON)
              .attr('order_id', currentOrderdetails.order_id)
              .attr('phone', currentOrderdetails.phone)
              .attr('billing_type', currentOrderdetails.billing_type)
              .click(
                debounce(function (e) {
                  updateOrderstatus(this);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(dispatchButton);
          }
          //  else {
          //   const dispatchButton = $(DISPATCH_BUTTON)
          //     .attr('order_id', currentOrderdetails.order_id)
          //     .attr('phone', currentOrderdetails.phone)
          //     .attr('billing_type', currentOrderdetails.billing_type)
          //     .click(
          //       debounce(function (e) {
          //         updateOrderstatus(this);
          //       }, 300),
          //     );
          //   $(listItem)
          //     .find('#list-order-item-actions-div-id')
          //     .append(dispatchButton);
          // }
        }

        break;
      case ONLINE_ORDER_NAME_STATES.DISAPATCHED:
        // if (currentOrderdetails.billing_type !== ONDC_BILLING_FLAG) {
        if (
          !OnlineOrderBillingTypesByNumber.includes(
            currentOrderdetails.billing_type,
          )
        ) {
          const completeButton = $(ORDER_COMPLETE_BUTTON)
            .attr('order_id', currentOrderdetails.order_id)
            .attr('phone', currentOrderdetails.phone)
            .attr('billing_type', currentOrderdetails.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );
          if (currentOrderdetails.dunzo_task_id) {
            showDunzocanceltaskbutton = true;
          }
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(completeButton);
        }

        break;
      case ONLINE_ORDER_NAME_STATES.COMPLETED:
      case ONLINE_ORDER_NAME_STATES.FULFILLED:
        checkforRbtemp = false;
        if (
          currentOrderdetails.billing_type == ONDC_BILLING_FLAG &&
          currentOrderdetails.dunzo_task_json &&
          currentOrderdetails.dunzo_task_json.return_order
            ?.delivery_boy_state == 'pending'
        ) {
          const returnButton = $(RETURN_BUTTON)
            .attr('order_id', currentOrderdetails.order_id)
            .attr('phone', currentOrderdetails.phone)
            .attr('billing_type', currentOrderdetails.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(returnButton);
        }
        break;
      case ONLINE_ORDER_NAME_STATES.CANCELLED:
        donotaddPaidstatus = true;
        checkforRbtemp = false;
        break;
      default:
        break;
    }

    if (checkforRbtemp && currentOrderdetails) {
      const rbtButton = $(RBT_BUTTON)
        .attr('title', 'Add ride body temperature')
        .click(
          debounce((e) => {
            askforriderBodytemp({
              order_id: currentOrderdetails.order_id,
              store_id: currentOrderdetails.store_id,
            });
          }, 300),
        );
      $(listItem).find('#list-order-item-actions-div-id').prepend(rbtButton);
    }

    if (paidStatus && !donotaddPaidstatus) {
      // Add Paid status button
      const paidButton = $(ORDER_PAIDSTATUS);
      $(listItem).find('#list-order-item-actions-div-id').prepend(paidButton);
    }

    const isTimeWithinthreshold = isTimestampWithinThreshold(
      currentOrderdetails?.dunzo_task_json?.MAC_init?.timestamp,
      currentOrderdetails?.dunzo_task_json?.MAC_init?.timeout_threshold,
    );
    if (
      currentOrderdetails.dunzo_task_json &&
      currentOrderdetails.dunzo_task_json.MAC_init &&
      isTimeWithinthreshold
    ) {
      showCountdownForMACButton(
        `#MAC_BUTTON_${currentOrderdetails.id}`,
        currentOrderdetails?.dunzo_task_json?.MAC_init?.timestamp,
        currentOrderdetails?.dunzo_task_json?.MAC_init?.timeout_threshold,
      );
      const orderMACButton = $(ORDER_MAC_BUTTON)
        .attr('order_id', currentOrderdetails.id)
        .attr('id', `MAC_BUTTON_${currentOrderdetails.id}`)
        .attr('order_data', JSON.stringify(currentOrderdetails))
        .click(
          debounce(function (e) {
            $('#digitalorderslistID li').removeClass('selected-order');
            $(this).closest('li').addClass('selected-order');
            const orderData = $(this).attr('order_data');
            if (orderData != undefined) {
              askForAcceptOrRejectMAC(currentOrderdetails);
            }
          }, 300),
        );

      $(listItem)
        .find('#list-order-item-actions-div-id')
        .append(orderMACButton);
    }
    const orderdetailsButton = $(ORDER_DETAILS_BUTTON)
      .attr('order_id', currentOrderdetails.id)
      .attr('order_data', JSON.stringify(currentOrderdetails))
      .click(
        debounce(function (e) {
          $('#digitalorderslistID li').removeClass('selected-order');
          $(this).closest('li').addClass('selected-order');
          const orderData = $(this).attr('order_data');
          if (orderData != undefined) {
            showOrderdetails(safeParse(orderData));
          }
        }, 300),
      );

    $(listItem)
      .find('#list-order-item-actions-div-id')
      .append(orderdetailsButton);

    if (
      currentOrderdetails.phone != 'null' &&
      currentOrderdetails.phone != undefined
    ) {
      if (currentOrderdetails.cust_name) {
        let customerInfo = currentOrderdetails.cust_name || '';
        if (currentOrderdetails.phone) {
          customerInfo = `${customerInfo} (${currentOrderdetails.phone})`;
        }
        $(listItem)
          .find('#list-order-item-username-label-id')
          .text(customerInfo);
      }
    }
    let address = '';
    if (currentOrderdetails.line_1) {
      address += currentOrderdetails.line_1;
    }

    // if (currentOrderdetails.line_2) {
    //   address = currentOrderdetails.line_2;
    // }
    if (currentOrderdetails.line_1 && currentOrderdetails.line_2) {
      address = `${currentOrderdetails.line_1} ${currentOrderdetails.line_2}`;
    }
    $(listItem)
      .find('#list-order-item-address-label-id')
      .text(address)
      .prop('title', address);

    // Add delivery boy info
    let deliveryboyInfo = '';
    if (
      currentOrderdetails.delivery_boy_name &&
      currentOrderdetails.delivery_boy_name !== '0'
    ) {
      deliveryboyInfo = `${currentOrderdetails.delivery_boy_name} | `;
    }
    if (
      currentOrderdetails.delivery_boy_phone &&
      currentOrderdetails.delivery_boy_phone !== '0'
    ) {
      deliveryboyInfo = `${deliveryboyInfo + currentOrderdetails.delivery_boy_phone} | `;
    }
    // if (!deliveryboyInfo) {
    //   deliveryboyInfo = 'Unassigned';
    // }
    if (deliveryboyInfo) {
      $(listItem).find('#list-order-dboydetailsdiv-id').show();
      $(listItem).find('#list-order-dboydetailslabel-id').html(deliveryboyInfo);
    } else {
      $(listItem).find('#list-order-dboydetailsdiv-id').hide();
    }
    $('#digitalorderslistID').append(listItem);
  }
}

function isTimestampWithinThreshold(givenTimestamp, thresholdSeconds) {
  const currentTimestamp = new Date().getTime();
  const difference = currentTimestamp - givenTimestamp;

  // Convert the threshold to milliseconds
  const thresholdMilliseconds = thresholdSeconds * 1000;

  // Compare the difference with the threshold
  return Math.abs(difference) <= thresholdMilliseconds;
}

async function askForAcceptOrRejectMAC(order_data) {
  const MACConfirmation = await Swal.fire({
    title: 'MAC',
    showConfirmButton: true,
    showCancelButton: true,
    width: '23em',
    allowOutsideClick: true,
    allowEscapeKey: false,
    confirmButtonText: 'Accept',
    cancelButtonText: 'Reject',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      content: 'tmbill-swal-title-class',
      input: 'tmbill-swal-input2',
    },
  });

  if (MACConfirmation && MACConfirmation.isConfirmed) {
    const action = 'ACCEPTED';
    sendMACRequest(order_data, action);
  } else {
    const action = 'REJECTED';
    sendMACRequest(order_data, action);
  }
}

async function sendMACRequest(order_data, action) {
  try {
    const payload = {
      order_id: order_data.order_id,
      external_order_id: order_data?.dunzo_task_json?.external_order_id,
      store_id: order_data.store_id,
      action,
    };
    const response = await apiCall.post(Config.links.macUpdate, payload, {
      headers: getHeadersformposforrender(),
    });

    if (response) {
    }
  } catch (error) {}
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

async function showPatialAcceptWindow(orderDetails) {
  if (!orderDetails) {
    return;
  }
  if (window.modifyBillScriptLoaded) {
    $('#partialAcceptorderModal').modal('show');
    $('#partialAcceptorderModalid').attr('data', JSON.stringify(orderDetails));
  } else {
    $('#partialAcceptorderModalid').load(
      'PartialOrderAccept.html',
      async () => {
        $('#partialAcceptorderModalid').attr(
          'data',
          JSON.stringify(orderDetails),
        );
        $('#partialAcceptorderModal').modal('show');
      },
    );
  }
}

async function showPrepTimePopup() {
  const popup = Swal.mixin({
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
  const value = await popup.fire({
    title: 'Enter preparation time',
    input: 'text',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonText: 'Ok',
    // id: 'orderPrepTime',
    // width: '48em',
    // html: list,
    inputAttributes: {
      autocomplete: 'on',
      id: 'orderPrepTime-input',
    },
    cancelButtonText: $.i18n.t('controller:orderController.changeTable.Cancel'),
    didOpen: async () => {
      // await additemnotesuggestions('input#itemnote-input');
    },
    inputPlaceholder: 'Enter preparation time in minutes',
    inputValidator: (value) => {
      if (!value) {
        return 'Please add valid preparation time';
      }
      if (value) {
        if (value.length > 100) {
          return 'preparation time should be less than 100 characters';
        }

        if (window.specialCharRegex.test(value)) {
          return 'Special characters are not allowed in preparation time';
        }
      }

      // value = String(value).replace('#', '');
      // //Max note length
      // if (value.length > 100) {
      //   value = value.substring(0, 100);
      // }
    },
  });
  return value;
}

async function acceptRefund(button) {
  try {
    const order_id = $(button).attr('order_id');
    const platform_id = $(button).attr('platform_id');
    const { store_id } = window.storeDetails;
    showLoader({
      title: 'Accepting refund',
      text: $.i18n.t(
        'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
      ),
    });
    const response = await apiCall.post(
      window.Config.links.acceptKeetaRefund,
      {
        order_id,
        store_id,
        platform_id,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    // console.log('response:', response);
    if (response.status === 200) {
      $(`[order-id="${order_id}"]`)
        .find('#list-order-refund-status-label-id')
        .html(`Refund Accepted`)
        .prop('title', 'Refund Accepted')
        .css('color', 'green');

      $(`[order-id="${order_id}"]`).find('#refundRejectBtton').remove();

      $(`[order-id="${order_id}"]`).find('#refundAcceptButton').remove();
    }
    Swal.close();
  } catch (error) {
    Swal.close();
    console.error('error', error);
  }
}

async function rejectRefund(button) {
  try {
    const order_id = $(button).attr('order_id');
    const platform_id = $(button).attr('platform_id');
    const { store_id } = window.storeDetails;
    const { value: reason } = await Swal.fire({
      title: $.i18n.t('controller:digitalOrderController.reasonToReject'),
      input: 'select',
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputOptions: KEETA_REFUND_REJECT_REASON,
      // billingType == 104 && cur_state == ONLINE_ORDER_NAME_STATES.RETURENED
      //   ? ONDC_RETURN_REASON
      //   : billingType == 104
      //   ? ONDC_REJECT_REASON
      //   : REJECT_REASON,
      inputPlaceholder: $.i18n.t(
        'controller:digitalOrderController.selectAReason',
      ),
      showCancelButton: true,
      confirmButtonText: $.i18n.t('controller:digitalOrderController.OK'),
      cancelButtonText: $.i18n.t('controller:digitalOrderController.Cancel'),
      customClass: {
        popup: 'tmbill-swal-pop-up',
      },
      inputValidator: (value) =>
        new Promise((resolve) => {
          if (value) {
            resolve();
          } else {
            resolve('You need to select a reason :)');
          }
        }),
    });
    if (!reason) return;
    const rejectCode = reason;
    const rejectReason = KEETA_REFUND_REJECT_REASON[reason];
    showLoader({
      title: 'Rejecting refund',
      text: $.i18n.t(
        'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
      ),
    });
    const response = await apiCall.post(
      window.Config.links.rejectKeetaRefund,
      {
        order_id,
        store_id,
        platform_id,
        rejectCode,
        rejectReason,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    // console.log('response::', response);
    if (response.status === 200) {
      $(`[order-id="${order_id}"]`)
        .find('#list-order-refund-status-label-id')
        .html(`Refund Rejected`)
        .prop('title', 'Refund Rejected')
        .css('color', 'red');

      $(`[order-id="${order_id}"]`).find('#refundRejectBtton').remove();

      $(`[order-id="${order_id}"]`).find('#refundAcceptButton').remove();
    }
    Swal.close();
  } catch (error) {
    Swal.close();

    console.error('error', error);
  }
}

/**
 * Updates the order status
 */
async function updateOrderstatus(button) {
  const order_id = $(button).attr('order_id');
  const next_state = $(button).attr('next_state');
  const prev_state = $(button).attr('prev_state');
  const cur_state = $(button).attr('cur_state');
  const phone = $(button).attr('phone');
  const platform_id = $(button).attr('platform_id');
  const billingType = $(button).attr('billing_type');
  const order_edited = $(button).attr('order_edited');
  const channel = $(button).attr('channel');

  let items = $(button).attr('items');

  let rejected_item_ids;
  let next_available_time;

  const { store_id } = window.storeDetails;
  let msg = $(button).attr('msg');
  let rejection_message_id;
  let prep_time;

  if (
    billingType == OnlineBillingTypeByName.ZOMATO &&
    prev_state == 'Placed' &&
    askForPreparationTime
  ) {
    const prep_value = await showPrepTimePopup();
    if (prep_value) {
      prep_time = Number(prep_value.value);
    }
  }

  if (MESSAGES != undefined && msg != undefined && MESSAGES[msg]) {
    msg = MESSAGES[msg];
  }

  let reject_reason = REJECT_REASON;
  if (billingType == OnlineBillingTypeByName.ONDC) {
    reject_reason = ONDC_REJECT_REASON;
  }

  // if (billingType == OnlineBillingTypeByName.DELIVEROO) {
  if (billingType == 8) {
    reject_reason = DELIVEROO_REJECT_REASON;
  }

  if (
    billingType == OnlineBillingTypeByName.ONDC &&
    cur_state == ONLINE_ORDER_NAME_STATES.RETURENED
  ) {
    reject_reason = ONDC_RETURN_REASON;
  }

  if (
    billingType == OnlineBillingTypeByName.ZOMATO ||
    billingType == OnlineBillingTypeByName.CAREEM
  ) {
    reject_reason = ZOMATO_REJECT_REASON;
  }

  if (channel === 'swiggy' && billingType == OnlineBillingTypeByName.SWIGGY) {
    reject_reason = SWIGGY_REJECT_REASON;
  }

  if (billingType == OnlineBillingTypeByName.HUNGERSTATION) {
    reject_reason = HUNGERSTATION_REJECT_REASONS;
  }

  if (billingType == OnlineBillingTypeByName.TALABAT) {
    reject_reason = TALABAT_REJECT_REASONS;
  }

  if (billingType == OnlineBillingTypeByName.KEETA) {
    reject_reason = KEETA_REJECT_REASON;
  }
  const shouldShowFooter =
    order_edited && Number(billingType) === OnlineBillingTypeByName.SWIGGY;
  const is_reject_button = $(button).attr('is_reject_button');
  let message = '';
  if (is_reject_button) {
    // const { value: reason } = await Swal.fire({
    //   title: $.i18n.t('controller:digitalOrderController.reasonToReject'),
    //   input: 'select',
    //   allowOutsideClick: false,
    //   allowEscapeKey: false,
    //   inputOptions: reject_reason,
    //   // billingType == 104 && cur_state == ONLINE_ORDER_NAME_STATES.RETURENED
    //   //   ? ONDC_RETURN_REASON
    //   //   : billingType == 104
    //   //   ? ONDC_REJECT_REASON
    //   //   : REJECT_REASON,
    //   inputPlaceholder: $.i18n.t(
    //     'controller:digitalOrderController.selectAReason',
    //   ),
    //   showCancelButton: true,
    //   confirmButtonText: $.i18n.t('controller:digitalOrderController.OK'),
    //   cancelButtonText: $.i18n.t('controller:digitalOrderController.Cancel'),
    //   customClass: {
    //     popup: 'tmbill-swal-pop-up',
    //   },
    //   inputValidator: (value) =>
    //     new Promise((resolve) => {
    //       if (value) {
    //         resolve();
    //       } else {
    //         resolve('You need to select a reason :)');
    //       }
    //     }),
    // });

    const { value: reason } = await Swal.fire({
      title: $.i18n.t('controller:digitalOrderController.reasonToReject'),
      input: 'select',
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputOptions: reject_reason,
      inputPlaceholder: $.i18n.t(
        'controller:digitalOrderController.selectAReason',
      ),
      showCancelButton: true,
      confirmButtonText: 'Cancel Order',
      // : $.i18n.t('controller:digitalOrderController.OK'),
      cancelButtonText: $.i18n.t('controller:digitalOrderController.Cancel'),

      customClass: {
        popup: 'tmbill-swal-pop-up',
        confirmButton: 'reject-online-order-ok-button',
        cancelButton: 'reject-online-order-btn-cancel',
      },
      footer: shouldShowFooter
        ? `
      <button
        id="swal-mask-phone-btn"
        class="swal2-styled swal-mask-phone-btn">
        Customer Mask Phone
      </button>
    `
        : '',
      inputValidator: (value) =>
        new Promise((resolve) => {
          if (value) {
            resolve();
          } else {
            resolve('You need to select a reason :)');
          }
        }),
      didOpen: () => {
        const select = Swal.getInput();
        const actions = Swal.getActions();

        const supportBtn = document.createElement('button');
        supportBtn.innerText = 'Contact Support';
        supportBtn.className =
          'swal2-styled swal2-deny reject-online-order-btn-support';

        supportBtn.style.display = 'none';

        supportBtn.onclick = () => {
          Swal.close();
          contactSupport(order_id); // 👈 your function
        };

        actions.prepend(supportBtn);

        supportBtn.style.display =
          channel === 'swiggy' && billingType == OnlineBillingTypeByName.SWIGGY
            ? 'inline-block'
            : 'none';

        supportBtn.style.display = 'inline-block';
        const confirmBtn = Swal.getConfirmButton();
        const denyBtn = Swal.getDenyButton();
        const cancelBtn = Swal.getCancelButton();

        select.addEventListener('change', () => {
          const selectedValue = select.value;

          if (selectedValue === Object.keys(reject_reason)[0]) {
            // FIRST reason selected
            confirmBtn.innerText = 'Next';
          } else {
            // OTHER reasons
            confirmBtn.innerText = 'Cancel Order';
          }
        });

        const maskBtn = document.getElementById('swal-mask-phone-btn');

        if (maskBtn) {
          maskBtn.addEventListener('click', () => {
            maskCustomerPhone({ order_id, platform_id });
          });
        }
      },
    });

    // if (billingType == OnlineBillingTypeByName.SWIGGY && reason === '1') {
    //   await showOutOfStockItemsPopup();
    // }

    if (
      channel === 'swiggy' &&
      billingType == OnlineBillingTypeByName.SWIGGY &&
      reason === '1'
    ) {
      items = safeParse(items);
      const result = await showOutOfStockItemsPopup({ items, order_id });
      if (result && result.value) {
        rejected_item_ids = result.value.items;
        next_available_time = result.value.outOfStockAt;
      }
      if (result.isDismissed) {
        return;
      }
    }

    let finalReason = reason;
    if (billingType != OnlineBillingTypeByName.ONDC) {
      message = REJECT_REASON[reason];
    } else {
      message = reason;
    }

    if (billingType == OnlineBillingTypeByName.DELIVEROO) {
      const rejectreason = Number(reason);
      message = DELIVEROO_REJECT_REASON[rejectreason];
    }
    if (billingType == OnlineBillingTypeByName.KEETA) {
      const rejectreason = Number(reason);
      rejection_message_id = reason;
      message = KEETA_REJECT_REASON[rejectreason];
    }
    if (billingType == OnlineBillingTypeByName.HUNGERSTATION) {
      rejection_message_id = reason;
      if (!Number.isNaN(reason) && reason > 0) {
        message = HUNGERSTATION_REJECT_REASONS[reason];
      }
    }
    if (billingType == OnlineBillingTypeByName.TALABAT) {
      rejection_message_id = reason;
      if (!Number.isNaN(reason) && reason > 0) {
        message = TALABAT_REJECT_REASONS[reason];
      }
    }
    if (channel === 'swiggy' && billingType == OnlineBillingTypeByName.SWIGGY) {
      rejection_message_id = reason;
      message = SWIGGY_REJECT_REASON[reason];
    }
    if (
      billingType == OnlineBillingTypeByName.ZOMATO ||
      billingType == OnlineBillingTypeByName.CAREEM
    ) {
      rejection_message_id = reason;
      if (!Number.isNaN(reason) && reason > 0) {
        message = ZOMATO_REJECT_REASON[reason];
      }
    }

    if (billingType == OnlineBillingTypeByName.KEETA && message === 'others') {
      const { value: customReason } = await Swal.fire({
        title: 'Please specify the reason',
        input: 'text',
        inputPlaceholder: 'Enter your reason here',
        showCancelButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: $.i18n.t('controller:digitalOrderController.OK'),
        cancelButtonText: $.i18n.t('controller:digitalOrderController.Cancel'),
        inputValidator: (value) => {
          if (!value) {
            return 'You need to enter a reason :)';
          }
        },
      });

      if (customReason) {
        finalReason = customReason;
        message = finalReason;
      } else {
        // Cancelled or empty input
        finalReason = null;
      }
    }

    // `finalReason` now holds the actual reason to use.

    if (!reason) {
      return;
    }
  } else if (msg) {
    message = msg;
  }
  if (order_id && next_state && cur_state) {
    Swal.fire({
      title: $.i18n.t('controller:digitalOrderController.updatingOrderStatus'),
      text: $.i18n.t(
        'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
      ),
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
        if (
          [...Object.values(OnlineBillingTypeByName)].includes(
            Number(billingType),
          ) &&
          billingType != OnlineBillingTypeByName.UPSALE &&
          billingType != OnlineBillingTypeByName.ONDC
        ) {
          sendOnlineorderupdateRequest({
            new_status: next_state,
            message,
            order_id,
            prev_status: prev_state,
            cur_state,
            store_id,
            phone,
            billingType,
            rejection_message_id,
            prep_time,
            rejected_item_ids,
            next_available_time,
          });
        } else if (
          cur_state == ONLINE_ORDER_NAME_STATES.CANCELLED &&
          billingType == OnlineBillingTypeByName.ONDC
        ) {
          sendONDCRejectStatusRequest({
            order_id,
            store_id,
            cur_state,
            phone,
            cancellation_reason_code: message,
          });
        } else {
          senddigiorderUpdateRequest({
            new_status: next_state,
            message,
            order_id,
            prev_status: prev_state,
            cur_state,
            store_id,
            phone,
            billingType,
          });
        }
      },
      customClass: {
        popup: 'tmbill-swal-pop-up',
        content: 'tmbill-swal-title-class',
        input: 'tmbill-swal-input2',
      },
    });
  } else if (cur_state == ONLINE_ORDER_NAME_STATES.RETURENED) {
    updateReturnOrderStatus({ order_id, message });
  }
  $('.closeorderNotificationModal').click();
}

async function updateReturnOrderStatus({ order_id, message }) {
  showLoader({
    title: $.i18n.t('controller:digitalOrderController.updatingOrderStatus'),
    text: $.i18n.t(
      'controller:digitalOrderController.hangOnThereThisWillTakeJustASecond',
    ),
  });

  const payload = {
    order_id,
    return_state: message,
    store_id: window.storeDetails.store_id,
  };

  const response = await apiCall.post(Config.links.returnOrder, payload, {
    headers: getHeadersformposforrender(),
  });
  if (response && response.status == 200) {
    Swal.close();
    await orderupdatePostprocessing(
      window.storeDetails.store_id,
      order_id,
      'Completed',
    );
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:digitalordernotifications.Returnstatusupdated'),
    );
  } else {
    Swal.close();
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:digitalordernotifications.Somethingwentwrong'),
    );
  }
}

async function pullOrder(order_data) {
  if (order_data && order_data.tmpos_order_child) {
    console.log(
      `Message="Prepare the order to pull from digital order" OrderID="${order_data?.order_id}"`,
    );
    order_data.tmpos_order_child.map((item) => {
      if (item && item.extra_details && item.extra_details.alternative_title) {
        Object.assign(item, {
          alternative_title: item.extra_details.alternative_title,
        });
      }
      let posItem = window.allItemsList.find(
        (o) => Number(o.item_refid) === Number(item.item_id),
      );
      console.log(
        'window.platformCatalogueitems.length',
        window.platformCatalogueitems.length,
      );
      if (!posItem && window.platformCatalogueitems) {
        posItem = window.platformCatalogueitems.find(
          (o) => Number(o.item_id) === Number(item.item_id),
        );
      }
      if (posItem && !item.product_group_id) {
        Object.assign(item, {
          product_group_id: posItem.product_group_id,
        });
      }

      console.log('posItem::', posItem);
      console.log('item:', item);
      if (posItem && posItem.product_group_name && !item.product_group_name) {
        Object.assign(item, {
          product_group_name: posItem.product_group_name,
        });
      }

      if (posItem && !item.kitchen_dept) {
        Object.assign(item, { kitchen_dept: posItem.kitchen_dept });
      }
      if (posItem && !item.short_code) {
        Object.assign(item, { short_code: posItem.short_code });
      }
      if (posItem && !item.category_name) {
        Object.assign(item, {
          category_name: posItem['mpos_category.category_name'],
          alternative_category_name:
            posItem['mpos_category.alternative_category_name'],
        });
      }

      if (!item.category_name && posItem && posItem.category_ref_ids) {
        const category = window.platformCatalogueCategories.find(
          (c) => Number(c.category_refid) === Number(posItem.category_ref_ids),
        );
        if (category && category.category_name) {
          Object.assign(item, {
            category_name: category.category_name,
            alternative_category_name: category.alternative_category_name,
          });
        }
      }
      if (item.order_child_options) {
        Object.assign(item, {
          has_options: 1,
        });
      }
      if (item && item.extra_details && item.extra_details.item_note) {
        Object.assign(item, {
          item_note: item.extra_details.item_note,
        });
      }

      if (item.extra_details) {
        const extra_details = safeParse(item.extra_details);
        Object.assign(extra_details, {
          placedQty: item.quantity,
        });
      } else {
        const extra_details = {
          placedQty: item.quantity,
        };
        item.extra_details = extra_details;
      }
    });
  }

  if (
    [OrderState.CANCELLED].includes(
      String(order_data?.order_state).toLowerCase(),
    )
  ) {
    Object.assign(order_data, {
      order_state: OrderState.CANCELLED,
    });
  } else {
    Object.assign(order_data, {
      order_state: OrderState.FULFILLED,
    });
  }

  // check midnight sale count
  let countMidnightSale = false;
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] != undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ==
      '1';
  }

  // seperate bill number for online orders
  let seperateBillNumber = false;
  if (window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1] != undefined) {
    seperateBillNumber =
      window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1].value == '1';
  }

  if (
    [...Object.values(OnlineBillingTypeByName)].includes(
      order_data.billing_type,
    )
  ) {
    Object.assign(order_data, { seperateBillNumber });
  }

  let item_level_discount = 0;
  order_data.tmpos_order_child.forEach((item) => {
    if (item.discount) {
      item_level_discount += item.discount;
    }

    // if (item.order_child_charges && item.order_child_charges.length) {
    //   const itemlevelCharges = [];
    //   for (const currentCharge of item.order_child_charges) {
    //     let chargeAmount = currentCharge.charge_amount;

    //     // for zomato order order level charges coming on item level
    //     // and on item getting charges of all qty but we expect charge of one qty
    //     if (order_data.billing_type !== 8 && currentCharge.per_fixed === 0) {
    //       chargeAmount = chargeAmount / item.quantity;
    //     }

    //     if (order_data.billing_type == 4 && currentCharge.per_fixed === 0) {
    //       chargeAmount = currentCharge.calculated_charge / item.quantity;
    //     }

    //     currentCharge.chargeAmount = chargeAmount;
    //     currentCharge.charge_amount = chargeAmount;
    //     currentCharge.amount = chargeAmount;
    //     itemlevelCharges.push({
    //       title: currentCharge.charge_title,
    //       per_or_fixed: currentCharge.per_fixed,
    //       calculated_charge: currentCharge.calculated_charge,
    //       calculated_tax: currentCharge.calculated_tax,
    //       amount: chargeAmount,
    //       // amount: currentCharge.calculated_charge,
    //       calculate_tax_for_item_charges:
    //         currentCharge.calculated_tax > 0 ? 1 : 0,
    //       is_tax_applicable: currentCharge.is_tax_applicable,
    //       tax_amount: currentCharge.tax_amount,
    //       is_tax_included: currentCharge.is_tax_included,
    //     });
    //   }
    //   Object.assign(item, {
    //     itemlevelCharges,
    //   });
    // }
  });

  if (
    order_data &&
    order_data.extra_details &&
    order_data.extra_details.start_preparing_at
  ) {
    Object.assign(order_data.extra_details, {
      delivery_at: order_data.extra_details.start_preparing_at,
    });
  }

  // console.log('order data:', order_data);
  if (order_data.extra_details) {
    Object.assign(order_data.extra_details, {
      // exlusive_tax: order_data.order_level_total_taxes,
      total_merchant_taxes: order_data.order_level_total_taxes,
      merchant_order_total: order_data.order_total,
      item_level_discount,
    });
  }

  if (
    // order_data.billing_type === 107 &&
    order_data.external_order_id &&
    order_data.external_order_id !== '0'
  ) {
    Object.assign(order_data.extra_details, {
      external_order_id: order_data.external_order_id,
    });
  }
  if (order_data.extra_details) {
    Object.assign(order_data.extra_details, { invoiceType: 'B2C' });
  }

  // console.log(order_data);
  Object.assign(order_data, {
    user_id: window.storeDetails.username,
    createdBy: window.storeDetails.username,
    discount: order_data.order_level_discount,
    coupon: order_data.coupan_code,
    couponDisounttype: order_data.coupan_type,
    couponDisounttotal: order_data.coupan_calculated_amt,
    couponDisount: order_data.coupan_value,
    couponDisountamt: order_data.coupan_value,
    extra_details: order_data.extra_details,
    countMidnightSale,
    delivery_boy_phone: Number(order_data.delivery_boy_phone) || null,
  });

  if (
    [...Object.values(OnlineBillingTypeByName)].includes(
      order_data.billing_type,
    )
  ) {
    // const billingTypename = String(
    //   BillingTypes[order_data.billing_type].toLowerCase(),
    // );
    const billingTypename =
      window.orderTypes[
        Number(order_data.billing_type)
      ].order_type?.toLowerCase();
    tableName = `${billingTypename}:${order_data.order_id}`;
    Object.assign(order_data, {
      table_name: tableName,
    });
  } else if (order_data.billing_type == OnlineBillingTypeByName.SWIGGY) {
    tableName = `swiggy:${order_data.order_id}`;
    Object.assign(order_data, {
      table_name: `swiggy:${order_data.order_id}`,
    });
  } else if (order_data.table_no) {
    Object.assign(order_data, {
      table_name: order_data.table_no,
    });
  } else {
    table_name = `Digital:${order_data.order_id}`;
    Object.assign(order_data, {
      table_name,
    });
  }

  if (order_data.room_no) {
    table_name = order_data.room_no;
    Object.assign(order_data, {
      table_name,
    });
  }

  let paymentisAvailable = false;
  if (
    order_data.tmpos_order_payment &&
    Array.isArray(order_data.tmpos_order_payment) &&
    order_data.tmpos_order_payment.length
  ) {
    const payment = order_data.tmpos_order_payment[0];
    if (order_data.billing_type == 104) {
      payment.payment_option = 'Online Paid';
    }
    Object.assign(order_data, {
      payment: payment.payment_option,
    });

    if (
      payment &&
      payment.payment_option &&
      ONLINEPLATFORM_PAYMENTMODES.includes(
        String(payment.payment_option).toLowerCase(),
      )
    ) {
      paymentisAvailable = true;
    }
  }

  if (
    [...Object.values(OnlineBillingTypeByName)].includes(
      order_data.billing_type,
    ) &&
    !paymentisAvailable
  ) {
    console.log(
      `Message="Changing online order payment mode" OrderID="${order_data.order_id}"`,
    );
    let paymentOptionname = OnlineBillingTypeByNumber[order_data.billing_type];

    if (order_data.billing_type == 104) {
      paymentOptionname = 'Online Paid';
    }

    Object.assign(order_data, {
      tmpos_order_payment: [
        {
          payment_option: paymentOptionname,
          amount: order_data.order_total,
          order_id: order_data.order_id,
          status_flag: 0,
          store_id: order_data.store_id,
        },
      ],
      payment: paymentOptionname,
    });
  }

  if (
    ![ZOMATO_BILLING_FLAG, SWIGGY_BILLING_FLAG, MAGICPIN_BILLING_FLAG].includes(
      order_data.billing_type,
    ) &&
    order_data.orderDateTime
  ) {
    const orderDateTime = order_data.orderDateTime;

    // const date = new Date(orderDateTime);
    // const timestampInLocalTimezone = date.getTime();
    // console.log('timestampInLocalTimezone', timestampInLocalTimezone);

    console.log(
      `Message="Order date time=${order_data.orderDateTime} for order_id=${order_data.order_id}"`,
    );
    const extractedDateTime = order_data.orderDateTime.split('.')[0]; // '2025-03-03T11:13:24'
    const date = new Date(extractedDateTime);
    const timestampInLocalTimezone = date.getTime();
    console.log(
      `Message="Order date time in local timestamp=${timestampInLocalTimezone} for order_id=${order_data.order_id}"`,
    );

    Object.assign(order_data, {
      created_time: timestampInLocalTimezone,
      actual_created_time: timestampInLocalTimezone,
    });
  }
  if (reduceStock) {
    let proceed = true;
    let errorMessage = 'Items not available';
    order_data.tmpos_order_child.forEach((item) => {
      const getItem = window.allItemsList.find(
        (i) => Number(i.item_refid) === Number(item.item_id),
      );

      if (getItem && getItem.current_stock < item.quantity) {
        errorMessage = `Only ${getItem.current_stock} items available of ${item.title} `;
        proceed = false;
        // window.notifyUser.showMessage(
        //   'error',
        //   `Only ${getItem.current_stock} items available of ${item.title} `,
        // );
      }
    });

    if (!proceed) {
      console.log(`Message="${errorMessage}" OrderID="${order_data.order_id}"`);
      // return;
    }
  }

  isDigitalBillSaveisinprocess = true;
  console.log('Message=Digital order pull data', JSON.stringify(order_data));
  if (
    order_data &&
    order_data.app_source === 'Call Center' &&
    !isCallCenterEnabled
  ) {
    return;
  }
  const pullresponse = await betteripcRenderer.callMain(
    PULL_DIGITALORDER,
    order_data,
  );

  if (pullresponse && pullresponse.type == 'success') {
    isDigitalBillSaveisinprocess = false;
    if (
      window.reduceInventorystatus &&
      !ORDERSTATEFOR_REDUCEINVENTORY.includes(order_data.order_state)
    ) {
      // betteripcRenderer.callMain(MISC_IPC.AUTO_REDUCE_INVENTORY);
      initAutoReduceInventory();
    }
    sendBillsettledevent(pullresponse);
    if (
      order_data &&
      order_data.extra_details &&
      order_data.extra_details.rewardDiscount &&
      Object.values(order_data.extra_details.rewardDiscount).length
    ) {
      sendRewardhistory({
        reward: order_data.extra_details.rewardDiscount,
        order_id: order_data.order_id,
        phone: order_data.phone,
        customer_name: order_data.cust_name,
        isQuickbill: 0,
        action: 'create',
      });
    }

    if (window.storeDetails.loyalty_enabled) {
      setTimeout(() => {
        sendPointruleactionifexists({
          order_id: order_data.order_id,
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
        });
      }, 3000);
    }
    ipcRenderer.send(FETCH_KOTBILL_NUMBER, undefined);
    window.notifyUser.showMessage(pullresponse.type, pullresponse.msg);
    window.refreshDashboard = true;
  } else {
    isDigitalBillSaveisinprocess = false;
    window.notifyUser.showMessage(pullresponse.type, pullresponse.msg);
  }
}

/**
 * Called when the order update is succesful
 * @param {*} store_id
 * @param {*} order_id
 * @param {Current order state after update} cur_state
 */
async function orderupdatePostprocessing(store_id, order_id, cur_state, phone) {
  const attr = `[order-id=${order_id}]`;
  const selectedBill = $('#digitalorderslistID').find(attr);
  if (selectedBill.length > 0) {
    $('#digitalorderslistID li').removeClass('selected-order');
    $(selectedBill[0]).addClass('selected-order');
    $(selectedBill[0]).find('#list-order-item-status-label-id').html(cur_state);

    if (
      String(cur_state).toLowerCase() !==
      String(ONLINE_ORDER_NAME_STATES.ACKNOWLEDGED).toLowerCase()
    ) {
      $(selectedBill[0]).find(`#countdown_${order_id}`).html('');
    }
  }

  switch (toTitleCase(cur_state)) {
    case ONLINE_ORDER_NAME_STATES.ACKNOWLEDGED:
      {
        // await printkotandBill();
        await preparePullorder(selectedBill, cur_state);
        await printkotandBill();
        clearcurrentOrderdetails();

        if (selectedBill.length > 0) {
          $(selectedBill[0]).remove();
        }

        const actionsDiv = $(selectedBill[0]).find(
          '#list-order-item-actions-div-id',
        );
        const orderDetailsbutton = $(selectedBill[0]).find(
          '#orderdetailsButton',
        );
        const order_data = $(orderDetailsbutton).attr('order_data');

        if (
          order_data.billing_type === DELIVEROO_BILLING_FLAG &&
          !order_data.extra_details.asap
        ) {
          $(actionsDiv).empty();
          const orderdetailsbutton = $(ORDER_DETAILS_BUTTON)
            .attr('order_id', order_data.order_id)
            .attr('order_data', JSON.stringify(order_data))
            .click(
              debounce(function (e) {
                $('#digitalorderslistID li').removeClass('selected-order');
                $(this).closest('li').addClass('selected-order');
                const orderData = $(this).attr('order_data');
                if (orderData != undefined) {
                  showOrderdetails(safeParse(orderData));
                }
              }, 300),
            );
          $(actionsDiv).append(orderdetailsbutton);

          if (
            Number(order_data.billing_type) === KEETA_BILLING_FLAG &&
            order_data.extra_details
          ) {
            const extra_details = safeParse(order_data.extra_details);
            if (
              extra_details.keeta &&
              extra_details.keeta.isRefundOrder &&
              extra_details.keeta.isRefundOrder === 1
            ) {
              const acceptRefundButton = $(ACCEPT_REFUND_BUTTON)
                .attr('order_id', order_data.order_id)
                .attr('platform_id', order_data.extra_details.platform_id)
                .click(
                  debounce(function (e) {
                    acceptRefund(this);
                  }, 300),
                );
              $(actionsDiv).append(acceptRefundButton);

              const rejectRefundButton = $(REJECT_REFUND_BUTTON)
                .attr('order_id', order_data.order_id)
                .attr('platform_id', order_data.extra_details.platform_id)
                .click(
                  debounce(function (e) {
                    rejectRefund(this);
                  }, 300),
                );
              $(actionsDiv).append(rejectRefundButton);
            }
          }
        }

        if (
          Number(order_data.billing_type) === SWIGGY_BILLING_FLAG &&
          order_data.extra_details
        ) {
          const extra_details = safeParse(order_data.extra_details);
          if (extra_details.channel === 'swiggy') {
            const contactSupportButton = $(SWIGGY_CONTACT_SUPPORT_BUTTON)
              .attr('order_id', order_data.order_id)
              .attr('phone', order_data.phone)
              .attr('billing_type', order_data.billing_type)
              .attr('platform_id', order_data.extra_details.platform_id)
              .click(
                debounce(function (e) {
                  contactSupport(order_data.order_id);
                }, 300),
              );
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(contactSupportButton);
          }
        }
      }
      break;
    case ONLINE_ORDER_NAME_STATES.FOOD_READY:
      if (selectedBill.length > 0) {
        const actionsDiv = $(selectedBill[0]).find(
          '#list-order-item-actions-div-id',
        );
        const orderDetailsbutton = $(selectedBill[0]).find(
          '#orderdetailsButton',
        );
        let order_data = $(orderDetailsbutton).attr('order_data');
        try {
          order_data = safeParse(order_data);
          order_data.cur_state = cur_state;
          // $(orderDetailsbutton).attr('order_data', JSON.stringify(order_data));
          // if pull order on accept is on then check if order is not pulled on accept then pull order
          if (
            order_data &&
            window.settingsConfig[PULLORDER_ONACCEPT - 1] != undefined &&
            window.settingsConfig[PULLORDER_ONACCEPT - 1].value == '1'
          ) {
            // check is order pulled or not
            const isOrderPulled = await betteripcRenderer.callMain(
              CHECK_IF_ORDER_IS_PULLED,
              { order_id: order_data.order_id },
            );
            if (!isOrderPulled) {
              await preparePullorder(selectedBill, cur_state);
            }
          }
        } catch (error) {
          console.log(error);
        }
        $(actionsDiv).empty();

        // if (order_data.billing_type !== ONDC_BILLING_FLAG) {
        // if (
        //   !OnlineOrderBillingTypesByNumber.includes(order_data.billing_type)
        // ) {
        let showDispathButton = true;
        let showCompleteButton = false;
        if (order_data.billing_type === DELIVEROO_BILLING_FLAG) {
          showDispathButton = false;
        }

        if (
          order_data.billing_type === CAREEM_BILLING_FLAG &&
          order_data.app_source === 'careem'
        ) {
          showDispathButton = false;
        }

        if (
          order_data.billing_type === SWIGGY_BILLING_FLAG &&
          order_data.extra_details?.channel === 'swiggy'
        ) {
          showDispathButton = false;
          showCompleteButton = false;
        }

        if (
          Number(order_data.billing_type) === HUNGERSATATION_BILLING_FLAG ||
          Number(order_data.billing_type) === TALABAT_BILLING_FLAG
        ) {
          showDispathButton = false;
        }

        if (
          order_data.billing_type === EATEASY_BILLING_FLAG
          // && order_data.app_source === 'smile'
        ) {
          showDispathButton = false;
          showCompleteButton = true;
        }

        if (
          order_data.billing_type === HUNGERSATATION_BILLING_FLAG ||
          order_data.billing_type === TALABAT_BILLING_FLAG
        ) {
          showDispathButton = false;
          showCompleteButton = true;
        }

        if (
          order_data.billing_type === TALABAT_BILLING_FLAG &&
          order_data.delivery_type === TALABAT_ORDER_TYPES.OWN_DELIVERY
        ) {
          showCompleteButton = false;
        }

        if (showCompleteButton) {
          const completeButton = $(ORDER_COMPLETE_BUTTON)
            .attr('order_id', order_id)
            .attr('store_id', store_id)
            .attr('phone', phone)
            .attr('billing_type', order_data.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );

          $(actionsDiv).append(completeButton);
        }
        if (showDispathButton) {
          const dispatchButton = $(DISPATCH_BUTTON)
            .attr('order_id', order_id)
            .attr('store_id', store_id)
            .attr('phone', phone)
            .attr('billing_type', order_data.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );

          $(actionsDiv).append(dispatchButton);
        }
        // }
        const orderdetailsbutton = $(ORDER_DETAILS_BUTTON)
          .attr('order_id', order_data.order_id)
          .attr('order_data', JSON.stringify(order_data))
          .click(
            debounce(function (e) {
              $('#digitalorderslistID li').removeClass('selected-order');
              $(this).closest('li').addClass('selected-order');
              const orderData = $(this).attr('order_data');
              if (orderData != undefined) {
                showOrderdetails(safeParse(orderData));
              }
            }, 300),
          );
        $(actionsDiv).append(orderdetailsbutton);
      }
      break;
    case ONLINE_ORDER_NAME_STATES.DISAPATCHED:
      clearcurrentOrderdetails();
      if (selectedBill.length > 0) {
        const actionsDiv = $(selectedBill[0]).find(
          '#list-order-item-actions-div-id',
        );
        const orderDetailsbutton = $(selectedBill[0]).find(
          '#orderdetailsButton',
        );
        let order_data = $(orderDetailsbutton).attr('order_data');
        try {
          order_data = safeParse(order_data);
          order_data.cur_state = cur_state;
          // $(orderDetailsbutton).attr('order_data', JSON.stringify(order_data));
        } catch (error) {}

        $(actionsDiv).empty();

        let showCompleteButton = true;
        if (OnlineOrderBillingTypesByNumber.includes(order_data.billing_type)) {
          showCompleteButton = false;
        }

        if (
          order_data.billing_type === CAREEM_BILLING_FLAG &&
          order_data.source === 'careem'
        ) {
          showCompleteButton = false;
        }

        if (
          order_data.billing_type === TALABAT_BILLING_FLAG &&
          order_data.delivery_type === TALABAT_ORDER_TYPES.OWN_DELIVERY
        ) {
          showCompleteButton = false;
        }
        if (showCompleteButton) {
          const completeButton = $(ORDER_COMPLETE_BUTTON)
            .attr('order_id', order_id)
            .attr('store_id', store_id)
            .attr('phone', phone)
            .attr('billing_type', order_data.billing_type)
            .click(
              debounce(function (e) {
                updateOrderstatus(this);
              }, 300),
            );

          $(actionsDiv).append(completeButton);
        }
        const orderdetailsbutton = $(ORDER_DETAILS_BUTTON)
          .attr('order_id', order_data.order_id)
          .attr('order_data', JSON.stringify(order_data))
          .click(
            debounce(function (e) {
              $('#digitalorderslistID li').removeClass('selected-order');
              $(this).closest('li').addClass('selected-order');
              const orderData = $(this).attr('order_data');
              if (orderData != undefined) {
                showOrderdetails(safeParse(orderData));
              }
            }, 300),
          );
        $(actionsDiv).append(orderdetailsbutton);
      }
      const updateStatus = await betteripcRenderer.callMain(
        UPDATE_ONLINE_ORDER_KDS_KOT_STATUS,
        {
          status: 1,
          order_id,
        },
      );
      if (updateStatus) {
        sendBillsettledevent();
      }
      break;

    case 'Fulfilled':
    case 'Completed':
      if (selectedBill.length > 0) {
        const actionsDiv = $(selectedBill[0]).find(
          '#list-order-item-actions-div-id',
        );
        const orderDetailsbutton = $(selectedBill[0]).find(
          '#orderdetailsButton',
        );

        $(actionsDiv).empty();
        $(actionsDiv).append(orderDetailsbutton);
        if (showPreparationtimeCounter) {
          if (selectedBill.length > 0) {
            $(selectedBill[0]).remove();
          }
        }
        // $(selectedBill[0]).remove();
      }

      break;
    case ONLINE_ORDER_NAME_STATES.CANCELLED:
      await preparePullorder(selectedBill, cur_state);
      if (selectedBill.length > 0) {
        $(selectedBill[0]).remove();
      }
      break;
    default:
      break;
  }
  iinitializei18nforDigitalordersbuttons();
}

async function preparePullorder(selectedBill, cur_state) {
  if (
    selectedBill.length > 0 &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1] != undefined &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1].value == '1'
  ) {
    const orderDetailsbutton = $(selectedBill[0]).find('#orderdetailsButton');
    let order_data = $(orderDetailsbutton).attr('order_data');
    try {
      order_data = safeParse(order_data);
      order_data.order_state = cur_state;
      console.log(`Message="Pulling Order" OrderID="${order_data.order_id}"`);
      pullOrder(order_data);
    } catch (error) {
      console.log(error);
    }
  }
  clearcurrentOrderdetails();
}

window.changeOrderStatusRemotely = function (order_id) {
  clearcurrentOrderdetails();
  const cur_state = 'Dispatched';
  let phone;
  const { store_id } = window.storeDetails;
  const attr = `[order-id=${order_id}]`;
  const selectedBill = $('#digitalorderslistID').find(attr);
  if (selectedBill.length > 0) {
    $('#digitalorderslistID li').removeClass('selected-order');
    $(selectedBill[0]).addClass('selected-order');
    $(selectedBill[0]).find('#list-order-item-status-label-id').html(cur_state);
  }

  // clearcurrentOrderdetails();
  if (selectedBill.length > 0) {
    const actionsDiv = $(selectedBill[0]).find(
      '#list-order-item-actions-div-id',
    );
    const orderDetailsbutton = $(selectedBill[0]).find('#orderdetailsButton');
    let order_data = $(orderDetailsbutton).attr('order_data');
    try {
      order_data = safeParse(order_data);
      order_data.cur_state = cur_state;
      phone = order_data.phone;
      $(orderDetailsbutton).attr('order_data', JSON.stringify(order_data));
    } catch (error) {}

    const completeButton = $(ORDER_COMPLETE_BUTTON)
      .attr('order_id', order_id)
      .attr('store_id', store_id)
      .attr('phone', phone)
      .attr('billing_type', order_data.billing_type)
      .click(
        debounce(function (e) {
          updateOrderstatus(this);
        }, 300),
      );

    $(actionsDiv).empty();
    $(actionsDiv).append(completeButton);
    $(actionsDiv).append(orderDetailsbutton);
  }
};

/**
 *
 * @param {Selected Order} order
 */
function showOrderdetails(order) {
  clearcurrentOrderdetails();
  // console.log(order);
  if (order) {
    $('#digitaldeliveryboyCombo').hide();
    $('.orderdetails-dboyinfo-label').hide();
    $('.orderdetails-person-name-div').hide();
    $('.orderdetails-person-phone-div').hide();

    $('#digitaldeliveryboyCombo').hide();
    $('.orderdetails-dboyinfo-label').hide();
    $('.orderdetails-person-name-div').hide();
    $('.orderdetails-person-phone-div').hide();

    if (
      order.delivery_type &&
      order.delivery_type.toLowerCase() === 'delivery'
    ) {
      $('#digitaldeliveryboyCombo').show();
    }

    if (
      order.delivery_boy_name &&
      order.delivery_boy_name !== '0' &&
      order.delivery_boy_name.trim() !== ''
    ) {
      $('.orderdetails-dboyinfo-label').show();
      $('.orderdetails-person-name-div').show();
      $('.orderdetails-person-phone-div').show();

      $('#digitalorderdetails-dboyname-id').text(order.delivery_boy_name);
      $('#digitalorderdetails-dboyphone-id').text(
        order.delivery_boy_phone || '',
      );
      $('#digitalorderdetails-dboystate-id').text(
        order.delivery_boy_state || 'State: Assigned',
      );
    }

    $('#digitaldeliveryboyCombo').hide();
    if (order.delivery_boy_name && order.delivery_boy_name !== '0') {
      $('#digitalorderdetails-dboyname-id').text(order.delivery_boy_name);
    }
    if (
      order.delivery_type &&
      String(order.delivery_type).toLowerCase() === 'delivery'
    ) {
      $('#digitaldeliveryboyCombo').show();
    } else {
      $('#digitalorderdetails-dboyname-id').text('');
    }
    if (order.delivery_boy_phone && order.delivery_boy_phone !== '0') {
      $('#digitalorderdetails-dboyphone-id').text(order.delivery_boy_phone);
    } else {
      $('#digitalorderdetails-dboyphone-id').text('');
    }

    if (order.delivery_boy_name && order.delivery_boy_name !== '0') {
      $('#digitalorderdetails-dboystate-id').text(
        order.delivery_boy_state || 'State: Assigned',
      );
    } else {
      $('#digitalorderdetails-dboystate-id').text('');
    }

    if (order.dunzo_task_json && order.dunzo_task_json.message) {
      $('#orderdetails-dunzo-msg').show();
      // $('#current-digitalorderdetails-dunzomsg').text(`Delivery Partner Message - ${order.dunzo_task_json.message}`);
      $('#current-digitalorderdetails-dunzomsg').html(
        `Delivery Partner Message - <span style='color:red'>${order.dunzo_task_json.message}</span>`,
      );
      $('#current-digitalorderdetails-dunzomsg').attr(
        'title',
        order.dunzo_task_json.message,
      );
    } else {
      $('#current-digitalorderdetails-dunzomsg').text('');
      $('#orderdetails-dunzo-msg').hide();
    }

    const items = order.tmpos_order_child;
    let itemLevelcharges = 0;
    $('#digitalorderdetailsTable').attr('order_id', order.order_id);
    if (items.constructor == Array && items.length > 0) {
      items.forEach((element) => {
        if (element && element.price == 0 && element.total !== 0) {
          const price = element.total / element.quantity;
          Object.assign(element, { price: price.toFixed(ROUNDOFF_UPTO) });
          // data.price = price.toFixed(2);
        }
        // if (element.discount !== 0) {
        //   let price = element.price + element.discount;
        //   Object.assign(element, { price: price.toFixed(ROUNDOFF_UPTO) });
        // }
        if (element.total == 0) {
          const price = element.price + element.discount;
          Object.assign(element, { price: price.toFixed(ROUNDOFF_UPTO) });
        }
        additemRow(element);
        if (element && element.order_child_charges) {
          itemLevelcharges += sumBy(
            element.order_child_charges,
            (o) => o.calculated_charge,
          );
        }
      });
    }
    switch (toTitleCase(order.order_state)) {
      case 'Placed':
        ProgressBar.init(ORDERS_NAMESTATE, 'Placed');
        break;
      case 'Acknowledged':
        ProgressBar.init(ORDERS_NAMESTATE, 'Acknowledged');
        break;
      case 'Food Ready':
        ProgressBar.init(ORDERS_NAMESTATE, 'Acknowledged');
        break;
      case 'Dispatched':
        ProgressBar.init(ORDERS_NAMESTATE, 'Dispatched');
        break;

      case 'Fulfilled':
        ProgressBar.init(ORDERS_NAMESTATE, 'Completed');
        break;
      case 'Cancelled':
        $('#digitalstep-progress-id').empty();
        break;
      default:
        $('#digitalstep-progress-id').empty();
        break;
    }

    // Show cancel dunzo task button
    // if (order.dunzo_task_id && !['delivered', 'cancelled', 'runner_cancelled'].includes(order.delivery_boy_state)) {
    if (
      order.dunzo_task_id &&
      ![ONDC_BILLING_FLAG, KEETA_BILLING_FLAG].includes(order.billing_type)
    ) {
      $(`#canceldigitalorderdunzoTaskbuttonid`).show();
    } else {
      $(`#canceldigitalorderdunzoTaskbuttonid`).hide();
    }
    /**
     * Calculation details
     */
    let grandTotallabel = `${$.i18n.t('controller:digitalOrderController.grandTotal')}: `;

    if (order.order_total) {
      let { order_total } = order;
      if (typeof order_total === Number) {
        order_total = order_total.toFixed(ROUNDOFF_UPTO);
      } else {
        order_total = Number(order_total).toFixed(ROUNDOFF_UPTO);
      }

      if (
        // [...Object.values(OnlineBillingTypeByName)].includes(
        //   order.billing_type,
        // ) &&
        // ![...Object.values(digitalBillingTypeByName)].includes(
        //   order.billing_type,
        // )
        ORDERS_NOT_INCLUDING_TAX.includes(order.billing_type)
      ) {
        grandTotallabel = 'Grand Total (Not Including Tax ) :';
        $('#digitaldeliveryboyCombo').hide();
      } else if (order && order.delivery_type === 'delivery') {
        // $('#digitaldeliveryboyCombo').show();
      } else {
        // $('#digitaldeliveryboyCombo').hide();
      }

      if (URBANPIPER_ORDER_TYPES.includes(order.billing_type)) {
        $('#digitaldeliveryboyCombo').hide();
      }

      $('#current-digitalorderdetails-grandTotal').css('display', '');
      $('#current-digitalorderdetails-grandTotal').text(
        `${grandTotallabel + currency} ${order_total}`,
      );
    } else {
      $('#current-digitalorderdetails-grandTotal').css('display', 'none');
      $('#current-digitalorderdetails-grandTotal').text(
        `${grandTotallabel + currency} 0`,
      );
    }
    /**
     * Charges
     */
    if (order.order_level_total_charges || itemLevelcharges) {
      const order_total_charges =
        order.charges || order.order_level_total_charges;
      // if (typeof order_total_charges === Number) {
      //   order_total_charges = order_total_charges.toFixed(ROUNDOFF_UPTO);
      // } else {
      //   order_total_charges =
      //     Number(order_total_charges).toFixed(ROUNDOFF_UPTO);
      // }
      $('#current-digitalorderdetails-totalcharges').css('display', '');
      $('#current-digitalorderdetails-totalcharges').text(
        `${$.i18n.t('controller:digitalOrderController.charges')}: ${
          currency
        } ${order_total_charges}`,
      );
    } else {
      $('#current-digitalorderdetails-totalcharges').css('display', 'none');
      $('#current-digitalorderdetails-totalcharges').text(
        `${$.i18n.t('controller:digitalOrderController.charges')}: ${
          currency
        } 0`,
      );
    }

    if (order.order_level_total_taxes) {
      let order_total_taxes = order.order_level_total_taxes;
      if (typeof order_total_taxes === Number) {
        order_total_taxes = order_total_taxes.toFixed(ROUNDOFF_UPTO);
      } else {
        order_total_taxes = Number(order_total_taxes).toFixed(ROUNDOFF_UPTO);
      }

      $('#current-digitalorderdetails-totaltax').css('display', '');
      if (order.billing_type === 107) {
        let taxInclusive = false;
        if (
          order.extra_details &&
          order.extra_details.tax &&
          order.extra_details.tax.length
        ) {
          taxInclusive = order.extra_details.tax[0].tax_inclusive;
        }
        $('#current-digitalorderdetails-totaltax').text(
          `${$.i18n.t('controller:digitalOrderController.tax')} ${taxInclusive ? '(Incl.)' : ''}: ${currency} ${
            order_total_taxes
          }`,
        );
      } else {
        $('#current-digitalorderdetails-totaltax').text(
          `${$.i18n.t('controller:digitalOrderController.tax')}: ${currency} ${
            order_total_taxes
          }`,
        );
      }
    } else {
      $('#current-digitalorderdetails-totaltax').css('display', 'none');
      $('#current-digitalorderdetails-totaltax').text(
        `${$.i18n.t('controller:digitalOrderController.tax')}: ${currency} 0`,
      );
    }

    if (order.order_level_discount) {
      let discount = order.order_level_discount;
      if (typeof discount === Number) {
        discount = discount.toFixed(ROUNDOFF_UPTO);
      } else {
        discount = Number(discount).toFixed(ROUNDOFF_UPTO);
      }

      let coupon;
      if (order.coupan_code && order.coupan_calculated_amt) {
        coupon = `(${order.coupan_code})`;
      }
      $('#current-digitalorderdetails-totaldiscount').css('display', '');
      $('#current-digitalorderdetails-totaldiscount').text(
        `${$.i18n.t(
          'controller:digitalOrderController.discount',
        )}${coupon || ''}: ${currency} ${discount}`,
      );
    } else {
      $('#current-digitalorderdetails-totaldiscount').text(
        `${$.i18n.t('controller:digitalOrderController.discount')}: ${
          currency
        } 0`,
      );
      $('#current-digitalorderdetails-totaldiscount').css('display', 'none');
    }

    if (order.order_subtotal) {
      let subtotal = order.order_subtotal;
      if (typeof subtotal === Number) {
        subtotal = subtotal.toFixed(ROUNDOFF_UPTO);
      } else {
        subtotal = Number(subtotal).toFixed(ROUNDOFF_UPTO);
      }
      $('#current-digitalorderdetails-subtotal').css('display', '');
      $('#current-digitalorderdetails-subtotal').text(
        `${$.i18n.t('controller:digitalOrderController.SubTotal')}: ${
          currency
        } ${subtotal}`,
      );
    } else {
      $('#current-digitalorderdetails-subtotal').text(
        `${$.i18n.t('controller:digitalOrderController.SubTotal')}: ${
          currency
        } 0`,
      );
      $('#current-digitalorderdetails-subtotal').css('display', 'none');
    }

    // Check if payment is COD
    if (
      order.tmpos_order_payment != undefined &&
      order.tmpos_order_payment.length > 0 &&
      order.tmpos_order_payment[0] &&
      order.tmpos_order_payment[0].payment_option
    ) {
      const payoption = order.tmpos_order_payment[0].payment_option;

      String(
        ['cod', 'paylater', 'pay later'].includes(
          String(payoption).toLowerCase(),
        ),
      )
        ? $('#updatepaystatDigitalorder').show()
        : $('#updatepaystatDigitalorder').hide();
    } else {
      $('#updatepaystatDigitalorder').hide();
    }
    if (
      [...Object.values(OnlineBillingTypeByName)].includes(order.billing_type)
    ) {
      $('#updatepaystatDigitalorder').hide();
    } else {
      $('#updatepaystatDigitalorder').show();
    }
  }
}
function clearcurrentOrderdetails() {
  // Clear delivery texts
  $('#digitalorderdetails-dboyname-id').text('');
  $('#digitalorderdetails-dboyphone-id').text('');
  $('#digitalorderdetails-dboystate-id').text('');

  // Hide delivery person section completely
  $('.orderdetails-dboyinfo-label').css('visibility', 'hidden');
  $('.orderdetails-person-name-div').css('visibility', 'hidden');
  $('.orderdetails-person-phone-div').css('visibility', 'hidden');
}

/**
 *
 * @param {item to add in row} data
 */
function additemRow(data) {
  // if(data && data.price == 0 && data.total !==0){
  //     let price = data.total / data.quantity;
  //     data.price = price.toFixed(2);
  // }

  let ondc_reject_reason = '';

  data?.extra_details?.return?.map((item) => {
    if (item.reason_code) {
      ondc_reject_reason += `Comment:(${ONDC_REASON_CODES[item.reason_code]?.comment})</br>`;
    }
    ondc_reject_reason += `Qty: ${
      item.quantity
    }</br><label class=${item.status}>${item.status}</label></br>`;
  });
  ondc_reject_reason = ondc_reject_reason || '';
  let { discount } = data;
  if (data.discount && data.discount_type == 1) {
    discount = (data.price * data.quantity * data.discount) / 100;
  }
  const table = $('#digitalorderdetailsTable');
  let { title } = data;
  if (
    window.selectedLanguage !== 'en' &&
    data.extra_details &&
    data.extra_details.alternative_title
  ) {
    title = `${title} (${data.extra_details.alternative_title})`;
  }

  if (
    showAddonsSeperately &&
    data &&
    data.order_child_options &&
    data.order_child_options.length
  ) {
    if (data.extra_details && data.extra_details.baseTitle) {
      title = data.extra_details.baseTitle;
    }

    if (
      window.selectedLanguage !== 'en' &&
      data.extra_details &&
      data.extra_details.alternative_title
    ) {
      title = `${title} (${data.extra_details.alternative_title})`;
    }
    data.order_child_options.forEach((addon) => {
      let optionTitle = addon.option_name || addon.title;
      if (
        window.selectedLanguage !== 'en' &&
        addon.extra_details &&
        addon.extra_details.alternative_title
      ) {
        optionTitle = `${optionTitle} (${addon.extra_details.alternative_title})`;
      }
      title =
        `${title}<br>` +
        `<span class='digitalItemAddons'>${addon.option_qty || addon.qty || 1} x ${optionTitle} </span>`;
    });
  }
  const itemTitle = `<tr ><td>${title}${discount ? `[Discount - ${discount.toFixed(window.ROUNDOFF_UPTO)}]` : ''}`;
  table.append(
    `${
      itemTitle
      // '</br>' +
      // discount +
    }</br>${ondc_reject_reason}</td><td>${data.quantity}</td><td>${
      data.price
    }</td><td>${data.total.toFixed(window.ROUNDOFF_UPTO)}</td>`,
  );
  $('#digitalorderdetailsTable').trigger('rowAddOrRemove');
}

/**
 * Clear the selected order details
 */
function clearcurrentOrderdetails() {
  $('#digitalorderdetails-dboyname-id').text('');
  $('#orderdetails-dboyphone-id').text('');
  $('#digitalorderdetails-dboystate-id').text('');
  $('#digitalorderdetailsTable').find('tr:not(:first)').remove();
  $('#digitalstep-progress-id').empty();
  $('#current-digitalorderdetails-grandTotal').text('');
  $('#current-digitalorderdetails-totaltax').text('');
  $('#current-digitalorderdetails-totalcharges').text('');
  $('#current-digitalorderdetails-totaldiscount').text('');
  $('#digitalorderdetailsTable').attr('order_id', '');
  $('#current-digitalorderdetails-subtotal').text('');
  $('#digitaldeliveryboyCombo,#canceldigitalorderdunzoTaskbuttonid').hide();
  $('#digitaldeliveryboyCombo').prop('selectedIndex', 0);
}

Initialize();
