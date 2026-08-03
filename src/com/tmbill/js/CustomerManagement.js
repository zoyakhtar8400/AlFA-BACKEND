/* eslint-disable camelcase */
/* eslint-disable func-names */

require('./Exporttojsonworker');

const { initAccesslevelsformasters } = require('./AccesslevelManager');
const { showLoader } = require('../util/MiscUtil');
const { ORDER_IPC } = require('../util/IPC_Messages');
const {
  initializei18nforCustomermastermgmtwindowui,
} = require('./i18nController');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
const { reAddCustomerRequest } = require('../renderer/helper/Customer.helper');
const { COUNTRY_CODES } = require('../util/CountryCodes');
const { SALUTATIONS, CUSTOMER_TYPE } = require('../util/Constants');

const language = {
  url: `../locales/${$.i18n.language}/datatable.json`,
};

window.customermgmtscriptLoaded = true;

function refreshCustomerstable() {
  $('#customermgmtDattable').DataTable().clear().draw();
  $('#customermgmtDattable').DataTable().rows.add(window.customersList);
  $('#customermgmtDattable').DataTable().columns.adjust().draw();
  initAccesslevelsformasters();
}
window.refreshCustomermgmttable = function () {
  refreshCustomerstable();
};
function findCustomerByPhone(phone) {
  if (!phone || !Array.isArray(window.customersList)) return null;
  return window.customersList.find((c) => String(c.phone) === String(phone));
}

function oncustomerEdit(data) {
  if (!data || !data.phone) {
    console.error('CRM edit: phone missing');
    return;
  }

  console.log('CRM edit opening customer form for', data.phone);

  window.__isCustomerFormOpenedFromCRM = true;

  window.__crmEditPhone = String(data.phone);
  window.__crmEditName = data.name || '';
  window.__crmEditOpenTabIndex = 1;

  $('#openCustomerbtn').trigger('click');
}

async function initializeTable(list) {
  $('#customermgmtDattable').DataTable({
    data: list,
    scrollY: '65vh',
    scrollX: true,
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    bAutoWidth: false,
    ordering: false,
    paging: true,
    autoWidth: false,
    fixedColumns: true,
    deferRender: true,
    order: [[1, 'asc']],
    language,
    columns: [
      { title: $.i18n.t('tables:customerFormTableHeading.srNo'), data: 'srno' },
      {
        title: $.i18n.t('tables:customerFormTableHeading.name'),
        data: 'name',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.Mobile'),
        data: 'phone',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.Mail'),
        data: 'email',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.City'),
        data: 'city',
        defaultContent: '',
      },
      // {
      //   title: $.i18n.t('tables:customerFormTableHeading.birthDate'),
      //   data: 'dob',
      //   defaultContent: '',
      // },
      {
        title: $.i18n.t('tables:customerFormTableHeading.address1'),
        data: 'address_line1',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.address2'),
        data: 'address_line2',
        defaultContent: '',
      },
      { title: '  ', data: 'address_line2', defaultContent: '' },
    ],
    columnDefs: [
      {
        targets: 0,
        render(data, type, full, meta) {
          if (meta.row < list.length) {
            list[meta.row].srno = meta.row + 1;
          }
          return meta.row + 1;
        },
      },

      {
        // Name
        targets: 1,
        render(data, type) {
          if (!data) return '';
          if ((type === 'display' || type === 'type') && data.length > 18) {
            return data.substring(0, 20) + '...';
          }
          return data;
        },
      },

      {
        // ✅ Mail + City (CENTER + 132px)
        targets: [3, 4],
        className: 'dt-center',
        width: '132px',
      },

      {
        // Address 1
        targets: 5,
        render(data, type) {
          if (!data) return '';
          if ((type === 'display' || type === 'type') && data.length > 18) {
            return data.substring(0, 18) + '...';
          }
          return data;
        },
      },

      {
        // Address 2
        targets: 6,
        render(data, type) {
          if (!data) return '';
          if ((type === 'display' || type === 'type') && data.length > 18) {
            return data.substring(0, 18) + '...';
          }
          return data;
        },
      },
    ],

    // eslint-disable-next-line no-unused-vars
    createdRow(row, data, index) {
      $('td', row)
        .last()
        .empty()
        .addClass('edit-icon-on-left')
        .click(() => {
          window.__crmEditCustomerData = data;
          console.log('edit ', data);
          $('#customermgmtDattable tbody tr').removeClass('selectedbillRow');
          $(row).addClass('selectedbillRow');
          oncustomerEdit(data);
        });
    },
  });

  $('#customermgmtDattable_filter').hide();
  $('#searchCustomermgmtid').keyup(function () {
    $('#customermgmtDattable').DataTable().search($(this).val()).draw();
  });
}

function clearFields() {
  $('#mgmt_customergstid').val('');
  $('#mgmt_customeradharid').val('');
  $('#mgmt_customerpanid').val('');
  $('#mgmt_customerfssaiid').val('');
  $('#mgmt_customercityid').val('');
  $('#mgmt_customerstateid').val('');
  $('#mgmt_customerPincodeid').val('');
  $('#mgmt_customerbusinessid').val('');
  $('#mgmt_customerdescid').val('');
  $('#mgmt_customernameId').val('');
  $('#mgmt_customermobileid').val('');
  $('#mgmt_customermaild').val('');
  $('#mgmt_customeradd1id').val('');
  $('#mgmt_customerCommentid').val('');
  $('#mgmt_customerSalutationId').val('-1');
  $('#mgmt_customerUserTypeId').val('-1');

  $('#addCustomermgmtbutton').html('Add');
  $('#mgmt_customerFormDialCodeId').val(window.dial_code);
  $('#mgmt_customerFormAlternateDialCodeId').val(window.dial_code);
}

/**
 * Add new customer
 */
async function addCustomer() {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerManagement.noInternetConnection'),
    );
    return;
  }
  const name = $('#mgmt_customernameId').val();
  const phone = $('#mgmt_customermobileid').val();
  const dial_code = $('#mgmt_customerFormDialCodeId option:selected').val();
  const email = $('#mgmt_customermaild').val();
  const addressLine1 = $('#mgmt_customeradd1id').val();
  const addressLine2 = $('#mgmt_customeradd2id').val();
  const city = $('#mgmt_customercityid').val();
  const state = $('#mgmt_customerstateid').val();
  const pincode = $('#mgmt_customerPincodeid').val();
  const businessName = $('#mgmt_customerbusinessid').val();
  const description = $('#mgmt_customerdescid').val();
  const fssai = $('#mgmt_customerfssaiid').val();
  const panno = $('#mgmt_customerpanid').val();
  const adhar = $('#mgmt_customeradharid').val();
  const gstno = $('#mgmt_customergstid').val();
  const alternate_dial_code = $(
    '#mgmt_customerFormAlternateDialCodeId option:selected',
  ).val();
  const alternate_phone = $('#mgmt_customeralternatemobileid').val();
  const salutation = $('#mgmt_customerSalutationId option:selected').val();
  const cust_type = $('#mgmt_customerUserTypeId option:selected').val();
  const comment = $('#mgmt_customerCommentid').val();

  // validations
  if (name) {
    if (name.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Namelengthshouldbelessthanhundredcharacter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(name)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Specialcharactersnotallowedinnames',
        ),
      );
      return;
    }
  }

  if (businessName) {
    if (businessName.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Businessnamelengthshouldbelessthanfiftycharacter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(businessName)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Specialcharactersarenotallowed',
        ),
      );
      return;
    }
  }

  if (addressLine1) {
    if (addressLine1.length > 200) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Addresslengthshouldbelessthantwohundredchracter',
        ),
      );
      return;
    }

    // if (window.specialCharRegex.test(address_line1)) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t(
    //       'controller:loginControllerNotifications.PleaseentervalidAddress',
    //     ),
    //   );
    //   return;
    // }
  }

  if (addressLine2) {
    if (addressLine2.length > 200) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Addresslengthshouldbelessthantwohundredchracter',
        ),
      );
      return;
    }

    // if (window.specialCharRegex.test(address_line2)) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t(
    //       'controller:loginControllerNotifications.PleaseentervalidAddress',
    //     ),
    //   );
    //   return;
    // }
  }

  if (phone) {
    if (phone.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Mobilenumbershouldbelessthanfifteendigit',
        ),
      );
      return;
    }

    if (Number.isNaN(phone)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:walletmanagementNotifications.Pleaseentervalidmobilenumber',
        ),
      );
      return;
    }
  }

  if (email) {
    if (email.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Emaillengthshouldbelessthanfifty',
        ),
      );
      return;
    }

    if (!window.emailRegex.test(email)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Pleaseentervalidemail',
        ),
      );
      return;
    }
  }

  if (city) {
    if (city.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Citylengthshouldbelessthan50',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(city) ||
      window.onlyNumberRegex.test(city)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.PleaseentervalidcityName',
        ),
      );
      return;
    }
  }

  if (state) {
    if (state.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Statelengthshouldbelessthanhundred',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(state) ||
      window.onlyNumberRegex.test(state)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:customerNotifications.PleaseentervalidstateName'),
      );
      return;
    }
  }

  if (pincode) {
    if (pincode.length > 6 || pincode.length < 6) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:customerNotifications.Pincodeshouldbeofsixdigit'),
      );
      return;
    }

    if (Number.isNaN(pincode)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:customerNotifications.Pleaseentervalidpincode'),
      );
      return;
    }
  }

  if (gstno) {
    if (gstno.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.GSTnumbershouldbelessthanfifteenchracter',
        ),
      );
      return;
    }

    if (window.allspecialCharRegex.test(gstno)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Specialcharactersnotallowedingstnumber',
        ),
      );
      return;
    }
  }

  if (panno) {
    if (panno.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.PANnumbershouldbelessthanfifteendigit',
        ),
      );
      return;
    }

    if (window.allspecialCharRegex.test(panno)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:customerNotifications.PleaseentervalidPANnumber'),
      );
      return;
    }
  }

  if (adhar) {
    if (adhar.length > 12) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.AADHARnumbershouldbelessthanfifteendigit',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(adhar) ||
      !window.onlyNumberRegex.test(adhar)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.PleaseentervalidAADHARnumber',
        ),
      );
      return;
    }
  }

  if (fssai) {
    if (fssai.length > 14) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Fssainumbershouldbelessthanfourteendigit',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(fssai) ||
      !window.onlyNumberRegex.test(fssai)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Pleaseentervalidfssainumber',
        ),
      );
      return;
    }
  }
  if (description) {
    if (description.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Descriptionlengthshouldbelessthanhundredchracter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(description)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Pleaseentervaliddescription',
        ),
      );
      return;
    }
  }

  const currentTime = window.moment().format('HH:mm:ss');
  const currentDate = $('#mgmt_customercreatedDate')
    .data('daterangepicker')
    .startDate.format('YYYY-MM-DD');
  const createdDate = `${currentDate} ${currentTime}`;
  if (name && phone) {
    const customerDetails = {
      name,
      phone,
      dial_code,
      email: $('#mgmt_customermaild').val(),
      store_id: window.storeDetails.store_id,
      address_line1: $('#mgmt_customeradd1id').val(),
      address_line2: $('#mgmt_customeradd2id').val(),
      city: $('#mgmt_customercityid').val(),
      state,
      pincode,
      business_name: $('#mgmt_customerbusinessid').val(),
      description: $('#mgmt_customerdescid').val(),
      fssai: $('#mgmt_customerfssaiid').val(),
      panno: $('#mgmt_customerpanid').val(),
      adhar: $('#mgmt_customeradharid').val(),
      gstno: $('#mgmt_customergstid').val(),
      dob: $('#mgmt_customerdobId')
        .data('daterangepicker')
        .startDate.format('YYYY-MM-DD'),
      anniversary: $('#mgmt_customerannivid')
        .data('daterangepicker')
        .startDate.format('YYYY-MM-DD'),
      alternate_dial_code,
      alternate_phone,
      salutation,
      cust_type,
      comment,
      createdDate,
    };

    if ($('#addCustomermgmtbutton').html() === 'Update') {
      customerDetails.id = $('#addCustomermgmtbutton').attr('customer-id');
    }
    if ($('#createcustomerWalletcheck2').is(':checked')) {
      customerDetails.createWallet = true;
    }

    window.sendCustomerandaddtoListenerfromremote(customerDetails, false);
    clearFields();
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerManagement.starredFieldsAreRequired'),
    );
  }
}

async function openFilechooser() {
  $('#hiddenFileimport').trigger('click');
}

/**
 * Exports the data
 */
async function exportCustomers() {
  try {
    if (window.customersList && window.customersList.length > 0) {
      const data = window.customersList.map((el) => {
        const o = { ...el };
        delete o.store_id;
        return o;
      });
      window.json2excel({
        data,
        name: `Customers-${window.moment().format('YYYY-MM-DD')}`,
      });
    }
  } catch (e) {
    console.log(e);
  }
}

/**
 * Send's the customer to channel
 * @param {Cusotmer data} customers
 */
async function sendCustomers(customers) {
  try {
    const postData = {
      list: customers,
      store_id: window.storeDetails.store_id,
    };
    const result = await apiCall.post(
      window.Config.links.addCustomerbulk,
      postData,
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (result && result.status === '200') {
      reAddCustomerRequest();
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:customerManagement.customersImportedSuccessfully'),
      );
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:customerManagement.importFailed'),
      );
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Send's the customers by chunks
 * @param {Customers} customers
 */
async function sendCustomersbychunks(customers) {
  let startIndex;
  let endIndex;
  let temparray;
  const chunk = 500;
  showLoader({
    title: $.i18n.t('controller:customerManagement.importingCustomer'),
    text: $.i18n.t('controller:customerManagement.pleaseWait'),
  });
  for (
    startIndex = 0, endIndex = customers.length;
    startIndex < endIndex;
    startIndex += chunk
  ) {
    temparray = customers.slice(startIndex, startIndex + chunk);
    const postData = {
      list: temparray,
      store_id: window.storeDetails.store_id,
    };

    try {
      apiCall
        .post(window.Config.links.addCustomerbulk, postData, {
          headers: getHeadersformposforrender(),
        })
        .catch((e) => {
          console.error(e);
        });
    } catch (error) {
      console.error(error);
    }
  }
  if (window.Swal.isVisible()) window.Swal.close();
  reAddCustomerRequest();
  window.notifyUser.showMessage(
    'success',
    $.i18n.t('controller:customerManagement.customersImportedSuccessfully'),
  );
}

async function importCustomer(event) {
  const selectedFile = event.target.files[0];
  if (!selectedFile) {
    return;
  }
  // convert excel file to json
  const fileReader = new FileReader();
  fileReader.onload = function (cevent) {
    const data = cevent.target.result;
    const workbook = window.XLSX.read(data, {
      type: 'binary',
      cellDates: true,
    });
    workbook.SheetNames.forEach((sheet) => {
      const rowObject = window.XLSX.utils.sheet_to_row_object_array(
        workbook.Sheets[sheet],
        { dateNF: 'YYYY-MM-DD' },
      );
      const customers = rowObject;

      if (customers.length > 0) {
        if (customers.length > 500) {
          sendCustomersbychunks(customers);
        } else {
          sendCustomers(customers);
        }
      }
    });
  };
  fileReader.readAsBinaryString(selectedFile);
}
function addDialCodes() {
  $('#mgmt_customerFormDialCodeId option').remove();
  $('#mgmt_customerFormAlternateDialCodeId option').remove();
  COUNTRY_CODES.forEach((country) => {
    // if (!String(type).includes('Digital Order')) {
    if (country) {
      $('<option>')
        .val(country.dial_code)
        .text(`${country.name}  +${country.dial_code}`)
        .appendTo('#mgmt_customerFormDialCodeId');

      $('<option>')
        .val(country.dial_code)
        .text(`${country.name}  +${country.dial_code}`)
        .appendTo('#mgmt_customerFormAlternateDialCodeId');
    }
    // }
  });
}

function initialize() {
  $('#gobacktomenumangemtfromitemview, #gobackfromcustomermanagement')
    .off('click.crmBack')
    .on('click.crmBack', function (e) {
      e.preventDefault();
      e.stopPropagation();

      console.log('CRM back clicked');

      $('#menuManagementwindowWrapperid').show();

      $('#crmwindowWrapperid').hide();
    });

  $('#openaddcustomerModal')
    .off('click')
    .on('click', () => {
      if (typeof openCustomerForm === 'function') {
        openCustomerForm({ tabIndex: 0, source: 'crm' });
        return;
      }

      const $btn = $('#openCustomerbtn');
      if ($btn.length) {
        $btn.click();
        return;
      }

      console.error(
        'openCustomerForm not found and #openCustomerbtn not present.',
      );
    });

  $('#addCustomermgmtbutton').on('click', () => {
    $(this).html('Add');
    addCustomer();
  });

  $('#importCustomersbutton').on('click', () => {
    openFilechooser();
  });
  $('#hiddenFileimport').on('change', (event) => {
    importCustomer(event);
  });
  $('#exportCustomersbutton').on('click', () => {
    exportCustomers();
  });
  $('#refreshcustomermgmtButton').on('click', () => {
    refreshCustomerstable();
  });

  console.log('window.moment().year()', window.moment().year());
  // $(
  //   '#mgmt_customerdobId,#mgmt_customerannivid, #mgmt_customercreatedDate',
  // ).daterangepicker({
  //   timePicker: false,
  //   singleDatePicker: true,
  //   showDropdowns: true,
  //   maxYear: window.moment().year(),
  //   minYear: 1950,
  //   startDate: window.moment(),
  //   autoUpdateInput: true,
  //   locale: {
  //     format: 'YYYY-MM-DD',
  //   },
  // });

  $(
    '#mgmt_customerdobId, #mgmt_customerannivid, #mgmt_customercreatedDate',
  ).daterangepicker(
    {
      singleDatePicker: true,
      showDropdowns: true,
      minYear: 1950,
      maxYear: parseInt(moment().format('YYYY'), 10),
      startDate: moment().format('YYYY-MM-DD'), // formatted string, not raw moment object
      autoUpdateInput: true,
      locale: {
        format: 'YYYY-MM-DD',
      },
    },
    function (start, end, label) {
      // Make sure it updates correctly
      $(this.element).val(start.format('YYYY-MM-DD'));
    },
  );
  // $(
  //   '#mgmt_customerdobId, #mgmt_customerannivid, #mgmt_customercreatedDate',
  // ).daterangepicker({
  //   autoUpdateInput: false,
  //   singleDatePicker: true,
  //   locale: {
  //     cancelLabel: 'Clear',
  //   },
  // });

  $('#oldkotModal').on('hidden.bs.modal', () => {
    clearFields();
  });

  initializeTable(window.customersList);
  initAccesslevelsformasters();

  $('#addCusomermodalid').on('hidden.bs.modal', () => {
    $('#customermgmtDattable tbody tr').removeClass('selectedbillRow');
    clearFields();

    window.__crmEditPhone = null;
    window.__crmEditName = null;
    window.__crmEditCustomerData = null;
    window.__crmEditOpenTabIndex = null;
    window.__isCustomerFormOpenedFromCRM = false;

    console.log('CRM globals cleared');
  });

  if ($.i18n) {
    initializei18nforCustomermastermgmtwindowui();
  } else {
    setTimeout(initializei18nforCustomermastermgmtwindowui, 400);
  }

  addDialCodes();
  $('#mgmt_customerFormDialCodeId').val(window.dial_code);
  $('#mgmt_customerFormAlternateDialCodeId').val(window.dial_code);

  $('#mgmt_customerSalutationId option:gt(0)').remove();
  $('#mgmt_customerUserTypeId option:gt(0)').remove();

  SALUTATIONS.forEach((salutation) => {
    // if (!String(type).includes('Digital Order')) {
    if (salutation) {
      $('<option>')
        .val(salutation.value)
        .text(`${salutation.title}`)
        .appendTo('#mgmt_customerSalutationId');
    }
    // }
  });

  CUSTOMER_TYPE.forEach((salutation) => {
    if (salutation) {
      $('<option>')
        .val(salutation.value)
        .text(`${salutation.title}`)
        .appendTo('#mgmt_customerUserTypeId');
    }
  });

  const crmWrapper = $('#crmwindowWrapperid');

  const crmObserver = new MutationObserver(function () {
    if (crmWrapper.is(':visible')) {
      try {
        const table = $('#customermgmtDattable').DataTable();
        $('#searchCustomermgmtid').val('');
        table.search('');
        table.page('first').draw('page');
      } catch (err) {
        console.warn('CRM pagination reset failed', err);
      }
    }
  });

  if (crmWrapper.length) {
    crmObserver.observe(crmWrapper[0], {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }
}
initialize();
