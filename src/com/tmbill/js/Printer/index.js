/* eslint-disable func-names */
/* eslint-disable camelcase */
const { forEach, map } = require('lodash');
const {
  PRINTERS_IPC,
  ADD_PRINTER_REPLY,
  USER_MODEL_IPC,
} = require('../../util/IPC_Messages');
const { PRINTER_SIZES_WITH_ID } = require('../../util/PrintersUtil');
const {
  initializei18nforprinterSettingswindowui,
} = require('../i18nController');
const { PRINTER_ACTION_TYPES } = require('../../util/Constants');

const { getPrinters } = require('../../renderer/helper/Home.helper');
const { safeParse } = require('../../util/RendererUtils');
const orderTypeManager = require('./OrderType');
const kitchenDepManager = require('./KitchenDepartment');
const tablewiseManager = require('./Table');
const categoryManager = require('./Category');

window.printersettingsscriptLoaded = true;
const printersSizes = PRINTER_SIZES_WITH_ID;

const ksdwisekitchendepartmentOptions = [];
const kitchenDepartmentsbyid = {};

function addkdswiseUserlisttotable(user) {
  const table = $(`#kdswiseassignedUserslistid`);
  const title = $('<td>', {
    html: user.name,
  });
  const assignedKitchedeps = String(user.assignedKitchedeps).split(',');
  let departmentsAssigned = '';
  assignedKitchedeps.forEach((element, index) => {
    departmentsAssigned += `${kitchenDepartmentsbyid[element]}`;
    if (index !== assignedKitchedeps.length - 1) {
      departmentsAssigned += ',';
    }
  });

  const device_name = $('<td>', {
    html: departmentsAssigned,
  });

  // kitchenDepartmentsbyid
  const deleteIcon = $('<td>', {
    html: "<i class='fas fa-trash deletePrinter'></i></td>",
  });

  const row = $('<tr>')
    .append(title)
    .append(device_name)
    .append(deleteIcon)
    .attr('details', JSON.stringify(user));

  table.append(row);
}

async function renderKdsusers(users) {
  $('#kdssettingsusersCombo option:gt(0)').remove();
  $('#kdswiseassignedUserslistid').find('tr:not(:first)').remove();
  if (users && users.length > 0) {
    forEach(users, (user) => {
      $('<option>')
        .val(user.id)
        .text(user.name)
        .appendTo('#kdssettingsusersCombo');

      if (user && user.assignedKitchedeps) {
        addkdswiseUserlisttotable(user);
      }
    });
  }
}

function clearUserwisekdsselctions() {
  $('#ksdwisekitchendepartmentsCombo').val(null).trigger('change');
  $('#kdssettingsusersCombo').prop('selectedIndex', 0);
}

async function addkdswiseKitchendepartment() {
  const selectedUser = $(
    '#kdssettingsusersCombo option:not([disabled]):selected',
  ).text();
  if (!selectedUser) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:printcontrollernotifications.Pleaseselectuser'),
      0,
    );
    return;
  }
  const selectedKitchendeps = $('#ksdwisekitchendepartmentsCombo').select2(
    'data',
  );
  if (selectedKitchendeps && selectedKitchendeps.length !== 0) {
    const updateData = {
      username: $(
        '#kdssettingsusersCombo option:not([disabled]):selected',
      ).val(),
      assignedKitchedeps: map(selectedKitchendeps, 'id').join(','),
      store_id: window.storeDetails.store_id,
    };
    try {
      $('#addkdswisekitchendepButton').prop('disabled', true);
      const result = await window.betteripcRenderer.callMain(
        USER_MODEL_IPC.UPDATE_ASSIGNED_DEPS,
        updateData,
      );
      if (result.users) {
        renderKdsusers(result.users);
      }
      clearUserwisekdsselctions();
    } catch (error) {
      console.error(error);
    }
    $('#addkdswisekitchendepButton').prop('disabled', false);
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:printcontrollernotifications.Pleaseselectdepartments',
      ),
      0,
    );
  }
}

async function getKDSusers() {
  if (window.kitchenDepartments && window.kitchenDepartments.length > 0) {
    $('#ksdwisekitchendepartmentsCombo').select2({
     placeholder: $.i18n.t('settingScreen.Printer.selectDepartment'),
      minimumResultsForSearch: Infinity,
      selectionCssClass: 's2kdssettingsusersCombo',
      multiple: true,
      width: '90%',
      value: '',
      data: ksdwisekitchendepartmentOptions,
    });
  }
  const users = await window.betteripcRenderer.callMain(
    USER_MODEL_IPC.GET_POS_USERS_ASYNC,
    {
      store_id: window.storeDetails.store_id,
      filterBykds: true,
    },
  );
  renderKdsusers(users);
}

/**
 * Updates the printer
 * @param {*} type
 */
async function updatePrinter(type) {
  if (type && !Number.isNaN(type)) {
    switch (type) {
      case PRINTER_ACTION_TYPES.LABEL_PRINTER:
        {
          const selectedPrinter = $(
            '#labelbillPrintersCombo option:not([disabled]):selected',
          ).text();
          if (!selectedPrinter) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:printcontrollernotifications.Pleaseselectprinter',
              ),
              0,
            );
            return;
          }
          const selectedSize = 2;

          const width = $('#labelPrinterwidth').val();
          if (width) {
            if (width.length > 5) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:printcontrollernotifications.Numberofcopieslengthshouldbelessthanfivedigit',
                ),
              );
              return;
            }

            if (Number.isNaN(width)) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:printcontrollernotifications.Pleaseentervalidpaperwidth',
                ),
              );
              return;
            }
          }
          if (!window.isNumbertest(width)) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:printcontrollernotifications.InvalidWidthorHeight',
              ),
              0,
            );
            return;
          }
          const more_info = { width };
          let no_of_prints = $('#labelbillprintCopiesid').val();
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
          if (no_of_prints && !Number.isNaN(no_of_prints)) {
            // DO Something
          } else {
            no_of_prints = 1;
          }

          const activate = $('#switchlabelprinterCheck').is(':checked');

          const updateData = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints,
            more_info,
            activate,
          };
          const whereData = {
            where: {
              id: type,
            },
          };
          const params = { updateData, whereData };
          window.ipcRenderer.send('update-printer', JSON.stringify(params));
        }
        break;
      case PRINTER_ACTION_TYPES.REPORT_PRINTER:
        {
          const selectedPrinter = $(
            '#reportsPrintersCombo option:not([disabled]):selected',
          ).text();
          if (!selectedPrinter) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:printcontrollernotifications.Pleaseselectprinter',
              ),
              0,
            );
            return;
          }
          let selectedSize = $(
            '#reportspapersizeCombo option:not([disabled]):selected',
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

          let no_of_prints = $('#reportsprintCopiesid').val();
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
          if (no_of_prints && !Number.isNaN(no_of_prints)) {
            // DO Something
          } else {
            no_of_prints = 1;
          }

          const activate = $('#reportsprinterCheck').is(':checked');

          const updateData = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints,
            activate,
          };
          const whereData = {
            where: {
              id: type,
            },
          };
          const params = { updateData, whereData };
          window.ipcRenderer.send('update-printer', JSON.stringify(params));
        }
        break;
      default:
        break;
    }
  }
}

function addPrintertotable2(element, tableID) {
  const currentDetails = {
    title: element.title,
    device_name: element.device_name,
    printer_size: element.printer_size,
    no_of_prints: element.no_of_prints,
    id: element.id,
    more_info: element.more_info,
  };
  const table = $(`#${tableID}`);
  let printerTitle = `${element.title}`;

  const moreInfo = safeParse(currentDetails.more_info);
  if (moreInfo) {
    if (moreInfo.selectedPrintertype) {
      printerTitle += ` - (${moreInfo.selectedPrintertype})`;
    }

    if (
      [
        PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
        PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
      ].includes(element.action_type)
    ) {
      printerTitle += ` - (${moreInfo.app_source})`;
    }
  }
  const title = $('<td>', {
    html: printerTitle,
  });
  const device_name = $('<td>', {
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
  const row = $('<tr>')
    .append(title)
    .append(device_name)
    .append(size)
    .append(prints)
    .append(icon)
    .append(deleteIcon)
    .attr('details', JSON.stringify(currentDetails))
    .attr('printerTitle', printerTitle);

  table.append(row);
}

window.ipcRenderer.on('update-printer-reply', async (event, content) => {
  if (content) {
    window.notifyUser.showMessage('success', 'Printer Updated.', 0);
    getPrinters();
  }
});

window.ipcRenderer.on(ADD_PRINTER_REPLY, async (event, content) => {
  if (content) {
    try {
      const data = content.printerInfo;
      if (
        [
          PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
        ].includes(data.action_type)
      ) {
        orderTypeManager.populateaddedPrinters(data);
      } else if (
        [PRINTER_ACTION_TYPES.KD_KOT_PRINTER].includes(data.action_type)
      ) {
        kitchenDepManager.populateaddedPrinters(data);
      } else if (
        [
          PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
          PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
        ].includes(data.action_type)
      ) {
        tablewiseManager.populateaddedPrinters(data);
      } else if (
        [PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER].includes(
          data.action_type,
        )
      ) {
        categoryManager.populateaddedPrinters(data);
      } else {
        addPrintertotable2(data, content.for);
      }
    } catch (error) {
      console.log(error);
    }
  }
});

function setPrinterdetails(
  element,
  comboElement,
  sizeElement,
  copiesElement,
  statusElement,
) {
  try {
    $(`${comboElement} option[value='${element.device_name}']`).attr(
      'selected',
      'selected',
    );
    if (
      !Number.isNaN(element.printer_size) &&
      element.printer_size !== 0 &&
      element.printer_size <= printersSizes.length
    ) {
      $(
        `${sizeElement} option[value='${
          printersSizes[element.printer_size - 1]
        }']`,
      ).attr('selected', 'selected');
    }

    if (!Number.isNaN(element.no_of_prints)) {
      $(copiesElement).val(element.no_of_prints);
    }
    $(statusElement).prop('checked', element.activate);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Add's the printers to the combo box of all printers
 */
async function addPrinters() {
  if (window.systemPrinters && window.systemPrinters.length > 0) {
    const printersList = ['#labelbillPrintersCombo', '#reportsPrintersCombo'];
    printersList.forEach((p) => {
      $(p).find('option:not(:first)').remove();
    });

    orderTypeManager.preaddprintersCleanup();
    kitchenDepManager.preaddprintersCleanup();
    tablewiseManager.preaddprintersCleanup();
    categoryManager.preaddprintersCleanup();

    window.systemPrinters.forEach((element) => {
      printersList.forEach((p) => {
        $('<option>').val(element.name).text(element.name).appendTo(p);
      });
      orderTypeManager.addsystemPrinter(element);
      kitchenDepManager.addsystemPrinter(element);
      tablewiseManager.addsystemPrinter(element);
      categoryManager.addsystemPrinter(element);
    });

    if (window.printersList && window.printersList.length > 0) {
      window.printersList.forEach((element) => {
        switch (element.action_type) {
          case PRINTER_ACTION_TYPES.LABEL_PRINTER:
            $(
              `#labelbillPrintersCombo option[value='${element.device_name}']`,
            ).attr('selected', 'selected');

            if (!Number.isNaN(element.no_of_prints)) {
              $('#labelbillprintCopiesid').val(element.no_of_prints);
            }
            $('#switchlabelprinterCheck').prop('checked', element.activate);
            try {
              const more_info = JSON.parse(element.more_info);
              if (more_info && !Number.isNaN(more_info.width)) {
                $('#labelPrinterwidth').val(more_info.width);
              }
            } catch (error) {
              console.error(error);
            }

            break;
          case PRINTER_ACTION_TYPES.REPORT_PRINTER:
            setPrinterdetails(
              element,
              '#reportsPrintersCombo',
              '#reportspapersizeCombo',
              '#reportsprintCopiesid',
              '#reportsprinterCheck',
            );
            break;
          case PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT: // Order type wise priter
          case PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL: // Order type wise priter
            // Kitchen department printers
            orderTypeManager.populateaddedPrinters(element);
            break;
          case PRINTER_ACTION_TYPES.KD_BILL_PRINTER: // Order type wise priter
          case PRINTER_ACTION_TYPES.KD_KOT_PRINTER: // Order type wise priter
            // Kitchen department printers
            kitchenDepManager.populateaddedPrinters(element);
            break;
          case PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER: // Order type wise priter
          case PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER: // Order type wise priter
            // Kitchen department printers
            tablewiseManager.populateaddedPrinters(element);
            break;
          case PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER: // Order type wise priter
            // Kitchen department printers
            categoryManager.populateaddedPrinters(element);
            break;

          default:
            break;
        }
      });
    }
  }
}

async function deletePrinter(clickedElement, type) {
  if (type === 'USED_ASSIGNED_KDS') {
    clearUserwisekdsselctions();
  }

  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      if (type === 'USED_ASSIGNED_KDS') {
        const updateData = {
          username: element.id,
          assignedKitchedeps: '',
          store_id: element.store_id,
        };
        const result = await window.betteripcRenderer.callMain(
          USER_MODEL_IPC.UPDATE_ASSIGNED_DEPS,
          updateData,
        );
        // Do something with
      } else {
        window.ipcRenderer.send(PRINTERS_IPC.DELETE_PRINTER, {
          id: element.id,
        });
      }

      $(clickedElement).closest('tr').remove();
    }
  }
}

window.addSystemprinters = async function () {
  addPrinters();
};

function Initialize() {
  $('.nav-tabs a[href="#printerTab"]').on('shown.bs.tab', () => {
    tablewiseManager.gettablesifnotExists();
    tablewiseManager.gettablesDeptifnotExists();
    categoryManager.initCategorylist();
  });

  $('#labelupdatebillPrinterbutton').on('click', () => {
    updatePrinter(6);
  });

  $('#reportsPrinterbutton').on('click', () => {
    updatePrinter(7);
  });

  $('#addkdswisekitchendepButton').on('click', () => {
    addkdswiseKitchendepartment();
  });

  printersSizes.forEach((element) => {
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#labelbillpapersizeCombo');

    $('<option>').val(element).text(element).appendTo('#reportspapersizeCombo');
  });

  if (
    window.outletKitchenDepartments &&
    window.outletKitchenDepartments.length > 0
  ) {
    // ksdwisekitchendepartmentOptions = [];
    window.outletKitchenDepartments.forEach((element) => {
      Object.assign(kitchenDepartmentsbyid, {
        [element.id]: element.kitchen_dept_name,
      });

      ksdwisekitchendepartmentOptions.push({
        text: element.kitchen_dept_name,
        id: element.id,
        selected: false,
      });
    });
  }
  addPrinters();

  $(document).on(
    'click',
    '#kdswiseassignedUserslistid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this, 'USED_ASSIGNED_KDS');
    },
  );

  $('#clearkdswisekitcheninfoButton').on('click', () => {
    clearUserwisekdsselctions();
  });

  getKDSusers();

  if ($.i18n) {
    initializei18nforprinterSettingswindowui();
  } else {
    setTimeout(initializei18nforprinterSettingswindowui, 400);
  }

  orderTypeManager.initElements();
  kitchenDepManager.initElements();
  tablewiseManager.initElements();
  categoryManager.initElements();
}

Initialize();
