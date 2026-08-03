/* eslint-disable camelcase */
const { addZatcaDataRequest } = require('../../renderer/helper/Order.helper');
const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');

async function generateZatcaQR(params) {
  try {
    if (!params || !params.order_id) {
      return;
    }
    const { order_id, store_id } = params;
    const payload = {
      store_id: window.storeDetails.store_id,
      order_id: [order_id],
      manual: true,
    };
    console.log(
      `Message="Sending generate Zatca QR request" OrderID="${params.order_id}"`,
    );
    const { data } = await apiCall.post(
      window.Config.links.zatcaInvoice,
      payload,
      {
        headers: getHeadersformposforrender(),
        // timeout: 10000,
      },
    );
    // const data = {
    //   status: 400,
    //   orders: [
    //     {
    //       order_id: 'awuvlW83eNLt61A4567',
    //       response: {
    //         status: 3,
    //         invoiceHash: '3a4OTIEFZjQrusQAkooFki1CXjC3QJcZQvUuoxG+XLQ=',
    //         qr: 'AUTZhdi32LnZhSDYqNin2KjYtdmK2YQg2YTYqtmC2K/ZitmFINin2YTZiNis2KjYp9iqIC0g2KfZhNi52LLZitiy2YrYqQIPMzAyMTU1MzUxMTAwMDAzAxMyMDI0LTExLTMwVDE0OjMyOjI4BAEyBQQwLjI2Bix0TE1obXQycTFpQ3hUdXBqaFJqdlJuUmhMenFlZnlOQnlXUG5LQ0Z2Zko4PQdgTUVZQ0lRRCt3eEFSN21qbGtYVlZwbnBpbzAydjdJbi9OS0NtWCs3Z2JaQ3RGV0owU3dJaEFNTVowTGd3ZE95MWs5RDI0UTVIdVh2V2JHbm5sL0hZaXk0aFJNM2YvUnhQCFgwVjAQBgcqhkjOPQIBBgUrgQQACgNCAARLqx7wf7P4EpiKRtCVROIOg9wBqI3oef72wkpDzP4o/0pUGWQ3jbVuLtnJLbTFr76jb0bDumZz0nHRmNOsL63FCUgwRgIhAI34DdnK3Q654tngcVHvKd6O0Iy/H/A1t1DRGl3zHonFAiEA7VRfeOwt2UBGxwBV8BC+U43qvRnDnHR0aT2VSf9i0Pg=',
    //         uuid: '9b07e2ad-7830-4d36-9f35-1f7295f1289f',
    //         complianceResponse: {},
    //         renewCertificates: false,
    //       },
    //     },
    //   ],
    // };
    const qrString =
      data.status &&
      data.orders &&
      data.orders.length &&
      data.orders[0].response.qr;
    if (qrString) {
      const order = data.orders[0].response;
      addZatcaDataRequest({
        qr: qrString,
        order_id: params.order_id,
        store_id,
        status: data.orders[0].response.status,
      });
      return qrString;
    }
  } catch (error) {
    console.error(
      `Message="Error While Sending Zatca QR request" OrderID="${params.order_id}"`,
      error,
    );
    window.notifyUser.showMessage(
      'error',
      'Seems you have network issue while generating Zatca QR code',
    );
  }
}

async function generateJoranEInvoiceQR(params) {
  try {
    if (!params || !params.order_id) {
      return;
    }
    const { order_id, store_id } = params;
    const payload = {
      store_id: window.storeDetails.store_id,
      order_id: [order_id],
      manual: true,
    };
    console.log(
      `Message="Sending generate Jordan E invoice QR request" OrderID="${params.order_id}"`,
    );
    const { data } = await apiCall.post(
      window.Config.links.jordanEinvoice,
      payload,
      {
        headers: getHeadersformposforrender(),
        // timeout: 10000,
      },
    );
    if (
      data &&
      data.orders &&
      data.orders[0] &&
      data.orders[0].einvoice_status === 'completed'
    ) {
      const qrString =
        data.status &&
        data.orders &&
        data.orders.length &&
        data.orders[0].einvoice_response.submission.qrBase64;
      if (qrString) {
        const order = data.orders[0].response;
        addZatcaDataRequest({
          qr: qrString,
          order_id: params.order_id,
          store_id,
          // status: data.orders[0].response.status,
        });
        return qrString;
      }
    }
  } catch (error) {
    console.error(
      `Message="Error While Sending Zatca QR request" OrderID="${params.order_id}"`,
      error,
    );
    window.notifyUser.showMessage(
      'error',
      'Seems you have network issue while generating Zatca QR code',
    );
  }
}

module.exports = {
  generateZatcaQR,
  generateJoranEInvoiceQR,
};
