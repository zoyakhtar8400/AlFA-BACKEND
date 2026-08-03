const debounceSearchlistener = _.debounce((term, response, forMobile) => {
  const filteredMobilelist = [];
  if (String(term).length >= 3) {
    _.filter(window.customersList, (customer) => {
      let fieldtoCompare;
      if (customer) {
        fieldtoCompare = forMobile
          ? customer.phone + customer.alternate_phone
          : customer.name;
        if (String(fieldtoCompare).toLowerCase().includes(term.toLowerCase())) {
          let address = customer.address_line1 ? customer.address_line1 : '';
          // if (customer.address_line2) {
          //   address =
          //     address + customer.address_line2 ? customer.address_line2 : '';
          // }
          if (forMobile) {
            filteredMobilelist.push({
              label: `${customer.phone} ${customer.alternate_phone || ''}`,
              value: customer.phone,
              name: customer.name,
              address,
              id: customer.id,
              dialCode: customer.dial_code,
            });
          } else {
            filteredMobilelist.push({
              label: customer.name,
              value: customer.name,
              phone: customer.phone,
              id: customer.id,
              address,
              dialCode: customer.dial_code,
            });
          }
        }
      }
    });
    if (filteredMobilelist.length > 50) {
      filteredMobilelist.length = 50;
    }
    response(filteredMobilelist);
  }
}, 180);

/**
 *
 * @param {Input id on which the listener is to be added} id
 * @param {Respective customer name field} respectiveID
 * @param {*} forMobile
 */
function setCustomerfieldsdebouncedlistener({
  id,
  respectiveID,
  forMobile,
  appendTo,
  forPaymentmodal,
  address,
  dialCode,
  setCustomerfrompaymodal,
  updateCustomer,
  addCustomerToDue,
  updateAddress,
}) {
  if (forMobile) {
    $(`#${id}`).autocomplete({
      appendTo,
      source(request, response) {
        const { term } = request;
        debounceSearchlistener(
          term,
          _.debounce(response, 200),
          forMobile,
        ); /* get answers from somewhere.. */
      },
      select(event, ui) {
        if (ui.item !== undefined && ui.item.name !== undefined) {
          if (respectiveID) {
            $(`#${respectiveID}`).val(ui.item.name);

            // ✅ store original NAME
            $(`#${respectiveID}`).data('original', ui.item.name);
          }

          $(`#${id}`).val(ui.item.value);

          // ✅ store original MOBILE
          $(`#${id}`).data('original', ui.item.value);

          if (address) {
            $(`#${address}`).val(ui.item.address);
          }
          if (dialCode && ui.item.dialCode) {
            $(`#${dialCode}`).val(ui.item.dialCode);
          }

          if (forPaymentmodal && _.isFunction(setCustomerfrompaymodal)) {
            setCustomerfrompaymodal($(`#${id}`).val(), ui.item.name);
          }
          if (_.isFunction(updateCustomer)) updateCustomer();
          if (_.isFunction(addCustomerToDue)) addCustomerToDue();
          if (_.isFunction(updateAddress)) updateAddress();
        }
      },
    });
  } else {
    $(`#${id}`).autocomplete({
      appendTo,
      source(request, response) {
        const { term } = request;
        debounceSearchlistener(
          term,
          _.debounce(response, 200),
          forMobile,
        ); /* get answers from somewhere.. */
      },
      select(event, ui) {
        if (ui.item !== undefined && ui.item.phone !== undefined) {
          if (respectiveID) {
            $(`#${respectiveID}`).val(ui.item.phone);

            // ✅ store original MOBILE
            $(`#${respectiveID}`).data('original', ui.item.phone);
          }

          $(`#${id}`).val(ui.item.label);

          // ✅ store original NAME
          $(`#${id}`).data('original', ui.item.label);

          if (address) {
            $(`#${address}`).val(ui.item.address);
          }
          if (dialCode && ui.item.dialCode) {
            $(`#${dialCode}`).val(ui.item.dialCode);
          }

          if (_.isFunction(updateCustomer)) updateCustomer();
          if (_.isFunction(updateAddress)) updateAddress();
        }
      },
    });
  }
}

module.exports = {
  setCustomerfieldsdebouncedlistener,
};
