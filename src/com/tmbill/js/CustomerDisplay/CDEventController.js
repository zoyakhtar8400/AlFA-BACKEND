/* eslint-disable camelcase */
const { CD_EVENTS } = require('../../main/CustomerDisplay/Events');
const {
  updateOrderDataRequest,
} = require('../../renderer/helper/Order.helper');
const { generateBharatpeQR, generatePhonepeQR } = require('../BharatPe');
const { sendTableClickEvent } = require('../ClientrequestHandler');

function setQrCodeToCurrentTable(currenttableButton, code) {
  Object.assign(currenttableButton.data.details, {
    field2: code,
  });
}

async function sendTableClickEventFunction(
  orderAmount,
  orderid,
  field2,
  table_id,
  currenttableButton,
  order_number,
) {
  if (window.accessOfCustomerDisplay) {
    if (window.isbharatpeConfigured && orderAmount && orderid) {
      const bharatPeQRCode = await generateBharatpeQR({
        order_id: orderid,
        amount: orderAmount,
      });
      let code;
      if (bharatPeQRCode) {
        code = bharatPeQRCode;

        // save qr code to database
        updateOrderDataRequest({
          field2: code,
          order_id: orderid,
        });
        setQrCodeToCurrentTable(currenttableButton, code);
        // sendTableClickEvent({
        //   table_id: table_id ? table_id : 0,
        //   message: 'Table clicked',
        //   order_total: orderAmount || 0,
        // });
      }
    } else if (window.isPhonePeConfigured && orderAmount && orderid) {
      const phonePeQRCode = await generatePhonepeQR({
        order_id: orderid,
        amount: orderAmount,
      });
      let code;
      if (phonePeQRCode) {
        code = phonePeQRCode;

        // save qr code to database
        updateOrderDataRequest({
          field2: code,
          order_id: orderid,
        });
        setQrCodeToCurrentTable(currenttableButton, code);
        // sendTableClickEvent({
        //   table_id: table_id ? table_id : 0,
        //   message: 'Table clicked',
        //   order_total: orderAmount || 0,
        // });
      }
    } else if (window.storeDetails.upi_id && orderAmount && orderid) {
      let code = `upi://pay?pa=${window.storeDetails.upi_id}&pn=${
        window.storeDetails.store_name
      }&cu=${window.storeDetails.currency_code}&am=${orderAmount.toFixed(
        window.ROUNDOFF_UPTO,
      )}`;
      code += `&tr=${orderid}`;
      // save qr code to database
      await updateOrderDataRequest({
        field2: code,
        order_id: orderid,
      });
      setQrCodeToCurrentTable(currenttableButton, code);
      // sendTableClickEvent({
      //   table_id: table_id ? table_id : 0,
      //   message: 'Table clicked',
      //   order_total: orderAmount || 0,
      // });
    }
  }
  // if (!window.__IS_MASTER_POS__) {
  sendTableClickEvent({
    table_id: table_id || 0,
    message: 'Table clicked',
    order_total: orderAmount || 0,
    bill_number: currenttableButton?.data?.details?.order_id,
    kot_numbers: currenttableButton?.data?.details?.kot_numbers,
    order_state: currenttableButton?.data?.details?.order_state,
    customer_name: currenttableButton?.data?.details?.customer?.name,
    order_number: order_number || 0,
  });
  if (
    window.accessOfCustomerDisplay &&
    currenttableButton &&
    currenttableButton.data &&
    currenttableButton.data.details
  ) {
    const state = {
      total: Number(currenttableButton.data.details.order_total).toFixed(
        window.ROUNDOFF_UPTO,
      ),
      items: currenttableButton.data.details.items,
      billNumber: currenttableButton.data.details.order_id,
      qrCode: currenttableButton.data.details.field2,
    };
    window.sendStatetolocalcustomerdisplay(state);
  }
  // }
}

window.sendStatetolocalcustomerdisplay = (state) => {
  window.ipcRenderer.send(CD_EVENTS.UPDATE_STATE, state || {});
};

window.refreshcustomerdisplay = () => {
  window.ipcRenderer.send(CD_EVENTS.REFRESH, {});
};

module.exports = {
  sendTableClickEventFunction,
};
