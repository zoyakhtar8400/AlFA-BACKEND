/* eslint-disable func-names */
const {
  initializei18nforReceiptactionctrlwindowui,
} = require('./i18nController');
const { addReceipteditbillpermission } = require('./PasscodeController');
const { initAccesslevelsforreceipts } = require('./AccesslevelManager');
const { getPaymentTranslation } = require('../locales/Utils');
const { makeGetpaymentsrequest } = require('../renderer/helper/Receipt.helper');
const { VOID_REASONS } = require('../util/Constants');

window.receiptactionscriptLoaded = true;

/**
 * Updates the split payment remaining info
 */
function updateSplitremainingAmt() {
  const listItems = $('#receiptsplitpaylistId li');
  let addedAmount = 0;
  const totalAmounttopay = $('#receiptpaymentTotalid').text();
  // eslint-disable-next-line no-restricted-syntax
  for (const li of listItems) {
    const product = $(li).get(0);
    const individualAmt = product.getAttribute('amount');
    if (individualAmt) {
      addedAmount += Number(individualAmt);
    }
  }
  const remainingAmount = Number(totalAmounttopay) - addedAmount;
  if (addedAmount === 0) {
    $('#receiptremainingPayableamount').html($('#receiptGrandlabelid').text());
  } else {
    $('#receiptremainingPayableamount').html(
      remainingAmount.toFixed(window.ROUNDOFF_UPTO),
    );
    $('#receiptsplitpayAmount').html(
      remainingAmount.toFixed(window.ROUNDOFF_UPTO),
    );
  }
}
/**
 * Add's payment type to a list
 */
function addSplitpaymenttoList() {
  //   var selectedValue = $("input[name='receiptpayGroup']:checked").val();
  const selectedPaywrapper = $('#receiptpaymentList div.selectedPayment');
  if (selectedPaywrapper.length === 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.selectPaymentMethod'),
    );
    return;
  }
  const selectedValue = $(selectedPaywrapper).attr('payment_title');
  let payAmounttoadd = $('#receiptsplitpayAmount').val();
  let totalAmounttopay = $('#receiptpaymentTotalid').text();

  payAmounttoadd = Number(payAmounttoadd);
  totalAmounttopay = Number(totalAmounttopay);

  if (Number.isNaN(payAmounttoadd) || Number(payAmounttoadd) <= 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptActionController.invalidAmount'),
      0,
    );
    return;
  }
  if (selectedValue) {
    // if (
    //   $(
    //     `#receiptsplitpaylistId .${
    //       selectedValue.replace(/[^a-zA-Z ]/g, '').split(' ')[0]
    //     }`,
    //   ).length
    // ) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t('controller:orderController.paymentMethodExists'),
    //   );
    //   return;
    // }
    let remainingAmount = 0;
    let addedAmount = 0;
    const listItems = $('#receiptsplitpaylistId li');
    // eslint-disable-next-line no-restricted-syntax
    for (const li of listItems) {
      const product = $(li).get(0);
      const individualAmt = product.getAttribute('amount');
      if (individualAmt) {
        addedAmount += Number(individualAmt);
      }
    }
    remainingAmount = Number(totalAmounttopay) - addedAmount;

    const amountTocompare = Number(remainingAmount.toFixed(2));
    if (Number(payAmounttoadd) > amountTocompare) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:receiptActionController.amountIsTooBig'),
        0,
      );
      return;
    }

    const splitPyamentListItem = $('<li>', {
      id: selectedValue,
      class: selectedValue,
      amount: payAmounttoadd,
      html: `${selectedValue} : ${payAmounttoadd}`,
    });

    $('#receiptsplitpaylistId').append(splitPyamentListItem);

    remainingAmount =
      Number(remainingAmount.toFixed(window.ROUNDOFF_UPTO)) -
      Number(payAmounttoadd);
    if (remainingAmount === 0) {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t(
          'controller:receiptActionController.youCanNowSettleThePayment',
        ),
        0,
      );
    }

    $('#receiptremainingPayableamount').html(
      remainingAmount.toFixed(window.ROUNDOFF_UPTO),
    );
    $('#receiptsplitpayAmount').val(
      remainingAmount.toFixed(window.ROUNDOFF_UPTO),
    );
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptActionController.selectPaymentMethod'),
      0,
    );
  }
}

/**
 * Cleats the selected payment modes
 */
function clearSplitinfo() {
  $('#receiptsplitCheckid').empty();
  const status = $('#receiptsplitCheckid').is(':checked');
  $('#receiptremainingPayableamount').html($('#receiptpaymentTotalid').text());
  $(`#receiptsplitpaylistId`).empty();
  if (status) {
    $('#receiptpaysplistselectwrapperId').css('display', '');
    $('#receiptaddpayMethodbutton').css('display', '');
    $('#receiptsplitpayAmount').css('display', '');
    $('#receiptsplitpayAmount').val($('#receiptpaymentTotalid').text());
    $('.receiptpaymentGrandtotalclass').css('display', '');
    $('.newremainingsplitWrapper').css('display', '');
  } else {
    $('#receiptpaysplistselectwrapperId').css('display', 'none');
    $('#receiptaddpayMethodbutton').css('display', 'none');
    $('#receiptsplitpayAmount').css('display', 'none');
    $('#receiptsplitpayAmount').val('');
    $('.receiptpaymentGrandtotalclass').css('display', 'none');
    $('.newremainingsplitWrapper').css('display', 'none');
  }
}

async function getPayments() {
  const data = await makeGetpaymentsrequest();
  if (data) {
    if (data.payments) {
      const { payments } = data;
      if (payments && Array.isArray(payments) && payments.length) {
        $(`#receiptpaymentList`).empty();
        // $('#receiptTipPaymentid')

        payments.forEach((pay) => {
          const paymentModename = getPaymentTranslation(pay.payment_mode_name);

          const paymentImage = $('<img>', {
            src: `https://backoffice.tmbill.com/public/images/payment-icons/${String(
              pay.payment_mode_name,
            ).toLowerCase()}.png`,
            alt: paymentModename,
            class: 'payment-avatar',
          });

          const paymentElement = $(`<div>`, {
            html: paymentModename,
            class: 'order-payment-container mt-1 p-2',
          })
            .attr('payment_title', pay.payment_mode_name)
            .attr('payment_id', pay.id)
            .appendTo('#receiptpaymentList');

          $(paymentElement).append(paymentImage);
        });

        payments.forEach((pay) => {
          $('<option>')
            .val(pay.id)
            .text(pay.payment_mode_name)
            .appendTo('#receiptTipPaymentid');
        });
      }
    }
    if (data?.status) {
      const { status } = data;
      if (status) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(status)) {
          if (
            String(status[key]).toLocaleLowerCase() === 'pending' ||
            String(status[key]).toLocaleLowerCase() === 'deleted'
          ) {
            // eslint-disable-next-line no-continue
            continue;
          }
          $('#receiptbillstatList').append(
            `<li id= ${
              status[key]
            } class='order-status-payment-container receipt-order-status mt-1 p-2'><input type='radio' value=${
              status[key]
            } id=stat_id${status[key]} name='billStat'  /><label for=stat_id${
              status[key]
            }>${$.i18n.t(`common:billStatus.${status[key]}`)}</label></li>`,
          );
        }
      }
    }
  }
  initAccesslevelsforreceipts();
  addReceipteditbillpermission();
}

function Initialize() {
  getPayments();

  $('#receiptsplitCheckid').on('click', () => {
    clearSplitinfo();
  });
  $('#receiptaddpayMethodbutton').on('click', () => {
    addSplitpaymenttoList();
  });
  $('#receiptsplitpaylistId').on('click', 'li', function () {
    $(this).remove();
    updateSplitremainingAmt();
  });

  $('#receiptpaymentcustomerpaidamtcontainer').hide();
  $('#receiptpaymentreturnamtcontainer').hide();

  $('#receiptpaymentCustomerPaidamtid').on('change paste keyup', () => {
    let ordertotalAmount = $('#receiptpaymentTotalid').text();
    ordertotalAmount = Number(ordertotalAmount);
    // customer paid amount
    const custpaidAmount = $('#receiptpaymentCustomerPaidamtid').val();
    const tipAmount = $('#receipttipAmountid').val();
    // return amount
    const returnAmount = Number(
      Number(custpaidAmount) - Number(ordertotalAmount) - Number(tipAmount),
    ).toFixed(window.ROUNDOFF_UPTO);

    if (returnAmount > 0) $('#receiptpaymentReturnAmountid').val(returnAmount);
    if (returnAmount < 0) $('#receiptpaymentReturnAmountid').val('');
  });

  $('#receipttipAmountid').on('change paste keyup', () => {
    let ordertotalAmount = $('#receiptpaymentTotalid').text();
    ordertotalAmount = Number(ordertotalAmount);
    // customer paid amount
    const custpaidAmount = $('#receiptpaymentCustomerPaidamtid').val();
    const tipAmount = $('#receipttipAmountid').val();
    // return amount
    const returnAmount = Number(
      Number(custpaidAmount) - Number(ordertotalAmount) - Number(tipAmount),
    ).toFixed(window.ROUNDOFF_UPTO);

    if (returnAmount > 0) $('#receiptpaymentReturnAmountid').val(returnAmount);
    if (returnAmount < 0) $('#receiptpaymentReturnAmountid').val('');
  });

  $('#receiptpaymentList').on('click', 'div', function () {
    $('#receiptpaymentList div').removeClass('selectedPayment');
    $(this).addClass('selectedPayment');

    // check if payment mode is cash then show paid amount and return amount
    $('#receiptpaymentCustomerPaidamtid').val('');
    $('#receiptpaymentReturnAmountid').val('');
    const selectedPaymentModeName = $(this).text();
    if (
      selectedPaymentModeName === 'Cash' ||
      selectedPaymentModeName === 'نقدي'
    ) {
      $('#receiptpaymentcustomerpaidamtcontainer').show();
      $('#receiptpaymentreturnamtcontainer').show();
    } else {
      $('#receiptpaymentcustomerpaidamtcontainer').hide();
      $('#receiptpaymentreturnamtcontainer').hide();
    }
    if (!$('#receiptsplitCheckid').is(':checked')) {
      $('#receiptTipPaymentid').val(selectedPaymentModeName);
    }
  });

  if ($.i18n) {
    initializei18nforReceiptactionctrlwindowui();
  } else {
    setTimeout(initializei18nforReceiptactionctrlwindowui, 400);
  }
  $('#receiptdeliveryBoylistId option:gt(0)').remove();
  window.deliveryBoys?.forEach((dboy) => {
    $('<option>')
      .val(dboy.id)
      .text(dboy.name)
      .attr('phone', dboy.phone)
      .appendTo('#receiptdeliveryBoylistId');
  });

  // $('#receiptCommentid option:gt(0)').remove();
  // VOID_REASONS.forEach((reason) => {
  //   const option = $('<option>').val(reason).text(reason);
  //   $('#receiptCommentid').append(option);
  // });
  // $('#receiptCommentid')
  //   .autocomplete({
  //     source: VOID_REASONS,
  //   })
  //   .on('focus', function () {
  //     // Trigger search on focus with empty value
  //     $(this).autocomplete('search', ' ');
  //   });
  $('#receiptCommentid')
    .autocomplete({
      source: VOID_REASONS,
      select: function (event, ui) {
        // set selected value
        $(this).val(ui.item.value);

        // trigger blur
        $(this).blur();

        return false;
      },
    })
    .on('focus', function () {
      // Trigger search on focus with empty value
      $(this).autocomplete('search', ' ');
    });
}

Initialize();
