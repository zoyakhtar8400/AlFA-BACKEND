const { HttpStatusCode } = require('axios');
const { UserShift } = require('../../js/database');
const { closeuserShift } = require('../../main_controllers/MasterMenu');
const {
  getSettledBillsAsPerPaymentMode,
  startUsershift,
  closeDay,
  getOrderSummary,
  checkIfKOTIsRunningForCloseDay,
  checkIfAllShiftsAreClosedForCloseDay,
} = require('../../main_controllers/Account');
const { checkBillIsRunning } = require('../../main_controllers/Order');
const { getShiftwiseReport } = require('../../main_controllers/Reports');

async function checkPreCloseShift(data) {
  try {
    if (data) {
      const response = await UserShift.isusershiftStarted(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check pre close shift Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking pre close shift" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function checkUserShiftStarted(data) {
  try {
    if (data) {
      const response = await UserShift.checkIfshiftstarted(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check pre close shift Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking pre close shift" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function StartShift(data) {
  try {
    if (data) {
      const response = await startUsershift(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid start shift Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While starting shift" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function CloseShift(data) {
  try {
    if (data) {
      const response = await closeuserShift(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid close shift Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While closing shift" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function CloseDayAndShift(data) {
  try {
    if (data) {
      const response = await closeDay(data);
      const result = await UserShift.isusershiftStarted({
        shift_start_by_user: data.closeshiftInfo.shift_start_by_user,
        tmpos_id: global.storeDetails.tmpos_id,
        store_id: global.storeDetails.store_id,
      });
      if (result && result.id) {
        response.id = result.id;
        Object.assign(data, {
          id: result.id,
          shift_started_by_user: data.shift_end_by_user,
        });
      }
      const closeUserShiftResponse = await closeuserShift(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
        closeUserShiftResponse,
      });
      return response;
    }
    console.warn(
      `Message="Invalid close day Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While closing day" Payload="${JSON.stringify(data)}"`,
      error,
    );
    return {
      status: 'failed',
      message: 'Something went wrong. Please try again',
    };
  }
  return undefined;
}

async function getSettledBillsAsPerPaymentModeRequest(data) {
  try {
    if (data) {
      const response = await getSettledBillsAsPerPaymentMode(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid get settled bills as per payment mode Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While fetching settled bills as per payment mode" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function checkIfBillIsRunningModeRequest(data) {
  try {
    if (data) {
      console.log('checkIfBillIsRunningModeRequest data:', data);
      const response = await checkBillIsRunning();
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check bill is running Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking bill running" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function checkIfKOTIsRunningModeRequest(data) {
  try {
    if (data) {
      const response = await checkIfKOTIsRunningForCloseDay(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check KOT is running Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking KOT running" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function checkIfAllShiftsAreClosedRequest(data) {
  try {
    if (data) {
      const response = await checkIfAllShiftsAreClosedForCloseDay(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid check all shifts are closed Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking all shifts are closed" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function getOrderSummaryhandlerRequest(data) {
  try {
    if (data) {
      const response = await getOrderSummary(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid get order summary Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While fetching order summary" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function getShiftwiseReporthandlerRequest(data) {
  try {
    if (data) {
      const response = await getShiftwiseReport(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid get shift wise report Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While fetching shift wise report" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

module.exports = {
  checkPreCloseShift,
  checkUserShiftStarted,
  StartShift,
  CloseShift,
  CloseDayAndShift,
  getSettledBillsAsPerPaymentModeRequest,
  checkIfBillIsRunningModeRequest,
  getOrderSummaryhandlerRequest,
  getShiftwiseReporthandlerRequest,
  checkIfKOTIsRunningModeRequest,
  checkIfAllShiftsAreClosedRequest,
};
