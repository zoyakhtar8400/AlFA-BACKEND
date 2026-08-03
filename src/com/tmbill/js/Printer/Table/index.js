const {
  makeGetTablesRequest,
} = require('../../../renderer/helper/Table.helper');
const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { PRINTERS_IPC } = require('../../../util/IPC_Messages');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
const billPrinter = require('./Bill');
const kotPrinter = require('./KOT');

let tablesList = [];
let tablesDeptList = [];
function preaddprintersCleanup() {
  $('#tablewisePrintersCombo').find('option:not(:first)').remove();
  $('#tablewiseprintersListid').find('tr:not(:first)').remove();

  $('#tablewisebillPrintersCombo').find('option:not(:first)').remove();
  $('#tablewisebillprintersListid').find('tr:not(:first)').remove();
}

function addsystemPrinter(element) {
  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#tablewisePrintersCombo`);

  $('<option>')
    .val(element.name)
    .text(element.name)
    .appendTo(`#tablewisebillPrintersCombo`);
}

function populateaddedPrinters(element) {
  switch (element.action_type) {
    case PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER:
      kotPrinter.populateTable(element);
      break;
    case PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER:
      billPrinter.populateTable(element);
      break;
    default:
      break;
  }
}

async function gettablesifnotExists() {
  if (tablesList && Array.isArray(tablesList) && tablesList.length === 0) {
    const data = await makeGetTablesRequest({
      store_id: window.storeDetails.store_id,
    });
    if (data) {
      tablesList = data;
      if (tablesList && Array.isArray(tablesList)) {
        tablesList.forEach((iterator) => {
          $('<option>')
            .val(iterator.table_name)
            .text(iterator.table_name)
            .appendTo('#tableslistCombo,#tablesbilllistCombo');
        });
      }
      kotPrinter.populateTableslist();
    }
  }
}

async function gettablesDeptifnotExists() {
  if (
    tablesDeptList &&
    Array.isArray(tablesDeptList) &&
    tablesDeptList.length === 0
  ) {
    tablesDeptList = window.tableDepartments;
    if (tablesList && Array.isArray(tablesDeptList)) {
      tablesDeptList.forEach((iterator) => {
        $('<option>')
          .val(iterator.id)
          .text(iterator.department_name)
          .appendTo('#tablesDeptlistCombo,#tablesDeptbilllistCombo');
      });
    }
  }
}

function initElements() {
  kotPrinter.initElements();
  billPrinter.initElements();

  PRINTER_SIZES_WITH_ID.forEach((element) => {
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#tablwiseprintssizesCombo');
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#tablwisebillprintssizesCombo');
  });
}

module.exports = {
  preaddprintersCleanup,
  addsystemPrinter,
  populateaddedPrinters,
  initElements,
  gettablesifnotExists,
  gettablesDeptifnotExists,
};
