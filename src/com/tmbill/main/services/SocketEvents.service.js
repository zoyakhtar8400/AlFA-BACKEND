const { getrunningorderDetails } = require('../../main_controllers/Order');
const { safeParseformain } = require('../../main_controllers/Utils');

async function getRunningOrderDataForOrderHub(content) {
  if (content) {
    const responseData = await getrunningorderDetails(
      safeParseformain(content),
    );
    const reqContent = safeParseformain(content);
    if (reqContent && reqContent.settleBill) {
      Object.assign(responseData, { settleBill: true });
      if (reqContent.username) {
        Object.assign(responseData, { username: reqContent.username });
      }
    }
    if (reqContent && reqContent.isRequestFromCsk) {
      Object.assign(responseData, { isRequestFromCsk: true });
    }
    if (reqContent && (reqContent.printBill || reqContent.print)) {
      Object.assign(responseData, { printBill: true });
    }

    if (reqContent && reqContent.payment_mode) {
      Object.assign(responseData, { payment_mode: reqContent.payment_mode });
    }

    if (reqContent && reqContent.cust_paid_amount) {
      Object.assign(responseData, {
        cust_paid_amount: reqContent.cust_paid_amount,
        return_amount: reqContent.return_amount,
      });
    }

    if (reqContent && reqContent.autoSettled) {
      Object.assign(responseData, { autoSettled: true });
    }

    if (reqContent && reqContent.sendImageToCSK) {
      Object.assign(responseData, { sendImageToCSK: true });
    }

    if (reqContent && reqContent.printBillOnBothSide) {
      Object.assign(responseData, { printBillOnBothSide: true });
    }

    if (reqContent && reqContent.socketUserId) {
      Object.assign(responseData, { socketUserId: reqContent.socketUserId });
    }

    if (reqContent && reqContent.printWidth) {
      Object.assign(responseData, { printWidth: reqContent.printWidth });
    }

    if (reqContent && reqContent.cskPrintEvent) {
      Object.assign(responseData, { cskPrintEvent: reqContent.cskPrintEvent });
    }

    if (reqContent && reqContent.username) {
      Object.assign(responseData, { username: reqContent.username });
    }
    return responseData;
  }
  return undefined;
}

module.exports = {
  getRunningOrderDataForOrderHub,
};
