const {
  initializei18nforReceiptactionctrlwindowui,
} = require('./i18nController');
const { addReceipteditbillpermission } = require('./PasscodeController');
const { initAccesslevelsforreceipts } = require('./AccesslevelManager');
const { getPaymentTranslation } = require('../locales/Utils');

window.receiptactionscriptLoaded = true;

function Initialize() {
  ipcRenderer.send('get-status-n-payments', '');

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

  if ($.i18n) {
    initializei18nforReceiptactionctrlwindowui();
  } else {
    setTimeout(initializei18nforReceiptactionctrlwindowui, 400);
  }
}

/**
 * Updates the split payment remaining info
 */
function updateSplitremainingAmt() {
  const listItems = $('#receiptsplitpaylistId li');
  let addedAmount = 0;
  const totalAmounttopay = $('#receiptpaymentTotalid').text();
  for (const li of listItems) {
    const product = $(li).get(0);
    const individualAmt = product.getAttribute('amount');
    if (individualAmt) {
      addedAmount += Number(individualAmt);
    }
  }
  const remainingAmount = Number(totalAmounttopay) - addedAmount;
  if (addedAmount == 0) {
    $('#receiptremainingPayableamount').html($('#receiptGrandlabelid').text());
  } else {
    $('#receiptremainingPayableamount').html(remainingAmount.toFixed(2));
    $('#receiptsplitpayAmount').html(remainingAmount.toFixed(2));
  }
}
/**
 * Add's payment type to a list
 */
function addSplitpaymenttoList() {
  const selectedValue = $("input[name='receiptpayGroup']:checked").val();
  const payAmounttoadd = $('#receiptsplitpayAmount').val();
  const totalAmounttopay = $('#receiptpaymentTotalid').text();

  if (isNaN(payAmounttoadd) || Number(payAmounttoadd) <= 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:modifybillnotifications.Invalidamount'),
      0,
    );
    return;
  }
  if (selectedValue) {
    // if ($("#receiptsplitpaylistId #" + selectedValue).length) {
    //     window.notifyUser.showMessage('error', "Payment Method Exists", 0);
    //     return;
    // }
    if (
      $(
        `#receiptsplitpaylistId .${
          selectedValue.replace(/[^a-zA-Z ]/g, '').split(' ')[0]
        }`,
      ).length
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.paymentMethodExists'),
      );
      return;
    }
    let remainingAmount = 0;
    let addedAmount = 0;
    const listItems = $('#receiptsplitpaylistId li');
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
        $.i18n.t('controller:modifybillnotifications.Amountistoobig'),
        0,
      );
      return;
    }

    // $("#receiptsplitpaylistId").append("<li id="
    //     + selectedValue
    //     + " class="
    //     + selectedValue.split(' ')[0]
    //     + " amount="
    //     + payAmounttoadd
    //     + ">"
    //     + selectedValue + " : " + payAmounttoadd
    //     + "</li>");

    const splitPyamentListItem = $('<li>', {
      id: selectedValue,
      class: selectedValue.split(' ')[0],
      amount: payAmounttoadd,
      html: `${selectedValue} : ${payAmounttoadd}`,
    });

    $('#receiptsplitpaylistId').append(splitPyamentListItem);

    remainingAmount =
      Number(remainingAmount.toFixed(2)) - Number(payAmounttoadd);
    if (remainingAmount == 0) {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t(
          'controller:modifybillnotifications.Youcannowsettlethepayment',
        ),
        0,
      );
    }

    $('#receiptremainingPayableamount').html(remainingAmount.toFixed(2));
    $('#receiptsplitpayAmount').val(remainingAmount.toFixed(2));
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.selectPaymentMethod'),
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
  } else {
    $('#receiptpaysplistselectwrapperId').css('display', 'none');
    $('#receiptaddpayMethodbutton').css('display', 'none');
    $('#receiptsplitpayAmount').css('display', 'none');
    $('#receiptsplitpayAmount').val('');
    $('.receiptpaymentGrandtotalclass').css('display', 'none');
  }
}

// ipcRenderer.on('get-status-n-payments-reply', (event, content) => {
//   if (content) {
//     let data = JSON.parse(content);
//     if (data) {
//       if (data.hasOwnProperty('payments')) {
//         let payments = data['payments'];
//         if (payments != undefined && payments.constructor === Array) {
//           payments.forEach((element) => {
//             let liElement = $('<li>');
//             let liradioInput = $('<input>', {
//               type: 'radio',
//               name: 'receiptpayGroup',
//               value: element.payment_mode_name,
//               id: `receiptpayName_${element.id}`,
//               payid: element.id,
//             });
//             let liradioInputlabel = $('<label>', {
//               html: element.payment_mode_name,
//               for: `receiptpayName_${element.id}`,
//             });
//             liElement.append(liradioInput);
//             liElement.append(liradioInputlabel);
//             $('#receiptpaymentList').append(liElement);
//           });
//         }
//       }
//       if (data.hasOwnProperty('status')) {
//         let status = data['status'];
//         if (status != undefined) {
//           for (var key of Object.keys(status)) {
//             if (String(status[key]).toLocaleLowerCase() === 'pending') {
//               continue;
//             }
//             $('#receiptbillstatList').append(
//               '<li id= ' +
//                 status[key] +
//                 "><input type='radio' value=" +
//                 status[key] +
//                 ' id=stat_id' +
//                 status[key] +
//                 " name='billStat'  /><label for=stat_id" +
//                 status[key] +
//                 '>' +
//                 status[key] +
//                 '</label></li>',
//             );
//           }
//         }
//       }
//     }
//     initAccesslevelsforreceipts();
//     addReceipteditbillpermission();
//   }
// });

ipcRenderer.on('get-status-n-payments-reply', (event, content) => {
  if (content) {
    const data = JSON.parse(content);
    if (data) {
      if (data.hasOwnProperty('payments')) {
        const { payments } = data;
        if (payments != undefined && payments.constructor === Array) {
          // payments.forEach((element) => {
          //   let liElement = $('<li>');
          //   let liradioInput = $('<input>', {
          //     type: 'radio',
          //     name: 'receiptpayGroup',
          //     value: element.payment_mode_name,
          //     id: `receiptpayName_${element.id}`,
          //     payid: element.id,
          //   });
          //   let liradioInputlabel = $('<label>', {
          //     html: element.payment_mode_name,
          //     for: `receiptpayName_${element.id}`,
          //   });
          //   liElement.append(liradioInput);
          //   liElement.append(liradioInputlabel);
          //   $('#receiptpaymentList').append(liElement);
          // });
          $('#payselectionCombo option:gt(0)').remove();
          $(`#orderwindowPaymentlist`).empty();

          payments.forEach((pay) => {
            const paymentModename = getPaymentTranslation(
              pay.payment_mode_name,
            );
            $('<option>')
              .val(pay.id)
              .text(pay.payment_mode_name)
              .appendTo('#payselectionCombo');

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
        }
      }
      if (data.hasOwnProperty('status')) {
        const { status } = data;
        if (status != undefined) {
          for (const key of Object.keys(status)) {
            if (String(status[key]).toLocaleLowerCase() === 'pending') {
              continue;
            }
            $('#receiptbillstatList').append(
              `<li id= ${status[key]}><input type='radio' value=${
                status[key]
              } id=stat_id${status[key]} name='billStat'  /><label for=stat_id${
                status[key]
              }>${status[key]}</label></li>`,
            );
          }
        }
      }
    }
    initAccesslevelsforreceipts();
    addReceipteditbillpermission();
  }
});

Initialize();
