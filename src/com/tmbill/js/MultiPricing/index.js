/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const { cloneDeep } = require('lodash');
const { calculateDiscountForItem } = require('../calculations');
const { safeParse } = require('../../util/RendererUtils');

function checkforMultipricing(
  clickedItembutton,
  order_type,
  isModifierItem,
  modifierBaseItem = false,
) {
  if (!window.isMultipricingEnabled) {
    return clickedItembutton;
  }
  try {
    let itemData = clickedItembutton.data;
    if (!itemData) {
      itemData = clickedItembutton;
    }

    if (!itemData.item_refid && itemData.item_id) {
      Object.assign(itemData, {
        item_refid: itemData.item_id,
      });
    }
    if (
      window.multipricingSetting &&
      window.multipricingSetting.order_type_wise &&
      (itemData?.sale_price_1 !== 0 ||
        itemData?.sale_price_2 !== 0 ||
        itemData?.sale_price_3 !== 0 ||
        itemData?.sale_price_4 !== 0 ||
        itemData?.sale_price_5 !== 0)
    ) {
      const itemPrice = window.multipricingSetting.order_type_wise.find(
        (o) => o.id === order_type,
      );

      if (itemPrice) {
        const sale_price = itemData[itemPrice.price_field];
        if (sale_price) {
          itemData = cloneDeep(itemData);
          clickedItembutton = cloneDeep(clickedItembutton);
          clickedItembutton.data = itemData;

          itemData.sale_price = sale_price;
          itemData.price = sale_price;
          if (
            itemData.sale_price &&
            itemData.pricebeforeDiscount !== itemData.sale_price
          ) {
            itemData.pricebeforeDiscount = itemData.sale_price;
          }
          if (itemData.pricebeforeDiscount && itemData.discounted_price) {
            calculateDiscountForItem(itemData);
          }
        }
      }
    }

    if (
      window.itemPricesMapping &&
      Object.keys(window.itemPricesMapping).length > 0
    ) {
      if (window.itemPricesMapping) {
        const pricesData =
          window.itemPricesMapping[itemData.item_refid] ||
          window.itemPricesMapping[itemData.item_id];

        if (pricesData) {
          const priceData = pricesData.find((p) => p.ref === order_type);
          if (priceData) {
            let sale_price = priceData.price;
            if (isModifierItem && priceData.extra_details) {
              const extra_details = safeParse(priceData.extra_details);
              if (extra_details && String(extra_details.price_for_modifier)) {
                sale_price = extra_details.price_for_modifier;
              }
            }
            // itemData.price = sale_price;
            if (sale_price != undefined && String(sale_price)) {
              itemData = cloneDeep(itemData);
              clickedItembutton = cloneDeep(clickedItembutton);
              clickedItembutton.data = itemData;

              itemData.sale_price = sale_price;
              itemData.price = sale_price;
              itemData.item_price = sale_price;
              itemData.amount = Number(itemData.sale_price) * itemData.quantity;
              itemData.recalculatedAmount =
                Number(itemData.sale_price) * itemData.quantity;
              if (itemData.pricebeforeDiscount !== itemData.sale_price) {
                itemData.pricebeforeDiscount = itemData.sale_price;
              }

              // if item is base item then no need to calculate discount as we calculate discount after adding into order
              if (itemData.pricebeforeDiscount && !modifierBaseItem) {
                calculateDiscountForItem(itemData);
              }

              // if discounted item then don't pick multiprice
              if (
                itemData.isDiscounteditem &&
                Object.values(itemData.isDiscounteditem).length
              ) {
                sale_price = itemData.isDiscounteditem.newPrice;
                itemData.sale_price = sale_price;
                itemData.price = sale_price;
                itemData.item_price = sale_price;
                itemData.amount =
                  Number(itemData.sale_price) * itemData.quantity;
                itemData.recalculatedAmount =
                  Number(itemData.sale_price) * itemData.quantity;
              }
            }
          } else {
            // check if item is modifier then check price in modifiers
            // if item having group_id means item is mofifier item
            let posItem;
            if (itemData.group_id) {
              posItem = window.modifiersList.find(
                (p) => p.item_id === itemData.item_refid,
              );
            } else {
              posItem = window.allItemsList.find(
                (p) => p.item_refid === itemData.item_refid,
              );
            }
            if (posItem) {
              let { sale_price } = posItem;
              if (posItem.price !== undefined && String(posItem.price)) {
                sale_price = posItem.price;
              }
              let checkForDiscount = false;
              if (sale_price !== itemData.sale_price) {
                checkForDiscount = true;
              }

              if (modifierBaseItem) {
                checkForDiscount = false;
              }
              if (sale_price != undefined && String(sale_price)) {
                itemData = cloneDeep(itemData);
                clickedItembutton = cloneDeep(clickedItembutton);
                clickedItembutton.data = itemData;
                itemData.sale_price = sale_price;
                itemData.price = sale_price;
                itemData.item_price = sale_price;
                itemData.amount =
                  Number(itemData.sale_price) * itemData.quantity;
                itemData.recalculatedAmount =
                  Number(itemData.sale_price) * itemData.quantity;

                // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
                //   itemData.pricebeforeDiscount = itemData.sale_price;
                // }
                if (itemData.pricebeforeDiscount && checkForDiscount) {
                  calculateDiscountForItem(itemData);
                }

                // if discounted item then don't pick multiprice
                if (
                  itemData.isDiscounteditem &&
                  Object.values(itemData.isDiscounteditem).length
                ) {
                  sale_price = itemData.isDiscounteditem.newPrice;
                  itemData.sale_price = sale_price;
                  itemData.price = sale_price;
                  itemData.item_price = sale_price;
                  itemData.amount =
                    Number(itemData.sale_price) * itemData.quantity;
                  itemData.recalculatedAmount =
                    Number(itemData.sale_price) * itemData.quantity;
                }
              }
            }
          }
        } else {
          const posItem = window.allItemsList.find(
            (p) => p.item_refid === itemData.item_refid,
          );
          if (posItem) {
            const { sale_price } = posItem;
            if (sale_price != undefined && String(sale_price)) {
              itemData = cloneDeep(itemData);
              clickedItembutton = cloneDeep(clickedItembutton);
              clickedItembutton.data = itemData;
              itemData.sale_price = sale_price;
              itemData.price = sale_price;
              itemData.item_price = sale_price;
              itemData.amount = Number(itemData.sale_price) * itemData.quantity;
              itemData.recalculatedAmount =
                Number(itemData.sale_price) * itemData.quantity;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return clickedItembutton;
}

function checkforMultipricingbydept(
  clickedItembutton,
  deptId,
  isModifierItem,
  modifierBaseItem = false,
) {
  if (!window.isMultipricingEnabled) {
    return clickedItembutton;
  }
  try {
    let itemData = clickedItembutton.data;
    if (!itemData) {
      itemData = clickedItembutton;
    }

    if (!itemData.item_refid && itemData.item_id) {
      Object.assign(itemData, {
        item_refid: itemData.item_id,
      });
    }
    if (
      (itemData?.sale_price_1 !== 0 ||
        itemData?.sale_price_2 !== 0 ||
        itemData?.sale_price_3 !== 0 ||
        itemData?.sale_price_4 !== 0 ||
        itemData?.sale_price_5 !== 0) &&
      window.multipricingSetting &&
      window.multipricingSetting.table_department_wise
    ) {
      const itemPrice = window.multipricingSetting.table_department_wise.find(
        (o) => o.id == deptId,
      );
      if (itemPrice) {
        const sale_price = itemData[itemPrice.price_field];
        if (sale_price) {
          itemData = cloneDeep(itemData);
          clickedItembutton = cloneDeep(clickedItembutton);
          clickedItembutton.data = itemData;
          itemData.sale_price = sale_price;

          if (itemData.pricebeforeDiscount !== itemData.sale_price) {
            itemData.pricebeforeDiscount = itemData.sale_price;
          }

          if (itemData.pricebeforeDiscount) {
            calculateDiscountForItem(itemData);
          }
        }
      }
      // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
      //   itemData.pricebeforeDiscount = itemData.sale_price;
      // }
    }

    if (
      window.itemPricesMapping &&
      Object.keys(window.itemPricesMapping).length > 0
    ) {
      const pricesData =
        window.itemPricesMapping[itemData.item_refid] ||
        window.itemPricesMapping[itemData.item_id];
      if (pricesData) {
        const priceData = pricesData.find((p) => p.ref === deptId);
        if (priceData) {
          let sale_price = priceData.price;
          if (isModifierItem && priceData.extra_details) {
            const extra_details = safeParse(priceData.extra_details);
            if (extra_details && String(extra_details.price_for_modifier)) {
              sale_price = extra_details.price_for_modifier;
            }
          }
          if (sale_price != undefined && String(sale_price)) {
            itemData = cloneDeep(itemData);
            clickedItembutton = cloneDeep(clickedItembutton);
            clickedItembutton.data = itemData;

            itemData.sale_price = sale_price;
            itemData.price = sale_price;
            itemData.item_price = sale_price;
            itemData.amount = Number(itemData.sale_price) * itemData.quantity;
            itemData.recalculatedAmount =
              Number(itemData.sale_price) * itemData.quantity;
            if (itemData.pricebeforeDiscount !== itemData.sale_price) {
              itemData.pricebeforeDiscount = itemData.sale_price;
            }

            // if item is base item then no need to calculate discount as we calculate discount after adding into order
            if (itemData.pricebeforeDiscount && !modifierBaseItem) {
              calculateDiscountForItem(itemData);
            }
            // if discounted item then don't pick multiprice
            if (
              itemData.isDiscounteditem &&
              Object.values(itemData.isDiscounteditem).length
            ) {
              sale_price = itemData.isDiscounteditem.newPrice;
              itemData.sale_price = sale_price;
              itemData.price = sale_price;
              itemData.item_price = sale_price;
              itemData.amount = Number(itemData.sale_price) * itemData.quantity;
              itemData.recalculatedAmount =
                Number(itemData.sale_price) * itemData.quantity;
            }
          }
        } else {
          let posItem;
          if (itemData.option_ref_id) {
            posItem = window.modifiersList.find(
              (p) => p.item_id === itemData.item_refid,
            );
          } else {
            posItem = window.allItemsList.find(
              (p) => p.item_refid === itemData.item_refid,
            );
          }
          if (posItem) {
            let { sale_price } = posItem;
            if (posItem.price != undefined && String(posItem.price)) {
              sale_price = posItem.price;
            }
            let checkForDiscount = false;
            if (sale_price !== itemData.sale_price) {
              checkForDiscount = true;
            }
            if (modifierBaseItem) {
              checkForDiscount = false;
            }
            if (sale_price) {
              itemData = cloneDeep(itemData);
              clickedItembutton = cloneDeep(clickedItembutton);
              clickedItembutton.data = itemData;
              itemData.sale_price = sale_price;
              itemData.price = sale_price;
              itemData.item_price = sale_price;
              if (itemData.pricebeforeDiscount && checkForDiscount) {
                calculateDiscountForItem(itemData);
              }

              // if discounted item then don't pick multiprice
              if (
                itemData.isDiscounteditem &&
                Object.values(itemData.isDiscounteditem).length
              ) {
                sale_price = itemData.isDiscounteditem.newPrice;
                itemData.sale_price = sale_price;
                itemData.price = sale_price;
                itemData.item_price = sale_price;
                itemData.amount =
                  Number(itemData.sale_price) * itemData.quantity;
                itemData.recalculatedAmount =
                  Number(itemData.sale_price) * itemData.quantity;
              }
            }
          }
        }
        // To make sure discount on item level do not go in minus
        // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
        //   itemData.pricebeforeDiscount = itemData.sale_price;
        // }
      } else {
        const posItem = window.allItemsList.find(
          (p) => p.item_refid === itemData.item_refid,
        );
        if (posItem) {
          const { sale_price } = posItem;
          if (sale_price) {
            itemData = cloneDeep(itemData);
            clickedItembutton = cloneDeep(clickedItembutton);
            clickedItembutton.data = itemData;
            itemData.sale_price = sale_price;
            itemData.price = sale_price;
            itemData.item_price = sale_price;
            // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
            //   itemData.pricebeforeDiscount = itemData.sale_price;
            // }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return clickedItembutton;
}

module.exports = {
  checkforMultipricing,
  checkforMultipricingbydept,
};
