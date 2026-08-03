const {
  setRservationIdToTable,
  createReservationRecord,
} = require('../../main_controllers/TableRservation');
require('../../main_controllers/WaiterNotification');

async function requestassignReservationtotable(data) {
  try {
    if (data && data.store_id) {
      const response = await setRservationIdToTable(data);
      return response;
    }
    console.warn(
      `Message="Invalid Assign Reservation to Table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Getting Waiter Notifications " Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

async function requestcreateReservation(data) {
  try {
    if (data) {
      const response = await createReservationRecord(data);
      return response;
    }
    console.warn(
      `Message="Invalid Create Reservation Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Creating Reservation." Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

module.exports = {
  requestassignReservationtotable,
  requestcreateReservation,
};
