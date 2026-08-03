/* eslint-disable camelcase */
const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const {
  updateOrderDataRequest,
} = require('../../renderer/helper/Order.helper');
const { default: Swal } = require('sweetalert2');
const { sleep } = require('../../util/MiscUtil');

let paymentStatus;
const START_BHARATPE_TRX = `https://pay.tmbill.com/v1/bharatpe/StartTransaction`;
const CHECK_BHARATPE_TRX = `https://pay.tmbill.com/v1/bharatpe/CheckTransaction`;

const START_PHONEPE_TRX = `https://pay.tmbill.com/v1/phonepe/StartTransaction`;
// const START_PHONEPE_TRX = `https://staging.tmbill.com/pay/v1/phonepe/StartTransaction`;

async function checkTransaction(payload) {
  let successorFailure = false;
  const { data } = await apiCall.post(CHECK_BHARATPE_TRX, payload, {
    headers: getHeadersformposforrender(),
  });
  successorFailure =
    data &&
    data.bharatpe_response &&
    data.bharatpe_response.success &&
    data.bharatpe_response.realCode === 'P2P_DEVICE_TXN_DONE';
  paymentStatus = data;
  return successorFailure;
}

async function generateBharatpeQR(params) {
  try {
    if (!params || !params.order_id || !params.amount) {
      return;
    }
    const payload = {
      store_id: window.storeDetails.store_id,
      tmpos_id: window.storeDetails.tmpos_id,
      customer_mobile: '',
      order_id: params.order_id,
      amount: Number(params.amount).toFixed(2),
    };
    console.log(
      `Message="Sending BharatPe Start Transaction" OrderID="${params.order_id}"`,
    );
    const { data } = await apiCall.post(START_BHARATPE_TRX, payload, {
      headers: getHeadersformposforrender(),
      timeout: 10000,
    });
    const upiString =
      data.status &&
      data.bharatpe_response &&
      data.status &&
      data.bharatpe_response.upiString;
    if (upiString) {
      updateOrderDataRequest({
        field2: upiString,
        order_id: params.order_id,
      });
      return upiString;
    }
  } catch (error) {
    console.error(
      `Message="Error While Sending BharatPe Start Transaction" OrderID="${params.order_id}"`,
      error,
    );
    window.notifyUser.showMessage(
      'error',
      'Seems you have network issue while generating UPI QR code',
    );
  }
}

async function generatePhonepeQR(params) {
  try {
    if (!params || !params.order_id || !params.amount) {
      return;
    }
    const payload = {
      store_id: window.storeDetails.store_id,
      tmpos_id: window.storeDetails.tmpos_id,
      customer_mobile: '',
      order_id: params.order_id,
      amount: Number(params.amount).toFixed(2),
    };
    console.log(
      `Message="Sending PhonePe Start Transaction" OrderID="${params.order_id}"`,
    );
    const { data } = await apiCall.post(START_PHONEPE_TRX, payload, {
      headers: getHeadersformposforrender(),
      timeout: 10000,
    });
    const upiString =
      data.status &&
      data.phonepe_response &&
      data.status &&
      data.phonepe_response.data &&
      data.phonepe_response.data.qrString;
    if (upiString) {
      updateOrderDataRequest({
        field2: upiString,
        order_id: params.order_id,
      });
      return upiString;
    }
  } catch (error) {
    console.error(
      `Message="Error While Sending PhonePe Start Transaction" OrderID="${params.order_id}"`,
      error,
    );
    window.notifyUser.showMessage(
      'error',
      'Seems you have network issue while generating UPI QR code',
    );
  }
}

async function sendSunmiRequest(payload) {
  Swal.fire({
    title: 'Processing Payment...',
    html: `<div id="sunmiPaymentMessageContainerid"><div id="sunmiPaymentLoaderid" class="loader"></div><p id='sunmiPaymentMessageid'>We are processing your payment for ${payload.amount} on ${payload.currentTable.data.table_name}. Please wait...</p></div>`,
    allowOutsideClick: false,
    showCancelButton: true,
    showConfirmButton: false,
    cancelButtonText: 'Cancel',
    customClass: {
      htmlContainer: 'sunmi-loader-container',
    },
    didOpen: async () => {
      if (window.isSunmiConfigured === 1) {
        let request = 1;
        const {
          amount,
          order_id,
          table_id,
          payment_option,
          store_id,
          tmpos_id,
          currentTable,
        } = payload;
        let response = await apiCall.post(
          window.Config.links.startSunmiTransaction,
          { store_id, tmpos_id, amount, order_id },
          { headers: getHeadersformposforrender(), timeout: 60000 },
        );

        // if response not success then check transaction once again
        if (
          response &&
          response.data &&
          response.data.status === 200 &&
          response.data.paymentStatus !== 'success' &&
          request === 1
        ) {
          request += 1;
          response = await apiCall.post(
            window.Config.links.checkSunmiTransaction,
            { store_id, tmpos_id, amount, order_id },
            { headers: getHeadersformposforrender(), timeout: 60000 },
          );
        }
        if (
          response &&
          response.data &&
          response.data.status === 200 &&
          response.data.paymentStatus === 'success'
        ) {
          // update payment transactions
          Swal.update({
            icon: 'success',
            title: 'Payment Successful!',
            // html: `Post title: ${data.title}`,
            showCancelButton: false,
          });
          $('#sunmiPaymentLoaderid').hide();
          $('#sunmiPaymentMessageid').addClass('sunmiPaymentSuccess');
          $('#sunmiPaymentMessageid').html(
            `Your payment of ${Number(payload.amount).toFixed(window.ROUNDOFF_UPTO)} for ${payload.currentTable.data.table_name} has been completed successfully.`,
          );

          await sleep(1500);
          const paymentData = {
            isSplitpayment: false,
            table_id,
            addasdueChecked: false,
            billTotal: amount,
            order_id,
            paymentName: payment_option,
            printBill: 1,
            paymentDetails: {
              order_id,
              payment_option,
              amount,
            },
          };
          const paymentDetails = {
            order_id,
            payment_option,
            amount,
          };
          currentTable.data.details.paymentDetails = paymentDetails;
          currentTable.data.details.payment_mode =
            paymentDetails.payment_option;
          currentTable.data.details.paymentAdded = true;

          if (!payload.forQuickbill) {
            await window.initUpdatePayment(paymentData);
          } else {
            $('#quickbillsettleButton').click();
            window.notifyUser.showMessage(
              'success',
              $.i18n.t('controller:orderController.paymentAdded'),
            );
            // $('#quickbillsettleButton').click();
          }
        } else {
          Swal.update({
            icon: 'error',
            title: 'Payment Failed!',
            // html: `Post title: ${data.title}`,
            showCancelButton: true,
          });
          $('#sunmiPaymentLoaderid').hide();
          $('#sunmiPaymentMessageid').addClass('sunmiPaymentFailure');
          $('#sunmiPaymentMessageid').html(
            `Your payment of ${Number(payload.amount).toFixed(window.ROUNDOFF_UPTO)} for ${payload.currentTable.data.table_name} has been failed.`,
          );
        }
      }
    },
  }).then(async (result) => {
    if (result.dismiss === Swal.DismissReason.cancel) {
      // cancelRequested = true
      // implement cancel request
      const response = await apiCall.post(
        window.Config.links.cancelSunmiTransaction,
        payload,
        {
          headers: getHeadersformposforrender(),
        },
      );
    }
  });
}

module.exports = {
  generateBharatpeQR,
  generatePhonepeQR,
  sendSunmiRequest,
};
