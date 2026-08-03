/* eslint-disable camelcase */
const { openCashDrawer } = require('@devraghu/cashdrawer');
const { Printer } = require('../../js/database');

let printer_name;

async function getPrinter() {
  const printer = await Printer.findOne({
    raw: true,
    where: {
      action_type: 14,
    },
  });
  return printer;
}
async function openCashDrawerFunction() {
  try {
    // const printers = getAvailablePrinters();
    if (!printer_name) {
      const printer = await getPrinter();
      if (printer && printer.device_name) {
        printer_name = printer.device_name;
      }
    }
    const result = openCashDrawer(printer_name);

    if (!result.success) {
      console.log(result.errorMessage);
    } else {
      console.log('Cash drawer opened successfully!');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

module.exports = {
  openCashDrawerFunction,
};
