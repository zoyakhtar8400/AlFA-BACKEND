/* eslint-disable func-names */
/* eslint-disable camelcase */
const { formatAMPM, sleep } = require('../util/MiscUtil');

const {
  UPDATE_FAST_SETTLE_PAYMENT,
  RELOAD_APP,
} = require('../util/IPC_Messages');
const {
  KOT_ITEMS_STATUS,
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_FLAG_ID,
  QUICKBILL_FLAG_ID,
  VIRTUALTABLE_FLAG_ID,
} = require('../util/Constants');
const { Swal } = require('../util/Notification');
const {
  sendkotitemStatuschanged,
  sendKotupdateddevent,
} = require('./ClientrequestHandler');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
const { updateOrderDataRequest } = require('../renderer/helper/Order.helper');
const {
  getLiveStatusRequest,
  updateLiveStatusDataRequest,
} = require('../renderer/helper/Common.helper');
const {
  addOrUpdateCustomerRequest,
} = require('../renderer/helper/Customer.helper');

function getBrowserOS() {
  const ua = navigator.userAgent;

  const browsers = [
    { keyword: 'Chrome', name: 'Chrome' },
    { keyword: 'Firefox', name: 'Firefox' },
    { keyword: 'Safari', name: 'Safari' },
    { keyword: 'Edg', name: 'Edge' },
  ];

  const oses = [
    { keyword: 'Windows', name: 'Windows' },
    { keyword: 'Mac', name: 'MacOS' },
    { keyword: 'Linux', name: 'Linux' },
    { keyword: 'Android', name: 'Android' },
    { keyword: 'iPhone', name: 'iOS' },
  ];

  const browser =
    browsers.find((b) => ua.includes(b.keyword))?.name || 'Unknown Browser';
  const os = oses.find((o) => ua.includes(o.keyword))?.name || 'Unknown OS';

  return `${browser} ${os}`;
}
async function sendotprequest(order_type, order_id, OTP_TYPES) {
  if (Swal.isVisible()) Swal.showLoading();
  const options = {
    method: 'POST',
    uri: window.Config.links.sendOTP,
    body: {
      order_type,
      store_id: window.storeDetails.store_id,
      username: window.storeDetails.username,
      otpType: OTP_TYPES,
      referenceId: order_id,
      applicationType: 'POS',
      deviceInfo: getBrowserOS(),
      ipAddress: window.globalIPAddress,
    },

    json: true,
    headers: getHeadersformposforrender(),
    rejectUnauthorized: false,
  };

  try {
    const otpResponse = await apiCall.post(
      window.Config.links.requestOTP,
      options.body,
      {
        headers: options.headers,
      },
    );
    const response = otpResponse.data;
    console.log('response', response);
    if (response.status === 200) {
      if (Swal.isLoading()) Swal.hideLoading();
    } else if (response.status === 401) {
      window.reloginfromremote();
    } else {
      if (Swal.isVisible())
        window.showSwalwarning(response.otp || response.message);
      if (Swal.isLoading()) Swal.hideLoading();
    }

    return response;
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.response?.status)) {
      window.reloginfromremote();
    }
  }
  if (Swal.isVisible()) {
    Swal.hideLoading();
    Swal.getTitle().textContent = $.i18n.t('controller:commonUtils.enterOTP');
  }
  return undefined;
}
async function askforOTP(order_type, order_id, OTP_TYPES, items = []) {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:commonUtils.noInternetConnection'),
    );
    return;
  }
  const result = await Swal.fire({
    title: $.i18n.t('controller:commonUtils.sendingOTPPleaseWait'),
    input: 'text',
    width: '27em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    customClass: {
      input: 'tmbill-swal-input',
    },
    didOpen: () => {
      sendotprequest(order_type, order_id, OTP_TYPES);
     const input = document.querySelector('.swal2-input');
  if (input) {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  }
},
    inputValidator: async (value) => {
      if (!value) {
        return $.i18n.t('controller:commonUtils.youNeedToWriteSomething');
      }
      if (String(value).length !== 6) {
  return 'OTP must be 6 digits';
}
      if (Number(value)) {
        const otpResponse = await apiCall.post(
          window.Config.links.validateOTP,
          {
            username: window.storeDetails.username,
            store_id: window.storeDetails.store_id,
            otpType: OTP_TYPES,
            applicationType: 'POS',
            referenceId: order_id,
            otp: value,
          },
          {
            headers: getHeadersformposforrender(),
          },
        );

        const response = otpResponse.data;

        if (!response || response.status !== 200) {
          return $.i18n.t('controller:commonUtils.InvalidOTP');
        }
      } else {
        return $.i18n.t('controller:commonUtils.InvalidOTP');
      }
      return undefined;
    },
  });

  // eslint-disable-next-line consistent-return
  return result !== undefined && result.value;
}
async function askforCoversbeforetakingorder() {
  const result = await Swal.fire({
    width: '27em',
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: $.i18n.t('controller:orderController.changeTable.OK'),
    cancelButtonText: $.i18n.t('controller:orderController.Close'),
    title: $.i18n.t('controller:commonUtils.addCovers'),
    input: 'number',
    allowOutsideClick: false,
    allowEscapeKey: false,
    returnFocus: false,
    inputAttributes: {
      id: 'coversinputid',
    },
    inputValidator: (value) => {
      if (!value) {
        return $.i18n.t('controller:commonUtils.youNeedToWriteSomething');
      }
      try {
        // eslint-disable-next-line no-param-reassign
        value = parseInt(value, 10);
        if (Number.isNaN(value) || value === 0) {
          return $.i18n.t('controller:commonUtils.invalidCovers');
        }
      } catch (error) {
        return $.i18n.t('controller:commonUtils.invalidCovers');
      }
      return undefined;
    },
    preConfirm: () => {
      const covers = $('#coversinputid').val();
      if (covers.length > 3) {
        window.showSwalwarning('Covers should be less than 3 digit');
      }

      if (covers < 0) {
        window.showSwalwarning("Can't enter covers in negative number");
      }

      if (!Number.isInteger(Number(covers))) {
        window.showSwalwarning('Covers value should not be in decimal');
      }
    },
    customClass: {
      input: 'tmbill-swal-input',
    },
  });
  if (result && result.value) {
    try {
      result.value = parseInt(result.value, 10);
    } catch (error) {
      result.value = 1;
    }
  }
  return result;
}

async function getLivestatusdata() {
  const liveData = await getLiveStatusRequest({
    store_id: window.storeDetails.store_id,
    getRecentfirst: $('#getrecentliveitemsCheck').is(':checked'),
  });

  if (liveData && Array.isArray(liveData)) {
    $('#livestatustableID').DataTable().clear().draw();
    $('#livestatustableID').DataTable().rows.add(liveData); // Add new data
    $('#livestatustableID').DataTable().columns.adjust().draw();
  }
}

async function redrawlivestatusItems() {
  const data = $('#livestatustableID').DataTable().rows().data();
  delete data.context;
  delete data.selector;
  delete data.ajax;

  const dataAsArray = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < data.length; i++) {
    dataAsArray.push(data[i]);
  }
  $('#livestatustableID').DataTable().clear().draw();
  $('#livestatustableID').DataTable().rows.add(dataAsArray); // Add new data
  $('#livestatustableID').DataTable().columns.adjust().draw(); // Redraw the DataTable
}

async function updatekotItemstatus() {
  const selection = $(
    '#livestatusstateOptions option:selected:not([disabled])',
  );
  if (selection.length > 0) {
    const itemDetails = $('#livestatustableID')
      .DataTable()
      .row('.selectedbillRow')
      .data();
    if (!itemDetails) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.pleaseSelectItem'),
      );
      return;
    }
    const status = $(selection).attr('value');
    if (status === itemDetails.orderstatus) {
      window.notifyUser.showMessage(
        'error',
        `${$.i18n.t('controller:commonUtils.itemIsAlreadyInState')} :${status}`,
        0,
      );
      return;
    }

    const response = await updateLiveStatusDataRequest({
      kot_item_id: itemDetails.kot_item_id,
      orderstatus: status,
      previousstatus: itemDetails.orderstatus,
    });
    if (response && response.status) {
      if (response.status === 200) {
        window.notifyUser.showMessage('success', response.message, 0);
        itemDetails.previousstatus = itemDetails.orderstatus;
        itemDetails.orderstatus = status;
        $('#livestatustableID')
          .DataTable()
          .row('.selectedbillRow')
          .data(itemDetails);
        redrawlivestatusItems();

        // send socket event
        sendkotitemStatuschanged({ table_id: itemDetails.table_id });
        sendKotupdateddevent({ table_id: itemDetails.table_id });
      } else {
        window.notifyUser.showMessage('error', response.message, 0);
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.somethingWentWrong'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:commonUtils.selectStatus'),
    );
  }
}

function selectCurrentrow() {
  $('#livestatustableID tbody tr').removeClass('selectedbillRow');
  $(this).addClass('selectedbillRow');
}

function initialize() {
  if (window.storeDetails) {
    $('#orderduepaytransactionstableID').DataTable({
      ordering: false,
      scrollY: '37vh',
      bPaginate: false,
      bLengthChange: false,
      bFilter: true,
      bInfo: false,
      paging: false,
      searching: false,
      scrollX: true,
      bAutoWidth: false,
      autoWidth: false,
      fixedColumns: true,
      columns: [
        { title: $.i18n.t('controller:commonUtils.Date'), data: 'created' },
        {
          title: $.i18n.t('controller:commonUtils.amountToPay'),
          data: 'amount_to_pay',
        },
        {
          title: $.i18n.t('controller:commonUtils.Received'),
          data: 'received_amount',
        },
        { title: $.i18n.t('controller:commonUtils.Due'), data: 'due_amount' },
        {
          title: $.i18n.t('controller:commonUtils.Payment'),
          data: 'payment_info',
        },
      ],
      columnDefs: [
        {
          targets: [0],
          width: '150px',
        },
        {
          targets: [1, 2, 3, 4],
          width: '90px',
        },
      ],
      createdRow(row, data, _index) {
        if (data.created) {
          const date1 = new Date(Date.parse(data.created));
          const formattedDate = formatAMPM(date1, false);
          $('td', row).eq(0).html(formattedDate);
        }
        if (data.payment_info == null) {
          $('td', row).eq(4).html('--');
        }
      },
    });

    $('#livestatustableID').DataTable({
      ordering: false,
      scrollY: '35vh',
      bPaginate: false,
      bLengthChange: false,
      bFilter: true,
      bInfo: false,
      paging: false,
      // order: [[1, 'asc']],
      language: {
        url: `../locales/${$.i18n.language}/datatable.json`,
      },
      columns: [
        { title: $.i18n.t('controller:commonUtils.Item'), data: 'title' },
        { title: $.i18n.t('controller:commonUtils.placedAt'), data: 'title' },
        { title: $.i18n.t('controller:commonUtils.Qty'), data: 'quantity' },
        {
          title: $.i18n.t('controller:commonUtils.Status'),
          data: 'orderstatus',
        },
        { title: $.i18n.t('controller:commonUtils.Table'), data: 'table_name' },
      ],
      createdRow(row, data, _index) {
        if (data.kot_date) {
          const date1 = new Date(Date.parse(data.kot_date));
          $('<span>', {
            html: window.moment(date1).format('x'),
          }).css('display', 'none');

          const formattedDate = formatAMPM(date1, false);
          $('td', row)
            .eq(1)
            .empty()
            // .append(moment(date1).format('x'))
            .append(formattedDate);
        }
        if (window.selectedLanguage !== 'en' && data.alternative_title) {
          $('td', row).eq(0).html(data.alternative_title);
        }
        if (data.orderstatus) {
          const statusLabel = $('<label>', {
            class: `statusLabel ${String(data.orderstatus).toLowerCase()}`,
            html: $.i18n.t(`controller:itemState.${data.orderstatus}`),
          });
          $('td', row).eq(3).empty().append(statusLabel);
        }
        $(row).on('click', selectCurrentrow);
      },
    });
  }
  $('#livetstatusButton').on('click', () => {
    window.LiveStatusModalOpened = true;
    $('#livestatusModal').modal('toggle');
  });

  $('#getrecentliveitemsCheck').on('click', () => {
    getLivestatusdata();
  });

  // livestatusstateOptions
  window._.forIn(KOT_ITEMS_STATUS, (value, _key) => {
    $('<option>')
      .val(value)
      .text($.i18n.t(`controller:itemState.${value}`))
      .appendTo('#livestatusstateOptions');
  });

  $('#livestatusModal').on('shown.bs.modal', () => {
    getLivestatusdata();
  });
  // updateitemlivestatButton
  $('#updateitemlivestatButton').on('click', updatekotItemstatus);
}

async function sendCustomersinfotodboy({
  customer,
  delivery_boy_phone,
  bill_amount,
  order_id,
}) {
  if (customer && delivery_boy_phone) {
    const cust_address = `${
      customer.address_line1 ? customer.address_line1 : ''
    },${customer.address_line2 ? customer.address_line2 : ''}`;
    const payload = {
      delivery_boy_phone,
      store_id: window.storeDetails.store_id,
      cust_mobile: customer.phone,
      cust_address,
      bill_amount,
      customer_name: customer.name,
      order_id,
    };
    try {
      await apiCall.post(window.Config.links.sendcustomertoDboy, payload, {
        headers: getHeadersformposforrender(),
      });
    } catch (error) {
      console.log(error);
    }
  }
}

async function addoreditCustomerdetails({
  customers,
  nameField,
  mobileField,
  addressField,
  order_id,
  table_id,
}) {
  if (!customers) {
    // eslint-disable-next-line no-param-reassign
    customers = window.customersList;
  }
  let customerAddedorupdated = false;
  const response = { customerAddedorupdated };

  $('#addOrEditCustomerModal').modal('show');
  $('#modal_customerPhoneid').val($(mobileField).val());
  $('#modal_customeraddressid').val($(addressField).val());
  $('#modal_customernameid').val($(nameField).val());

  if (customers && Array.isArray(customers)) {
    $('#modal_customernameid').autocomplete({
      source(req, sresponse) {
        const sourceData = [];
        const re = $.ui.autocomplete.escapeRegex(req.term);
        sresponse(
          $.grep(customers, (customer) => {
            if (customer.name.toLowerCase().startsWith(re.toLowerCase())) {
              let address = customer.address_line1
                ? customer.address_line1
                : '';
              if (customer.address_line2) {
                address =
                  address + customer.address_line2
                    ? customer.address_line2
                    : '';
              }
              sourceData.push({
                label: customer.name,
                value: customer.name,
                phone: customer.phone,
                id: customer.id,
                address,
                customer,
              });
            }
          }),
        );
        return sresponse(sourceData);
      },
      classes: {
        'ui-autocomplete': 'autocomplete-to-front',
      },
      select(_event, ui) {
        $('#modal_customerPhoneid').val(ui.item.phone);
        $('#modal_customeraddressid').val(ui.item.address);
      },
    });
    $('#modal_customerPhoneid').autocomplete({
      source(req, sresponse) {
        const sourceData = [];
        // var re = $.ui.autocomplete.escapeRegex(req.term);
        const re = $.ui.autocomplete.escapeRegex(req.term);
        if (re.length > 3) {
          sresponse(
            $.grep(customers, (customer) => {
              if (customer.phone.toLowerCase().startsWith(re.toLowerCase())) {
                let address = customer.address_line1
                  ? customer.address_line1
                  : '';
                if (customer.address_line2) {
                  address =
                    address + customer.address_line2
                      ? customer.address_line2
                      : '';
                }

                sourceData.push({
                  label: customer.phone,
                  value: customer.phone,
                  name: customer.name,
                  id: customer.id,
                  address,
                  customer,
                });
              }
            }),
          );
        }
        return sresponse(sourceData);
      },
      classes: {
        'ui-autocomplete': 'autocomplete-to-front',
      },
      select(_event, ui) {
        $('#modal_customernameid').val(ui.item.name);
        $('#modal_customeraddressid').val(ui.item.address);
      },
    });
    $('.swal2-actions').css('z-index', 0);
    $('.swal2-content').css('height', '115px !important');
  }

  await Swal.fire({
    title: $.i18n.t(
      'controller:orderController.editOrAddCustomer.customerDetails',
    ),
    html: `<input type='number' autocomplete='' class='w-100 wallet_customerPhone' id='swal_customerPhoneid'
            placeholder='${$.i18n.t(
              'controller:orderController.editOrAddCustomer.customerMobile',
            )}'>
            <input type='text' name='' class='w-100 wallet_customerName'  id='swal_customernameid' placeholder='${$.i18n.t(
              'controller:orderController.editOrAddCustomer.customerName',
            )}'>
            <input type='text' name='' class='w-82' id='swal_customeraddressid' placeholder='${$.i18n.t(
              'controller:orderController.editOrAddCustomer.customerAddress',
            )}'>
            <i data-i18n="" title=""
              class="fas fa-plus-circle fa-lg has-i18n" id="showCustomeraddressswalid"
              -hidden="true"></i>`,
    didOpen: () => {
      $('.swal2-html-container .has-i18n').localize();
      // Set current values if any
      $('.swal2-html-container #swal_customerPhoneid').val(
        $(mobileField).val(),
      );
      $('.swal2-html-container #swal_customeraddressid').val(
        $(addressField).val(),
      );
      $('.swal2-html-container #swal_customernameid').val($(nameField).val());

      if (customers && Array.isArray(customers)) {
        $('#swal2-html-container input#swal_customernameid').autocomplete({
          source(req, sresponse) {
            const sourceData = [];
            const re = $.ui.autocomplete.escapeRegex(req.term);
            sresponse(
              $.grep(customers, (customer) => {
                if (customer.name.toLowerCase().startsWith(re.toLowerCase())) {
                  let address = customer.address_line1
                    ? customer.address_line1
                    : '';
                  if (customer.address_line2) {
                    address =
                      address + customer.address_line2
                        ? customer.address_line2
                        : '';
                  }
                  sourceData.push({
                    label: customer.name,
                    value: customer.name,
                    phone: customer.phone,
                    id: customer.id,
                    address,
                    customer,
                  });
                }
              }),
            );
            return sresponse(sourceData);
          },
          appendTo: '#swal2-html-container',
          classes: {
            'ui-autocomplete': 'autocomplete-to-front',
          },
          select(_event, ui) {
            $('.swal2-html-container #swal_customerPhoneid').val(ui.item.phone);
            $('.swal2-html-container #swal_customeraddressid').val(
              ui.item.address,
            );
          },
        });
        $('#swal2-html-container input#swal_customerPhoneid').autocomplete({
          source(req, sresponse) {
            const sourceData = [];
            // var re = $.ui.autocomplete.escapeRegex(req.term);
            const re = $.ui.autocomplete.escapeRegex(req.term);
            if (re.length > 3) {
              sresponse(
                $.grep(customers, (customer) => {
                  if (
                    customer.phone.toLowerCase().startsWith(re.toLowerCase())
                  ) {
                    let address = customer.address_line1
                      ? customer.address_line1
                      : '';
                    if (customer.address_line2) {
                      address =
                        address + customer.address_line2
                          ? customer.address_line2
                          : '';
                    }

                    sourceData.push({
                      label: customer.phone,
                      value: customer.phone,
                      name: customer.name,
                      id: customer.id,
                      address,
                      customer,
                    });
                  }
                }),
              );
            }
            return sresponse(sourceData);
          },
          appendTo: '#swal2-html-container',
          classes: {
            'ui-autocomplete': 'autocomplete-to-front',
          },
          select(_event, ui) {
            $('.swal2-html-container #swal_customernameid').val(ui.item.name);
            $('.swal2-html-container #swal_customeraddressid').val(
              ui.item.address,
            );
          },
        });
        $('.swal2-actions').css('z-index', 0);
        $('.swal2-content').css('height', '115px !important');
      }
      $('#showCustomeraddressswalid').click(() => {
        const customer_mobile = $('#swal_customerPhoneid').val();
        if (!customer_mobile) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:orderController.Pleaseaddcustomermobile'),
          );
          return;
        }
        if (!window.customerAddressscriptLoaded) {
          $('#customerAddressModalbodyid').load('CustomerAddress.html', () => {
            $('#customerAddressModal').modal('show');
          });
        } else {
          $('#customerAddressModal').modal('toggle');
        }
      });
    },
    focusConfirm: false,
    width: '23em',
    confirmButtonText: $.i18n.t(
      'controller:orderController.editOrAddCustomer.updateAndSave',
    ),
    showCancelButton: true,
    cancelButtonText: $.i18n.t(
      'controller:orderController.editOrAddCustomer.Cancel',
    ),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      container: 'tmbill-swal-add-customer-container-class',
      confirmButton: 'tmbill-swal-customer-update-button-class',
    },
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    showLoaderOnConfirm: true,
    reverseButtons: true,
    async preConfirm() {
      Swal.showLoading();
      Swal.getCancelButton().style.display = 'none';

      const phone = $('.swal2-html-container #swal_customerPhoneid').val();
      const name = $('.swal2-html-container #swal_customernameid').val();
      const address = $('.swal2-html-container #swal_customeraddressid').val();

      if (!phone) {
        window.showSwalwarning('Mobile number is required');
        return false;
      }

      const customer = {
        name,
        phone,
        store_id: window.storeDetails.store_id,
        address_line1: address,
      };
      const miscData = {
        order_id,
        table_id,
      };

      const result = await addOrUpdateCustomerRequest({ customer, miscData });

      customerAddedorupdated = result && result.status === 200;
      if (customerAddedorupdated) {
        window.initgetCustomers();
        $(nameField).val(name || result?.customer?.name);
        $(mobileField).val(phone || result?.customer?.phone);
        $(addressField).val(address);
        response.customer = result.customer;
        Object.assign(response, {
          customerAddedorupdated,
          customer: result.customer,
        });
      }
      await sleep(400);

      Swal.hideLoading();
      Swal.getCancelButton().style.display = '';
      return true;
    },
  });
  return response;
}

async function sendEbill({
  phone,
  name,
  amount,
  order_id,
  delivery_type,
  for_payment_link,
}) {
  const options = {
    method: 'POST',
    uri: window.Config.links.sendbill,
    body: {
      cust_mobile: phone,
      cust_name: name || 'User',
      bill_amount: amount,
      restoName: window.storeDetails.store_name,
      store_id: window.storeDetails.store_id,
      order_id,
      delivery_type,
      currency: window.currency,
      for_payment_link,
    },
    json: true,
    headers: getHeadersformposforrender(),
    rejectUnauthorized: false,
  };
  try {
    // let response = await request(options);

    const axiosResponse = await apiCall.post(options.uri, options.body, {
      headers: options.headers,
    });
    const response = axiosResponse.data;

    if (response && response.status && ['200', 200].includes(response.status)) {
      if (response.msg) {
        window.notifyUser.showMessage('success', response.msg, 0);
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:commonUtils.EBillSent'),
        );
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.eBillSendingFailed'),
      );
    }
  } catch (error) {
    console.error('Sending ebill failed.', error);
    if ([401].includes(error?.response?.status)) {
      window.reloginfromremote();
    }
  }
}

async function showfastsettleWinow({
  saveCallback,
  saveandprintCallback,
  settleCallback,
  currentTable,
}) {
  if (currentTable === undefined) {
    return;
  }
  // eslint-disable-next-line no-unused-vars
  let allowSavepaidamount = false;
  let billTotal = currentTable.data.details.order_total;
  let amountPaidbycustomer = 0;
  let paymentButton;
  const billNumber = currentTable.data.details.bill_number;
  const { order_type_flag } = currentTable.data;
  const table_id = currentTable.id.replace('table_', '');
  // let waiterTipAmount = $('#swalfastwaiterTipinput').val();

  switch (order_type_flag) {
    case TAKEAWAY_FLAG_ID:
    case HOMED_FLAG_ID:
      if (billTotal) billTotal = $('#takeawaybillGrandtotal').text();
      paymentButton = '#takeawaypaymentButton';
      break;
    case DINEIN_FLAG_ID:
    case VIRTUALTABLE_FLAG_ID:
      if (billTotal) billTotal = $('#billGrandtotal').text();
      paymentButton = '#paymentButton';
      break;
    case QUICKBILL_FLAG_ID:
      if (billTotal) billTotal = $('#quickbillGrandtotal').text();
      paymentButton = '#quickpaymentButton';
      break;
    default:
      break;
  }
  try {
    billTotal = Number(billTotal);
    if (billTotal === 0) return;
  } catch (error) {
    console.error(error);
  }
  const old_cust_paid_amount = currentTable.data.details.cust_paid_amount
    ? currentTable.data.details.cust_paid_amount
    : billTotal;

  const htmlContent = $('<div>');
  const subHeading = $('<div>', {
    class: 'p-2',
    html: `Save or Settle for ${currentTable.data.table_name}`,
  });
  const billdetails = $('<div>', {
    class: 'd-flex justify-content-between p-2',
  }).css({
    borderBottom: ' 2px solid #bdbdbd',
  });
  const billAmount = $('<div>', { html: `Bill amt: ${billTotal}` });
  const billNumberelement = $('<div>', {
    html: `Bill no: ${currentTable.data.details.order_id}`,
  });
  const actions = $('<div>', { class: 'p-2' });
  if (saveCallback) {
    const saveButton = $('<input>', {
      class: 'swal-fast-action-button',
      id: 'swalfastSavebutton',
      type: 'button',
      value: 'Save',
    }).css({
      width: '30%',
    });
    actions.append(saveButton);
  }
  if (saveandprintCallback) {
    const savenprintButton = $('<input>', {
      class: 'swal-fast-action-button',
      id: 'swalfastSavenprintbutton',
      type: 'button',
      value: 'Save & Print',
    }).css({
      width: '30%',
    });
    actions.append(savenprintButton);
  }
  if (settleCallback) {
    const settlebutton = $('<input>', {
      class: 'swal-fast-action-button',
      id: 'swalfastSettlebutton',
      type: 'button',
      value: 'Settle Bill',
    }).css({
      width: '30%',
    });
    actions.append(settlebutton);
  }
  billdetails.append(billAmount);
  if (billNumber) billdetails.append(billNumberelement);

  const paymodeContainer = $('<div>', {
    class: 'd-flex  justify-content-center  align-items-end p-2',
  });
  const paymodeContainertitle = $('<div>', {
    class: 'p-2',
    html: `Payment Mode :`,
  });
  const cashPaymentinput = $('<input>', {
    value: 'Cash',
    class: '',
    id: 'swalfastcashMethodinputid',
    type: 'radio',
    name: 'swalfastPaygroup',
  });
  const cashPaymentinputlabel = $('<label>', {
    class: '',
    for: 'swalfastcashMethodinputid',
    html: 'Cash',
  });
  const otherPaymentinput = $('<input>', {
    value: 'Other',
    class: '',
    id: 'swalfastotherMethodinputid',
    type: 'radio',
    name: 'swalfastPaygroup',
  });
  const otherPaymentinputlabel = $('<label>', {
    class: '',
    for: 'swalfastotherMethodinputid',
    html: 'Other',
  });
  paymodeContainer.append(paymodeContainertitle);
  paymodeContainer.append(cashPaymentinput);
  paymodeContainer.append(cashPaymentinputlabel);
  paymodeContainer.append(otherPaymentinput);
  paymodeContainer.append(otherPaymentinputlabel);

  const calculationContainer = $('<div>', {
    id: 'swalfastCalculationcontainer',
    class: 'p-2',
  });
  const paidAmountcontainer = $('<div>', { class: 'd-flex p-2' });
  const paidAmountinputlabel = $('<div>', {
    class: 'd-flex  align-items-center mr-1',
    html: 'Paid amount:',
  }).css({ width: '40%', textAlign: 'end' });
  const paidAmountinput = $('<input>', {
    step: '.01',
    id: 'swalfastPaidamountinput',
    class: 'swal2-input',
    type: 'number',
  }).css({
    maxWidth: '65%',
    width: '65%',
    height: '40px',
    padding: '0 8px',
    margin: '0',
    borderRadius: '4px',
    fontSize: '1rem',
    background: 'transparent',
  });

  const returnAmountcontainer = $('<div>', { class: 'd-flex p-2' });
  const returnamountinputLabel = $('<div>', {
    class: 'd-flex  align-items-center mr-1',
    html: 'Return:',
  }).css({ width: '40%', textAlign: 'end' });
  const returnamountinput = $('<input>', {
    step: '.01',
    id: 'swalfastReturnamountinput',
    class: 'swal2-input',
    type: 'number',
  })
    .attr('disabled', true)
    .css({
      maxWidth: '65%',
      width: '65%',
      height: '40px',
      padding: '0 8px',
      margin: '0',
      borderRadius: '4px',
      fontSize: '1rem',
      background: 'transparent',
    });

  const waiterTipcontainer = $('<div>', { class: 'd-flex p-2' });
  const waiterTipAmountinputlabel = $('<div>', {
    class: 'd-flex  align-items-center mr-1',
    html: 'Tip Amount:',
  }).css({ width: '40%', textAlign: 'end' });
  const waiterTipinput = $('<input>', {
    step: '.01',
    id: 'swalfastwaiterTipinput',
    class: 'swal2-input',
    type: 'number',
  }).css({
    maxWidth: '65%',
    width: '65%',
    height: '40px',
    padding: '0 8px',
    margin: '0',
    borderRadius: '4px',
    fontSize: '1rem',
    background: 'transparent',
  });
  const applyButtoncontainer = $('<div>', {
    id: 'swalfastapplybuttoContainer',
    class: 'd-flex p-2 justify-content-end',
  });
  const applyButton = $('<input>', {
    class: 'swal-fast-action-button',
    id: 'swalfastApplyamountbutton',
    type: 'button',
    value: 'Apply',
  }).css({
    width: '30%',
  });
  const removeButton = $('<input>', {
    class: 'swal-fast-action-button',
    id: 'swalfastRemoveamountbutton',
    type: 'button',
    value: 'Reset',
  }).css({
    width: '30%',
  });

  paidAmountcontainer.append(paidAmountinputlabel);
  paidAmountcontainer.append(paidAmountinput);
  returnAmountcontainer.append(returnamountinputLabel);
  returnAmountcontainer.append(returnamountinput);
  waiterTipcontainer.append(waiterTipAmountinputlabel);
  waiterTipcontainer.append(waiterTipinput);
  applyButtoncontainer.append(removeButton);
  applyButtoncontainer.append(applyButton);
  calculationContainer.append(paidAmountcontainer);
  calculationContainer.append(returnAmountcontainer);
  calculationContainer.append(waiterTipcontainer);

  if (
    currentTable.data.details.payment_mode &&
    String(currentTable.data.details.payment_mode).toLowerCase() === 'cash'
  ) {
    $(cashPaymentinput).attr('checked', true);
    $(calculationContainer).show();
  } else {
    $(calculationContainer).hide();
    $(otherPaymentinput).attr('checked', true);
  }
  htmlContent.append(subHeading);
  htmlContent.append(billdetails);
  htmlContent.append(paymodeContainer);
  htmlContent.append(calculationContainer);
  htmlContent.append(actions);
  await Swal.fire({
    title: $.i18n.t('controller:swalDataTranslations.SettlementDetails'),
    html: htmlContent,
    width: '28em',
    showConfirmButton: false,
    showCancelButton: false,
    showCloseButton: true,
    didOpen: () => {
      $('#swalfastPaidamountinput').on('change paste keyup', function () {
        const newValue = parseFloat($(this).val());
        if (!Number.isNaN(newValue)) {
          if (newValue >= billTotal) {
            const amounttoreturn = Number(newValue - billTotal).toFixed(
              window.ROUNDOFF_UPTO,
            );
            amountPaidbycustomer = Number(
              Number(newValue).toFixed(window.ROUNDOFF_UPTO),
            );
            $('#swalfastReturnamountinput').val(amounttoreturn);
            allowSavepaidamount = true;
            window.currentTable.data.details.cust_paid_amount =
              amountPaidbycustomer;
          } else {
            $('#swalfastReturnamountinput').val('');
            amountPaidbycustomer = 0;
            allowSavepaidamount = false;
            window.currentTable.data.details.cust_paid_amount = billTotal;
          }
        }
      });
      if (old_cust_paid_amount) {
        $('#swalfastPaidamountinput').val(old_cust_paid_amount);
        $('#swalfastPaidamountinput').trigger('change');
      }

      if (saveCallback) {
        $('#swalfastSavebutton').on('click', () => {
          $('input.swal-fast-action-button').prop('disabled', true);
          saveCallback(false);
        });
      }
      if (saveandprintCallback) {
        $('#swalfastSavenprintbutton').on('click', () => {
          $('input.swal-fast-action-button').prop('disabled', true);
          saveandprintCallback(true);
        });
      }
      if (settleCallback) {
        $('#swalfastSettlebutton').on('click', () => {
          $('input.swal-fast-action-button').prop('disabled', true);
          const waiterTipAmount = $('#swalfastwaiterTipinput').val();
          if (waiterTipAmount && currentTable && currentTable.data) {
            window.currentTable.data.details.fastSettletipAmt = waiterTipAmount;
          }
          settleCallback();
        });
      }

      $('input[type=radio][name=swalfastPaygroup]').change(function () {
        if (this.value === 'Other') {
          window.currentTable.data.details.cust_paid_amount = billTotal;
          Swal.close();
          if (paymentButton) $(paymentButton).click();
          if (currentTable.data.details.bill_number) {
            updateOrderDataRequest({
              order_id: currentTable.data.details.bill_number,
              cust_paid_amount: billTotal,
            });
          }
        } else {
          $('#swalfastCalculationcontainer').show();
          window.currentTable.data.details.payment_mode = 'Cash';
          if (currentTable.data.details.paymentDetails) {
            Object.assign(currentTable.data.details.paymentDetails, {
              payment_option: 'Cash',
            });
          }
          if (billNumber !== 0) {
            const paymentData = {
              order_id: billNumber,
              paymentName: 'Cash',
              isSplitpayment: false,
              table_id,
              addasdueChecked: false,
              billTotal,
            };
            paymentData.paymentDetails = {
              order_id: billNumber,
              payment_option: 'Cash',
              amount: billTotal,
            };
            window.ipcRenderer.send(
              UPDATE_FAST_SETTLE_PAYMENT,
              JSON.stringify(paymentData),
            );
          }
        }
      });

      $('#swalfastApplyamountbutton').on('click', async () => {
        window.currentTable.data.details.cust_paid_amount =
          amountPaidbycustomer;
        if (currentTable.data.details.bill_number) {
          updateOrderDataRequest({
            order_id: currentTable.data.details.bill_number,
            cust_paid_amount: amountPaidbycustomer,
          });
        }

        $('#swalfastApplyamountbutton')
          .val('Applied')
          .addClass('success-button');
        setTimeout(() => {
          $('#swalfastApplyamountbutton')
            .val('Apply')
            .removeClass('success-button');
        }, 900);
      });
      $('#swalfastRemoveamountbutton').on('click', async () => {
        window.currentTable.data.details.cust_paid_amount = billTotal;
        if (currentTable.data.details.bill_number) {
          updateOrderDataRequest({
            order_id: currentTable.data.details.bill_number,
            cust_paid_amount: billTotal,
          });
        }

        $('#swalfastRemoveamountbutton').addClass('error-button');
        setTimeout(() => {
          $('#swalfastRemoveamountbutton').removeClass('error-button');
        }, 900);
      });
    },
    preConfirm: () => {},
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

async function showLoader({ title, text, event, args }) {
  Swal.fire({
    title,
    text,
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      if (event) event(args);
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      container: 'show-loader-container-class',
    },
  });
}

async function askForreload(text, forkds) {
  const result = await Swal.fire({
    title: forkds || $.i18n.t('common:reloadMessage.Settings'),
    text: text || $.i18n.t('common:reloadMessage.pleaseRefreshTheWindow'),
    width: '23em',
    confirmButtonText: $.i18n.t('common:reloadMessage.reloadNow'),
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    cancelButtonText: $.i18n.t('common:reloadMessage.noIWillDoItLater'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });
  if (result.value && window.remote) {
    window.ipcRenderer.send(RELOAD_APP, { name: 'main' });
  }
}

setTimeout(initialize, 1000);

module.exports = {
  askForreload,
  showfastsettleWinow,
  sendEbill,
  askforOTP,
  sendCustomersinfotodboy,
  getLivestatusdata,
  askforCoversbeforetakingorder,
  // addoreditCustomerdetails,
  showLoader,
  askforOTP,
};
