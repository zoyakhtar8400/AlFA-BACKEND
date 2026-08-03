const axios = require('axios');
const { default: Swal } = require('sweetalert2');
const { PAYMENT_STATUS, PAY_GATEWAY_TYPES } = require('../util/Constants');
const { showLoader } = require('./CommonUtils');
const { apiCall } = require('../services/APIService');

function getPaymentstatus(status) {
  let statusLabel = 'failed';
  try {
    if (status) {
      if (PAYMENT_STATUS.SUCCESS.includes(status)) {
        statusLabel = 'success';
      }
      if (PAYMENT_STATUS.PENDING.includes(status)) {
        statusLabel = 'pending';
      }
    }
  } catch (error) {}
  return statusLabel;
}

async function openPaymentsListModal() {
  $('#paymentsListModal').modal('show');
  $('#paymentsListID').empty();

  showLoader({
    title: $.i18n.t('Fetching Payment details'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  let result = await apiCall.get(Config.links.getstorePayment, {
    params: {
      store_id: window.storeDetails.store_id,
    },
  });

  if (result) {
    Swal.close();

    let paymentList = result?.data?.data;
    paymentList.forEach(async (payment) => {
      await showPaymentInfo(payment);
    });
  }
}

async function showPaymentInfo(payment) {
  let paymentsCard = $('<li>', {
    class: 'card w-100 paymentListCard',
  });

  //customer info row
  let row0 = $('<div>', {
    class: 'row',
  });

  let row0col1 = $('<div>', {
    class: 'col-7 ',
    html: `${payment.payload.payerAccName}`,
    title: payment.payload.payerAccName,
  });

  let mobileicon = $('<i>', {
    class: 'fa fa-mobile',
  });

  let row0col2 = $('<div>', {
    class: 'col-5 ',
    html: ` - ${payment.payload.payerMobileNO}`,
    title: payment.payload.payerMobileNO,
  });

  row0col2.prepend(mobileicon);
  row0.append(row0col1);
  row0.append(row0col2);

  let row1 = $('<div>', {
    class: 'row',
  });

  const orderDetails = payment && payment.order;

  let row1col1 = $('<div>', {
    class: 'col-4 payOrderId',
    html: payment.master_orderid,
    title: payment.master_orderid,
  });

  let row1col2 = $('<div>', {
    class: 'col-3 payBillNumber',
    html: `Bill - ${(orderDetails && orderDetails.bill_number) || ''}`,
  });

  let row1col3 = $('<div>', {
    class: 'col payAmount',
    html: `${payment.currency || window.currency} - ${payment.amount}`,
  });

  let row1col4 = $('<div>', {
    class: 'col',
    html: '',
  });

  const paymentStatusvalue = getPaymentstatus(payment.status);
  let payStatus = $('<span>', {
    class: `statusLabel ${String(paymentStatusvalue).toLowerCase()}`,
    html: paymentStatusvalue,
  });

  row1col4.append(payStatus);

  row1.append(row1col1);
  row1.append(row1col2);
  row1.append(row1col3);
  row1.append(row1col4);

  let row2 = $('<div>', {
    class: 'row',
  });

  let row2col1 = $('<div>', {
    class: 'col-4 payDate',
    // html: formattedDate,
    // title: formattedDate
    html: payment.payload.date,
    title: payment.payload.date,
  });

  let row2col2 = $('<div>', {
    class: 'col-3 payTableName',
    html: `Table - ${(orderDetails && orderDetails.table_name) || ''}`,
  });

  row2.append(row2col1);
  row2.append(row2col2);

  let icon = '../assets/paygateways/quickbill.png';
  switch (payment.pay_gateway_flag) {
    case PAY_GATEWAY_TYPES.RAZOR_PAY:
      let RazorPay = $('<div>', {
        class: 'col-2 paygateway',
        html: `RazorPay`,
      });
      icon = '../assets/paygateways/razorpay.png';
      row2.append(RazorPay);
      break;

    case PAY_GATEWAY_TYPES.PAYU_MONEY:
      let PayUmoney = $('<div>', {
        class: 'col-2 paygateway',
        html: `PayU`,
      });
      icon = '../assets/paygateways/payu.png';
      row2.append(PayUmoney);
      break;

    case PAY_GATEWAY_TYPES.COD:
      let COD = $('<div>', {
        class: 'col-2 paygateway',
        html: `COD`,
      });
      icon = '../assets/paygateways/payu.png';
      row2.append(COD);
      break;

    case PAY_GATEWAY_TYPES.PAYU:
      let payU = $('<div>', {
        class: 'col-2 paygateway',
        html: `PayU`,
      });
      icon = '../assets/paygateways/newpayu.png';
      row2.append(payU);
      break;

    case PAY_GATEWAY_TYPES.PAY_LATER:
      let PayLater = $('<div>', {
        class: 'col-2 paygateway',
        html: `PayLater`,
      });
      icon = '../assets/paygateways/newpayu.png';
      row2.append(PayLater);
      break;

    case PAY_GATEWAY_TYPES.PAYTM:
      let Paytm = $('<div>', {
        class: 'col-2 paygateway',
        html: `Paytm`,
      });
      icon = '../assets/paygateways/paytm.png';
      row2.append(Paytm);
      break;

    case PAY_GATEWAY_TYPES.UPSALE:
      let upSale = $('<div>', {
        class: 'col-2 paygateway',
        html: `UpSale`,
      });
      icon = '../assets/paygateways/paytm.png';
      row2.append(upSale);
      break;

    case PAY_GATEWAY_TYPES.UPI:
      let upi = $('<div>', {
        class: 'col-2 paygateway',
        html: `UPI`,
      });
      icon = '../assets/paygateways/upi.png';
      row2.append(upi);
      break;

    default:
      let online = $('<div>', {
        class: 'col-2 paygateway',
        html: `Online`,
      });
      icon = '../assets/paygateways/upi.png';
      row2.append(online);
      break;
  }

  let row2col4 = $('<div>', {
    class: 'col-2',
    html: '',
  });
  row2.append(row2col4);

  let cardBody = $('<div>', {
    class: 'card-body paymentsListCard',
    html: '',
  });

  let paymentIcon = $('<img>', {
    class: 'payment-icon',
    src: icon,
  });

  let paymentIconcontainer = $('<div>', {
    class: 'payment-icon',
  });
  paymentIconcontainer.append(paymentIcon);

  cardBody.append(row0);
  cardBody.append(row1);
  cardBody.append(row2);

  // paymentsCard.append(paymentIconcontainer);
  paymentsCard.append(cardBody);
  $('#paymentsListID').append(paymentsCard);
}

module.exports = {
  openPaymentsListModal,
};
