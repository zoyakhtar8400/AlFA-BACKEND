/* eslint-disable no-param-reassign */
const { cloneDeep } = require('lodash');
const { safeParse } = require('../../util/RendererUtils');
const {
  calculateDiscountForItem,
  calculateTaxForItem,
} = require('../calculations');
const { checkforMultipricingbydept, checkforMultipricing } = require('.');

/* eslint-disable camelcase */
function checkMultipricing({ selectedItems, department_id, order_type }) {
  if (selectedItems && selectedItems.length && department_id) {
    selectedItems.map((item) => {
      // for open item no need of multipricing
      let isOpenItem = false;
      if (item.extra_details && item.extra_details.isOpenItem) {
        isOpenItem = true;
      }
      if (!isOpenItem) {
        let totoalOptionsAmount = 0;
        let isVariantSelected = false;
        const pricestoAdd = [];
        if (item.addons && item.addons.length) {
          // after modifier selection item_price can change so get original price
          let posItem = window.allItemsList.find(
            (p) => p.item_refid === item.item_id,
          );
          if (posItem) {
            const { sale_price } = posItem;
            item.item_price = sale_price;
          }
          for (let i = 0; i < item.addons.length; i++) {
            const addon = item.addons[i];
            let itemData;
            itemData = window.optionsList.find(
              (o) => Number(o.ref_id) === Number(addon.option_ref_id),
            );

            if (!itemData) {
              itemData = window.modifiersList.find(
                (o) => Number(o.item_id) === Number(addon.option_ref_id),
              );
            }

            if (itemData) {
              if (
                (itemData?.sale_price_1 !== 0 ||
                  itemData?.sale_price_2 !== 0 ||
                  itemData?.sale_price_3 !== 0 ||
                  itemData?.sale_price_4 !== 0 ||
                  itemData?.sale_price_5 !== 0) &&
                window.multipricingSetting &&
                window.multipricingSetting.table_department_wise
              ) {
                const itemPrice =
                  window.multipricingSetting.table_department_wise.find(
                    (o) => Number(o.id) === Number(department_id),
                  );

                if (itemPrice) {
                  const sale_price = itemData[itemPrice.price_field];

                  if (sale_price) {
                    // itemData = cloneDeep(itemData)
                    // btn = cloneDeep(btn)
                    addon.item_price = sale_price;
                    addon.sale_price = sale_price;
                    addon.option_price = sale_price;
                    addon.option_total = sale_price;

                    addon.amount = sale_price * item.quantity;
                    if (addon.option_type == 1) {
                      const addonPrice = addon.option_qty * sale_price;
                      item.item_price = item.sale_price + addonPrice;
                      item.amount = item.sale_price + addonPrice;
                    } else {
                      item.item_price = sale_price;
                      item.amount = sale_price;
                    }

                    // if(addon.)
                    if (
                      itemData &&
                      itemData.pricebeforeDiscount &&
                      itemData.discounted_price
                    ) {
                      calculateDiscountForItem(itemData);
                    }
                  }
                } else {
                  const { sale_price } = itemData;

                  if (sale_price) {
                    // itemData = cloneDeep(itemData)
                    // btn = cloneDeep(btn)
                    item.item_price = sale_price;
                    item.sale_price = sale_price;
                    item.amount = sale_price * item.quantity;
                    if (
                      itemData &&
                      itemData.pricebeforeDiscount &&
                      itemData.discounted_price
                    ) {
                      calculateDiscountForItem(itemData);
                    }
                  }
                }
              }
            }

            if (window.itemPricesMapping) {
              const pricesData = window.itemPricesMapping[addon.option_ref_id];
              // if multipricing is not configured then set default price
              // addon prices not calculating properly (totoalOptionsAmount remains zero)
              const addonPrice = addon.option_price || Number(addon.price);
              if (pricesData || addonPrice) {
                const priceData = pricesData?.find(
                  (p) => p.ref === department_id,
                );
                if (priceData || addonPrice) {
                  let sale_price = priceData?.price || addonPrice;
                  if (priceData?.extra_details) {
                    const extra_details = safeParse(priceData.extra_details);
                    if (
                      extra_details &&
                      String(extra_details.price_for_modifier)
                    ) {
                      sale_price = extra_details.price_for_modifier;
                    }
                  }
                  if (String(sale_price)) {
                    if (String(sale_price)) {
                      addon.item_price = sale_price;
                      addon.sale_price = sale_price;
                      addon.option_price = sale_price;
                      addon.option_total = sale_price;

                      if (addon.option_type === 0) {
                        totoalOptionsAmount += addon.sale_price;
                        item.option_price = addon.sale_price;
                        isVariantSelected = true;
                      }
                      if (addon.extra_details) {
                        addon.extra_details = safeParse(addon.extra_details);
                      }
                      if (
                        addon.extra_details &&
                        addon.option_type === 1 &&
                        addon.extra_details?.freeQty
                      ) {
                        if (addon.extra_details?.freeQty) {
                          const totalamt =
                            addon.sale_price * (addon.option_qty || addon.qty);
                          let totalAmtToAdd = 0;
                          if (
                            (addon.qty || addon.option_qty) <
                            addon.extra_details.freeQty
                          ) {
                            totalAmtToAdd = 0;
                          } else {
                            totalAmtToAdd =
                              totalamt -
                              addon.sale_price * addon.extra_details.freeQty;
                          }
                          pricestoAdd.push(totalAmtToAdd);
                        } else {
                          pricestoAdd.push(
                            addon.sale_price * (addon.option_qty || addon.qty),
                          );
                        }
                      } else if (addon.option_type === 1) {
                        pricestoAdd.push(
                          addon.sale_price * (addon.option_qty || addon.qty),
                        );
                      }

                      item.amount = item.item_price;

                      if (
                        itemData &&
                        itemData.pricebeforeDiscount &&
                        itemData.discounted_price
                      ) {
                        calculateDiscountForItem(itemData);
                      }
                    }
                  }
                } else {
                  const posItem = window.allItemsList.find(
                    (p) => p.item_refid === itemData.item_refid,
                  );
                  if (posItem) {
                    const { sale_price } = posItem;
                    let checkForDiscount = false;
                    if (sale_price !== itemData.sale_price) {
                      checkForDiscount = true;
                    }
                    if (sale_price) {
                      itemData = cloneDeep(itemData);
                      item = cloneDeep(item);
                      item.data = itemData;

                      itemData.sale_price = sale_price;
                      itemData.price = sale_price;
                      itemData.item_price = sale_price;
                      // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
                      //   itemData.pricebeforeDiscount = itemData.sale_price;
                      // }
                      if (itemData.pricebeforeDiscount && checkForDiscount) {
                        calculateDiscountForItem(itemData);
                      }
                    }
                  }
                }
              }
            }
          }

          if (!isVariantSelected && !totoalOptionsAmount) {
            totoalOptionsAmount =
              item.item_price || item.price || item.sale_price;
            posItem = window.allItemsList.find(
              (p) => p.item_refid === item.item_id,
            );
            if (!posItem) {
              posItem = window.allItemsList.find(
                (p) => p.item_refid === item.item_refid,
              );
            }
            if (posItem) {
              const newItem = checkforMultipricingbydept(
                item,
                department_id,
                false,
                true,
              );
              // totoalOptionsAmount = newItem.price;
              if (newItem.original_sale_price) {
                totoalOptionsAmount = newItem.original_sale_price;
              }
              if (newItem && newItem.data && newItem.data.price) {
                totoalOptionsAmount = newItem.data.price;
              }

              // if (
              //   !newItem.original_sale_price &&
              //   (!newItem.data || !newItem.data.price)
              // ) {
              //   totoalOptionsAmount = newItem.price;
              // }
            }
          }
          const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
          const sale_price = totoalOptionsAmount + finalPrice;
          // item.item_price += Number(sale_price);
          // // item.amount = item.item_price + addonPrice;
          // item.amount = Number(sale_price * item.quantity).toFixed(
          //   window.ROUNDOFF_UPTO,
          // );
          item.sale_price = sale_price;
          item.price = sale_price;
          item.item_price = sale_price;
          item.amount = Number(
            sale_price * item.quantity.toFixed(window.ROUNDOFF_UPTO),
          );
          item.recalculatedAmount = Number(
            (sale_price * item.quantity).toFixed(window.ROUNDOFF_UPTO),
          );
          item.total = Number(
            (sale_price * item.quantity).toFixed(window.ROUNDOFF_UPTO),
          );
          item.pricebeforeDiscount = sale_price;
          if (item.pricebeforeDiscount && item.discounted_price) {
            calculateDiscountForItem(item);
          }
        } else {
          const itemData = window.allItemsList.find(
            (o) => Number(o.item_refid) === Number(item.item_id),
          );
          if (
            itemData &&
            (itemData?.sale_price_1 !== 0 ||
              itemData?.sale_price_2 !== 0 ||
              itemData?.sale_price_3 !== 0 ||
              itemData?.sale_price_4 !== 0 ||
              itemData?.sale_price_5 !== 0) &&
            window.multipricingSetting &&
            window.multipricingSetting.table_department_wise
          ) {
            const itemPrice =
              window.multipricingSetting.table_department_wise.find(
                (o) => Number(o.id) === Number(department_id),
              );

            if (itemPrice) {
              let sale_price = itemData[itemPrice.price_field];

              if (sale_price) {
                // itemData = cloneDeep(itemData)
                // btn = cloneDeep(btn)
                item.item_price = sale_price;
                item.sale_price = sale_price;
                item.item_price = sale_price;
                item.amount = sale_price * item.quantity;
                item.recalculatedAmount = sale_price * item.quantity;
                item.total = sale_price * item.quantity;
                item.pricebeforeDiscount = sale_price;
                calculateTaxForItem(item);
                item.item_total_tax_value = item.item_tax_value * item.quantity;
                if (item.pricebeforeDiscount && item.discounted_price) {
                  calculateDiscountForItem(item);
                }
                // if discounted item then don't pick multiprice
                if (item.extra_details && item.extra_details.newPrice) {
                  sale_price = item.extra_details.newPrice;
                  item.sale_price = sale_price;
                  item.price = sale_price;
                  item.item_price = sale_price;
                  item.amount = Number(item.sale_price) * item.quantity;
                  item.recalculatedAmount =
                    Number(item.sale_price) * item.quantity;
                }
              }
            }
          }

          if (!item.item_refid && item.item_id) {
            Object.assign(item, {
              item_refid: item.item_id,
            });
          }
          let newItem = checkforMultipricingbydept(item, department_id);
          if (newItem && newItem.data && newItem.data.sale_price) {
            newItem = newItem.data;

            item.sale_price = newItem.sale_price;
            item.price = newItem.sale_price;
            item.item_price = newItem.sale_price;
            item.amount = newItem.sale_price * item.quantity;
            item.recalculatedAmount = newItem.sale_price * item.quantity;
            item.total = newItem.sale_price * item.quantity;
            item.pricebeforeDiscount = newItem.sale_price;
            calculateTaxForItem(item);
            item.item_total_tax_value = newItem.item_tax_value * item.quantity;
            if (item.pricebeforeDiscount && item.discounted_price) {
              calculateDiscountForItem(item);
            }
            // if discounted item then don't pick multiprice
            if (item.extra_details && item.extra_details.newPrice) {
              const sale_price = item.extra_details.newPrice;
              item.sale_price = sale_price;
              item.price = sale_price;
              item.item_price = sale_price;
              item.amount = Number(item.sale_price) * item.quantity;
              item.recalculatedAmount = Number(item.sale_price) * item.quantity;
            }
          }
        }
      }
    });

    return selectedItems;
  }

  if (selectedItems && selectedItems.length && order_type) {
    selectedItems.map((item) => {
      let isOpenItem = false;
      if (item.extra_details && item.extra_details.isOpenItem) {
        isOpenItem = true;
      }
      if (!isOpenItem) {
        if (item.addons && item.addons.length) {
          let totoalOptionsAmount = 0;
          let isVariantSelected = false;
          const pricestoAdd = [];
          for (let i = 0; i < item.addons.length; i++) {
            const addon = item.addons[i];
            let itemData;
            itemData = window.optionsList.find(
              (o) => Number(o.ref_id) === Number(addon.option_ref_id),
            );

            if (!itemData) {
              itemData = window.modifiersList.find(
                (o) => Number(o.item_id) === Number(addon.option_ref_id),
              );
            }

            if (itemData) {
              if (
                (itemData?.sale_price_1 !== 0 ||
                  itemData?.sale_price_2 !== 0 ||
                  itemData?.sale_price_3 !== 0 ||
                  itemData?.sale_price_4 !== 0 ||
                  itemData?.sale_price_5 !== 0) &&
                window.multipricingSetting &&
                window.multipricingSetting.table_department_wise
              ) {
                const itemPrice =
                  window.multipricingSetting.table_department_wise.find(
                    (o) => Number(o.id) === Number(department_id),
                  );

                if (itemPrice) {
                  const sale_price = itemData[itemPrice.price_field];

                  if (sale_price) {
                    // itemData = cloneDeep(itemData)
                    // btn = cloneDeep(btn)
                    addon.item_price = sale_price;
                    addon.sale_price = sale_price;
                    addon.option_price = sale_price;
                    addon.option_total = sale_price;

                    addon.amount = sale_price * item.quantity;
                    if (addon.option_type == 1) {
                      const addonPrice = addon.option_qty * sale_price;
                      item.item_price = item.sale_price + addonPrice;
                      item.amount = item.sale_price + addonPrice;
                    } else {
                      item.item_price = sale_price;
                      item.amount = sale_price;
                    }

                    // if(addon.)
                    if (
                      itemData &&
                      itemData.pricebeforeDiscount &&
                      itemData.discounted_price
                    ) {
                      calculateDiscountForItem(itemData);
                    }
                  }
                } else {
                  const { sale_price } = itemData;

                  if (sale_price) {
                    // itemData = cloneDeep(itemData)
                    // btn = cloneDeep(btn)
                    item.item_price = sale_price;
                    item.sale_price = sale_price;
                    item.amount = sale_price * item.quantity;
                    if (
                      itemData &&
                      itemData.pricebeforeDiscount &&
                      itemData.discounted_price
                    ) {
                      calculateDiscountForItem(itemData);
                    }
                  }
                }
              }
            }

            if (window.itemPricesMapping) {
              const pricesData = window.itemPricesMapping[addon.option_ref_id];

              // if multipricing is not configured then set default price
              // addon prices not calculating properly (totoalOptionsAmount remains zero)
              const addonPrice = addon.option_price || Number(addon.price);
              if (pricesData || addonPrice) {
                const priceData = pricesData?.find((p) => p.ref === order_type);

                if (priceData || addonPrice) {
                  let sale_price = priceData?.price || addonPrice;
                  if (priceData?.extra_details) {
                    const extra_details = safeParse(priceData.extra_details);
                    if (
                      extra_details &&
                      String(extra_details.price_for_modifier)
                    ) {
                      sale_price = extra_details.price_for_modifier;
                    }
                  }
                  if (String(sale_price)) {
                    if (String(sale_price)) {
                      addon.item_price = sale_price;
                      addon.sale_price = sale_price;
                      addon.option_price = sale_price;
                      addon.option_total = sale_price;

                      // if (addon.option_type == 1) {
                      //   const addonPrice = addon.option_qty * sale_price;
                      //   // item.item_price += addonPrice;
                      //   // item.amount = item.item_price + addonPrice;
                      //   pricestoAdd.push(addonPrice);
                      // } else {
                      //   item.item_price = sale_price;
                      //   item.amount = sale_price;
                      //   totoalOptionsAmount += sale_price;
                      // }

                      if (addon.option_type === 0) {
                        totoalOptionsAmount += addon.sale_price;
                        item.option_price = addon.sale_price;
                        isVariantSelected = true;
                      }
                      if (addon.extra_details) {
                        addon.extra_details = safeParse(addon.extra_details);
                      }
                      if (
                        addon.extra_details &&
                        addon.option_type === 1 &&
                        addon.extra_details?.freeQty
                      ) {
                        if (addon.extra_details?.freeQty) {
                          const totalamt =
                            addon.sale_price * (addon.option_qty || addon.qty);
                          let totalAmtToAdd = 0;
                          if (
                            (addon.qty || addon.option_qty) <
                            addon.extra_details.freeQty
                          ) {
                            totalAmtToAdd = 0;
                          } else {
                            totalAmtToAdd =
                              totalamt -
                              addon.sale_price * addon.extra_details.freeQty;
                          }
                          pricestoAdd.push(totalAmtToAdd);
                        } else {
                          pricestoAdd.push(
                            addon.sale_price * (addon.option_qty || addon.qty),
                          );
                        }
                      } else if (addon.option_type === 1) {
                        pricestoAdd.push(
                          addon.sale_price * (addon.option_qty || addon.qty),
                        );
                      }

                      item.amount = item.item_price;
                      if (
                        itemData &&
                        itemData.pricebeforeDiscount &&
                        itemData.discounted_price
                      ) {
                        calculateDiscountForItem(itemData);
                      }
                    }
                  }
                } else {
                  const posItem = window.allItemsList.find(
                    (p) => p.item_refid === itemData.item_refid,
                  );
                  if (posItem) {
                    const { sale_price } = posItem;
                    let checkForDiscount = false;
                    if (sale_price !== itemData.sale_price) {
                      checkForDiscount = true;
                    }
                    if (sale_price) {
                      itemData = cloneDeep(itemData);
                      item = cloneDeep(item);
                      item.data = itemData;

                      itemData.sale_price = sale_price;
                      itemData.price = sale_price;
                      itemData.item_price = sale_price;
                      // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
                      //   itemData.pricebeforeDiscount = itemData.sale_price;
                      // }
                      if (itemData.pricebeforeDiscount && checkForDiscount) {
                        calculateDiscountForItem(itemData);
                      }
                    }
                  }
                }
              }
            }
          }
          if (!isVariantSelected && !totoalOptionsAmount) {
            totoalOptionsAmount =
              item.item_price || item.price || item.sale_price;
            let posItem = window.allItemsList.find(
              (p) => p.item_refid === item.item_id,
            );
            if (!posItem) {
              posItem = window.allItemsList.find(
                (p) => p.item_refid === item.item_refid,
              );
            }

            if (posItem) {
              const newItem = checkforMultipricing(
                item,
                order_type,
                false, // isModifierItem
                true, // modifierBaseItem
              );
              if (newItem && newItem.data && newItem.data.price) {
                totoalOptionsAmount = newItem.data.price;
              }
            }
          }
          const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
          const sale_price = totoalOptionsAmount + finalPrice;
          item.sale_price = sale_price;
          item.price = sale_price;
          item.item_price = sale_price;
          item.amount = sale_price * item.quantity;
          item.recalculatedAmount = sale_price * item.quantity;
          item.total = sale_price * item.quantity;
          item.pricebeforeDiscount = sale_price;
          if (item.pricebeforeDiscount && item.discounted_price) {
            calculateDiscountForItem(item);
          }
        } else {
          const itemData = window.allItemsList.find(
            (o) => Number(o.item_refid) === Number(item.item_id),
          );
          if (
            itemData &&
            (itemData?.sale_price_1 !== 0 ||
              itemData?.sale_price_2 !== 0 ||
              itemData?.sale_price_3 !== 0 ||
              itemData?.sale_price_4 !== 0 ||
              itemData?.sale_price_5 !== 0) &&
            window.multipricingSetting &&
            window.multipricingSetting.table_department_wise
          ) {
            const itemPrice =
              window.multipricingSetting.table_department_wise.find(
                (o) => Number(o.id) === Number(department_id),
              );

            if (itemPrice) {
              let sale_price = itemData[itemPrice.price_field];

              if (sale_price) {
                // itemData = cloneDeep(itemData)
                // btn = cloneDeep(btn)
                item.item_price = sale_price;
                item.sale_price = sale_price;
                item.amount = sale_price * item.quantity;
                item.recalculatedAmount = sale_price * item.quantity;
                item.total = sale_price * item.quantity;
                item.pricebeforeDiscount = sale_price;
                calculateTaxForItem(item);
                item.item_total_tax_value = item.item_tax_value * item.quantity;
                if (item.pricebeforeDiscount && item.discounted_price) {
                  calculateDiscountForItem(item);
                }
                // if discounted item then don't pick multiprice
                if (item.extra_details && item.extra_details.newPrice) {
                  sale_price = item.extra_details.newPrice;
                  item.sale_price = sale_price;
                  item.price = sale_price;
                  item.item_price = sale_price;
                  item.amount = Number(item.sale_price) * item.quantity;
                  item.recalculatedAmount =
                    Number(item.sale_price) * item.quantity;
                }
              }
            }
          }
          if (!item.item_refid && item.item_id) {
            Object.assign(item, {
              item_refid: item.item_id,
            });
          }
          let newItem = checkforMultipricing(item, order_type);
          if (newItem && newItem.data && newItem.data.sale_price) {
            newItem = newItem.data;

            item.sale_price = newItem.sale_price;
            item.price = newItem.sale_price;
            item.item_price = newItem.sale_price;
            item.amount = newItem.sale_price * item.quantity;
            item.recalculatedAmount = newItem.sale_price * item.quantity;
            item.total = newItem.sale_price * item.quantity;
            item.pricebeforeDiscount = newItem.sale_price;
            calculateTaxForItem(item);
            item.item_total_tax_value = newItem.item_tax_value * item.quantity;

            // item discount deducting twice issue
            // if (item.pricebeforeDiscount && item.discounted_price) {
            //   calculateDiscountForItem(item);
            // }
            // if discounted item then don't pick multiprice
            if (item.extra_details && item.extra_details.newPrice) {
              const sale_price = item.extra_details.newPrice;
              item.sale_price = sale_price;
              item.price = sale_price;
              item.item_price = sale_price;
              item.amount = Number(item.sale_price) * item.quantity;
              item.recalculatedAmount = Number(item.sale_price) * item.quantity;
            }
          }
        }
      }
    });

    return selectedItems;
  }
  return selectedItems;
}

module.exports = {
  checkMultipricing,
};
