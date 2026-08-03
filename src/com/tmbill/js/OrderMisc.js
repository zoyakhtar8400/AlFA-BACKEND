/* eslint-disable camelcase */
const { default: axios } = require('axios');
const { Swal } = require('../util/Notification');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
const { safeParse } = require('../util/RendererUtils');

window.CURRENT_STARTDAYTIME = undefined;
window.CURRENT_STARTSHIFTTIME = undefined;

/**
 * Set's the items wrapper height according to
 * the current wrapper height of the table window.
 * @param {Current table wrapper height} tableContainerheight
 */
function setItemcontainerHeight({ tableContainerheight, settableHeight }) {
  if (tableContainerheight && tableContainerheight != 0) {
    const parentHeight = $('.mainWindow').height();
    const defaultTablewrapperheight = 34;
    const defaultItemwrapperheight = 50;

    let tableheightInper =
      (100 * Number(tableContainerheight.toFixed(2))) / parentHeight;
    if (settableHeight) {
      $('#tableDiv_container').css('height', `${tableheightInper.toFixed(2)}%`);
    }
    tableheightInper = defaultTablewrapperheight - tableheightInper;
    const newItemsheight = defaultItemwrapperheight + tableheightInper;

    $('#itemsDivid').css('height', `${newItemsheight.toFixed(2)}%`);
    if (takeawayanddineinDisabled) {
      $('#itemsDivid').css({
        height: '84%',
      });
    }
  }
}

/**
 * Opens the coupon discount window
 * @param {Parameters if any} params
 */
async function openCoupondiscountwindow(params) {
  const result = await Swal.fire({
    title: `${$.i18n.t('orderScreen.coupondiscount')}`,
    html:
      `<input placeholder="${$.i18n.t(
        'orderScreen.couponcode',
      )}" id="swal-input1" type="text" class="swal2-input w-75 has-i18n">` +
      `<input placeholder="${$.i18n.t(
        'masterScreen.walletManagement.createWallet.customerMobile',
      )}"  id="swal-input2" class="swal2-input w-75">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: `${$.i18n.t('orderScreen.Apply')}`,
    cancelButtonText: $.i18n.t(
      'controller:orderController.editOrAddCustomer.Cancel',
    ),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      htmlContainer: 'tmbill-swal-html-container',
    },
    didOpen: () => {
      if (params.customerMobile) {
        $('#swal-input2').val(params.customerMobile);
      }
      if (!navigator.onLine) {
        showSwalwarning('No Internet connection');
      }
    },
    showLoaderOnConfirm: true,
    // showCancelButton: true,
    preConfirm: async () => {
      const couponCode = document.getElementById('swal-input1').value;
      const customerMobile = document.getElementById('swal-input2').value;
      if (!couponCode) {
        showSwalwarning('Please enter coupon code');
        return;
      }
      if (!customerMobile) {
        showSwalwarning('Please enter mobile number');
        return;
      }
      if (couponCode && customerMobile) {
        if (couponCode.length > 20) {
          showSwalwarning('Coupon code length should be less than 20');
          return;
        }

        if (window.allspecialCharRegex.test(couponCode)) {
          showSwalwarning('Special characters are not allowed in coupon code');
          return;
        }

        if (customerMobile.length > 15) {
          showSwalwarning('Mobile number length should be less than 15');
          return;
        }

        if (isNaN(customerMobile)) {
          showSwalwarning('Please enter valid mobile number');
          return;
        }

        const customer = getCustomerforremote(false, customerMobile);
        let custtype = 1;
        if (customer) {
          custtype = 2;
        }
        const response = await checkCoupondiscount({
          coupan: couponCode,
          cust_phone: customerMobile,
          custtype,
          order_type: params.order_type,
          order_amt: params.order_amt,
          store_id: window.storeDetails.store_id,
          tmpos_id: window.storeDetails.tmpos_id,
        });
        return response;
      }
      return false;
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });
  // if (result.value) {
  //    let checkResult = await checkCoupondiscount(result.value);
  //    return checkResult;
  // }
  return result;
}

/**
 * Send check discount request to server
 * @param {Request parameters} params
 */
async function checkCoupondiscount(params) {
  if (params.coupan && params.cust_phone) {
    try {
      let customer = getCustomerforremote(false, params.cust_phone);
      if (!customer) {
        customer = {
          name: '',
          phone: params.cust_phone,
          email: '',
          store_id: window.storeDetails.store_id,
          address_line1: '',
          address_line2: '',
          city: '',
        };
        // make silent add request
        await sendCustomerandaddtoListenerfromremote(customer, true);
      }

      const axiosresponse = await apiCall.post(
        Config.links.couponDiscount,
        params,
        {
          headers: getHeadersformposforrender(),
        },
      );
      const response = axiosresponse.data;
      if (response && response.status) {
        if (['200', 200].includes(response.status)) {
          response.customer = customer;
          return response;
        }
        if (response.status == '303') {
          reloginfromremote();
          return response;
        }
        if (response.msg) {
          showSwalwarning(response.msg);
        }
      }
    } catch (error) {
      showSwalwarning('Something went wrong');
      if ([401].includes(error?.response?.status)) {
        reloginfromremote();
      }
    }
  } else {
    showSwalwarning('Please provide both fields');
  }
  return false;
}

window.showSwalwarning = (message) => {
  Swal.resetValidationMessage();
  Swal.showValidationMessage(message);
  setTimeout(() => {
    if (Swal.isVisible()) Swal.resetValidationMessage();
  }, 2000);
};

async function openHelpwindow(getintouchform) {
  let contactPerson;
  if (window.storeDetails) {
    contactPerson = safeParse(window.storeDetails.point_of_contact);
  }

  if ($.i18n && $.i18n.language !== 'en') {
    setTimeout(() => {
      $('.getintouch-div .has-i18n').localize();
    }, 500);
  }

  const result = await Swal.fire({
    footer:
      contactPerson &&
      `<div class='quickSupportHeading'> ${$.i18n.t(
        'controller:orderMisc.NeedQuicksupportcallnow',
      )}: ${contactPerson.poc_contact_no} ${
        contactPerson.poc_alternate_contact_no
          ? ('|', contactPerson.poc_alternate_contact_no)
          : ''
      } </div>`,
    title: $.i18n.t('controller:orderMisc.needTechnicalSupport'),
    html: getintouchform,
    width: '28em',
    confirmButtonText: $.i18n.t('controller:orderMisc.callMeBack'),
    cancelButtonText: $.i18n.t('controller:orderMisc.cancel'),
    showCancelButton: true,
    didOpen: () => {
      $('#gint-date-id').daterangepicker({
        timePicker: true,
        singleDatePicker: true,
        startDate: moment().startOf('day'),
        minDate: moment().startOf('day'),
        drops: 'up',
        locale: {
          format: 'YYYY-MM-DD hh:mm:ss A',
        },
      });
      if (!navigator.onLine) {
        showSwalwarning('No Internet connection');
      }
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    preConfirm: () => {
      const mobile = $('#gint-customer-mobile-id').val();
      const email = $('#gint-customer-email-id').val();
      const selection = $(
        '#gint-queryselect-id option:selected:not([disabled])',
      );
      let enquiry;
      if (selection.length > 0) {
        enquiry = $(selection).html();
      }
      if (mobile) {
        if (mobile.length > 15) {
          Swal.showValidationMessage(
            'Mobile number should be less than 15 digit',
          );
          return false;
        }

        if (
          window.allspecialCharRegex.test(mobile) ||
          !window.onlyNumberRegex.test(mobile)
        ) {
          Swal.showValidationMessage('Please enter valid mobile number');
          return false;
        }
      }

      if (email) {
        if (email.length > 50) {
          Swal.showValidationMessage('Email lenght shoul be less than 50');
          return false;
        }

        if (!window.emailRegex.test(email)) {
          Swal.showValidationMessage('Please enter valid email');
          return false;
        }
      }

      if (enquiry && mobile) {
        return true;
      }
      showSwalwarning('Mobile and enquiry is required');
      return false;
    },
  });

  if (result && result.value) {
    const mobile = $('#gint-customer-mobile-id').val();
    const selection = $('#gint-queryselect-id option:selected:not([disabled])');
    let need_support_on;
    if (selection.length > 0) {
      need_support_on = $(selection).html();
    }
    let email = $('#gint-customer-email-id').val();
    if (!email) {
      email = '';
    }
    const time_date = $('#gint-date-id')
      .data('daterangepicker')
      .startDate.format('YYYY-MM-DD HH:MM:ss A');
    sendEnquiryrequest({
      store_id: window.storeDetails ? window.storeDetails.store_id : 'none',
      mobile,
      email,
      time_date,
      user_id: window.storeDetails ? window.storeDetails.username : 'none',
      need_support_on,
    });
  }
}

async function sendEnquiryrequest(postData) {
  const options = {
    method: 'POST',
    uri: Config.links.liveSupport,
    body: postData,
    json: true,
    headers: getHeadersformposforrender(),
    rejectUnauthorized: false,
  };
  try {
    const response = await request(options);
    if (response && response.status) {
      if (response.status == 200) {
        window.notifyUser.showMessage('success', response.msg, 0);
      } else if (response.status == 303) {
        reloginfromremote();
      } else {
        window.notifyUser.showMessage('error', response.msg, 0);
      }
    }
  } catch (error) {
    console.log(error);

    window.notifyUser.showMessage(
      'error',
      'Something went wrong.Try again!',
      0,
    );
  }
}

async function askforStartday(params) {
  setStartendreporttime(params.start_day_date);
  if (!params || !params.askforStartday) {
    return;
  }

  if (!window.startDayAndShiftWindowLoaded) {
    console.log('load start day shift html');
    $('#startCloseDayShiftwindowWrapperid').load(
      'Account/StartDayAndShift.html',
    );
  }

  // $('#menuManagementwindowWrapperid').hide();
  $('#startCloseDayShiftwindowWrapperid').show();
  setTimeout(() => {
    $('#startDayAndShiftModal').attr('data', JSON.stringify(params));
    $('#startDayAndShiftModal').modal('show');
  }, 500);
}

async function setStartendreporttime(start_day_date) {
  if (start_day_date) {
    window.CURRENT_STARTDAYTIME = start_day_date;
    window.CURRENT_STARTDAYTIME = window
      .moment(window.CURRENT_STARTDAYTIME)
      .format('YYYY-MM-DD hh:mm:ss A');
  }
}

async function setStartShifttime(start_shift_date) {
  if (start_shift_date) {
    window.CURRENT_STARTSHIFTTIME = start_shift_date;
    window.CURRENT_STARTSHIFTTIME = window
      .moment(window.CURRENT_STARTSHIFTTIME)
      .format('YYYY-MM-DD hh:mm:ss A');
  }
}

async function askforItemleveldiscount(item) {
  let selecteddisctype = 2;
  let discountAmount;
  const discountRemoved = false;

  const container = $('<div>');
  const discountvalueInput = $('<input>', {
    placeholder: 'Discount value',
    id: 'swal-input1',
    type: 'text',
    class: 'mr-2 w-25',
  });

  const disctypeContainer = $('<div>', {
    class: 'd-flex justify-content-center align-items-end',
    id: 'swal-disctype-container',
  });
  const fixeddiscountElement = $('<div>', {
    class: 'd-flex selectable-div selectedDiscount left-bordered',
    html: 'Fixed',
    id: 'swal-fixeddisc-type',
  });
  const perdiscountElement = $('<div>', {
    class: 'd-flex selectable-div right-bordered',
    html: 'Percent',
    id: 'swal-percentdisc-type',
  });
  disctypeContainer.append(discountvalueInput);
  disctypeContainer.append(fixeddiscountElement);
  disctypeContainer.append(perdiscountElement);

  container.append(disctypeContainer);

  const result = await Swal.fire({
    title: $.i18n.t('controller:orderMisc.addDiscount'),
    html: container,
    focusConfirm: false,
    width: '28em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      actions: 'tmbill-swal-actions',
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    reverseButtons: true,
    showDenyButton: true,
    denyButtonText: `Remove`,
    confirmButtonText: `Add`,
    didOpen: () => {
      if (item.discount_rate > 0) {
        $('#swal-input1').val(item.discount_rate);
        if (item.discount_type === 1) {
          selecteddisctype = 1;
          $('#swal-percentdisc-type').addClass('fill-layer');
        } else {
          $('#swal-fixeddisc-type').addClass('fill-layer');
        }
      } else {
        $('#swal-fixeddisc-type').addClass('fill-layer');
      }
      $('#swal-fixeddisc-type').click(() => {
        if (selecteddisctype !== 2) {
          $('#swal-disctype-container div.selectable-div').removeClass(
            'fill-layer',
          );
          $('#swal-fixeddisc-type').addClass('fill-layer');
          selecteddisctype = 2;
        }
      });

      $('#swal-percentdisc-type').click(() => {
        if (selecteddisctype !== 1) {
          $('#swal-disctype-container div.selectable-div').removeClass(
            'fill-layer',
          );
          $('#swal-percentdisc-type').addClass('fill-layer');
          selecteddisctype = 1;
        }
      });

      // is_modifiable == 1 ? "editable" : ""
    },
    preConfirm: () => {
      discountAmount = $('#swal-input1').val();
      if (discountAmount) {
        if (Number(discountAmount) < 0) {
          showSwalwarning(
            'Discount amount length should not be negative value',
          );
          return;
        }
        if (discountAmount.length > 10) {
          showSwalwarning(
            'Discount amount length should be less than 10 digit',
          );
          return;
        }
        const isNumber = !isNaN(discountAmount);
        if (!isNumber) showSwalwarning('Invalid amount');
        return isNumber;
      }
      showSwalwarning('Invalid amount');
      discountAmount = undefined;
      return false;
    },
  });

  let sendItemresult = false;
  let discounted_price = 0;
  if (result && result.value && discountAmount) {
    sendItemresult = true;
  }
  if (result && result.isDenied) {
    sendItemresult = true;
    Object.assign(item, {
      pricebeforeDiscount: item.pricebeforeDiscount,
      discounted_price: 0,
      discount_type: 2,
      discount_rate: 0,
      price: item.pricebeforeDiscount,
      amount: Number(
        Number(item.pricebeforeDiscount * item.quantity).toFixed(ROUNDOFF_UPTO),
      ),
    });
    discountAmount = 0;
  }
  // return;
  if (sendItemresult) {
    if (selecteddisctype === 1) {
      discounted_price =
        item.pricebeforeDiscount -
        (item.pricebeforeDiscount * discountAmount) / 100;
    } else {
      discounted_price = item.pricebeforeDiscount - discountAmount;
    }
    if (discounted_price < 0) {
      window.notifyUser.showMessage(
        'error',
        'Discounted amount cannot be greate than price.',
      );
      return;
    }

    if (item.item_tax_method === 0) {
      // exclusive tax
      const taxValue = (item.item_tax_per / 100) * discounted_price;
      item.itemsub_total = discounted_price + taxValue;
      item.item_tax_value = taxValue;
    } else if (item.item_tax_method === 1) {
      // inclusive tax
      const taxValue =
        (discounted_price / (100 + item.item_tax_per)) * item.item_tax_per;
      item.itemsub_total = discounted_price;
      item.item_tax_value = taxValue;
    }
    Object.assign(item, {
      // pricebeforeDiscount: item.price,
      discounted_price: discountRemoved ? 0 : discounted_price,
      discount_type: selecteddisctype,
      discount_rate: discountAmount,
      price: discounted_price,
      amount: Number(
        Number(discounted_price * item.quantity).toFixed(ROUNDOFF_UPTO),
      ),
      // discount: discounted_price,
    });
    window.notifyUser.showMessage('success', 'Discount modified');
    return item;
  }
}

async function askforItemPrice(item) {
  let selecteddisctype = 2;
  let itemPrice;

  const container = $('<div>');
  const discountvalueInput = $('<input>', {
    placeholder: 'Enter New Price of Item',
    id: 'swal-itemprice-input1',
    type: 'text',
    class: '',
    css: { width: '100%' },
  });

  const itemDetails = $('<div>', {
    text: `${item.title}: ${window.currency} ${item.price}`,
    type: 'text',
    class: '',
    css: { width: '100%', fontWeight: 'bold' },
  });

  const disctypeContainer = $('<div>', {
    class: '',
    id: 'swal-disctype-container',
  });
  disctypeContainer.append(itemDetails);

  disctypeContainer.append(discountvalueInput);

  container.append(disctypeContainer);
  const result = await Swal.fire({
    title: 'Change Item Price',
    html: container,
    focusConfirm: false,
    width: '28em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      actions: 'tmbill-swal-actions',
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: false,
    reverseButtons: true,
    showDenyButton: true,
    denyButtonText: `Cancel`,
    confirmButtonText: `Add New Price`,
    didOpen: () => {
      if (item.discount_rate > 0) {
        // $('#swal-itemprice-input1').val(item.discount_rate);
        if (item.discount_type === 1) {
          selecteddisctype = 1;
          $('#swal-percentdisc-type').addClass('fill-layer');
        } else {
          $('#swal-fixeddisc-type').addClass('fill-layer');
        }
      } else {
        $('#swal-fixeddisc-type').addClass('fill-layer');
      }
      $('#swal-fixeddisc-type').click(() => {
        if (selecteddisctype !== 2) {
          $('#swal-disctype-container div.selectable-div').removeClass(
            'fill-layer',
          );
          $('#swal-fixeddisc-type').addClass('fill-layer');
          selecteddisctype = 2;
        }
      });

      $('#swal-percentdisc-type').click(() => {
        if (selecteddisctype !== 1) {
          $('#swal-disctype-container div.selectable-div').removeClass(
            'fill-layer',
          );
          $('#swal-percentdisc-type').addClass('fill-layer');
          selecteddisctype = 1;
        }
      });

      // is_modifiable == 1 ? "editable" : ""
    },
    preConfirm: () => {
      itemPrice = $('#swal-itemprice-input1').val();

      if (itemPrice !== '' && itemPrice !== null) {
        itemPrice = Number(itemPrice);
      }

      if (itemPrice !== '' && itemPrice !== null) {
        if (Number(itemPrice) < 0) {
          showSwalwarning('Please enter a valid price amount');
          return;
        }
        if (itemPrice.length > 10) {
          showSwalwarning('Item Price length should be less than 10 digit');
          return;
        }
        const isNumber = !isNaN(itemPrice);
        if (!isNumber) showSwalwarning('Invalid amount');
        return isNumber;
      }

      showSwalwarning('Invalid amount');
      discountAmount = undefined;
      return false;
    },
  });

  let sendItemresult = false;
  const discounted_price = 0;
  if (result && result.value) {
    sendItemresult = true;
  }
  // return;
  if (sendItemresult) {
    if (item.item_tax_method === 0) {
      // exclusive tax
      const taxValue = (item.item_tax_per / 100) * itemPrice;
      item.itemsub_total = itemPrice + taxValue;
      item.item_tax_value = taxValue;
    } else if (item.item_tax_method === 1) {
      // inclusive tax
      const taxValue =
        (itemPrice / (100 + item.item_tax_per)) * item.item_tax_per;
      item.itemsub_total = itemPrice;
      item.item_tax_value = taxValue;
    }
    let extra_details = {};
    if (item.extra_details) {
      extra_details = { ...item.extra_details, priceChanged: true };
    }
    Object.assign(extra_details, {
      priceChanged: true,
    });
    Object.assign(item, {
      pricebeforeDiscount: itemPrice,
      price: itemPrice,
      amount: Number(
        Number(itemPrice * item.quantity).toFixed(window.ROUNDOFF_UPTO),
      ),
      extra_details,
    });
    window.notifyUser.showMessage('success', 'Price changed');
    return item;
  }
}

async function showstartShift(params) {
  setStartShifttime(params.shift_start_date);
  if (params && params.shiftStarted == false) {
    if (!window.startShiftWindowLoaded) {
      console.log('load start day shift html');
      $('#StartShiftwindowWrapperid').load('Account/StartNewShift.html');
    }

    // $('#menuManagementwindowWrapperid').hide();
    // $('#CloseDayAndShiftwindowWrapperid').show();
    setTimeout(() => {
      $('#startShiftModal').attr('data', JSON.stringify(params));
      $('#startShiftModal').modal('show');
    }, 500);
  }
}

async function showwaiterSelectpopup(
  waiters,
  isWaiteroptional,
  showCancelButton,
) {
  const options = {};
  waiters.forEach((element) => {
    options[element.id] = element.name;
  });

  const result = await Swal.fire({
    title: $.i18n.t('controller:orderMisc.selectWaiter'),
    input: 'select',
    width: '23em',
    inputOptions: options,
    inputPlaceholder: $.i18n.t('controller:orderMisc.selectWaiter'),
    // allowOutsideClick: isWaiteroptional,
    // allowEscapeKey: isWaiteroptional,
    // showCancelButton: showCancelButton,
    allowOutsideClick: true,
    allowEscapeKey: true,
    showCancelButton: true,
    reverseButtons: true,
    returnFocus: false,
    confirmButtonText: $.i18n.t('controller:orderController.changeTable.OK'),
    cancelButtonText: $.i18n.t('controller:orderController.changeTable.Cancel'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
    inputValidator: (value) =>
      new Promise((resolve) => {
        if (value) {
          resolve();
        } else {
          resolve($.i18n.t('controller:orderMisc.youNeedToSelectAWaiter'));
        }
      }),
  });

  if (result && result.value) {
    Object.assign(result, {
      waiter_id: result.value,
      waiter: options[result.value],
    });
  }
  return result;
}

/**
 * Send reward history to backend
 */
async function sendRewardhistory({
  reward,
  order_id,
  phone,
  customer_name,
  isQuickbill,
  action,
}) {
  const postData = {
    action,
    reward,
    order_id,
    rewarded_on_platform: 'atlantic_pos',
    store_id: window.storeDetails.store_id,
    tmpos_id: window.storeDetails.tmpos_id,
    customer_phone: phone,
    customer_name,
    isQuickbill,
  };
  try {
    const result = await apiCall.post(Config.links.rewardHistory, postData, {
      headers: getHeadersformposforrender(),
    });
    const response = result.data;
    if (['300', 300].includes(response.status)) {
      reloginfromremote();
      setTimeout(() => {
        sendRewardhistory({ reward, order_id, phone, customer_name });
      }, 8000);
    } else if (response.status == '200') {
    }
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.response?.status)) {
      reloginfromremote();
      setTimeout(() => {
        sendRewardhistory({ reward, order_id, phone, customer_name });
      }, 8000);
    }
  }
}

function initialize() {
  $('#help-button-id').on('click', () => {
    $.get(
      'Getintouch.html',
      (data) => {
        openHelpwindow(data);
      },
      'html',
    );
  });
}

/**
 * Opens the coupon discount window
 * @param {Parameters if any} params
 */
async function openOrderNotewindow(orderNote) {
  let order_note = '';
  if (orderNote) {
    order_note = orderNote;
  }
  const result = await Swal.fire({
    title: $.i18n.t('controller:orderController.editOrAddCustomer.orderNote'),
    html: `<input type="text" value='${order_note}' placeholder="${$.i18n.t('controller:orderController.editOrAddCustomer.enterOrderNote')}" id="swal-input1" class="swal2-input w-75">`,

    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: `${$.i18n.t('orderScreen.Apply')}`,
    cancelButtonText: $.i18n.t(
      'controller:orderController.editOrAddCustomer.Cancel',
    ),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      htmlContainer: 'tmbill-swal-html-container',
    },
    didOpen: () => {
      // if (!navigator.onLine) {
      //   showSwalwarning('No Internet connection');
      // }
    },
    showLoaderOnConfirm: true,
    // showCancelButton: true,
    preConfirm: async () => {
      const orderNote = document.getElementById('swal-input1').value;
      if (!orderNote) {
        window.showSwalwarning('Please enter order note');
        return;
      }
      if (orderNote) {
        if (orderNote.length > 200) {
          showSwalwarning('Order note length should be less than 200');
          return;
        }
        return orderNote;
      }
      return false;
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });
  // if (result.value) {
  //    let checkResult = await checkCoupondiscount(result.value);
  //    return checkResult;
  // }
  return result;
}

initialize();
module.exports = {
  sendRewardhistory,
  showwaiterSelectpopup,
  askforItemleveldiscount,
  showstartShift,
  setItemcontainerHeight,
  openCoupondiscountwindow,
  askforStartday,
  openHelpwindow,
  openOrderNotewindow,
  askforItemPrice,
};
