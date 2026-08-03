// CustomerDetails.js
let isDirty = false;
function getCustomerByPhone(phone) {
  if (!phone || !Array.isArray(window.customersList)) return null;
  return window.customersList.find((c) => String(c.phone) === String(phone));
}

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
  $('#customerFormSalutationId').val('Salutation');
  $('#customerFormCustTypeId').val('Select Customer Type');
  $('.form-grid input, .form-grid textarea').val('');
  $('.tag-container span').remove();
  $('#customerLoyaltyPointsId').val(0);
  $('#customerDuePaymentsId').val(0);
  $('#customerWalletId').val(0);
}

/* eslint-disable camelcase */
/**
 * Add's new customer
 */
async function addnewCustomer({ id }) {
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
  const salutation = $(
    '#customerFormSalutationId option:selected:not([disabled])',
  ).val();
  const alternate_dial_code = $(
    '#customerFormalternateDialCodeId option:selected',
  ).val();
  const alternate_phone = $('#customerFormalternateMobileId').val();

  const cust_type = $(
    '#customerFormCustTypeId option:selected:not([disabled])',
  ).val();

  const comment = $('#customeFormCommentid').val();
  // const customTags = $('#customTagsInputId').val();
  const customTags = $('.tag-container .tag')
    .map(function () {
      return $(this).text().replace('x', '').trim();
    })
    .get();

  const allPhones = [];
  if (phone) {
    allPhones.push(phone);
  }

  if (alternate_phone) {
    allPhones.push(alternate_phone);
  }
  let phoneData = [];
  $('.alt-phone-block').each(function () {
    const countryCode = $(this).find('.country-code-dropdown').val();
    const phoneNumber = $(this).find('.phone-input').val().trim();

    if (phoneNumber) {
      phoneData.push({
        alternate_dial_code: countryCode,
        alternate_phone: phoneNumber,
      });
      allPhones.push(phoneNumber);
    }
  });
  const hasDuplicates = new Set(allPhones).size !== allPhones.length;
  if (hasDuplicates) {
    window.notifyUser.showMessage(
      'error',
      'Duplicate phone numbers not allowed',
    );
    phoneData = [];
    return;
  }

  const extra_details = {
    extraPhones: phoneData,
    tags: customTags,
  };

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
        'Address  length should be less than 200 character',
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
  //   const current_date = $('#custCreatedDate')
  //     .data('daterangepicker')
  //     .startDate.format('YYYY-MM-DD');
  //   const createdDate = `${current_date} ${current_time}`;

  if (name && phone) {
    $('#customerloaderIcon').show();
    const existingCustomer = getCustomerByPhone(phone);

    if (!id && existingCustomer) {
      window.notifyUser.showMessage(
        'error',
        'Customer with this mobile number already exists',
      );
      $('#customerloaderIcon').hide();
      return;
    }

    const customerDetails = {
      id,
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
      extra_details,
      //   createdDate,
    };
    if ($('#createcustomerWalletcheck').is(':checked')) {
      customerDetails.createWallet = true;
    }

    window.sendCustomerandaddtoListenerfromremote(customerDetails, false);
    resetFields();
    isDirty = false;
    $('#customerloaderIcon').hide();
    $('#customerFormModal').modal('hide');
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerController.starredFieldsAreRequired'),
    );
  }
}

function addCustomerFormEvents() {
  const tags = [];

  // $('#customTagsInputId')
  //   .off('keypress')
  //   .on('keypress', function (e) {
  //     // if (e.which === 13 || e.which === 44) {
  //     //   // Enter or comma
  //     //   e.preventDefault();
  //     //   const tag = $(this).val().trim();

  //     //   if (tag && !tags.includes(tag)) {
  //     //     tags.push(tag);

  //     //     $(this).prepend(`
  //     //     <span class="badge bg-primary tag">
  //     //       ${tag} <span class="remove-tag" style="cursor:pointer;">&times;</span>
  //     //     </span>
  //     //   `);
  //     //   }
  //     //   $(this).val('');
  //     // }
  //     if (e.key === 'Enter') {
  //       e.preventDefault();
  //       let tagText = this.value.trim();
  //       if (tagText) {
  //         let tag = document.createElement('span');
  //         tag.className = 'badge bg-primary me-1';
  //         tag.innerHTML =
  //           tagText +
  //           ' <span class="ms-1" style="cursor:pointer;">&times;</span>';
  //         tag.querySelector('span').onclick = () => tag.remove();
  //         document.getElementById('customTagsInputId').appendChild(tag);
  //         this.value = '';
  //       }
  //     }
  //   });

  // $('#tagsInputWrapper')
  //   .off('click')
  //   .on('click', '.remove-tag', function () {
  //     const tagText = $(this).parent().text().slice(0, -1).trim();
  //     tags = tags.filter((t) => t !== tagText);
  //     $(this).parent().remove();
  //   });

  $(document).ready(() => {
    $('#customTagsInputId').on('keydown', function (e) {
      if (e.key === 'Enter' && $(this).val().trim() !== '') {
        e.preventDefault();
        const tagText = $(this).val().trim();
        const tag = $(
          `<span class="tag">${tagText}<span class="remove">x</span></span>`,
        );
        $(this).before(tag).val(''); // Add tag before input and clear input
        $(this).focus();
      }
    });

    $('#tagsInputWrapper').on('click', '.remove', function () {
      $(this).parent().remove();
      $('#customTagsInputId').focus();
    });
  });

  // $('#customerFormModal input, #customerFormModal select')
  //   .off('change keyup')
  //   .on('change keyup', () => {
  //     isDirty = true;
  //   });

  // // Before closing modal
  // $('#customerFormModal').on('hide.bs.modal', async (e) => {
  //   if (isDirty) {
  //     e.preventDefault();
  //     const unsavedConfirmation = await window.Swal.fire({
  //       title: 'Unsaved Changes',
  //       text: 'You have unsaved changes. Do you really want to close?',
  //       showConfirmButton: true,
  //       showCancelButton: true,
  //       width: '23em',
  //       allowOutsideClick: true,
  //       allowEscapeKey: false,
  //       confirmButtonText: $.i18n.t('controller:orderController.Yes'),
  //       cancelButtonText: $.i18n.t('controller:orderController.Cancel'),
  //       customClass: {
  //         popup: 'tmbill-swal-pop-up',
  //         content: 'tmbill-swal-title-class',
  //         input: 'tmbill-swal-input2',
  //       },
  //     });

  //     if (unsavedConfirmation && unsavedConfirmation.isConfirmed) {
  //       $('#customerFormModal').off('hide.bs.modal');
  //       $('#customerFormModal').modal('hide');

  //       $('#customerFormModal').on('hide.bs.modal', arguments.callee);
  //     }
  //   }
  // });
}

module.exports = {
  addnewCustomer,
  addCustomerFormEvents,
};
