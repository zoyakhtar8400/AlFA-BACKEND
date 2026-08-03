const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
// const billPrinter = require('./Bill');
const kotPrinter = require('./KOT');

function preaddprintersCleanup() {
  $('#kitchenkotPrintersCombo').find('option:not(:first)').remove();
  $('#kitchenprintersListid').find('tr:not(:first)').remove();
}

function addsystemPrinter(element) {
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#kitchenkotPrintersCombo`);
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#kitchenbillPrintersCombo`);
}

function populateaddedPrinters(element) {
  switch (element.action_type) {
    case PRINTER_ACTION_TYPES.KD_KOT_PRINTER:
      kotPrinter.populateTable(element);
      break;
    case PRINTER_ACTION_TYPES.KD_BILL_PRINTER:
      // billPrinter.populateTable(element);
      break;
    default:
      break;
  }
}

function initElements() {
  kotPrinter.initElements();
  // billPrinter.initElements();

  PRINTER_SIZES_WITH_ID.forEach((element) => {
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#kitchendepartmentssizesCombo');
  });
}

module.exports = {
  preaddprintersCleanup,
  addsystemPrinter,
  populateaddedPrinters,
  initElements,
};
