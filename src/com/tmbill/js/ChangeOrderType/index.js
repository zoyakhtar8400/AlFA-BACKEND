/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
const { cloneDeep } = require('lodash');
const {
  checkforMultipricing,
  checkforMultipricingbydept,
} = require('../MultiPricing');
const {
  QUICK_BILLTABLE,
  DINEIN_KOTTABLE,
  TAKEAWAY_KOTTABLE,
  DELIVERY_KOTTABLE,
} = require('../../util/Constants');
const { BillingTypes } = require('../../util/DBUtil');

function checkExcludeItem(item, order_type) {
  // const billintTypes = cloneDeep(BillingTypes);
  const billintTypes = cloneDeep(window.orderTypes);
  // chaning dine in value becasuse for exculde it is coming 'dinein' and billing type it is 'Dine-In'
  billintTypes[1].order_type = 'dinein';
  const orderTypeGroupList = String(item.excludePlaforms).split(',');
  const exists = orderTypeGroupList.some(
    (i) =>
      i.toLowerCase() === billintTypes[order_type].order_type.toLowerCase(),
  );
  return exists;
}

function transferTableItems({
  items,
  orderType,
  currentTable,
  itemsList,
  tableDeptId,
}) {
  if (items) {
    const orderItems = [];
    items.forEach((item) => {
      let addItemToKot = true;
      if (window.itemFileterByOrderType) {
        const isItemExcluded = checkExcludeItem(item, orderType);
        if (isItemExcluded) {
          addItemToKot = false;
        }
      }
      // if (window.itemFileterByOrderType) {
      //   if (!$(`#item_${item.short_code}`).is(':visible')) {
      //     addItemToKot = false;
      //   }
      // }

      if (addItemToKot) {
        // for open item no need of multipricing

        let isOpenItem = false;
        if (item.extra_details && item.extra_details.isOpenItem) {
          isOpenItem = true;
        }
        let isModifierItem = false;
        if (item.addons && item.addons.length) {
          isModifierItem = true;
          item.option_price =
            item.original_pricebeforeDiscount ||
            item.original_sale_price ||
            item.price ||
            0;
        }

        if (window.isMultipricingEnabled && !isOpenItem) {
          if (tableDeptId) {
            item = checkforMultipricingbydept(
              item,
              tableDeptId,
              false,
              isModifierItem,
            );
          } else {
            item = checkforMultipricing(item, orderType, false, isModifierItem);
          }
          if (item.data) {
            item = { ...item.data };
          }
          item.option_price = item.sale_price || item.price || 0;
        }
        // item.option_price = item.original_sale_price || item.price || 0;

        item.quantity = item.quantity;
        if (item.addons && item.addons.length) {
          let totoalOptionsAmount = 0;
          const pricestoAdd = [];
          const addons = item.addons;
          if (addons && addons.length) {
            addons.forEach((addon) => {
              addon = cloneDeep(addon);
              addon.item_refid = addon.option_ref_id;
              let newitem = addon;
              if (window.isMultipricingEnabled) {
                if (tableDeptId) {
                  newitem = checkforMultipricingbydept(
                    addon,
                    tableDeptId,
                    true,
                  );
                } else {
                  newitem = checkforMultipricing(addon, orderType, true);
                }
                if (newitem.data) {
                  addon = { ...newitem.data };
                }
              }
              if (addon.option_type === 0) {
                totoalOptionsAmount += Number(addon.price);
                item.option_price = Number(addon.price);
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
                      totalamt - addon.price * addon.extra_details.freeQty;
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
          if (!totoalOptionsAmount) {
            let posItem = window.allItemsList.find(
              (p) => p.item_refid === item.item_id,
            );
            if (!posItem) {
              posItem = window.allItemsList.find(
                (p) => p.item_refid === item.item_refid,
              );
            }
            if (posItem) {
              if (window.isMultipricingEnabled) {
                // const newItem = checkforMultipricing(
                //   item,
                //   orderType,
                //   false, // isModifierItem
                //   true, // modifierBaseItem
                // );
                let newItem;
                if (tableDeptId) {
                  newItem = checkforMultipricingbydept(
                    item,
                    tableDeptId,
                    false,
                    true,
                  );
                } else {
                  newItem = checkforMultipricing(item, orderType, false, true);
                }
                if (newItem && newItem.data && newItem.data.price) {
                  totoalOptionsAmount = newItem.data.price;
                }
              }
            }
          }
          if (totoalOptionsAmount) {
            item.option_price = totoalOptionsAmount;
          }
          const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
          let total = item.option_price + Number(finalPrice);
          Object.assign(item, {
            addons,
            has_options: 1,
            isitemwithOption: true,
            extra_details: item.extra_details,
            option_price: item.option_price + Number(finalPrice),
            price: item.option_price + Number(finalPrice),
            pricebeforeDiscount: item.option_price + Number(finalPrice),
            sale_price: item.option_price + Number(finalPrice),
            amount: item.quantity * total,
            titlewithOption: item.title,
            title: item.title,
          });

          let finalAmount = Number(item.option_price);
          // let amountBeforDiscount = Number(item.option_price) + finalPrice;
          let amountBeforDiscount = Number(item.option_price);

          amountBeforDiscount = amountBeforDiscount.toFixed(
            window.ROUNDOFF_UPTO,
          );
          if (item.discount_rate > 0) {
            if (item.discount_type === 1) {
              const discountAmt = finalAmount * (item.discount_rate / 100);
              finalAmount -= discountAmt;
              finalAmount = Number(finalAmount.toFixed(window.ROUNDOFF_UPTO));
              // totoalOptionsAmount -= discountAmt;
            } else {
              finalAmount -= item.discount_rate;
              finalAmount = Number(finalAmount.toFixed(window.ROUNDOFF_UPTO));
              totoalOptionsAmount -= item.discount_rate;
            }
            item.pricebeforeDiscount = amountBeforDiscount;
            item.discounted_price = finalAmount;
            item.price = finalAmount;
            item.original_sale_price =
              item.item_price || item.original_sale_price;
            item.amount = item.quantity * finalAmount;
            item.option_price = finalAmount;
            if (item.discounted_price) item.sale_price = item.discounted_price;
          }
        }
        orderItems.push(item);

        if (item.is_complementary == 1) {
          item.price = 0;
          item.sale_price = 0;
          item.amount = 0;
          item.item_tax_value = 0;

          if (item.option_price !== undefined) {
            item.option_price = 0;
          }
        }
      }
    });

    if (orderItems && orderItems.length) {
      itemsList = orderItems;

      switch (orderType) {
        case 1:
          // DINEIN_KOTTABLE
          break;
        case 2:
          window.refreshKotRowsFromRemote(TAKEAWAY_KOTTABLE, itemsList);
          break;
        case 3:
          // DELIVERY_KOTTABLE
          window.refreshKotRowsFromRemote(DELIVERY_KOTTABLE, itemsList);
          break;
        default:
          window.refreshKotRowsFromRemote(QUICK_BILLTABLE, itemsList);
          break;
      }
      //   refreshkotRows(QUICK_BILLTABLE, quickBillItems);
    }
    return itemsList;
    // precalculateDetailsCheck(quickbilltableButton);
  }
}

module.exports = {
  transferTableItems,
};
