const {
  autoReduceInventoryRequest,
} = require('../../main_controllers/Mainprocessmisc');

async function requestAutoReduceInventory(data) {
  try {
    if (data) {
      await autoReduceInventoryRequest(data);
      return undefined;
    }
    console.warn(
      `Message="Invalid reduce inventory payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While reduce inventory" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

module.exports = {
  requestAutoReduceInventory,
};
