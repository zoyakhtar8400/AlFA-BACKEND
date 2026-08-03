const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { sleep } = require('../../util/MiscUtil');
const { Swal } = require('../../util/Notification');
const { pWaitFor } = require('../../util/p-waitfor');
const { showLoader } = require('../CommonUtils');

let paymentStatus;

async function checkTransaction(payload) {
  let successorFailure = false;
  const { data } = await apiCall.post(Config.links.CHECK_EZETAP_TRX, payload, {
    headers: getHeadersformposforrender(),
  });
  successorFailure =
    data &&
    data.eztap_response &&
    data.eztap_response.success &&
    data.eztap_response.realCode === 'P2P_DEVICE_TXN_DONE';
  paymentStatus = data;
  return successorFailure;
}

async function sendstartTransaction(params) {
  try {
    if (!params || !params.order_id || !params.amount) {
      return;
    }
    const payload = {
      store_id: window.storeDetails.store_id,
      tmpos_id: window.storeDetails.tmpos_id,
      customer_mobile: '',
      order_id: params.order_id,
      amount: params.amount,
    };
    console.log(
      `Message="Sending Ezetap Start Transaction" OrderID="${params.order_id}"`,
    );
    const { data } = await apiCall.post(
      Config.links.START_EZETAP_TRX,
      payload,
      {
        headers: getHeadersformposforrender(),
      },
    );

    const success =
      data.status &&
      data.eztap_response &&
      data.status &&
      data.eztap_response.success;
    const transactionExists = data.ezetap_transaction;

    if (!transactionExists) {
      const message =
        (data.eztap_response && data.eztap_response.message) ||
        (success ? 'Request Created' : 'Request Creation Failed');
      window.notifyUser.showMessage(success ? 'success' : 'error', message);
    }

    if (success || transactionExists) {
      await sleep(100);
      Swal.isVisible() && Swal.close();
      // Show Loader
      showLoader({
        title: 'Checking Payment Status',
        text: $.i18n.t('controller:orderController.pleaseWait'),
      });
      await pWaitFor(() => checkTransaction(payload), {
        interval: 5000,
        timeout: {
          milliseconds: 40000,
          fallback: () => {
            console.log('Time’s up! executed the fallback function!');
          },
        },
      });
      Swal.isVisible() && Swal.close();
      if (paymentStatus && paymentStatus.eztap_response) {
        const ispaymentDone = paymentStatus.eztap_response.success;
        if (ispaymentDone) {
          window.notifyUser.showMessage(
            'success',
            paymentStatus.eztap_response.message || 'Payment Received',
          );
        } else {
          window.notifyUser.showMessage(
            'error',
            paymentStatus.eztap_response.message || 'Payment Not Received',
          );
        }
      } else {
        window.notifyUser.showMessage('error', 'Payment Not Received');
      }

      paymentStatus = undefined;
    }
  } catch (error) {
    console.error(
      `Message="Error While Sending Ezetap Start Transaction" OrderID="${params.order_id}"`,
      error,
    );
  }
}

module.exports = {
  sendstartTransaction,
};
