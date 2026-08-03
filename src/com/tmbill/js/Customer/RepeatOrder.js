const { cloneDeep } = require('lodash');
const {
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
  TAKEAWAY_TAB_ID,
  DINEIN_TAB_ID,
} = require('../../util/Constants');
const {
  checkforMultipricing,
  checkforMultipricingbydept,
} = require('../MultiPricing');

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
        alternative_title: option.extra_details?.alternative_title,
        option_ref_id: option.option_ref_id,
      };
      addons.push(data);
    });
  }
  return addons;
}

async function repeateOrder(billDetails, modalId) {
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
              // if (item.extra_details && item.extra_details.priceChanged) {
              //   currentitem.data.price = item.price;
              //   currentitem.data.item_price = item.price;
              //   currentitem.data.sale_price = item.price;
              // }
              let isModifierBaseItem = false;
              if (item.item_options && item.item_options.length) {
                isModifierBaseItem = true;
              }
              if (window.isMultipricingEnabled) {
                currentitem = checkforMultipricingbydept(
                  currentitem,
                  tableDeptId,
                  false,
                  isModifierBaseItem,
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
                if (
                  currentitem.data.pricebeforeDiscount ||
                  currentitem.data.original_pricebeforeDiscount
                ) {
                  currentitem.data.option_price =
                    currentitem.data.original_pricebeforeDiscount ||
                    currentitem.data.pricebeforeDiscount ||
                    0;
                }

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
                      totoalOptionsAmount += addon.price;
                      currentitem.data.option_price = addon.price;
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
                const amountBeforDiscount = Number(
                  currentitem.data.option_price,
                );
                if (
                  currentitem.data.discount_rate > 0 ||
                  window.isMultipricingEnabled
                ) {
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

              if (
                item.item_options &&
                !item.item_options.length &&
                item.extra_details &&
                item.extra_details.has_modifiers &&
                item.extra_details.baseTitle
              ) {
                currentitem.data.titlewithOption = item.extra_details.baseTitle;
              }
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
                let isModifierBaseItem = false;
                if (item.item_options && item.item_options.length) {
                  isModifierBaseItem = true;
                }
                currentitem = checkforMultipricing(
                  currentitem,
                  2,
                  false,
                  isModifierBaseItem,
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
                if (
                  currentitem.data.pricebeforeDiscount ||
                  currentitem.data.original_pricebeforeDiscount
                ) {
                  currentitem.data.option_price =
                    currentitem.data.original_pricebeforeDiscount ||
                    currentitem.data.pricebeforeDiscount ||
                    0;
                }
                currentitem.data.isitemwithOption = true;
                let totoalOptionsAmount = 0;
                const pricestoAdd = [];
                const addons = getItemAddons(item);
                if (addons && addons.length) {
                  addons.forEach((addon) => {
                    let newitem = addon;
                    if (window.isMultipricingEnabled) {
                      newitem = checkforMultipricing(addon, 2, true);
                      if (newitem.data) {
                        addon = { ...newitem.data };
                      }
                    }
                    if (addon.option_type === 0) {
                      totoalOptionsAmount += addon.price;
                      currentitem.data.option_price = addon.price;
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
                const amountBeforDiscount = Number(
                  currentitem.data.option_price,
                );
                if (
                  currentitem.data.discount_rate > 0 ||
                  window.isMultipricingEnabled
                ) {
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
              if (
                item.item_options &&
                !item.item_options.length &&
                item.extra_details &&
                item.extra_details.has_modifiers &&
                item.extra_details.baseTitle
              ) {
                currentitem.data.titlewithOption = item.extra_details.baseTitle;
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
                if (window.isMultipricingEnabled) {
                  let isModifierBaseItem = false;
                  if (item.item_options && item.item_options.length) {
                    isModifierBaseItem = true;
                  }
                  currentitem = checkforMultipricing(
                    currentitem,
                    3,
                    false,
                    isModifierBaseItem,
                  );
                  currentitem.data.option_price = currentitem.data.price;
                }
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
                if (
                  currentitem.data.pricebeforeDiscount ||
                  currentitem.data.original_pricebeforeDiscount
                ) {
                  currentitem.data.option_price =
                    currentitem.data.original_pricebeforeDiscount ||
                    currentitem.data.pricebeforeDiscount ||
                    0;
                }
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
                      totoalOptionsAmount += addon.price;
                      currentitem.data.option_price = addon.price;
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
                const amountBeforDiscount = Number(
                  currentitem.data.option_price,
                );
                if (
                  currentitem.data.discount_rate > 0 ||
                  window.isMultipricingEnabled
                ) {
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
              if (
                item.item_options &&
                !item.item_options.length &&
                item.extra_details &&
                item.extra_details.has_modifiers &&
                item.extra_details.baseTitle
              ) {
                currentitem.data.titlewithOption = item.extra_details.baseTitle;
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
                let isModifierBaseItem = false;
                if (item.item_options && item.item_options.length) {
                  isModifierBaseItem = true;
                }
                currentitem = checkforMultipricing(
                  currentitem,
                  window.defaultcustomerQuickordertype,
                  false,
                  isModifierBaseItem,
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

                if (
                  currentitem.data.pricebeforeDiscount ||
                  currentitem.data.original_pricebeforeDiscount
                ) {
                  currentitem.data.option_price =
                    currentitem.data.original_pricebeforeDiscount ||
                    currentitem.data.pricebeforeDiscount ||
                    0;
                }
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
                      if (newitem.data) {
                        addon = { ...newitem.data };
                      }
                    }
                    if (addon.option_type === 0) {
                      totoalOptionsAmount += addon.price;
                      currentitem.data.option_price = addon.price;
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
                const amountBeforDiscount = Number(
                  currentitem.data.option_price,
                );
                if (
                  currentitem.data.discount_rate > 0 ||
                  window.isMultipricingEnabled
                ) {
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
              if (
                item.item_options &&
                !item.item_options.length &&
                item.extra_details &&
                item.extra_details.has_modifiers &&
                item.extra_details.baseTitle
              ) {
                currentitem.data.titlewithOption = item.extra_details.baseTitle;
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
  //   $('#customerHistoryBodyid').modal('hide');
  $(modalId).modal('hide');
  if (modalId !== '#customerFormModal') {
    $('#customerFormModal').modal('hide');
  }
}

module.exports = {
  repeateOrder,
};
