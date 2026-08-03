const {
  addOrUpdateCustomerRequest,
} = require('../../renderer/helper/Customer.helper');
const { sleep } = require('../../util/MiscUtil');
const { sendCustomerUpdatedEvent } = require('../ClientrequestHandler');
const { openCustomerForm } = require('../Customer');

let orderid;
let tableid;
let customernameField;
let customermobileField;
let customerAddressField;
let customerAddedorupdated = false;
let response = {};

/* eslint-disable camelcase */
async function updateCustomer() {
  const phone = $('#modal_customerPhoneid').val();
  const name = $('#modal_customernameid').val();
  const address = $('#modal_customeraddressid').val();

  if (!phone) {
    window.notifyUser.showMessage('error', 'Mobile number is required');
    return false;
  }

  const customer = {
    name,
    phone,
    store_id: window.storeDetails.store_id,
    address_line1: address,
  };
  const miscData = {
    order_id: orderid,
    table_id: tableid,
  };

  const result = await addOrUpdateCustomerRequest({ customer, miscData });
  console.log('result::', result);

  customerAddedorupdated = result && result.status === 200;
  if (customerAddedorupdated) {
    // await window.initgetCustomers();
    if (window.customersList) {
      const customerUpdateIndex = window.customersList.findIndex(
        (c) => Number(c.phone) === Number(result.customer.phone),
      );
      if (customerUpdateIndex) {
        window.customersList[customerUpdateIndex] = {
          ...window.customersList[customerUpdateIndex],
          ...result.customer,
        };
      }
      let customerUpdated = window.customersList.find(
        (c) => Number(c.phone) === Number(result.customer.phone),
      );
      console.log('customerUpdated::', customerUpdated);
      sendCustomerUpdatedEvent({
        customer: result.customer,
        table_id: window.globalcurrenttableId,
      });
    } else {
      await window.initgetCustomers();
    }
    $(customernameField).val(name || result?.customer?.name);
    $(customermobileField).val(phone || result?.customer?.phone);
    $(customerAddressField).val(address);
    response.customer = result.customer;
    Object.assign(response, {
      customerAddedorupdated,
      customer: result.customer,
    });
  }
  // await sleep(400);
  window.customerUpdatePostProcessFromremote(response);
  return response;
}

async function addoreditCustomerdetails({
  customers,
  nameField,
  mobileField,
  addressField,
  order_id,
  table_id,
}) {
  orderid = order_id;
  tableid = table_id;
  customernameField = nameField;
  customermobileField = mobileField;
  customerAddressField = addressField;
  if (!customers) {
    // eslint-disable-next-line no-param-reassign
    customers = window.customersList;
  }
  response = { customerAddedorupdated };

  $('#addOrEditCustomerModal').modal('show');
  $('#modal_customerPhoneid').val($(mobileField).val());
  $('#modal_customeraddressid').val($(addressField).val());
  $('#modal_customernameid').val($(nameField).val());

  if (customers && Array.isArray(customers)) {
    $('#modal_customernameid').autocomplete({
      source(req, sresponse) {
        const sourceData = [];
        const re = $.ui.autocomplete.escapeRegex(req.term);
        if (re.length > 3) {
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
        }
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

  return response;
}

function initialize() {
  $('#updateAndSettleCustomerButton').on('click', () => {
    updateCustomer();
  });

  $('#showCustomeraddressswalid').click(() => {
    const customer_mobile = $('#modal_customerPhoneid').val();
    if (!customer_mobile) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.Pleaseaddcustomermobile'),
      );
      return;
    }
    // if (!window.customerAddressscriptLoaded) {
    //   $('#customerAddressModalbodyid').load('CustomerAddress.html', () => {
    //     $('#customerAddressModal').modal('show');
    //   });
    // } else {
    //   $('#customerAddressModal').modal('toggle');
    // }

    openCustomerForm({
      tabIndex: 1,
      cust_phone: customer_mobile,
    });
  });
}

initialize();

module.exports = {
  addoreditCustomerdetails,
};
