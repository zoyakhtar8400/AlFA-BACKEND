/* eslint-disable camelcase */
/* eslint-disable func-names */
// require('../../../packages/choices.js/css/index.css');
const Choices = require('../../../packages/choices.js/index');

const { ORDER_SOURCE, ORDER_SOURCE_MAP } = require('../../../constant');
const { getPrinters } = require('../../../renderer/helper/Home.helper');
const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { BILLINGTYPES_MAP } = require('../../../util/DBUtil');
const { PRINTERS_IPC, ADD_PRINTER } = require('../../../util/IPC_Messages');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
const { safeParse } = require('../../../util/RendererUtils');

const printersSizes = PRINTER_SIZES_WITH_ID;

let categorychoicesElement;

function populateCategorylist(selectedList = []) {
  categorychoicesElement.clearChoices();
  $('.choices__list').find('div:not(:first)').remove();

  if (categorychoicesElement) {
    const list = window.categoriesList.map((c) => ({
      label: c.category_name,
      value: c.category_name,
      selected: selectedList && selectedList.includes(c.category_name),
    }));
    // Array.from(Array(20).keys()).forEach((a) => {
    //   list.push({
    //     label: `Label ${a}`,
    //     value: `Value ${a}`,
    //   });
    // });

    categorychoicesElement.setChoices(list);
  }
}

function clearFields() {
  // $('#addcategoryprinterButton').attr('printer_id', 0).val('Add');
  switch (window.selectedLanguage) {
    case 'en':
      $('#addcategoryprinterButton').attr('printer_id', 0).val('Add');
      break;
    case 'ar':
      $('#addcategoryprinterButton').attr('printer_id', 0).val('اصافة');
      break;
    default:
      $('#addcategoryprinterButton').attr('printer_id', 0).val('Add');
      break;
  }
  $('#categorykotprintCopiesid').val('');
  $('#categorysizesCombo').val($('#categorysizesCombo option:first').val());
  $('#categorykotordertypelistCombo').val(
    $('#categorykotordertypelistCombo option:first').val(),
  );

  $('#categorykotPrintersCombo').val(
    $('#categorykotPrintersCombo option:first').val(),
  );
  $('#categoryordersourcelistCombo').val(
    $('#categoryordersourcelistCombo option:first').val(),
  );
  $(
    '#categorylistCombo,#categorykotordertypelistCombo,#categoryordersourcelistCombo',
  ).prop('disabled', false);

  // $('#categorylistCombo').val($('#categorylistCombo option:first').val());
  if (categorychoicesElement) {
    categorychoicesElement.clearChoices();
    categorychoicesElement.enable();
    populateCategorylist();
  }
}

function tablerowEditlistener(clickedElement) {
  clearFields();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      $('#categorykotPrintersCombo').val(element.device_name);
      // $('#categorylistCombo').val(element.title);
      $(
        '#categorylistCombo,#categorykotordertypelistCombo,#categoryordersourcelistCombo',
      ).prop('disabled', true);
      $('#categorysizesCombo').val(printersSizes[element.printer_size - 1]);

      if (!Number.isNaN(element.no_of_prints)) {
        $('#categorykotprintCopiesid').val(element.no_of_prints);
      }

      const moreInfo = safeParse(element.more_info || {});

      // $('#addcategoryprinterButton')
      //   .val('Update')
      //   .attr('printer_id', element.id);
      switch (window.selectedLanguage) {
        case 'en':
          $('#addcategoryprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
        case 'ar':
          $('#addcategoryprinterButton')
            .val('تحديث')
            .attr('printer_id', element.id);
          break;
        default:
          $('#addcategoryprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
      }

      if (moreInfo) {
        // Billing Ty
        $('#categorykotordertypelistCombo').val(moreInfo.billing_type);
        $('#categoryordersourcelistCombo').val(moreInfo.app_source);

        if (categorychoicesElement && moreInfo.category) {
          categorychoicesElement.clearChoices();
          categorychoicesElement.enable();
          populateCategorylist(moreInfo.category);
          // categorychoicesElement.disable();
        }
      }
    }
  }
}

function populateTable(element) {
  const tableID = 'categoryprintersListid';
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

  const orderType = $('<td>', {
    html:
      window.orderTypes[moreInfo?.billing_type || '1']?.order_type || 'Default', // BILLINGTYPES_MAP[moreInfo?.billing_type || '1'],
  });

  const row = $('<tr>')
    .append(title)
    .append(deviceName)
    .append(size)
    .append(prints)
    .append(source)
    .append(orderType)
    .append(icon)
    .append(deleteIcon)
    .attr('details', JSON.stringify(currentDetails))
    .attr('printerTitle', element.id)
    .attr('groupTitle', element.title);

  table.append(row);
}

function getNextgrouptitlenumber() {
  const currentRows = $('#categoryprintersListid tbody').find('tr').length;
  let title = `Group ${(currentRows || 0) + 1}`;

  if (currentRows) {
    const lastgrpTitle = $('#categoryprintersListid tr:last').attr(
      'groupTitle',
    );
    if (lastgrpTitle) {
      let lastdigit = lastgrpTitle.replace(/^\D+/g, '');
      if (lastdigit) {
        lastdigit = Number(lastdigit);
        title = `Group ${(lastdigit || 0) + 1}`;
      }
    }
  }
  return title;
}
/**
 * Adds the order type printer or updates
 * @param {table printer action type} type
 */
function addorupdatePrinter(type) {
  if (type) {
    const selectedPrinter = $(
      '#categorykotPrintersCombo option:not([disabled]):selected',
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
      '#categorykotordertypelistCombo option:not([disabled]):selected',
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

    const orderSource = $(
      '#categoryordersourcelistCombo option:not([disabled]):selected',
    ).val();

    if (!orderSource) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselectsource'),
        0,
      );
      return;
    }

    const selectedCats = categorychoicesElement.getValue(true);
    if (!selectedCats || selectedCats.length === 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:expenseNotifications.Pleaseselectcategoryfirst'),
        0,
      );
      return;
    }

    const selectedorderTypevalue = $(
      '#categorykotordertypelistCombo option:not([disabled]):selected',
    ).val();

    let selectedSize = $(
      '#categorysizesCombo option:not([disabled]):selected',
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

    let no_of_prints = $('#categorykotprintCopiesid').val() || '1';
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
          let title = selectedCats.join(',');
          if (selectedCats.length > 3) {
            title = getNextgrouptitlenumber();
            // title = selectedCats.join(',');
          }

          const createPrinter = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints: no_of_prints || 1,
            action_type: PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER,
            title,
            more_info: {
              billing_type: selectedorderTypevalue,
              app_source: orderSource,
              category: selectedCats,
            },
          };

          window.ipcRenderer.send(ADD_PRINTER, {
            printerInfo: createPrinter,
            for: 'categoryprintersListid',
          });
          clearFields();
          getPrinters();
          // window.ipcRenderer.callMain('get-printers', {});
        }
        break;
      case updateButton:
        {
          const printerID = $('#addcategoryprinterButton').attr('printer_id');
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
            `#categoryprintersListid tbody tr[printerTitle="${printerID}"]`,
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
  $('#categoryordersourcelistCombo').val(
    $('#categoryordersourcelistCombo option:first').val(),
  );

  let activeBillingtypes = [];
  if (window.storeDetails && window.storeDetails.custom_quickbill_ordertypes) {
    activeBillingtypes = String(
      window.storeDetails.custom_quickbill_ordertypes,
    ).split(',');
  }

  $('<option>')
    .val('all')
    .text($.i18n.t('settingScreen.Printer.printFor.DEFAULT'))
    .appendTo('#categorykotordertypelistCombo,#categoryordersourcelistCombo');

  Object.keys(window.orderTypes).forEach((key) => {
    // Object.keys(BILLINGTYPES_MAP)
    if (activeBillingtypes.includes(key)) {
      $('<option>')
        .val(key)
        .text(window.orderTypes[Number(key)].order_type) // BILLINGTYPES_MAP[key]
        .appendTo('#categorykotordertypelistCombo');
    }
  });

  ORDER_SOURCE.forEach((key) => {
    $('<option>')
      .val(key.value)
      .text(key.title)
      .appendTo('#categoryordersourcelistCombo');
  });

  $(document).on(
    'click',
    '#categoryprintersListid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this);
    },
  );

  $(document).on(
    'click',
    '#categoryprintersListid tbody tr i.editPrinter',
    function () {
      tablerowEditlistener(this);
    },
  );

  $('#addcategoryprinterButton').on('click', function () {
    addorupdatePrinter($(this).val());
  });

  $('#clearcategorykotinfoButton').on('click', clearFields);

  const element = document.querySelector('#categorylistCombo');
  categorychoicesElement = new Choices(element, {
    placeholderValue: $.i18n.t('controller:expenseController.selectCategory'),
    removeItemButton: true,
    noResultsText: $.i18n.t('settingScreen.Printer.NORESULTSTEXT'),
    noChoicesText: $.i18n.t('settingScreen.Printer.NOCHOICESTEXT'),
    itemSelectText: $.i18n.t('settingScreen.Printer.ITEMSELECTTEXT'),
    classNames: {
      containerOuter: ['choices', 'categoryMultiselect'],
    },
  });
}

module.exports = {
  populateTable,
  initElements,
  populateCategorylist,
};
