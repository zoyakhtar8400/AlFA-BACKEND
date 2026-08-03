const { checkBillIsPrinted } = require('../../main_controllers/Order');

async function requestisBillPrinted(data) {
  try {
    if (data) {
      const result = await checkBillIsPrinted(data);
      return result;
    }
    console.warn(
      `Message="Invalid Check Bill Printed Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Checking If Bill Is Printed" Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

module.exports = {
  requestisBillPrinted,
};
