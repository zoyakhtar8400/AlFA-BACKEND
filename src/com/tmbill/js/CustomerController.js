// CustomerController.js
/* eslint-disable camelcase */
const { SALUTATIONS, CUSTOMER_TYPE } = require('../util/Constants');
const { COUNTRY_CODES } = require('../util/CountryCodes');
const { initializei18nforCustomermgmtwindowui } = require('./i18nController');

window.customerscriptLoaded = true;

function addDialCodes() {
  $('#customerFormDialCodeId option').remove();
  $('#customerFormalternateDialCodeId option').remove();

  COUNTRY_CODES.forEach((country) => {
    // if (!String(type).includes('Digital Order')) {
    if (country) {
      $('<option>')
        .val(country.dial_code)
        .text(`${country.name}  +${country.dial_code}`)
        .appendTo('#customerFormDialCodeId');

      $('<option>')
        .val(country.dial_code)
        .text(`${country.name}  +${country.dial_code}`)
        .appendTo('#customerFormalternateDialCodeId');
    }
    // }
  });
}
function getCustomerByPhone(phone) {
  if (!phone || !Array.isArray(window.customersList)) return null;
  return window.customersList.find((c) => String(c.phone) === String(phone));
}

function InitializeCustomer() {
  $('#submitcustomerForm').on('click', (event) => {
    addnewCustomer();
  });

  $('#customerModal').on('hidden.bs.modal', function () {
    $(this).find('input:text').val('');
  });

  $('#showaddcustoerForm').on('click', (event) => {
    toggleFormvisibility();
  });

  $('#refreshCustomersbutton').on('click', (event) => {
    refreshCustomerstable();
  });

  $('#inputWrapperdivid').hide();
  toggleFormvisibility();
  initalizeCustomerstable(window.customersList);

  if ($.i18n) {
    initializei18nforCustomermgmtwindowui();
  } else {
    setTimeout(initializei18nforCustomermgmtwindowui, 400);
  }
  addDialCodes();
  $('#customerFormDialCodeId').val(window.dial_code);
  $('#customerFormalternateDialCodeId').val(window.dial_code);

  $('#customerFormSalutationId option:gt(0)').remove();
  $('#customerFormCustTypeId option:gt(0)').remove();

  SALUTATIONS.forEach((salutation) => {
    // if (!String(type).includes('Digital Order')) {
    if (salutation) {
      $('<option>')
        .val(salutation.value)
        .text(`${salutation.title}`)
        .appendTo('#customerFormSalutationId');
    }
    // }
  });

  CUSTOMER_TYPE.forEach((salutation) => {
    // if (!String(type).includes('Digital Order')) {
    if (salutation) {
      $('<option>')
        .val(salutation.value)
        .text(`${salutation.title}`)
        .appendTo('#customerFormCustTypeId');
    }
    // }
  });

  if (window.storeDetails.country !== 'India') {
    $('#customeFormfssaiid').hide();
    $('#customeFormpanid').hide();
    $('#customeFormadharid').hide();
  }
}

function toggleFormvisibility() {
  const status = $('#showaddcustoerForm').is(':checked');
  if (status) {
    $('#inputWrapperdivid').show();
    $('#customerDatadivid').css('height', '26vh');
  } else {
    $('#inputWrapperdivid').hide();
    $('#customerDatadivid').css('height', '67vh');
  }
}

// ensure there are no conflicting click handlers
$('#addMoreToggle').off('click');

// If your HTML already has data-bs-toggle/data-bs-target you can skip the attr() lines
$('#addMoreToggle').attr({
  'data-bs-toggle': 'collapse',
  'data-bs-target': '#businessFields',
  'aria-controls': 'businessFields',
  role: 'button',
});

// set initial label based on current state
function setAddMoreLabel(isExpanded) {
  $('#addMoreToggle .add-more-label').text(
    isExpanded ? 'Show less' : 'Add more',
  );
}
setAddMoreLabel($('#businessFields').hasClass('show'));

// update on collapse events (Bootstrap 5 events)
$('#businessFields').on('shown.bs.collapse', function () {
  setAddMoreLabel(true);
});
$('#businessFields').on('hidden.bs.collapse', function () {
  setAddMoreLabel(false);
});

async function initalizeCustomerstable(customerList) {
  $('#customersTableid').DataTable({
    data: customerList,
    ordering: false,
    searching: true,
    // scrollY: 150,
    scrollY: '42vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    deferRender: true,
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    order: [[1, 'asc']],
    columns: [
      { title: $.i18n.t('tables:customerFormTableHeading.srNo'), data: 'srno' },
      { title: $.i18n.t('tables:customerFormTableHeading.name'), data: 'name' },
      {
        title: $.i18n.t('tables:customerFormTableHeading.COUNTRYCODE'),
        data: 'dial_code',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.Mobile'),
        data: 'phone',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.Mail'),
        data: 'email',
        defaultContent: '',
      },
      { title: $.i18n.t('tables:customerFormTableHeading.City'), data: 'city' },
      {
        title: $.i18n.t('tables:customerFormTableHeading.address1'),
        data: 'address_line1',
      },
      {
        title: $.i18n.t('tables:customerFormTableHeading.address2'),
        data: 'address_line2',
      },
    ],
    columnDefs: [
      {
        render(data, type, full, meta) {
          if (meta.row < customerList.length) {
            customerList[meta.row].srno = meta.row + 1;
          }
          return meta.row + 1; // adds id to serial no
        },
        targets: 0,
      },
    ],
    createdRow(row, data, index) {},
  });

  // $("#customeFormbirthld,#customeFormannivid, #custCreatedDate").daterangepicker({
  //     timePicker: false,
  //     singleDatePicker: true,
  //     startDate: moment(),
  //     locale: {
  //         format: 'YYYY-MM-DD'
  //     }
  // });

  $('#custCreatedDate').daterangepicker({
    timePicker: false,
    singleDatePicker: true,
    startDate: moment(),
    locale: {
      format: 'YYYY-MM-DD',
    },
  });

  $('#customeFormbirthld,#customeFormannivid').daterangepicker({
    autoUpdateInput: false,
    singleDatePicker: true,
    locale: {
      cancelLabel: 'Clear',
    },
  });

  $('#customeFormbirthld,#customeFormannivid').on(
    'apply.daterangepicker',
    function (ev, picker) {
      // timePicker: false,
      // singleDatePicker: true,
      // startDate: moment(),
      // locale: {
      //     format: 'YYYY-MM-DD'
      // }
      $(this).val(picker.startDate.format('YYYY-MM-DD'));
    },
  );

  $('#customersTableid tbody').on('click', 'tr', function () {
    const data = $('#customersTableid').DataTable().row(this).data();
    try {
      $('#customerModalbodyid').data(data);
      $('#customerModal').modal('toggle');
    } catch (error) {}
  });
}

/**
 * Add's new customer
 */
async function addnewCustomer() {
  const name = $('#customeFormnameid').val();
  const phone = $('#customeFormmobileid').val();
  const email = $('#customeFormmaild').val();
  const address_line1 = $('#customeFormadd1id').val();
  const address_line2 = $('#customeFormadd2id').val();
  const city = $('#customeFormcityid').val();
  const state = $('#customeFormStateid').val();
  const pincode = $('#customeFormPincodeid').val();
  const business_name = $('#customeFormbusinessid').val();
  const description = $('#customeFormdescid').val();
  const fssai = $('#customeFormfssaiid').val();
  const panno = $('#customeFormpanid').val();
  const adhar = $('#customeFormadharid').val();
  const gstno = $('#customeFormgstid').val();
  const dial_code = $('#customerFormDialCodeId option:selected').val();
  const salutation = $('#customerFormSalutationId option:selected').val();
  const alternate_dial_code = $(
    '#customerFormalternateDialCodeId option:selected',
  ).val();
  const alternate_phone = $('#customeFormalternatemobileid').val();

  const cust_type = $('#customerFormCustTypeId option:selected').val();

  const comment = $('#customeFormCommentid').val();

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
          'controller:customerNotifications.Specialcharactersarenotallowedincustomername',
        ),
      );
      return;
    }
  }

  if (business_name) {
    if (business_name.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Businessnamelengthshouldbelessthanhundredcharacter',
        ),
      );
      return;
    }

    if (window.allspecialCharRegex.test(business_name)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Specialcharactersarenotallowedinbusinessname',
        ),
      );
      return;
    }
  }

  if (address_line1) {
    if (address_line1.length > 200) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Addresslengthshouldbelessthantwohundredcharacter',
        ),
      );
      return;
    }

    // if (window.specialCharRegex.test(address_line1)) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t('controller:customerNotifications.Pleaseentervalidaddress'),
    //   );
    //   return;
    // }
  }

  if (address_line2) {
    if (address_line2.length > 200) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Addressline2lengthshouldbelessthantwohundredcharacter',
        ),
      );
      return;
    }

    // if (window.specialCharRegex.test(address_line2)) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t('controller:customerNotifications.Pleaseentervalidaddress'),
    //   );
    //   return;
    // }
  }

  if (phone) {
    if (phone.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Mobilenumbershouldbelessthanfifteendigit',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(phone) ||
      !window.onlyNumberRegex.test(phone)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Pleaseentervalidmobilenumber',
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
          'controller:customerNotifications.Emaillengthshouldbelessthanfifty',
        ),
      );
      return;
    }

    if (!window.emailRegex.test(email)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:customerNotifications.Pleaseentervalidemail'),
      );
      return;
    }
  }

  if (city) {
    if (city.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:customerNotifications.Citylengthshouldbelessthanhundred',
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
        $.i18n.t('controller:customerNotifications.PleaseentervalidcityName'),
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

    if (isNaN(pincode)) {
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
          'controller:customerNotifications.FASSAInumbershouldbelessthanfifteendigit',
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

  const current_time = moment().format('HH:mm:ss');
  const current_date = $('#custCreatedDate')
    .data('daterangepicker')
    .startDate.format('YYYY-MM-DD');
  const createdDate = `${current_date} ${current_time}`;

  if (name && phone) {
    $('#customerloaderIcon').show();
    const customerDetails = {
      name,
      dial_code: Number(dial_code),
      phone,
      email,
      store_id: window.storeDetails.store_id,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      business_name,
      description,
      fssai,
      panno,
      adhar,
      gstno,
      // dob: $('#customeFormbirthld').data('daterangepicker').startDate.format('YYYY-MM-DD'),
      // anniversary: $('#customeFormannivid').data('daterangepicker').startDate.format('YYYY-MM-DD'),
      dob: $('#customeFormbirthld').val() || null,
      anniversary: $('#customeFormannivid').val() || null,
      salutation,
      alternate_dial_code,
      alternate_phone,
      cust_type,
      comment,
      createdDate,
    };
    if ($('#createcustomerWalletcheck').is(':checked')) {
      customerDetails.createWallet = true;
    }

    const existingCustomer = getCustomerByPhone(phone);

    if (existingCustomer && !window.__isCustomerFormOpenedFromCRM) {
      window.notifyUser.showMessage(
        'error',
        'Customer with this mobile number already exists',
      );
      $('#customerloaderIcon').hide();
      return;
    }

    if (existingCustomer) {
      customerDetails.id = existingCustomer.id;
    }

    window.sendCustomerandaddtoListenerfromremote(customerDetails, false);

    resetFields();
    $('#customerloaderIcon').hide();
    $('#customerModal').modal('hide');
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerController.starredFieldsAreRequired'),
    );
  }
}

function refreshCustomerstable() {
  $('#customersTableid').DataTable().clear().draw();
  $('#customersTableid').DataTable().rows.add(window.customersList);
  $('#customersTableid').DataTable().columns.adjust().draw();
}
window.remoterefreshCustomerstable = function () {
  refreshCustomerstable();
};

function resetFields() {
  $('#customeFormadd1id').val('');
  $('#customeFormadd2id').val('');
  $('#customeFormcityid').val('');
  $('#customeFormStateid').val('');
  $('#customeFormbusinessid').val('');
  $('#customeFormdescid').val('');
  $('#customeFormfssaiid').val('');
  $('#customeFormpanid').val('');
  $('#customeFormadharid').val('');
  $('#customeFormgstid').val('');
  $('#customeFormalternatemobileid').val('');
  $('#customeFormCommentid').val('');
  $('#customeFormalternatemobileid').val('');
  $('#customerFormDialCodeId').val(window.dial_code);
  $('#customerFormalternateDialCodeId').val(window.dial_code);
  $('#customerFormSalutationId').val('-1');
  $('#customerFormCustTypeId').val('-1');
}
function InitializeCustomer() {
  $('#submitcustomerForm').on('click', (event) => {
    addnewCustomer();
  });

  $('#customerModal').on('hidden.bs.modal', function () {
    $(this).find('input:text').val('');
  });

  $('#showaddcustoerForm').on('click', (event) => {
    toggleFormvisibility();
  });

  $('#refreshCustomersbutton').on('click', (event) => {
    refreshCustomerstable();
  });

  console.log(
    'Loading initial customer table with',
    window.customersList?.length,
    'records',
  );
  initalizeCustomerstable(window.customersList);

  addDialCodes();
}
// async function addnewCustomer() {
//   const name = $('#customeFormnameid').val();
//   const phone = $('#customeFormmobileid').val();
//   console.log(' Captured name:', name, 'phone:', phone);

//   // (after validations pass)
//   console.log('Validations passed, preparing customer object');

//   const current_time = moment().format('HH:mm:ss');
//   const current_date = $('#custCreatedDate')
//     .data('daterangepicker')
//     .startDate.format('YYYY-MM-DD');
//   const createdDate = `${current_date} ${current_time}`;

//   const customerDetails = {
//     name,
//     phone,
//   };
//   console.log('Customer details object:', customerDetails);

//   window.sendCustomerandaddtoListenerfromremote(customerDetails, false);
//   console.log(' Sent to backend listener');

//   resetFields();
//   console.log(' Form fields reset');

//   $('#customerloaderIcon').hide();
//   $('#customerModal').modal('hide');
//   console.log(' Customer modal closed');
// }

InitializeCustomer();
