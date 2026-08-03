//CustomerAddressController2.js
const { default: Swal } = require('sweetalert2');
const { apiCall } = require('../services/APIService');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../util/Constants');
const {
  addresschangeHandlerfordinein,
  addresschangeHandlerforquickbill,
  addresschangeHandler,
  addresschangeHandlerforDelivery,
} = require('./OrderController');
const { CUSTOMER_LOADER } = require('./RawButtons');
const { showLoader } = require('./CommonUtils');
const { initalizei18nforcustomeraddress } = require('./i18nController');
const {
  makeUpdateCustomerAddressRequest,
} = require('../renderer/helper/Order.helper');
const {
  addOrUpdateCustomerRequest,
} = require('../renderer/helper/Customer.helper');
const { debounce } = require('lodash');

window.customerAddressscriptLoaded = true;
let updateAddressData = {};
let savedCustAddress = '';
let isUpdateCustomerSwalVisible = false;

let location = '';

function showCustomerAddresses(addresses) {
  $('#selectedaddresslabel').show();
  $('#customerAddressDatadivid').empty();
  if (addresses.length === 5) {
    $('#maxaddresswarningid').show();
  } else {
    $('#maxaddresswarningid').hide();
  }
  const updateCustomerSwalVisible = $(
    '.tmbill-swal-add-customer-container-class',
  ).is(':visible');

  let savedCustomerAddress;
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        savedCustomerAddress = $('#kotcustomeraddressField').val();
        break;
      case TAKEAWAY_TAB_ID:
        savedCustomerAddress = $('#takotcustomeraddressField').val();
        break;
      case DELIVERY_TAB_ID:
        savedCustomerAddress = $('#deliverykotcustomeraddressField').val();
        break;
      case QUICK_TAB_ID:
        savedCustomerAddress = $('#quickkotcustomeraddressField').val();
        break;
      default:
        break;
    }
  }

  if (updateCustomerSwalVisible) {
    // eslint-disable-next-line no-unused-vars
    savedCustomerAddress = $('#modal_customeraddressid').val();
  }

  const addresscontainer = $('<div>');
  addresses.map((address) => {
    let labelicon = $('<i>', {
      class: 'fa fa-map-marker iconlabel',
    });

    switch (address.label) {
      case 'home':
        labelicon = $('<i>', {
          class: 'fa fa-home iconlabel',
        });
        break;

      case 'Office':
        labelicon = $('<i>', {
          class: 'fas fa-building iconlabel',
        });
        break;

      case 'Other':
        labelicon = $('<i>', {
          class: 'fa fa-map-marker iconlabel',
        });
        break;

      default:
        labelicon = $('<i>', {
          class: 'fa fa-map-marker iconlabel',
        });
        break;
    }
    // const custAddress = `${address.manual_address},${address.floor},${address.landmark}`;
    const custAddress = `${address.manual_address}, ${address.location ? `${address.location},` : ''} ${address.area ? `${address.area},` : ''} ${address.block ? `${address.block},` : ''} ${address.street ? `${address.street},` : ''} ${address.lane ? `${address.lane},` : ''} ${address.building ? `${address.building},` : ''} ${address.flat ? `${address.flat},` : ''} ${address.floor ? `${address.floor},` : ''} ${address.landmark ? `${address.landmark},` : ''} ${address.label ? `${address.label}` : ''}`;

    const addrContainer = $('<div>', {
      class: 'card',
    });

    const addr = $('<div>', {
      // html: cust_address,
      class: 'card-body address-card-body',
    });
    addr.css({ width: '99%' });

    const addressLabel = $('<div>', {
      html: custAddress,
    });

    const locationlabel = $('<div>', {
      html: address.label,
      class: 'location-label-class',
    });
    locationlabel.prepend(labelicon);
    // if (cust_address == saved_customer_address) {
    //   let default_address = $('<span>', {
    //     html: 'Default',
    //   });
    //   location.append(default_address);
    // }

    addr.prepend(locationlabel);
    addr.append(addressLabel);

    addrContainer.css({
      margin: '6px',
    });

    const selectAddressButton = $('<button>', {
      class: 'btn btn-outline-success selectaddressbutton',
      html: $.i18n.t('customerAddress.Deliverhere'),
    }).click(() => {
      // eslint-disable-next-line no-use-before-define
      addSelectedAddrToCurrentOrder(custAddress, address);
    });
    addr.append(selectAddressButton);

    // edit delete address
    const updateDiv = $('<div>', {
      class: 'update-address-class',
    });

    const editAddressIcon = $('<i>', {
      class: ' fa fa-edit editaddressicon',
    }).click(() => {
      // eslint-disable-next-line no-use-before-define
      editcustomerAddress(address);
    });

    const deleteAddressIcon = $('<i>', {
      class: 'fa fa-trash-o deleteaddressicon',
    }).click(() => {
      // eslint-disable-next-line no-use-before-define
      deleteCustomerAddress(address);
    });
    updateDiv.append(editAddressIcon);
    updateDiv.append(deleteAddressIcon);

    addr.append(updateDiv);
    addrContainer.append(addr);
    addresscontainer.append(addrContainer);
    return undefined;
  });
  $('#customerAddressDatadivid').append(addresscontainer);
}
function lockKOTCustomerFields() {
  const activeTab = $('.mainsectionTabs li a.active').attr('id');

  switch (activeTab) {
    case DINEIN_TAB_ID:
      $('#kotcustomermobileField, #kotcustomernameField')
        .attr('readonly', true)
        .addClass('readonly-field');
      break;

    case TAKEAWAY_TAB_ID:
      $('#takeawaykotcustomermobileField, #takeawaykotcustomernameField')
        .attr('readonly', true)
        .addClass('readonly-field');
      break;

    case DELIVERY_TAB_ID:
      $('#deliverykotcustomermobileField, #deliverykotcustomernameField')
        .attr('readonly', true)
        .addClass('readonly-field');
      break;

    case QUICK_TAB_ID:
      $('#quickbillkotcustomermobileField, #quickbillkotcustomernameField')
        .attr('readonly', true)
        .addClass('readonly-field');
      break;

    default:
      break;
  }
}

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
    $('#customerAddressModal').modal('toggle');
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
        addresschangeHandlerfordinein(custAddress, address);
        break;
      case TAKEAWAY_TAB_ID:
        $('#takotcustomeraddressField').val(custAddress);
        addresschangeHandler(custAddress, address);
        break;
      case DELIVERY_TAB_ID:
        $('#deliverykotcustomeraddressField').val(custAddress);
        addresschangeHandlerforDelivery(custAddress, address);
        break;
      case QUICK_TAB_ID:
        $('#quickkotcustomeraddressField').val(custAddress);
        addresschangeHandlerforquickbill(custAddress, address);
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
  $('#customerAddressModal').modal('toggle');
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

  $('#editCustomerAddress').show();
  $('#createNewCustomerAddress').hide();
  $('#showaddcustoerAddressForm').prop('checked', true);

  updateAddressData = address;
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

async function fetchCustomer(mobileOverride) {
  let mobileNumber = '';

  // If caller passed explicit mobile, use it
  if (mobileOverride) {
    mobileNumber = mobileOverride;
  }

  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        mobileNumber = mobileNumber || $('#kotcustomermobileField').val();
        break;
      case TAKEAWAY_TAB_ID:
        mobileNumber =
          mobileNumber || $('#takeawaykotcustomermobileField').val();
        break;
      case DELIVERY_TAB_ID:
        mobileNumber =
          mobileNumber || $('#deliverykotcustomermobileField').val();
        break;
      case QUICK_TAB_ID:
        mobileNumber =
          mobileNumber || $('#quickbillkotcustomermobileField').val();
        break;
      default:
        break;
    }
  }

  // If modal is visible it may hold the phone
  if (!mobileNumber && $('#addOrEditCustomerModal').is(':visible')) {
    mobileNumber = $('#modal_customerPhoneid').val();
  }

  // As last-resort fallback, if CRM flow provided data, use it
  if (
    !mobileNumber &&
    window.__crmEditCustomerData &&
    window.__crmEditCustomerData.phone
  ) {
    mobileNumber = window.__crmEditCustomerData.phone;
  }

  $(`#customerAddressDatadivid`).append($(CUSTOMER_LOADER));

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

  lockKOTCustomerFields();

  if (
    data.status === 200 &&
    data.custinfo &&
    data.custinfo.address &&
    data.custinfo.address.length
  ) {
    showCustomerAddresses(data.custinfo.address);
  } else {
    const addressNotFound = $('<p>', {
      html: $.i18n.t('customerAddress.AddressnotaddedPleaseaddaddress'),
    });
    $('#customerAddressDatadivid').empty();

    $('#customerAddressDatadivid').append(addressNotFound);
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

  if (!completeAddress) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddcompleteaddress',
      ),
    );
    return;
  }

  if (!buildingName) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddbuildingtower',
      ),
    );
    return;
  }

  if (!landmark) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerAddressNotifications.Pleaseaddlandmark'),
    );
    return;
  }

  if (!location) {
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
  if (location.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Locationshouldbelessthancharacter',
      ),
    );
    return;
  }

  if (area.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Areashouldbelessthancharacter',
      ),
    );
    return;
  }

  // Updated validation code
  if (block.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Blockshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (street.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Streetshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (lane.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Lanesshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (flat.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Flatshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (floor.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Floorshouldbelessthancharacter',
      ),
    );
    return;
  }

  const mobileNumber = updateAddressData.customer_phone;
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
    fetchCustomer();
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

  let mobileNumber = '';
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        mobileNumber = $('#kotcustomermobileField').val();
        break;
      case TAKEAWAY_TAB_ID:
        mobileNumber = $('#takeawaykotcustomermobileField').val();
        break;
      case DELIVERY_TAB_ID:
        mobileNumber = $('#deliverykotcustomermobileField').val();
        break;
      case QUICK_TAB_ID:
        mobileNumber = $('#quickbillkotcustomermobileField').val();
        break;
      default:
        break;
    }
  }
  if (!mobileNumber) {
    mobileNumber = $('#swal_customerPhoneid').val();
  }

  if (!completeAddress) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddcompleteaddress',
      ),
    );
    return;
  }

  if (!buildingName) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Pleaseaddbuildingtower',
      ),
    );
    return;
  }

  if (!landmark) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:customerAddressNotifications.Pleaseaddlandmark'),
    );
    return;
  }

  if (!location) {
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

  // Updated validation code
  if (custLocation.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.CustLocationshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (area.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Areashouldbelessthancharacter',
      ),
    );
    return;
  }
  if (block.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Blockshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (street.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Streetshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (lane.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Lanesshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (flat.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Flatshouldbelessthancharacter',
      ),
    );
    return;
  }
  if (floor.length > 80) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:customerAddressNotifications.Floorshouldbelessthancharacter',
      ),
    );
    return;
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
    if (data?.customer?.address.length) {
      showCustomerAddresses([...data.customer.address]);
    } else {
      showCustomerAddresses([address]);
    }

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

$('#customerAddressModal').on('shown.bs.modal', () => {
  $('#customerAddressDatadivid').empty();
  $('#customerAddressinputWrapperdivid').hide();
  $('#showaddcustoerAddressForm').prop('checked', false);
  $('#customeradderesscontainerid').show();
  resetCustomerAddressUI();

  fetchCustomer();
});

function initializeCustomerAddress() {
  $('#showaddcustoerAddressForm').on('click', () => {
    toggleFormvisibility();
  });

  $('#homelocatiobuttonid').on('click', () => {
    location = 'home';
  });

  $('#officelocationbuttonid').on('click', () => {
    location = 'Office';
  });

  $('#otherlocationbuttionid').on('click', () => {
    location = 'Other';
  });

  $('#createNewCustomerAddress').on(
    'click',
    debounce(() => {
      createNewCustomerAddress();
    }, 200),
  );

  $('#editCustomerAddress').on('click', () => {
    sendUpdateCustomerAddressRequest();
  });
}
initializeCustomerAddress();
initalizei18nforcustomeraddress();
