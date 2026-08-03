const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
const billPrinter = require('./Bill');
const kotPrinter = require('./KOT');

function preaddprintersCleanup() {
  $('#ordertypewisekotPrintersCombo').find('option:not(:first)').remove();
  $('#kottypewisebillPrintersCombo').find('option:not(:first)').remove();
  $('#ordertypewisebillPrintersCombo').find('option:not(:first)').remove();

  $('#ordertypewisekotprintersListid').find('tr:not(:first)').remove();
  $('#ordertypewisebillprintersListid').find('tr:not(:first)').remove();
}

function addsystemPrinter(element) {
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#ordertypewisekotPrintersCombo`);
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#ordertypewisebillPrintersCombo`);
}

function populateaddedPrinters(element) {
  switch (element.action_type) {
    case PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT:
      kotPrinter.populateTable(element);
      break;
    case PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL:
      billPrinter.populateTable(element);
      break;
    default:
      break;
  }
}

function initElements() {
  kotPrinter.initElements();
  billPrinter.initElements();

  PRINTER_SIZES_WITH_ID.forEach((element) => {
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#ordertypewisekotprintersizesCombo');
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#ordertypewisebillprintersizesCombo');
  });
}

module.exports = {
  preaddprintersCleanup,
  addsystemPrinter,
  populateaddedPrinters,
  initElements,
};
