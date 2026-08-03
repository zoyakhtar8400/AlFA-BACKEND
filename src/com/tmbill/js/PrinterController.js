/* eslint-disable func-names */
/* eslint-disable camelcase */
const { forEach, map } = require('lodash');
const {
  ADD_PRINTER,
  PRINTERS_IPC,
  ADD_PRINTER_REPLY,
  USER_MODEL_IPC,
} = require('../util/IPC_Messages');
const { PRINTER_SIZES_WITH_ID } = require('../util/PrintersUtil');
const {
  initializei18nforprinterSettingswindowui,
} = require('./i18nController');
const { PRINTER_ACTION_TYPES } = require('../util/Constants');

const { getPrinters } = require('../renderer/helper/Home.helper');
const { safeParse } = require('../util/RendererUtils');

window.printersettingsscriptLoaded = true;
const printersSizes = PRINTER_SIZES_WITH_ID;
let tablesList = [];
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

      console.log('user::', user);
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
      placeholder: '__Select Department__',
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

async function gettablesifnotExists() {
  if (tablesList && Array.isArray(tablesList) && tablesList.length === 0) {
    const data = await window.betteripcRenderer.callMain(
      PRINTERS_IPC.GET_TABLES,
      {
        store_id: window.storeDetails.store_id,
      },
    );
    if (data.tables) {
      tablesList = data.tables;
      if (tablesList && Array.isArray(tablesList)) {
        tablesList.forEach((iterator) => {
          $('<option>')
            .val(iterator.table_name)
            .text(iterator.table_name)
            .appendTo('#tableslistCombo');
        });
      }
    }
  }
}
/**
 * Updates the printer
 * @param {*} type
 */
async function updatePrinter(type) {
  if (type && !Number.isNaN(type)) {
    switch (type) {
      case 1:
        {
          const selectedPrinter = $(
            '#kotprintersCombo option:not([disabled]):selected',
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
            '#kotpapersizeCombo option:not([disabled]):selected',
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
          const activate = $('#switchkotprinterCheck').is(':checked');
          if (selectedSize < 0) {
            selectedSize = 2;
          } else {
            selectedSize += 1;
          }

          let no_of_prints = $('#kotprintCopiesid').val();

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
            // do something here
          } else {
            no_of_prints = 1;
          }

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
      case 2:
        {
          const selectedbillPrinter = $(
            '#billPrintersCombo option:not([disabled]):selected',
          ).text();
          if (!selectedbillPrinter) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:printcontrollernotifications.Pleaseselectprinter',
              ),
              0,
            );
            return;
          }
          let selectedbillSize = $(
            '#billpapersizeCombo option:not([disabled]):selected',
          ).text();
          if (!selectedbillSize) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:printcontrollernotifications.Pleaseselectpapersize',
              ),
              0,
            );
            return;
          }
          selectedbillSize = printersSizes.indexOf(Number(selectedbillSize));
          if (selectedbillSize < 0) {
            selectedbillSize = 2;
          } else {
            selectedbillSize += 1;
          }
          const activate = $('#switchbillsprinterCheck').is(':checked');

          let no_of_billprints = $('#billprintCopiesid').val();
          if (no_of_billprints) {
            if (no_of_billprints.length > 5) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:printcontrollernotifications.Numberofcopieslengthshouldbelessthanfivedigit',
                ),
              );
              return;
            }

            if (Number.isNaN(no_of_billprints)) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:printcontrollernotifications.Pleaseentervalidnumber',
                ),
              );
              return;
            }
          }

          if (!no_of_billprints && Number.isNaN(no_of_billprints)) {
            no_of_billprints = 1;
          }

          const billupdateData = {
            device_name: selectedbillPrinter,
            printer_size: selectedbillSize,
            no_of_prints: no_of_billprints,
            activate,
          };

          const billwhereData = {
            where: {
              id: type,
            },
          };
          // let billparams = { billupdateData, billwhereData };
          const params = {
            updateData: billupdateData,
            whereData: billwhereData,
          };
          window.ipcRenderer.send('update-printer', JSON.stringify(params));
        }
        break;

      case 3:
        {
          const selectedPrinter = $(
            '#tabillPrintersCombo option:not([disabled]):selected',
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
            '#tabillpapersizeCombo option:not([disabled]):selected',
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

          let no_of_prints = $('#tabillprintCopiesid').val();
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
            // do something
          } else {
            no_of_prints = 1;
          }

          const activate = $('#switchtaprinterCheck').is(':checked');

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
      case 4:
        {
          const selectedPrinter = $(
            '#hdbillPrintersCombo option:not([disabled]):selected',
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
            '#hdbillpapersizeCombo option:not([disabled]):selected',
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

          let no_of_prints = $('#hdbillprintCopiesid').val();
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
            // Do something
          } else {
            no_of_prints = 1;
          }

          const activate = $('#switchhdprinterCheck').is(':checked');

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

      case 5:
        {
          const selectedPrinter = $(
            '#quickbillPrintersCombo option:not([disabled]):selected',
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
            '#quickbillpapersizeCombo option:not([disabled]):selected',
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

          let no_of_prints = $('#quickbillprintCopiesid').val();
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
            // Do something
          } else {
            no_of_prints = 1;
          }

          const activate = $('#switchquickprinterCheck').is(':checked');

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
      case 6:
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
      case 7:
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
      case 8:
        {
          const selectedPrinter = $(
            '#onlinekotPrintersCombo option:not([disabled]):selected',
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
            '#onlinekotpapersizeCombo option:not([disabled]):selected',
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

          let no_of_prints = $('#onlinekotprintCopiesid').val();
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

          const activate = $('#onlinekotsprinterCheck').is(':checked');

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

      case 9:
        {
          const selectedPrinter = $(
            '#onlineOrderPrintersCombo option:not([disabled]):selected',
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
            '#onlineOrderpapersizeCombo option:not([disabled]):selected',
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

          let no_of_prints = $('#onlineOrderprintCopiesid').val();
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
            // Do Something
          } else {
            no_of_prints = 1;
          }

          const activate = $('#onlinekotsprinterCheck').is(':checked');

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

function clearkitchenInfo() {
  // $('#addkitchendepButton').val('Add');
  switch (window.selectedLanguage) {
    case 'en':
      $('#addkitchendepButton').val('Add');
      break;
    case 'ar':
      $('#addkitchendepButton').val('اصافة');
      break;
    default:
      $('#addkitchendepButton').val('Add');
      break;
  }
  $('#kitchenprintCopiesid').val('');
  $('#kitchenprintremarkid').val('');
  $('#kitchendepartmentssizesCombo').val(
    $('#kitchendepartmentssizesCombo option:first').val(),
  );
  $('#kitchendepartmentsCombo').val(
    $('#kitchendepartmentsCombo option:first').val(),
  );
  $('#kitchenbillPrintersCombo').val(
    $('#kitchenbillPrintersCombo option:first').val(),
  );
  $('#kitchendepartmentsCombo').prop('disabled', false);
}

function cleartablewiseprintersInfo() {
  switch (window.selectedLanguage) {
    case 'en':
      $('#addtablewiseprinterButton').val('Add');
      break;
    case 'ar':
      $('#addtablewiseprinterButton').val('اصافة');
      break;
    default:
      $('#addtablewiseprinterButton').val('Add');
      break;
  }
  $('#tablewiseprintCopiesid').val('');
  $('#tablwiseprintssizesCombo').val(
    $('#tablwiseprintssizesCombo option:first').val(),
  );
  $('#tableslistCombo').val($('#tableslistCombo option:first').val());
  $('#tablewisePrintersCombo').val(
    $('#tablewisePrintersCombo option:first').val(),
  );
  $('#tableslistCombo').prop('disabled', false);
}

function clearonlinestoreprintersInfo() {
  // $('#addonlinestoreprinterButton').val('Add');
  switch (window.selectedLanguage) {
    case 'en':
      $('#addonlinestoreprinterButton').val('Add');
      break;
    case 'ar':
      $('#addonlinestoreprinterButton').val('اصافة');
      break;
    default:
      $('#addonlinestoreprinterButton').val('Add');
      break;
  }
  $('#onlinestorewiseprintCopiesid').val('');
  $('#onlinestoreprintssizesCombo').val(
    $('#onlinestoreprintssizesCombo option:first').val(),
  );
  $('#onlinestoreslistCombo').val(
    $('#onlinestoreslistCombo option:first').val(),
  );
  $('#onlinestorePrintersCombo').val(
    $('#onlinestorePrintersCombo option:first').val(),
  );
  $('#onlinestoreprinttypeCombo').val(
    $('#onlinestoreprinttypeCombo option:first').val(),
  );
  $('#onlinestoreslistCombo').prop('disabled', false);
  $('#onlinestoreprinttypeCombo').prop('disabled', false);
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

    if (element.action_type === PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT) {
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
      addPrintertotable2(data, content.for);
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
    const printersList = [
      '#kotprintersCombo',
      '#billPrintersCombo',
      '#labelbillPrintersCombo',
      '#tabillPrintersCombo',
      '#hdbillPrintersCombo',
      '#quickbillPrintersCombo',
      '#kitchenbillPrintersCombo',
      '#reportsPrintersCombo',
      '#onlinekotPrintersCombo',
      '#onlineOrderPrintersCombo',
      '#tablewisePrintersCombo',
      '#onlinestorePrintersCombo',
    ];
    printersList.forEach((p) => {
      $(p).find('option:not(:first)').remove();
    });

    // Table Views
    $('#kitchenprintersListid').find('tr:not(:first)').remove();
    $('#tablewiseprintersListid').find('tr:not(:first)').remove();
    $('#onlinestoreprintersListid').find('tr:not(:first)').remove();

    window.systemPrinters.forEach((element) => {
      printersList.forEach((p) => {
        $('<option>').val(element.name).text(element.name).appendTo(p);
      });
    });

    if (window.printersList && window.printersList.length > 0) {
      window.printersList.forEach((element) => {
        switch (element.action_type) {
          case PRINTER_ACTION_TYPES.KOT:
            setPrinterdetails(
              element,
              '#kotprintersCombo',
              '#kotpapersizeCombo',
              '#kotprintCopiesid',
              '#switchkotprinterCheck',
            );
            break;
          case PRINTER_ACTION_TYPES.DINE_IN:
            setPrinterdetails(
              element,
              '#billPrintersCombo',
              '#billpapersizeCombo',
              '#billprintCopiesid',
              '#switchbillsprinterCheck',
            );
            break;
          case PRINTER_ACTION_TYPES.TAKEAWAY:
            setPrinterdetails(
              element,
              '#tabillPrintersCombo',
              '#tabillpapersizeCombo',
              '#tabillprintCopiesid',
              '#switchtaprinterCheck',
            );
            break;
          case PRINTER_ACTION_TYPES.HOME_DELIVERY:
            setPrinterdetails(
              element,
              '#hdbillPrintersCombo',
              '#hdbillpapersizeCombo',
              '#hdbillprintCopiesid',
              '#switchhdprinterCheck',
            );
            break;
          case PRINTER_ACTION_TYPES.QUICK_BILL:
            setPrinterdetails(
              element,
              '#quickbillPrintersCombo',
              '#quickbillpapersizeCombo',
              '#quickbillprintCopiesid',
              '#switchquickprinterCheck',
            );
            break;
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
          case PRINTER_ACTION_TYPES.KITCHEN_PRINTER:
            // Kitchen department printers
            // addPrintertotable(element);
            addPrintertotable2(element, 'kitchenprintersListid');
            break;
          case PRINTER_ACTION_TYPES.ONLINE_KOT:
            setPrinterdetails(
              element,
              '#onlinekotPrintersCombo',
              '#onlinekotpapersizeCombo',
              '#onlinekotprintCopiesid',
              '#onlinekotsprinterCheck',
            );
            break;

          case PRINTER_ACTION_TYPES.ONLINE_BILL:
            setPrinterdetails(
              element,
              '#onlineOrderPrintersCombo',
              '#onlineOrderpapersizeCombo',
              '#onlineOrderprintCopiesid',
              '#onlineOrdersprinterCheck',
            );
            break;

          case PRINTER_ACTION_TYPES.TABLEWISE_PRINTER: // Table wise priter
            // Kitchen department printers
            addPrintertotable2(element, 'tablewiseprintersListid');
            break;
          case PRINTER_ACTION_TYPES.ONLINE_STOREWISE_PRINTER: // Table wise priter
            // Kitchen department printers
            addPrintertotable2(element, 'onlinestoreprintersListid');
            break;
          default:
            break;
        }
      });
    }
  }
}

function addEditlistener(clickedElement) {
  clearkitchenInfo();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      $('#kitchenbillPrintersCombo').val(element.device_name);
      $('#kitchendepartmentsCombo').val(element.title);
      $('#kitchendepartmentsCombo').attr('printerId', element.id);

      $('#kitchendepartmentsCombo').prop('disabled', true);
      $('#kitchendepartmentssizesCombo').val(
        printersSizes[element.printer_size - 1],
      );

      if (!Number.isNaN(element.no_of_prints)) {
        $('#kitchenprintCopiesid').val(element.no_of_prints);
      }
      if (element.more_info) {
        if ('test'.constructor === element.more_info.constructor) {
          element.more_info = JSON.parse(element.more_info);
        }
        if (element.more_info.remark) {
          $('#kitchenprintremarkid').val(element.more_info.remark);
        }
      }
      // $('#addkitchendepButton').val('Update');
      switch (window.selectedLanguage) {
        case 'en':
          $('#addkitchendepButton').val('Update');
          break;
        case 'ar':
          $('#addkitchendepButton').val('تحديث');
          break;
        default:
          $('#addkitchendepButton').val('Update');
          break;
      }
    }
  }
}

async function deletePrinter(clickedElement, type) {
  if (type === 'KITCHEN_PRINTER') {
    clearkitchenInfo();
  } else if (type === 'TABLE_PRINTER') {
    cleartablewiseprintersInfo();
  } else if (type === 'STORE_PRINTER') {
    clearonlinestoreprintersInfo();
  } else if (type === 'USED_ASSIGNED_KDS') {
    clearUserwisekdsselctions();
  }

  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      if (type === 'USED_ASSIGNED_KDS') {
        // const updateData = {
        //   username: element.id,
        //   assignedKitchedeps: '',
        //   store_id: element.store_id,
        // };
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

function addEditlistener2(clickedElement) {
  cleartablewiseprintersInfo();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      $('#tablewisePrintersCombo').val(element.device_name);
      $('#tableslistCombo').val(element.title);
      $('#tableslistCombo').prop('disabled', true);
      $('#tablwiseprintssizesCombo').val(
        printersSizes[element.printer_size - 1],
      );

      if (!Number.isNaN(element.no_of_prints)) {
        $('#tablewiseprintCopiesid').val(element.no_of_prints);
      }
      // $('#addtablewiseprinterButton').val('Update');
      switch (window.selectedLanguage) {
        case 'en':
          $('#addtablewiseprinterButton').val('Update');
          break;
        case 'ar':
          $('#addtablewiseprinterButton').val('تحديث');
          break;
        default:
          $('#addtablewiseprinterButton').val('Update');
          break;
      }
    }
  }
}

function addEditlistener3(clickedElement) {
  clearonlinestoreprintersInfo();
  if ($(clickedElement).closest('tr').length > 0) {
    let element = $(clickedElement).closest('tr').attr('details');
    if (element) {
      element = JSON.parse(element);
      if (
        element.more_info &&
        element.more_info.constructor === 'test'.constructor
      ) {
        element.more_info = JSON.parse(element.more_info);
      }
      if (element.more_info && element.more_info.selectedPrintertype) {
        $('#onlinestoreprinttypeCombo').val(
          element.more_info.selectedPrintertype,
        );
      }
      $('#onlinestorePrintersCombo').val(element.device_name);
      $('#onlinestoreslistCombo').val(element.title);
      $('#onlinestoreslistCombo').prop('disabled', true);
      $('#onlinestoreprinttypeCombo').prop('disabled', true);
      $('#onlinestoreprintssizesCombo').val(
        printersSizes[element.printer_size - 1],
      );

      if (!Number.isNaN(element.no_of_prints)) {
        $('#onlinestorewiseprintCopiesid').val(element.no_of_prints);
      }
      // $('#addonlinestoreprinterButton').val('Update');
      switch (window.selectedLanguage) {
        case 'en':
          $('#addonlinestoreprinterButton').val('Update');
          break;
        case 'ar':
          $('#addonlinestoreprinterButton').val('تحديث');
          break;
        default:
          $('#addonlinestoreprinterButton').val('Update');
          break;
      }
    }
  }
}

window.addSystemprinters = async function () {
  addPrinters();
};

/**
 * Adds the kitchen printer or updates
 * @param {Kitchen printer action type} type
 */
function addKitchendepPrinter(type) {
  if (type) {
    const selectedPrinter = $(
      '#kitchenbillPrintersCombo option:not([disabled]):selected',
    ).text();
    if (!selectedPrinter) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselectprinter'),
        0,
      );
      return;
    }

    const selectedDepartment = $(
      '#kitchendepartmentsCombo option:not([disabled]):selected',
    ).text();
    if (!selectedDepartment) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:printcontrollernotifications.Pleaseselectdepartments',
        ),
        0,
      );
      return;
    }

    let selectedSize = $(
      '#kitchendepartmentssizesCombo option:not([disabled]):selected',
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

    let no_of_prints = $('#kitchenprintCopiesid').val();
    if (no_of_prints && !Number.isNaN(no_of_prints)) {
      // DO Something
    } else {
      no_of_prints = 1;
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

    let addButton = 'Add';
    switch (window.selectedLanguage) {
      case 'en':
        addButton = 'Add';
        break;
      case 'ar':
        addButton = 'اصافة';
        break;
      default:
        addButton = 'Add';
        break;
    }
    console.log('add button::', addButton);
    switch (type) {
      case addButton:
        {
          // let existingData = getTableData_AsJson('kitchenprintersListid');
          // let result = _.find(existingData.data, ['Title', selectedDepartment]);
          // if (result) {
          //     window.notifyUser.showMessage('error', "Printer already exists for " + selectedDepartment, 0);
          //     return;
          // }

          const createPrinter = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints,
            action_type: PRINTER_ACTION_TYPES.KITCHEN_PRINTER,
            title: selectedDepartment,
          };
          if ($('#kitchenprintremarkid').val()) {
            createPrinter.more_info = {};
            createPrinter.more_info.remark = $('#kitchenprintremarkid').val();
          }

          if (createPrinter.more_info && createPrinter.more_info.remark) {
            if (createPrinter.more_info.remark.length > 30) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:printcontrollernotifications.Remarknotelengthshouldbelessthanthirtycharacter',
                ),
              );
              return;
            }

            if (window.specialCharRegex.test(createPrinter.more_info.remark)) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:printcontrollernotifications.Somespecialcharactersarenotallowedinremarknote',
                ),
              );
              return;
            }
          }
          window.ipcRenderer.send(ADD_PRINTER, {
            printerInfo: createPrinter,
            for: 'kitchenprintersListid',
          });
          clearkitchenInfo();
          getPrinters();
        }
        break;
      case window.selectedLanguage === 'en' ? 'Update' : 'تحديث':
        {
          const updateData = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints,
          };
          const printerId = $('#kitchendepartmentsCombo').attr('printerId');

          if ($('#kitchenprintremarkid').val()) {
            updateData.more_info = {};
            updateData.more_info.remark = $('#kitchenprintremarkid').val();
          }
          const whereData = {
            where: {
              title: selectedDepartment,
              id: printerId,
            },
          };
          const params = { updateData, whereData };
          window.ipcRenderer.send('update-printer', JSON.stringify(params));
          // printerTitle
          const row = $(
            `#kitchenprintersListid tbody tr[printerTitle="${
              selectedDepartment
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
              if (updateData.more_info) {
                details.more_info = updateData.more_info;
              }
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

    clearkitchenInfo();
  }
}

/**
 * Adds the table printer or updates
 * @param {table printer action type} type
 */
function addtablewisePrinter(type) {
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

    const selectedDepartment = $(
      '#tableslistCombo option:not([disabled]):selected',
    ).text();
    if (!selectedDepartment) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:printcontrollernotifications.Pleaseselecttable'),
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

    let no_of_prints = $('#tablewiseprintCopiesid').val();
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

    switch (type) {
      case 'Add':
        {
          const createPrinter = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints,
            action_type: PRINTER_ACTION_TYPES.TABLEWISE_PRINTER,
            title: selectedDepartment,
          };
          window.ipcRenderer.send(ADD_PRINTER, {
            printerInfo: createPrinter,
            for: 'tablewiseprintersListid',
          });
          cleartablewiseprintersInfo();
          getPrinters();
          // window.ipcRenderer.callMain('get-printers', {});
        }
        break;
      case 'Update':
        {
          const updateData = {
            device_name: selectedPrinter,
            printer_size: selectedSize,
            no_of_prints,
          };
          const whereData = {
            where: {
              title: selectedDepartment,
            },
          };
          const params = { updateData, whereData };
          window.ipcRenderer.send('update-printer', JSON.stringify(params));
          // printerTitle
          const row = $(
            `#tablewiseprintersListid tbody tr[printerTitle="${
              selectedDepartment
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

    cleartablewiseprintersInfo();
  }
}

function Initialize() {
  $('.nav-tabs a[href="#printerTab"]').on('shown.bs.tab', () => {
    gettablesifnotExists();
  });

  $('#updatekotPrinterbutton').on('click', () => {
    updatePrinter(1);
  });

  $('#updatebillPrinterbutton').on('click', () => {
    updatePrinter(2);
  });

  $('#taupdatebillPrinterbutton').on('click', () => {
    updatePrinter(3);
  });

  $('#hdupdatebillPrinterbutton').on('click', () => {
    updatePrinter(4);
  });

  $('#quickupdatebillPrinterbutton').on('click', () => {
    updatePrinter(5);
  });

  $('#labelupdatebillPrinterbutton').on('click', () => {
    updatePrinter(6);
  });

  $('#reportsPrinterbutton').on('click', () => {
    updatePrinter(7);
  });

  $('#onlinekotPrinterbutton').on('click', () => {
    updatePrinter(8);
  });

  $('#onlineOrderPrinterbutton').on('click', () => {
    updatePrinter(9);
  });

  $('#addkitchendepButton').on('click', function () {
    addKitchendepPrinter($(this).val());
  });

  $('#addtablewiseprinterButton').on('click', function () {
    addtablewisePrinter($(this).val());
  });

  $('#clearkitcheninfoButton').on('click', () => {
    clearkitchenInfo();
  });

  $('#cleartablwiseprinterButton').on('click', () => {
    cleartablewiseprintersInfo();
  });

  $('#clearonlinestoreprinterButton').on('click', () => {
    clearonlinestoreprintersInfo();
  });

  $('#addkdswisekitchendepButton').on('click', () => {
    addkdswiseKitchendepartment();
  });

  printersSizes.forEach((element) => {
    $('<option>').val(element).text(element).appendTo('#billpapersizeCombo');

    $('<option>').val(element).text(element).appendTo('#kotpapersizeCombo');

    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#labelbillpapersizeCombo');

    $('<option>').val(element).text(element).appendTo('#tabillpapersizeCombo');

    $('<option>').val(element).text(element).appendTo('#hdbillpapersizeCombo');

    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#quickbillpapersizeCombo');

    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#kitchendepartmentssizesCombo');

    $('<option>').val(element).text(element).appendTo('#reportspapersizeCombo');
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#onlinekotpapersizeCombo');

    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#onlineOrderpapersizeCombo');

    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#tablwiseprintssizesCombo');
    $('<option>')
      .val(element)
      .text(element)
      .appendTo('#onlinestoreprintssizesCombo');
  });

  if (
    window.outletKitchenDepartments &&
    window.outletKitchenDepartments.length > 0
  ) {
    $('#kitchendepartmentsCombo').empty();

    // ksdwisekitchendepartmentOptions = [];
    window.outletKitchenDepartments.forEach((element) => {
      Object.assign(kitchenDepartmentsbyid, {
        [element.id]: element.kitchen_dept_name,
      });

      $('<option>')
        .val(element.kitchen_dept_name)
        .text(element.kitchen_dept_name)
        .appendTo('#kitchendepartmentsCombo');

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
    '#kitchenprintersListid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this, 'KITCHEN_PRINTER');
    },
  );

  $(document).on(
    'click',
    '#tablewiseprintersListid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this, 'TABLE_PRINTER');
    },
  );
  $(document).on(
    'click',
    '#onlinestoreprintersListid tbody tr i.deletePrinter',
    function () {
      deletePrinter(this, 'STORE_PRINTER');
    },
  );
  $(document).on(
    'click',
    '#kdswiseassignedUserslistid tbody tr i.deletePrinter',
    function () {
      console.log('delete printer');
      deletePrinter(this, 'USED_ASSIGNED_KDS');
    },
  );

  $(document).on(
    'click',
    '#kitchenprintersListid tbody tr i.editPrinter',
    function () {
      addEditlistener(this);
    },
  );

  $(document).on(
    'click',
    '#tablewiseprintersListid tbody tr i.editPrinter',
    function () {
      addEditlistener2(this);
    },
  );
  $(document).on(
    'click',
    '#onlinestoreprintersListid tbody tr i.editPrinter',
    function () {
      addEditlistener3(this);
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
}

Initialize();
