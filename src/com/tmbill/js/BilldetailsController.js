const { cloneDeep } = require('lodash');
const { initializei18nforBilldetailwindowui } = require('./i18nController');
const { formatAMPM } = require('../util/MiscUtil');
const { BillingTypes } = require('../util/DBUtil');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  DELIVERY_TAB_ID,
  QUICK_TAB_ID,
} = require('../util/Constants');
const {
  checkforMultipricingbydept,
  checkforMultipricing,
} = require('./MultiPricing');

window.billdetailsscriptLoaded = true;

window.renderBilldetail_fromremote = async function (
  billDetails,
  showPopup,
  showSwalpopup,
) {
  renderBilldetail(billDetails, showPopup, showSwalpopup);
};

async function renderBilldetail(billDetails, showPopup, showSwalpopup) {
  if (!billDetails || !Array.isArray(billDetails) || billDetails.length == 0) {
    return;
  }
  billDetails = billDetails[0];
  $('#billdetailsitemTableid').find('tr:not(:first)').remove();
  $('#billdetails-orderid').html(billDetails.order_id);
  $('#billdetails-storeid').html(billDetails.store_id);
  $('#billdetails-outletnameid').html(window.storeDetails.store_name);
  if (billDetails.cust_name) {
    const name = billDetails.cust_name;
    // if (billDetails.phone) {
    //     name = name + `(${billDetails.phone})`;
    // }
    $('#billdetails-customerid').html(`${name}`);
  }

  $('#billdetails-tablenameid').html(billDetails.table_name);
  $('#billdetails-usernameid').html(billDetails.user_id);

  if (billDetails.created_time) {
    const d = new Date(parseInt(billDetails.created_time));
    const formattedDate = formatAMPM(d, false);
    $('#billdetails-dateid').html(formattedDate);
  }
  if (billDetails.billing_type != undefined) {
    // const billingType = BillingTypes[billDetails.billing_type];
    const billingType =
      window.orderTypes[Number(billDetails.billing_type)]?.order_type;
    if (billingType) {
      const billTypelabel = $('<label>', {
        html: billingType,
        class: `statusLabel ${billingType.replace(/ /g, '').toLowerCase()}`,
      });
      billDetails.billing_type = billingType;
      $('#billdetails-ordertypeid').html(billTypelabel);
    }
  }

  if (!billDetails.billedItems && billDetails.tmpos_order_child) {
    billDetails.billedItems = billDetails.tmpos_order_child;
  }
  if (billDetails.billedItems && Array.isArray(billDetails.billedItems)) {
    billDetails.billedItems.forEach((element) => {
      addBillitemrow(element);
    });
  }
  $('#bill-total-id').text(
    `${$.i18n.t('common:calculations.orderTotal')}: ${window.currency} ${billDetails.order_total.toFixed(
      window.ROUNDOFF_UPTO,
    )}`,
  );
  $('#bill-totaltax-id').text(
    `${$.i18n.t('common:calculations.orderTotalTax')}: ${window.currency} ${Number(
      billDetails.order_level_total_taxes,
    ).toFixed(window.ROUNDOFF_UPTO)}`,
  );

  if (billDetails.delivery_boy_name) {
    $('#billdetails-deliveryBoy-id').html(billDetails.delivery_boy_name);
  } else {
    $('#billdetails-deliveryBoy-id').html('');
  }
  if (billDetails.line_1) {
    $('#billdetails-address-id').html(billDetails.line_1);
  }
  if (
    billDetails.order_level_discount ||
    billDetails.discount ||
    billDetails.couponDisounttotal
  ) {
    let discountTotal = 0;
    if (billDetails.couponDisounttotal) {
      discountTotal = billDetails.couponDisounttotal;
    }
    if (Number(billDetails.discount)) {
      discountTotal = billDetails.discount;
    }

    if (billDetails.order_level_discount) {
      discountTotal = billDetails.order_level_discount;
      $('#bill-totaldiscount-id').show();
      $('#bill-totaldiscount-id').text(
        `${$.i18n.t('common:calculations.Discount')}: ${window.currency} ${Number(
          discountTotal,
        ).toFixed(window.ROUNDOFF_UPTO)}`,
      );
    } else {
      $('#bill-totaldiscount-id').hide();
    }
  }

  if (billDetails.fromRemote) {
    if (billDetails.order_level_discount) {
      $('#bill-totaldiscount-id').show();

      $('#bill-totaldiscount-id').text(
        `${$.i18n.t('common:calculations.Discount')}: ${window.currency} ${
          billDetails.order_level_discount
            ? Number(billDetails.order_level_discount).toFixed(
                window.ROUNDOFF_UPTO,
              )
            : ''
        }`,
      );
    } else {
      $('#bill-totaldiscount-id').hide();
    }
    if (Config.USE_NEW_API_BACKEND) {
      $('#billdetails-dateid').html(
        moment(billDetails.orderDateTime, 'YYYY-MM-DD HH:mm:ss').format(
          'DD MMMM YYYY hh:mm a',
        ),
      );
    } else {
      const date2 =
        billDetails.created_date !== null
          ? new Date(
              moment(`${billDetails.created_date} ${billDetails.created_time}`),
            )
          : new Date(moment(billDetails.order_date_timenew));

      const formattedDate2 = formatAMPM(date2, false);
      $('#billdetails-dateid').html(formattedDate2);
    }
  }
  if (showPopup) {
    $('#billdetailspreviewModal').modal('toggle');
  }

  if (showSwalpopup) {
    showbilldetailsinSwal($('#bill-details-containerid').html(), billDetails);
  }
}

function addBillitemrow(data) {
  const item = data;
  let itemTitle = item.title;
  if (
    window.selectedLanguage !== 'en' &&
    item.extra_details?.alternative_title
  ) {
    itemTitle = item.extra_details.alternative_title;
    item.alternative_title = item.extra_details.alternative_title;
  }
  if (item && item.extra_details && item.extra_details.baseTitle) {
    itemTitle = item.extra_details.baseTitle;
    if (
      window.selectedLanguage !== 'en' &&
      item.extra_details.alternative_title
    ) {
      itemTitle = item.extra_details.alternative_title;
      item.alternative_title = item.extra_details.alternative_title;
    }
  }

  if (item.item_options && item.item_options.length) {
    item.item_options.forEach((addon) => {
      if (
        window.selectedLanguage !== 'en' &&
        addon.extra_details &&
        addon.extra_details.alternative_title
      ) {
        itemTitle =
          `${itemTitle}<br>` +
          `${addon.qty} x ${addon.extra_details.alternative_title} `;

        addon.alternative_title = addon.extra_details.alternative_title;
      } else {
        itemTitle = `${itemTitle}<br>` + `${addon.qty} x ${addon.title} `;
      }
    });
  }
  const total = data.quantity * data.price;

  const category = $('<td>', { html: itemTitle });
  const count = $('<td>', { html: data.quantity });
  const amount = $('<td>', {
    html: total.toFixed(window.ROUNDOFF_UPTO),
  });
  const row = $('<tr>').append(category).append(count).append(amount);
  $('#billdetailsitemTableid').append(row);
}

function getItemAddons(item) {
  const addons = [];
  if (item.item_options && item.item_options.length) {
    item.item_options.forEach((option) => {
      const optionQty = option.qty / item.quantity;

      const data = {
        item_refid: option.option_ref_id,
        item_id: item.item_id,
        optionGrptitle: '',
        opt_grp_ref_ids: option.option_group_ref_id,
        ref_id: option.option_ref_id,
        title: option.title,
        price: option.price,
        option_tax: option.tax_per,
        qty: optionQty,
        option_type: option.type,
        item_ref_id: item.item_id,
        option_id: 0,
        extra_details: option.extra_details,
        alternative_title: option.alternative_title,
        option_ref_id: option.option_ref_id,
      };
      addons.push(data);
    });
  }
  return addons;
}

async function repeateOrder(billDetails) {
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  const items = billDetails.order_items || billDetails.billedItems;
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        {
          if (!window.globalcurrenttableId) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:orderController.pleaseSelectTheTable'),
            );
            return;
          }
          const table = $(`#${window.globalcurrenttableId}`)[0].data;
          const tableDeptId = table['mpos_department.id'];
          // billDetails.order_items.forEach(async (item) => {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const currentclickedItem = $(`[item_refid=${item.item_id}]`)[0];
            let currentitem = {};
            if (currentclickedItem && currentclickedItem.data) {
              currentitem.data = cloneDeep(currentclickedItem.data);
              currentitem.data.item_refid = Number(item.item_id);
              if (window.isMultipricingEnabled) {
                currentitem = checkforMultipricingbydept(
                  currentitem,
                  tableDeptId,
                  false,
                  true,
                );
                currentitem.data.option_price = currentitem.data.price;
              }
              currentitem.data.quantity = item.quantity;
              currentitem.data.isitemwithOption = false;
              currentitem.data.repeateOrderItem = true;
              currentitem.data.isDiscounteditem =
                item?.extra_details?.isDiscounteditem;

              if (currentitem.data.has_modifiers) {
                Object.assign(currentitem.data, {
                  has_options: true,
                });
              }
              if (item.item_options && item.item_options.length) {
                currentitem.data.option_price =
                  currentitem.data.sale_price ||
                  currentitem.data.original_sale_price ||
                  0;
                currentitem.data.isitemwithOption = true;
                let totoalOptionsAmount = 0;
                const pricestoAdd = [];
                const addons = getItemAddons(item);
                if (addons && addons.length) {
                  addons.forEach((addon) => {
                    let newitem = addon;

                    if (window.isMultipricingEnabled) {
                      newitem = checkforMultipricingbydept(
                        addon,
                        tableDeptId,
                        true,
                      );
                      if (newitem.data) {
                        addon = { ...newitem.data };
                      }
                    }
                    if (addon.option_type === 0) {
                      totoalOptionsAmount += newitem.price;
                      currentitem.data.option_price = newitem.price;
                    }
                    if (
                      addon.extra_details &&
                      addon.option_type === 1 &&
                      addon.extra_details?.freeQty
                    ) {
                      if (addon.extra_details?.freeQty) {
                        const totalamt = addon.price * addon.qty;
                        let totalAmtToAdd = 0;
                        if (addon.qty < addon.extra_details.freeQty) {
                          totalAmtToAdd = 0;
                        } else {
                          totalAmtToAdd =
                            totalamt -
                            addon.price * addon.extra_details.freeQty;
                        }
                        pricestoAdd.push(totalAmtToAdd);
                      } else {
                        pricestoAdd.push(addon.price * addon.qty);
                      }
                    } else if (addon.option_type === 1) {
                      pricestoAdd.push(addon.price * addon.qty);
                    }
                  });
                }
                if (totoalOptionsAmount) {
                  currentitem.data.option_price = totoalOptionsAmount;
                }
                const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
                const total =
                  currentitem.data.option_price + Number(finalPrice);
                Object.assign(currentitem.data, {
                  addons,
                  has_options: 1,
                  isitemwithOption: true,
                  extra_details: item.extra_details,
                  option_price:
                    currentitem.data.option_price + Number(finalPrice),
                  titlewithOption: item.title,
                  price: currentitem.data.option_price + Number(finalPrice),
                  sale_price:
                    currentitem.data.option_price + Number(finalPrice),
                  amount: item.quantity * total,
                  title: item.title,
                  option_ref_id: window.uniqid.time(),
                  original_sale_price: currentitem.data.item_price,
                });
                let finalAmount = Number(currentitem.data.option_price);
                const amountBeforDiscount =
                  Number(currentitem.data.option_price) + finalPrice;
                if (currentitem.data.discount_rate > 0) {
                  if (currentitem.data.discount_type === 1) {
                    const discountAmt =
                      finalAmount * (currentitem.data.discount_rate / 100);
                    finalAmount -= discountAmt;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    // totoalOptionsAmount -= discountAmt;
                  } else {
                    finalAmount -= currentitem.data.discount_rate;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    totoalOptionsAmount -= currentitem.data.discount_rate;
                  }
                  currentitem.data.pricebeforeDiscount = amountBeforDiscount;
                  currentitem.data.discounted_price = finalAmount;
                  currentitem.data.price = finalAmount;
                  currentitem.data.amount = item.quantity * finalAmount;
                  currentitem.data.option_price = finalAmount;
                  if (currentitem.data.discounted_price)
                    currentitem.data.sale_price =
                      currentitem.data.discounted_price;
                }
              }
              if (
                currentitem &&
                currentitem.data &&
                (currentitem.data.is_open_item ||
                  currentitem.data.sale_price === 0)
              ) {
                currentitem.data.newopenitemName = item.title;
                currentitem.data.newopenPrice = item.price;
              }

              if (
                item &&
                item.extra_details &&
                item.extra_details.baseItemRefId &&
                item.extra_details.discountRate
              ) {
                currentitem.data.sale_price = item.extra_details.newPrice;
                currentitem.data.price = item.extra_details.newPrice;
                currentitem.data.item_price = item.extra_details.newPrice;
              }
              // && !item.extra_details?.baseItemRefId
              if (item) {
                window.putproductinDinein(currentitem, false, true);
              }
            }
          }
        }
        break;
      case TAKEAWAY_TAB_ID:
        // eslint-disable-next-line no-lone-blocks
        {
          items.forEach((item) => {
            const currentclickedItem = $(`[item_refid=${item.item_id}]`)[0];
            let currentitem = {};
            if (currentclickedItem && currentclickedItem.data) {
              currentitem.data = cloneDeep(currentclickedItem.data);
              currentitem.data.item_refid = Number(item.item_id);
              if (window.isMultipricingEnabled) {
                currentitem = checkforMultipricing(currentitem, 2, false, true);
                currentitem.data.option_price = currentitem.data.price;
              }
              currentitem.data.quantity = item.quantity;
              currentitem.data.isitemwithOption = false;
              currentitem.data.repeateOrderItem = true;
              currentitem.data.isDiscounteditem =
                item?.extra_details?.isDiscounteditem;

              if (currentitem.data.has_modifiers) {
                Object.assign(currentitem.data, {
                  has_options: true,
                });
              }
              if (item.item_options && item.item_options.length) {
                currentitem.data.option_price =
                  currentitem.data.sale_price ||
                  currentitem.data.original_sale_price ||
                  0;
                currentitem.data.isitemwithOption = true;
                let totoalOptionsAmount = 0;
                const pricestoAdd = [];
                const addons = getItemAddons(item);
                if (addons && addons.length) {
                  addons.forEach((addon) => {
                    let newitem = addon;
                    if (window.isMultipricingEnabled) {
                      newitem = checkforMultipricing(addon, 2, true);
                    }
                    if (addon.option_type === 0) {
                      totoalOptionsAmount += newitem.price;
                      currentitem.data.option_price = newitem.price;
                    }
                    if (
                      addon.extra_details &&
                      addon.option_type === 1 &&
                      addon.extra_details?.freeQty
                    ) {
                      if (addon.extra_details?.freeQty) {
                        const totalamt = addon.price * addon.qty;
                        let totalAmtToAdd = 0;
                        if (addon.qty < addon.extra_details.freeQty) {
                          totalAmtToAdd = 0;
                        } else {
                          totalAmtToAdd =
                            totalamt -
                            addon.price * addon.extra_details.freeQty;
                        }
                        pricestoAdd.push(totalAmtToAdd);
                      } else {
                        pricestoAdd.push(addon.price * addon.qty);
                      }
                    } else if (addon.option_type === 1) {
                      pricestoAdd.push(addon.price * addon.qty);
                    }
                  });
                }
                if (totoalOptionsAmount) {
                  currentitem.data.option_price = totoalOptionsAmount;
                }
                const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
                const total =
                  currentitem.data.option_price + Number(finalPrice);
                Object.assign(currentitem.data, {
                  addons,
                  has_options: 1,
                  isitemwithOption: true,
                  extra_details: item.extra_details,
                  option_price:
                    currentitem.data.option_price + Number(finalPrice),
                  price: currentitem.data.option_price + Number(finalPrice),
                  sale_price:
                    currentitem.data.option_price + Number(finalPrice),
                  amount: item.quantity * total,
                  titlewithOption: item.title,
                  title: item.title,
                  option_ref_id: window.uniqid.time(),
                  original_sale_price: currentitem.data.item_price,
                });
                let finalAmount = Number(currentitem.data.option_price);
                const amountBeforDiscount =
                  Number(currentitem.data.option_price) + finalPrice;
                if (currentitem.data.discount_rate > 0) {
                  if (currentitem.data.discount_type === 1) {
                    const discountAmt =
                      finalAmount * (currentitem.data.discount_rate / 100);
                    finalAmount -= discountAmt;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    // totoalOptionsAmount -= discountAmt;
                  } else {
                    finalAmount -= currentitem.data.discount_rate;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    totoalOptionsAmount -= currentitem.data.discount_rate;
                  }
                  currentitem.data.pricebeforeDiscount = amountBeforDiscount;
                  currentitem.data.discounted_price = finalAmount;
                  currentitem.data.price = finalAmount;
                  currentitem.data.amount = item.quantity * finalAmount;
                  currentitem.data.option_price = finalAmount;
                  if (currentitem.data.discounted_price)
                    currentitem.data.sale_price =
                      currentitem.data.discounted_price;
                }
              }
              if (
                currentitem &&
                currentitem.data &&
                (currentitem.data.is_open_item || currentitem.data.open_price)
              ) {
                currentitem.data.newopenitemName = item.title;
                currentitem.data.newopenPrice = item.price;
              }

              if (
                item &&
                item.extra_details &&
                item.extra_details.baseItemRefId &&
                item.extra_details.discountRate
              ) {
                currentitem.data.sale_price = item.extra_details.newPrice;
                currentitem.data.price = item.extra_details.newPrice;
                currentitem.data.item_price = item.extra_details.newPrice;
              }
              if (item) {
                // && !item.extra_details?.baseItemRefId
                window.putproductinTakeaway(currentitem, false, true);
              }
            }
          });
        }
        break;
      case DELIVERY_TAB_ID:
        // eslint-disable-next-line no-lone-blocks
        {
          items.forEach((item) => {
            const currentclickedItem = $(`[item_refid=${item.item_id}]`)[0];
            let currentitem = {};
            if (currentclickedItem && currentclickedItem.data) {
              currentitem.data = cloneDeep(currentclickedItem.data);
              currentitem.data.item_refid = Number(item.item_id);
              if (window.isMultipricingEnabled) {
                currentitem = checkforMultipricing(currentitem, 3, false, true);
                currentitem.data.option_price = currentitem.data.price;
              }

              currentitem.data.quantity = item.quantity;
              currentitem.data.isitemwithOption = false;
              currentitem.data.repeateOrderItem = true;
              currentitem.data.isDiscounteditem =
                item?.extra_details?.isDiscounteditem;
              if (currentitem.data.has_modifiers) {
                Object.assign(currentitem.data, {
                  has_options: true,
                });
              }
              if (item.item_options && item.item_options.length) {
                currentitem.data.option_price =
                  currentitem.data.sale_price ||
                  currentitem.data.original_sale_price ||
                  0;
                currentitem.data.isitemwithOption = true;
                let totoalOptionsAmount = 0;
                const pricestoAdd = [];
                const addons = getItemAddons(item);
                if (addons && addons.length) {
                  addons.forEach((addon) => {
                    let newItem = addon;
                    if (window.isMultipricingEnabled) {
                      newItem = checkforMultipricing(addon, 3, true);
                      if (newItem.data) {
                        addon = { ...newItem.data };
                      }
                    }
                    if (addon.option_type === 0) {
                      totoalOptionsAmount += newItem.price;
                      currentitem.data.option_price = newItem.price;
                    }
                    if (
                      addon.extra_details &&
                      addon.option_type === 1 &&
                      addon.extra_details?.freeQty
                    ) {
                      if (addon.extra_details?.freeQty) {
                        const totalamt = addon.price * addon.qty;
                        let totalAmtToAdd = 0;
                        if (addon.qty < addon.extra_details.freeQty) {
                          totalAmtToAdd = 0;
                        } else {
                          totalAmtToAdd =
                            totalamt -
                            addon.price * addon.extra_details.freeQty;
                        }
                        pricestoAdd.push(totalAmtToAdd);
                      } else {
                        pricestoAdd.push(addon.price * addon.qty);
                      }
                    } else if (addon.option_type === 1) {
                      pricestoAdd.push(addon.price * addon.qty);
                    }
                  });
                }
                if (totoalOptionsAmount) {
                  currentitem.data.option_price = totoalOptionsAmount;
                }

                const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
                const total =
                  currentitem.data.option_price + Number(finalPrice);
                Object.assign(currentitem.data, {
                  addons,
                  has_options: 1,
                  isitemwithOption: true,
                  extra_details: item.extra_details,
                  option_price:
                    currentitem.data.option_price + Number(finalPrice),
                  price: currentitem.data.option_price + Number(finalPrice),
                  sale_price:
                    currentitem.data.option_price + Number(finalPrice),
                  amount: item.quantity * total,
                  titlewithOption: item.title,
                  title: item.title,
                  option_ref_id: window.uniqid.time(),
                  original_sale_price: currentitem.data.item_price,
                });
                let finalAmount = Number(currentitem.data.option_price);
                const amountBeforDiscount =
                  Number(currentitem.data.option_price) + finalPrice;
                if (currentitem.data.discount_rate > 0) {
                  if (currentitem.data.discount_type === 1) {
                    const discountAmt =
                      finalAmount * (currentitem.data.discount_rate / 100);
                    finalAmount -= discountAmt;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    // totoalOptionsAmount -= discountAmt;
                  } else {
                    finalAmount -= currentitem.data.discount_rate;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    totoalOptionsAmount -= currentitem.data.discount_rate;
                  }
                  currentitem.data.pricebeforeDiscount = amountBeforDiscount;
                  currentitem.data.discounted_price = finalAmount;
                  currentitem.data.price = finalAmount;
                  currentitem.data.amount = item.quantity * finalAmount;
                  currentitem.data.option_price = finalAmount;
                  if (currentitem.data.discounted_price)
                    currentitem.data.sale_price =
                      currentitem.data.discounted_price;
                }
              }
              if (
                currentitem &&
                currentitem.data &&
                (currentitem.data.is_open_item ||
                  currentitem.data.sale_price === 0)
              ) {
                currentitem.data.newopenitemName = item.title;
                currentitem.data.newopenPrice = item.price;
              }

              if (
                item &&
                item.extra_details &&
                item.extra_details.baseItemRefId &&
                item.extra_details.discountRate
              ) {
                currentitem.data.sale_price = item.extra_details.newPrice;
                currentitem.data.price = item.extra_details.newPrice;
                currentitem.data.item_price = item.extra_details.newPrice;
              }
              if (item) {
                // && !item.extra_details?.baseItemRefId
                window.putproductinDelivery(currentitem, false, true);
              }
            }
          });
        }
        break;
      case QUICK_TAB_ID:
        // eslint-disable-next-line no-lone-blocks
        {
          items.forEach((item) => {
            const currentclickedItem = $(`[item_refid=${item.item_id}]`)[0];
            let currentitem = {};
            if (currentclickedItem && currentclickedItem.data) {
              currentitem.data = cloneDeep(currentclickedItem.data);
              currentitem.data.item_refid = Number(item.item_id);
              if (window.isMultipricingEnabled) {
                currentitem = checkforMultipricing(
                  currentitem,
                  window.defaultcustomerQuickordertype,
                  false,
                  true,
                );
              }
              currentitem.data.option_price = currentitem.data.price;
              currentitem.data.quantity = item.quantity;
              currentitem.data.isitemwithOption = false;
              currentitem.data.repeateOrderItem = true;
              currentitem.data.isDiscounteditem =
                item?.extra_details?.isDiscounteditem;

              if (currentitem.data.has_modifiers) {
                Object.assign(currentitem.data, {
                  has_options: true,
                });
              }
              if (item.item_options && item.item_options.length) {
                currentitem.data.option_price =
                  currentitem.data.sale_price ||
                  currentitem.data.original_sale_price ||
                  0;
                currentitem.data.isitemwithOption = true;
                let totoalOptionsAmount = 0;
                const pricestoAdd = [];
                const addons = getItemAddons(item);
                if (addons && addons.length) {
                  addons.forEach((addon) => {
                    let newitem = addon;
                    if (window.isMultipricingEnabled) {
                      newitem = checkforMultipricing(
                        addon,
                        window.defaultcustomerQuickordertype,
                        true,
                      );
                    }
                    if (addon.option_type === 0) {
                      totoalOptionsAmount += newitem.price;
                      currentitem.data.option_price = newitem.price;
                    }
                    if (
                      addon.extra_details &&
                      addon.option_type === 1 &&
                      addon.extra_details?.freeQty
                    ) {
                      if (addon.extra_details?.freeQty) {
                        const totalamt = addon.price * addon.qty;
                        let totalAmtToAdd = 0;
                        if (addon.qty < addon.extra_details.freeQty) {
                          totalAmtToAdd = 0;
                        } else {
                          totalAmtToAdd =
                            totalamt -
                            addon.price * addon.extra_details.freeQty;
                        }
                        pricestoAdd.push(totalAmtToAdd);
                      } else {
                        pricestoAdd.push(addon.price * addon.qty);
                      }
                    } else if (addon.option_type === 1) {
                      pricestoAdd.push(addon.price * addon.qty);
                    }
                  });
                }
                if (totoalOptionsAmount) {
                  currentitem.data.option_price = totoalOptionsAmount;
                }
                const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
                const total =
                  currentitem.data.option_price + Number(finalPrice);

                Object.assign(currentitem.data, {
                  addons,
                  has_options: 1,
                  isitemwithOption: true,
                  extra_details: item.extra_details,
                  option_price:
                    currentitem.data.option_price + Number(finalPrice),
                  price: currentitem.data.option_price + Number(finalPrice),
                  sale_price:
                    currentitem.data.option_price + Number(finalPrice),
                  amount: item.quantity * total,
                  titlewithOption: item.title,
                  title: item.title,
                  option_ref_id: window.uniqid.time(),
                  original_sale_price: currentitem.data.item_price,
                });
                let finalAmount = Number(currentitem.data.option_price);
                const amountBeforDiscount =
                  Number(currentitem.data.option_price) + finalPrice;
                if (currentitem.data.discount_rate > 0) {
                  if (currentitem.data.discount_type === 1) {
                    const discountAmt =
                      finalAmount * (currentitem.data.discount_rate / 100);
                    finalAmount -= discountAmt;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    // totoalOptionsAmount -= discountAmt;
                  } else {
                    finalAmount -= currentitem.data.discount_rate;
                    finalAmount = Number(
                      finalAmount.toFixed(window.ROUNDOFF_UPTO),
                    );
                    totoalOptionsAmount -= currentitem.data.discount_rate;
                  }
                  currentitem.data.pricebeforeDiscount = amountBeforDiscount;
                  currentitem.data.discounted_price = finalAmount;
                  currentitem.data.price = finalAmount;
                  currentitem.data.amount = item.quantity * finalAmount;
                  currentitem.data.option_price = finalAmount;
                  if (currentitem.data.discounted_price)
                    currentitem.data.sale_price =
                      currentitem.data.discounted_price;
                }
              }
              if (
                currentitem &&
                currentitem.data &&
                (currentitem.data.is_open_item ||
                  currentitem.data.sale_price === 0)
              ) {
                currentitem.data.newopenitemName = item.title;
                currentitem.data.newopenPrice = item.price;
              }
              if (
                item &&
                item.extra_details &&
                item.extra_details.baseItemRefId &&
                item.extra_details.discountRate
              ) {
                currentitem.data.sale_price = item.extra_details.newPrice;
                currentitem.data.price = item.extra_details.newPrice;
                currentitem.data.item_price = item.extra_details.newPrice;
              }
              if (item) {
                // && !item.extra_details?.baseItemRefId
                window.putproductinQuickbill(currentitem, false, true);
              }
            }
          });
        }
        break;
      default:
        break;
    }
  }

  // console.log('billDetails.order_items::', billDetails.order_items);
  // get addons
  // billDetails.order_items.find(async (item) => {
  //   if (item.item_options && item.item_options.length) {
  //     const addons = [];
  //     item.item_options.forEach((option) => {
  //       const data = {
  //         item_refid: item.item_id,
  //         item_id: item.item_id,
  //         optionGrptitle: '',
  //         opt_grp_ref_ids: option.option_group_ref_id,
  //         ref_id: option.option_ref_id,
  //         title: option.title,
  //         price: option.price,
  //         option_tax: option.tax_per,
  //         qty: option.qty,
  //         option_type: option.type,
  //         item_ref_id: item.item_id,
  //         option_id: 0,
  //         extra_details: option.extra_details,
  //         alternative_title: option.alternative_title,
  //       };
  //       addons.push(data)
  //     });
  //   }
  //   // const data ={}
  //   // const result = await getItemAddons(item)
  // });
  // const addons = await getItemAddons();
  $('#customerHistoryBodyid').modal('hide');
  $('#customerHistorymodal').modal('hide');
}
async function showbilldetailsinSwal(html, billDetails) {
  const result = await window.Swal.fire({
    title: $.i18n.t('controller:billDetailsController.billDetails'),
    html,
    height: '77vh',
    width: '66vw',
    showCancelButton: true,
    focusConfirm: false,
    customClass: {
      popup: 'tmbill-swal-pop-up bill-details-popup',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class swal2-content-for-billdetails',
    },
    cancelButtonText: $.i18n.t('common:button.OK'),
    confirmButtonText: $.i18n.t('billDetails.repeatOrder'),
    reverseButtons: true,
    didOpen: () => {
      $('.swal2-html-container .has-i18n').localize();
    },
  });

  if (result && result.isConfirmed) {
    repeateOrder(billDetails);
  }
}

function initialize() {
  if ($.i18n) {
    initializei18nforBilldetailwindowui();
  } else {
    setTimeout(initializei18nforBilldetailwindowui, 400);
  }
}

initialize();
