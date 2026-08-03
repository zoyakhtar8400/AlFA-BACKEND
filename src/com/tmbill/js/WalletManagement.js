/* eslint-disable camelcase */
window.walletmgmtScriptloaded = true;
const { formatAMPM } = require('../util/MiscUtil');
const { WALLET_IPC } = require('../util/IPC_Messages');
const { initAccesslevelsformasters } = require('./AccesslevelManager');
const { initializei18nforWalletmgmtctrlwindowui } = require('./i18nController');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { makeGetpaymentsrequest } = require('../renderer/helper/Receipt.helper');

const language = {
  url: `../locales/${$.i18n.language}/datatable.json`,
};

let paymentsList = [];
async function initialize() {
  // $.i18n.t('controller:walletManagement.Cancel')
  initializeTables();
  getWalletsinfo();
  $('#opencreateWalletbutton').on('click', showCreatewallet);
  $('#refreshWalletbutton').on('click', getWalletsinfo);
  $('#walletmgmtsearchreceiptField').keyup(function () {
    $('#wallettableID').DataTable().search($(this).val()).draw();
  });

  initAccesslevelsformasters();

  if ($.i18n) {
    initializei18nforWalletmgmtctrlwindowui();
  } else {
    setTimeout(initializei18nforWalletmgmtctrlwindowui, 400);
  }

  const data = await makeGetpaymentsrequest();
  paymentsList = data.payments;

  $('#gobacktomenumangemtfromwalletview').on('click', () => {
    $('#menuManagementwindowWrapperid').show();
    $('#walletManagementwindowWrapperid').hide();
  });

  const walletWrapper = $('#walletManagementwindowWrapperid');
  const observer = new MutationObserver(function () {
    if (walletWrapper.is(':visible')) {
      try {
        const table = $('#wallettableID').DataTable();
        $('#walletmgmtsearchreceiptField').val('');
        table.search('');
        table.page('first').draw('page');
      } catch (err) {
        console.warn('Pagination reset failed', err);
      }
    }
  });

  observer.observe(walletWrapper[0], {
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // addPaymentList();
}

function getWalletsinfo() {
  ipcRenderer.send(WALLET_IPC.GET_DATA, {
    store_id: window.storeDetails.store_id,
  });
}

ipcRenderer.on(WALLET_IPC.GET_DATA_REPLY, handleWalletdatareply);
ipcRenderer.on(WALLET_IPC.CREATE_REPLY, createWalletResponse);

function initializeTables() {
  $('#wallettableID').DataTable({
    ordering: false,
    searching: true,
    scrollY: '67vh',
    bPaginate: false,
    bLengthChange: false,
    paging: true,
    stateSave: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    stateSave: false,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:masterTableHeadings.WalletID'),
        data: 'wallet_id',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Name'),
        data: 'wallet_name',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Phone'),
        data: 'cust_phone',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Balance'),
        data: 'available_balance',
      },
      { title: ' ', data: 'wallet_id' },
    ],
    createdRow(row, data, index) {
      const paydueButton = $('<button>', {
        text: $.i18n.t('controller:walletManagement.Transactions'),
        title: $.i18n.t('controller:walletManagement.viewTransaction'),
        class: 'material-button',
      }).on('click', () => {
        viewTransactions(data);
      });
      const addcreditButton = $('<button>', {
        text: $.i18n.t('controller:walletManagement.addCredit'),
        title: $.i18n.t('controller:walletManagement.addCredit'),
        class: 'add-credit-button',
      }).on('click', () => {
        addwalletCredit(data, index);
      });
      $('td', row).last().empty().append(addcreditButton).append(paydueButton);
    },
    drawCallback: function () {
      initAccesslevelsformasters();
    },
  });
  $('#wallettransactionstableID').DataTable({
    ordering: false,
    scrollY: '33vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:transactionTableHeading.orderID'),
        data: 'order_id',
        defaultContent: 'NA',
      },
      {
        title: $.i18n.t('tables:transactionTableHeading.Amount'),
        data: 'amount',
      },
      {
        title: $.i18n.t('tables:transactionTableHeading.Date'),
        data: 'created_time',
      },
      {
        title: $.i18n.t('tables:transactionTableHeading.Type'),
        data: 'credit_debit_type',
      },
      {
        title: 'Payment Mode',
        data: 'payment_mode',
      },
      {
        title: $.i18n.t('tables:transactionTableHeading.Balance'),
        data: 'available_balance',
      },
    ],
    createdRow(row, data, index) {
      if (data.created_time) {
        const date1 = new Date(Date.parse(data.created_time));
        const formattedDate = formatAMPM(date1, false);
        $('td', row).eq(2).html(formattedDate);
      }

      if (data.credit_debit_type == 0) {
        const paidLabel = $('<label>', {
          html: `- ${$.i18n.t('controller:walletManagement.Debited')}`,
          class: 'statusLabel debited',
        });
        $('td', row).eq(3).empty().append(paidLabel);
      } else {
        const paidLabel = $('<label>', {
          html: `+ ${$.i18n.t('controller:walletManagement.Credited')}`,
          class: 'statusLabel credited',
        });
        $('td', row).eq(3).empty().append(paidLabel);
      }
    },
  });
}

function walletExistsByPhone(phone) {
  try {
    const table = $('#wallettableID').DataTable();
    if (!table) return null;
    const rows = table.rows().data().toArray();
    if (!rows || rows.length === 0) return null;
    // unify types to string and trim
    const normalized = (s) =>
      s === null || s === undefined ? '' : String(s).trim();
    const p = normalized(phone);
    return rows.find((w) => normalized(w.cust_phone) === p) || null;
  } catch (e) {
    return null;
  }
}

// async function addCustomerautocomplete(data) {
//   $('#swal2-html-container input.wallet_customerName').autocomplete({
//     source(req, response) {
//       const sourceData = [];
//       const re = $.ui.autocomplete.escapeRegex(req.term);
//       response(
//         $.grep(data.customers, (customer) => {
//           if (customer.name.toLowerCase().startsWith(re.toLowerCase())) {
//             sourceData.push({
//               label: customer.name,
//               value: customer.name,
//               phone: customer.phone,
//               id: customer.id,
//               customer,
//             });
//           }
//         }),
//       );
//       return response(sourceData);
//     },
//     appendTo: '#swal2-html-container',
//     classes: {
//       'ui-autocomplete': 'autocomplete-to-front',
//     },
//     select(event, ui) {
//       event.preventDefault();
//       event.stopPropagation();

//       const phoneVal = ui.item.phone || '';
//       const custName = ui.item.label || '';

//       $('.swal2-html-container #wallet_customerPhoneid').val(phoneVal);
//       $('.swal2-html-container #wallet_nameid').val(custName);

//       const existingWallet = walletExistsByPhone(phoneVal);

//       if (existingWallet) {
//         $('.swal2-html-container #wallet_nameid').prop('readonly', true);

//         $('.swal2-html-container #wallet_availbalanceid').val(
//           existingWallet.available_balance || 0,
//         );

//         setTimeout(() => {
//           window.notifyUser?.showMessage(
//             'error',
//             $.i18n.t('controller:walletManagement.walletAlreadyExists') ||
//               'This mobile number already has a wallet. Please select another number.',
//           );
//         }, 100);
//       } else {
//         $('.swal2-html-container #wallet_nameid').prop('readonly', false);
//       }

//       return false;
//     },
//   });
//   $('#swal2-html-container input.wallet_customerPhone').autocomplete({
//     source(req, response) {
//       const sourceData = [];
//       const re = $.ui.autocomplete.escapeRegex(req.term);
//       response(
//         $.grep(data.customers, (customer) => {
//           if (customer.phone.toLowerCase().startsWith(re.toLowerCase())) {
//             sourceData.push({
//               label: customer.phone,
//               value: customer.phone,
//               name: customer.name,
//               id: customer.id,
//               customer,
//             });
//           }
//         }),
//       );
//       return response(sourceData);
//     },
//     appendTo: '#swal2-html-container',
//     classes: {
//       'ui-autocomplete': 'autocomplete-to-front',
//     },
//     select(event, ui) {
//       const phoneVal = ui.item.value || ui.item.phone || '';
//       const custName = ui.item.name || '';

//       $('.swal2-html-container #wallet_nameid').val(custName);

//       const existingWallet = walletExistsByPhone(phoneVal);
//       if (existingWallet) {
//         $('.swal2-html-container #wallet_nameid').prop('readonly', true);

//         $('.swal2-html-container #wallet_availbalanceid').val(
//           existingWallet.available_balance || 0,
//         );

//         window.notifyUser &&
//           window.notifyUser.showMessage &&
//           window.notifyUser.showMessage(
//             'error',
//             'This mobile number already has a wallet. Please select another number.',
//           );
//       } else {
//         $('.swal2-html-container #wallet_nameid').prop('readonly', false);
//       }
//     },
//   });
//   $('.swal2-actions').css('z-index', 0);
//   $('.swal2-content').css('height', '115px !important');
// }

function addPaymentList() {
  $('#wallet_paymentmode option:gt(0)').remove();
  paymentsList.forEach((pay) => {
    $('<option>')
      .val(pay.payment_mode_name)
      .text(pay.payment_mode_name)
      .appendTo('#wallet_paymentmode');
  });
}

async function showCreatewallet() {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:walletManagement.noInternetConnection'),
    );
    return;
  }
  $('#selectwallet_customerPhoneid option:gt(0)').remove();
  let data = { customers: window.customersList };
  if (!window.customersList || window.customersList.length === 0) {
    data = await window.betteripcRenderer.callMain(
      WALLET_IPC.GET_CUSTOMERS,
      {},
    );
  }
  const html = $('#create-wallet-view-container-id').html();
  const result = await window.Swal.fire({
    title: $.i18n.t('controller:walletManagement.createWallet'),
    html,
    didOpen: async () => {
      if (data && data.customers) {
        await addCustomerautocomplete(data);
      }

      const $phoneInput = $('.swal2-html-container #wallet_customerPhoneid');

      $phoneInput.on('blur', function () {
        const val = $(this).val().trim();

        if (val.length < 10) return;

        const existingWallet = walletExistsByPhone(val);

        if (existingWallet) {
          $('.swal2-html-container #wallet_availbalanceid').val(
            existingWallet.available_balance || 0,
          );

          window.notifyUser?.showMessage(
            'error',
            'This mobile number already has a wallet.',
          );
        }
      });
    },

    focusConfirm: false,
    width: '23em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    backdrop: true,
    // showCancelButton: true,
    // cancelButtonText: 'Add Customer',
    // showLoaderOnConfirm: true,
    reverseButtons: true,
    async preConfirm() {
      const result = makecreateWalletrequest(data.customers);
      return result;
    },
  });
  if (result && result.value && result.value.msg) {
    const data = result.value;
    const walletInfo = data.msg;
    if (walletInfo) {
      delete walletInfo.action;
      delete walletInfo.status;
      ipcRenderer.send(WALLET_IPC.CREATE, walletInfo);
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    // Close Create Wallet swal
    Swal.close();

    setTimeout(() => {
      if (typeof openCustomerForm === 'function') {
        openCustomerForm({ tabIndex: 0, source: 'wallet' });
        return;
      }

      const $btn = $('#openCustomerbtn');
      if ($btn.length) {
        $btn.trigger('click');
        return;
      }

      console.error(
        'WalletManagement: openCustomerForm not found and #openCustomerbtn missing',
      );
    }, 150);
  }
}

async function makecreateWalletrequest(customers) {
  if (!customers && Array.isArray(customers) && customers.length > 0) {
    showSwalwarning(
      $.i18n.t('controller:walletManagement.pleaseAddCustomersFirst'),
    );
    return false;
  }

  const cust_phone = $('.swal2-html-container #wallet_customerPhoneid').val();
  const wallet_name = $('.swal2-html-container #wallet_nameid').val();
  const avail_balance = $('.swal2-html-container #wallet_availbalanceid').val();

  if (cust_phone) {
    if (cust_phone.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Mobilenumbershouldbelessthanfifteendigit',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(cust_phone) ||
      !window.onlyNumberRegex.test(cust_phone)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Pleaseentervalidmobilenumber',
        ),
      );
      return;
    }
  }

  if (wallet_name) {
    if (wallet_name.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Businessnamelengthshouldbelessthanfiftycharacter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(wallet_name)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Specialcharactersarenotallowed',
        ),
      );
      return;
    }
  }
  const payment_mode = $(
    '#wallet_paymentmode option:selected:not([disabled])',
  ).val();
  if (avail_balance) {
    const isNumber = !isNaN(avail_balance);
    if (!isNumber) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:walletmanagementNotifications.InvalidAmount'),
      );
      return;
    }

    if (avail_balance.length > 10) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Amountlengthshouldbelessthantendigit',
        ),
      );
      return;
    }

    // if (!payment_mode) {
    //   window.notifyUser.showMessage('error', 'Please select payment mode');
    //   return;
    // }
  }

  if (cust_phone && wallet_name) {
    const customerExists = _.find(customers, { phone: cust_phone });

    if (!customerExists) {
      const confirmResult = await Swal.fire({
        title: $.i18n.t('controller:walletManagement.customerDoesNotExists'),
        html: $.i18n.t(
          'controller:walletManagement.createCustomerConfirmation',
        ),
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: $.i18n.t('controller:walletManagement.no'),
        confirmButtonText: $.i18n.t('controller:walletManagement.yes'),

        reverseButtons: true,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const createdDate = moment().format('YYYY-MM-DD HH:mm:ss');
            const customerPayload = {
              name: wallet_name || '',
              phone: cust_phone,
              store_id: window.storeDetails.store_id,

              createdDate,
              createWallet: false,
            };

            try {
              window.sendCustomerandaddtoListenerfromremote &&
                window.sendCustomerandaddtoListenerfromremote(
                  customerPayload,
                  false,
                );
            } catch (err) {
              console.warn('Failed to call customer create helper', err);
            }

            const available_balance =
              avail_balance && !isNaN(avail_balance)
                ? Number(avail_balance)
                : 0;
            const options = {
              method: 'POST',
              uri: window.Config.links.createWallet,
              body: {
                wallet_name,
                cust_phone,
                available_balance,
                store_id: window.storeDetails.store_id,
                wallet_id: -1,
                created_by: window.storeDetails.username,
                is_active: 1,
              },
              json: true,
              headers: getHeadersformposforrender(),
              rejectUnauthorized: false,
            };

            const walletResponse = await request(options);

            return walletResponse;
          } catch (err) {
            console.error('Error while creating customer + wallet', err);
            return null;
          }
        },
      });

      if (
        !confirmResult ||
        confirmResult.dismiss === Swal.DismissReason.cancel
      ) {
        return false;
      }

      if (confirmResult && confirmResult.value) {
        const resp = confirmResult.value;

        if (resp && resp.status === 200) {
          return resp;
        }

        if (resp && resp.message) {
          showSwalwarning(resp.message);
        } else {
          showSwalwarning(
            $.i18n.t('controller:walletManagement.somethingWentWrong'),
          );
        }
        return false;
      }

      return false;
    }

    const existingWalletBeforeCreate = walletExistsByPhone(cust_phone);
    if (existingWalletBeforeCreate) {
      showSwalwarning(
        'This mobile number is already used. Please select another number.',
      );
      return false;
    }

    let available_balance = $(
      '.swal2-html-container #wallet_availbalanceid',
    ).val();
    if (!available_balance || isNaN(available_balance)) {
      available_balance = 0;
    }

    const options = {
      method: 'POST',
      uri: window.Config.links.createWallet,
      body: {
        wallet_name,
        cust_phone,
        available_balance,
        store_id: window.storeDetails.store_id,
        wallet_id: -1,
        created_by: window.storeDetails.username,
        is_active: 1,
      },
      json: true,
      headers: getHeadersformposforrender(),
      rejectUnauthorized: false,
    };

    try {
      const response = await request(options);
      if (response && response.status) {
        if (response.status == 200) {
          window.notifyUser.showMessage(
            'success',
            $.i18n.t('controller:walletManagement.walletCreated'),
          );
          return response;
        }
        if (response.status == 303) {
          reloginfromremote();
        } else if (response.status == 201) {
          showSwalwarning(response.msg.message);
        } else {
          showSwalwarning(
            $.i18n.t('controller:walletManagement.somethingWentWrong'),
          );
        }
      } else {
        showSwalwarning(
          $.i18n.t('controller:walletManagement.somethingWentWrong'),
        );
      }
    } catch (error) {}
  } else {
    showSwalwarning(
      $.i18n.t('controller:walletManagement.phoneAndWalletNameIsRequired'),
    );
    return false;
  }
}

/**
 * Called on when the data is received from Main process
 * @param {Event receive} event
 * @param {Received wallet data} data
 */
async function handleWalletdatareply(event, data) {
  if (data) {
    const table = $('#wallettableID').DataTable();

    table.clear().draw();
    table.rows.add(data);
    table.columns.adjust().draw();

    // SAFE: force pagination to first page after loading data
    table.page('first').draw('page');

    initAccesslevelsformasters();
  }
}

/**
 * Called when the create wallet response is received
 * @param {Event receive} event
 * @param {Received wallet data} data
 */
async function createWalletResponse(event, data) {
  if (data) {
    const table = $('#wallettableID').DataTable();
    table.row.add(data).draw();
  }
}

async function viewTransactions(params) {
  $('#wallettransModal').modal('toggle');
  $('#currentwalletId').html(params.wallet_id);
  const data = await betteripcRenderer.callMain(WALLET_IPC.GET_TRANSACTIONS, {
    wallet_id: params.wallet_id,
    cust_phone: params.cust_phone,
  });
  $('#wallettransactionstableID').DataTable().clear().draw();
  $('#wallettransactionstableID').DataTable().rows.add(data);
  $('#wallettransactionstableID').DataTable().columns.adjust().draw();
}

async function addwalletCredit(params, rowindex) {
  const paymentOptions = paymentsList
    .map(
      (payment) =>
        `<option value="${payment.payment_mode_name}">${payment.payment_mode_name}</option>`,
    )
    .join('');
  const html = `
  <div id="topup-wallet-container">
    <div>
      <label for="topup-wallet-amountid">
        ${$.i18n.t('controller:walletManagement.amount')}
      </label>
      <input 
        type="number" 
        id="topup-wallet-amountid" 
        class="swal2-input"
        placeholder="${$.i18n.t('controller:walletManagement.amount')}"
      />
    </div>

    <div>
      <label for="wallet-payment-mode">
        ${$.i18n.t('controller:walletManagement.paymentMode')}
      </label>

      <select id="wallet-payment-mode">
        <option value="" selected disabled>
          ${$.i18n.t('controller:walletManagement.selectPaymentMode')}
        </option>
        ${paymentOptions}
      </select>
    </div>
  </div>
`;
  const result = await Swal.fire({
    title: $.i18n.t('controller:walletManagement.walletTopup'),
    showCancelButton: true,
    cancelButtonText: $.i18n.t('controller:walletManagement.close'),
    confirmButtonText: $.i18n.t('controller:walletManagement.ok'),
    cancelButtonColor: '#dc3545',
    reverseButtons: true,
    html,
    focusConfirm: false,
    width: '25em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    // showCancelButton: true,
    showLoaderOnConfirm: true,
    async preConfirm() {
      const value = Number(
        $('.swal2-html-container #topup-wallet-amountid').val(),
      );
      const payment_mode = $(
        '#wallet-payment-mode option:selected:not([disabled])',
      ).val();
      if (!payment_mode) {
        showSwalwarning('Please select payment mode');
        return false;
      }

      if (!value || isNaN(value)) {
        showSwalwarning(
          $.i18n.t('controller:walletManagement.pleaseProvideValidAmount'),
        );
        return false;
      }
      if (value < 0) {
        showSwalwarning('Amount should not be negative');
        return false;
      }

      if ($('.swal2-html-container #topup-wallet-amountid').val().length > 10) {
        showSwalwarning('Amount length should be less than 10 digit');
        return false;
      }
      Swal.showLoading();

      const data = await betteripcRenderer.callMain(WALLET_IPC.TOPUP, {
        wallet_id: params.wallet_id,
        cust_phone: params.cust_phone,
        amount: value,
        payment_mode,
      });
      window.refreshDashboard = true;

      Swal.hideLoading();
      return data;
    },
  });
  if (result && result.value) {
    const response = result.value;
    if (response.status == 200) {
      window.notifyUser.showMessage('success', response.message, 0);
      params.available_balance = response.available_balance;
      $('#wallettableID').DataTable().row(rowindex).data(params).draw();
      redrawWallets();
    } else if (response.message) {
      window.notifyUser.showMessage('error', response.message, 0);
    }
  }
}

async function redrawWallets() {
  const data = $('#wallettableID').DataTable().rows().data();
  delete data.context;
  delete data.selector;
  delete data.ajax;

  const dataAsArray = [];
  for (i = 0; i < data.length; i++) {
    dataAsArray.push(data[i]);
  }

  $('#wallettableID').DataTable().clear().draw();
  $('#wallettableID').DataTable().rows.add(dataAsArray);
  $('#wallettableID').DataTable().columns.adjust().draw();
}

initialize();
