/* eslint-disable camelcase */
window.captainmgmtScriptloaded = true;
const CryptoJS = require('crypto-js');
const { CAPTAIN_IPC, LOGOUT_USER_FORCEFULLY } = require('../util/IPC_Messages');
const { CAPTAIN_TYPES } = require('../util/Constants');
const { initializei18nforCaptainmgmtwindowui } = require('./i18nController');
const { result } = require('lodash');
const { sendLogoutUserEvent } = require('./ClientrequestHandler');

const language = {
  url: `../locales/${$.i18n.language}/datatable.json`,
};

function initialize() {
  $('#opencaptainButton')
    .hide()
    .on('click', () => {
      $('#addnewcaptainButton').html('Add');
      $('#addcaptainModal').modal('toggle');
    });

  $('#addcaptainModal').on('hidden.bs.modal', () => {
    clearFields();
  });

  $('#addnewcaptainButton').on('click', () => {
    addNewcapain();
  });

  initializeTable([]);
  getCaptains();

  CAPTAIN_TYPES.forEach((type) => {
    const option = $('<option>').val(type).text(type);
    $('#captaintypeList').append(option);
  });

  if ($.i18n) {
    initializei18nforCaptainmgmtwindowui();
  } else {
    setTimeout(initializei18nforCaptainmgmtwindowui, 400);
  }

  $('#gobacktomenumangemtfromUserManagementview').on('click', () => {
    $('#menuManagementwindowWrapperid').show();
    $('#userManagementwindowWrapperid').hide();
  });
}

function clearFields() {
  $('#captainNamefield').val('');
  $('#captainPhonefield').val('');
  $('#captainUsernamefield').val('');
  $('#captainPasswordfield').val('');
  $('#captaintypeList').prop('selectedIndex', 0);
  $('#addnewcaptainButton').html('Add');
}

function getCaptains() {
  window.ipcRenderer.send(
    CAPTAIN_IPC.GET_CAPTAINS,
    JSON.stringify({
      whereData: {
        store_id: window.storeDetails.store_id,
      },
    }),
  );
}

async function logoutUserForcefully(data) {
  const result = await window.betteripcRenderer.callMain(
    LOGOUT_USER_FORCEFULLY,
    data,
  );
  sendLogoutUserEvent(data);
  return result;
}
function initializeTable(captains) {
  const table = $('#captainsTable').DataTable({
    data: captains,
    ordering: false,
    scrollY: '60vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      { title: $.i18n.t('tables:masterTableHeadings.SrNo'), data: 'srno' },

      { title: $.i18n.t('tables:masterTableHeadings.Phone'), data: 'phone' },
      {
        title: $.i18n.t('tables:masterTableHeadings.Username'),
        data: 'username',
      },
      { title: $.i18n.t('tables:transactionTableHeading.Type'), data: 'type' },
      { title: ' ', data: null, defaultContent: '' },
    ],
    createdRow(row, data, index) {
      if (data) {
        $('td', row).eq(4).empty();
        if (data.userCategory === '0') {
          const billingLabel = $('<label>', {
            html: 'Billing',
            class: 'statusLabel billing-user',
          });
          $('td', row).eq(4).append(billingLabel);
        }

        if (data.userCategory === '5') {
          const billingLabel = $('<label>', {
            html: 'Passcode User',
            class: 'statusLabel passcode-user',
          });
          $('td', row).eq(4).append(billingLabel);
        }

        if (data.userCategory === '6') {
          const billingLabel = $('<label>', {
            html: 'Customer Display',
            class: 'statusLabel customer-display-user',
          });
          $('td', row).eq(4).append(billingLabel);
        }
        if (data.is_captain_app != 0) {
          const captain_label = $('<label>', {
            html: 'Captain',
            class: 'statusLabel captain-user',
          });
          $('td', row).eq(4).append(captain_label);
        }
        if (data.is_kds_app != 0) {
          const kds_label = $('<label>', {
            html: 'KDS',
            class: 'statusLabel kds-user',
          });
          $('td', row).eq(4).append(kds_label);
        }
        if (data.is_self_order != 0) {
          const selforder_label = $('<label>', {
            html: 'OrderX',
            class: 'statusLabel selforder-user',
          });
          $('td', row).eq(4).append(selforder_label);
        }
        if (data.is_terminal_app != 0) {
          const terminalLabel = $('<label>', {
            html: 'Terminal',
            class: 'statusLabel terminal-user',
          });
          $('td', row).eq(4).append(terminalLabel);
        }

        if (data['mpos_user_login_status.status']) {
          const logoutButton = $('<input>', {
            type: 'button',
            value: 'logout',
          });
          $('td', row)
            .last()
            .empty()
            .click(async () => {
              const response = await logoutUserForcefully({
                id: data.id,
                username: data.username,
              });
              if (response) {
                window.notifyUser.showMessage(
                  'success',
                  $.i18n.t(
                    'controller:captainManagement.Userloggedoutsuccessfully',
                  ),
                );
                $('td', row).last().empty();
              }
            })
            .append(logoutButton);
        }
      }
    },
    columnDefs: [
      {
        render(_data, _type, _full, meta) {
          if (meta.row < captains.length) {
            captains[meta.row].srno = meta.row + 1; // adds id to dataset
          }
          return meta.row + 1; // adds id to serial no
        },
        targets: 0,
        className: 'custom-check',
      },
    ],
  });

  $('#captainsTable tbody').on('click', 'td.edit-row', function () {
    const tr = $(this).closest('tr');
    const row = table.row(tr);
    const captaindata = row.data();
    $('#captainNamefield').val(captaindata.name);
    $('#captainPhonefield').val(captaindata.phone);
    $('#captainUsernamefield').val(captaindata.username);
    const bytes = CryptoJS.AES.decrypt(captaindata.password, Config.cipherKey);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    $('#captainPasswordfield').val(plaintext);
    $(`#captaintypeList option[value=${captaindata.type}]`).prop(
      'selected',
      true,
    );
    $('#addnewcaptainButton').html('Update');
    $('#addcaptainModal').modal('toggle');
  });
}

/**
 * Add's or updates the captain
 */
function addNewcapain() {
  const name = $('#captainNamefield').val();
  const phone = $('#captainPhonefield').val();
  const username = $('#captainUsernamefield').val();
  let password = $('#captainPasswordfield').val();
  let type = $('#captaintypeList option:selected:not([disabled])').text();
  if (!type) {
    type = CAPTAIN_TYPES[0];
  }
  if (!name) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:captainManagement.invalidName'),
    );
    return;
  }

  if (!phone) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:captainManagement.invalidPhone'),
    );
    return;
  }
  if (!username) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:captainManagement.invalidUsername'),
    );
    return;
  }

  if (String(username).includes(' ')) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:captainManagement.noSpacesAreAllowed'),
    );
    return;
  }

  if (!password) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:captainManagement.invalidPassword'),
    );
    return;
  }

  password = CryptoJS.AES.encrypt(password, Config.cipherKey).toString();

  const data = {
    name,
    password,
    username,
    phone,
    store_id: global.storeDetails.store_id,
    type,
  };
  ipcRenderer.send(CAPTAIN_IPC.ADD_CAPTAIN, JSON.stringify(data));
}

function showCaptains(list) {
  if (list) {
    $('#captainsTable').DataTable().clear().draw();
    $('#captainsTable').DataTable().rows.add(list); // Add new data
    $('#captainsTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
  }
}

ipcRenderer.on(CAPTAIN_IPC.ADD_CAPTAIN_REPLY, async (event, data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      getCaptains();
      if (data && data.status && data.message) {
        window.notifyUser.showMessage(data.status, data.message, 0);
        if (data.status == 'success') {
          clearFields();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
});

ipcRenderer.on(CAPTAIN_IPC.GET_CAPTAINS_REPLY, async (event, data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      showCaptains(data.captains);
    } catch (error) {
      console.log(error);
    }
  }
});

initialize();
