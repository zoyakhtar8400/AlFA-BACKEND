/* eslint-disable camelcase */
const { debounce } = require('lodash');
const { default: Swal } = require('sweetalert2');
const {
  QUICKBILL_FLAG_ID,
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../util/Constants');
const { UPDATE_PAYMENTS } = require('../util/IPC_Messages');
const { showLoader } = require('./CommonUtils');
const { addWaiterTipRequest } = require('../renderer/helper/Order.helper');
const { apiCall } = require('../services/APIService');
const { aggregatePayments } = require('./UIutils/MiscUtils');
const { safeParse } = require('../util/RendererUtils');
require('./Modals/ZomatoPayAuth');

let tipPaymentModeChanged = false;

async function initAddWaitertip(data) {
  const response = await addWaiterTipRequest(data);
  return response;
}

async function addSplitpaymenttolist() {
  const selectedPaywrapper = $('#orderwindowPaymentlist div.selectedPayment');
  if (selectedPaywrapper.length == 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.selectPaymentMethod'),
    );
    return;
  }
  const payAmounttoadd = $('#newpaysplitpayAmount').val();
  const totalAmounttopay = $('#newpaymentTotalid').text();
  const selectedPaymentname = $(selectedPaywrapper).attr('payment_title');

  if (isNaN(payAmounttoadd) || Number(payAmounttoadd) <= 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.invalidAmount'),
    );
    return;
  }

  if (String(payAmounttoadd).length > 10) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:orderpaycontrollernotification.Amountshouldbelessthantendigit',
      ),
    );
    return;
  }

  const addedSplitmodes = $('#newordersplitpaylistId li')
    .map(function () {
      return $(this).attr('id');
    })
    .get();

  if (
    addedSplitmodes.length == 0 &&
    Number(payAmounttoadd) == Number(totalAmounttopay)
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:orderpaycontrollernotification.Singlepaymentmodeamountshouldnotbeequaltoordertotalinsplitpayment',
      ),
    );
    return;
  }

  // if (
  //   addedSplitmodes &&
  //   Array.isArray(addedSplitmodes) &&
  //   addedSplitmodes.includes(selectedPaymentname)
  // ) {
  //   window.notifyUser.showMessage(
  //     'error',
  //     $.i18n.t('controller:orderController.paymentMethodExists'),
  //   );
  //   return;
  // }

  let remainingAmount = 0;
  let addedAmount = 0;
  const listItems = $('#newordersplitpaylistId li');
  for (const li of listItems) {
    const product = $(li).get(0);
    const individualAmt = product.getAttribute('amount');
    if (individualAmt) {
      addedAmount += Number(individualAmt);
    }
  }
  remainingAmount = Number(totalAmounttopay) - addedAmount;
  const amountTocompare = Number(remainingAmount.toFixed(ROUNDOFF_UPTO));

  if (Number(payAmounttoadd) > amountTocompare) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.amountIsTooBig'),
    );
    return;
  }

  const splitpaymentListitem = $('<li>', {
    id: selectedPaymentname,
    class: selectedPaymentname.split(' ')[0],
    amount: payAmounttoadd,
    html: `${selectedPaymentname} : ${payAmounttoadd}`,
  });

  $('#newordersplitpaylistId').append(splitpaymentListitem);
  $('#orderwindowPaymentlist div').removeClass('selectedPayment');
  remainingAmount =
    Number(remainingAmount.toFixed(ROUNDOFF_UPTO)) - Number(payAmounttoadd);
  if (remainingAmount == 0) {
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:orderController.youCanNowSettleThePayment'),
    );
  }

  $('#newremainingPayableamount').html(remainingAmount.toFixed(ROUNDOFF_UPTO));
  $('#newpaysplitpayAmount').val(remainingAmount.toFixed(ROUNDOFF_UPTO));
}
async function clearnewpaymentSplitinfo() {
  const status = $('#newpaymentsplitCheckid').is(':checked');
  $('#newordersplitpaylistId').empty();
  $('#newremainingPayableamount').html($('#newpaymentTotalid').text());
  $('#newpaysplistselectwrapperid').css('display', status ? '' : 'none');
  $('#addpayMethodbutton').css('display', status ? '' : 'none');
  $('#newpaysplitpayAmount').css('display', status ? '' : 'none');
  $('#newpaysplitpayAmount').val(status ? $('#newpaymentTotalid').text() : '');
}

async function updateorderPayment(
  currentTable,
  currentWalletinfo,
  defaultPaymentoption,
  printBill,
  paymentRefNumber,
  makePaymentrefmandatory,
) {
  const selectedPaywrapper = $('#orderwindowPaymentlist div.selectedPayment');
  const isQuickbill = currentTable.data.order_type_flag === QUICKBILL_FLAG_ID;
  let selectedPaymentname = $(selectedPaywrapper).attr('payment_title');

  if (
    makePaymentrefmandatory &&
    selectedPaymentname == 'Card' &&
    !paymentRefNumber
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:orderpaycontrollernotification.Pleaseaddpaymentreferencenumber',
      ),
    );
    return;
  }

  // if (selectedPaywrapper.length) {
  if (currentTable == undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.pleaseSelectTheTable'),
    );
    return;
  }
  if (
    !isQuickbill &&
    currentTable.data.details.bill_number != undefined &&
    currentTable.data.details.bill_number == 0
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.saveTheBillFirst'),
    );
    return;
  }

  let addasdueChecked = false;
  if ($('#newduepaycheckWrapperid').is(':visible')) {
    addasdueChecked = $('#newaddduepaymentCheck').is(':checked');
  }

  let updatingPayment = false;
  if (isQuickbill) {
    updatingPayment = true;
  }

  const billTotal = currentTable.data.details.order_total;
  const isSplitpayment = $('#newpaymentsplitCheckid').is(':checked');
  const table_id = currentTable.id.replace('table_', '');

  let payment_option = selectedPaymentname;

  if (addasdueChecked) {
    payment_option = '';
  }
  if (isSplitpayment) {
    payment_option = 'Split';
  }
  if (defaultPaymentoption !== 'None' && !selectedPaymentname) {
    selectedPaymentname = defaultPaymentoption;
  }
  if (!payment_option && !addasdueChecked) {
    window.notifyUser.showMessage('error', 'Please select payment mode');
    return;
  }
  const paymentData = {
    isSplitpayment,
    table_id,
    addasdueChecked,
    billTotal,
    order_id: !isQuickbill ? currentTable.data.details.bill_number : undefined,
    bill_number: !isQuickbill ? currentTable.data.details.order_id : undefined,
    paymentName: payment_option,
    printBill,
  };

  const paymentDetails = {
    order_id: currentTable.data.details.bill_number || undefined,
    payment_option,
    amount: billTotal,
    printBill,
  };

  if (isSplitpayment) {
    const remainingAmount = $('#newremainingPayableamount').html();
    if (!addasdueChecked && Number(remainingAmount) !== 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.incompleteSplitInfo'),
      );
      return;
    }

    let payList = [];
    const splitpaymentList = $('#newordersplitpaylistId li');
    let received_amount = 0;

    if (splitpaymentList.length === 0 && !addasdueChecked) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.incompleteSplitInfo'),
      );
      return;
    }

    for (const li of splitpaymentList) {
      const product = $(li).get(0);
      const individualAmt = product.getAttribute('amount');

      const tempPaydata = {
        amount: individualAmt,
        order_id: currentTable.data.details.bill_number,
        payment_option: product.id,
        status_flag: 1,
      };
      received_amount += Number(individualAmt);
      payList.push(tempPaydata);
    }

    if (payList.length > 0) {
      if (makePaymentrefmandatory) {
        const uniquePaymentOptions = [
          ...new Set(payList.map((item) => item.payment_option)),
        ];
        if (uniquePaymentOptions.includes('Card') && !paymentRefNumber) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:orderpaycontrollernotification.Pleaseaddpaymentreferencenumber',
            ),
          );
          return;
        }
      }

      payList = aggregatePayments(payList);
      Object.assign(paymentData, {
        paymentName: 'Split',
        payList,
      });

      currentTable.data.details.payment_mode = 'Split';
      currentTable.data.details.paymentAdded = true;

      if (isQuickbill) {
        Object.assign(paymentDetails, {
          payment_option: 'Split',
          payList,
          isSplitpayment,
        });
        currentTable.data.details.paymentDetails = paymentDetails;
        currentTable.data.details.payment_mode = 'split';
        currentTable.data.details.payment_modes = paymentDetails?.payList;

        if (addasdueChecked && Number(billTotal) > received_amount) {
          paymentData.due_payment = Number(
            Number(billTotal).toFixed(ROUNDOFF_UPTO),
          );
          currentTable.data.details.due_payment = Number(
            Number(billTotal).toFixed(ROUNDOFF_UPTO),
          );
          if (!isSplitpayment) {
            currentTable.data.details.payment_mode = '';
          }
          currentTable.data.details.paymentAdded = false;
          // currentTable.data.details.cust_paid_amount = received_amount;
          currentTable.data.details.addasdueChecked = true;
          // Object.assign(currentTable.data.details, {
          //   cust_paid_amount: received_amount,
          // });

          if (Number(remainingAmount) > 0) {
            currentTable.data.details.due_payment = Number(
              Number(remainingAmount).toFixed(ROUNDOFF_UPTO),
            );
            paymentData.due_payment = Number(
              Number(remainingAmount).toFixed(ROUNDOFF_UPTO),
            );
          }
        } else {
          currentTable.data.details.addasdueChecked = false;
        }
      } else {
        Object.assign(paymentDetails, {
          payment_option: 'Split',
        });
        if (addasdueChecked && Number(remainingAmount) != 0) {
          paymentData.due_payment = Number(
            Number(remainingAmount).toFixed(ROUNDOFF_UPTO),
          );
          currentTable.data.details.due_payment = Number(remainingAmount);
          // currentTable.data.details.cust_paid_amount = received_amount;

          paymentData.received_amount = received_amount;
          const cust_mobile = currentTable.data.details.customer.phone;
          paymentData.dueHistory = {
            store_id: window.storeDetails.store_id,
            cust_mobile,
            billing_user_id: window.storeDetails.username,
          };
        }
      }
    }
  } else {
    currentTable.data.details.payment_mode = paymentDetails.payment_option;
    currentTable.data.details.paymentAdded = true;
    paymentData.paymentDetails = paymentDetails;
    currentTable.data.details.addasdueChecked = addasdueChecked;

    if (isQuickbill) {
      currentTable.data.details.paymentDetails = paymentDetails;
    }

    if (addasdueChecked) {
      paymentData.due_payment = Number(billTotal);
      currentTable.data.details.due_payment = Number(billTotal);
      if (!isSplitpayment) {
        currentTable.data.details.payment_mode = '';
      }
      currentTable.data.details.paymentAdded = false;
      currentTable.data.details.cust_paid_amount = 0;
      $('#newpaymentCustomerPaidamtid').val('');
      $('#newpaymentReturnAmountid').val('');
    }

    try {
      if (
        paymentData.due_payment != 0 &&
        // currentWalletinfo != undefined &&
        currentTable &&
        currentTable.data.details.customer &&
        currentTable.data.details.customer.phone
      ) {
        const cust_mobile = currentTable.data.details.customer.phone;
        const cust_name = currentTable.data.details.customer.name;
        paymentData.dueHistory = {
          store_id: window.storeDetails.store_id,
          cust_mobile,
          cust_name,
          billing_user_id: window.storeDetails.username,
        };
      }
    } catch (error) {}
  }

  // customer paid amount
  const cust_paid_amount = $('#newpaymentCustomerPaidamtid').val();
  if (Number(cust_paid_amount) && Number(cust_paid_amount) < 0) {
    window.notifyUser.showMessage(
      'error',
      'Customer paid amount should not be in negative number',
    );
    return;
  }

  if (!isSplitpayment && cust_paid_amount && cust_paid_amount < billTotal) {
    window.notifyUser.showMessage(
      'error',
      'Customer paid amount should not be in less than order amount',
    );
    return;
  }

  // if (cust_paid_amount >= billTotal) {
  currentTable.data.details.cust_paid_amount = cust_paid_amount;
  Object.assign(paymentData, { cust_paid_amount });
  // }

  const tipAmount = $('#newpaymentTipAmountid').val();
  // const tipPaymentMode = $('#newpaymentTipPaymentid').val();

  let tipPaymentMode = $(
    '#newpaymentTipPaymentid option:selected:not([disabled])',
  ).text();

  if (Number(tipAmount) && Number(tipAmount) < 0) {
    window.notifyUser.showMessage(
      'error',
      'Tip amount should not be in negative number',
    );
    return;
  }
  if (String(tipAmount).length > 10) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:orderpaycontrollernotification.Tipamountshouldbelessthantendigit',
      ),
    );
    return;
  }

  if (tipAmount && !tipPaymentMode) {
    if (!isSplitpayment) {
      tipPaymentMode = paymentDetails.payment_option;
    } else {
      tipPaymentMode = window.defaultPaymentoption;
    }
  }

  if (!tipAmount) {
    tipPaymentMode = '';
  }

  const waiterTipDetails = {
    store_id: window.storeDetails.store_id,
    order_id: currentTable.data.details.bill_number,
    amount: tipAmount,
    waiter: currentTable.data.details.waiter,
    waiter_id: currentTable.data.details.waiter_id,
    payment_option: tipPaymentMode,
  };

  if (currentTable.data.details.extra_details) {
    Object.assign(currentTable.data.details.extra_details, {
      total_tip: tipAmount,
      tip_payment_mode: tipPaymentMode,
    });

    const orderData = $('#neworderpaymentModalid').attr('data');
    if (orderData && window.isZomatoPayConfigured) {
      const tableData = safeParse(orderData);

      const { details } = tableData;
      if (
        details &&
        details.extra_details &&
        details.extra_details.zomatoPay_AuthCode
      ) {
        Object.assign(currentTable.data.details.extra_details, {
          zomatoPay_AuthCode: details.extra_details.zomatoPay_AuthCode,
          zomatoPay_amount_receivable:
            details.extra_details.zomatoPay_amount_receivable,
        });
      }
    }
  }

  // add converted amount
  const isPayInforeingCurrencyChecked = $('#payInForeingCurrencycheckid').is(
    ':checked',
  );
  if (
    isPayInforeingCurrencyChecked &&
    currentTable.data.details.extra_details
  ) {
    const selectedCurrency = $('#toCurrency option:selected').text();
    const selectedAmount = $('#currencyresult').text();
    const currencyConversionDetails = {
      currency: selectedCurrency,
      amountAfterConvert: selectedAmount,
    };
    Object.assign(currentTable.data.details.extra_details, {
      currencyConversionDetails,
    });
  }
  if (isQuickbill) {
    Object.assign(currentTable.data.details, { waiterTipDetails });
  }

  if (addasdueChecked && !currentTable.data.details.customer?.phone) {
    window.notifyUser.showMessage('error', 'Please add customer details');
    return;
  }
  const return_amount = $('#newpaymentReturnAmountid').val();
  if (return_amount) {
    Object.assign(currentTable.data.details.extra_details, {
      return_amount,
    });
  }
  if (!isQuickbill) {
    showLoader({
      title: $.i18n.t('controller:orderController.updatingPayment'),
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
    if (currentTable && currentTable.data) {
      Object.assign(currentTable.data.details, {
        paymentAddedFromStrip: false,
      });
    }
    if (waiterTipDetails && waiterTipDetails.amount) {
      // await betteripcRenderer.callMain('save-waiter-tip', waiterTipDetails);
      initAddWaitertip(waiterTipDetails);
    }
    // ipcRenderer.send(UPDATE_PAYMENTS, JSON.stringify(paymentData));
    $('#neworderpaymentModalid').modal('hide');

    window.initUpdatePayment(paymentData);
  } else {
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:orderController.paymentAdded'),
    );
    $('#quickbillsettleButton').click();
  }

  $('#orderwindowPaymentlist div').removeClass('selectedPayment');
}

async function updateSplitnewremainingAmt() {
  const listItems = $('#newordersplitpaylistId li');
  let addedAmount = 0;
  const totalAmounttopay = $('#newpaymentTotalid').text();

  if (!totalAmounttopay) {
    return;
  }
  for (const li of listItems) {
    const product = $(li).get(0);
    const individualAmt = product.getAttribute('amount');
    if (individualAmt) {
      addedAmount += Number(individualAmt);
    }
  }
  const remainingAmount = Number(totalAmounttopay) - addedAmount;
  if (addedAmount == 0) {
    $('#newremainingPayableamount').html($('#newpaymentTotalid').text());
  } else {
    $('#newremainingPayableamount').html(
      remainingAmount.toFixed(ROUNDOFF_UPTO),
    );
    $('#newpaysplitpayAmount').val(remainingAmount.toFixed(ROUNDOFF_UPTO));
  }
}

async function initialize() {
  $('#newpaymentsplitCheckid').on('click', () => {
    clearnewpaymentSplitinfo();
  });
  $('#newpayaddpayMethodbutton').on('click', () => {
    addSplitpaymenttolist();
  });

  $('#newordersplitpaylistId').on('click', 'li', function () {
    $(this).remove();
    updateSplitnewremainingAmt();
  });

  $('#newpaymentcustomerpaidamtcontainer').hide();
  $('#newpaymentreturnamtcontainer').hide();

  $('#orderwindowPaymentlist').on('click', 'div', async function () {
    $('#orderwindowPaymentlist div').removeClass('selectedPayment');
    $(this).addClass('selectedPayment');

    // check if payment mode is cash then show paid amount and return amount
    $('#newpaymentCustomerPaidamtid').val('');
    $('#newpaymentReturnAmountid').val('');
    // $('#newpaymentTipAmountid').val('');
    const selectedPaymentModeName = $(this).text();
    if (
      selectedPaymentModeName == 'Cash' ||
      selectedPaymentModeName == 'نقدي'
    ) {
      $('#newpaymentcustomerpaidamtcontainer').show();
      $('#newpaymentreturnamtcontainer').show();
    } else {
      $('#newpaymentcustomerpaidamtcontainer').hide();
      $('#newpaymentreturnamtcontainer').hide();
    }

    if (
      window.isZomatoPayConfigured &&
      selectedPaymentModeName === 'Zomato Pay'
    ) {
      // console.log('current table::', currentTable.data);
      $('#zomatoPayAuthModal').modal('show');
      $('#zomatoPayAuthenticationCodeInputid').val('');
      $('#verifyingAuthCodeContainerId').hide();
      $('#zomatoPayAuthSuccessMessageID').hide();
      $('#zomatoPayAuthFailureMessageID').hide();
    }

    $('#zomatoPayAuthModal').on('hidden.bs.modal', () => {
      const orderdata = $('#neworderpaymentModalid').attr('data');
      if (orderdata && window.isZomatoPayConfigured) {
        const tableData = safeParse(orderdata);
        const { details } = tableData;
        if (
          details &&
          details.extra_details &&
          !details.extra_details.zomatoPay_AuthCode
        ) {
          $('#orderwindowPaymentlist div').removeClass('selectedPayment');
        }
      }
    });
    if (!$('#splitCheckid').is(':checked')) {
      if (!tipPaymentModeChanged) {
        $('#newpaymentTipPaymentid').val(selectedPaymentModeName);
      }
    }
    const selectedPaymentMode = $(this).attr('payment_title');
    if (window.isSunmiConfigured && selectedPaymentMode === 'Card') {
      // show swal loader and send sunmi req
      const response =
        await window.sendSunmiRequestFromRemote(selectedPaymentMode);
    }
  });
  $('#newpaymentCustomerPaidamtid').on('change paste keyup', () => {
    let { order_total_amount, cust_paid_amount, tip_amount, tipPaymentMode } =
      getOrderAmount();

    if (tipPaymentMode !== 'Cash') {
      tip_amount = 0;
    }
    // return amount
    const return_amount = Number(
      cust_paid_amount - order_total_amount - tip_amount,
    ).toFixed(ROUNDOFF_UPTO);
    if (return_amount > 0) $('#newpaymentReturnAmountid').val(return_amount);
    if (return_amount <= 0) $('#newpaymentReturnAmountid').val('');
  });

  $('#newpaymentTipAmountid').on('change paste keyup', () => {
    const { order_total_amount, cust_paid_amount, tip_amount } =
      getOrderAmount();
    const return_amount = Number(
      cust_paid_amount - order_total_amount - tip_amount,
    ).toFixed(ROUNDOFF_UPTO);
    if (return_amount > 0) $('#newpaymentReturnAmountid').val(return_amount);
    if (return_amount <= 0) $('#newpaymentReturnAmountid').val('');
  });

  $('#newpaymentTipPaymentid').on('change paste keyup', () => {
    const { order_total_amount, cust_paid_amount, tip_amount } =
      getOrderAmount();
    const return_amount = Number(
      cust_paid_amount - order_total_amount - tip_amount,
    ).toFixed(ROUNDOFF_UPTO);
    tipPaymentModeChanged = true;
    if (return_amount > 0) $('#newpaymentReturnAmountid').val(return_amount);
    if (return_amount <= 0) $('#newpaymentReturnAmountid').val('');
  });

  // Convert Currency
  $('#convert').click(() => {
    const amount = $('#currenyamount').val();
    const from = $('#fromCurrency').val();
    const to = $('#toCurrency').val();
    const rate = window.currencyRates[to];
    const convertedAmount = (Number(amount) * Number(rate.toFixed(2))).toFixed(
      window.ROUNDOFF_UPTO,
    );
    $('#currencyresult').text(
      `${Number(convertedAmount).toFixed(window.ROUNDOFF_UPTO)} `,
    ); // ${to.toUpperCase()}
    $('#payInForeingCurrencychecboxid').text(`Pay in ${to.toUpperCase()} `);
  });
}

function getOrderAmount() {
  let order_total_amount;
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        order_total_amount = $('#billGrandtotal').text();
        break;
      case TAKEAWAY_TAB_ID:
        order_total_amount = $('#takeawaybillGrandtotal').text();
        break;
      case DELIVERY_TAB_ID:
        order_total_amount = $('#deliverybillGrandtotal').text();
        break;
      case QUICK_TAB_ID:
        order_total_amount = $('#quickbillGrandtotal').text();

        break;
      default:
        break;
    }
  }
  let cust_paid_amount = $('#newpaymentCustomerPaidamtid').val();
  cust_paid_amount = Number(cust_paid_amount);
  let tip_amount = $('#newpaymentTipAmountid').val();
  tip_amount = Number(tip_amount);

  const tipPaymentMode = $('#newpaymentTipPaymentid').val();

  const isSplitpayment = $('#newpaymentsplitCheckid').is(':checked');

  if (isSplitpayment) {
    let isCashPayment = $('#newordersplitpaylistId').find('.Cash').text();
    if (!isCashPayment) {
      isCashPayment = $('#newremainingPayableamount').text();
    }
    if (isCashPayment) {
      const amount = String(isCashPayment).replace('Cash :', '');
      if (amount) {
        order_total_amount = Number(amount);
      }
    }
  }
  if (tipPaymentMode !== 'Cash') {
    tip_amount = 0;
  }
  return { order_total_amount, cust_paid_amount, tip_amount, tipPaymentMode };
}

async function getcurrencyData() {
  try {
    const formattedDate = window.moment().format('YYYY-MM-DD');

    const currencyURL =
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json';
    const currencyRateURL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${formattedDate}/v1/currencies/${window.storeDetails.currency_code.toLowerCase()}.json`;

    const result = await apiCall.get(currencyURL);
    const currencies = result.data;
    const response = await apiCall.get(currencyRateURL);
    if (response && response.status === 200) {
      window.currencyRates =
        response.data[window.storeDetails.currency_code.toLowerCase()];
    }

    // Load Currency List
    if (currencies) {
      Object.entries(currencies).forEach(([currency, value]) => {
        $('#toCurrency').append(
          `<option value="${currency}">${value} ${currency}</option>`,
        );
      });
      $('#toCurrency').val('inr');
    }
    $('#fromCurrency').append(
      `<option value="${window.storeDetails.currency_code.toLowerCase()}">${window.storeDetails.currency_code}</option>`,
    );
    $('#fromCurrency').val(window.storeDetails.currency_code.toLowerCase());
  } catch (error) {
    console.log(error);
  }
}

$('#neworderpaymentModalid').on('shown.bs.modal', (e) => {
  tipPaymentModeChanged = false;
  $('#newpaymentTipPaymentid').prop('selectedIndex', 0);
  // $('#orderwindowPaymentlist div').addClass('selectedPayment')
  $(`[payment_title='${window.defaultPaymentoption}']`).addClass(
    'selectedPayment',
  );

  if (window.defaultPaymentoption === 'Cash') {
    $('#newpaymentcustomerpaidamtcontainer').show();
    $('#newpaymentreturnamtcontainer').show();
  }
});

initialize();

module.exports = {
  updateorderPayment,
  getcurrencyData,
};
