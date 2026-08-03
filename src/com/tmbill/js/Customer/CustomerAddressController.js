/* eslint-disable camelcase */
const { default: Swal } = require('sweetalert2');
const { debounce } = require('lodash');
const { apiCall } = require('../../services/APIService');
const {
  makeUpdateCustomerAddressRequest,
} = require('../../renderer/helper/Order.helper');
const {
  addOrUpdateCustomerRequest,
} = require('../../renderer/helper/Customer.helper');
const {
  TAKEAWAY_TAB_ID,
  DINEIN_TAB_ID,
  DELIVERY_TAB_ID,
  QUICK_TAB_ID,
} = require('../../util/Constants');
const { CUSTOMER_LOADER } = require('../RawButtons');
const { initalizei18nforcustomeraddress } = require('../i18nController');
const { showLoader } = require('../CommonUtils');

window.customerAddressscriptLoaded = true;
let currentCustomerPhone = null;
let updateAddressData = {};
let savedCustAddress = '';
let isUpdateCustomerSwalVisible = false;
let mobileNumber;
let location = '';
let addresses = [];
let lastAddressFetchToken = null;

function getFreshCustomerPhone() {
  if (window.__crmEditPhone) return String(window.__crmEditPhone);
  const modalPhone = $('#modal_customerPhoneid').val();
  if (modalPhone) return String(modalPhone);
  const swalPhone = $('#swal_customerPhoneid').val();
  if (swalPhone) return String(swalPhone);

  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        return ($('#kotcustomermobileField').val() || '') + '';
      case TAKEAWAY_TAB_ID:
        return ($('#takeawaykotcustomermobileField').val() || '') + '';
      case DELIVERY_TAB_ID:
        return ($('#deliverykotcustomermobileField').val() || '') + '';
      case QUICK_TAB_ID:
        return ($('#quickbillkotcustomermobileField').val() || '') + '';
      default:
        break;
    }
  }

  if (currentCustomerPhone) return String(currentCustomerPhone);
  const formPhone = $('#customeFormmobileid').val();
  if (formPhone) return String(formPhone);

  return '';
}

function showCustomerAddresses(addressList) {
  addresses = Array.isArray(addressList) ? [...addressList] : [];
  $('#addressContainer').empty();
  let html = '';
  addresses.forEach((addr, index) => {
    const addrId = addr.id != null ? String(addr.id) : `noid-${index}`;
    const custPhone = addr.customer_phone ? String(addr.customer_phone) : '';
    html += `
      <div class="custaddr-card" data-index="${index}" data-id="${addrId}" data-customer-phone="${custPhone}">
        <div class="custaddr-main">
          <div class="custaddr-left">
            <div class="custaddr-icon">
              <i class="fa fa-building"></i>
            </div>
            <div class="custaddr-text">
              <div class="custaddr-name">${addr.label || ''}</div>
              <div class="custaddr-desc">${addr.manual_address || ''}</div>
            </div>
          </div>
          <div class="custaddr-right">
            <button class="custaddr-btn-icon address-btn-edit" aria-label="Edit" data-id="${addrId}">
              <i class="fa fa-pencil"></i>
            </button>
            <button class="custaddr-btn-icon address-btn-delete" aria-label="Delete" data-id="${addrId}">
              <i class="fa fa-trash"></i>
            </button>
            <button class="custaddr-btn-deliver" data-id="${addrId}">
              ${$.i18n.t('controller:orderController.Deliverhere')}
            </button>
          </div>
        </div>
      </div>
    `;
  });
  $('#addressContainer').html(html);

  $('.address-btn-edit')
    .off('click')
    .on('click', function () {
      const id = String($(this).attr('data-id'));
      const addr = addresses.find((a) => String(a.id) === id);
      if (!addr) {
        console.warn('Edit clicked but address not found for id', id);
        return;
      }
      editcustomerAddress(addr);
    });

  $('.address-btn-delete')
    .off('click')
    .on('click', function () {
      const id = String($(this).attr('data-id'));
      const addr = addresses.find((a) => String(a.id) === id);
      if (!addr) {
        console.warn('Delete clicked but address not found for id', id);
        return;
      }
      deleteCustomerAddress(addr);
    });

  $('.custaddr-btn-deliver')
    .off('click')
    .on('click', function () {
      const id = String($(this).attr('data-id'));
      const address = addresses.find((a) => String(a.id) === id);
      if (!address) {
        console.warn('Deliver clicked but address not found for id', id);
        return;
      }
      const custAddress = `${address?.manual_address || ''}${address.location ? `, ${address.location}` : ''}${address.area ? `, ${address.area}` : ''}${address.block ? `, ${address.block}` : ''}${address.street ? `, ${address.street}` : ''}${address.lane ? `, ${address.lane}` : ''}${address.building ? `, ${address.building}` : ''}${address.flat ? `, ${address.flat}` : ''}${address.floor ? `, ${address.floor}` : ''}${address.landmark ? `, ${address.landmark}` : ''}${address.label ? `, ${address.label}` : ''}`;
      addSelectedAddrToCurrentOrder(custAddress, address);
    });
}

// function showCustomerAddresses(addresses) {
//   $('#selectedaddresslabel').show();
//   $('#customerAddressDatadivid').empty();
//   if (addresses.length === 5) {
//     $('#maxaddresswarningid').show();
//   } else {
//     $('#maxaddresswarningid').hide();
//   }
//   const updateCustomerSwalVisible = $(
//     '.tmbill-swal-add-customer-container-class',
//   ).is(':visible');

//   let savedCustomerAddress;
//   const activeTab = $('.mainsectionTabs li a.active').attr('id');
//   if (activeTab) {
//     switch (activeTab) {
//       case DINEIN_TAB_ID:
//         savedCustomerAddress = $('#kotcustomeraddressField').val();
//         break;
//       case TAKEAWAY_TAB_ID:
//         savedCustomerAddress = $('#takotcustomeraddressField').val();
//         break;
//       case DELIVERY_TAB_ID:
//         savedCustomerAddress = $('#deliverykotcustomeraddressField').val();
//         break;
//       case QUICK_TAB_ID:
//         savedCustomerAddress = $('#quickkotcustomeraddressField').val();
//         break;
//       default:
//         break;
//     }
//   }

//   if (updateCustomerSwalVisible) {
//     // eslint-disable-next-line no-unused-vars
//     savedCustomerAddress = $('#modal_customeraddressid').val();
//   }

//   const addresscontainer = $('<div>');
//   addresses.map((address) => {
//     let labelicon = $('<i>', {
//       class: 'fa fa-map-marker iconlabel',
//     });

//     switch (address.label) {
//       case 'home':
//         labelicon = $('<i>', {
//           class: 'fa fa-home iconlabel',
//         });
//         break;

//       case 'Office':
//         labelicon = $('<i>', {
//           class: 'fas fa-building iconlabel',
//         });
//         break;

//       case 'Other':
//         labelicon = $('<i>', {
//           class: 'fa fa-map-marker iconlabel',
//         });
//         break;

//       default:
//         labelicon = $('<i>', {
//           class: 'fa fa-map-marker iconlabel',
//         });
//         break;
//     }
//     // const custAddress = `${address.manual_address},${address.floor},${address.landmark}`;
//     const custAddress = `${address.manual_address}, ${address.location ? `${address.location},` : ''} ${address.area ? `${address.area},` : ''} ${address.block ? `${address.block},` : ''} ${address.street ? `${address.street},` : ''} ${address.lane ? `${address.lane},` : ''} ${address.building ? `${address.building},` : ''} ${address.flat ? `${address.flat},` : ''} ${address.floor ? `${address.floor},` : ''} ${address.landmark ? `${address.landmark},` : ''} ${address.label ? `${address.label}` : ''}`;

//     const addrContainer = $('<div>', {
//       class: 'card',
//     });

//     const addr = $('<div>', {
//       // html: cust_address,
//       class: 'card-body address-card-body',
//     });
//     addr.css({ width: '99%' });

//     const addressLabel = $('<div>', {
//       html: custAddress,
//     });

//     const locationlabel = $('<div>', {
//       html: address.label,
//       class: 'location-label-class',
//     });
//     locationlabel.prepend(labelicon);
//     // if (cust_address == saved_customer_address) {
//     //   let default_address = $('<span>', {
//     //     html: 'Default',
//     //   });
//     //   location.append(default_address);
//     // }

//     addr.prepend(locationlabel);
//     addr.append(addressLabel);

//     addrContainer.css({
//       margin: '6px',
//     });

//     const selectAddressButton = $('<button>', {
//       class: 'btn btn-outline-success selectaddressbutton',
//       html: $.i18n.t('customerAddress.Deliverhere'),
//     }).click(() => {
//       // eslint-disable-next-line no-use-before-define
//       addSelectedAddrToCurrentOrder(custAddress, address);
//     });
//     addr.append(selectAddressButton);

//     // edit delete address
//     const updateDiv = $('<div>', {
//       class: 'update-address-class',
//     });

// const editAddressIcon = $('<i>', {
//   class: ' fa fa-edit editaddressicon',
// }).click(() => {
//   // eslint-disable-next-line no-use-before-define
//   editcustomerAddress(address);
// });

//     const deleteAddressIcon = $('<i>', {
//       class: 'fa fa-trash-o deleteaddressicon',
//     }).click(() => {
//       // eslint-disable-next-line no-use-before-define
//       deleteCustomerAddress(address);
//     });
//     updateDiv.append(editAddressIcon);
//     updateDiv.append(deleteAddressIcon);

//     addr.append(updateDiv);
//     addrContainer.append(addr);
//     addresscontainer.append(addrContainer);
//     return undefined;
//   });
//   $('#customerAddressDatadivid').append(addresscontainer);
// }

async function sendDeleteAddressRequest(address) {
  const postData = {
    store_id: window.storeDetails.store_id,
    phone: address.customer_phone,
    address_id: address.id,
  };
  const updateCustomerVisible = $(
    '.tmbill-swal-add-customer-container-class',
  ).is(':visible');
  if (!updateCustomerVisible) {
    showLoader({
      title: 'Deleting address',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
  }

  const { data } = await apiCall.delete(window.Config.links.customeraddress, {
    data: postData,
    headers: {
      machine_id: window.MACHINE_ID,
    },
  });

  if (data && data.status === 200) {
    $('#customerFormModal').modal('toggle');
    if (!updateCustomerVisible) {
      Swal.close();
      window.notifyUser.showMessage('success', data.message);
    }

    if (
      data.customer &&
      data.customer.address &&
      data.customer.address.length
    ) {
      const filterdAddress = data.customer.address.filter(
        (item) => item.id !== address.id,
      );

      showCustomerAddresses(filterdAddress);

      const custAddress = `${address.manual_address},${address.floor},${address.landmark}`;

      if (custAddress === savedCustAddress && isUpdateCustomerSwalVisible) {
        savedCustAddress = '';
        isUpdateCustomerSwalVisible = false;
        const activeTab = $('.mainsectionTabs li a.active').attr('id');
        let custName = '';
        if (activeTab) {
          switch (activeTab) {
            case DINEIN_TAB_ID:
              custName = $('#kotcustomernameField').val();
              break;
            case TAKEAWAY_TAB_ID:
              custName = $('#takeawaykotcustomernameField').val();
              break;
            case DELIVERY_TAB_ID:
              custName = $('#deliverykotcustomernameField').val();
              break;
            case QUICK_TAB_ID:
              custName = $('#quickbillkotcustomernameField').val();
              break;
            default:
              break;
          }
        }
        const customer = {
          name: custName,
          phone: address.customer_phone,
          store_id: window.storeDetails.store_id,
          address_line1: '',
        };
        const tableId = window.globalcurrenttableId.replace('table_', '');
        const miscData = {
          order_id: '',
          table_id: tableId,
        };
        // eslint-disable-next-line no-use-before-define
        initUpdateCustomerAddress({ customer, miscData }).then((result) => {
          if (result) {
            const clicktableId = `table_${tableId}`;
            const table = $(`#${clicktableId}`);
            if (table) {
              $(table).click();
            }
          }
        });
      } else if (custAddress === savedCustAddress) {
        const activeTab = $('.mainsectionTabs li a.active').attr('id');
        if (activeTab) {
          switch (activeTab) {
            case DINEIN_TAB_ID:
              $('#kotcustomernameField').val('');
              break;
            case TAKEAWAY_TAB_ID:
              $('#takeawaykotcustomernameField').val('');
              break;
            case DELIVERY_TAB_ID:
              $('#deliverykotcustomernameField').val('');
              break;
            case QUICK_TAB_ID:
              $('#quickbillkotcustomernameField').val('');
              break;
            default:
              break;
          }
        }
      }
    }
  } else {
    savedCustAddress = '';
    isUpdateCustomerSwalVisible = false;
    Swal.close();
  }
}

function addSelectedAddrToCurrentOrder(custAddress, address) {
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        $('#kotcustomeraddressField').val(custAddress);
        window.addresschangeHandlerfordineinFromRemote(custAddress, address);
        break;
      case TAKEAWAY_TAB_ID:
        $('#takotcustomeraddressField').val(custAddress);
        window.addresschangeHandlerFromRemote(custAddress, address);
        break;
      case DELIVERY_TAB_ID:
        $('#deliverykotcustomeraddressField').val(custAddress);
        window.addresschangeHandlerforDeliveryFromRemote(custAddress, address);
        break;
      case QUICK_TAB_ID:
        $('#quickkotcustomeraddressField').val(custAddress);
        window.addresschangeHandlerforquickbillFromRemote(custAddress, address);
        break;
      default:
        break;
    }
  }

  // update address locally
  const customer = window.customersList.find(
    (c) => c.phone === address.customer_phone,
  );

  if (customer) {
    const customerAddress = `${customer.location} ${customer.area} ${customer.block} ${customer.street} ${customer.lane} ${customer.floor} ${customer.flat} ${customer.landmark} ${customer.building}`;
    const deliveryAddress = `${address.location} ${address.area} ${address.block} ${address.street} ${address.lane} ${address.floor} ${address.flat} ${address.landmark} ${address.building}`;

    if (customerAddress !== deliveryAddress) {
      // update customer in database
      Object.assign(address, {
        phone: address.customer_phone,
        sync_flag: 0,
        store_id: window.storeDetails.store_id,
      });

      addOrUpdateCustomerRequest({
        customer: address,
      });
      // initUpdateCustomerAddress({
      //   customer: address,
      // });
    }
  }

  $('#modal_customeraddressid').val(custAddress);
  //   window.notifyUser.showMessage('success', 'Address selected');
  $('#customerFormModal').modal('toggle');
}

function editcustomerAddress(address) {
  $('#customerAddressinputWrapperdivid').show();
  $('#customeradderesscontainerid').hide();

  $('#customerCompleteAddressid').val(address.manual_address);
  $('#customerLocationid').val(address.building);
  $('#customerLandmarkid').val(address.landmark);

  $('#customerlocationid').val(address.location);
  $('#customerareaid').val(address.area);
  $('#customerblockid').val(address.block);
  $('#customerStreetid').val(address.street);
  $('#customerLaneid').val(address.lane);
  $('#customerFlatid').val(address.flat);
  $('#customerFloorid').val(address.floor);
  $('#customerAddresspincodeInputId').val(address.pincode);

  $('#editCustomerAddress').show();
  $('#createNewCustomerAddress').hide();
  $('#showaddcustoerAddressForm').prop('checked', true);

  updateAddressData = address;
  const label =
    address.label.charAt(0).toUpperCase() +
    address.label.slice(1).toLowerCase();
  $('.location-label').removeClass('active');
  $(`[data-label=${label}]`).addClass('active');

  location = address.label;
}
async function deleteCustomerAddress(address) {
  savedCustAddress = $('#modal_customeraddressid').val();
  isUpdateCustomerSwalVisible = $(
    '.tmbill-swal-add-customer-container-class',
  ).is(':visible');
  const deleteAddressConfirmation = await Swal.fire({
    title: $.i18n.t('controller:swalDataTranslations.Doyouwanttodeleteaddress'),
    showConfirmButton: true,
    showCancelButton: true,
    width: '23em',
    allowOutsideClick: true,
    allowEscapeKey: false,
    confirmButtonText: $.i18n.t('controller:orderController.Yes'),
    cancelButtonText: $.i18n.t('controller:orderController.Cancel'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      content: 'tmbill-swal-title-class',
      input: 'tmbill-swal-input2',
      container: 'delete-address-confirmation',
    },
  });

  if (deleteAddressConfirmation && deleteAddressConfirmation.isConfirmed) {
    sendDeleteAddressRequest(address);
  }
}
async function fetchCustomerAddress({ cust_mobile, cust_name, store_id } = {}) {
  $('#addressContainer').empty();
  const requestedPhone = cust_mobile || getFreshCustomerPhone();
  mobileNumber = requestedPhone;
  addresses = [];
  const thisFetchToken = Symbol('addrFetch');
  lastAddressFetchToken = thisFetchToken;
  $(`#customerAddressDatadivid`).append($(CUSTOMER_LOADER));
  if (!mobileNumber && $('#addOrEditCustomerModal').is(':visible')) {
    mobileNumber = $('#modal_customerPhoneid').val();
  }
  showLoader({
    title: $.i18n.t('controller:orderController.FetchingAddresses'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });
  try {
    const { data } = await apiCall.post(
      window.Config.links.getCustomerProfile,
      {
        store_id: window.storeDetails.store_id,
        phone: mobileNumber,
      },
      {
        headers: {
          machine_id: window.MACHINE_ID,
        },
      },
    );
    if (lastAddressFetchToken !== thisFetchToken) {
      console.warn('Ignored stale address response for', requestedPhone);
      return;
    }
    window.Swal.close();
    if (
      data &&
      data.status === 200 &&
      data.custinfo &&
      Array.isArray(data.custinfo.address)
    ) {
const customerLevelAddress = data.custinfo.address_line1 || '';

addresses = (data.custinfo.address || []).map((addr) => ({
  ...addr,
  manual_address:
    addr.manual_address ||
    customerLevelAddress ||
    '',
}));

showCustomerAddresses(addresses);
    } else {
      window.Swal.close();
      const addressNotFound = $('<p>', {
        html: $.i18n.t('customerAddress.AddressnotaddedPleaseaddaddress'),
      });
      $('#customerAddressDatadivid').empty();
      $('#customerAddressDatadivid').append(addressNotFound);
    }
  } catch (error) {
    if (lastAddressFetchToken !== thisFetchToken) {
      console.warn('Ignored stale error response for', requestedPhone, error);
      return;
    }
    window.Swal.close();
    console.error(error);
  } finally {
    initializeCustomerAddress();
    initalizei18nforcustomeraddress();
  }
}

async function initUpdateCustomerAddress(addressData) {
  try {
    const response = await makeUpdateCustomerAddressRequest(addressData);
    return response;
  } catch (error) {
    console.log(
      `Message="Error while getting next kot and bill number" `,
      error,
    );
  }
  return undefined;
}

function resetCustomerAddressUI() {
  $('#customerCompleteAddressid').val('');
  $('#customerLocationid').val('');
  $('#customerLandmarkid').val('');
  $('#customerlocationid').val('');
  $('#customerareaid').val('');
  $('#customerblockid').val('');
  $('#customerStreetid').val('');
  $('#customerLaneid').val('');
  $('#customerFlatid').val('');
  $('#customerFloorid').val('');
  $('#customerAddresspincodeInputId').val('');

  $('#editCustomerAddress').hide();
  $('#createNewCustomerAddress').show();
  //   $('#selectedaddresslabel').hide();

  updateAddressData = undefined;
  location = undefined;
}

async function sendUpdateCustomerAddressRequest() {
  // const completeAddress = $('#customerCompleteAddressid').val().trim();
  // const buildingName = $('#customerLocationid').val().trim();
  // const landmark = $('#customerLandmarkid').val().trim();

  // const custLocation = $('#customerlocationid').val().trim();
  // const area = $('#customerareaid').val().trim();
  // const block = $('#customerblockid').val().trim();
  // const street = $('#customerStreetid').val().trim();
  // const lane = $('#customerLaneid').val().trim();
  // const flat = $('#customerFlatid').val().trim();
  // const floor = $('#customerFloorid').val().trim();
  const completeAddress = $('#customerCompleteAddressid').val();
  const buildingName = $('#customerLocationid').val();
  const landmark = $('#customerLandmarkid').val();

  const custLocation = $('#customerlocationid').val();
  const area = $('#customerareaid').val();
  const block = $('#customerblockid').val();
  const street = $('#customerStreetid').val();
  const lane = $('#customerLaneid').val();
  const flat = $('#customerFlatid').val();
  const floor = $('#customerFloorid').val();
  const pincode = $('#customerAddresspincodeInputId').val();

  if (window.customerAddressFieldSettings.area === 2 && !area) {
    window.notifyUser.showMessage('error', 'Please add area');
    return;
  }
  if (window.customerAddressFieldSettings.lane === 2 && !lane) {
    window.notifyUser.showMessage('error', 'Please add lane');
    return;
  }
  if (window.customerAddressFieldSettings.block === 2 && !block) {
    window.notifyUser.showMessage('error', 'Please add block');
    return;
  }
  if (window.customerAddressFieldSettings.floor === 2 && !floor) {
    window.notifyUser.showMessage('error', 'Please add floor');
    return;
  }
  if (window.customerAddressFieldSettings.street === 2 && !street) {
    window.notifyUser.showMessage('error', 'Please add street');
    return;
  }
  if (window.customerAddressFieldSettings.location_label === 2 && !location) {
    // window.customerAddressFieldSettings.location_label === 2 &&
    window.notifyUser.showMessage('error', 'Please add location');
    return;
  }
  if (window.customerAddressFieldSettings.pincode_zipcode === 2 && !pincode) {
    window.notifyUser.showMessage('error', 'Please add pincode');
    return;
  }
  if (window.customerAddressFieldSettings.flat_apartment_no === 2 && !flat) {
    window.notifyUser.showMessage('error', 'Please add flat');
    return;
  }

  if (
    window.customerAddressFieldSettings.complete_address === 2 &&
    !completeAddress
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddcompleteaddress',
      ),
    );
    return;
  }

  if (
    window.customerAddressFieldSettings.building_tower === 2 &&
    !buildingName
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddbuildingtower',
      ),
    );
    return;
  }

  if (window.customerAddressFieldSettings.landmark === 2 && !landmark) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerAddressNotifications.Pleaseaddlandmark'),
    );
    return;
  }

  if (window.customerAddressFieldSettings.location === 2 && !custLocation) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseselectlocationlabel',
      ),
    );
    return;
  }
  // add length validation
  if (completeAddress.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.CompleteaddressshouldbelessthanEightycharacter',
      ),
    );
    return;
  }

  if (buildingName.length > 40) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.BuildingTowershouldbelessthancharacter',
      ),
    );
    return;
  }

  if (landmark.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Landmarkshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (custLocation.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Location should be less than 80 characters',
    );
    return;
  }
  if (area.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Location should be less than 80 characters',
    );
    return;
  }
  if (block.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Block should be less than 80 characters',
    );
    return;
  }
  if (street.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Street should be less than 80 characters',
    );
    return;
  }
  if (lane.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Lane should be less than 80 characters',
    );
    return;
  }
  if (flat.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Flat should be less than 80 characters',
    );
    return;
  }

  if (floor.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Floor should be less than 80 characters',
    );
    return;
  }

  if (window.customerAddressFieldSettings.pincode_zipcode === 2 && !pincode) {
    window.notifyUser.showMessage('error', 'Please add pincode');
    return;
  }

  if (!location) {
    location = 'home';
  }

  const mobileNumber =
    (updateAddressData && updateAddressData.customer_phone) ||
    getFreshCustomerPhone();

  const cusomerAddress = {
    manual_address: completeAddress,
    google_address: completeAddress,
    customer_phone: mobileNumber,
    landmark,
    building: buildingName,
    label: location,
    latitude: 0,
    longitude: 0,
    id: updateAddressData.id,
    area,
    location: custLocation,
    block,
    street,
    lane,
    flat,
    floor,
    pincode,
  };

  const postData = {
    store_id: window.storeDetails.store_id,
    phone: mobileNumber,
    action: 'update',
    address: cusomerAddress,
  };

  const updateCustomerVisible = $(
    '.tmbill-swal-add-customer-container-class',
  ).is(':visible');
  if (!updateCustomerVisible) {
    showLoader({
      title: 'Updating address',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
  }

  const { data } = await apiCall.post(
    window.Config.links.customeraddress,
    postData,
    {
      headers: {
        machine_id: window.MACHINE_ID,
      },
    },
  );

  if (!updateCustomerVisible && data) {
    Swal.close();
  }
  if (data && data.status === 200) {
    if (!updateCustomerVisible) {
      window.notifyUser.showMessage('success', data.message);
    }
    // window.notifyUser.showMessage('success', data.message);
    // const filterdAddress = data.customer.address.filter(
    //   (item) => item.id !== updateAddressData.id,
    // );
    // filterdAddress.push(cusomerAddress);
    // showCustomerAddresses(filterdAddress);
    setTimeout(() => {
      fetchCustomerAddress({ cust_mobile: mobileNumber });
    }, 500);
    resetCustomerAddressUI();
    $('#customerAddressinputWrapperdivid').hide();
    $('#customeradderesscontainerid').show();
    $('#showaddcustoerAddressForm').prop('checked', false);
  } else {
    Swal.close();
  }
}

async function createNewCustomerAddress() {
  // const completeAddress = $('#customerCompleteAddressid').val().trim();
  // const buildingName = $('#customerLocationid').val().trim();
  // const landmark = $('#customerLandmarkid').val().trim();

  // const custLocation = $('#customerlocationid').val().trim();
  // const area = $('#customerareaid').val().trim();
  // const block = $('#customerblockid').val().trim();
  // const street = $('#customerStreetid').val().trim();
  // const lane = $('#customerLaneid').val().trim();
  // const flat = $('#customerFlatid').val().trim();
  // const floor = $('#customerFloorid').val().trim();

  const completeAddress = $('#customerCompleteAddressid').val();
  const buildingName = $('#customerLocationid').val();
  const landmark = $('#customerLandmarkid').val();

  const custLocation = $('#customerlocationid').val();
  const area = $('#customerareaid').val();
  const block = $('#customerblockid').val();
  const street = $('#customerStreetid').val();
  const lane = $('#customerLaneid').val();
  const flat = $('#customerFlatid').val();
  const floor = $('#customerFloorid').val();
  const pincode = $('#customerAddresspincodeInputId').val();

  let mobileNumber = getFreshCustomerPhone();

  if (!mobileNumber && currentCustomerPhone) {
    mobileNumber = currentCustomerPhone;
  }

  if (window.customerAddressFieldSettings.area === 2 && !area) {
    window.notifyUser.showMessage('error', 'Please add area');
    return;
  }
  if (window.customerAddressFieldSettings.lane === 2 && !lane) {
    window.notifyUser.showMessage('error', 'Please add lane');
    return;
  }
  if (window.customerAddressFieldSettings.block === 2 && !block) {
    window.notifyUser.showMessage('error', 'Please add block');
    return;
  }
  if (window.customerAddressFieldSettings.floor === 2 && !floor) {
    window.notifyUser.showMessage('error', 'Please add floor');
    return;
  }
  if (window.customerAddressFieldSettings.street === 2 && !street) {
    window.notifyUser.showMessage('error', 'Please add street');
    return;
  }
  if (window.customerAddressFieldSettings.location_label === 2 && !location) {
    // window.customerAddressFieldSettings.location_label === 2 &&
    window.notifyUser.showMessage('error', 'Please add location');
    return;
  }
  if (window.customerAddressFieldSettings.pincode_zipcode === 2 && !pincode) {
    window.notifyUser.showMessage('error', 'Please add pincode');
    return;
  }
  if (window.customerAddressFieldSettings.flat_apartment_no === 2 && !flat) {
    window.notifyUser.showMessage('error', 'Please add flat');
    return;
  }

  if (
    window.customerAddressFieldSettings.complete_address === 2 &&
    !completeAddress
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddcompleteaddress',
      ),
    );
    return;
  }

  if (
    window.customerAddressFieldSettings.building_tower === 2 &&
    !buildingName
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddbuildingtower',
      ),
    );
    return;
  }

  if (window.customerAddressFieldSettings.landmark === 2 && !landmark) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerAddressNotifications.Pleaseaddlandmark'),
    );
    return;
  }

  if (window.customerAddressFieldSettings.location === 2 && !custLocation) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseselectlocationlabel',
      ),
    );
    return;
  }

  // add length validation
  if (completeAddress.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.CompleteaddressshouldbelessthanEightycharacter',
      ),
    );
    return;
  }

  if (buildingName.length > 40) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.BuildingTowershouldbelessthancharacter',
      ),
    );
    return;
  }

  if (landmark.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Landmarkshouldbelessthancharacter',
      ),
    );
    return;
  }

  if (custLocation.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Location should be less than 80 characters',
    );
    return;
  }
  if (area.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Location should be less than 80 characters',
    );
    return;
  }
  if (block.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Block should be less than 80 characters',
    );
    return;
  }
  if (street.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Street should be less than 80 characters',
    );
    return;
  }
  if (lane.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Lane should be less than 80 characters',
    );
    return;
  }
  if (flat.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Flat should be less than 80 characters',
    );
    return;
  }

  if (floor.length > 80) {
    window.notifyUser.showMessage(
      'error',
      'Floor should be less than 80 characters',
    );
    return;
  }

  if (!location) {
    location = 'home';
  }

  const address = {
    manual_address: completeAddress,
    google_address: completeAddress,
    customer_phone: mobileNumber,
    landmark,
    building: buildingName,
    label: location,
    latitude: 0,
    longitude: 0,
    area,
    location: custLocation,
    block,
    street,
    lane,
    flat,
    floor,
    pincode,
  };

  const postData = {
    store_id: window.storeDetails.store_id,
    phone: mobileNumber,
    action: 'create',
    address,
  };

  const updateCustomerVisible = $(
    '.tmbill-swal-add-customer-container-class',
  ).is(':visible');
  if (!updateCustomerVisible) {
    showLoader({
      title: 'Creating new address',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
  }

  try {
    console.groupEnd();

    const { data } = await apiCall.post(
      window.Config.links.customeraddress,
      postData,
      {
        headers: {
          machine_id: window.MACHINE_ID,
        },
      },
    );

    if (data && data.status === 200) {
  Swal.close();
  let safeAddresses = [];

  if (data?.customer?.address.length) {
   safeAddresses = data.customer.address.map((addr, index) => {
  if (!addr.id) {
    return {
      ...addr,
      id: `temp_${addr.customer_phone || 'no_phone'}_${index}`
    };
  }
  return addr;
});
  } else {
    if (!address.id) {
  address.id = `temp_${address.customer_phone || 'no_phone'}_0`;
}
    safeAddresses = [address];
  }

  showCustomerAddresses(safeAddresses);

      resetCustomerAddressUI();
      $('#customerAddressinputWrapperdivid').hide();
      $('#customeradderesscontainerid').show();
      $('#showaddcustoerAddressForm').prop('checked', false);
      if (!updateCustomerVisible) {
        Swal.close();
        window.notifyUser.showMessage('success', data.message);
      }
    } else {
      Swal.close();
      window.notifyUser.showMessage('error', data.message);
    }
  } catch (error) {
    Swal.close();
    console.error(error);
  }

  Swal.close();
}

function toggleFormvisibility() {
  const status = $('#showaddcustoerAddressForm').is(':checked');
  if (status) {
    $('#customerAddressinputWrapperdivid').show();
    $('#editCustomerAddress').hide();
    $('#createNewCustomerAddress').show();
    $('#customeradderesscontainerid').hide();

    resetCustomerAddressUI();
  } else {
    $('#customerAddressinputWrapperdivid').hide();
    $('#customeradderesscontainerid').show();
  }
}

$('#customerFormModal').on('shown.bs.modal', () => {
  addresses = [];
  $('#customerAddressDatadivid').empty();
  $('#customerAddressinputWrapperdivid').hide();
  $('#showaddcustoerAddressForm').prop('checked', false);
  $('#customeradderesscontainerid').show();
  resetCustomerAddressUI();
  currentCustomerPhone =
    window.__crmEditPhone || window.__crmEditCustomerData?.phone || null;

  fetchCustomerAddress();
});
$('#customerFormModal').on('hidden.bs.modal', () => {
  addresses = [];
  updateAddressData = {};
  currentCustomerPhone = null;
});

function initializeCustomerAddress() {
  $('#showaddcustoerAddressForm')
    .off('click')
    .on('click', () => {
      toggleFormvisibility();
    });

  $('#homelocatiobuttonid')
    .off('click')
    .on('click', () => {
      location = 'home';
    });

  $('#officelocationbuttonid')
    .off('click')
    .on('click', () => {
      location = 'Office';
    });

  $('#otherlocationbuttionid')
    .off('click')
    .on('click', () => {
      location = 'Other';
    });

  $('#createNewCustomerAddress')
    .off('click')
    .on(
      'click',
      debounce(() => {
        createNewCustomerAddress();
      }, 200),
    );

  $('#editCustomerAddress')
    .off('click')
    .on('click', () => {
      sendUpdateCustomerAddressRequest();
    });
}
// initializeCustomerAddress();
// initalizei18nforcustomeraddress();

module.exports = {
  fetchCustomerAddress,
};
