// index.js
/* eslint-disable camelcase */
const { sleep } = require('../../util/MiscUtil');
const { customerAnalytics } = require('./Analytics');
const { fetchCustomerAddress } = require('./CustomerAddressController');
const { addnewCustomer, addCustomerFormEvents } = require('./CustomerDetails');
const { fetchOrderHistory } = require('./OrderHistory');
const { COUNTRY_CODES } = require('../../util/CountryCodes');
const { safeParse } = require('../../util/RendererUtils');
const { apiCall } = require('../../services/APIService');
const {
  getHeadersforchannelforrender,
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { initializei18nforCustomerForm } = require('../i18nController');

let customer_phone;
let customer_name;
let storeId;
let customer;
let customerId;

// Alternate Phone logic
let altPhoneCount = 1;
const maxAltPhones = 5;

function getCustomerModalCtx() {
  const $modal = $('.customer-modal:visible').last();
  const $tabs = $modal.find('.tab-group .tab-btn');
  const $panels = $modal.find('.customer-tab-content');
  return { $modal, $tabs, $panels };
}

async function customerFinancialSummary() {
  try {
    const response = await apiCall.post(
      window.Config.links.customerFinancialSummary,
      {
        store_id: window.storeDetails.store_id,
        tmpos_id: window.storeDetails.tmpos_id,
        phone: customer_phone,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data) {
      const financialData = response.data.data;
      if (financialData) {
        if (financialData.loyaltyPoints) {
          $('#customerLoyaltyPointsId').val(financialData.loyaltyPoints);
        }

        if (financialData.duePayments) {
          $('#customerDuePaymentsId').val(financialData.duePayments);
        }

        if (financialData.availableBalance) {
          $('#customerWalletId').val(financialData.availableBalance);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function populateCustomerDetails() {
  const isAlternateContactVisible = $('#altPhoneWrapper1').is(':visible');
  if (!isAlternateContactVisible) {
    altPhoneCount = 0;
  }
  $('#customerLoyaltyPointsId').val(0);
  $('#customerDuePaymentsId').val(0);
  $('#customerWalletId').val(0);
  if (customer && customer.phone) {
    const extra_details = safeParse(customer.extra_details);
    $('#customeFormnameid').val(customer.name);
    $('#customeFormmobileid').val(customer.phone);
    $('#customeFormmaild').val(customer.email);
    // $('#customeFormadd1id').val(customer.);
    // $('#customeFormadd2id').val(customer.);
    // $('#customeFormcityid').val(customer.);
    // $('#customeFormStateid').val(customer.);
    // $('#customeFormPincodeid').val(customer.);
    $('#customeFormbusinessid').val(customer.business_name);
    $('#customeFormdescid').val(customer.description);
    $('#customeFormfssaiid').val(customer.fssai);
    $('#customeFormpanid').val(customer.panno);
    $('#customeFormadharid').val(customer.adhar);
    $('#customeFormgstid').val(customer.gstno);
    $('#customeFormCommentid').val(customer.comment);
    if (customer.anniversary) {
      $('#customeFormannivid').val(customer.anniversary);
    }
    if (customer.dob) {
      $('#customeFormbirthld').val(customer.dob);
    }
    setTimeout(() => {
      $('#customerFormDialCodeId').val(String(customer.dial_code));
      $('#customerFormalternateDialCodeId').val(
        String(customer.alternate_dial_code),
      );
      if (customer.salutation) {
        $('#customerFormSalutationId').val(customer.salutation);
      } else {
        $('#customerFormSalutationId').val('Salutation');
      }
      if (customer.cust_type) {
        $('#customerFormCustTypeId').val(customer.cust_type);
      }

      if (
        extra_details &&
        extra_details.extraPhones &&
        extra_details.extraPhones.length
      ) {
        $('#altPhonesContainer').empty();
        $('#altPhonesContainer').show();
        const altPhonesData = extra_details.extraPhones;
        altPhonesData.forEach((item, index) => {
          // Pick the wrapper (assuming they are in order: altPhoneWrapper1, altPhoneWrapper2, etc.)
          // altPhoneCount += 1;
          $('#addAltPhone').click();
          const wrapper = $(`#altPhoneWrapper${index + 1}`);

          if (wrapper.length) {
            // Show wrapper
            wrapper.show();

            // Set dropdown value
            wrapper
              .find('.country-code-dropdown')
              .val(item.alternate_dial_code);

            // Set phone input value
            wrapper.find('.phone-input').val(item.alternate_phone);
          }
        });
      }

      if (extra_details && extra_details.tags && extra_details.tags.length) {
        $('#customerCustomTagContianer span').remove();
        const text = extra_details.tags;
        if (text.length > 0) {
          text.forEach((tag) => {
            const tagElement = `<span class="tag">${
              tag
            }<span class="remove">x</span></span>`;
            $('#customTagsInputId').before(tagElement);
          });
        }
      }
    }, 300);
    $('#customerFormalternateMobileId').val(customer.alternate_phone);
  } else {
    $('#customeFormnameid').val('');
    $('#customeFormmobileid').val('');
    $('#customeFormmaild').val('');
    // $('#customeFormadd1id').val(customer.);
    // $('#customeFormadd2id').val(customer.);
    // $('#customeFormcityid').val(customer.);
    // $('#customeFormStateid').val(customer.);
    // $('#customeFormPincodeid').val(customer.);
    $('#customeFormbusinessid').val('');
    $('#customeFormdescid').val('');
    $('#customeFormfssaiid').val('');
    $('#customeFormpanid').val('');
    $('#customeFormadharid').val('');
    $('#customeFormgstid').val('');
    $('#customeFormannivid').val('');
    $('#customeFormbirthld').val('');
    setTimeout(() => {
      $('#customerFormDialCodeId').val(window.dial_code);
      $('#customerFormalternateDialCodeId').val(window.dial_code);
      $('#customerFormSalutationId').val('Salutation');
      $('#customerFormCustTypeId').val('Select Customer Type');

      // if (
      //   extra_details &&
      //   extra_details.extraPhones &&
      //   extra_details.extraPhones.length
      // ) {
      //   $('#altPhonesContainer').show();
      //   const altPhonesData = extra_details.extraPhones;
      //   altPhonesData.forEach((item, index) => {
      //     // Pick the wrapper (assuming they are in order: altPhoneWrapper1, altPhoneWrapper2, etc.)
      //     $('#addAltPhone').click();
      //     const wrapper = $(`#altPhoneWrapper${index + 2}`);

      //     if (wrapper.length) {
      //       // Show wrapper
      //       wrapper.show();

      //       // Set dropdown value
      //       wrapper
      //         .find('.country-code-dropdown')
      //         .val(item.alternate_dial_code);

      //       // Set phone input value
      //       wrapper.find('.phone-input').val('');
      //     }
      //   });
      // }
    }, 300);
    $('#customerFormalternateMobileId').val('');
    $('.tag-container span').remove();
  }

  await customerFinancialSummary();
}

function populateCustomerAddressDetails() {
  $('#customerCompleteAddressid').val(customer.address_line1);
  $('#customerLocationid').val(customer.building);
  $('#customerLandmarkid').val(customer.landmark);

  $('#customerlocationid').val(customer.location);
  $('#customerareaid').val(customer.area);
  $('#customerblockid').val(customer.block);
  $('#customerStreetid').val(customer.street);
  $('#customerLaneid').val(customer.lane);
  $('#customerFlatid').val(customer.flat);
  $('#customerFloorid').val(customer.floor);
}

function initAddressfieldSettings() {
  if (window.customerAddressFieldSettings) {
    const settings = safeParse(window.customerAddressFieldSettings);
    if (settings.area) {
      $('#areaContinerId').show();
    }
    if (settings.lane) {
      $('#laneContinerId').show();
    }
    if (settings.block) {
      $('#blockContinerId').show();
    }
    if (settings.floor) {
      $('#floorContinerId').show();
    }
    if (settings.street) {
      $('#streetContinerId').show();
    }
    if (settings.landmark) {
      $('#landmarkContinerId').show();
    }
    if (settings.location) {
      $('#locationContainerId').show();
    }
    if (settings.building_tower) {
      $('#buildingContinerId').show();
    }
    if (settings.location_label) {
      $('#locationLabelContinerId').show();
    }
    if (settings.pincode_zipcode) {
      $('#pincodeContinerId').show();
    }
    if (settings.complete_address) {
      $('#completeAddressContinerId').show();
    }

    if (settings.flat_apartment_no) {
      $('#flatContainerId').show();
    }

    if (settings.area === 2) {
      $('#areaMadnatoryFieldId').show();
    }
    if (settings.lane === 2) {
      $('#laneMadnatoryFieldId').show();
    }
    if (settings.block === 2) {
      $('#blockMadnatoryFieldId').show();
    }
    if (settings.floor === 2) {
      $('#floorMadnatoryFieldId').show();
    }
    if (settings.street === 2) {
      $('#streetMadnatoryFieldId').show();
    }
    if (settings.landmark === 2) {
      $('#landmarkMadnatoryFieldId').show();
    }
    if (settings.location === 2) {
      $('#locationMadnatoryFieldId').show();
    }
    if (settings.building_tower === 2) {
      $('#buildingMadnatoryFieldId').show();
    }
    if (settings.location_label === 2) {
      $('#locationLabelMadnatoryFieldId').show();
    }
    if (settings.pincode_zipcode === 2) {
      $('#pincodeMadnatoryFieldId').show();
    }
    if (settings.complete_address === 2) {
      $('#completeAddressMadnatoryFieldId').show();
    }

    if (settings.flat_apartment_no === 2) {
      $('#flatMadnatoryFieldId').show();
    }
  }
}

async function fetchCustomerData(index) {
  switch (index) {
    case 0:
      populateCustomerDetails();
      populateDefaultDropdown();
      addCustomerFormEvents();
      $('#AddCustomerFormContainerId').scrollTop(0);
      break;
    case 1:
      // await fetchCustomerAddress();
      await fetchCustomerAddress({
        cust_mobile: customer_phone,
        cust_name: customer_name,
        store_id: storeId,
      });
      initAddressfieldSettings();
      // populateCustomerAddressDetails();
      break;
    case 2:
      await fetchOrderHistory({
        cust_mobile: customer_phone,
        cust_name: customer_name,
        store_id: storeId,
      });
      break;
    case 3:
      await customerAnalytics({
        mobile: String(customer_phone),
        name: customer_name,
        storeId,
      });
      break;
    default:
      break;
  }
}

function setActiveTabByIndex(index) {
  const { $tabs, $panels } = getCustomerModalCtx();
  const n = $tabs.length;
  if (!n) return;

  index = ((index % n) + n) % n; // wrap
  if ([1, 2, 3].includes(index) && !customer_phone) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('Customerform.CUSTOMER_MOBILE_NOT_ADDED'),
    );
    return;
  }

  $tabs.removeClass('active').attr('aria-selected', 'false');
  const $btn = $tabs.eq(index).addClass('active').attr('aria-selected', 'true');

  const tabId = $btn.data('tab');
  $panels.removeClass('active').attr('hidden', true);
  $(`#${tabId}`).addClass('active').removeAttr('hidden');
  if (typeof toggleModalActions === 'function') toggleModalActions(tabId);
  fetchCustomerData(index);
}

function populateDefaultDropdown() {
  $('.primary-phone-country-code-dropdown').each(function () {
    const $dropdown = $(this);
    $dropdown.empty(); // clear old options
    $.each(COUNTRY_CODES, (_, country) => {
      const selected = country.dial_code == window.dial_code ? 'selected' : '';
      $dropdown.append(
        `<option value="${country.dial_code}" ${selected}>${country.name} (+${country.dial_code})</option>`,
      );
    });
  });
}
// Populate dropdown for all selects
function populateDropdown(id) {
  const wrapper = $(id);

  if (wrapper.length) {
    // Show wrapper
    wrapper.show();

    // Set dropdown value
    wrapper.find('.country-code-dropdown').each(function () {
      const $dropdown = $(this);
      $dropdown.empty(); // clear old options
      $.each(COUNTRY_CODES, (_, country) => {
        const selected =
          country.dial_code == window.dial_code ? 'selected' : '';
        $dropdown.append(
          `<option value="${country.dial_code}" ${selected}>${country.name} (+${country.dial_code})</option>`,
        );
      });
    });
  }
  // $('.country-code-dropdown').each(function () {
  //   const $dropdown = $(this);
  //   $dropdown.empty(); // clear old options
  //   $.each(COUNTRY_CODES, (_, country) => {
  //     const selected = country.dial_code == window.dial_code ? 'selected' : '';
  //     $dropdown.append(
  //       `<option value="${country.dial_code}" ${selected}>${country.name} (+${country.dial_code})</option>`,
  //     );
  //   });
  // });
}

function initialize() {
  // Handle tab switching (click)
  $(document).on('click', '.tab-btn', function () {
    const { $tabs } = getCustomerModalCtx();
    const index = $tabs.index(this);
    setActiveTabByIndex(index);
  });

  // Reset form inputs
  $(document).on('click', '.reset-btn', () => {
    $('.form-grid input, .form-grid textarea').val('');
  });

  // Placeholder submit
  $(document).on('click', '#submitCustomerFormButtonId', () => {
    const $modal = $('.customer-modal:visible').last();
    const $tabs = $modal.find('.tab-group .active');
  });

  $(document).on('click', '#addAltPhone', () => {
    if (altPhoneCount >= maxAltPhones) return;

    altPhoneCount++;

    // Use i18n for numbered label, with count interpolation
    const altPhoneLabel = $.i18n.t('Customerform.ALTERNATE_PHONE_X', {
      count: altPhoneCount,
    });
    const altPhonePlaceholder = $.i18n.t('Customerform.ENTER_PHONE');

    const phoneBlock = `
      <div class="mb-3 alt-phone-block" id="altPhoneWrapper${altPhoneCount}">
        <label class="d-flex justify-content-between align-items-center">
          ${altPhoneLabel}
          <span class="remove-alt-phone" data-id="${altPhoneCount}" style="cursor: pointer; color: red; font-size: 18px;">&times;</span>
        </label>
        <div class="phone-row">
          <select class="country-code-box country-code-dropdown"></select>
          <input type="text" class="form-control phone-input"
                 placeholder="${altPhonePlaceholder}" />
        </div>
      </div>
    `;

    $('#altPhonesContainer').append(phoneBlock);
    populateDropdown(`#altPhoneWrapper${altPhoneCount}`);

    if (altPhoneCount >= maxAltPhones) {
      $('#addPhoneBtnWrapper').hide();
    }
  });

  $(document).on('click', '.remove-alt-phone', function () {
    const id = $(this).data('id');
    $(`#altPhoneWrapper${id}`).remove();
    altPhoneCount--;

    if (altPhoneCount < maxAltPhones) {
      $('#addPhoneBtnWrapper').show();
    }

    // Re-number remaining blocks and retranslate
    $('.alt-phone-block').each(function (index) {
      const newId = index + 1;
      $(this).attr('id', `altPhoneWrapper${newId}`);
      const altPhoneLabel = $.i18n.t('Customerform.ALTERNATE_PHONE_X', {
        count: newId,
      });
      $(this).find('label').html(`${altPhoneLabel}
            <span class="remove-alt-phone" data-id="${newId}" style="cursor: pointer; color: red; font-size: 18px;">&times;</span>`);
    });
  });

  // Expand/collapse Business section
  let isBusinessOpen = false;

  $(document).on('click', '#addMoreToggle', () => {
    isBusinessOpen = !isBusinessOpen;

    if (isBusinessOpen) {
      $('#businessFields').removeClass('d-none');
      $('.add-more-label').text($.i18n('Customerform.SHOW_LESS'));
      $('#toggleIcon').html(`
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m18 15-6-6-6 6" />
            </svg>
        `);
    } else {
      $('#businessFields').addClass('d-none');
      $('.add-more-label').text($.i18n('Customerform.ADD_MORE'));
      $('#toggleIcon').html(`
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6" />
            </svg>
        `);
    }
  });

  // ---- Utilities
  // REMOVE these lines or guard them:
  if (typeof response !== 'undefined') {
    $('#loyalty').val(`${response.loyaltyPoints} Points`);
    $('#due').val(`${response.dueAmount} AED`);
    $('#wallet').val(`${response.walletBalance} AED`);
  }

  $(document).on('keydown', (e) => {
    const $modal = $('.customer-modal:visible').last();
    if (!$modal.length) return;
    if ($('input:focus').length > 0) {
      return;
    }

    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

    e.preventDefault();

    // Get all tabs in the current modal
    const $allTabs = $modal.find('.tab-group .tab-btn');
    const $current = $allTabs.filter('.active').first();
    const n = $allTabs.length;
    if (!n) return;

    let i = $allTabs.index($current);
    if (i < 0) i = 0;

    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (((i + delta) % n) + n) % n;

    const $target = $allTabs.eq(nextIndex);

    // Ensure only one active
    $allTabs.removeClass('active').attr('aria-selected', 'false');

    // Activate new tab (reuse click logic for panels/actions)
    $target.addClass('active').attr('aria-selected', 'true').trigger('click');

    // Focus new tab
    $target.focus();
  });

  // Optional: focus the modal as soon as it appears so keyboard naturally goes there
  $(document).ready(() => {
    // your existing code...
    setTimeout(() => {
      const $m = $('.customer-modal:visible').last();
      if ($m.length) $m.attr('tabindex', '-1').focus();
    }, 0);
  });
  // ---- Location Label Active Toggle ----
  $(document).on('click', '.location-label', function () {
    // Remove active from all
    $('.location-label').removeClass('active');

    // Add active to clicked
    $(this).addClass('active');

    // Optional: store selected label in hidden input for form submission
    $('#selectedLocation').val($(this).data('label'));
  });

  $(document).on('click', '#addNewCustomerButtonId', () => {
    addnewCustomer({ id: customerId });
  });
}
initialize();
// 🔥 HARD RESET customer state on modal close
$(document).on('hidden.bs.modal', '#customerFormModal', () => {
  console.log('Customer modal closed → resetting customer state');

  customer_phone = undefined;
  customer_name = undefined;
  storeId = undefined;
  customer = undefined;
  customerId = undefined;

  window.__isCustomerFormOpenedFromCRM = false;
  // Safety: clear any leftover CRM globals
  if (window.__crmEditPhone) delete window.__crmEditPhone;
  if (window.__crmEditName) delete window.__crmEditName;
});

async function openCustomerForm({ tabIndex, cust_phone, cust_name, store_id }) {
  console.log(cust_phone);
  if (window.__crmEditPhone) {
    cust_phone = window.__crmEditPhone;
    cust_name = window.__crmEditName;
    store_id = window.storeDetails.store_id;

    if (typeof window.__crmEditOpenTabIndex === 'number') {
      tabIndex = window.__crmEditOpenTabIndex;
    }

    // delete window.__crmEditPhone;
    // delete window.__crmEditName;
    // delete window.__crmEditOpenTabIndex;
  }

  customer_phone = cust_phone;
  customer_name = cust_name;
  storeId = store_id;

  if (!window.customerFormLoaded) {
    $('#customerFormBodyid').load('Customers/customers.html', function () {
      if ($.i18n) {
        $('.customer-modal .has-i18n').localize();
      }
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('customeFormannivid').setAttribute('max', today);
      document.getElementById('customeFormbirthld').setAttribute('max', today);
    });
    $('#customerFormModal').modal('show');
    window.customerFormLoaded = true;
  } else {
    $('#customerFormModal').modal('show');
    if ($.i18n) {
      $('.customer-modal .has-i18n').localize();
    }
  }

  $('#customerFormSalutationHeadingId').html('');
  $('#customerFormNameAndNumberHeadingId').html(
    $.i18n.t('Customerform.CUSTOMER_PROFILE'),
  );

  // ✅ NOW safely find customer
  if (customer_phone) {
    customer = window.customersList.find((c) => c.phone == customer_phone);

    if (customer && customer.cust_type && isNaN(customer.cust_type)) {
      $('#customerFormSalutationHeadingId').html(customer.cust_type);
    }

    if (customer && customer.name && customer.phone) {
      $('#customerFormNameAndNumberHeadingId').html(
        `${customer.name}: ${customer.phone}`,
      );
    }

    customerId = customer ? customer.id : undefined;
  }

  await sleep(200);

  if (customer && Object.values(customer).length) {
    $('#addNewCustomerButtonId').val($.i18n.t('Customerform.UPDATE_CUSTOMER'));
  } else {
    $('#addNewCustomerButtonId').val($.i18n.t('Customerform.ADD_CUSTOMER'));
  }

  setActiveTabByIndex(tabIndex);

  if (window.storeDetails.country !== 'India') {
    $('#customerFormPanContainerId').hide();
    $('#customerFormAadharContainerId').hide();
  } else {
    $('#customerFormPanContainerId').show();
    $('#customerFormAadharContainerId').show();
  }
}

module.exports = {
  openCustomerForm,
};
