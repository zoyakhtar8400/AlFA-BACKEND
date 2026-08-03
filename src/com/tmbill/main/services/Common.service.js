const { Payment } = require('../../js/database');
const { openCashDrawer } = require('../../main_controllers/CashDrawer');
const { startEndDayDateData } = require('../../main_controllers/MasterMenu');
const {
  updateliveitemstatus,
  getrunningKotitems,
} = require('../../main_controllers/Order');
const { checkUserpasscodeandaccess } = require('../../main_controllers/User');
const {
  getWaiterNotification,
} = require('../../main_controllers/WaiterNotification');

async function requestgetLivestatus(data) {
  try {
    if (data) {
      const result = await getrunningKotitems(data);
      return result;
    }
    console.warn(
      `Message="Invalid Update Live Status Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error Updating Live Status"`, error);
  }
  return undefined;
}

async function requestUpdateliveitemstatus(data) {
  try {
    if (data) {
      const result = await updateliveitemstatus(data);
      return result;
    }
    console.warn(
      `Message="Invalid Update Live Item Status Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.log(`Message="Error Updating Live Item Status"`, error);
  }
  return undefined;
}

async function requestPasccodeaccesscheck(data) {
  try {
    if (data) {
      const result = await checkUserpasscodeandaccess(data);
      return result;
    }
    console.warn(
      `Message="Invalid Check Passcode Access Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Checking User Passcode Access"  Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestWaiterNotifications(data) {
  try {
    if (data) {
      const result = await getWaiterNotification(data);
      return result;
    }
    console.warn(
      `Message="Invalid get waiter notification Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While fetching waiter notifications"  Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}
async function requesStartEndDayDateData(data) {
  try {
    if (data) {
      const result = await startEndDayDateData(data);
      return result;
    }
    console.warn(
      `Message="Invalid get start end day data Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While fetching start end day data "  Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}
async function requestOpenCashDrawer(data) {
  try {
    if (data) {
      const result = await openCashDrawer(data);
      return result;
    }
  } catch (error) {
    console.error(
      `Message="Error While opening cash drawer"  Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestGetPaymentModesData(data) {
  try {
    const payments = await Payment.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: global.storeDetails.store_id,
      },
    });
    return payments;
  } catch (error) {
    console.error(
      `Message="Error While fetching payment modes "  Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

module.exports = {
  requestOpenCashDrawer,
  requestUpdateliveitemstatus,
  requestgetLivestatus,
  requestPasccodeaccesscheck,
  requestWaiterNotifications,
  requesStartEndDayDateData,
  requestGetPaymentModesData,
};
