/* eslint-disable camelcase */
/* eslint-disable func-names */
const { ORDER_SOURCE, ORDER_SOURCE_MAP } = require('../../../constant');
const Choices = require('../../../packages/choices.js');
const { getPrinters } = require('../../../renderer/helper/Home.helper');
const { PRINTER_ACTION_TYPES } = require('../../../util/Constants');
const { PRINTERS_IPC, ADD_PRINTER } = require('../../../util/IPC_Messages');
const { PRINTER_SIZES_WITH_ID } = require('../../../util/PrintersUtil');
const { safeParse } = require('../../../util/RendererUtils');

const printersSizes = PRINTER_SIZES_WITH_ID;

let tablechoicesElement;

function populateTableslist(selectedList = []) {
  tablechoicesElement.clearChoices();
  $('.choices__list').find('div:not(:first)').remove();

  if (tablechoicesElement) {
    const list = window.allTableslist.map((t) => ({
      label: t.table_name,
      value: t.id,
      selected: selectedList && selectedList.includes(t.id),
    }));

    tablechoicesElement.setChoices(list);
  }
}
function getNextgrouptitlenumber() {
  const currentRows = $('#tablewiseprintersListid tbody').find('tr').length;
  let title = `Group ${(currentRows || 0) + 1}`;

  if (currentRows) {
    const lastgrpTitle = $('#tablewiseprintersListid tr:last').attr(
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
function clearFields() {
  // $('#addtablewiseprinterButton').attr('printer_id', 0).val('Add');
  switch (window.selectedLanguage) {
    case 'en':
      $('#addtablewiseprinterButton').attr('printer_id', 0).val('Add');
      break;
    case 'ar':
      $('#addtablewiseprinterButton').attr('printer_id', 0).val('اصافة');
      break;
    default:
      $('#addtablewiseprinterButton').attr('printer_id', 0).val('Add');
      break;
  }
  $('#tablewiseprintCopiesid').val('');
  $('#tablwiseprintssizesCombo').val(
    $('#tablwiseprintssizesCombo option:first').val(),
  );
  $('#tableslistCombo').val($('#tableslistCombo option:first').val());
  $('#tablesDeptlistCombo').val($('#tablesDeptlistCombo option:first').val());
  $('#tablewisePrintersCombo').val(
    $('#tablewisePrintersCombo option:first').val(),
  );
  $('#tablekotordersourcelistCombo').val(
    $('#tablekotordersourcelistCombo option:first').val(),
  );
  $('#tableslistCombo,#tablesDeptlistCombo,#tablekotordersourcelistCombo').prop(
    'disabled',
    false,
  );
  if (tablechoicesElement) {
    tablechoicesElement.clearChoices();
    tablechoicesElement.enable();
    populateTableslist();
  }
}

function tablerowEditlistener(clickedElement) {
  clearFields();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      $('#tablewisePrintersCombo').val(element.device_name);
      // $('#tableslistCombo').val(element.title);
      $('#tableslistCombo,#tablekotordersourcelistCombo').prop(
        'disabled',
        true,
      );
      $('#tablwiseprintssizesCombo').val(
        printersSizes[element.printer_size - 1],
      );

      if (!Number.isNaN(element.no_of_prints)) {
        $('#tablewiseprintCopiesid').val(element.no_of_prints);
      }

      const moreInfo = safeParse(element.more_info || {});

      // $('#addtablewiseprinterButton')
      //   .val('Update')
      //   .attr('printer_id', element.id);
      switch (window.selectedLanguage) {
        case 'en':
          $('#addtablewiseprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
        case 'ar':
          $('#addtablewiseprinterButton')
            .val('تحديث')
            .attr('printer_id', element.id);
          break;
        default:
          $('#addtablewiseprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
      }
      console.log('moreInfo::', moreInfo);

      if (moreInfo) {
        $('#tablekotordersourcelistCombo').val(moreInfo.app_source);
        if (tablechoicesElement && moreInfo.table) {
          tablechoicesElement.clearChoices();
          tablechoicesElement.enable();
          populateTableslist(moreInfo.table);
          // categorychoicesElement.disable();
        }
      }
    }
  }
}

function tableDeptrowEditlistener(clickedElement) {
  clearFields();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      $('#tablewisePrintersCombo').val(element.device_name);
      $('#tablesDeptlistCombo').val(element.title);
      $('#tablesDeptlistCombo,#tablekotordersourcelistCombo').prop(
        'disabled',
        true,
      );
      $('#tablwiseprintssizesCombo').val(
        printersSizes[element.printer_size - 1],
      );

      if (!Number.isNaN(element.no_of_prints)) {
        $('#tablewiseprintCopiesid').val(element.no_of_prints);
      }

      const moreInfo = safeParse(element.more_info || {});

      // $('#addtablewiseprinterButton')
      //   .val('Update')
      //   .attr('printer_id', element.id);
      switch (window.selectedLanguage) {
        case 'en':
          $('#addtablewiseprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
        case 'ar':
          $('#addtablewiseprinterButton')
            .val('تحديث')
            .attr('printer_id', element.id);
          break;
        default:
          $('#addtablewiseprinterButton')
            .val('Update')
            .attr('printer_id', element.id);
          break;
      }

      if (moreInfo) {
        $('#tablekotordersourcelistCombo').val(moreInfo.app_source);
      }
    }
  }
}

function populateTable(element) {
  const tableID = 'tablewiseprintersListid';
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

  // const orderType = $('<td>', {
  //   html: BILLINGTYPES_MAP[moreInfo?.billing_type || '1'],
  // });

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
      '#tablewisePrintersCombo option:not([disabled]):selected',
    ).text();
    if (!selectedPrinter) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselectprinter'),
        0,
      );
      return;
    }

    // const selectedDepartment = $(
    //   '#tableslistCombo option:not([disabled]):selected',
    // ).text();
    const selectedTables = tablechoicesElement.getValue(true);

    if (!selectedTables) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselecttable'),
        0,
      );
      return;
    }

    const orderSource = $(
      '#tablekotordersourcelistCombo option:not([disabled]):selected',
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
      '#tablwiseprintssizesCombo option:not([disabled]):selected',
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

    let no_of_prints = $('#tablewiseprintCopiesid').val() || '1';
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
          let title = selectedTables.join(',');
          if (selectedTables.length > 3) {
            title = getNextgrouptitlenumber();
            // title = selectedCats.join(',');
          }
          const createPrinter = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints: no_of_prints || 1,
            action_type: PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
            title,
            more_info: {
              app_source: orderSource,
              table: selectedTables,
            },
          };

          window.ipcRenderer.send(ADD_PRINTER, {
            printerInfo: createPrinter,
            for: 'tablewiseprintersListid',
          });
          clearFields();
          getPrinters();
          // window.ipcRenderer.callMain('get-printers', {});
        }
        break;
      case updateButton:
        {
          const printerID = $('#addtablewiseprinterButton').attr('printer_id');
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
            `#tablewiseprintersListid tbody tr[printerTitle="${printerID}"]`,
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
  $('#tablekotordersourcelistCombo').val(
    $('#tablekotordersourcelistCombo option:first').val(),
  );

  $('<option>')
    .val('all')
    .text($.i18n.t('settingScreen.Printer.printFor.DEFAULT'))
    .appendTo('#tablekotordersourcelistCombo');

  ORDER_SOURCE.forEach((key) => {
    $('<option>')
      .val(key.value)
      .text(key.title)
      .appendTo('#tablekotordersourcelistCombo');
  });

  $(document).on(
    'click',
    '#tablewiseprintersListid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this);
    },
  );

  $(document).on(
    'click',
    '#tablewiseprintersListid tbody tr i.editPrinter',
    function () {
      tablerowEditlistener(this);
    },
  );

  $('#tablesDeptlistCombo').on('change', () => {
    const tableDept = $('#tablesDeptlistCombo').val();
    console.log('table dept', tableDept);
    const tables = window.allTableslist.filter(
      (t) => t.department === Number(tableDept),
    );
    const tableNames = tables.map((table) => table.id);
    populateTableslist(tableNames);
  });

  $('#addtablewiseprinterButton').on('click', function () {
    addorupdatePrinter($(this).val());
  });

  $('#cleartablwiseprinterButton').on('click', clearFields);

  if (
    window.outletKitchenDepartments &&
    window.outletKitchenDepartments.length > 0
  ) {
    window.outletKitchenDepartments.forEach((element) => {
      $('<option>')
        .val(element.kitchen_dept_name)
        .text(element.kitchen_dept_name)
        .appendTo('#kitchendepartmentsCombo');
    });
  }

  const element = document.querySelector('#tablelistCombo');
  tablechoicesElement = new Choices(element, {
    placeholderValue: $.i18n.t('settingScreen.Printer.selectTable'),
    removeItemButton: true,
    noResultsText: $.i18n.t('settingScreen.Printer.NORESULTSTEXT'),
    noChoicesText: $.i18n.t('settingScreen.Printer.NOCHOICESTEXT'),
    itemSelectText: $.i18n.t('settingScreen.Printer.ITEMSELECTTEXT'),
    classNames: {
      containerOuter: ['choices', 'tablesMultiselect'],
    },
  });
}

module.exports = {
  populateTable,
  initElements,
  populateTableslist,
};
