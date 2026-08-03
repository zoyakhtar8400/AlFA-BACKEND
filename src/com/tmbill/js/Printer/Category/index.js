const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
const kotPrinter = require('./KOT');

function preaddprintersCleanup() {
  $('#categorykotPrintersCombo').find('option:not(:first)').remove();
  $('#categoryprintersListid').find('tr:not(:first)').remove();
}

function addsystemPrinter(element) {
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#categorykotPrintersCombo`);
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#categorybillPrintersCombo`);
}

function populateaddedPrinters(element) {
  switch (element.action_type) {
    case PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER:
      kotPrinter.populateTable(element);
      break;
    default:
      break;
  }
}

function initCategorylist() {
  if (window.categoriesList && window.categoriesList.length > 0) {
    $('#categorylistCombo option:gt(0)').remove();

    setTimeout(() => {
      kotPrinter.populateCategorylist();
    }, 1000);
    // window.categoriesList.forEach((element) => {
    //   $('<option>')
    //     .val(element.category_name)
    //     .text(element.category_name)
    //     .appendTo('#categorylistCombo');
    // });
  }
}

function initElements() {
  kotPrinter.initElements();
  // billPrinter.initElements();

  PRINTER_SIZES_WITH_ID.forEach((element) => {
    $('<option>').val(element).text(element).appendTo('#categorysizesCombo');
  });
}

module.exports = {
  preaddprintersCleanup,
  addsystemPrinter,
  populateaddedPrinters,
  initElements,
  initCategorylist,
};
