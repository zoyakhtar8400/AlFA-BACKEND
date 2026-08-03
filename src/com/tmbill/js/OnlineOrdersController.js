// require('../services/SSEService');
const { default: axios } = require('axios');
const { PRINTER_SIZES_REFID } = require('../util/PrintersUtil');
const {
  ACCEPT_BUTTON,
  REJECT_BUTTON,
  DISPATCH_BUTTON,
  FOOD_READY_BUTTON,
  ORDER_COMPLETE_BUTTON,
  ORDER_DETAILS_BUTTON,
  LOAD_MORE_ELEMENT,
  ORDER_PAIDSTATUS,
  RBT_BUTTON,
  DIRECT_COMPLETE,
} = require('./RawButtons');
const { NO_ORDERSFOUND } = require('../util/SVGElements');
const {
  ONLINE_ORDERS_STATE,
  ONLINE_PLATFORMS,
  ORDERS_NAMESTATE,
  ONLINE_ORDER_NAME_STATES,
} = require('../util/OrderStates');
const {
  PRINTBILL_ONORDER_ACCEPT,
  PRINTKOT_ONORDER_ACCEPT,
  PRINTERS,
  SHOW_STORENAME_ONKOT,
  PULLORDER_ONACCEPT,
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  SEPERATE_BILLING_FOR_OL_ORDER,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  SHOW_DIRECT_COMPLETE_BUTTON,
  SHOW_ONLINEORDER_OTP_ON_KOT,
  AUTO_SYNC,
} = require('../util/SettingIDs');
const MESSAGES = require('./RawButtons').generateMessages(window.storeDetails);
const { REJECT_REASON } = require('../util/RejectReason');
const { loadProgressbar } = require('../js/Stepprogress-bar');
const {
  DELIVERY_TYPES,
  ZOMATO_BILLING_FLAG,
  SWIGGY_BILLING_FLAG,
  DOTPE_BILLING_FLAG,
  MAGICPIN_BILLING_FLAG,
  PRINTER_ACTION_TYPES,
} = require('../util/Constants');
const { sendBillsettledevent } = require('./ClientrequestHandler');
const { OrderState, ONLINE_PAYMENT_METHODS } = require('../util/DBUtil');
const {
  SAVE_ONLINEBILL,
  SAVE_ONLINEBILL_REPLY,
  UPDATE_ONLINEDELIVERY_BOY,
  FETCH_KOTBILL_NUMBER,
  FETCH_ASYNC_KOTBILL_NUMBER,
  UPDATE_ONLINEORDER_STATUS_REPLY,
  PRINTERS_IPC,
  ORDER_IPC,
  ONLINEORDER_IPC,
  SYNC_BILL,
} = require('../util/IPC_Messages');
const { default: Swal } = require('sweetalert2');
const { getLocalStorage } = require('../storage');
const { Timer } = require('easytimer.js');
const sumBy = require('lodash/sumBy');
const { initAccesslevelsforonlineorders } = require('./AccesslevelManager');
const {
  iinitializei18nforOnlineordersbuttons,
  initializei18nforOnlineorderswindow,
} = require('./i18nController');
const debounce = require('lodash/debounce');
const { orderCalculations } = require('./calculations');
const { sendOrderpulledupdatetochannel } = require('./Helperfunctions');
const {
  getHeadersforchannelforrender,
} = require('../util/MiscServer.renderer');
const {
  initAccesslevelsforonlineorderssettings,
} = require('./AccesslevelManager');
const { showCountdown } = require('./timer');
const { apiCall } = require('../services/APIService');

window.onlineordersWindowloaded = true;
const formatOrderdate = 'DD MMM YYYY hh:mm A';
let ProgressBar = undefined;
let currentOffset = 0;
let sortFilter = 'newest-orders';
const NEXT_WAIT_TIME = 5;

let LABELPRINTER_FOR_ONLINE = [1, 3];

let stringConstructor = 'test'.constructor;

let orderitemTemplate = undefined;
let currency =
  window.storeDetails != undefined && window.storeDetails.currency
    ? window.storeDetails.currency
    : 'Rs ';

let timer = new Timer();
let showDirectCompleteButton = false;
let autoSyncmode = false;

/**
 * Intialize all the needed components
 */
function Initialize() {
  $('#onlinedeliveryboyCombo').hide();
  $('ul.order-states li i').hide();
  $('#more-filters-divid').hide();
  $('#channellogoutButton').click(function (e) {
    logout_FromChannel();
  });
  $('#printonlinekotButton').click(function (e) {
    generateOnlinekot(false);
  });

  $('#printonlinebillButton').click(function (e) {
    printonelineBill(false);
  });

  $('#storeSettingsbuttonid').click(function (e) {
    openStoresettings();
  });

  $('ul.order-states li').click(function (e) {
    if ($(this).length > 0) {
      $('ul.order-states li i').css('display', 'none');
      let currentItem = $(this).get(0).getAttribute('action-type');
      $(this).find('i').css('display', '');

      if (currentItem == 1) {
        $('#more-filters-divid').css('display', '');
      } else {
        $('#more-filters-divid').css('display', 'none');
      }
    }
  });

  $(
    '#order-states-list-id li,#running-filers-div-id button,#platform-filters-div-id img ',
  ).on('click', function () {
    const currentContext = this;
    filterListener(currentContext);
  });

  // orderitemTemplate = $('OrderItem.html').load();   FinalOrderTemplate NewOrderTemplate
  $.get('FinalOrderTemplate.html', function (data) {
    orderitemTemplate = data;
  });
  initializeStepprogress();

  $('#onlinedeliveryboyCombo').on('change', function () {
    updateOrderdeliveryboydetails();
  });
  $('#pullorderButton').on('click', async function () {
    let selectedBill = $(
      '#onlineorderslistID li.selected-order button.order-details',
    );
    let order_data = $(selectedBill).attr('order_data');
    order_data = JSON.parse(order_data);
    if (order_data.exported_to_tmbill) {
      let pullOrderConfirmation = await Swal.fire({
        title: `${$.i18n.t(
          'controller:swalDataTranslations.OrderisalreadypulledPullagain',
        )}`,
        showConfirmButton: true,
        showCancelButton: true,
        width: '23em',
        allowOutsideClick: true,
        allowEscapeKey: false,
        confirmButtonText: $.i18n.t('controller:homeController.Yes'),
        customClass: {
          popup: 'tmbill-swal-pop-up',
          content: 'tmbill-swal-title-class',
          input: 'tmbill-swal-input2',
        },
      });

      if (pullOrderConfirmation && pullOrderConfirmation.isConfirmed) {
        showPullingoder();
      }
    } else {
      showPullingoder();
    }
  });
  $('#onlineordersSortfilterid').on('change', function () {
    sortFilter = this.value;
  });

  searchListeners();
  addDeliveryboys();
  initializelocalSettings();
  initializei18nforOnlineorderswindow();
  initAccesslevelsforonlineorders({});

  if (window.settingsConfig[SHOW_DIRECT_COMPLETE_BUTTON - 1] != undefined) {
    showDirectCompleteButton =
      window.settingsConfig[SHOW_DIRECT_COMPLETE_BUTTON - 1].value === '1';
  }

  if (window.settingsConfig[AUTO_SYNC - 1] != undefined) {
    autoSyncmode = window.settingsConfig[AUTO_SYNC - 1].value === '1';
  }
}

function searchOrders() {
  const currentFilter = $(`#order-states-list-id li>i:visible:first`);
  if (currentFilter.length === 0) {
    $(`#order-states-list-id li>i:first`).click();
  } else {
    $(currentFilter).click();
  }
}

function searchListeners() {
  $('#onlineordersearchInputid').on('keypress', (e) => {
    if (e.which == 13) {
      searchOrders();
    }
  });
  $('#onlineordersearchButtonid').on(
    'click',
    debounce(() => {
      searchOrders();
    }, 200),
  );

  $('#onlineorderdatefilter').daterangepicker({
    drops: 'down',
    timePicker: true,
    autoUpdateInput: false,
    showDropdowns: true,
    minYear: 1950,
    startDate: moment(),
    locale: {
      format: 'DD MMMM YYYY',
    },
  });
  $('#onlineorderdatefilter').on(
    'apply.daterangepicker',
    function (ev, picker) {
      $(this).val(
        picker.startDate.format('DD MMMM YYYY') +
          ' - ' +
          picker.endDate.format('DD MMMM YYYY'),
      );
      searchOrders();
    },
  );
}

function initializelocalSettings() {
  let settings = getLocalStorage('settings');
  if (settings) {
  }
  if (sortFilter) {
    $(`#onlineordersSortfilterid`).val(sortFilter);
  }
  $(`#sort-order-option-container-id`).hide();
}

window.readdonlineDeliveryboys = function () {
  addDeliveryboys();
};

function addDeliveryboys() {
  $('#onlinedeliveryboyCombo option:gt(0)').remove();
  if (window.deliveryBoyslist) {
    window.deliveryBoyslist.forEach((dboy) => {
      $('<option>')
        .val(dboy.id)
        .text(dboy.name)
        .attr('phone', dboy.phone)
        .appendTo('#onlinedeliveryboyCombo');
    });
  }
}

function updateOrderdeliveryboydetails() {
  Swal.fire({
    title: $.i18n.t('controller:onlineOrderController.updateOrder'),
    text: $.i18n.t(
      'controller:onlineOrderController.updatingDeliveryBoyDetails',
    ),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    // showLoaderOnConfirm: true,
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

/**
 * Sends the updated order delivery boy details to channel
 */
async function sendUpdatedeliveryboyrequest() {
  let selectedBill = $(
    '#onlineorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0) {
    try {
      let order_data = $(selectedBill).attr('order_data');
      order_data = safeJSONParse(order_data);
      let urbanp_orderid = $(selectedBill).attr('order_id');
      let order_id = order_data.json_data.order.details.merchant_ref_id;
      let store_id = order_data.json_data.order.store.merchant_ref_id;
      let postData = {
        delivery_boy_name: $('#onlinedeliveryboyCombo option:selected').html(),
        delivery_boy_mobile: $('#onlinedeliveryboyCombo option:selected').attr(
          'phone',
        ),
        urbanp_orderid,
        store_ref_id: store_id,
        delivery_boy_status: 'Assigned',
        order_id,
      };

      let options = {
        method: 'POST',
        uri: Config.links.updateriderDetails,
        body: postData,
        json: true,
        rejectUnauthorized: false,
      };
      let response = await request(options);
      if (response && response.status && response.status === '200') {
        order_data.deliveryperson_name = postData.delivery_boy_name;
        order_data.deliveryperson_phone = postData.delivery_boy_mobile;
        order_data.deliveryperson_current_state = postData.delivery_boy_status;
        let deliveryboyInfo =
          order_data.deliveryperson_name +
          '|' +
          order_data.deliveryperson_phone +
          '|' +
          order_data.deliveryperson_current_state;

        if (deliveryboyInfo) {
          $('#onlineorderslistID li.selected-order')
            .find('#list-order-dboydetailsdiv-id')
            .show();
          $('#onlineorderslistID li.selected-order')
            .find('#list-order-dboydetailslabel-id')
            .html(deliveryboyInfo);
        } else {
          $('#onlineorderslistID li.selected-order')
            .find('#list-order-dboydetailsdiv-id')
            .hide();
        }

        $('#orderdetails-dboyname-id').text(order_data.deliveryperson_name);
        $('#orderdetails-dboyphone-id').text(order_data.deliveryperson_phone);
        $('#orderdetails-dboystate-id').text(
          'State: ' + order_data.deliveryperson_current_state,
        );

        $(selectedBill).attr('order_data', JSON.stringify(order_data));

        ipcRenderer.send(UPDATE_ONLINEDELIVERY_BOY, JSON.stringify(postData));
        window.notifyUser.showMessage(
          'success',
          $.i18n.t('controller:onlineOrderController.deliveryBoyUpdated'),
        );
      } else {
        Swal.close();
      }
    } catch (error) {
      console.log(error);
      Swal.close();
    }
  }
}
/**
 * Open store settings window
 */
function openStoresettings() {
  if (window.openstoreScriptloaded) {
    // initAccesslevelsforonlineorderssettings()
    $('#onlinesettingsModal').modal('show');
  } else {
    $('#onlinesettingsModalBodyid').load(
      'OnlinestoreSettings.html',
      async function () {
        // initAccesslevelsforonlineorderssettings()
        $('#onlinesettingsModal').modal('show');
      },
    );
  }
}

async function generatePreviewdetails(silentPrint, providedOrderdata) {
  try {
    let order_data;
    if (providedOrderdata) {
      order_data = providedOrderdata;
    } else {
      let selectedBill = $(
        '#onlineorderslistID li.selected-order button.order-details',
      );
      if (selectedBill.length == 0) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineOrderController.pleaseSelectOrder'),
        );
        return;
      }
      order_data = $(selectedBill).attr('order_data');
    }
    if (order_data) {
      order_data = safeJSONParse(order_data);
      if (
        !order_data ||
        !order_data.json_data ||
        !order_data.json_data.order ||
        !order_data.json_data.order.details
      ) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineOrderController.invalidDetails'),
        );
        return;
      }
      let order_state = order_data.order_state;
      if (!silentPrint && order_state && order_state == 'Placed') {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineOrderController.acceptTheOrderFirst'),
        );
        return;
      }

      let items = [];
      if (order_data != undefined && order_data.constructor == Object) {
        let bill_number = undefined;
        let customDate = $('#onlineorderslistID li.selected-order')
          .find('#list-order-item-date-label-id')
          .html()
          ? $('#onlineorderslistID li.selected-order')
              .find('#list-order-item-date-label-id')
              .html()
          : moment(order_data.json_data.order.details.created).format(
              formatOrderdate,
            );
        let itemaggregatorTaxtoremove = 0;
        let orderaggregatorTaxtoremove = 0;
        let orderchargesaggregatorTaxtoremove = 0;
        let itemchargeaggregatorTaxtoremove = 0;
        let order_level_discount = 0;
        let total_external_discount = 0;
        let item_level_discount = 0;

        if (
          order_data.json_data != undefined &&
          order_data.json_data.order != undefined &&
          order_data.json_data.order.details != undefined &&
          order_data.json_data.order.items != undefined &&
          order_data.json_data.order.items.length > 0
        ) {
          let overallorderDetails = order_data.json_data.order;
          let orderdetails = order_data.json_data.order.details;

          order_level_discount = orderdetails.discount;
          total_external_discount = orderdetails.total_external_discount;

          bill_number = orderdetails.merchant_ref_id;
          let istax_dividable = 0;
          let taxName = window.currentTaxname;
          overallorderDetails.items.forEach((element) => {
            let tempItem = {};
            tempItem.item_price = Number(Number(element.price).toFixed(2));
            tempItem.title = element.title;
            tempItem.amount = element.total;
            tempItem.quantity = element.quantity;
            tempItem.total_with_tax = element.total_with_tax;
            if (element.price == 0) {
              tempItem.item_price = '-';
            }

            if (element.taxes != undefined && element.taxes.length > 0) {
              let taxinfo = element.taxes[0];
              if (taxinfo != undefined && taxinfo.liability_on === 'merchant') {
                tempItem.item_tax_value = taxinfo.value ? taxinfo.value : 0;
                tempItem.item_is_devidable = 0;
                tempItem.item_tax_method = taxinfo.title;
                tempItem.item_tax_per = taxinfo.rate;
                istax_dividable = tempItem.is_devidable = 0;
                taxName = taxinfo.title;
              }

              itemaggregatorTaxtoremove =
                itemaggregatorTaxtoremove +
                getaggregatorTaxtoremove(element.taxes);
            }
            //Add default option group
            if (window.defaultparentGroup) {
              tempItem.product_group_id = window.defaultparentGroup.id;
              tempItem.product_group_name =
                window.defaultparentGroup.product_group_name;
            }

            // Check if item has options
            if (element.options_to_add && element.options_to_add.length) {
              const optionsPrice = element.options_to_add.reduce(
                (a, b) => a + (b.price || 0),
                0,
              );
              tempItem.item_price = optionsPrice;
            }

            // if (element.total_with_tax === 0) {
            //     tempItem.item_price = 0;
            //     tempItem.amount = 0;
            // }

            if (element.discount > 0) {
              item_level_discount =
                item_level_discount + Number(element.discount);
            }

            if (element.charges && element.charges.length) {
              let itemlevelCharges = [];
              for (const currentitemcharge of element.charges) {
                itemlevelCharges.push({
                  amount: Number(currentitemcharge.value),
                  calculate_tax_for_item_charges: 0,
                  per_or_fixed: 0,
                  title: currentitemcharge.title,
                });
                itemchargeaggregatorTaxtoremove =
                  itemchargeaggregatorTaxtoremove +
                  getaggregatorTaxtoremove(currentitemcharge.taxes);
              }
              Object.assign(tempItem, {
                itemlevelCharges,
              });
            }
            items.push(tempItem);
          });

          if (order_level_discount > 0) {
            order_level_discount =
              order_level_discount - total_external_discount;

            if (item_level_discount) {
              // order_level_discount = order_level_discount - item_level_discount;
            }
          }

          let deliveryBy = undefined;
          let delivery_type = undefined;
          if (
            overallorderDetails.details.ext_platforms &&
            overallorderDetails.details.ext_platforms.length > 0 &&
            overallorderDetails.details.channel
          ) {
            let platforms = overallorderDetails.details.ext_platforms[0];
            deliveryBy = getDeliveryType(
              overallorderDetails.details.channel,
              platforms.delivery_type,
            );
            delivery_type = platforms.delivery_type;
          }

          let payMode = '';
          if (
            overallorderDetails.payment != undefined &&
            overallorderDetails.payment.length > 0
          ) {
            if (overallorderDetails.payment.length > 1) {
              payMode = 'Split';
            } else {
              if (
                overallorderDetails.payment[0] != undefined &&
                overallorderDetails.payment[0].option != undefined
              ) {
                payMode = overallorderDetails.payment[0].option;
                if (ONLINE_PAYMENT_METHODS.includes(payMode)) {
                  payMode = 'Online Paid';
                }
                if (
                  delivery_type &&
                  String(payMode).toLowerCase() === 'cash' &&
                  (delivery_type === DELIVERY_TYPES.PICKUP ||
                    delivery_type === DELIVERY_TYPES.SELF)
                ) {
                  payMode = 'Online COD';
                }
              }
            }
          }

          let customer = undefined;
          let showotponBill = '';
          if (
            order_data.json_data.customer &&
            order_data.json_data.customer.name
          ) {
            customer = {
              name: order_data.json_data.customer.name,
              phone: order_data.json_data.customer.phone,
            };
            if (order_data.json_data.customer.address) {
              customer.address_line1 =
                order_data.json_data.customer.address.line_1;
              customer.address_line2 =
                order_data.json_data.customer.address.line_2;
            }
            //GET THE OTP
            let phone = String(order_data.json_data.customer.phone);
            if (
              phone &&
              phone.length >= 4 &&
              String(orderdetails.channel).toLowerCase() ===
                String(ONLINE_PLATFORMS.ZOMATO).toLowerCase()
            ) {
              showotponBill = 'OTP:' + phone.substr(phone.length - 4);
            }
          }
          let extdeliveryBoy = undefined;

          if (
            order_data.deliveryperson_name &&
            order_data.deliveryperson_phone
          ) {
            extdeliveryBoy = {};
            extdeliveryBoy.name = order_data.deliveryperson_name;
            extdeliveryBoy.phone = order_data.deliveryperson_phone;
          }

          let overrideStorename = undefined;
          if (
            order_data.json_data.order != undefined &&
            order_data.json_data.order.store != undefined
          ) {
            overrideStorename = order_data.json_data.order.store.name;
          }

          // Get bill number
          const savedBillnumber = await betteripcRenderer.callMain(
            ORDER_IPC.GET_BILL_NUMBER,
            { order_id: bill_number },
          );

          // Calculate order level aggregator tax
          orderaggregatorTaxtoremove = getaggregatorTaxtoremove(
            orderdetails.taxes,
          );

          if (
            orderdetails.charges &&
            Array.isArray(orderdetails.charges) &&
            orderdetails.charges.length
          ) {
            for (const currentCharge of orderdetails.charges) {
              orderchargesaggregatorTaxtoremove =
                orderchargesaggregatorTaxtoremove +
                getaggregatorTaxtoremove(currentCharge.taxes);
            }
          }

          let onlinetaxesTotal = Number(orderdetails.total_taxes || 0);
          let total_aggregator_tax =
            itemaggregatorTaxtoremove +
            orderaggregatorTaxtoremove +
            itemchargeaggregatorTaxtoremove +
            orderchargesaggregatorTaxtoremove;

          onlinetaxesTotal = onlinetaxesTotal - total_aggregator_tax;

          let previewDetails = {
            bill_number,
            tableName: orderdetails.channel ? orderdetails.channel : 'Online',
            discount: order_level_discount,
            discount_type: 0,
            tax_name: taxName ? taxName : window.currentTaxname,
            istax_dividable: istax_dividable,
            items: items,
            onlinediscounttoApply: order_level_discount || 0,
            isOnlinebill: true,
            onlinechargesTotal: orderdetails.order_level_total_charges || 0,
            showCustomerinfo: true,
            payment_mode: payMode,
            onlinetaxesTotal: onlinetaxesTotal,
            customer,
            showotponBill,
            extdeliveryBoy,
            deliveryBy,
            overrideStorename,
            customDate,
            total_aggregator_tax,
            total_external_discount,
          };
          if (savedBillnumber) {
            Object.assign(previewDetails, { order_id: savedBillnumber });
          } else {
            Object.assign(previewDetails, { order_id: undefined });
          }
          return {
            previewDetails,
            merchant_ref_id: order_data.json_data.order.store.merchant_ref_id,
          };
        }
      }
    }
  } catch (error) {
    console.error(error);
    console.error(
      `Message="Error occured while generating preview details for online order"`,
    );
  }
  return {
    previewDetails: {},
    merchant_ref_id: undefined,
  };
}

/**
 *  Prints the bill
 * @param {*} silentPrint
 */
async function printonelineBill(silentPrint, order_data) {
  let selectedBill = $(
    '#onlineorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0 || order_data) {
    let { previewDetails, merchant_ref_id } = await generatePreviewdetails(
      silentPrint,
      order_data,
    );
    let pageConfig = await setPageconfigifany();
    if (pageConfig && pageConfig.margins) {
      previewDetails.pageConfig = pageConfig;
      pageconfigProvided = true;
    } else {
      pageconfigProvided = false;
    }
    if (window.previewscriptLoaded) {
      $('#previewBodyid').data('data', previewDetails);
      await showPreview();
    } else {
      $('#previewBodyid').data('data', previewDetails);
    }

    let printerIndex = getOnlineOrderPrinterIndex();
    sendPrintbillrquest({
      merchant_ref_id,
      defaultPrinter: printerIndex,
    });
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:onlineOrderController.pleaseSelectOrder'),
    );
  }
}

//for online order printer index
function getOnlineOrderPrinterIndex() {
  let onlinePrinterindex = PRINTERS.DINEIN_BILL;
  let onlinePrinter = _.findIndex(window.printersList, { action_type: 12 });
  if (onlinePrinter > 0) {
    onlinePrinterindex = onlinePrinter + 1;
  }
  return onlinePrinterindex;
}

/**
 * Selects the current bill printer and sends the print
 * request
 */
function sendPrintbillrquest({ merchant_ref_id, defaultPrinter }) {
  if (
    window.printersList != undefined &&
    window.printersList.length >= PRINTERS.DINEIN_BILL
  ) {
    let printerIndex =
      getPrinterbyStoreid({
        defaultPrinter,
        merchant_ref_id,
        subLabel: 'Bill',
      }) || PRINTERS.DINEIN_BILL;
    let deviceName = window.printersList[printerIndex - 1].device_name
      ? window.printersList[printerIndex - 1].device_name
      : '';
    let copies = window.printersList[printerIndex - 1].no_of_prints;
    let size = window.printersList[printerIndex - 1].printer_size;
    // let activate = window.printersList[PRINTERS.DINEIN_BILL - 1].activate;
    let showLogo = window.hotelogoFilepath && window.showhotelLogoonbill;

    let printData;
    if (deviceName != undefined) {
      printData = {
        content: $('#previewBodyid').html(),
        deviceName,
        silent: true,
        copies,
        size,
        type: 2,
        pageconfigProvided,
        showLogo,
      };
    } else {
      printData = {
        content: $('#previewBodyid').html(),
        deviceName: '',
        silent: true,
        type: 2,
        pageconfigProvided,
      };
    }
    betteripcRenderer.callMain(PRINTERS_IPC.PRINT_WINDOW_AYNC, printData);
  }
}

/**
 * Prints KOT
 * @param {*} silentPrint
 */
async function generateOnlinekot(silentPrint, orderData) {
  let selectedBill = $(
    '#onlineorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0 || orderData) {
    // let order_data = $(selectedBill).attr('order_data');
    let order_data;
    if (orderData) {
      order_data = orderData;
    } else {
      order_data = $(selectedBill).attr('order_data');
    }
    if (order_data != undefined) {
      order_data = safeJSONParse(order_data);
    }
    if (
      !order_data ||
      !order_data.json_data ||
      !order_data.json_data.order ||
      !order_data.json_data.order.details
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:onlineOrderController.invalidDetails'),
      );
      return;
    }
    let order_state = order_data.order_state;
    if (!silentPrint && order_state && order_state === 'Placed') {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:onlineOrderController.acceptTheOrderFirst'),
      );
      return;
    }
    let order = order_data.json_data.order;

    let orderDetails = order_data.json_data.order.details;
    let note = '';
    if (orderDetails.instructions) {
      let rawInstruction = orderDetails.instructions;
      try {
        rawInstruction = String(rawInstruction).split('|');
        rawInstruction.forEach((instruction) => {
          if (
            String(instruction).toLowerCase().includes('order instructions :::')
          ) {
            note = String(instruction).replace('Order Instructions :::', '');
          } else if (
            !String(instruction)
              .toLowerCase()
              .includes('address instructions :::')
          ) {
            note += instruction;
          }
        });
      } catch (error) {}
    }

    //get the storename
    //Check if the store name is to be printed
    //on KOT or not
    let showStorenamonkot = undefined;
    let showOnlineOrderOtpOnKot = undefined;
    if (
      order_data.json_data.order != undefined &&
      window.settingsConfig[SHOW_STORENAME_ONKOT - 1] != undefined
    ) {
      let status = window.settingsConfig[SHOW_STORENAME_ONKOT - 1].value == '1';
      if (status) {
        showStorenamonkot = order_data.json_data.order.store.name;
      }
    }

    if (
      order_data.json_data.order != undefined &&
      window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_KOT - 1] != undefined
    ) {
      showOnlineOrderOtpOnKot =
        window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_KOT - 1].value == '1';
    }

    //show otp on kot print
    let extPlatform = order.details.ext_platforms;
    let otp;
    if (
      extPlatform &&
      extPlatform[0].id &&
      String(order.details.channel).toLowerCase() ===
        String(ONLINE_PLATFORMS.ZOMATO).toLowerCase()
    ) {
      otp = extPlatform[0].id.substr(extPlatform[0].id.length - 4);
    } else if (
      extPlatform &&
      extPlatform[0].extras &&
      extPlatform[0].extras.swiggy_customer_id &&
      String(order.details.channel).toLowerCase() ===
        String(ONLINE_PLATFORMS.SWIGGY).toLowerCase()
    ) {
      otp = extPlatform[0].extras.swiggy_customer_id.substr(
        extPlatform[0].extras.swiggy_customer_id.length - 4,
      );
    }

    let currentItems = order.items;
    if (currentItems != undefined && currentItems.length > 0) {
      if (currentItems != undefined && currentItems.length > 0) {
        try {
          let isLabelprinter = false;
          let more_info = {};
          let params = {
            items: currentItems,
            tableName: orderDetails.channel,
            order_id: orderDetails.merchant_ref_id,
            kotNote: note,
            forQuickbill: false,
            isLabelprinter,
            more_info,
            showStorenamonkot,
            otp,
            showOnlineOrderOtpOnKot,
          };
          await generateKOTPreview(params);
          sendPrintKOT({
            isLabelprinter,
            merchant_ref_id: order_data.json_data.order.store.merchant_ref_id,
          });

          if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
            printkottoLabelprinter(params);
          }
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:onlineOrderController.noItems'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:onlineOrderController.pleaseSelectOrder'),
    );
  }
}

/**
 * add's options to title
 * @param {Items} items
 */
function addOptionstotitle(items) {
  items.forEach((element) => {
    let options_to_add = '';
    if (
      element.options_to_add != undefined &&
      element.options_to_add.length > 0
    ) {
      options_to_add = element.options_to_add
        .map(function (elem) {
          return elem.title;
        })
        .join(',');
    }
    if (options_to_add) {
      options_to_add = '(' + options_to_add + ')';
    }
    element.baseTitle = element.title;
    element.title = element.title + options_to_add;
    if (window.defaultparentGroup) {
      element.product_group_id = window.defaultparentGroup.id;
      element.product_group_name = window.defaultparentGroup.product_group_name;
    }
  });
}
/**
 * Generates the KOT Preview
 * @param {Parameters} params
 */
async function generateKOTPreview(params) {
  let previewDetails = {
    items: params.items,
    tableName: params.tableName,
    tax_name: '',
    istax_dividable: '',
    kot_type: 'Online KOT',
    username: params.username,
    isLabelprinter: params.isLabelprinter,
    more_info: params.more_info,
    note: params.kotNote,
    order_id: params.order_id,
    otp: params.otp,
    showOnlineOrderOtpOnKot: params.showOnlineOrderOtpOnKot,
  };

  switch (String(params.tableName).toLowerCase()) {
    case 'zomato':
      Object.assign(previewDetails, {
        billingType: ZOMATO_BILLING_FLAG,
      });
      break;
    case 'swiggy':
      Object.assign(previewDetails, {
        billingType: SWIGGY_BILLING_FLAG,
      });
      break;

    case 'dotpe':
      Object.assign(previewDetails, {
        billingType: DOTPE_BILLING_FLAG,
      });
      break;

    case 'magicpin':
      Object.assign(previewDetails, {
        billingType: MAGICPIN_BILLING_FLAG,
      });
      break;

    default:
      break;
  }
  //Check if the store name is to be printed
  //on KOT or not
  if (params.showStorenamonkot != undefined) {
    previewDetails.showStorenamonkot = params.showStorenamonkot;
  }

  if (
    window.tablestatusTagonkotsettings &&
    window.tablestatusTagonkotsettings.showNewordertag &&
    window.tablestatusTagonkotsettings.newOrdertaglabel
  ) {
    previewDetails.tablestatuskotprintTag =
      window.tablestatusTagonkotsettings.newOrdertaglabel;
  }

  if (window.kotpreviewscriptLoaded == true) {
    $('#kotpreviewBodyid').data('data', previewDetails);
    await showkotPreview();
  } else {
    $('#kotpreviewBodyid').data('data', previewDetails);
  }
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
    let printkotFlag = window.printersList[PRINTERS.LABEL - 1].activate === 1;
    if (!printkotFlag) {
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineOrderController.labelPrintIsDisabled'),
        );
      }, 500);
      return true;
    }

    try {
      let current_more_info = JSON.parse(
        window.printersList[PRINTERS.LABEL - 1].more_info,
      );
      if (!current_more_info.width) {
        current_more_info.width = '2';
      }
      params.more_info = current_more_info;
      params.isLabelprinter = true;
      await generateKOTPreview(params);
      sendPrintKOT({ isLabelprinter: true });
    } catch (error) {}
  }
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
    let size = window.printersList[PRINTERS.DINEIN_BILL - 1].printer_size;
    currentPrinter = Number(size);
  }
  if (currentPrinter && window.settingsConfig) {
    let margins = undefined;
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
        let rawmargins = String(margins).split(' ');
        if (rawmargins && rawmargins.length == 2) {
          $('#currentleftMarginlabel').html(rawmargins[0].replace('px', ''));

          if (rawmargins[1]) {
            let currentWidth = Number(rawmargins[1].replace('mm', ''));
            currentSize = Number(currentSize.replace('mm', ''));
            if (currentSize > currentWidth) {
              let widthDecrementcounter = currentSize - currentWidth;
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

    let pageConfig = {
      margins,
    };
    return pageConfig;
  }
}

function getPrinterbyStoreid({ defaultPrinter, merchant_ref_id, subLabel }) {
  let index = defaultPrinter;
  if (window.printersList != undefined && window.printersList.length >= 0) {
    let printers = _.filter(
      window.printersList,
      ['action_type', PRINTER_ACTION_TYPES.ONLINE_STOREWISE_PRINTER],
      7,
    );
    if (printers && printers.length > 0) {
      printers.forEach((element) => {
        if (element.more_info) {
          if (element.more_info.constructor === 'test'.constructor) {
            element.more_info = JSON.parse(element.more_info);
          }
          if (
            element.more_info.selectedPrintertype &&
            element.more_info.merchant_ref_id === merchant_ref_id &&
            element.more_info.selectedPrintertype === subLabel
          ) {
            index = _.findIndex(window.printersList, { id: element.id });
            if (index < 0) index = defaultPrinter - 1;
            index++;
          }
        }
      });
    }
  } else {
    index = PRINTERS.ONLINE_KOT;
  }
  return index;
}

/**
 * Send's print kot request
 */
async function sendPrintKOT({ isLabelprinter, merchant_ref_id }) {
  let printData;
  let PRINTERNAME = isLabelprinter
    ? PRINTERS.LABEL
    : getPrinterbyStoreid({
        defaultPrinter: 8,
        merchant_ref_id,
        subLabel: 'KOT',
      });
  let printkotFlag = true;
  let forKOTPrint = true;

  if (
    window.printersList != undefined &&
    window.printersList.length >= PRINTERNAME
  ) {
    printkotFlag = window.printersList[PRINTERNAME - 1].activate == 1;
    if (!printkotFlag) {
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineOrderController.KOTPrintIsDisabled'),
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
 * Logout channel user and open order window
 */
function logout_FromChannel() {
  clearorderDetails();
  $('#onlineorderslistID').empty();
  window.channelloginSuccess = false;
  if (window.storeSettings != undefined) {
    window.storeSettings.channelloginDone = false;
    window.storeSettings.channelloginDetails = {};
    ipcRenderer.send(
      'update-store-settings',
      JSON.stringify(window.storeSettings),
    );
  }
  openwindowFromremote('order');
}

/**
 * listener
 * @param {Filter type} filter
 */
function filterListener(filter) {
  let order_type = $(filter).attr('action-type');
  let is_platform_filter = $(filter).attr('is_platform_filter');
  let shouldappendOrders = $(filter).attr('append_orders');
  let online_action = '';
  let appendOrders = false;
  if (shouldappendOrders != undefined && shouldappendOrders) {
    appendOrders = true;
  }

  if (is_platform_filter) {
    let parent = $('ul.order-states li i:visible').parent();
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
  if (order_type) {
    Swal.fire({
      title: $.i18n.t('controller:onlineOrderController.fetchingOrders'),
      text: $.i18n.t(
        'controller:onlineOrderController.hangOnThereSitBackAndRelaxWhileWeFetchYourOrders',
      ),
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      // showLoaderOnConfirm: true,
      didOpen: () => {
        Swal.showLoading();
        fetchOrders(
          '' + order_type,
          '' + online_action,
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
/**
 * Creates a new order from a template and from order details
 * @param {Order to be displayed} order
 */
async function createOrder(order) {
  if (orderitemTemplate != undefined && order.constructor == Object) {
    let temp = orderitemTemplate;

    if (
      order &&
      order.json_data &&
      order.json_data.constructor === stringConstructor
    ) {
      try {
        order.json_data = JSON.parse(order.json_data);
      } catch (error) {
        console.error(error);
        order.json_data = String(order.json_data).replaceAll('\\', ``);
        if (!String().includes(`"instructions":""`)) {
          const instructionIndex =
            order.json_data.lastIndexOf(`"instructions":`);
          const subStringafterinstruction = order.json_data.substring(
            instructionIndex,
            String(order.json_data).length,
          );
          const indexofInstructionend = subStringafterinstruction.indexOf(`",`);
          const oldInstruction = String(order.json_data).substring(
            instructionIndex,
            instructionIndex + indexofInstructionend,
          );
          let newInstruction = String(oldInstruction).replace(
            `"instructions": "`,
            '',
          );
          newInstruction = newInstruction.replaceAll(`"`, `\\\"`);
          order.json_data = String(order.json_data).replace(
            `${oldInstruction}"`,
            `"instructions":"${newInstruction}"`,
          );
        }
        order.json_data = safeJSONParse(order.json_data);
      }
    }
    if (
      order.json_data != undefined &&
      order.json_data.order != undefined &&
      order.json_data.order.details != undefined
    ) {
      let currentOrder = order.json_data.order;
      let currentOrderdetails = order.json_data.order.details;
      let store_id = undefined;

      let paidStatus = false;
      let instructions = currentOrderdetails.instructions;

      let listItem = $(
        '<li class="list-group-item list-order-item" id="onlineorder-list-item">' +
          temp +
          '</li>',
      )
        .attr('order-id', currentOrderdetails.id)
        .attr('merchant_ref_id', currentOrderdetails.merchant_ref_id);

      $(listItem).find('#list-order-item-actions-div-id').empty();

      if (order.json_data.order.store != undefined) {
        store_id = order.json_data.order.store.merchant_ref_id;
        $(listItem)
          .find('#list-order-storenameid')
          .text(order.json_data.order.store.name);
      } else {
        $(listItem).find('#list-ordertitle-container-id').hide();
      }

      if (order.order_state != undefined) {
        $(listItem)
          .find('#list-order-item-status-label-id')
          .text(order.order_state);
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

      let icon = '';
      let platform = order.json_data.order.details.ext_platforms[0].name;

      switch (platform) {
        case 'zomato':
          // icon = 'https://backoffice.tmbill.in/public/images/transparent/zomato.png';
          icon = 'https://cdn.tmbill.com/channel/zomato.png';
          break;

        case 'swiggy':
          icon =
            'https://backoffice.tmbill.com/public/images/transparent/swiggy.png';
          break;

        case 'dotpe':
          icon = 'https://cdn.tmbill.com/channel/dotpe.png';
          break;

        case 'magicpin':
          icon = 'https://cdn.tmbill.com/channel/magicpin.png';
          break;

        default:
          icon = '';
      }

      if (order.icon && currentOrderdetails.channel) {
        $(listItem)
          .find('#list-order-item-channel-img')
          .attr('src', icon)
          .attr('alt', currentOrderdetails.channel);
      }
      if (currentOrderdetails.merchant_ref_id) {
        $(listItem)
          .find('#list-order-item-id-label-id')
          .attr('title', 'Order ID:' + currentOrderdetails.merchant_ref_id)
          .text('O.ID:' + currentOrderdetails.merchant_ref_id);
      }
      if (currentOrderdetails.created) {
        let formattedDate = moment(currentOrderdetails.created).format(
          formatOrderdate,
        );
        $(listItem)
          .find('#list-order-item-date-label-id')
          .attr('title', formattedDate)
          .text(formattedDate);
      }

      //Add the delivery type
      let delivery_type = undefined;
      if (
        currentOrderdetails.ext_platforms &&
        currentOrderdetails.ext_platforms.length > 0 &&
        currentOrderdetails.channel
      ) {
        let platforms = currentOrderdetails.ext_platforms[0];
        let type = getDeliveryType(
          currentOrderdetails.channel,
          platforms.delivery_type,
        );
        delivery_type = platforms.delivery_type;
        if (type) {
          $(listItem).find('#list-order-deliverytype-labelid').text(type);
          $(listItem).find('#list-order-deliverytype-labelid').show();
        } else {
          $(listItem).find('#list-order-deliverytype-labelid').hide();
        }
      } else {
        $(listItem).find('#list-order-deliverytype-labelid').hide();
      }

      if (currentOrderdetails.order_total) {
        let order_total = currentOrderdetails.order_total;
        if (typeof order_total == Number) {
          order_total = order_total.toFixed(2);
        } else {
          order_total = Number(order_total).toFixed(2);
        }
        order_total = currency + ' ' + order_total;
        if (currentOrder.payment && currentOrder.payment.length > 0) {
          order_total = order_total + ' (';
          let payments = currentOrder.payment
            .map(function (elem) {
              return elem.option;
            })
            .join(',');
          if (ONLINE_PAYMENT_METHODS.includes(payments)) {
            payments = 'Online Paid';
            paidStatus = true;
          }

          if (
            delivery_type &&
            String(payments).toLowerCase() === 'cash' &&
            (delivery_type === DELIVERY_TYPES.PICKUP ||
              delivery_type === DELIVERY_TYPES.SELF)
          ) {
            payments = 'Online COD';
            paidStatus = false;
          }

          order_total = order_total + payments + ') ';
        }

        // currentOrder
        $(listItem).find('#list-order-item-amount-label-id').text(order_total);
      }
      let checkforRbtemp =
        String(currentOrderdetails.channel).toLowerCase() ===
        String(ONLINE_PLATFORMS.ZOMATO).toLowerCase();

      let donotaddPaidstatus = false;
      switch (order.order_state) {
        case ONLINE_ORDER_NAME_STATES.PLACED:
          let rejectButton = $(REJECT_BUTTON)
            .attr('order_id', currentOrderdetails.id)
            .attr('store_id', store_id)
            .click(function (e) {
              updateOrderstatus(this);
            });
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(rejectButton);

          let acceptButton = $(ACCEPT_BUTTON)
            .attr('order_id', currentOrderdetails.id)
            .attr('store_id', store_id)
            .click(function (e) {
              updateOrderstatus(this);
            });
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(acceptButton);

          break;
        case ONLINE_ORDER_NAME_STATES.ACKNOWLEDGED:
          let readyButton = $(FOOD_READY_BUTTON)
            .attr('order_id', currentOrderdetails.id)
            .attr('store_id', store_id)
            .click(function (e) {
              updateOrderstatus(this);
            });
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(readyButton);
          checkforRbtemp = true;
          if (showDirectCompleteButton) {
            let directComplete = $(DIRECT_COMPLETE)
              .attr('order_id', currentOrderdetails.id)
              .attr('store_id', store_id)
              .click(function (e) {
                updateOrderstatus(this);
              });
            $(listItem)
              .find('#list-order-item-actions-div-id')
              .append(directComplete);
          }

          break;
        case ONLINE_ORDER_NAME_STATES.FOOD_READY:
          let dispatchButton = $(DISPATCH_BUTTON)
            .attr('order_id', currentOrderdetails.id)
            .attr('store_id', store_id)
            .click(function (e) {
              updateOrderstatus(this);
            });
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(dispatchButton);
          //check if RBT is present
          checkforRbtemp = true;
          break;
        case ONLINE_ORDER_NAME_STATES.DISAPATCHED:
          let completeButton = $(ORDER_COMPLETE_BUTTON)
            .attr('order_id', currentOrderdetails.id)
            .attr('store_id', store_id)
            .click(function (e) {
              updateOrderstatus(this);
            });
          $(listItem)
            .find('#list-order-item-actions-div-id')
            .append(completeButton);
          checkforRbtemp = true;
          break;
        case ONLINE_ORDER_NAME_STATES.COMPLETED:
          checkforRbtemp = false;
          break;
        case ONLINE_ORDER_NAME_STATES.CANCELLED:
          donotaddPaidstatus = true;
          checkforRbtemp = false;
          break;
        default:
          break;
      }
      // checkforRbtemp = true;
      if (checkforRbtemp && order) {
        let rbtButton = $(RBT_BUTTON)
          .attr('title', 'Add ride body temperature')
          .click(function (e) {
            askforriderBodytemp({
              urbanp_orderid: currentOrderdetails.id,
              order_id: currentOrderdetails.merchant_ref_id,
              store_id,
            });
          });
        $(listItem).find('#list-order-item-actions-div-id').prepend(rbtButton);
      }

      if (paidStatus && !donotaddPaidstatus) {
        //Add Paid status button
        let paidButton = $(ORDER_PAIDSTATUS);
        $(listItem).find('#list-order-item-actions-div-id').prepend(paidButton);
      }
      addOptionstotitle(currentOrder.items);
      let orderdetailsButton = $(ORDER_DETAILS_BUTTON)
        .attr('order_id', currentOrderdetails.id)
        .attr('order_data', JSON.stringify(order))
        .click(function (e) {
          $('#onlineorderslistID li').removeClass('selected-order');
          $(this).closest('li').addClass('selected-order');
          let orderData = $(this).attr('order_data');
          if (orderData != undefined) {
            showOrderdetails(safeJSONParse(orderData));
          }
        });

      $(listItem)
        .find('#list-order-item-actions-div-id')
        .append(orderdetailsButton);

      if (order.json_data.customer != undefined) {
        if (order.json_data.customer.name) {
          let customerInfo = order.json_data.customer.name;
          if (order.json_data.customer.phone) {
            customerInfo =
              customerInfo + ' (' + order.json_data.customer.phone + ')';
          }
          $(listItem)
            .find('#list-order-item-username-label-id')
            .text(customerInfo);
        }

        //GET THE OTP
        let phone = String(order.json_data.customer.phone);
        if (
          phone &&
          phone.length >= 4 &&
          String(currentOrderdetails.channel).toLowerCase() ===
            String(ONLINE_PLATFORMS.ZOMATO).toLowerCase()
        ) {
          $(listItem)
            .find('#list-order-item-otp')
            .text('OTP:' + phone.substr(phone.length - 4));
        }

        let extPlatform = order.json_data.order.details.ext_platforms;

        if (
          extPlatform &&
          extPlatform[0].id &&
          String(currentOrderdetails.channel).toLowerCase() ===
            String(ONLINE_PLATFORMS.ZOMATO).toLowerCase()
        ) {
          $(listItem)
            .find('#list-order-item-otp')
            .text(
              'OTP:' + extPlatform[0].id.substr(extPlatform[0].id.length - 4),
            );
        } else if (
          extPlatform &&
          extPlatform[0].extras &&
          extPlatform[0].extras.swiggy_customer_id &&
          String(currentOrderdetails.channel).toLowerCase() ===
            String(ONLINE_PLATFORMS.SWIGGY).toLowerCase()
        ) {
          $(listItem)
            .find('#list-order-item-otp')
            .text(
              'OTP:' +
                extPlatform[0].extras.swiggy_customer_id.substr(
                  extPlatform[0].extras.swiggy_customer_id.length - 4,
                ),
            );
        }

        let orderAddress = order.json_data.customer.address;
        if (orderAddress != undefined && orderAddress.constructor == Object) {
          let address = '';
          if (orderAddress.line_1) {
            address = address + orderAddress.line_1;
          }
          if (order.json_data.customer.address.line_2) {
            address = address + orderAddress.line_2;
          }
          if (order.json_data.customer.address.sub_locality) {
            address = address + orderAddress.sub_locality;
          }

          $(listItem)
            .find('#list-order-item-address-label-id')
            .text(address)
            .prop('title', address);
        }
      }

      // Add delivery boy info
      let deliveryboyInfo = '';
      if (order.deliveryperson_name) {
        deliveryboyInfo = order.deliveryperson_name + ' | ';
      }
      if (order.deliveryperson_phone) {
        deliveryboyInfo = deliveryboyInfo + order.deliveryperson_phone + ' | ';
      }

      if (order.deliveryperson_current_state) {
        deliveryboyInfo = deliveryboyInfo + order.deliveryperson_current_state;
      }

      if (deliveryboyInfo) {
        $(listItem).find('#list-order-dboydetailsdiv-id').show();
        $(listItem)
          .find('#list-order-dboydetailslabel-id')
          .html(deliveryboyInfo);
      } else {
        $(listItem).find('#list-order-dboydetailsdiv-id').hide();
      }

      $('#onlineorderslistID').append(listItem);
    } else {
      console.log('Invalid data');
    }
  }
}

async function askforriderBodytemp({ order_id, urbanp_orderid, store_id }) {
  const description = $.i18n.t('controller:onlineOrderController.Note');
  const result = await Swal.fire({
    title: $.i18n.t(
      'controller:onlineOrderController.covid19SafetyRiderBodyTemperature',
    ),
    html: `<div class= 'rbt-popup-container' >
            <h6>${description}</h6>
            <input type="text" placeholder="Rider body temperature" id="swal-input1" >
            <label class='masklabel'>Is rider wearing mask?</label>
            <label class="switch">
              <input id="swalridermaskswitchcheckId" type="checkbox" checked>
              <span class="slider round"></span>
            </label>
            </div>`,
    // width: '23em',
    reverseButtons: true,
    text: description,
    // inputValue: inputValue,
    showCancelButton: true,
    confirmButtonText: 'Add',
    preConfirm: () => {
      let value = document.getElementById('swal-input1').value;

      if (!value || isNaN(value) || Number(value) == 0) {
        Swal.showValidationMessage('Invalid temperature');
        return $.i18n.t('controller:onlineOrderController.invalidTemperature');
      }
      return {
        temperature: value,
        wearingMask: $('#swalridermaskswitchcheckId').is(':checked'),
      };
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-content-class tmbill-swal-number-content-class',
    },
  });

  if (result && result.isConfirmed && result.value.temperature && order_id) {
    Swal.fire({
      title: $.i18n.t('controller:onlineOrderController.updateOrder'),
      text: $.i18n.t('controller:onlineOrderController.updatingOrderStatus'),
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      // showLoaderOnConfirm: true,
      didOpen: async () => {
        Swal.showLoading();
        await sendOrderrbtupdate({
          action: 'rider_body_temp',
          rider_body_temp: Number(result.value.temperature),
          temp: Number(result.value.temperature),
          order_id,
          urbanp_orderid,
          store_id,
        });
        await sendOrderrbtupdate({
          action: 'rider_with_mask',
          wearing_mask: result.value.wearingMask,
          order_id,
          urbanp_orderid,
          store_id,
        });
      },
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
      },
    });
  }
}

async function sendOrderrbtupdate({
  action,
  order_id,
  rider_body_temp,
  phone,
  urbanp_orderid,
  store_id,
  wearing_mask,
}) {
  try {
    let options = {
      method: 'POST',
      uri: Config.links.updateZomatorbt,
      body: { action, order_id, rider_body_temp, phone, wearing_mask },
      json: true,
      headers: {
        Authorization: 'apikey ' + window.ordersAPIKey,
      },
      rejectUnauthorized: false,
    };
    let uprequestResponse = await request(options);
    if (uprequestResponse) {
      if (uprequestResponse.status === 'success' && rider_body_temp) {
        //Update tmchannel db
        let postData = {
          rbt_temprature: rider_body_temp,
          order_id,
          urbanp_orderid,
          store_ref_id: store_id,
          store_id,
        };
        try {
          let axiosResponse = await apiCall.post(
            Config.links.updateriderDetails,
            postData,
            {
              headers: getHeadersforchannelforrender(),
            },
          );
          const response = axiosResponse.data;
          if (response && response.response.status === '200') {
            ipcRenderer.send(
              UPDATE_ONLINEDELIVERY_BOY,
              JSON.stringify(postData),
            );
          }
        } catch (error) {}
        window.notifyUser.showMessage('success', uprequestResponse.message);
      } else {
        window.notifyUser.showMessage(
          'error',
          uprequestResponse.message
            ? uprequestResponse.message
            : $.i18n.t('controller:onlineOrderController.somethingWentWrong'),
        );
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:onlineOrderController.somethingWentWrong'),
      );
    }
    // Swal.close();
  } catch (error) {
    console.log(error);
    if (error && error.message) {
      window.notifyUser.showMessage('error', error.message);
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:onlineOrderController.somethingWentWrong'),
      );
    }
  }
}

/**
 * Generate the delivery type info
 * @param {CHannel} channel
 * @param {TYpe of pickup} type
 */
function getDeliveryType(channel, type) {
  let text = undefined;
  switch (type) {
    case DELIVERY_TYPES.PICKUP:
      text = $.i18n.t('controller:onlineOrderController.pickupByCustomer');
      break;
    case DELIVERY_TYPES.SELF:
      text = $.i18n.t('controller:onlineOrderController.deliveryByRestaurant');
      break;
    case DELIVERY_TYPES.PARTNER:
      text = ` ${$.i18n.t(
        'controller:onlineOrderController.deliveryBy',
      )} ${channel}.`;
      break;
    default:
      break;
  }
  return text;
}

function showPullingoder() {
  Swal.fire({
    title: $.i18n.t('controller:onlineOrderController.Order'),
    text: $.i18n.t('controller:onlineOrderController.pullingOrder'),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      pullordertoLocaldb(undefined, undefined);
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

ipcRenderer.on(UPDATE_ONLINEORDER_STATUS_REPLY, async (event, content) => {
  if (content && content.order_id) {
    if (
      $(`#onlineorderslistID li[merchant_ref_id='${content.order_id}']`) &&
      $(`#onlineorderslistID li[merchant_ref_id='${content.order_id}']`).length
    )
      $(
        `#onlineorderslistID li[merchant_ref_id='${content.order_id}']`,
      ).remove();
  }
});

ipcRenderer.on(SAVE_ONLINEBILL_REPLY, (event, status) => {
  if (status) {
    try {
      let response = JSON.parse(status);
      handleBillsavereponse(response);
    } catch (error) {
      console.log(error);
    }
  }
});

async function handleBillsavereponse(response) {
  try {
    if (response.error) {
      if (response.error.parent && response.error.parent.errno === 19) {
        !response.silentPull &&
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:onlineOrderController.alreadyPulled'),
            100,
          );
      }
    }
    if (response.status) {
      if (response.status === 'success') {
        !response.silentPull &&
          window.notifyUser.showMessage(response.status, response.msg);
        sendsilentSyncrequestfromremote();
        if (response.addnewCustomer && response.customer) {
          sendCustomerandaddtoListenerfromremote(response.customer, true);
        }
        sendBillsettledevent(response);
        ipcRenderer.send(FETCH_KOTBILL_NUMBER, undefined);
        if (
          autoSyncmode ||
          window.storeDetails.live_tracking_enabled ||
          window.storeDetails.loyalty_enabled
        ) {
          setTimeout(debouncedSync, 300);
        }
        window.refreshDashboard = true;
        sendOrderpulledupdatetochannel(response);
      } else if (response.status === 'error') {
        window.notifyUser.showMessage('error', response.msg, 100);
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:onlineOrderController.somethingWentWrongWhilePullingOrder',
          ),
          100,
        );
      }
    }
  } catch (error) {}
  if (Swal.isVisible()) {
    Swal.close();
  }
}

function debouncedSync() {
  ipcRenderer.send(
    SYNC_BILL,
    JSON.stringify({ silentSync: true, logout: false }),
  );
}

function safeJSONParse(valuetoParse) {
  try {
    if (valuetoParse && valuetoParse.constructor === stringConstructor) {
      valuetoParse = JSON.parse(valuetoParse);
    }
  } catch (error) {}
  return valuetoParse;
}

/**
 * Pulls the order to the database
 * @param {order data} customOrderdata
 */
async function pullordertoLocaldb(customOrderdata, customorder_id) {
  let order_data = customOrderdata;
  let order_id = customorder_id;
  try {
    //If Order data is not provided then check if the order
    //is selected if yes then extract the order details
    if (!order_data) {
      let selectedBill = $(
        '#onlineorderslistID li.selected-order button.order-details',
      );
      if (selectedBill.length == 0) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineOrderController.selectTheOrderToPull'),
        );
        return;
      }
      order_data = $(selectedBill).attr('order_data');
      order_data = safeJSONParse(order_data);
      order_id = $(selectedBill).attr('order_id');
    }

    console.log(`Message="Prepare the order to pull" OrderID="${order_id}"`);
    let currentState = order_data.order_state;
    if (currentState && currentState == 'Placed') {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:onlineOrderController.acceptTheOrderFirst'),
      );
      return;
    }
    let { previewDetails } = await generatePreviewdetails(true, order_data);
    let calculatedOrderdetails = orderCalculations(previewDetails, {});

    let addnewCustomer = false;
    let channel = undefined;
    let order_total = 0;
    let cust_name = undefined;
    let phone = undefined;
    let address_line1 = undefined;
    let address_line2 = undefined;
    let city = undefined;
    let sub_locality = undefined;
    let table_id = undefined;
    let email = undefined;
    let is_guest_mode = undefined;
    let persons = 1;
    let discount = 0;
    let delivery_type = undefined;
    let instructions = undefined;
    let totalCharges = 0;
    let order_level_total_charges = 0;
    let order_level_total_taxes = 0;
    let item_level_total_charges = 0;
    let order_state = OrderState.FULFILLED;
    let order_subtotal = 0;
    let payment = 'Cash';
    let payment_id = 0;
    let deliveryboy_id = 0;
    let total_external_discount = 0;
    let created_time = undefined;
    let merchant_ref_id = 0;
    let delivery_boy_name = undefined;
    let delivery_boy_phone = undefined;
    let items = [];
    let paymentDetails = [];
    let charges = [];
    let createTablefororder = false;
    let my_order_date = undefined;
    let quantity = 0;
    let itemaggregatorTaxtoremove = 0;
    let orderaggregatorTaxtoremove = 0;
    let orderchargesaggregatorTaxtoremove = 0;
    let itemchargeaggregatorTaxtoremove = 0;
    let item_level_discount = 0;
    let onlineordersextraInfo = {};
    let order_ref_id;

    if (order_data) {
      if (
        order_data.order_state &&
        String(order_data.order_state).toLowerCase() ===
          String(ONLINE_ORDER_NAME_STATES.CANCELLED).toLowerCase()
      ) {
        order_state = OrderState.CANCELLED;
        createTablefororder = false;
      }

      let customer = undefined;
      if (order_data.json_data.customer) {
        customer = order_data.json_data.customer;
        if (customer.phone) {
          let newCustomer = getCustomerforremote(false, customer.phone);
          if (newCustomer == undefined) {
            addnewCustomer = true;
          }
        }
        cust_name = customer.name;
        phone = customer.phone;
        email = customer.email;
        if (customer.address) {
          is_guest_mode = customer.address.is_guest_mode;
          address_line1 = customer.address.line_1;
          address_line2 = customer.address.line_2;
          city = customer.address.city;
          sub_locality = customer.address.sub_locality;
        }
      }

      delivery_boy_phone = order_data.deliveryperson_phone;
      delivery_boy_name = order_data.deliveryperson_name;
      if (order_data.json_data.order) {
        if (order_data.json_data.order.details) {
          let details = order_data.json_data.order.details;
          channel = details.channel;
          if (details.discount) {
            discount = details.discount;
          }
          if (details.total_external_discount) {
            total_external_discount = details.total_external_discount;
          }
          if (discount > 0) {
            discount = discount - total_external_discount;
          }

          order_id = details.merchant_ref_id;
          totalCharges = details.total_charges;
          order_level_total_charges = details.order_level_total_charges;
          item_level_total_charges = details.item_level_total_charges;
          order_level_total_taxes = details.total_taxes;
          order_subtotal = details.order_subtotal;
          order_total = details.order_total;
          instructions = details.instructions;
          created_time = details.created;

          Object.assign(onlineordersextraInfo, {
            order_level_total_taxes: details.order_level_total_taxes,
            item_level_total_taxes: details.item_level_total_taxes,
            payable_amount: details.payable_amount,
            merchant_and_aggregator_tax_total: details.total_taxes,
          });

          if (created_time) {
            my_order_date = moment(created_time).format('YYYY-MM-DD');
          }
          if (details.charges && details.charges.length > 0) {
            details.charges.forEach((element) => {
              charges.push({
                order_id,
                title: element.title,
                value: element.value,
                amount: element.amount,
              });
              orderchargesaggregatorTaxtoremove =
                orderchargesaggregatorTaxtoremove +
                getaggregatorTaxtoremove(element.taxes);
            });
          }

          if (details.ext_platforms && details.ext_platforms.length > 0) {
            let platforms = details.ext_platforms[0];
            delivery_type = details.ext_platforms[0].delivery_type;
          }
          orderaggregatorTaxtoremove = getaggregatorTaxtoremove(details.taxes);
        }
        let rawItems = order_data.json_data.order.items;

        if (rawItems && rawItems.length > 0) {
          for (const item of rawItems) {
            const itemtoAdd = {
              title: item.title,
              item_id: item.merchant_id,
              quantity: item.quantity,
              amount: item.total,
              price: item.price,
              orderMasterId: order_id,
              total: item.total,
              total_with_tax: item.total_with_tax,
              product_group_id: item.product_group_id,
              product_group_name: item.product_group_name,
              discount: item.discount,
              baseTitle: item.baseTitle,
              charges: item.charges || undefined,
            };
            // Check if item has options
            if (item.options_to_add && item.options_to_add.length) {
              const optionsPrice = item.options_to_add.reduce(
                (a, b) => a + (b.price || 0),
                0,
              );
              itemtoAdd.price += optionsPrice;
              itemtoAdd.addons = item.options_to_add;
            }
            if (item.total_with_tax === 0) {
              itemtoAdd.price = 0;
              itemtoAdd.amount = 0;
            }

            if (item.taxes && Array.isArray(item.taxes) && item.taxes.length) {
              const tax_value = sumBy(item.taxes, 'value');
              const pickFirst = sumBy(item.taxes, 'rate');
              Object.assign(itemtoAdd, {
                tax_value,
                tax_name: item.taxes.length > 1 ? 'GST' : item.taxes[0].title,
                tax_per: pickFirst,
                item_tax_method: 1, // add as tax inclusive,
                is_devidable: item.taxes.length > 1 ? 1 : 0,
              });
              itemaggregatorTaxtoremove =
                itemaggregatorTaxtoremove +
                getaggregatorTaxtoremove(item.taxes);
            }

            if (itemtoAdd.discount) {
              Object.assign(itemtoAdd, {
                pricebeforeDiscount: itemtoAdd.price,
                discount_rate: itemtoAdd.discount,
              });
              item_level_discount = item_level_discount + itemtoAdd.discount;
              if (itemtoAdd.total_with_tax > 0) {
                Object.assign(itemtoAdd, {
                  discounted_price:
                    itemtoAdd.total_with_tax - itemtoAdd.discount,
                });
              } else {
                Object.assign(itemtoAdd, {
                  discounted_price: itemtoAdd.total,
                });
              }
            }

            if (
              item.charges &&
              Array.isArray(item.charges) &&
              item.charges.length
            ) {
              for (const currentitemcharge of item.charges) {
                itemchargeaggregatorTaxtoremove =
                  itemchargeaggregatorTaxtoremove +
                  getaggregatorTaxtoremove(currentitemcharge.taxes);
              }
            }

            quantity = quantity + itemtoAdd.quantity;

            // order_data.tmpos_order_child.map((item)=>{
            let posItem = allItemsList.find(
              (o) => o.item_refid == itemtoAdd.item_id,
            );
            if (posItem) {
              Object.assign(itemtoAdd, {
                kitchen_dept: posItem.kitchen_dept,
                short_code: posItem.short_code,
                category_name: posItem['mpos_category.category_name'],
              });
            }
            // });
            items.push(itemtoAdd);
          }
          // if (discount > 0 && item_level_discount) {
          //     discount = discount - item_level_discount;
          // }
        }

        //Check the payment info
        if (
          order_data.json_data.order.payment &&
          order_data.json_data.order.payment.length > 0
        ) {
          let rawPayments = order_data.json_data.order.payment;
          let externalDiscAdded = false;

          rawPayments.forEach((payObject) => {
            //Check if the payment mode is in the online
            // payment list if yes then change the
            //payment name to online
            if (ONLINE_PAYMENT_METHODS.includes(payObject.option)) {
              payObject.option = 'Online Paid';
            }

            //CHekc if the delivery is by restaurant and payment
            //is in cash then change the mode to online COD
            if (
              delivery_type &&
              String(payObject.option).toLowerCase() === 'cash' &&
              (delivery_type === DELIVERY_TYPES.PICKUP ||
                delivery_type === DELIVERY_TYPES.SELF)
            ) {
              payObject.option = 'Online COD';
            }
            let rawPay = {
              order_id,
              amount: payObject.amount,
              payment_option: payObject.option,
            };
            if (!externalDiscAdded) {
              rawPay.amount = rawPay.amount + total_external_discount;
              externalDiscAdded = true;
            }
            paymentDetails.push(rawPay);
            payment = payObject.option;
          });

          if (rawPayments.length > 1) {
            payment = 'Split';
          }
        }

        if (order_data.json_data.order.store) {
          merchant_ref_id = order_data.json_data.order.store.merchant_ref_id;
        }

        if (order_data.json_data.order.details) {
          order_ref_id = order_data.json_data.order.details.id;
        }
      }
      // Receivable amount to the user
      let total_aggregator_tax =
        itemaggregatorTaxtoremove +
        orderaggregatorTaxtoremove +
        orderchargesaggregatorTaxtoremove +
        itemchargeaggregatorTaxtoremove;

      let aggregator_order_total = order_total;
      order_total =
        order_total + total_external_discount - total_aggregator_tax;
      let merchant_order_total = order_total;

      // Added on 5 Feb for new tax changes
      if (calculatedOrderdetails && calculatedOrderdetails.grandTotal) {
        order_total = calculatedOrderdetails.grandTotal;
        // changes for payment total
        if (paymentDetails && paymentDetails.length) {
          paymentDetails[0].amount = order_total;
        }
      }

      order_level_total_taxes = Number(order_level_total_taxes || 0);
      order_level_total_taxes = order_level_total_taxes - total_aggregator_tax;

      const extra_details = {
        exlusive_tax: order_level_total_taxes,
        tax: [
          {
            amount: order_level_total_taxes,
            name: 'GST',
            taxDivided: true,
            tax_inclusive: false,
          },
        ],
        total_merchant_taxes: order_level_total_taxes,
        itemaggregatorTaxtoremove,
        orderaggregatorTaxtoremove,
        total_aggregator_tax,
        aggregator_order_total,
        merchant_order_total,
        itemchargeaggregatorTaxtoremove,
        orderchargesaggregatorTaxtoremove,
        item_level_discount,
        ...onlineordersextraInfo,
      };

      if (extra_details) {
        Object.assign(extra_details, { invoiceType: 'B2C' });
      }

      let table_name = channel + ':' + order_id;
      let billDetails = {
        table_name,
        order_id,
        order_total,
        cust_name,
        phone,
        line_1: address_line1,
        line_2: address_line2,
        email,
        is_guest_mode,
        persons,
        discount,
        delivery_type,
        instructions,
        order_level_total_charges,
        order_level_total_taxes,
        charges: totalCharges,
        order_state,
        order_subtotal,
        payment,
        payment_id,
        deliveryboy_id,
        user_id: window.storeDetails.username,
        total_external_discount,
        created_time,
        delivery_boy_phone,
        delivery_boy_name,
        quantity,
        extra_details,
        item_level_total_charges,
      };
      if (my_order_date) {
        billDetails.my_order_date = my_order_date;
      }

      //for seperate bill number series for online orders
      let seperateBillNumber = false;
      if (
        window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1] != undefined
      ) {
        seperateBillNumber =
          window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1].value == '1';
      }

      let countMidnightSale = false;
      if (
        window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !=
        undefined
      ) {
        countMidnightSale =
          window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1]
            .value == '1';
      }
      let billData = {
        paymentDetails,
        billDetails,
        items,
        charges,
        merchant_ref_id,
        order_ref_id,
        channel,
        addnewCustomer,
        defaultDepartmentid: window.defaultDepartmentid,
        createTablefororder,
        silentPull: false,
        seperateBillNumber,
        countMidnightSale,
      };
      if (addnewCustomer) {
        billData.customer = {
          name: cust_name,
          phone,
          address_line1,
          address_line2,
          email,
          is_guest_mode,
          city,
          sub_locality,
          dob: null,
          anniversary: null,
        };
      }
      const response = await betteripcRenderer.callMain(
        ORDER_IPC.SAVE_ONLINEBILL_ASYNC,
        billData,
      );
      await handleBillsavereponse(response);
    }
  } catch (error) {
    console.error(
      `Message="Error occured while preaparing order to pull" OrderID="${order_id}"`,
    );
    console.log(error);
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:onlineOrderController.somethingWentWrongWhilePullingOrder',
      ),
    );
  }
}

ipcRenderer.on(
  ONLINEORDER_IPC.SEND_MAIN_TO_RENDERER_TO_MAIN,
  (event, billData) => {
    setTimeout(() => {
      ipcRenderer.send(SAVE_ONLINEBILL, JSON.stringify(billData));
    }, 500);
  },
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Updates the order status
 */
async function updateOrderstatus(button) {
  let order_id = $(button).attr('order_id');
  let next_state = $(button).attr('next_state');
  let prev_state = $(button).attr('prev_state');
  let cur_state = $(button).attr('cur_state');
  let store_id = $(button).attr('store_id');
  let msg = $(button).attr('msg');

  if (MESSAGES != undefined && msg != undefined && MESSAGES[msg]) {
    msg = MESSAGES[msg];
  }

  let is_reject_button = $(button).attr('is_reject_button');
  let message = '';

  if (is_reject_button) {
    const { value: reason } = await Swal.fire({
      title: 'Reason to reject',
      input: 'select',
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputOptions: REJECT_REASON,
      inputPlaceholder: 'Select a reason',
      showCancelButton: true,
      customClass: {
        popup: 'tmbill-swal-pop-up',
      },
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value) {
            resolve();
          } else {
            resolve('You need to select a reason :)');
          }
        });
      },
    });
    if (!reason) {
      return;
    }
    message = REJECT_REASON[reason];
  } else if (msg) {
    message = msg;
  }

  if (order_id && next_state && cur_state) {
    Swal.fire({
      title: 'Updating Order Status.',
      text: 'Hang on there !!. This will take just a second.',
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
        sendUpdatestatusrequest(
          next_state,
          message,
          order_id,
          prev_state,
          cur_state,
          store_id,
        );
      },
      customClass: {
        popup: 'tmbill-swal-pop-up',
      },
    });
  }
}

/**
 *
 * @param {The next state name} new_status
 * @param {*} message
 * @param {*} order_id
 * @param {*} prev_state
 * @param {*} store_id
 */
async function sendUpdatestatusrequest(
  new_status,
  message,
  order_id,
  prev_status,
  cur_state,
  store_id,
) {
  showCountdown({
    seconds: 5,
    elementtoDisable: '#order-states-list-id li,button.online-action-button',
    timerElement: '#nextactionCountdownid .values',
  });

  let tempUrl = Config.links.channelOrderUpdate;
  let generatedUrl = tempUrl.replace('{$id}', order_id);

  if (window.ordersAPIKey) {
    let uppostData = {
      new_status: cur_state,
      message: message,
    };
    let uprequestOptions = {
      method: 'PUT',
      uri: generatedUrl,
      body: uppostData,
      json: true,
      headers: {
        Authorization: 'apikey ' + window.ordersAPIKey,
      },
    };

    let postData2 = {
      prev_status: prev_status,
      next_status: new_status,
      current_status: cur_state,
      urbanp_orderid: order_id,
      store_ref_id: store_id,
      store_id,
      message: message,
      timestamp_unix: moment().format('x'),
      timestamp: moment().format('DD/MM/YYYY HH:mm:ss'),
    };

    let channelOptions = {
      method: 'POST',
      uri: Config.links.orderstatusUpdate,
      body: postData2,
      json: true,
      rejectUnauthorized: false,
    };

    try {
      await sendordersStatusupdatetochannel(channelOptions);
      console.log(
        `Message="Sending update request to UrbanPiper" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
      );
      let axiosResponse = await apiCall.put(generatedUrl, uppostData, {
        headers: uprequestOptions.headers,
      });
      let result = axiosResponse.data;
      if (result && result.status && result.status == 'success') {
        console.log(
          `Message="Order status update success from UrbanPiper" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
        );
        await orderupdatePostprocessing(store_id, order_id, cur_state);
        Swal.close();
        if (result.message) {
          window.notifyUser.showMessage('success', result.message);
        }
        return true;
      } else if (result && result.message) {
        console.error(
          `Message="Sending update request to UrbanPiper failed" " OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
        );
        window.notifyUser.showMessage('error', result.message);
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineordernotification.Somethingwentwrong'),
        );
        console.error(
          `Message="Sending update request to UrbanPiper failed" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
        );
      }

      Swal.close();
      return false;
    } catch (error) {
      if (error.error && error.error.message) {
        window.notifyUser.showMessage('error', error.error.message, 0);
        await orderupdatePostprocessing(store_id, order_id, cur_state);
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:onlineordernotification.Somethingwentwrong'),
          0,
        );
      }
      console.error(
        `Message="Sending update request to UrbanPiper failed" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
      );
      if (error.response && error.response.data) {
        console.error(error.response.data);
      }
    }
    Swal.close();
  }
}

async function sendordersStatusupdatetochannel(options) {
  try {
    await apiCall.post(options.uri, options.body, {
      headers: getHeadersforchannelforrender(),
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * Called when the order update is succesful
 * @param {*} store_id
 * @param {*} order_id
 * @param {Current order state after update} cur_state
 */
async function orderupdatePostprocessing(store_id, order_id, cur_state) {
  try {
    let attr = '[order-id=' + order_id + ']';
    let selectedBill = $('#onlineorderslistID').find(attr);
    if (selectedBill.length > 0) {
      $('#onlineorderslistID li').removeClass('selected-order');
      $(selectedBill[0]).addClass('selected-order');
      $(selectedBill[0])
        .find('#list-order-item-status-label-id')
        .html(cur_state);
    }
    switch (String(cur_state).toLowerCase()) {
      case String(ONLINE_ORDER_NAME_STATES.ACKNOWLEDGED).toLowerCase():
        await preparePullorder(selectedBill, cur_state, order_id);
        await printkotandBill();
        // Check if pull order is checked
        clearorderDetails();
        if (selectedBill.length > 0) {
          $(selectedBill[0]).remove();
        }

        break;
      case String(ONLINE_ORDER_NAME_STATES.FOOD_READY).toLowerCase():
        if (selectedBill.length > 0) {
          let actionsDiv = $(selectedBill[0]).find(
            '#list-order-item-actions-div-id',
          );
          let orderDetailsbutton = $(selectedBill[0]).find(
            '#orderdetailsButton',
          );
          let order_data = $(orderDetailsbutton).attr('order_data');
          try {
            order_data = safeJSONParse(order_data);
            order_data.cur_state = cur_state;
            $(orderDetailsbutton).attr(
              'order_data',
              JSON.stringify(order_data),
            );
          } catch (error) {}
          let dispatchButton = $(DISPATCH_BUTTON)
            .attr('order_id', order_id)
            .attr('store_id', store_id)
            .click(function (e) {
              const currentContext = this;
              updateOrderstatus(currentContext);
            });

          $(actionsDiv).empty();
          $(actionsDiv).append(dispatchButton);
          $(actionsDiv).append(orderDetailsbutton);
        }
        break;
      case String(ONLINE_ORDER_NAME_STATES.DISAPATCHED).toLowerCase():
        clearorderDetails();
        if (selectedBill.length > 0) {
          let actionsDiv = $(selectedBill[0]).find(
            '#list-order-item-actions-div-id',
          );
          let orderDetailsbutton = $(selectedBill[0]).find(
            '#orderdetailsButton',
          );
          let order_data = $(orderDetailsbutton).attr('order_data');
          try {
            order_data = safeJSONParse(order_data);
            order_data.cur_state = cur_state;
            $(orderDetailsbutton).attr(
              'order_data',
              JSON.stringify(order_data),
            );
          } catch (error) {}

          let completeButton = $(ORDER_COMPLETE_BUTTON)
            .attr('order_id', order_id)
            .attr('store_id', store_id)
            .click(function (e) {
              const currentContext = this;
              updateOrderstatus(currentContext);
            });

          $(actionsDiv).empty();
          $(actionsDiv).append(completeButton);
          $(actionsDiv).append(orderDetailsbutton);
        }
        break;

      case String(ONLINE_ORDER_NAME_STATES.COMPLETED).toLowerCase():
        if (selectedBill.length > 0) {
          $(selectedBill[0]).remove();
        }
        break;
      case String(ONLINE_ORDER_NAME_STATES.CANCELLED).toLowerCase():
        await preparePullorder(selectedBill, cur_state, order_id);
        if (selectedBill.length > 0) {
          $(selectedBill[0]).remove();
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(error);
  }
}

async function preparePullorder(selectedBill, cur_state, order_id) {
  console.log(
    `Message="Check if Order needs to be auto Pulled" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
  );

  if (
    selectedBill.length > 0 &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1] != undefined &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1].value == '1'
  ) {
    try {
      console.log(
        `Message="Auto Pull Order is on.Prepare the orders to be pulled" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
      );
      let orderDetailsbutton = $(selectedBill[0]).find('#orderdetailsButton');
      let order_data = $(orderDetailsbutton).attr('order_data');
      order_data = safeJSONParse(order_data);
      order_data.order_state = cur_state;
      await pullordertoLocaldb(order_data, order_id);
    } catch (error) {
      console.log(error);
      console.error(
        `Message="Error occured while preparing auto pull" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
      );
    }
  } else {
    console.log(
      `Message="Auto Pull is disabled. Not pulling automatically" OrderID="${order_id}" StoreID= OrderState="${cur_state}"`,
    );
  }
  clearorderDetails();
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
    await printonelineBill(true);
  }
}

/**
 *
 * @param {item to add in row} data
 */
function additemRow(data) {
  const table = $('#orderdetailsTable');
  let itemPrice = Number(data.price).toFixed(2);
  let total = data.total.toFixed(2);
  // Check if item has options
  if (data.options_to_add && data.options_to_add.length) {
    let optionsPrice = data.options_to_add.reduce(
      (a, b) => a + (b.price || 0),
      0,
    );
    optionsPrice = Number(Number(optionsPrice).toFixed(2));
    itemPrice = optionsPrice;
  }
  // Check if item has options
  if (data.total_with_tax === 0) {
    itemPrice = 0;
    total = 0;
  }
  // if (data.discount > 0) {
  //     itemPrice = data.price - data.discount;
  //     itemPrice = Number(Number(itemPrice).toFixed(2));
  // }

  table.append(
    '<tr ><td>' +
      data.title +
      '</td><td>' +
      data.quantity +
      '</td><td>' +
      itemPrice +
      '</td><td>' +
      total +
      '</td>',
  );
  $('#orderdetailsTable').trigger('rowAddOrRemove');
}

/**
 * Clear the selected order details
 */
function clearorderDetails() {
  $('#orderdetails-dboyname-id').text('');
  $('#orderdetails-dboyphone-id').text('');
  $('#orderdetails-dboystate-id').text('');
  $('#orderdetailsTable').find('tr:not(:first)').remove();
  $('#step-progress-id').empty();
  $('#current-orderdetail-grandTotal').text('');
  $('#current-orderdetail-receivabletotal').text('');
  $('#current-orderdetail-totaltax').text('');
  $('#current-orderdetail-totalcharges').text('');
  $('#current-orderdetail-totaldiscount').text('');
  $('#orderdetailsTable').attr('order_id', '');
  $('#current-orderdetail-subtotal').text('');
  $('#onlinedeliveryboyCombo').hide();
  $('#onlinedeliveryboyCombo').prop('selectedIndex', 0);

  $('#order-states-list-id li').removeClass('animated-div');
}

function toggleDeliveryboycombo(type) {
  switch (type) {
    case DELIVERY_TYPES.SELF:
      $('#onlinedeliveryboyCombo').show();
      break;
    default:
      $('#onlinedeliveryboyCombo').hide();
      break;
  }
}

function getaggregatorTaxtoremove(taxes) {
  let aggregatorTaxtoremove = 0;
  if (taxes && Array.isArray(taxes) && taxes.length) {
    aggregatorTaxtoremove =
      aggregatorTaxtoremove +
      sumBy(taxes, (taxDetails) => {
        return taxDetails.liability_on === 'aggregator' ? taxDetails.value : 0;
      });
  }
  return aggregatorTaxtoremove;
}

/**
 * Shows order details
 * @param {Selected Order} order
 */
async function showOrderdetails(order) {
  // console.log(order);
  clearorderDetails();
  let { previewDetails } = await generatePreviewdetails(true, order);
  let calculatedOrderdetails = orderCalculations(previewDetails, {});

  if (order != undefined && order.json_data != undefined) {
    if (order.deliveryperson_name) {
      $('#orderdetails-dboyname-id').text(order.deliveryperson_name);
    } else {
      $('#orderdetails-dboyname-id').text('');
    }
    if (order.deliveryperson_phone) {
      $('#orderdetails-dboyphone-id').text(order.deliveryperson_phone);
    } else {
      $('#orderdetails-dboyphone-id').text('');
    }

    if (
      order.json_data.order.details.ext_platforms &&
      order.json_data.order.details.ext_platforms.length > 0 &&
      order.json_data.order.details.channel
    ) {
      let platforms = order.json_data.order.details.ext_platforms[0];
      toggleDeliveryboycombo(platforms.delivery_type);
    }

    if (order.deliveryperson_current_state) {
      $('#orderdetails-dboystate-id').text(
        'State: ' + order.deliveryperson_current_state,
      );
    } else {
      $('#orderdetails-dboystate-id').text('');
    }
    if (order.json_data.order != undefined) {
      let orderDetails = order.json_data.order;
      let currentOrderdetails = order.json_data.order.details;
      let itemaggregatorTaxtoremove = 0;
      let orderaggregatorTaxtoremove = 0;
      let orderchargesaggregatorTaxtoremove = 0;
      let itemchargeaggregatorTaxtoremove = 0;

      if (orderDetails != undefined && orderDetails.items != undefined) {
        let items = orderDetails.items;
        $('#orderdetailsTable').attr(
          'order_id',
          currentOrderdetails.merchant_ref_id,
        );
        if (items.constructor == Array && items.length > 0) {
          items.forEach((element) => {
            additemRow(element);
            itemaggregatorTaxtoremove =
              itemaggregatorTaxtoremove +
              getaggregatorTaxtoremove(element.taxes);

            if (
              element.charges &&
              Array.isArray(element.charges) &&
              element.charges.length
            ) {
              for (const currentitemcharge of element.charges) {
                itemchargeaggregatorTaxtoremove =
                  itemchargeaggregatorTaxtoremove +
                  getaggregatorTaxtoremove(currentitemcharge.taxes);
              }
            }
          });
        }
      }
      const dyanamicprogressStates = $.i18n.t('common:orderStatus', {
        returnObjects: true,
      });
      switch (order.order_state) {
        case 'Placed':
          ProgressBar.init(
            Object.values(dyanamicprogressStates),
            $.i18n.t('common:orderStatus.Placed'),
          );
          break;
        case 'Acknowledged':
          ProgressBar.init(
            Object.values(dyanamicprogressStates),
            $.i18n.t('common:orderStatus.Acknowledged'),
          );
          break;
        case 'Food Ready':
          ProgressBar.init(
            Object.values(dyanamicprogressStates),
            $.i18n.t('common:orderStatus.Acknowledged'),
          );
          break;
        case 'Dispatched':
          ProgressBar.init(
            Object.values(dyanamicprogressStates),
            $.i18n.t('common:orderStatus.Dispatched'),
          );
          break;

        case 'Completed':
          ProgressBar.init(
            Object.values(dyanamicprogressStates),
            $.i18n.t('common:orderStatus.Completed'),
          );
          break;
        case 'Cancelled':
          $('#step-progress-id').empty();
          break;
        default:
          $('#step-progress-id').empty();
          break;
      }

      // Calculate order level aggregator tax
      orderaggregatorTaxtoremove = getaggregatorTaxtoremove(
        currentOrderdetails.taxes,
      );

      if (currentOrderdetails.order_total) {
        let order_total = currentOrderdetails.order_total;
        if (typeof order_total == Number) {
          order_total = order_total.toFixed(2);
        } else {
          order_total = Number(order_total).toFixed(2);
        }
        // Added on 5 Feb for new tax changes
        if (calculatedOrderdetails && calculatedOrderdetails.grandTotal) {
          order_total = calculatedOrderdetails.grandTotal;
        }

        $('#current-orderdetail-grandTotal').css('display', '');
        $('#current-orderdetail-grandTotal').text(
          `${$.i18n.t(
            'common:calculations.grandTotal',
          )} ${currency} ${order_total}`,
        );
      } else {
        $('#current-orderdetail-grandTotal').css('display', 'none');
        $('#current-orderdetail-grandTotal').text(
          `${$.i18n.t('common:calculations.grandTotal')} ${currency} 0`,
        );
      }

      if (currentOrderdetails.total_charges) {
        let order_total_charges = currentOrderdetails.total_charges;
        if (typeof order_total_charges == Number) {
          order_total_charges = order_total_charges.toFixed(2);
        } else {
          order_total_charges = Number(order_total_charges).toFixed(2);
        }
        $('#current-orderdetail-totalcharges').css('display', '');
        $('#current-orderdetail-totalcharges').text(
          `${$.i18n.t(
            'common:calculations.totalCharges',
          )} ${currency} ${order_total_charges}`,
        );
      } else {
        $('#current-orderdetail-totalcharges').css('display', 'none');
        $('#current-orderdetail-totalcharges').text(
          `${$.i18n.t('common:calculations.totalCharges')} ${currency} 0`,
        );
      }
      if (
        currentOrderdetails.charges &&
        Array.isArray(currentOrderdetails.charges) &&
        currentOrderdetails.charges.length
      ) {
        for (const currentCharge of currentOrderdetails.charges) {
          orderchargesaggregatorTaxtoremove =
            orderchargesaggregatorTaxtoremove +
            getaggregatorTaxtoremove(currentCharge.taxes);
        }
      }

      // Check if the item has merchant tax
      let order_total_taxes = Number(currentOrderdetails.total_taxes || 0);
      let total_aggregator_tax =
        itemaggregatorTaxtoremove +
        orderaggregatorTaxtoremove +
        orderchargesaggregatorTaxtoremove +
        itemchargeaggregatorTaxtoremove;

      order_total_taxes = order_total_taxes - total_aggregator_tax;

      const receivabletotal = Number(
        currentOrderdetails.order_total - total_aggregator_tax,
      );
      if (receivabletotal) {
        $('#current-orderdetail-receivabletotal').show();
        $('#current-orderdetail-receivabletotal').text(
          `${$.i18n.t(
            'controller:onlineOrderController.receivableAmountFromPartner',
          )}: ${currency} ${Number(receivabletotal).toFixed(2)}`,
        );
      } else {
        $('#current-orderdetail-receivabletotal').hide();
      }
      $('#current-orderdetail-receivabletotal').hide();

      if (order_total_taxes) {
        if (typeof order_total_taxes == Number) {
          order_total_taxes = order_total_taxes.toFixed(2);
        } else {
          order_total_taxes = Number(order_total_taxes).toFixed(2);
        }
        $('#current-orderdetail-totaltax').css('display', '');
        $('#current-orderdetail-totaltax').text(
          `${$.i18n.t(
            'common:calculations.Tax',
          )} ${currency} ${order_total_taxes}`,
        );
      } else {
        $('#current-orderdetail-totaltax').css('display', 'none');
        $('#current-orderdetail-totaltax').text(
          `${$.i18n.t('common:calculations.Tax')} ${currency} 0`,
        );
      }

      if (currentOrderdetails.discount) {
        let discount = currentOrderdetails.discount;
        if (typeof discount == Number) {
          discount = discount.toFixed(2);
        } else {
          discount = Number(discount).toFixed(2);
        }
        $('#current-orderdetail-totaldiscount').css('display', '');
        // $.i18n.t('common:calculations.orderTotal')
        $('#current-orderdetail-totaldiscount').text(
          `${$.i18n.t('common:calculations.Discount')} ${currency} ${discount}`,
        );
      } else {
        $('#current-orderdetail-totaldiscount').text(
          `${$.i18n.t('common:calculations.Discount')} ${currency} 0`,
        );
        $('#current-orderdetail-totaldiscount').css('display', 'none');
      }

      if (currentOrderdetails.order_subtotal) {
        let subtotal = currentOrderdetails.order_subtotal;

        if (typeof subtotal == Number) {
          subtotal = subtotal.toFixed(2);
        } else {
          subtotal = Number(subtotal).toFixed(2);
        }
        $('#current-orderdetail-subtotal').css('display', '');
        // $.i18n.t('common:calculations.orderTotal')
        $('#current-orderdetail-subtotal').text(
          `${$.i18n.t('common:calculations.subTotal')} ${currency} ${subtotal}`,
        );
      } else {
        $('#current-orderdetail-subtotal').text(
          `${$.i18n.t('common:calculations.subTotal')} ${currency} 0`,
        );
        $('#current-orderdetail-subtotal').css('display', 'none');
      }
    }
  }
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
  showCountdown({
    seconds: 5,
    elementtoDisable: '#order-states-list-id li,button.online-action-button',
    timerElement: '#nextactionCountdownid .values',
  });
  stopHowler();

  if (!window.channelloginSuccess) {
    logout_FromChannel();
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:onlineordernotification.SessionExpiredPleaseloginagain',
      ),
      100,
    );
    return;
  }
  clearorderDetails();
  if (!appendOrders) {
    $('#onlineorderslistID').empty();
    currentOffset = 0;
    offset = 0;
  }

  let postData = {
    order_type,
    online_action,
    offset,
    tmpos_id: window.tmpos_id,
    search: $(`#onlineordersearchInputid`).val(),
    store_id: window.channelStoreidlist,
  };
  if ($('#onlineorderdatefilter').val()) {
    const from_date = $('#onlineorderdatefilter')
      .data('daterangepicker')
      .startDate.format('x');
    const to_date = $('#onlineorderdatefilter')
      .data('daterangepicker')
      .endDate.format('x');
    Object.assign(postData, {
      from_date,
      to_date,
    });
  }
  try {
    let axiosResponse = await apiCall.post(
      Config.links.channelOrders,
      postData,
      {
        headers: getHeadersforchannelforrender(),
      },
    );
    let response = axiosResponse.data;
    if (appendOrders) {
      $('#loadmoreOrdersbutton').remove();
    }

    if (
      response &&
      response.status != undefined &&
      response.status == 200 &&
      response.OnlineOrderClass != undefined
    ) {
      let orderDetails = response.OnlineOrderClass;
      if (
        orderDetails &&
        Array.isArray(orderDetails) &&
        orderDetails.length > 0
      ) {
        orderDetails.forEach(async (order) => {
          await createOrder(order);
        });
        currentOffset = currentOffset + orderDetails.length;
        addPaginationifrequired(order_type, online_action, is_platform_filter);
        Swal.close();
        iinitializei18nforOnlineordersbuttons();
        $(`#onlineordersearchInputid`).val('');
        $('#onlineorderdatefilter').val('');
        Swal.close();
        return true;
      } else {
        Swal.close();
        if (!appendOrders) addNoordersfound();
      }
    }
    $(`#onlineordersearchInputid`).val('');
    $('#onlineorderdatefilter').val('');
    Swal.close();
    return false;
  } catch (error) {
    console.log(error);
  }
  Swal.close();
  return false;
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
    switch (Number(order_type)) {
      case ONLINE_ORDERS_STATE.COMPLETED:
      case ONLINE_ORDERS_STATE.CANCELLED:
        $('#onlineorderslistID').append(LOAD_MORE_ELEMENT);
        $('#loadmoreOrdersbutton').attr('action-type', order_type);
        $('#loadmoreOrdersbutton').attr('append_orders', true);
        if (is_platform_filter) {
          $('#loadmoreOrdersbutton').attr('is_platform_filter', true);
          $('#loadmoreOrdersbutton').attr('action-type', online_action);
        }
        $('#loadmoreOrdersbutton').on('click', function () {
          filterListener(this);
        });
        break;
      default:
        break;
    }
  }
}
/**
 * Adds no orders found svg
 */
function addNoordersfound() {
  $('#onlineorderslistID').append($(NO_ORDERSFOUND));
  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:onlineordernotification.UhOhNoOrdersfound'),
    0,
  );
  timer.stop();
}

function initializeStepprogress() {
  ProgressBar = loadProgressbar('step-progress-id');
  $('#step-progress-id').empty();
  if (ProgressBar) ProgressBar.singleStepAnimation = 500;
}

window.clearonlineOrdersdetails = function () {
  clearorderDetails();
};

window.pullOnlineOrderFromRemote = function (order_data, order_id) {
  if (
    window.settingsConfig[PULLORDER_ONACCEPT - 1] != undefined &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1].value == '1'
  ) {
    pullordertoLocaldb(order_data, order_id);
  }

  if (
    window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1] != undefined &&
    window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1].value == '1'
  ) {
    setTimeout(async () => {
      await generateOnlinekot((silentPrint = true), order_data);
    }, 100);
  }

  if (
    window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1] != undefined &&
    window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1].value == '1'
  ) {
    setTimeout(async () => {
      printonelineBill(true, order_data);
    }, 200);
  }
};
Initialize();
