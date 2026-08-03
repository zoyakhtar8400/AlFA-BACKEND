/* eslint-disable camelcase */
/* eslint-disable func-names */
const { ORDER_SOURCE, ORDER_SOURCE_MAP } = require('../../../constant');
const { getPrinters } = require('../../../renderer/helper/Home.helper');
const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { BILLINGTYPES_MAP } = require('../../../util/DBUtil');
const { PRINTERS_IPC, ADD_PRINTER } = require('../../../util/IPC_Messages');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
const { safeParse } = require('../../../util/RendererUtils');

const printersSizes = PRINTER_SIZES_WITH_ID;

function clearFields() {
  // $('#addordertypewisebillprinterButton').val('Add').attr('printer_id', 0);
  switch (window.selectedLanguage) {
    case 'en':
      $('#addordertypewisebillprinterButton').attr('printer_id', 0).val('Add');
      break;
    case 'ar':
      $('#addordertypewisebillprinterButton')
        .attr('printer_id', 0)
        .val('اصافة');
      break;
    default:
      $('#addordertypewisebillprinterButton').attr('printer_id', 0).val('Add');
      break;
  }
  $('#ordertypewisebillprintCopiesid').val('');
  $('#ordertypewisebillprintersizesCombo').val(
    $('#ordertypewisebillprintersizesCombo option:first').val(),
  );
  $('#billordertypewisesourcelistCombo').val(
    $('#billordertypewisesourcelistCombo option:first').val(),
  );

  $('#billordertypewiselistCombo').val(
    $('#billordertypewiselistCombo option:first').val(),
  );
  $('#billordertypewisesourcelistCombo').val(
    $('#billordertypewisesourcelistCombo option:first').val(),
  );

  $('#ordertypewisebillPrintersCombo').val(
    $('#ordertypewisebillPrintersCombo option:first').val(),
  );
  $('#billordertypewiselistCombo,#billordertypewisesourcelistCombo').prop(
    'disabled',
    false,
  );
}

function ordertypebillEditlistener(clickedElement) {
  clearFields();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      $('#ordertypewisebillPrintersCombo').val(element.device_name);
      $('#billordertypewiselistCombo').val(element.title);
      $('#billordertypewiselistCombo,#billordertypewisesourcelistCombo').prop(
        'disabled',
        true,
      );
      $('#ordertypewisebillprintersizesCombo').val(
        printersSizes[element.printer_size - 1],
      );
      if (!Number.isNaN(element.no_of_prints)) {
        $('#ordertypewisebillprintCopiesid').val(element.no_of_prints);
      }

      switch (window.selectedLanguage) {
        case 'en':
          $('#addordertypewisebillprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
        case 'ar':
          $('#addordertypewisebillprinterButton')
            .val('تحديث')
            .attr('printer_id', element.id);
          break;
        default:
          $('#addordertypewisebillprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
      }
      // $('#addordertypewisebillprinterButton')
      //   .attr('printer_id', element.id)
      //   .val('Update');

      const moreInfo = safeParse(element.more_info || {});
      if (moreInfo) {
        // Billing Ty
        $('#billordertypewiselistCombo').val(moreInfo.billing_type);
        $('#billordertypewisesourcelistCombo').val(moreInfo.app_source);
      }
    }
  }
}

function populateTable(element) {
  const tableID = 'ordertypewisebillprintersListid';

  const currentDetails = {
    title: element.title,
    device_name: element.device_name,
    printer_size: element.printer_size,
    no_of_prints: element.no_of_prints,
    id: element.id,
    more_info: element.more_info,
  };
  const table = $(`#${tableID}`);
  const printerTitle = `${element.title}`;

  const moreInfo = safeParse(currentDetails.more_info);

  const title = $('<td>', {
    html: printerTitle,
    title: printerTitle,
  });
  const deviceName = $('<td>', {
    html: element.device_name,
  });
  const size = $('<td>', {
    html: printersSizes[element.printer_size - 1],
  });
  const prints = $('<td>', {
    html: element.no_of_prints,
  });
  const icon = $('<td>', {
    html: "<i class='fas fa-pen editPrinter'></i></td>",
  });

  const deleteIcon = $('<td>', {
    html: "<i class='fas fa-trash deletePrinter'></i></td>",
  });

  const source = $('<td>', {
    html: ORDER_SOURCE_MAP[moreInfo?.app_source],
  });

  const row = $('<tr>')
    .append(title)
    .append(deviceName)
    .append(size)
    .append(prints)
    .append(source)
    .append(icon)
    .append(deleteIcon)
    .attr('details', JSON.stringify(currentDetails))
    .attr('printerTitle', element.id);

  table.append(row);
}

/**
 * Adds the order type printer or updates
 * @param {table printer action type} type
 */
function addorupdatePrinter(type) {
  if (type) {
    const selectedPrinter = $(
      '#ordertypewisebillPrintersCombo option:not([disabled]):selected',
    ).text();
    if (!selectedPrinter) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselectprinter'),
        0,
      );
      return;
    }

    const selectedorderType = $(
      '#billordertypewiselistCombo option:not([disabled]):selected',
    ).text();
    if (!selectedorderType) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:printcontrollernotifications.Pleaseselectordertype',
        ),
        0,
      );
      return;
    }

    const selectedorderTypevalue = $(
      '#billordertypewiselistCombo option:not([disabled]):selected',
    ).val();

    const orderSource = $(
      '#billordertypewisesourcelistCombo option:not([disabled]):selected',
    ).val();

    if (!orderSource) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselectsource'),
        0,
      );
      return;
    }

    let selectedSize = $(
      '#ordertypewisebillprintersizesCombo option:not([disabled]):selected',
    ).text();

    if (!selectedSize) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:printcontrollernotifications.Pleaseselectpapersize',
        ),
        0,
      );
      return;
    }
    selectedSize = printersSizes.indexOf(Number(selectedSize));
    if (selectedSize < 0) {
      selectedSize = 2;
    } else {
      selectedSize += 1;
    }

    let no_of_prints = $('#ordertypewisebillprintCopiesid').val();
   if (no_of_prints < 0) {
  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:printcontrollernotifications.Numberofcopiesshouldbepositivenumber'),
    0
  );
  return;
}

    if (no_of_prints) {
      if (no_of_prints > 5) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:printcontrollernotifications.Numberofcopieslengthshouldbelessthanfivedigit',
          ),
        );
        return;
      }

      if (Number.isNaN(no_of_prints)) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:printcontrollernotifications.Pleaseentervalidnumber',
          ),
        );
        return;
      }
    }
    try {
      no_of_prints = parseInt(no_of_prints, 10);
    } catch (error) {
      no_of_prints = 1;
    }

    let addButton = 'Add';
    let updateButton = 'Update';
    switch (window.selectedLanguage) {
      case 'en':
        addButton = 'Add';
        updateButton = 'Update';
        break;
      case 'ar':
        addButton = 'اصافة';
        updateButton = 'تحديث';
        break;
      default:
        addButton = 'Add';
        updateButton = 'Update';
        break;
    }
    switch (type) {
      case addButton:
        {
          const createPrinter = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints: no_of_prints || 1,
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            title: selectedorderType,
            more_info: {
              billing_type: selectedorderTypevalue,
              app_source: orderSource,
            },
          };
          window.ipcRenderer.send(ADD_PRINTER, {
            printerInfo: createPrinter,
            for: 'ordertypewisebillprintersListid',
          });
          clearFields();
          getPrinters();
          // window.ipcRenderer.callMain('get-printers', {});
        }
        break;
      case updateButton:
        {
          const printerID = $('#addordertypewisebillprinterButton').attr(
            'printer_id',
          );
          if (!printerID) {
            return;
          }
          const updateData = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints: no_of_prints || 1,
          };
          const whereData = {
            where: {
              id: Number(printerID),
            },
          };
          const params = { updateData, whereData };
          window.ipcRenderer.send('update-printer', JSON.stringify(params));
          // printerTitle
          const row = $(
            `#ordertypewisebillprintersListid tbody tr[printerTitle="${
              printerID
            }"]`,
          );
          let details = $(row).attr('details');
          if (row.length > 0) {
            const tableRows = $(row).children();
            $(tableRows[1]).html(selectedPrinter);
            $(tableRows[2]).html(printersSizes[selectedSize - 1]);
            $(tableRows[3]).html(no_of_prints);

            try {
              details = JSON.parse(details);
              details.device_name = selectedPrinter;
              details.printer_size = selectedSize;
              details.no_of_prints = no_of_prints;
              $(row).attr('details', JSON.stringify(details));
            } catch (error) {
              console.error(error);
            }
          }
        }

        break;
      default:
        break;
    }

    clearFields();
  }
}

async function deletePrinter(clickedElement) {
  clearFields();

  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      window.ipcRenderer.send(PRINTERS_IPC.DELETE_PRINTER, {
        id: element.id,
      });

      $(clickedElement).closest('tr').remove();
    }
  }
}

function initElements() {
  $('#billordertypewiselistCombo').val(
    $('#billordertypewiselistCombo option:first').val(),
  );

  $('#billordertypewisesourcelistCombo').val(
    $('#billordertypewisesourcelistCombo option:first').val(),
  );

  let activeBillingtypes = [];
  if (window.storeDetails && window.storeDetails.custom_quickbill_ordertypes) {
    activeBillingtypes = String(
      window.storeDetails.custom_quickbill_ordertypes,
    ).split(',');
  }
  activeBillingtypes = ['0', '1', '2', '3', ...activeBillingtypes];

  $('<option>')
    .val('all')
    .text($.i18n.t('settingScreen.Printer.printFor.DEFAULT'))
    .appendTo('#billordertypewiselistCombo,#billordertypewisesourcelistCombo');

  Object.keys(window.orderTypes).forEach((key) => {
    // Object.keys(BILLINGTYPES_MAP)
    if (activeBillingtypes.includes(key)) {
      $('<option>')
        .val(key)
        .text(window.orderTypes[Number(key)]?.order_type) // BILLINGTYPES_MAP[key]
        .appendTo('#billordertypewiselistCombo');
    }
  });

  ORDER_SOURCE.forEach((key) => {
    $('<option>')
      .val(key.value)
      .text(key.title)
      .appendTo('#billordertypewisesourcelistCombo');
  });

  $(document).on(
    'click',
    '#ordertypewisebillprintersListid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this);
    },
  );

  $(document).on(
    'click',
    '#ordertypewisebillprintersListid tbody tr i.editPrinter',
    function () {
      ordertypebillEditlistener(this);
    },
  );

  $('#addordertypewisebillprinterButton').on('click', function () {
    addorupdatePrinter($(this).val());
  });

  $('#clearordertypewisebillprinterButton').on('click', clearFields);
}

module.exports = {
  initElements,
  populateTable,
};
