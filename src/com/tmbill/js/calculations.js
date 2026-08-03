/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
const { sortBy } = require('lodash');
const {
  numberTowords,
  maskString,
  getOrderlevelinstructions,
} = require('../util/MiscUtil');
const {
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_FLAG_ID,
  VIRTUALTABLE_FLAG_ID,
  QUICKBILL_FLAG_ID,
  ITEM_TAX_TYPES,
} = require('../util/Constants');
const { showLoader } = require('./CommonUtils');
const {
  makeUpdateDiscountRequest,
} = require('../renderer/helper/Order.helper');
const { TAX_CALCULATION_ON } = require('../constant/tax');
const { safeParse } = require('../util/RendererUtils');

let showitemnoteonBill = false;
let showitemhsncodeonBill = false;
let showcustombillnumber = false;
let showDiscountreasonifapplied = false;
let showtaxOnChargeOnBill = false;
let showcustomerpaidAmount = false;
const maskSize = 4;
let MULTI_TAX = true;

function setPreviewsettings(settings) {
  showitemnoteonBill = settings.showitemnoteonBill;
  showitemhsncodeonBill = settings.showitemhsncodeonBill;
  showcustombillnumber = settings.showcustombillnumber;
  showDiscountreasonifapplied = settings.showDiscountreasonifapplied;
  showtaxOnChargeOnBill = settings.showtaxOnChargeOnBill;
  showcustomerpaidAmount = settings.showcustomerpaidAmount;
}

/**
 * Item to add in table
 * @param {Item details} data
 */
function computedItemdetails(data, index, itemchargesTitles, shownoteonBill) {
  let itemTitle = `${index}.${data.title} <small>`;
  if (shownoteonBill && data.note) {
    itemTitle += `(${data.note})`;
  }
  if (itemchargesTitles) {
    itemchargesTitles = itemchargesTitles.replace(/,\s*$/, '');
    itemTitle += `${itemchargesTitles}`;
  }
  if (showitemhsncodeonBill && data.hsn_code) {
    itemTitle += `\n - ${$.i18n.t('controller:previewController.HSN')} (${data.hsn_code})`;
  }

  const itemQuantity = data.quantity;
  const itemPrice = data.item_price;
  const itemAmount = data.amount;

  if (data.discount_name || data.discounted_price > 0) {
    itemTitle += `${data.discount_name ? `  ${data.discount_name}` : ''} - ${$.i18n.t(
      'controller:previewController.Discount',
    )} (${data.discount_type === 1 ? '' : `${currency}.`}${
      data.discount_rate
    }${data.discount_type === 1 ? '%' : ''})`;
  }
  if (!data.discount_name && data.amount === 0) {
    itemTitle += `\n - Complimentary`;
  }
  itemTitle += `<small/>`;
  return { itemTitle, itemQuantity, itemPrice, itemAmount };
}

function resetItemtax(item) {
  if (item) {
    Object.assign(item, {
      item_tax_value: 0,
      total: item.recalculatedAmount || 0,
      tax_value: 0,
      item_tax_method: undefined,
      item_tax_name: undefined,
      item_tax_per: 0,
    });
  }
}

/**
 * Show's preview of bill
 */
function orderCalculations(details, previewSettings) {
  setPreviewsettings(previewSettings || {});

  const calculatedData = {};
  try {
    if (!details) {
      return calculatedData;
    }

    let grandTotal = 0;
    let taxTotal = 0;
    const discount = Number(details.discount);
    const discount_type = Number(details.discount_type);
    const couponDisountamt = Number(details.couponDisount);
    const couponDisounttype = Number(details.couponDisounttype);
    let taxDivided = false;
    let taxInclusive = false;
    let taxMethod = details.tax_name;
    let istax_dividable = false;
    const bill_number = details.order_id;
    let order_id = details.bill_number;
    let taxPercent = 0;
    let chargesamounttoExludefromtax = 0;
    let order_subtotal = 0;
    let recalculateTax = false;
    const computedorderItems = [];
    let extra_details = {};
    let index = 1;
    let itemleveltotalCharges = 0;
    let order_level_discount = 0;
    let order_level_coupon_discount = 0;
    const taxedProductgrps = {};
    MULTI_TAX = false;
    let tax_id;
    details.items.forEach((item) => {
      if (
        item.product_group_id &&
        window.taxGroupMapping[item.product_group_id]
      ) {
        Object.assign(item, {
          productGrptaxes: window.taxGroupMapping[item.product_group_id],
        });
      }

      if (
        item.productGrptaxes &&
        item.product_group_id &&
        !taxedProductgrps[item.product_group_id]
      ) {
        taxedProductgrps[item.product_group_id] = sortBy(
          item.productGrptaxes,
          'sort',
        );
      }

      if (item.productGrptaxes && item.productGrptaxes.length > 1) {
        MULTI_TAX = true;
      }
      item.amount = Number(item.amount);
      if (discount) {
        item.amount = item.item_price * item.quantity;
      }
      grandTotal += item.amount;
      order_subtotal += item.amount;
      recalculateTax = true;
      Object.assign(item, { recalculatedAmount: item.amount });
      if (item.amount !== 0) {
        taxTotal +=
          (item.isitemwithOption
            ? item.new_item_tax_value
            : item.item_tax_value) * item.quantity;
      }
      if (item.item_tax_per !== 0 && taxPercent === 0) {
        taxPercent = item.item_tax_per;
        taxMethod = item.item_tax_name || item.tax_name;
        taxDivided = item.item_is_devidable == 1;
        taxInclusive = item.item_tax_method == 1;
      }
      if (MULTI_TAX) {
        resetItemtax(item);
      }
      let itemchargesTitles = '';
      if (
        // item.amount &&
        item.itemlevelCharges &&
        Array.isArray(item.itemlevelCharges) &&
        item.itemlevelCharges.length > 0
      ) {
        let itemlevelchargesTotal = 0;
        for (const charge of item.itemlevelCharges) {
          recalculateTax = true;
          let chargeAmount = charge.amount;
          const calculateChargeonamount = item.amount;
          if (charge.per_or_fixed == 1) {
            chargeAmount = (
              (calculateChargeonamount * chargeAmount) /
              100
            ).toFixed(ROUNDOFF_UPTO);
          } else if (details.isOnlinebill) {
            chargeAmount = Number(chargeAmount);
          } else {
            chargeAmount = Number(chargeAmount) * Number(item.quantity);
          }
          chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
          itemlevelchargesTotal += Number(chargeAmount);
          if (charge.calculate_tax_for_item_charges == 0) {
            chargesamounttoExludefromtax += Number(chargeAmount);
          } else {
            Object.assign(item, {
              recalculatedAmount: Number(item.amount) + Number(chargeAmount),
            });
          }
          let chargeName;
          if (charge.per_or_fixed == 1) {
            chargeName = `${charge.title} (${charge.amount}%)-${chargeAmount}`;
          } else {
            chargeName = `${charge.title}-${chargeAmount}`;
          }
          itemchargesTitles += `${chargeName}, \n`;
        }
        grandTotal += itemlevelchargesTotal;
        order_subtotal += itemlevelchargesTotal;
        itemleveltotalCharges += itemlevelchargesTotal;
      }
      const computeditemDetails = computedItemdetails(
        item,
        index,
        itemchargesTitles,
        showitemnoteonBill,
      );
      computedorderItems.push(computeditemDetails);
      index++;
    });

    // extra_details = details.extra_details;
    // let tax=[

    // ]
    // if (!taxInclusive) {
    //   const exlusive_tax = (extra_details.exlusive_tax || 0) + taxTotal;
    //   const tax = [
    //     {
    //       name: taxMethod,
    //       tax_percent: taxPercent,
    //       amount: taxTotal,
    //       tax_inclusive: taxInclusive,
    //       taxDivided,
    //     },
    //   ];
    //   extra_details = { ...details.extra_details };
    //   extra_details.tax = tax;
    //   extra_details.exlusive_tax = exlusive_tax;
    // } else {
    //   const inclusive_tax = (extra_details.inclusive_tax || 0) + taxTotal;
    //   const tax = [
    //     {
    //       name: taxMethod,
    //       tax_percent: taxPercent,
    //       amount: taxTotal,
    //       tax_inclusive: taxInclusive,
    //       taxDivided,
    //     },
    //   ];
    //   extra_details = { ...details.extra_details };
    //   extra_details.inclusive_tax = inclusive_tax;
    //   extra_details.tax = tax;
    // }
    Object.assign(calculatedData, { extra_details });
    Object.assign(calculatedData, {
      itemlevelSubtotal: order_subtotal,
      computedorderItems,
    });
    const amountTotal = order_subtotal;
    istax_dividable = taxDivided;

    billlabelTitle = $.i18n.t('controller:previewController.billNo');
    if (details.custombilltitle) {
      billlabelTitle = details.custombilltitle;
    }

    if (bill_number && bill_number != 0 && window.showBillnoonbill) {
      let bill_number_text = bill_number;
      if (showcustombillnumber) {
        if (details.custom_bill_number) {
          bill_number_text = details.custom_bill_number;
        } else {
          bill_number_text = `${
            global.storeDetails.bill_number_prefix || ''
          }${bill_number}`;
        }
      }
      Object.assign(calculatedData, {
        billnumberlabelid: `${
          details.customBillname ? details.customBillname : billlabelTitle
        } : ${bill_number_text} `,
      });
    }

    if (order_id && window.showOrderidonbill) {
      if (
        window.globalmaskOrderidinpreview &&
        String(order_id).length - maskSize > 0
      ) {
        const maskedResult = maskString(
          order_id,
          0,
          String(order_id).length - maskSize,
          '*',
        );
        if (maskedResult) {
          order_id = `${maskedResult.maskedString}<h6>${maskedResult.remianingString}</h6>`;
        }
      }
      Object.assign(calculatedData, {
        orderidlabel: `Order ID:${order_id}`,
      });
    }

    if (details.extdeliveryBoy) {
      Object.assign(calculatedData, {
        deliveryboyInfolabelid: `${details.extdeliveryBoy.name} (${details.extdeliveryBoy.phone})"`,
      });
    }

    Object.assign(calculatedData, {
      totalAmountlabel: currency + grandTotal.toFixed(ROUNDOFF_UPTO),
      totalAmount: grandTotal,
    });

    let discountApplied = false;
    let coupondiscountApplied = false;
    if (!details.isOnlinebill && discount_type !== undefined && discount) {
      let discounttoApply = discount;
      if (discount_type == '1') {
        discounttoApply = ((order_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }
      if (grandTotal > discounttoApply) {
        // calculate fraction of discount based on order subtotal to calculate discount for one item
        const splittedDiscountamount = Number(
          discounttoApply / (order_subtotal - chargesamounttoExludefromtax),
        );
        details.items.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedDiscountamount;

          order_level_discount += Number(discountAmounttominus);
          order_level_discount = Number(order_level_discount.toFixed(3));
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount = Number(
            recalculatedAmount.toFixed(ROUNDOFF_UPTO),
          );
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
        });
        grandTotal -= order_level_discount;
        discountApplied = true;
        details.discounttoApply = order_level_discount;
        Object.assign(extra_details, {
          discount: {
            discount_type,
            discount_rate: discount,
            amount: discounttoApply,
          },
        });
      } else {
        details.discounttoApply = 0;
      }
    } else {
      details.discounttoApply = 0;
    }

    if (!details.isOnlinebill && couponDisountamt && couponDisountamt != 0) {
      let coupondiscounttoApply = couponDisountamt;
      if (Number(couponDisounttype) == 1) {
        coupondiscounttoApply = (
          (order_subtotal * coupondiscounttoApply) /
          100
        ).toFixed(ROUNDOFF_UPTO);
      }
      if (grandTotal > coupondiscounttoApply) {
        // grandTotal = grandTotal - coupondiscounttoApply;
        coupondiscountApplied = true;
        // details.coupondiscounttoApply = coupondiscounttoApply;

        const splittedCouponDiscountamount = Number(
          coupondiscounttoApply /
            (order_subtotal - chargesamounttoExludefromtax),
        );
        details.items.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedCouponDiscountamount;

          order_level_coupon_discount += Number(
            discountAmounttominus.toFixed(ROUNDOFF_UPTO),
          );
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount = Number(
            recalculatedAmount.toFixed(ROUNDOFF_UPTO),
          );
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
        });
        grandTotal -= coupondiscounttoApply;
        details.coupondiscounttoApply = coupondiscounttoApply;
        details.discounttoApply =
          Number(details.discounttoApply) + Number(coupondiscounttoApply);
      } else {
        details.coupondiscounttoApply = 0;
      }
    } else {
      details.coupondiscounttoApply = 0;
    }

    if (
      !details.isOnlinebill &&
      details.discounttoApply != undefined &&
      details.discounttoApply > 0
    ) {
      let discountTitle = $.i18n.t('controller:previewController.Discount');
      if (details.isloyaltyrewardDiscount) {
        discountTitle = 'Loyalty Discount :';
      }
      if (details.discount_title) {
        discountTitle += `(${details.discount_title})`;
      }
      Object.assign(calculatedData, {
        discountAmountlabel: `${discountTitle} ${currency} ${details.discounttoApply}`,
        discounttoApply: Number(details.discounttoApply),
      });

      if (showDiscountreasonifapplied && details.instructions) {
        const response = getOrderlevelinstructions(details.instructions);
        Object.assign(calculatedData, {
          previewDiscountreasonlabelid: `${$.i18n.t(
            'controller:previewController.discountReason',
          )}${response.discount || ''}`,
        });
      }
    }

    if (
      !details.isOnlinebill &&
      details.coupondiscounttoApply != undefined &&
      details.coupondiscounttoApply > 0
    ) {
      const cpdiscountTitle = $.i18n.t('previewScreen.couponDiscount');
      Object.assign(calculatedData, {
        cpdiscountAmountlabel: `${cpdiscountTitle} (${
          details.coupon
        } ${couponDisountamt} ${
          Number(couponDisounttype) == 1 ? '%' : ''
        } ) ${currency} ${details.coupondiscounttoApply} `,
        coupondiscounttoApply: Number(details.coupondiscounttoApply),
      });
    }

    // if (!details.isOnlinebill && taxTotal != undefined && taxTotal > 0) {
    // if (discountApplied || coupondiscountApplied || recalculateTax) {
    //   let taxtocalculateonAmount = grandTotal;
    //   if (chargesamounttoExludefromtax > 0) {
    //     taxtocalculateonAmount -= chargesamounttoExludefromtax;
    //   }
    //   // if (taxInclusive) {
    //   //   //   taxTotal = (taxtocalculateonAmount / (100 + taxPercent)) * taxPercent;
    //   //   taxTotal = 0;
    //   //   details.items.map((item) => {
    //   //     let taxPerct;
    //   //     if (item.item_is_devidable) {
    //   //       taxPerct = Number(
    //   //         (
    //   //           (item.recalculatedAmount / (100 + item.item_tax_per)) *
    //   //           (item.item_tax_per / 2)
    //   //         ).toFixed(ROUNDOFF_UPTO),
    //   //       );
    //   //       taxTotal = Number(
    //   //         (taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO),
    //   //       );
    //   //     } else {
    //   //       taxTotal = Number(
    //   //         taxTotal +
    //   //           (item.recalculatedAmount / (100 + item.item_tax_per)) *
    //   //             item.item_tax_per,
    //   //       ).toFixed(ROUNDOFF_UPTO);
    //   //     }
    //   //   });
    //   // } else {
    //   //   //   taxTotal = (taxPercent / 100) * taxtocalculateonAmount;
    //   //   taxTotal = 0;
    //   //   details.items.map((item) => {
    //   //     let taxPerct;
    //   //     if (item.item_is_devidable) {
    //   //       // taxPerct = Number(
    //   //       //   (
    //   //       //     (item.item_tax_per / 2 / 100) *
    //   //       //     item.recalculatedAmount
    //   //       //   ).toFixed(ROUNDOFF_UPTO),
    //   //       // );
    //   //       taxPerct = Number(
    //   //         (
    //   //           ((item.item_tax_per / 2) * item.recalculatedAmount) /
    //   //           100
    //   //         ).toFixed(ROUNDOFF_UPTO),
    //   //       );
    //   //       taxTotal = Number(
    //   //         (taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO),
    //   //       );
    //   //     } else {
    //   //       taxTotal = Number(
    //   //         (
    //   //           taxTotal +
    //   //           (item.recalculatedAmount * item.item_tax_per) / 100
    //   //         ).toFixed(ROUNDOFF_UPTO),
    //   //       );
    //   //     }
    //   //   });
    //   // }

    //   taxTotal = 0;
    //   details.items.map((item) => {
    //     taxTotal += calculateTaxForItem(item);
    //   });

    //   taxTotal = Number(taxTotal.toFixed(ROUNDOFF_UPTO));

    //   if (taxInclusive) {
    //     const tax = [
    //       {
    //         name: taxMethod,
    //         tax_percent: taxPercent,
    //         amount: taxTotal,
    //         tax_inclusive: taxInclusive,
    //         taxDivided,
    //       },
    //     ];
    //     extra_details.tax = tax;
    //     extra_details.inclusive_tax = taxTotal;
    //   } else {
    //     extra_details.exlusive_tax = taxTotal;
    //     const tax = [
    //       {
    //         name: taxMethod,
    //         tax_percent: taxPercent,
    //         amount: taxTotal,
    //         tax_inclusive: taxInclusive,
    //         taxDivided,
    //       },
    //     ];
    //     extra_details.tax = tax;
    //   }
    // }

    // if (!taxInclusive) {
    //   grandTotal += taxTotal;
    // }

    // const tax_type = taxInclusive
    //   ? `(${taxPercent ? `${taxPercent}%` : ''} Incl.)`
    //   : `(${taxPercent ? `${taxPercent}%` : ''})`;

    // if (!taxMethod) {
    //   taxMethod = '';
    // }
    // if (istax_dividable) {
    //   const splittax = taxTotal.toFixed(ROUNDOFF_UPTO) / 2;
    //   const splitPercent = taxPercent.toFixed(ROUNDOFF_UPTO) / 2;
    //   Object.assign(calculatedData, {
    //     sgsttaxLabel: `${$.i18n.t(
    //       'controller:previewController.SGST',
    //     )} (${splitPercent.toFixed(ROUNDOFF_UPTO)}%) : `,
    //     cgsttaxLabel: `${$.i18n.t(
    //       'controller:previewController.CGST',
    //     )} (${splitPercent.toFixed(ROUNDOFF_UPTO)}%) : `,
    //     splittedtaxAmount: currency + splittax.toFixed(ROUNDOFF_UPTO),
    //     istax_dividable,
    //   });
    // } else {
    //   Object.assign(calculatedData, {
    //     taxAmountlabeltitle: `${$.i18n.t(
    //       'controller:previewController.Total',
    //     )} ${taxMethod || ''}: `,
    //     taxAmountlabel: `${tax_type} ${currency} ${Number(taxTotal).toFixed(
    //       ROUNDOFF_UPTO,
    //     )}`,
    //     istax_dividable,
    //   });
    // }

    try {
      if (discountApplied || coupondiscountApplied || recalculateTax) {
        let taxtocalculateonAmount = grandTotal;
        if (chargesamounttoExludefromtax > 0) {
          taxtocalculateonAmount -= chargesamounttoExludefromtax;
        }

        taxTotal = 0;
        if (MULTI_TAX) {
          let taxapplicableAmount =
            order_subtotal -
            details.discounttoApply -
            details.coupondiscounttoApply -
            chargesamounttoExludefromtax;

          // - chargesamounttoExludefromtax;
          // check if taxes are inclusive and has calculations on subtotal + prev tax totals
          if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
            Object.values(taxedProductgrps).forEach((ptaxes) => {
              if (ptaxes && ptaxes.length) {
                let divisionFactorforcurrentgrp = 0;
                let inclusiveTaxrates = 0;
                ptaxes.forEach((currentptax) => {
                  // Check if tax type is inclusive
                  // If the tax type is inclusive we
                  let isTaxontax = false;
                  if (
                    currentptax?.extra_details?.isTaxOnTax &&
                    currentptax?.extra_details?.applicableOnIds &&
                    currentptax?.extra_details?.applicableOnIds.length
                  ) {
                    isTaxontax = true;
                  }

                  if (isTaxontax) {
                    // Skip the tax if it is tax on tax
                    // return;
                  }

                  if (currentptax.tax_method === 1) {
                    if (
                      currentptax.cal_method ===
                        TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX &&
                      currentptax?.extra_details?.inclusiveDivfactor
                    ) {
                      divisionFactorforcurrentgrp =
                        currentptax?.extra_details?.inclusiveDivfactor;
                    } else {
                      inclusiveTaxrates += currentptax.tax_perct * 0.01;
                    }
                  }
                });
                if (divisionFactorforcurrentgrp > 0) {
                  // recalculate the subtotal
                  taxapplicableAmount /= divisionFactorforcurrentgrp;
                } else if (inclusiveTaxrates > 0) {
                  taxapplicableAmount /= 1 + inclusiveTaxrates;
                }
              }
            });
          }

          totalwithoutTax = taxapplicableAmount;

          const previousTaxtotal = [];
          const previousTaxesmap = {};
          const taxlistTomaintain = [];
          let inclusiveTotal = 0;
          let exclusiveTotal = 0;

          // Check if there are multiple taxes present and apply
          if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
            Object.keys(taxedProductgrps).forEach((currentpg) => {
              const taxList = taxedProductgrps[currentpg];
              if (taxList && taxList.length) {
                taxList.forEach((currentTax) => {
                  if (currentTax && !currentTax.applied) {
                    const isInclusive = currentTax.tax_method === 1;

                    let applyTaxon = taxapplicableAmount;
                    if (
                      currentTax.cal_method ===
                      TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
                    ) {
                      // Add the previous tax totals as well
                      applyTaxon =
                        taxapplicableAmount +
                        previousTaxtotal.reduce((a, b) => a + b, 0);
                    } else if (
                      currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                    ) {
                      // Add the previous tax totals as well
                      applyTaxon = previousTaxtotal.reduce((a, b) => a + b, 0);
                    }

                    // check the tax is on tax
                    if (
                      currentTax?.extra_details?.isTaxOnTax &&
                      currentTax?.extra_details?.applicableOnIds &&
                      currentTax?.extra_details?.applicableOnIds.length &&
                      (currentTax.cal_method ===
                        TAX_CALCULATION_ON.PREVIOUSTAX ||
                        currentTax.cal_method ===
                          TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX)
                    ) {
                      let previoustotalforcurrent = 0;
                      currentTax?.extra_details?.applicableOnIds.forEach(
                        (grpid) => {
                          previoustotalforcurrent +=
                            previousTaxesmap[grpid] || 0;
                        },
                      );

                      if (previoustotalforcurrent > 0) {
                        // applyTaxon = previoustotalforcurrent;
                        if (
                          currentTax.cal_method ===
                          TAX_CALCULATION_ON.PREVIOUSTAX
                        ) {
                          applyTaxon = previoustotalforcurrent;
                        } else {
                          applyTaxon =
                            taxapplicableAmount + previoustotalforcurrent;
                        }
                      } else {
                        // If the taxes total is 0 then do not apply
                        return;
                      }
                    }

                    const currentTaxtotal = calculateTax({
                      amount: applyTaxon,
                      inclusive: false,
                      tax_percent: currentTax.tax_perct,
                      is_devidable: Boolean(currentTax.is_devidable),
                    });

                    previousTaxtotal.push(currentTaxtotal);

                    Object.assign(previousTaxesmap, {
                      [currentTax.tax_id]: currentTaxtotal,
                    });

                    const taxObj = {
                      name: currentTax.tax_name,
                      tax_percent: currentTax.tax_perct,
                      amount: currentTaxtotal,
                      tax_inclusive: isInclusive,
                      taxDivided: Boolean(currentTax.is_devidable),
                      tax_id: currentTax.tax_id,
                    };
                    if (taxObj.taxDivided) {
                      const cgst = taxObj.amount / 2;
                      Object.assign(taxObj, {
                        sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                        cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                      });
                    }
                    taxlistTomaintain.push(taxObj);

                    if (isInclusive) {
                      inclusiveTotal += currentTaxtotal;
                    } else {
                      exclusiveTotal += currentTaxtotal;
                    }
                    // previousTaxtotal=currentTax.TaxValue;
                  }
                });
              }
            });
          }

          // add the tax details to the extra details object
          Object.assign(extra_details, {
            ...(inclusiveTotal && {
              inclusive_tax: inclusiveTotal,
            }),
            ...(exclusiveTotal && {
              exlusive_tax: exclusiveTotal,
            }),
            tax: taxlistTomaintain,
          });

          // Now add the exclusive tax total to order total
          if (exclusiveTotal > 0) {
            grandTotal += exclusiveTotal;
          }

          taxTotal = Number(
            Number(inclusiveTotal + exclusiveTotal).toFixed(ROUNDOFF_UPTO),
          );
          calculatedData.taxtoApply = taxTotal.toFixed(ROUNDOFF_UPTO);

          details.items.map((item) => {
            calculateMultiTaxForItemLevel(item);
          });
        } else {
          details.items.map((item) => {
            taxTotal += calculateTaxForItem(item);
          });

          details.taxtoApply = taxTotal.toFixed(ROUNDOFF_UPTO);
          if (!taxInclusive) {
            grandTotal += taxTotal;
            Object.assign(extra_details, {
              exlusive_tax: (extra_details.exlusive_tax || 0) + taxTotal,
              tax: [
                {
                  name: taxMethod,
                  tax_percent: taxPercent,
                  amount: taxTotal,
                  tax_inclusive: taxInclusive,
                  taxDivided,
                  // tax_id,
                },
              ],
            });

            if (
              extra_details.tax &&
              extra_details.tax.length &&
              extra_details.tax[0].taxDivided
            ) {
              const cgst = extra_details.tax[0].amount / 2;
              Object.assign(extra_details.tax[0], {
                sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
              });
            }
          } else {
            Object.assign(extra_details, {
              inclusive_tax: (extra_details.inclusive_tax || 0) + taxTotal,
              tax: [
                {
                  name: taxMethod,
                  tax_percent: taxPercent,
                  amount: taxTotal,
                  tax_inclusive: taxInclusive,
                  taxDivided,
                  tax_id,
                },
              ],
            });
            if (
              extra_details.tax &&
              extra_details.tax.length &&
              extra_details.tax[0].taxDivided
            ) {
              const cgst = extra_details.tax[0].amount / 2;
              Object.assign(extra_details.tax[0], {
                sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
              });
            }
          }
        }
      }
      // Object.assign(calculatedData, { extra_details });
    } catch (error) {
      console.error(error);
    }
    // }
    if (
      details.charges &&
      Array.isArray(details.charges) &&
      !details.isOnlinebill
    ) {
      const computedOrderchargeslist = [];
      const { charges } = details;
      const isOldBill = !!(details.isOldbill != undefined && details.isOldbill);
      if (charges && charges.length > 0) {
        let chargesTotal = 0;
        charges.forEach((charge) => {
          const computedChargedetails = {};
          let chargeAmount = Number(charge.amount);
          let chargeAmountbeforeTax = chargeAmount;
          const previewchargeTitle = charge.title;

          Object.assign(computedChargedetails, {
            calculated_tax: charge.calculated_tax,
            tax_divided: charge.tax_divided,
            tax_amount: charge.tax_amount,
            showTax: charge.calculated_tax && showtaxOnChargeOnBill,
          });
          if (isOldBill) {
            let calculatedChargeamount = chargeAmount;
            if (charge.calculated_tax && !charge.is_tax_included) {
              calculatedChargeamount -= charge.calculated_tax;
            }
            const nameLabel = previewchargeTitle;
            const amountLabel =
              currency + Number(calculatedChargeamount).toFixed(ROUNDOFF_UPTO);

            Object.assign(computedChargedetails, {
              nameLabel,
              amountLabel,
              calculatedChargeamount,
            });

            if (computedChargedetails.showTax && !charge.tax_divided) {
              const chargetaxName =
                charge.tax_title ||
                $.i18n.t('controller:previewController.Tax');
              Object.assign(computedChargedetails, {
                taxLabel: `${chargetaxName} (${
                  charge.tax_amount || ''
                }%) - ${currency} ${charge.calculated_tax}`,
              });
            }
          } else {
            const postFix = charge.per_or_fixed == '1' ? ' % ):' : ' ):';
            if (charge.per_or_fixed == 1) {
              // chargeAmount = Number(
              //   ((amountTotal * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO),
              // );
              if (charge.extra_details) {
                const extra_details = safeParse(charge.extra_details);
                if (extra_details.applicable_on_amount == '1') {
                  chargeAmount = Number(
                    (
                      ((order_subtotal - itemleveltotalCharges || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                } else {
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(details.discounttoApply) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                }
              } else {
                chargeAmount = Number(
                  (
                    ((order_subtotal -
                      itemleveltotalCharges -
                      Number(details.discounttoApply) || 0) *
                      chargeAmount) /
                    100
                  ).toFixed(ROUNDOFF_UPTO),
                );
              }
            }
            chargeAmountbeforeTax = chargeAmount;
            // check if the tax is available
            if (charge.is_tax_applicable && charge.tax_amount) {
              // let calculatedChargestax =
              //   chargeAmount * (charge.tax_amount / 100);
              // calculatedChargestax = Number(
              //   Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
              // );

              let calculatedChargestax = 0;
              if (charge.is_tax_included) {
                let taxPerct;
                if (charge.tax_divided) {
                  taxPerct = roundAmountUptoDecimals(
                    Number(
                      (chargeAmount / (100 + charge.tax_amount / 2)) *
                        (charge.tax_amount / 2),
                    ),
                    ROUNDOFF_UPTO,
                  );
                  calculatedChargestax = taxPerct * 2;
                  // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                  calculatedChargestax = roundAmountUptoDecimals(
                    Number(calculatedChargestax),
                    ROUNDOFF_UPTO,
                  );
                } else {
                  calculatedChargestax =
                    (chargeAmount / (100 + charge.tax_amount)) *
                    charge.tax_amount;
                  // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                  calculatedChargestax = roundAmountUptoDecimals(
                    Number(calculatedChargestax),
                    ROUNDOFF_UPTO,
                  );
                }
              } else {
                let taxPerct;
                if (charge.tax_divided) {
                  // taxPerct = chargeAmount * ((charge.tax_amount / 2) / 100);
                  // taxPerct = Number((chargeAmount * (charge.tax_amount / 2)) / 100).toFixed(ROUNDOFF_UPTO);
                  taxPerct = roundAmountUptoDecimals(
                    Number((chargeAmount * (charge.tax_amount / 2)) / 100),
                    ROUNDOFF_UPTO,
                  );

                  calculatedChargestax = taxPerct * 2;
                  // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                  calculatedChargestax = roundAmountUptoDecimals(
                    Number(calculatedChargestax),
                    ROUNDOFF_UPTO,
                  );
                } else {
                  calculatedChargestax = Number(
                    chargeAmount * (charge.tax_amount / 100),
                  ).toFixed(ROUNDOFF_UPTO);
                  // calculatedChargestax = roundAmountUptoDecimals(Number(chargeAmount * (charge.tax_amount / 100)), ROUNDOFF_UPTO);
                  calculatedChargestax = Number(
                    Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                  );

                  // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
                }
              }

              if (charge.is_tax_included == 0) {
                // Check if tax is exlcusive
                chargeAmount += calculatedChargestax;
                chargeAmount = Number(
                  Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
                );
              }
              // previewchargeTitle += `-Tax(${charge.tax_amount}%)`;
              Object.assign(charge, {
                is_tax_included: charge.is_tax_included,
                calculated_tax: calculatedChargestax,
              });
            }

            Object.assign(computedChargedetails, {
              nameLabel: `${previewchargeTitle} (${charge.amount} ${postFix}`,
              title: charge.title,
              amountLabel:
                currency + Number(chargeAmountbeforeTax).toFixed(ROUNDOFF_UPTO),
              calculatedChargeamount: chargeAmountbeforeTax,
              chargeAmountbeforeTax,
            });

            if (computedChargedetails.showTax && !charge.tax_divided) {
              const chargetaxName =
                charge.tax_title ||
                $.i18n.t('controller:previewController.Tax');
              Object.assign(computedChargedetails, {
                taxLabel: `${chargetaxName}: (${charge.tax_amount}%) - ${currency} ${charge.calculated_tax}`,
              });
            }
            charge.amounttoAdd = Number(chargeAmount);
          }
          computedOrderchargeslist.push(computedChargedetails);
          chargesTotal += Number(chargeAmount);
        });

        if (chargesTotal >= 0) {
          grandTotal += chargesTotal;
          Object.assign(calculatedData, {
            chargesTotal,
            computedOrderchargeslist,
          });

          Object.assign(extra_details, {
            totalCharges: chargesTotal,
          });
        }
        Object.assign(calculatedData, { charges: details.charges });
      }
    }

    if (details.isOnlinebill) {
      if (details.onlinediscounttoApply)
        details.discounttoApply = details.onlinediscounttoApply;
      if (details.discounttoApply != undefined && details.discounttoApply > 0) {
        let iswithExternaldiscount = '';
        if (
          details.total_external_discount &&
          details.total_external_discount != 0
        ) {
          details.discounttoApply =
            Number(details.discounttoApply) +
            Number(details.total_external_discount);
          iswithExternaldiscount = ' (with Ext. disc) ';
        }

        if (grandTotal > details.discounttoApply) {
          grandTotal -= details.discounttoApply;
          if (iswithExternaldiscount && details.total_external_discount) {
            grandTotal += Number(details.total_external_discount);
          }
        }
        const discountTitle = $.i18n.t('controller:previewController.Discount');
        Object.assign(calculatedData, {
          onlinediscounttoApply: details.discounttoApply,
          discounttoApply: details.discounttoApply,
          onlinediscountAmountlabel: `${discountTitle} ${iswithExternaldiscount} ${currency} ${details.discounttoApply} `,
        });
      }

      if (details.onlinetaxesTotal) {
        const taxtoshowonBill = details.onlinetaxesTotal;
        let onlinetaxsplitPercent = Number(taxtoshowonBill) / 2;
        onlinetaxsplitPercent = Number(onlinetaxsplitPercent).toFixed(2);
        grandTotal += Number(Number(taxtoshowonBill).toFixed(ROUNDOFF_UPTO));

        Object.assign(calculatedData, {
          onlinetaxtoshowonBill: Number(
            Number(taxtoshowonBill).toFixed(ROUNDOFF_UPTO),
          ),
          taxAmountlabel:
            currency + Number(taxtoshowonBill).toFixed(ROUNDOFF_UPTO),
          onlinesgsttaxLabel: `${$.i18n.t(
            'controller:previewController.SGST',
          )} (${onlinetaxsplitPercent}%) : `,
          onlinecgsttaxLabel: `${$.i18n.t(
            'controller:previewController.CGST',
          )} (${onlinetaxsplitPercent}%) : `,
          onlinesplittedtaxAmountlabel: `${currency} ${onlinetaxsplitPercent}`,
        });
      }

      if (details.onlinechargesTotal) {
        grandTotal += Number(
          Number(details.onlinechargesTotal).toFixed(ROUNDOFF_UPTO),
        );
        Object.assign(calculatedData, {
          onlinechargesTotal: details.onlinechargesTotal,
          onlinechargesTotallable: `Charges: ${Number(
            details.onlinechargesTotal,
          ).toFixed(ROUNDOFF_UPTO)}`,
        });
      }
    }

    if (DO_BILL_ROUNDOFF) {
      try {
        const previousTotal = grandTotal;
        // grandTotal = Math.round(grandTotal);
        if (window.ROUNDING_INCREMENT) {
          grandTotal = roundToStep(
            grandTotal,
            window.ROUNDING_INCREMENT,
            window.ROUNDOFF_UPTO,
          );
        } else if (window.ROUNDOFF_UPTO === '3') {
          grandTotal = roundOffLastDigit(grandTotal);
        } else {
          grandTotal = Math.round(grandTotal);
        }
        if (previousTotal !== grandTotal) {
          Object.assign(calculatedData.extra_details, {
            roundedAmount: Number(
              (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });

          Object.assign(calculatedData, {
            previewroundedTotallabelid: `${$.i18n.t(
              'controller:previewController.roundedAmt',
            )} ${roundedAmount > 0 ? '+' : '-'} ${roundedAmount.toFixed(2)}`,
            roundedAmount: Number(
              (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });

          Object.assign(extra_details, {
            roundedAmount: Number(
              (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });
        } else {
          if (calculatedData.extra_details.roundedAmount) {
            Object.assign(calculatedData.extra_details, {
              roundedAmount: Number(
                (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
              ),
            });
          }
          Object.assign(calculatedData, {
            roundedAmount: 0,
          });
          Object.assign(extra_details, {
            roundedAmount: 0,
          });
        }
      } catch (error) {}
    } else {
      if (calculatedData.extra_details.roundedAmount) {
        Object.assign(calculatedData.extra_details, {
          roundedAmount: Number(
            (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
          ),
        });
      }
      Object.assign(calculatedData, {
        roundedAmount: 0,
      });
    }

    Object.assign(calculatedData, {
      grandTotal,
      taxTotal,
    });

    if (grandTotal && window.showbillamountinWords) {
      const words = numberTowords(
        Number(grandTotal.toFixed(ROUNDOFF_UPTO)),
        window.storeDetails.currency_name,
        window.storeDetails.sub_currency_name,
      );
      Object.assign(calculatedData, {
        words: words || undefined,
      });
    }

    if (showcustomerpaidAmount && details.cust_paid_amount) {
      let returnAmount = Number(
        Number(details.cust_paid_amount) - Number(grandTotal),
      ).toFixed(ROUNDOFF_UPTO);
      returnAmount = Number(returnAmount);
      Object.assign(calculatedData, {
        returnAmount,
        billpreviewcustomerpaidAmountlabelid: `${$.i18n.t(
          'controller:previewController.paidAmt',
        )} ${currency} ${Number(details.cust_paid_amount).toFixed(2)}`,
      });
      if (returnAmount > 0) {
        Object.assign(calculatedData, {
          billpreviewcustomerreturnAmountlabelid: `${$.i18n.t(
            'controller:previewController.returnAmt',
          )} ${currency} ${returnAmount.toFixed(ROUNDOFF_UPTO)}`,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }

  return calculatedData;
}
function roundOffLastDigit(num) {
  // let temp = num * 1000;
  // temp = Math.floor(temp / 10) * 10;
  // return temp / 1000;
  let temp = num * 1000;
  const lastDigit = temp % 10;
  if (lastDigit >= 5) {
    temp = Math.ceil(temp / 10) * 10;
  } else {
    temp = Math.floor(temp / 10) * 10;
  }
  return temp / 1000;
}

/**
 * Rounds a number to a dynamic increment (0.25, 0.5, 1, etc.)
 * and formats it to a specific decimal precision.
 */
function roundToStep(numb, increment, decimals) {
  // const n = Number(numb);
  // const step = Number(increment);

  // if (isNaN(n) || isNaN(step) || step === 0) return 0;

  // // Multiply by a large factor to work in integers, avoiding float drift
  // const precision = Math.pow(10, 10);
  // const snapped = Math.round((n * precision) / (step * precision)) * step;

  // return Number(snapped.toFixed(decimals));

  const n = Number(numb);
  const step = Number(increment);

  if (isNaN(n) || isNaN(step) || step === 0) return '0';

  // 1. Round to the nearest increment (the "Snap")
  const snapped = Math.round(n / step) * step;

  // 2. Format to string to preserve trailing zeros (e.g., 1.00 instead of 1)
  return Number(snapped.toFixed(decimals));
}

function sectionWiseOrderCalculation(details, previewSettings) {
  const calculatedData = {};

  if (!details) {
    return calculatedData;
  }

  const { discount } = details;
  const { discount_type } = details;
  const { order_id } = details;
  const { charges } = details;

  const raw_discounted_product_groups = details.discounted_product_groups;
  const discounted_product_groups = raw_discounted_product_groups
    ? String(raw_discounted_product_groups).split(',')
    : [];

  const { couponDisountamt } = details;
  const { couponDisounttype } = details;
  const kotnoSet = new Set();

  details.order_total = 0;
  totalCharges = 0;
  details.item_level_total_charges = 0;

  const { bill_number } = details;
  const extra_details = details.extra_details || {};
  if (extra_details) {
    if (extra_details.exlusive_tax) extra_details.exlusive_tax = 0;
    if (extra_details.inclusive_tax) extra_details.inclusive_tax = 0;
    if (extra_details.tax) extra_details.tax = [];
  }

  const discountHistory = [];
  let finalGrandtotal = 0;
  let baseamounTotal = 0;
  let finaltaxTotal = 0;
  let finaldiscounttoApply = 0;
  let finalcoupondiscounttoApply = 0;
  let finalorder_subtotal = 0;
  let finaltotalCharges = 0;
  let finalitemlevelChargestotal = 0;
  let order_level_discount = 0;
  const billItems = details.items;
  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const group of globalproductGroups) {
      let grandTotal = 0;
      let taxTotal = 0;
      let taxInclusive = false;
      let taxDivided = false;
      let taxPercent = 0;
      let taxMethod;
      let sectionhasItems = false;
      let order_subtotal = 0;
      let chargesamounttoExludefromtax = 0;
      let recalculateTax = false;
      const taxedProductgrps = {};
      MULTI_TAX = false;

      let sectionhasDiscount =
        Number(discount || 0) > 0 || Number(couponDisountamt || 0) > 0;

      if (
        sectionhasDiscount &&
        discounted_product_groups.length > 0 &&
        discounted_product_groups.includes(String(group.id))
      ) {
        sectionhasDiscount = true;
      } else {
        sectionhasDiscount = false;
      }

      billItems.forEach((item) => {
        if (item.product_group_id == group.id) {
          sectionhasItems = true;
          item.amount = item.quantity * item.item_price;
          item.quantity = Number(item.quantity);
          item.amount = Number(item.amount);
          item.recalculatedAmount = Number(item.amount);
          grandTotal += item.amount;
          order_subtotal += item.amount;
          recalculateTax = true;
          if (
            item.product_group_id &&
            window.taxGroupMapping[item.product_group_id]
          ) {
            Object.assign(item, {
              productGrptaxes: window.taxGroupMapping[item.product_group_id],
            });
          }

          if (
            item.productGrptaxes &&
            item.product_group_id &&
            !taxedProductgrps[item.product_group_id]
          ) {
            taxedProductgrps[item.product_group_id] = sortBy(
              item.productGrptaxes,
              'sort',
            );
          }

          if (item.productGrptaxes && item.productGrptaxes.length > 1) {
            MULTI_TAX = true;
          }

          if (MULTI_TAX) {
            resetItemtax(item);
          }
          calculateTaxForItem(item);

          if (item.amount !== 0) {
            taxTotal +=
              (item.isitemwithOption
                ? item.new_item_tax_value
                : item.item_tax_value) * item.quantity;
          }
          // calculateTaxForItem(item);
          if (item.item_tax_per !== 0 && taxPercent === 0) {
            taxPercent = item.item_tax_per;
            taxMethod = item.item_tax_name;
            taxDivided = item.item_is_devidable == 1;
            taxInclusive = item.item_tax_method == ITEM_TAX_TYPES.INCLUSIVE;
          }

          if (
            item.itemlevelCharges &&
            Array.isArray(item.itemlevelCharges) &&
            item.itemlevelCharges.length > 0
          ) {
            let itemlevelchargesTotal = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const charge of item.itemlevelCharges) {
              // 1-percentage 0-fix
              let chargeTaxpercentage = taxPercent;
              if (charge.tax_amount) {
                chargeTaxpercentage = charge.tax_amount;
              }

              recalculateTax = true;
              let chargeAmount = charge.amount;
              if (charge.per_or_fixed == 1) {
                chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              } else {
                chargeAmount = Number(chargeAmount) * Number(item.quantity);
              }
              chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
              charge.calculated_charge = chargeAmount;
              itemlevelchargesTotal += Number(chargeAmount);
              if (charge.calculate_tax_for_item_charges == 0) {
                chargesamounttoExludefromtax += Number(chargeAmount);
              } else {
                charge.calculated_tax = (
                  (chargeTaxpercentage * chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
                Object.assign(item, {
                  recalculatedAmount:
                    item.recalculatedAmount + Number(chargeAmount),
                });
                // item.recalculatedAmount =
                //   item.recalculatedAmount + chargeAmount;
              }
            }
            finaltotalCharges += itemlevelchargesTotal;
            grandTotal += itemlevelchargesTotal;
            // order_subtotal += itemlevelchargesTotal;
            finalitemlevelChargestotal += itemlevelchargesTotal;
          }
        }
        // add kot_id to set
        if (!kotnoSet.has(item.kot_id)) kotnoSet.add(item.kot_id);
      });
      if (sectionhasItems) {
        let discounttoApply = 0;
        let coupondiscounttoApply = 0;
        finalorder_subtotal += order_subtotal;
        let discountApplied = false;
        let coupondiscountApplied = false;

        baseamounTotal += order_subtotal;
        if (sectionhasDiscount && discount_type != undefined && discount != 0) {
          discounttoApply = discount;
          // Check if discount type is in percent
          if (discount_type == '1') {
            // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
            discounttoApply = ((order_subtotal * discount) / 100).toFixed(
              ROUNDOFF_UPTO,
            );
          }
          if (grandTotal >= discounttoApply) {
            // calculate fraction of discount based on order subtotal to calculate discount for one item
            const splittedDiscountamount = Number(
              discounttoApply / order_subtotal,
            );
            billItems.map((item) => {
              let discountAmounttominus =
                Number(item.recalculatedAmount) * splittedDiscountamount;
              discountAmounttominus = Number(
                discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              );
              // order_level_discount += Number(
              //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              // );
              let recalculatedAmount = item.recalculatedAmount
                ? item.recalculatedAmount - discountAmounttominus
                : discountAmounttominus;
              recalculatedAmount = Number(
                recalculatedAmount.toFixed(ROUNDOFF_UPTO),
              );
              item.recalculatedAmount
                ? (item.recalculatedAmount = recalculatedAmount)
                : Object.assign(item, recalculatedAmount);
            });

            grandTotal -= discounttoApply;
            // currenttableButton.data.details.discounttoApply = discounttoApply;
            finaldiscounttoApply += Number(discounttoApply);
            discountApplied = true;
          }
        }

        if (
          sectionhasDiscount &&
          couponDisountamt != undefined &&
          couponDisountamt > 0
        ) {
          coupondiscounttoApply = couponDisountamt;
          // couponDisounttype 1=percentage 0=fixed
          if (Number(couponDisounttype) == 1) {
            coupondiscounttoApply = (
              (order_subtotal * coupondiscounttoApply) /
              100
            ).toFixed(ROUNDOFF_UPTO);
          }
          if (grandTotal >= coupondiscounttoApply) {
            const splittedDiscountamount = Number(
              coupondiscounttoApply / (order_subtotal - finaldiscounttoApply),
            );

            billItems.map((item) => {
              let discountAmounttominus =
                Number(item.recalculatedAmount) * splittedDiscountamount;
              discountAmounttominus = Number(
                discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              );
              // order_level_discount += Number(
              //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              // );
              let recalculatedAmount = item.recalculatedAmount
                ? item.recalculatedAmount - discountAmounttominus
                : discountAmounttominus;
              recalculatedAmount = Number(
                recalculatedAmount.toFixed(ROUNDOFF_UPTO),
              );
              item.recalculatedAmount
                ? (item.recalculatedAmount = recalculatedAmount)
                : Object.assign(item, recalculatedAmount);
            });

            grandTotal -= coupondiscounttoApply;
            finalcoupondiscounttoApply += Number(coupondiscounttoApply);
            // currenttableButton.data.details.coupondiscounttoApply = coupondiscounttoApply;
            coupondiscountApplied = true;
          }
        }

        if (discountApplied || coupondiscountApplied || recalculateTax) {
          let taxtocalculateonAmount = grandTotal;
          if (chargesamounttoExludefromtax > 0) {
            taxtocalculateonAmount -= chargesamounttoExludefromtax;
          }

          taxTotal = 0;
          billItems.map((item) => {
            if (item.product_group_id == group.id) {
              taxTotal += calculateTaxForItem(item);
            }
          });
        }

        finaltaxTotal += Number(taxTotal.toFixed(ROUNDOFF_UPTO));
        let taxDetails = extra_details.tax;
        if (taxDetails) {
          taxDetails.push({
            name: taxMethod,
            tax_percent: taxPercent,
            amount: taxTotal,
            tax_inclusive: taxInclusive,
            section: group.product_group_name,
            taxDivided,
          });
        } else {
          taxDetails = [
            {
              name: taxMethod,
              tax_percent: taxPercent,
              amount: taxTotal,
              tax_inclusive: taxInclusive,
              section: group.product_group_name,
              taxDivided,
            },
          ];
        }
        if (window.showLiquorSaleExempt && taxTotal === 0) {
          const sale_exempt_total =
            order_subtotal - discounttoApply - coupondiscounttoApply;

          Object.assign(extra_details, {
            sale_exempt_total,
          });
        }

        if (!taxInclusive) {
          grandTotal += taxTotal;
          Object.assign(extra_details, {
            exlusive_tax: (extra_details.exlusive_tax || 0) + taxTotal,
            tax: taxDetails,
          });
        } else {
          Object.assign(extra_details, {
            inclusive_tax: (extra_details.inclusive_tax || 0) + taxTotal,
            tax: taxDetails,
          });
        }
        finalGrandtotal += grandTotal;

        if (
          // bill_number != 0 &&
          discounttoApply != 0 ||
          coupondiscounttoApply != 0
        ) {
          discountHistory.push({
            product_group_id: group.id,
            order_id: bill_number,
            discounted_amt: discounttoApply,
            discount_type,
            discount_rate: discount,
            coupon_code_type: couponDisounttype,
            coupon_code_rate: couponDisountamt,
            coupon_code_amt: coupondiscounttoApply,
            coupon_code_name: details.coupon,
          });
        }

        // for quick bill because bill number is not generated
        if (
          details.table_name == 'Quick Bill' &&
          (discounttoApply != 0 || coupondiscounttoApply != 0)
        ) {
          discountHistory.push({
            product_group_id: group.id,
            order_id: bill_number,
            discounted_amt: discounttoApply,
            discount_type,
            discount_rate: discount,
            coupon_code_type: couponDisounttype,
            coupon_code_rate: couponDisountamt,
            coupon_code_amt: coupondiscounttoApply,
            coupon_code_name: details.coupon,
          });
        }
      }
    }

    details.extra_details = extra_details;
    details.discounttoApply = finaldiscounttoApply.toFixed(ROUNDOFF_UPTO);
    details.taxtoApply = finaltaxTotal.toFixed(ROUNDOFF_UPTO);
    details.coupondiscounttoApply =
      finalcoupondiscounttoApply.toFixed(ROUNDOFF_UPTO);
    details.order_subtotal = finalorder_subtotal.toFixed(ROUNDOFF_UPTO);
    details.item_level_total_charges = finalitemlevelChargestotal;

    details.issectionwisebilling = ISBILLINGBYSECTION_ON;
    if (discountHistory.length > 0) {
      details.discountHistory = discountHistory;
      extra_details.discountHistory = discountHistory;
    }

    if (discount && !discounted_product_groups.length) {
      let discounttoApply = discount;
      if (discount_type == '1') {
        // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
        discounttoApply = ((finalorder_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }

      finalGrandtotal = Number(finalGrandtotal.toFixed(window.ROUNDOFF_UPTO));
      if (finalGrandtotal >= discounttoApply) {
        discounttoApply = Number(discounttoApply);
        const DiscountTotalbeforeDistribution = discounttoApply;
        let itemSubtotalBeforeDiscountApply = 0;
        let itemSubtotalAfterDiscountApply = 0;
        // if (!details.isOldbill) {
        //   grandTotal = grandTotal - discounttoApply;
        // }
        discountApplied = true;
        const splittedDiscountamount = Number(
          discounttoApply / finalorder_subtotal,
        );

        billItems.map((item) => {
          const discountAmounttominus = Number(
            Number(item.recalculatedAmount) * splittedDiscountamount,
          );
          order_level_discount += Number(discountAmounttominus);
          itemSubtotalBeforeDiscountApply += Number(item.recalculatedAmount);
          // order_level_discount = Number(order_level_discount.toFixed(3));
          // order_level_discount = Number(order_level_discount.toFixed(3));

          let recalculatedAmount = item.recalculatedAmount
            ? Number(item.recalculatedAmount - discountAmounttominus).toFixed(
                ROUNDOFF_UPTO,
              )
            : discountAmounttominus;
          recalculatedAmount =
            Number(recalculatedAmount).toFixed(ROUNDOFF_UPTO);
          // if (!details.isOldbill || (details.isOldbill && details.billType == 0)) {
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
          // }
          itemSubtotalAfterDiscountApply += Number(item.recalculatedAmount);
        });
        const DiscountTotalAfterDistribution = order_level_discount;
        // details.discounttoApply = order_level_discount;
        // details.discounttoApply = discounttoApply;
        discounttoApply = order_level_discount;
        // if (!details.isOldbill) {
        finalGrandtotal -= discounttoApply;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);
        finaldiscounttoApply = Number(discounttoApply);
        details.discounttoApply = finaldiscounttoApply.toFixed(ROUNDOFF_UPTO);

        // check if there is any difference after discount distribution on item level
        discountDiff =
          Number(DiscountTotalbeforeDistribution) -
          Number(DiscountTotalAfterDistribution);
        if (discountDiff) {
          // billItems.map((item) => {
          const amountAfterDiscountDiff =
            Number(billItems[0].recalculatedAmount) + discountDiff;
          if (amountAfterDiscountDiff > 0) {
            billItems[0].recalculatedAmount = amountAfterDiscountDiff;
            // details.discounttoApply = Number(DiscountTotalbeforeDistribution);
            discounttoApply = Number(DiscountTotalbeforeDistribution);
          }
          // });
        }

        // check discount on order subtotal if there is any diff then adjust this amount
        const itemSubtotalIfDiscountAppliedOnItemSubtotal =
          itemSubtotalBeforeDiscountApply - discounttoApply;

        if (
          itemSubtotalIfDiscountAppliedOnItemSubtotal !==
          itemSubtotalAfterDiscountApply
        ) {
        }
      }
    }

    if (
      discount &&
      extra_details &&
      extra_details.reelo &&
      extra_details.reelo_redeemed_amount
    ) {
      finalGrandtotal -= extra_details.reelo_redeemed_amount;
    }
    if (window.orderCharges) {
      details.order_level_total_charges = 0;
      details.charges_level_total_tax = 0;
      const { charges } = details;
      if (charges && charges.length > 0) {
        let chargesTotal = 0;
        let chargesTotaltax = 0;
        charges.forEach((charge) => {
          let chargeAmount = charge.amount;
          if (charge.per_or_fixed == 1) {
            // chargeAmount = Number(((baseamounTotal * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO));
            if (charge.extra_details) {
              const extra_details = safeParse(charge.extra_details);
              switch (Number(extra_details.applicable_on_amount)) {
                case 0:
                  chargeAmount = Number(
                    (
                      ((baseamounTotal - details.discounttoApply || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 1:
                  chargeAmount = Number(
                    ((baseamounTotal * chargeAmount) / 100).toFixed(
                      ROUNDOFF_UPTO,
                    ),
                  );
                  break;

                case 2:
                  chargeAmount = Number(
                    (
                      ((baseamounTotal - finaltaxTotal || 0) * chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                default:
                  chargeAmount = Number(
                    (
                      ((baseamounTotal - details.discounttoApply || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;
              }
              // if (extra_details.applicable_on_amount == '1') {
              //   chargeAmount = Number(
              //     ((baseamounTotal * chargeAmount) / 100).toFixed(
              //       ROUNDOFF_UPTO,
              //     ),
              //   );
              // } else {
              //   chargeAmount = Number(
              //     (
              //       ((baseamounTotal - details.discounttoApply || 0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // }
            } else {
              chargeAmount = Number(
                (
                  ((baseamounTotal - details.discounttoApply || 0) *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO),
              );
            }
          }
          // check if the tax is available
          if (charge.is_tax_applicable && charge.tax_amount) {
            // let calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
            // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
            let calculatedChargestax = 0;
            if (charge.is_tax_included) {
              let taxPerct;
              if (charge.tax_divided) {
                taxPerct = Number(
                  Number(
                    (chargeAmount / (100 + charge.tax_amount / 2)) *
                      (charge.tax_amount / 2),
                  ).toFixed(ROUNDOFF_UPTO),
                );
                // taxPerct = roundAmountUptoDecimals(Number((chargeAmount / (100 + (charge.tax_amount/2))) * (charge.tax_amount/2)), ROUNDOFF_UPTO);
                calculatedChargestax = taxPerct * 2;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              } else {
                calculatedChargestax =
                  (chargeAmount / (100 + charge.tax_amount)) *
                  charge.tax_amount;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            } else {
              let taxPerct;
              if (charge.tax_divided) {
                // taxPerct = Number(
                //   chargeAmount * (charge.tax_amount / 2 / 100),
                // ).toFixed(ROUNDOFF_UPTO);
                taxPerct = Number(
                  ((charge.tax_amount / 2) * chargeAmount) / 100,
                ).toFixed(ROUNDOFF_UPTO);
                // taxPerct = roundAmountUptoDecimals(Number(chargeAmount * ((charge.tax_amount / 2) / 100)), ROUNDOFF_UPTO)
                calculatedChargestax = taxPerct * 2;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              } else {
                calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            }

            if (charge.is_tax_included === 0) {
              // Check if tax is exlcusive
              chargeAmount += Number(calculatedChargestax);
              chargeAmount = Number(
                Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
              );
            }
            Object.assign(charge, {
              is_tax_included: charge.is_tax_included,
              calculated_tax: calculatedChargestax,
            });
            chargesTotaltax += calculatedChargestax;
          }
          chargesTotal += Number(chargeAmount);
          charge.amounttoAdd = Number(chargeAmount);
        });
        if (chargesTotal >= 0) {
          finalGrandtotal += chargesTotal;
          finaltotalCharges += chargesTotal;
          details.order_level_total_charges = chargesTotal;
          details.charges_level_total_tax = Number(
            Number(chargesTotaltax).toFixed(ROUNDOFF_UPTO),
          );
        }
      }
    }
    if (DO_BILL_ROUNDOFF) {
      try {
        finalGrandtotal = Number(finalGrandtotal.toFixed(ROUNDOFF_UPTO));

        const previousTotal = finalGrandtotal;
        // finalGrandtotal = Math.round(finalGrandtotal);
        if (window.ROUNDING_INCREMENT) {
          finalGrandtotal = roundToStep(
            finalGrandtotal,
            window.ROUNDING_INCREMENT,
            window.ROUNDOFF_UPTO,
          );
        } else if (window.ROUNDOFF_UPTO === '3') {
          finalGrandtotal = roundOffLastDigit(finalGrandtotal);
        } else {
          finalGrandtotal = Math.round(finalGrandtotal);
        }
        if (previousTotal !== finalGrandtotal) {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: Number(
              (finalGrandtotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });
        } else {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: 0,
          });
        }
      } catch (error) {}
    }

    return {
      discounttoApply: finaldiscounttoApply,
      chargesTotal: finaltotalCharges,
      taxTotal: finaltaxTotal,
      totalAmount: finalorder_subtotal,
      grandTotal: finalGrandtotal,
      order_id,
      extra_details,
      charges,
      sync_status: 0,
    };
  } catch (error) {
    console.log('error in section wise calculation', error);
  }
}
async function precalculateDetailsCheck(currenttableButton) {
  if (ISBILLINGBYSECTION_ON) {
    await calculateDetailsbysection(currenttableButton);
  } else {
    await calculateDetails(currenttableButton);
  }
  if (
    window.accessOfCustomerDisplay &&
    currenttableButton &&
    currenttableButton.data &&
    currenttableButton.data.details
  ) {
    const state = {
      total: currenttableButton.data.details.order_total.toFixed(ROUNDOFF_UPTO),
      items: currenttableButton.data.details.items,
      billNumber: currenttableButton.data.details.order_id,
      qrCode: currenttableButton.data.details.field2,
    };
    window.sendStatetolocalcustomerdisplay(state);
  }
}

/**
 * Calculate the order total
 * @param {bill items} billItems
 */
async function calculateDetailsbysection(currenttableButton) {
  if (
    currenttableButton != undefined &&
    currenttableButton.data != undefined &&
    currenttableButton.data.details != undefined
  ) {
    calculationDone = false;
    const { discount } = currenttableButton.data.details;
    const { discount_type } = currenttableButton.data.details;
    const raw_discounted_product_groups =
      currenttableButton.data.details.discounted_product_groups;
    const discounted_product_groups = raw_discounted_product_groups
      ? String(raw_discounted_product_groups).split(',')
      : [];

    const { couponDisountamt } = currenttableButton.data.details;
    const { couponDisounttype } = currenttableButton.data.details;
    billItems = currenttableButton.data.details.items;
    const kotnoSet = new Set();

    currenttableButton.data.details.order_total = 0;
    currenttableButton.data.details.totalCharges = 0;
    currenttableButton.data.details.item_level_total_charges = 0;

    const { bill_number } = currenttableButton.data.details;
    const extra_details = currenttableButton.data.details.extra_details || {};
    if (extra_details) {
      if (extra_details.exlusive_tax) extra_details.exlusive_tax = 0;
      if (extra_details.inclusive_tax) extra_details.inclusive_tax = 0;
      if (extra_details.tax) extra_details.tax = [];
    }

    const discountHistory = [];
    let finalGrandtotal = 0;
    let baseamounTotal = 0;
    let finaltaxTotal = 0;
    let finaldiscounttoApply = 0;
    let finalcoupondiscounttoApply = 0;
    let finalorder_subtotal = 0;
    let finaltotalCharges = 0;
    let finalitemlevelChargestotal = 0;
    let finalchargesamounttoExludefromtax = 0;
    let order_level_discount = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const group of window.globalproductGroups) {
      let grandTotal = 0;
      let taxTotal = 0;
      let taxInclusive = false;
      let taxDivided = false;
      let taxPercent = 0;
      let taxMethod;
      let sectionhasItems = false;
      let order_subtotal = 0;
      let chargesamounttoExludefromtax = 0;
      let recalculateTax = false;
      let sectionDiscount = 0;
      let sectionCouponDiscount = 0;
      let sectionOrderDiscount = 0;

      const taxedProductgrps = {};
      let sectionhasDiscount =
        Number(discount || 0) > 0 || Number(couponDisountamt || 0) > 0;

      if (
        sectionhasDiscount &&
        discounted_product_groups.length > 0 &&
        discounted_product_groups.includes(String(group.id))
      ) {
        sectionhasDiscount = true;
      } else {
        sectionhasDiscount = false;
      }

      MULTI_TAX = false;

      // eslint-disable-next-line no-loop-func
      billItems.forEach((item) => {
        if (item.product_group_id == group.id) {
          sectionhasItems = true;
          item.quantity = Number(item.quantity);
          item.amount = Number(item.amount);
          item.recalculatedAmount = Number(item.amount);
          grandTotal += item.amount;
          order_subtotal += item.amount;
          recalculateTax = true;
          if (
            item.product_group_id &&
            window.taxGroupMapping[item.product_group_id]
          ) {
            Object.assign(item, {
              productGrptaxes: window.taxGroupMapping[item.product_group_id],
            });
          }

          if (
            item.productGrptaxes &&
            item.product_group_id &&
            !taxedProductgrps[item.product_group_id]
          ) {
            taxedProductgrps[item.product_group_id] = sortBy(
              item.productGrptaxes,
              'sort',
            );
          }

          if (item.productGrptaxes && item.productGrptaxes.length > 1) {
            MULTI_TAX = true;
          }

          if (MULTI_TAX) {
            resetItemtax(item);
          }
          calculateTaxForItem(item);

          if (item.amount !== 0) {
            taxTotal +=
              (item.isitemwithOption
                ? item.new_item_tax_value
                : item.item_tax_value) * item.quantity;
          }
          // calculateTaxForItem(item);
          if (item.item_tax_per !== 0 && taxPercent === 0) {
            taxPercent = item.item_tax_per;
            taxMethod = item.item_tax_name;
            taxDivided = item.item_is_devidable == 1;
            taxInclusive = item.item_tax_method == ITEM_TAX_TYPES.INCLUSIVE;
          }

          if (
            item.itemlevelCharges &&
            Array.isArray(item.itemlevelCharges) &&
            item.itemlevelCharges.length > 0
          ) {
            let itemlevelchargesTotal = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const charge of item.itemlevelCharges) {
              // 1-percentage 0-fix
              let chargeTaxpercentage = taxPercent;
              if (charge.tax_amount) {
                chargeTaxpercentage = charge.tax_amount;
              }

              recalculateTax = true;
              let chargeAmount = charge.amount;
              if (charge.per_or_fixed == 1) {
                chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              } else {
                chargeAmount = Number(chargeAmount) * Number(item.quantity);
              }
              chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
              charge.calculated_charge = chargeAmount;
              itemlevelchargesTotal += Number(chargeAmount);
              if (charge.calculate_tax_for_item_charges == 0) {
                chargesamounttoExludefromtax += Number(chargeAmount);
                finalchargesamounttoExludefromtax += Number(chargeAmount);
              } else {
                charge.calculated_tax = (
                  (chargeTaxpercentage * chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
                Object.assign(item, {
                  recalculatedAmount:
                    item.recalculatedAmount + Number(chargeAmount),
                });
                // item.recalculatedAmount =
                //   item.recalculatedAmount + chargeAmount;
              }
            }
            finaltotalCharges += itemlevelchargesTotal;
            grandTotal += itemlevelchargesTotal;
            // order_subtotal += itemlevelchargesTotal;
            finalitemlevelChargestotal += itemlevelchargesTotal;
          }
        }
        // add kot_id to set
        if (!kotnoSet.has(item.kot_id)) kotnoSet.add(item.kot_id);
      });
      if (sectionhasItems) {
        let discounttoApply = 0;
        let coupondiscounttoApply = 0;
        finalorder_subtotal += order_subtotal;
        let discountApplied = false;
        let coupondiscountApplied = false;

        order_subtotal = Number(order_subtotal.toFixed(window.ROUNDOFF_UPTO));
        grandTotal = Number(grandTotal.toFixed(window.ROUNDOFF_UPTO));

        baseamounTotal += order_subtotal;
        if (sectionhasDiscount && discount_type != undefined && discount != 0) {
          discounttoApply = discount;
          // Check if discount type is in percent
          if (discount_type == '1') {
            // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
            discounttoApply = ((order_subtotal * discount) / 100).toFixed(
              ROUNDOFF_UPTO,
            );
          }

          const DiscountTotalbeforeDistribution = discounttoApply;
          let itemSubtotalBeforeDiscountApply = 0;
          let itemSubtotalAfterDiscountApply = 0;
          if (grandTotal >= discounttoApply) {
            // calculate fraction of discount based on order subtotal to calculate discount for one item
            const splittedDiscountamount = Number(
              discounttoApply / order_subtotal,
            );

            billItems.map((item) => {
              if (item.product_group_id == group.id) {
                itemSubtotalBeforeDiscountApply += Number(
                  item.recalculatedAmount,
                );
                let discountAmounttominus =
                  Number(item.recalculatedAmount) * splittedDiscountamount;
                // discountAmounttominus = Number(
                //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
                // );

                sectionOrderDiscount += Number(discountAmounttominus);
                order_level_discount += Number(
                  discountAmounttominus.toFixed(ROUNDOFF_UPTO),
                );
                let recalculatedAmount = item.recalculatedAmount
                  ? item.recalculatedAmount - discountAmounttominus
                  : discountAmounttominus;
                recalculatedAmount = Number(
                  recalculatedAmount.toFixed(window.ROUNDOFF_UPTO),
                );
                item.recalculatedAmount
                  ? (item.recalculatedAmount = recalculatedAmount)
                  : Object.assign(item, { recalculatedAmount });
                itemSubtotalAfterDiscountApply += Number(
                  item.recalculatedAmount,
                );
              }
            });

            const DiscountTotalAfterDistribution = sectionOrderDiscount;
            discounttoApply = sectionOrderDiscount;
            discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);

            grandTotal -= discounttoApply;
            // currenttableButton.data.details.discounttoApply = discounttoApply;
            finaldiscounttoApply += Number(discounttoApply);
            sectionDiscount = Number(discounttoApply);

            discountApplied = true;
            const before = parseFloat(DiscountTotalbeforeDistribution) || 0;
            const after = parseFloat(DiscountTotalAfterDistribution) || 0;

            const discountDiff =
              Number(before.toFixed(7)) - Number(after.toFixed(7));

            if (discountDiff) {
              const matchedItem = billItems.find(
                (item) => item.product_group_id === group.id,
              );
              // billItems.map((item) => {
              const amountAfterDiscountDiff =
                Number(matchedItem.recalculatedAmount) + discountDiff;
              if (amountAfterDiscountDiff > 0) {
                matchedItem.recalculatedAmount = amountAfterDiscountDiff;
                currenttableButton.data.details.discounttoApply = Number(
                  DiscountTotalbeforeDistribution,
                );
                discounttoApply = Number(DiscountTotalbeforeDistribution);
                // return;
              }
              // });
            }

            // check discount on order subtotal if there is any diff then adjust this amount
            const itemSubtotalIfDiscountAppliedOnItemSubtotal =
              itemSubtotalBeforeDiscountApply - discounttoApply;

            if (
              itemSubtotalIfDiscountAppliedOnItemSubtotal !==
              itemSubtotalAfterDiscountApply
            ) {
              const subTotalDifference =
                itemSubtotalAfterDiscountApply -
                itemSubtotalIfDiscountAppliedOnItemSubtotal;

              const matchedItem = billItems.find(
                (item) => item.product_group_id === group.id,
              );
              matchedItem.recalculatedAmount =
                Number(matchedItem.recalculatedAmount) -
                Number(subTotalDifference);
            }
          }
        }

        if (
          sectionhasDiscount &&
          couponDisountamt != undefined &&
          couponDisountamt > 0
        ) {
          coupondiscounttoApply = couponDisountamt;
          // couponDisounttype 1=percentage 0=fixed
          if (Number(couponDisounttype) == 1) {
            coupondiscounttoApply = (
              (order_subtotal * coupondiscounttoApply) /
              100
            ).toFixed(ROUNDOFF_UPTO);
          }
          if (grandTotal >= coupondiscounttoApply) {
            const splittedDiscountamount = Number(
              coupondiscounttoApply / (order_subtotal - finaldiscounttoApply),
            );

            billItems.map((item) => {
              let discountAmounttominus =
                Number(item.recalculatedAmount) * splittedDiscountamount;
              discountAmounttominus = Number(
                discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              );
              // order_level_discount += Number(
              //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              // );
              let recalculatedAmount = item.recalculatedAmount
                ? item.recalculatedAmount - discountAmounttominus
                : discountAmounttominus;
              recalculatedAmount = Number(
                recalculatedAmount.toFixed(ROUNDOFF_UPTO),
              );
              item.recalculatedAmount
                ? (item.recalculatedAmount = recalculatedAmount)
                : Object.assign(item, recalculatedAmount);
            });

            grandTotal -= coupondiscounttoApply;
            finalcoupondiscounttoApply += Number(coupondiscounttoApply);
            sectionCouponDiscount = Number(coupondiscounttoApply);
            // currenttableButton.data.details.coupondiscounttoApply = coupondiscounttoApply;
            coupondiscountApplied = true;
          }
        }

        if (discountApplied || coupondiscountApplied || recalculateTax) {
          let taxtocalculateonAmount = grandTotal;
          if (chargesamounttoExludefromtax > 0) {
            taxtocalculateonAmount -= chargesamounttoExludefromtax;
          }

          if (MULTI_TAX) {
            let taxapplicableAmount = taxtocalculateonAmount;

            // check if taxes are inclusive and has calculations on subtotal + prev tax totals
            if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
              Object.values(taxedProductgrps).forEach((ptaxes) => {
                if (ptaxes && ptaxes.length) {
                  let divisionFactorforcurrentgrp = 0;
                  let inclusiveTaxrates = 0;
                  ptaxes.forEach((currentptax) => {
                    // Check if tax type is inclusive
                    // If the tax type is inclusive we
                    let isTaxontax = false;
                    if (
                      currentptax?.extra_details?.isTaxOnTax &&
                      currentptax?.extra_details?.applicableOnIds &&
                      currentptax?.extra_details?.applicableOnIds.length
                    ) {
                      isTaxontax = true;
                    }

                    if (isTaxontax) {
                      // Skip the tax if it is tax on tax
                      // return;
                    }

                    if (currentptax.tax_method === 1) {
                      if (
                        currentptax.cal_method ===
                          TAX_CALCULATION_ON.SUBTOTAL &&
                        currentptax?.extra_details?.inclusiveDivfactor
                      ) {
                        divisionFactorforcurrentgrp =
                          currentptax?.extra_details?.inclusiveDivfactor;
                      } else {
                        inclusiveTaxrates += currentptax.tax_perct * 0.01;
                      }
                    }
                  });
                  if (divisionFactorforcurrentgrp > 0) {
                    // recalculate the subtotal
                    taxapplicableAmount /= divisionFactorforcurrentgrp;
                  } else if (inclusiveTaxrates > 0) {
                    taxapplicableAmount /= 1 + inclusiveTaxrates;
                  }
                }
              });
            }

            totalwithoutTax = taxapplicableAmount;

            const previousTaxtotal = [];
            const previousTaxesmap = {};
            const taxlistTomaintain = [];
            let inclusiveTotal = 0;
            let exclusiveTotal = 0;

            // Check if there are multiple taxes present and apply
            if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
              Object.keys(taxedProductgrps).forEach((currentpg) => {
                const taxList = taxedProductgrps[currentpg];
                if (taxList && taxList.length) {
                  taxList.forEach((currentTax) => {
                    if (currentTax && !currentTax.applied) {
                      const isInclusive = currentTax.tax_method === 1;

                      let applyTaxon = taxapplicableAmount;
                      if (
                        currentTax.cal_method ===
                        TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
                      ) {
                        // Add the previous tax totals as well
                        applyTaxon =
                          taxapplicableAmount +
                          previousTaxtotal.reduce((a, b) => a + b, 0);
                      } else if (
                        currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                      ) {
                        // Add the previous tax totals as well
                        applyTaxon = previousTaxtotal.reduce(
                          (a, b) => a + b,
                          0,
                        );
                      }

                      // check the tax is on tax
                      if (
                        currentTax?.extra_details?.isTaxOnTax &&
                        currentTax?.extra_details?.applicableOnIds &&
                        currentTax?.extra_details?.applicableOnIds.length &&
                        (currentTax.cal_method ===
                          TAX_CALCULATION_ON.PREVIOUSTAX ||
                          currentTax.cal_method ===
                            TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX)
                      ) {
                        let previoustotalforcurrent = 0;
                        currentTax?.extra_details?.applicableOnIds.forEach(
                          (grpid) => {
                            previoustotalforcurrent +=
                              previousTaxesmap[grpid] || 0;
                          },
                        );

                        if (previoustotalforcurrent > 0) {
                          // applyTaxon = previoustotalforcurrent;
                          if (
                            currentTax.cal_method ===
                            TAX_CALCULATION_ON.PREVIOUSTAX
                          ) {
                            applyTaxon = previoustotalforcurrent;
                          } else {
                            applyTaxon =
                              taxapplicableAmount + previoustotalforcurrent;
                          }
                        } else {
                          // If the taxes total is 0 then do not apply
                          return;
                        }
                      }

                      const currentTaxtotal = calculateTax({
                        amount: applyTaxon,
                        inclusive: false,
                        tax_percent: currentTax.tax_perct,
                        is_devidable: Boolean(currentTax.is_devidable),
                      });

                      previousTaxtotal.push(currentTaxtotal);

                      Object.assign(previousTaxesmap, {
                        [currentTax.tax_id]: currentTaxtotal,
                      });

                      taxlistTomaintain.push({
                        name: currentTax.tax_name,
                        tax_percent: currentTax.tax_perct,
                        amount: currentTaxtotal,
                        tax_inclusive: isInclusive,
                        taxDivided: Boolean(currentTax.is_devidable),
                        section: group.product_group_name,
                      });

                      if (isInclusive) {
                        inclusiveTotal += currentTaxtotal;
                      } else {
                        exclusiveTotal += currentTaxtotal;
                      }
                      billItems.map((item) => {
                        calculateMultiTaxForItemLevel(item);
                      });
                      // previousTaxtotal=currentTax.TaxValue;
                    }
                  });
                }
              });
            }

            // add the tax details to the extra details object
            let taxDetails = extra_details.tax;
            if (taxDetails) {
              taxDetails.push(...taxlistTomaintain);
            } else {
              taxDetails = taxlistTomaintain;
            }

            Object.assign(extra_details, {
              ...(inclusiveTotal && {
                inclusive_tax: inclusiveTotal,
              }),
              ...(exclusiveTotal && {
                exlusive_tax: exclusiveTotal,
              }),
              tax: taxDetails,
            });

            // Now add the exclusive tax total to order total
            if (exclusiveTotal > 0) {
              grandTotal += exclusiveTotal;
            }

            taxTotal = Number(
              Number(inclusiveTotal + exclusiveTotal).toFixed(
                window.ROUNDOFF_UPTO,
              ),
            );
            finaltaxTotal += Number(taxTotal.toFixed(window.ROUNDOFF_UPTO));

            currenttableButton.data.details.taxtoApply =
              taxTotal.toFixed(ROUNDOFF_UPTO);
            finalGrandtotal += grandTotal;
          } else {
            taxTotal = 0;
            billItems.map((item) => {
              if (item.product_group_id == group.id) {
                taxTotal += calculateTaxForItem(item);
              }
            });

            finaltaxTotal += Number(taxTotal.toFixed(window.ROUNDOFF_UPTO));
            let taxDetails = extra_details.tax;
            if (taxDetails) {
              taxDetails.push({
                name: taxMethod,
                tax_percent: taxPercent,
                amount: Number(Number(taxTotal).toFixed(window.ROUNDOFF_UPTO)),
                tax_inclusive: taxInclusive,
                section: group.product_group_name,
                taxDivided,
              });
            } else {
              taxDetails = [
                {
                  name: taxMethod,
                  tax_percent: taxPercent,
                  amount: Number(
                    Number(taxTotal).toFixed(window.ROUNDOFF_UPTO),
                  ),
                  tax_inclusive: taxInclusive,
                  section: group.product_group_name,
                  taxDivided,
                },
              ];
            }

            if (!taxInclusive) {
              grandTotal += taxTotal;
              Object.assign(extra_details, {
                exlusive_tax: Number(
                  Number((extra_details.exlusive_tax || 0) + taxTotal).toFixed(
                    window.ROUNDOFF_UPTO,
                  ),
                ),
                tax: taxDetails,
              });
            } else {
              Object.assign(extra_details, {
                inclusive_tax: Number(
                  Number((extra_details.inclusive_tax || 0) + taxTotal).toFixed(
                    window.ROUNDOFF_UPTO,
                  ),
                ),
                tax: taxDetails,
              });
            }
            finalGrandtotal += grandTotal;
          }

          if (window.showLiquorSaleExempt && taxTotal === 0) {
            const sale_exempt_total =
              order_subtotal - discounttoApply - coupondiscounttoApply;
            Object.assign(extra_details, {
              sale_exempt_total,
            });
          }
        }
        if (
          // bill_number != 0 &&
          discounttoApply != 0 ||
          coupondiscounttoApply != 0
        ) {
          discountHistory.push({
            product_group_id: group.id,
            order_id: bill_number,
            discounted_amt: discounttoApply,
            discount_type,
            discount_rate: discount,
            coupon_code_type: couponDisounttype,
            coupon_code_rate: couponDisountamt,
            coupon_code_amt: coupondiscounttoApply,
            coupon_code_name: currenttableButton.data.details.coupon,
          });
        }

        // for quick bill because bill number is not generated
        if (
          currenttableButton.data.table_name == 'Quick Bill' &&
          (discounttoApply != 0 || coupondiscounttoApply != 0)
        ) {
          discountHistory.push({
            product_group_id: group.id,
            order_id: bill_number,
            discounted_amt: discounttoApply,
            discount_type,
            discount_rate: discount,
            coupon_code_type: couponDisounttype,
            coupon_code_rate: couponDisountamt,
            coupon_code_amt: coupondiscounttoApply,
            coupon_code_name: currenttableButton.data.details.coupon,
          });
        }
      }
    }

    let isLoyaltyDiscount = false;
    if (extra_details) {
      const extDetails = safeParse(extra_details);
      if (extDetails && extDetails.reelo_redeemed_amount) {
        isLoyaltyDiscount = true;
      }
    }

    if (
      finalorder_subtotal &&
      discount &&
      !isLoyaltyDiscount &&
      !discounted_product_groups.length
    ) {
      let discounttoApply = discount;
      if (discount_type == '1') {
        // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
        discounttoApply = ((finalorder_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }

      finalGrandtotal = Number(finalGrandtotal.toFixed(window.ROUNDOFF_UPTO));
      if (finalGrandtotal >= discounttoApply) {
        discounttoApply = Number(discounttoApply);
        const DiscountTotalbeforeDistribution = discounttoApply;
        // if (!details.isOldbill) {
        //   grandTotal = grandTotal - discounttoApply;
        // }
        discountApplied = true;
        const splittedDiscountamount = Number(
          discounttoApply / finalorder_subtotal,
        );

        billItems.map((item) => {
          const discountAmounttominus = Number(
            Number(item.recalculatedAmount) * splittedDiscountamount,
          );
          order_level_discount += Number(discountAmounttominus);
          // order_level_discount = Number(order_level_discount.toFixed(3));
          // order_level_discount = Number(order_level_discount.toFixed(3));

          let recalculatedAmount = item.recalculatedAmount
            ? Number(item.recalculatedAmount - discountAmounttominus).toFixed(
                ROUNDOFF_UPTO,
              )
            : discountAmounttominus;
          recalculatedAmount =
            Number(recalculatedAmount).toFixed(ROUNDOFF_UPTO);
          // if (!details.isOldbill || (details.isOldbill && details.billType == 0)) {
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
          // }
        });
        const DiscountTotalAfterDistribution = order_level_discount;
        // details.discounttoApply = order_level_discount;
        // details.discounttoApply = discounttoApply;
        discounttoApply = order_level_discount;
        // if (!details.isOldbill) {
        finalGrandtotal -= discounttoApply;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);
        finaldiscounttoApply = Number(discounttoApply);

        // check if there is any difference after discount distribution on item level
        const before = parseFloat(DiscountTotalbeforeDistribution) || 0;
        const after = parseFloat(DiscountTotalAfterDistribution) || 0;

        const discountDiff =
          Number(before.toFixed(7)) - Number(after.toFixed(7));
        if (discountDiff) {
          billItems.map((item) => {
            const amountAfterDiscountDiff =
              Number(item.recalculatedAmount) + discountDiff;
            if (amountAfterDiscountDiff > 0) {
              item.recalculatedAmount = amountAfterDiscountDiff;
              // details.discounttoApply = Number(DiscountTotalbeforeDistribution);
              discounttoApply = Number(DiscountTotalbeforeDistribution);
            }
          });
        }

        Object.assign(extra_details, {
          discount: {
            discount_type,
            discount_rate: discount,
            amount: discounttoApply,
          },
        });
      }
    }
    currenttableButton.data.details.extra_details = extra_details;
    currenttableButton.data.details.discounttoApply =
      finaldiscounttoApply.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.taxtoApply =
      finaltaxTotal.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.coupondiscounttoApply =
      finalcoupondiscounttoApply.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.order_subtotal =
      finalorder_subtotal.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.item_level_total_charges =
      finalitemlevelChargestotal;

    currenttableButton.data.details.issectionwisebilling =
      ISBILLINGBYSECTION_ON;
    if (discountHistory.length > 0) {
      currenttableButton.data.details.discountHistory = discountHistory;
    }

    if (
      // discount &&
      extra_details &&
      extra_details.reelo &&
      extra_details.reelo_redeemed_amount
    ) {
      finalGrandtotal -= extra_details.reelo_redeemed_amount;
    }

    if (window.orderCharges) {
      currenttableButton.data.details.order_level_total_charges = 0;
      currenttableButton.data.details.charges_level_total_tax = 0;
      const { charges } = currenttableButton.data.details;
      if (charges && charges.length > 0) {
        let chargesTotal = 0;
        let chargesTotaltax = 0;
        charges.forEach((charge) => {
          let chargeAmount = charge.amount;
          if (charge.per_or_fixed == 1) {
            // chargeAmount = Number(((baseamounTotal * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO));
            if (charge.extra_details) {
              const extra_details = safeParse(charge.extra_details);
              switch (extra_details.applicable_on_amount) {
                case 0:
                  chargeAmount = Number(
                    (
                      ((Number(baseamounTotal) -
                        Number(
                          currenttableButton.data.details.discounttoApply,
                        ) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 1:
                  chargeAmount = Number(
                    (
                      (Number(baseamounTotal) * Number(chargeAmount)) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 2:
                  chargeAmount = Number(
                    (
                      ((Number(baseamounTotal) - Number(finaltaxTotal) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                default:
                  chargeAmount = Number(
                    (
                      ((Number(baseamounTotal) -
                        Number(
                          currenttableButton.data.details.discounttoApply,
                        ) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;
              }
              // if (extra_details.applicable_on_amount == '1') {
              //   chargeAmount = Number(
              //     ((baseamounTotal * chargeAmount) / 100).toFixed(
              //       ROUNDOFF_UPTO,
              //     ),
              //   );
              // } else {
              //   chargeAmount = Number(
              //     (
              //       ((baseamounTotal -
              //         currenttableButton.data.details.discounttoApply || 0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // }
            } else {
              chargeAmount = Number(
                (
                  ((Number(baseamounTotal) -
                    Number(currenttableButton.data.details.discounttoApply) ||
                    0) *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO),
              );
            }
          }
          // check if the tax is available
          if (charge.is_tax_applicable && charge.tax_amount) {
            // let calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
            // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
            let calculatedChargestax = 0;
            if (charge.is_tax_included) {
              let taxPerct;
              if (charge.tax_divided) {
                calculatedChargestax = Number(
                  Number(
                    (chargeAmount / (100 + charge.tax_amount)) *
                      charge.tax_amount,
                  ).toFixed(ROUNDOFF_UPTO),
                );
                // taxPerct = roundAmountUptoDecimals(Number((chargeAmount / (100 + (charge.tax_amount/2))) * (charge.tax_amount/2)), ROUNDOFF_UPTO);
                // calculatedChargestax = taxPerct * 2;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              } else {
                calculatedChargestax =
                  (chargeAmount / (100 + charge.tax_amount)) *
                  charge.tax_amount;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            } else {
              let taxPerct;
              if (charge.tax_divided) {
                // taxPerct = Number(
                //   chargeAmount * (charge.tax_amount / 2 / 100),
                // ).toFixed(ROUNDOFF_UPTO);
                taxPerct = Number(
                  ((charge.tax_amount / 2) * chargeAmount) / 100,
                ).toFixed(ROUNDOFF_UPTO);
                // taxPerct = roundAmountUptoDecimals(Number(chargeAmount * ((charge.tax_amount / 2) / 100)), ROUNDOFF_UPTO)
                calculatedChargestax = taxPerct * 2;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              } else {
                calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            }

            if (charge.is_tax_included === 0) {
              // Check if tax is exlcusive
              chargeAmount += Number(calculatedChargestax);
              chargeAmount = Number(
                Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
              );
            }
            Object.assign(charge, {
              is_tax_included: charge.is_tax_included,
              calculated_tax: calculatedChargestax,
            });
            chargesTotaltax += calculatedChargestax;
          }
          chargesTotal += Number(chargeAmount);
          charge.amounttoAdd = Number(chargeAmount);
        });

        if (chargesTotal >= 0) {
          finalGrandtotal += chargesTotal;
          finaltotalCharges += chargesTotal;
          currenttableButton.data.details.order_level_total_charges =
            chargesTotal;
          currenttableButton.data.details.charges_level_total_tax = Number(
            Number(chargesTotaltax).toFixed(ROUNDOFF_UPTO),
          );
        }
      }
    }

    if (DO_BILL_ROUNDOFF) {
      try {
        finalGrandtotal = Number(finalGrandtotal.toFixed(ROUNDOFF_UPTO));

        const previousTotal = finalGrandtotal;
        // finalGrandtotal = Math.round(finalGrandtotal);
        if (window.ROUNDING_INCREMENT) {
          finalGrandtotal = roundToStep(
            finalGrandtotal,
            window.ROUNDING_INCREMENT,
            window.ROUNDOFF_UPTO,
          );
        } else if (window.ROUNDOFF_UPTO === '3') {
          finalGrandtotal = roundOffLastDigit(finalGrandtotal);
        } else {
          finalGrandtotal = Math.round(finalGrandtotal);
        }
        if (previousTotal !== finalGrandtotal) {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: Number(
              (finalGrandtotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });
        } else {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: 0,
          });
        }
      } catch (error) {}
    } else {
      Object.assign(currenttableButton.data.details.extra_details, {
        roundedAmount: 0,
      });
    }

    // add bill total to current table
    currenttableButton.data.details.order_total = finalGrandtotal;
    currenttableButton.data.details.totalCharges = finaltotalCharges;

    Object.assign(extra_details, {
      totalCharges: finaltotalCharges,
    });
    switch (currenttableButton.data.order_type_flag) {
      case TAKEAWAY_FLAG_ID:
        $('#takeawaybillGrandtotal').html(
          finalGrandtotal.toFixed(ROUNDOFF_UPTO),
        );
        break;
      case HOMED_FLAG_ID:
        $('#deliverybillGrandtotal').html(
          finalGrandtotal.toFixed(ROUNDOFF_UPTO),
        );
        break;
      case DINEIN_FLAG_ID:
      case VIRTUALTABLE_FLAG_ID:
        $('#billGrandtotal').html(finalGrandtotal.toFixed(ROUNDOFF_UPTO));
        break;
      case QUICKBILL_FLAG_ID:
        $('#quickbillGrandtotal').html(finalGrandtotal.toFixed(ROUNDOFF_UPTO));
        break;
      default:
        break;
    }
    if (window.showbillDetails) {
      try {
        $(`#${currenttableButton.id}`)
          .find('#tableamountlabel')
          .text(currency + finalGrandtotal.toFixed(ROUNDOFF_UPTO));
        // if (showkotnosonTable) {
        //    $('#' + currenttableButton.id)
        //       .find('#tablekotnosLabelid')
        //       .text(`KOT : ${[...kotnoSet].join(",")}`);
        // }
      } catch (error) {}
    }
  }
  calculationDone = true;
}

function calculateTax({ tax_percent, inclusive, amount, is_devidable }) {
  let taxTotal = 0;
  let taxPerct = 0;

  // const TEMP_ROUNDOFF_UPTO = Number(window.ROUNDOFF_UPTO || 1) + 1;

  if (inclusive) {
    taxTotal = Number(
      taxTotal + ((amount || 0) / (100 + tax_percent)) * tax_percent,
    );
  } else {
    // Check for exclusive case
    // eslint-disable-next-line no-lonely-if
    if (is_devidable) {
      taxPerct = Number((tax_percent / 2 / 100) * (amount || 0));
      taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
      taxTotal = Number(taxTotal + taxPerct * 2);
    } else {
      taxTotal = Number(taxTotal + ((amount || 0) * tax_percent) / 100);
    }
  }
  return roundAmountUptoDecimals(taxTotal, ROUNDOFF_UPTO);
}

function calculateItemTax(billItems) {
  let grandTotal = 0;
  let taxTotal = 0;
  let taxInclusive = false;
  let taxPercent = 0;
  let chargesamounttoExludefromtax = 0;
  let recalculateTax = false;
  let order_subtotal = 0;
  let totalCharges = 0;
  let taxMethod;
  let tax_id;
  let taxDivided = false;
  const taxedProductgrps = {};
  MULTI_TAX = false;
  billItems.forEach((item) => {
    if (
      item.product_group_id &&
      window.taxGroupMapping[item.product_group_id]
    ) {
      Object.assign(item, {
        productGrptaxes: window.taxGroupMapping[item.product_group_id],
      });
    }

    if (
      item.productGrptaxes &&
      item.product_group_id &&
      !taxedProductgrps[item.product_group_id]
    ) {
      taxedProductgrps[item.product_group_id] = sortBy(
        item.productGrptaxes,
        'sort',
      );
    }

    if (item.productGrptaxes && item.productGrptaxes.length > 1) {
      MULTI_TAX = true;
    }

    // if (MULTI_TAX) {
    //   resetItemtax(item);
    // }

    item.amount = Number(item.amount);
    grandTotal += Number(item.amount);
    order_subtotal += Number(item.amount);
    item.quantity = Number(item.quantity);

    recalculateTax = true;
    Object.assign(item, { recalculatedAmount: item.amount });
    // item.item_tax_value = calculateTaxForItem(item)
    if (item.amount !== 0) {
      taxTotal +=
        (item.isitemwithOption
          ? item.new_item_tax_value
          : item.item_tax_value) * item.quantity;
    }
    if (item.item_tax_per !== 0 && taxPercent === 0) {
      taxPercent = item.item_tax_per;
      taxMethod = item.item_tax_name;
      taxDivided = item.item_is_devidable == 1;
      taxInclusive = item.item_tax_method == ITEM_TAX_TYPES.INCLUSIVE;
      tax_id = item.productGrptaxes?.[0]?.tax_id;
    }

    if (MULTI_TAX) {
      resetItemtax(item);
    }
    if (
      // item.amount &&
      item.itemlevelCharges &&
      Array.isArray(item.itemlevelCharges) &&
      item.itemlevelCharges.length > 0
    ) {
      let itemlevelchargesTotal = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const charge of item.itemlevelCharges) {
        // 1-percentage 0-fix
        let chargeTaxpercentage = 0;
        if (charge.tax_amount) {
          chargeTaxpercentage = charge.tax_amount;
        }
        recalculateTax = true;
        let chargeAmount = charge.amount;
        if (charge.per_or_fixed == 1) {
          // chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO);
          if (charge.extra_details) {
            const extra_details = JSON.parse(charge.extra_details);
            // extra_details = JSON.parse(extra_details)
            if (extra_details.applicable_on_amount == '1') {
              chargeAmount = (
                ((item.pricebeforeDiscount
                  ? item.pricebeforeDiscount
                  : item.item_price) *
                  item.quantity *
                  chargeAmount) /
                100
              ).toFixed(ROUNDOFF_UPTO);
            } else {
              chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                ROUNDOFF_UPTO,
              );
            }
          } else {
            chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
              ROUNDOFF_UPTO,
            );
          }
        } else {
          chargeAmount = Number(chargeAmount) * Number(item.quantity);
        }

        chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
        charge.calculated_charge = chargeAmount;
        itemlevelchargesTotal += Number(chargeAmount);
        if (charge.calculate_tax_for_item_charges == 0) {
          chargesamounttoExludefromtax += Number(chargeAmount);
        } else {
          charge.calculated_tax = (
            (chargeTaxpercentage * chargeAmount) /
            100
          ).toFixed(ROUNDOFF_UPTO);
          Object.assign(item, {
            recalculatedAmount: Number(item.amount) + Number(chargeAmount),
          });
        }
      }

      totalCharges += itemlevelchargesTotal;
      grandTotal += itemlevelchargesTotal;
      order_subtotal += itemlevelchargesTotal;
      // itemleveltotalCharges += itemlevelchargesTotal;
    }
  });

  // New Recalculate
  if (recalculateTax) {
    let taxtocalculateonAmount = grandTotal;
    if (chargesamounttoExludefromtax > 0) {
      taxtocalculateonAmount -= chargesamounttoExludefromtax;
    }

    taxTotal = 0;
    if (MULTI_TAX) {
      let taxapplicableAmount = order_subtotal - chargesamounttoExludefromtax;

      // - chargesamounttoExludefromtax;
      // check if taxes are inclusive and has calculations on subtotal + prev tax totals
      if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
        Object.values(taxedProductgrps).forEach((ptaxes) => {
          if (ptaxes && ptaxes.length) {
            let divisionFactorforcurrentgrp = 0;
            let inclusiveTaxrates = 0;
            ptaxes.forEach((currentptax) => {
              // Check if tax type is inclusive
              // If the tax type is inclusive we
              let isTaxontax = false;
              if (
                currentptax?.extra_details?.isTaxOnTax &&
                currentptax?.extra_details?.applicableOnIds &&
                currentptax?.extra_details?.applicableOnIds.length
              ) {
                isTaxontax = true;
              }

              if (isTaxontax) {
                // Skip the tax if it is tax on tax
                // return;
              }

              if (currentptax.tax_method === 1) {
                if (
                  currentptax.cal_method ===
                    TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX &&
                  currentptax?.extra_details?.inclusiveDivfactor
                ) {
                  divisionFactorforcurrentgrp =
                    currentptax?.extra_details?.inclusiveDivfactor;
                } else {
                  inclusiveTaxrates += currentptax.tax_perct * 0.01;
                }
              }
            });
            if (divisionFactorforcurrentgrp > 0) {
              // recalculate the subtotal
              taxapplicableAmount /= divisionFactorforcurrentgrp;
            } else if (inclusiveTaxrates > 0) {
              taxapplicableAmount /= 1 + inclusiveTaxrates;
            }
          }
        });
      }

      totalwithoutTax = taxapplicableAmount;

      const previousTaxtotal = [];
      const previousTaxesmap = {};
      const taxlistTomaintain = [];
      let inclusiveTotal = 0;
      let exclusiveTotal = 0;

      // Check if there are multiple taxes present and apply
      if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
        Object.keys(taxedProductgrps).forEach((currentpg) => {
          const taxList = taxedProductgrps[currentpg];
          if (taxList && taxList.length) {
            taxList.forEach((currentTax) => {
              if (currentTax && !currentTax.applied) {
                const isInclusive = currentTax.tax_method === 1;

                let applyTaxon = taxapplicableAmount;
                if (
                  currentTax.cal_method ===
                  TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
                ) {
                  // Add the previous tax totals as well
                  applyTaxon =
                    taxapplicableAmount +
                    previousTaxtotal.reduce((a, b) => a + b, 0);
                } else if (
                  currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                ) {
                  // Add the previous tax totals as well
                  applyTaxon = previousTaxtotal.reduce((a, b) => a + b, 0);
                }

                // check the tax is on tax
                if (
                  currentTax?.extra_details?.isTaxOnTax &&
                  currentTax?.extra_details?.applicableOnIds &&
                  currentTax?.extra_details?.applicableOnIds.length &&
                  (currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX ||
                    currentTax.cal_method ===
                      TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX)
                ) {
                  let previoustotalforcurrent = 0;
                  currentTax?.extra_details?.applicableOnIds.forEach(
                    (grpid) => {
                      previoustotalforcurrent += previousTaxesmap[grpid] || 0;
                    },
                  );

                  if (previoustotalforcurrent > 0) {
                    // applyTaxon = previoustotalforcurrent;
                    if (
                      currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                    ) {
                      applyTaxon = previoustotalforcurrent;
                    } else {
                      applyTaxon =
                        taxapplicableAmount + previoustotalforcurrent;
                    }
                  } else {
                    // If the taxes total is 0 then do not apply
                    return;
                  }
                }

                const currentTaxtotal = calculateTax({
                  amount: applyTaxon,
                  inclusive: false,
                  tax_percent: currentTax.tax_perct,
                  is_devidable: Boolean(currentTax.is_devidable),
                });

                previousTaxtotal.push(currentTaxtotal);

                Object.assign(previousTaxesmap, {
                  [currentTax.tax_id]: currentTaxtotal,
                });

                const taxObj = {
                  name: currentTax.tax_name,
                  tax_percent: currentTax.tax_perct,
                  amount: currentTaxtotal,
                  tax_inclusive: isInclusive,
                  taxDivided: Boolean(currentTax.is_devidable),
                  tax_id: currentTax.tax_id,
                };
                if (taxObj.taxDivided) {
                  const cgst = taxObj.amount / 2;
                  Object.assign(taxObj, {
                    sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                    cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                  });
                }
                taxlistTomaintain.push(taxObj);

                if (isInclusive) {
                  inclusiveTotal += currentTaxtotal;
                } else {
                  exclusiveTotal += currentTaxtotal;
                }
                // previousTaxtotal=currentTax.TaxValue;
              }
            });
          }
        });
      }

      // Now add the exclusive tax total to order total
      if (exclusiveTotal > 0) {
        grandTotal += exclusiveTotal;
      }

      taxTotal = Number(
        Number(inclusiveTotal + exclusiveTotal).toFixed(ROUNDOFF_UPTO),
      );

      billItems.map((item) => {
        calculateMultiTaxForItemLevel(item);
      });
    } else {
      billItems.map((item) => {
        taxTotal += calculateTaxForItem(item);
      });

      if (!taxInclusive) {
        grandTotal += taxTotal;
      }
    }
  }
  return grandTotal;
}

/**
 * Calculate the order total
 * recalculated tax on item level
 * @param {bill items} billItems
 */
async function calculateDetails(currenttableButton) {
  if (
    currenttableButton != undefined &&
    currenttableButton.data != undefined &&
    currenttableButton.data.details != undefined
  ) {
    calculationDone = false;
    const { discount } = currenttableButton.data.details;
    const { discount_type } = currenttableButton.data.details;

    const { couponDisountamt } = currenttableButton.data.details;
    const { couponDisounttype } = currenttableButton.data.details;
    const billItems = currenttableButton.data.details.items;

    currenttableButton.data.details.order_total = 0;
    currenttableButton.data.details.totalCharges = 0;
    currenttableButton.data.details.item_level_total_charges = 0;

    const kotnoSet = new Set();
    const extra_details = currenttableButton.data.details.extra_details || {};
    if (extra_details) {
      if (extra_details.exlusive_tax) extra_details.exlusive_tax = 0;
      if (extra_details.inclusive_tax) extra_details.inclusive_tax = 0;
      if (extra_details.tax) extra_details.tax = [];
    }
    let grandTotal = 0;
    let taxTotal = 0;
    let taxInclusive = false;
    let taxPercent = 0;
    let totalCharges = 0;
    let itemleveltotalCharges = 0;
    let chargesamounttoExludefromtax = 0;
    let recalculateTax = false;
    let order_subtotal = 0;
    let taxMethod;
    let tax_id;
    const discountHistory = [];
    let taxDivided = false;
    const { bill_number } = currenttableButton.data.details;
    let order_level_discount = 0;
    let order_level_coupon_discount = 0;
    const taxedProductgrps = {};
    MULTI_TAX = false;
    billItems.forEach((item) => {
      if (
        item.product_group_id &&
        window.taxGroupMapping[item.product_group_id]
      ) {
        Object.assign(item, {
          productGrptaxes: window.taxGroupMapping[item.product_group_id],
        });
      }

      if (
        item.productGrptaxes &&
        item.product_group_id &&
        !taxedProductgrps[item.product_group_id]
      ) {
        taxedProductgrps[item.product_group_id] = sortBy(
          item.productGrptaxes,
          'sort',
        );
      }

      if (item.productGrptaxes && item.productGrptaxes.length > 1) {
        MULTI_TAX = true;
      }

      // if (MULTI_TAX) {
      //   resetItemtax(item);
      // }

      item.amount = Number(item.amount);
      grandTotal += Number(item.amount);
      order_subtotal += Number(item.amount);
      item.quantity = Number(item.quantity);

      recalculateTax = true;
      Object.assign(item, { recalculatedAmount: item.amount });
      // item.item_tax_value = calculateTaxForItem(item)
      if (item.amount !== 0) {
        taxTotal +=
          (item.isitemwithOption
            ? item.new_item_tax_value
            : item.item_tax_value) * item.quantity;
      }
      if (item.item_tax_per !== 0 && taxPercent === 0) {
        taxPercent = item.item_tax_per;
        taxMethod = item.item_tax_name;
        taxDivided = item.item_is_devidable == 1;
        taxInclusive = item.item_tax_method == ITEM_TAX_TYPES.INCLUSIVE;
        tax_id = item.productGrptaxes?.[0]?.tax_id;
      }

      if (MULTI_TAX) {
        resetItemtax(item);
      }
      if (
        // item.amount &&
        item.itemlevelCharges &&
        Array.isArray(item.itemlevelCharges) &&
        item.itemlevelCharges.length > 0
      ) {
        let itemlevelchargesTotal = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const charge of item.itemlevelCharges) {
          // 1-percentage 0-fix
          let chargeTaxpercentage = 0;
          if (charge.tax_amount) {
            chargeTaxpercentage = charge.tax_amount;
          }
          recalculateTax = true;
          let chargeAmount = charge.amount;
          if (charge.per_or_fixed == 1) {
            // chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO);
            if (charge.extra_details) {
              const extra_details = JSON.parse(charge.extra_details);
              // extra_details = JSON.parse(extra_details)
              if (extra_details.applicable_on_amount == '1') {
                chargeAmount = (
                  ((item.pricebeforeDiscount
                    ? item.pricebeforeDiscount
                    : item.item_price) *
                    item.quantity *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
              } else {
                chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              }
            } else {
              chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                ROUNDOFF_UPTO,
              );
            }
          } else {
            chargeAmount = Number(chargeAmount) * Number(item.quantity);
          }

          chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
          charge.calculated_charge = chargeAmount;
          itemlevelchargesTotal += Number(chargeAmount);
          if (charge.calculate_tax_for_item_charges == 0) {
            chargesamounttoExludefromtax += Number(chargeAmount);
          } else {
            charge.calculated_tax = (
              (chargeTaxpercentage * chargeAmount) /
              100
            ).toFixed(ROUNDOFF_UPTO);
            Object.assign(item, {
              recalculatedAmount: Number(item.amount) + Number(chargeAmount),
            });
          }
        }

        totalCharges += itemlevelchargesTotal;
        grandTotal += itemlevelchargesTotal;
        order_subtotal += itemlevelchargesTotal;
        itemleveltotalCharges += itemlevelchargesTotal;
      }

      // add kot_id to set
      if (!kotnoSet.has(item.kot_id)) kotnoSet.add(item.kot_id);
    });

    currenttableButton.data.details.order_subtotal = order_subtotal;

    let discountApplied = false;
    let coupondiscountApplied = false;
    if (order_subtotal && discount_type != undefined && discount != 0) {
      let discounttoApply = discount;

      // Check if discount type is in percent
      if (discount_type == '1') {
        // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
        discounttoApply = ((order_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }
      grandTotal = Number(grandTotal.toFixed(window.ROUNDOFF_UPTO));
      if (grandTotal >= discounttoApply) {
        // grandTotal = grandTotal - discounttoApply;
        currenttableButton.data.details.discounttoApply = discounttoApply;
        discountApplied = true;
        const DiscountTotalbeforeDistribution = discounttoApply;

        // calculate fraction of discount based on order subtotal to calculate discount for one item
        const splittedDiscountamount = Number(
          discounttoApply / (order_subtotal - chargesamounttoExludefromtax),
        );
        billItems.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedDiscountamount;
          // discountAmountt  ominus = Number((discountAmounttominus).toFixed(ROUNDOFF_UPTO))
          // order_level_discount += Number(
          //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
          // );
          order_level_discount += Number(discountAmounttominus);
          // order_level_discount = Number(order_level_discount.toFixed(2));
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount = Number(
            recalculatedAmount.toFixed(ROUNDOFF_UPTO),
          );
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
        });

        const DiscountTotalAfterDistribution = order_level_discount;
        discounttoApply = order_level_discount;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);
        grandTotal -= discounttoApply;
        currenttableButton.data.details.discounttoApply = order_level_discount;

        const discountDiff =
          Number(DiscountTotalbeforeDistribution) -
          Number(DiscountTotalAfterDistribution);

        if (discountDiff) {
          billItems.map((item) => {
            const amountAfterDiscountDiff =
              Number(item.recalculatedAmount) + discountDiff;
            if (amountAfterDiscountDiff > 0) {
              item.recalculatedAmount = amountAfterDiscountDiff;
              currenttableButton.data.details.discounttoApply = Number(
                DiscountTotalbeforeDistribution,
              );
              discounttoApply = Number(DiscountTotalbeforeDistribution);
              return;
            }
          });
        }
      }
      Object.assign(extra_details, {
        discount: {
          discount_type,
          discount_rate: discount,
          amount: discounttoApply,
        },
      });
    } else {
      currenttableButton.data.details.discounttoApply = 0;
      Object.assign(extra_details, { discount: undefined });
    }

    if (couponDisountamt != undefined && couponDisountamt > 0) {
      let coupondiscounttoApply = couponDisountamt;
      // couponDisounttype 1=percentage 0=fixed
      if (Number(couponDisounttype) == 1) {
        coupondiscounttoApply = (
          (order_subtotal * coupondiscounttoApply) /
          100
        ).toFixed(ROUNDOFF_UPTO);
      }
      if (grandTotal >= coupondiscounttoApply) {
        // grandTotal = grandTotal - coupondiscounttoApply;
        // currenttableButton.data.details.coupondiscounttoApply =
        //   coupondiscounttoApply;
        coupondiscountApplied = true;

        const splittedCouponDiscountamount = Number(
          coupondiscounttoApply /
            (order_subtotal - chargesamounttoExludefromtax),
        );
        billItems.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedCouponDiscountamount;

          order_level_coupon_discount += Number(
            discountAmounttominus.toFixed(ROUNDOFF_UPTO),
          );
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount = Number(
            recalculatedAmount.toFixed(ROUNDOFF_UPTO),
          );
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
        });
        // coupondiscounttoApply = order_level_coupon_discount;
        grandTotal -= coupondiscounttoApply;
        currenttableButton.data.details.coupondiscounttoApply =
          coupondiscounttoApply;
      }
    } else {
      currenttableButton.data.details.coupondiscounttoApply = 0;
    }

    // New Recalculate
    if (discountApplied || coupondiscountApplied || recalculateTax) {
      let taxtocalculateonAmount = grandTotal;
      if (chargesamounttoExludefromtax > 0) {
        taxtocalculateonAmount -= chargesamounttoExludefromtax;
      }

      taxTotal = 0;
      if (MULTI_TAX) {
        let taxapplicableAmount =
          order_subtotal -
          currenttableButton.data.details.discounttoApply -
          currenttableButton.data.details.coupondiscounttoApply -
          chargesamounttoExludefromtax;

        // - chargesamounttoExludefromtax;
        // check if taxes are inclusive and has calculations on subtotal + prev tax totals
        if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
          Object.values(taxedProductgrps).forEach((ptaxes) => {
            if (ptaxes && ptaxes.length) {
              let divisionFactorforcurrentgrp = 0;
              let inclusiveTaxrates = 0;
              ptaxes.forEach((currentptax) => {
                // Check if tax type is inclusive
                // If the tax type is inclusive we
                let isTaxontax = false;
                if (
                  currentptax?.extra_details?.isTaxOnTax &&
                  currentptax?.extra_details?.applicableOnIds &&
                  currentptax?.extra_details?.applicableOnIds.length
                ) {
                  isTaxontax = true;
                }

                if (isTaxontax) {
                  // Skip the tax if it is tax on tax
                  // return;
                }

                if (currentptax.tax_method === 1) {
                  if (
                    currentptax.cal_method ===
                      TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX &&
                    currentptax?.extra_details?.inclusiveDivfactor
                  ) {
                    divisionFactorforcurrentgrp =
                      currentptax?.extra_details?.inclusiveDivfactor;
                  } else {
                    inclusiveTaxrates += currentptax.tax_perct * 0.01;
                  }
                }
              });
              if (divisionFactorforcurrentgrp > 0) {
                // recalculate the subtotal
                taxapplicableAmount /= divisionFactorforcurrentgrp;
              } else if (inclusiveTaxrates > 0) {
                taxapplicableAmount /= 1 + inclusiveTaxrates;
              }
            }
          });
        }

        totalwithoutTax = taxapplicableAmount;

        const previousTaxtotal = [];
        const previousTaxesmap = {};
        const taxlistTomaintain = [];
        let inclusiveTotal = 0;
        let exclusiveTotal = 0;

        // Check if there are multiple taxes present and apply
        if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
          Object.keys(taxedProductgrps).forEach((currentpg) => {
            const taxList = taxedProductgrps[currentpg];
            if (taxList && taxList.length) {
              taxList.forEach((currentTax) => {
                if (currentTax && !currentTax.applied) {
                  const isInclusive = currentTax.tax_method === 1;

                  let applyTaxon = taxapplicableAmount;
                  if (
                    currentTax.cal_method ===
                    TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
                  ) {
                    // Add the previous tax totals as well
                    applyTaxon =
                      taxapplicableAmount +
                      previousTaxtotal.reduce((a, b) => a + b, 0);
                  } else if (
                    currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                  ) {
                    // Add the previous tax totals as well
                    applyTaxon = previousTaxtotal.reduce((a, b) => a + b, 0);
                  }

                  // check the tax is on tax
                  if (
                    currentTax?.extra_details?.isTaxOnTax &&
                    currentTax?.extra_details?.applicableOnIds &&
                    currentTax?.extra_details?.applicableOnIds.length &&
                    (currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX ||
                      currentTax.cal_method ===
                        TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX)
                  ) {
                    let previoustotalforcurrent = 0;
                    currentTax?.extra_details?.applicableOnIds.forEach(
                      (grpid) => {
                        previoustotalforcurrent += previousTaxesmap[grpid] || 0;
                      },
                    );

                    if (previoustotalforcurrent > 0) {
                      // applyTaxon = previoustotalforcurrent;
                      if (
                        currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                      ) {
                        applyTaxon = previoustotalforcurrent;
                      } else {
                        applyTaxon =
                          taxapplicableAmount + previoustotalforcurrent;
                      }
                    } else {
                      // If the taxes total is 0 then do not apply
                      return;
                    }
                  }

                  const currentTaxtotal = calculateTax({
                    amount: applyTaxon,
                    inclusive: false,
                    tax_percent: currentTax.tax_perct,
                    is_devidable: Boolean(currentTax.is_devidable),
                  });

                  previousTaxtotal.push(currentTaxtotal);

                  Object.assign(previousTaxesmap, {
                    [currentTax.tax_id]: currentTaxtotal,
                  });

                  const taxObj = {
                    name: currentTax.tax_name,
                    tax_percent: currentTax.tax_perct,
                    amount: currentTaxtotal,
                    tax_inclusive: isInclusive,
                    taxDivided: Boolean(currentTax.is_devidable),
                    tax_id: currentTax.tax_id,
                  };
                  if (taxObj.taxDivided) {
                    const cgst = taxObj.amount / 2;
                    Object.assign(taxObj, {
                      sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                      cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                    });
                  }
                  taxlistTomaintain.push(taxObj);

                  if (isInclusive) {
                    inclusiveTotal += currentTaxtotal;
                  } else {
                    exclusiveTotal += currentTaxtotal;
                  }
                  // previousTaxtotal=currentTax.TaxValue;
                }
              });
            }
          });
        }

        // add the tax details to the extra details object
        Object.assign(extra_details, {
          ...(inclusiveTotal && {
            inclusive_tax: inclusiveTotal,
          }),
          ...(exclusiveTotal && {
            exlusive_tax: exclusiveTotal,
          }),
          tax: taxlistTomaintain,
        });

        // Now add the exclusive tax total to order total
        if (exclusiveTotal > 0) {
          grandTotal += exclusiveTotal;
        }

        taxTotal = Number(
          Number(inclusiveTotal + exclusiveTotal).toFixed(ROUNDOFF_UPTO),
        );
        currenttableButton.data.details.taxtoApply =
          taxTotal.toFixed(ROUNDOFF_UPTO);

        billItems.map((item) => {
          calculateMultiTaxForItemLevel(item);
        });
      } else {
        billItems.map((item) => {
          taxTotal += calculateTaxForItem(item);
        });

        currenttableButton.data.details.taxtoApply =
          taxTotal.toFixed(ROUNDOFF_UPTO);
        if (!taxInclusive) {
          grandTotal += taxTotal;
          Object.assign(extra_details, {
            exlusive_tax: Number(
              Number((extra_details.exlusive_tax || 0) + taxTotal).toFixed(
                window.ROUNDOFF_UPTO,
              ),
            ),
            tax: [
              {
                name: taxMethod,
                tax_percent: taxPercent,
                amount: Number(Number(taxTotal).toFixed(window.ROUNDOFF_UPTO)),
                tax_inclusive: taxInclusive,
                taxDivided,
                tax_id,
              },
            ],
          });

          if (
            extra_details.tax &&
            extra_details.tax.length &&
            extra_details.tax[0].taxDivided
          ) {
            const cgst = extra_details.tax[0].amount / 2;
            Object.assign(extra_details.tax[0], {
              sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
              cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
            });
          }
        } else {
          Object.assign(extra_details, {
            inclusive_tax: Number(
              Number((extra_details.inclusive_tax || 0) + taxTotal).toFixed(
                window.ROUNDOFF_UPTO,
              ),
            ),
            tax: [
              {
                name: taxMethod,
                tax_percent: taxPercent,
                amount: Number(Number(taxTotal).toFixed(window.ROUNDOFF_UPTO)),
                tax_inclusive: taxInclusive,
                taxDivided,
                tax_id,
              },
            ],
          });
          if (
            extra_details.tax &&
            extra_details.tax.length &&
            extra_details.tax[0].taxDivided
          ) {
            const cgst = extra_details.tax[0].amount / 2;
            Object.assign(extra_details.tax[0], {
              sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
              cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
            });
          }
        }
      }
    }
    currenttableButton.data.details.extra_details = extra_details;
    if (window.orderCharges) {
      currenttableButton.data.details.order_level_total_charges = 0;
      currenttableButton.data.details.charges_level_total_tax = 0;
      const { charges } = currenttableButton.data.details;
      if (charges && charges.length > 0) {
        let chargesTotal = 0;
        let chargesTotaltax = 0;
        charges.forEach((charge) => {
          let chargeAmount = Number(charge.amount);
          if (charge.per_or_fixed == 1) {
            if (charge.extra_details) {
              const extra_details = JSON.parse(charge.extra_details);
              switch (Number(extra_details.applicable_on_amount)) {
                case 0:
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(
                          currenttableButton.data.details.discounttoApply,
                        ) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 1:
                  chargeAmount = Number(
                    (
                      ((order_subtotal - itemleveltotalCharges || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 2:
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(taxTotal) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                default:
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(
                          currenttableButton.data.details.discounttoApply,
                        ) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;
              }
              // if (extra_details.applicable_on_amount == '1') {
              //   chargeAmount = Number(
              //     (
              //       ((order_subtotal - itemleveltotalCharges || 0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // } else {
              //   chargeAmount = Number(
              //     (
              //       ((order_subtotal -
              //         itemleveltotalCharges -
              //         Number(currenttableButton.data.details.discounttoApply) ||
              //         0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // }
            } else {
              chargeAmount = Number(
                (
                  ((order_subtotal -
                    itemleveltotalCharges -
                    Number(currenttableButton.data.details.discounttoApply) ||
                    0) *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO),
              );
            }
            // chargeAmount = Number(((totalBeforeTax * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO));
          }
          // check if the tax is available
          if (charge.is_tax_applicable && charge.tax_amount) {
            let calculatedChargestax = 0;
            if (charge.is_tax_included) {
              let taxPerct;
              if (charge.tax_divided) {
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(
                    (chargeAmount / (100 + charge.tax_amount)) *
                      charge.tax_amount,
                  ),
                  ROUNDOFF_UPTO,
                );
                // calculatedChargestax = taxPerct * 2;
                // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(calculatedChargestax),
                  ROUNDOFF_UPTO,
                );
              } else {
                calculatedChargestax =
                  (chargeAmount / (100 + charge.tax_amount)) *
                  charge.tax_amount;
                // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(calculatedChargestax),
                  ROUNDOFF_UPTO,
                );
              }
            } else {
              let taxPerct;
              if (charge.tax_divided) {
                // taxPerct = chargeAmount * ((charge.tax_amount / 2) / 100);
                // taxPerct = Number((chargeAmount * (charge.tax_amount / 2)) / 100).toFixed(ROUNDOFF_UPTO);
                taxPerct = roundAmountUptoDecimals(
                  Number((chargeAmount * (charge.tax_amount / 2)) / 100),
                  ROUNDOFF_UPTO,
                );

                calculatedChargestax = taxPerct * 2;
                // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(calculatedChargestax),
                  ROUNDOFF_UPTO,
                );
              } else {
                calculatedChargestax = Number(
                  chargeAmount * (charge.tax_amount / 100),
                ).toFixed(ROUNDOFF_UPTO);
                // calculatedChargestax = roundAmountUptoDecimals(Number(chargeAmount * (charge.tax_amount / 100)), ROUNDOFF_UPTO);
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );

                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            }
            if (charge.is_tax_included === 0) {
              // Check if tax is exlcusive
              chargeAmount += calculatedChargestax;
              chargeAmount = Number(
                Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
              );
            }
            Object.assign(charge, {
              is_tax_included: charge.is_tax_included,
              calculated_tax: calculatedChargestax,
            });
            chargesTotaltax += calculatedChargestax;
          }
          chargesTotal += Number(chargeAmount);
          charge.amounttoAdd = Number(chargeAmount);
        });

        if (chargesTotal >= 0) {
          grandTotal += chargesTotal;
          totalCharges += chargesTotal;
          currenttableButton.data.details.order_level_total_charges =
            chargesTotal;
          currenttableButton.data.details.charges_level_total_tax = Number(
            Number(chargesTotaltax).toFixed(ROUNDOFF_UPTO),
          );
        }
      }
    }

    if (
      bill_number != 0 &&
      (currenttableButton.data.details.discounttoApply != 0 ||
        currenttableButton.data.details.coupondiscounttoApply != 0)
    ) {
      discountHistory.push({
        product_group_id: 0,
        order_id: bill_number,
        discounted_amt: currenttableButton.data.details.discounttoApply,
        discount_type,
        discount_rate: discount,
        coupon_code_type: couponDisounttype,
        coupon_code_rate: couponDisountamt,
        coupon_code_amt: currenttableButton.data.details.coupondiscounttoApply,
        coupon_code_name: currenttableButton.data.details.coupon,
      });
      if (discountHistory.length > 0) {
        currenttableButton.data.details.discountHistory = discountHistory;
      }
    }

    if (DO_BILL_ROUNDOFF) {
      try {
        grandTotal = Number(grandTotal.toFixed(ROUNDOFF_UPTO));

        const previousTotal = grandTotal;
        // grandTotal = Math.round(grandTotal);
        if (window.ROUNDING_INCREMENT) {
          grandTotal = roundToStep(
            grandTotal,
            window.ROUNDING_INCREMENT,
            window.ROUNDOFF_UPTO,
          );
        } else if (window.ROUNDOFF_UPTO === '3') {
          grandTotal = roundOffLastDigit(grandTotal);
          // grandTotal = roundToStep(grandTotal, 1, 3);
          // console.log('grandTotal::', grandTotal);
        } else {
          grandTotal = Math.round(grandTotal);
        }
        if (previousTotal !== grandTotal) {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: Number(
              (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });
        } else {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: 0,
          });
        }
      } catch (error) {}
    } else {
      Object.assign(currenttableButton.data.details.extra_details, {
        roundedAmount: 0,
      });
    }

    // add bill total to current table
    currenttableButton.data.details.order_total = grandTotal;
    currenttableButton.data.details.totalCharges = totalCharges;
    currenttableButton.data.details.item_level_total_charges =
      itemleveltotalCharges;
    // currenttableButton.data.details.cust_paid_amount = grandTotal;

    Object.assign(extra_details, {
      totalCharges,
    });

    switch (currenttableButton.data.order_type_flag) {
      case TAKEAWAY_FLAG_ID:
        $('#takeawaybillGrandtotal').html(grandTotal.toFixed(ROUNDOFF_UPTO));
        break;
      case HOMED_FLAG_ID:
        $('#deliverybillGrandtotal').html(grandTotal.toFixed(ROUNDOFF_UPTO));
        break;
      case DINEIN_FLAG_ID:
      case VIRTUALTABLE_FLAG_ID:
        $('#billGrandtotal').html(grandTotal.toFixed(ROUNDOFF_UPTO));
        break;
      case QUICKBILL_FLAG_ID:
        $('#quickbillGrandtotal').html(grandTotal.toFixed(ROUNDOFF_UPTO));
        break;
      default:
        break;
    }

    if (window.showbillDetails) {
      try {
        $(`#${currenttableButton.id}`)
          .find('#tableamountlabel')
          .text(currency + grandTotal.toFixed(ROUNDOFF_UPTO));
      } catch (error) {}
    }
  }
  calculationDone = true;
}

async function sendDiscountupdate(selectedTable, activeTab, requestData) {
  const kotUpdatedata = {};
  // Check if discount is provided
  let hasdiscountedProductgrps = false;
  if (
    requestData.data.discount_type != undefined &&
    requestData.data.rate != undefined
  ) {
    kotUpdatedata.discount_id = requestData.data.id;
    kotUpdatedata.discount_type = requestData.data.discount_type;
    kotUpdatedata.discount_rate = requestData.data.rate;
    if (requestData.data.product_groups) {
      Object.assign(kotUpdatedata, {
        discounted_product_groups: requestData.data.product_groups,
      });
      hasdiscountedProductgrps = true;
    }
    kotUpdatedata.discount_rate = requestData.data.rate;
    kotUpdatedata.discount_title = requestData.data.title;
  }
  let couponDisountavailable = false;
  // Check for coupon discount
  if (
    requestData.data.couponDisountamt != undefined &&
    requestData.data.couponDisounttype != undefined
  ) {
    kotUpdatedata.couponDisount = requestData.data.couponDisountamt;
    kotUpdatedata.couponDisounttype = requestData.data.couponDisounttype;
    kotUpdatedata.coupon = requestData.data.coupon;
    couponDisountavailable = true;
  }
  requestData.data = kotUpdatedata;
  requestData.couponDisountavailable = couponDisountavailable;

  if (selectedTable == undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.pleaseSelectTheTable'),
    );
    return;
  }
  const billTotal = selectedTable.data.details.order_total;

  await precalculateDetailsCheck(selectedTable);

  const billupdateData = {
    order_total: billTotal,
    order_level_total_charges:
      selectedTable.data.details.order_level_total_charges,
    charges_level_total_tax: selectedTable.data.details.charges_level_total_tax,
    discount:
      Number(selectedTable.data.details.discounttoApply) +
      Number(selectedTable.data.details.coupondiscounttoApply),
    order_level_total_taxes: selectedTable.data.details.taxtoApply,
    //    instructions: billstatusReason ? billstatusReason : '',
    extra_details: selectedTable.data.details.extra_details,
    cust_paid_amount: selectedTable.data.details.cust_paid_amount || billTotal,
    due_payment: 0,
    cust_paid_amount: billTotal,
  };
  if (hasdiscountedProductgrps) {
    Object.assign(billupdateData, {
      discounted_product_groups: kotUpdatedata.discounted_product_groups,
    });
  }
  if (kotUpdatedata) {
    Object.assign(billupdateData, {
      discount_title: kotUpdatedata.discount_title,
    });
  }
  if (couponDisountavailable) {
    billupdateData.couponDisount = kotUpdatedata.couponDisount;
    billupdateData.couponDisounttype = kotUpdatedata.couponDisounttype;
    billupdateData.coupon = kotUpdatedata.coupon;
    billupdateData.couponDisounttotal = Number(
      selectedTable.data.details.coupondiscounttoApply,
    );
  }
  requestData.billupdateData = billupdateData;
  const paymentDetails = {
    order_id: selectedTable.data.details.bill_number,
    payment_option: defaultPaymentoption,
    amount: billTotal,
  };
  requestData.paymentDetails = paymentDetails;
  selectedTable.data.details.payment_mode = paymentDetails.payment_option;
  selectedTable.data.details.paymentAdded = false;
  selectedTable.data.details.cust_paid_amount = billTotal;
  requestData.tempCharges = selectedTable.data.details.charges;
  // requestData.allowdiscountafterPrint = allowdiscountafterPrint;
  showLoader({
    title: $.i18n.t('controller:orderController.updatingDiscount'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });
  makeUpdateDiscountRequest(requestData);
}

function resetCurrentdiscount(tableInstance) {
  if (tableInstance) {
    tableInstance.data.details.discount = 0;
    tableInstance.data.details.discount_type = '0';
    tableInstance.data.details.discounted_product_groups = undefined;
    tableInstance.data.details.discount_title = '';
  }
}

function calculateMultiTaxForItem(item) {
  if (item && item.taxes && item.taxes.length) {
    let divisionFactorforcurrentgrp = 0;
    let inclusiveTaxrates = 0;
    item.taxes.forEach((currentptax) => {
      if (currentptax.IncludedInRate === '1') {
        if (
          currentptax.CalMethod === 2 &&
          currentptax?.extra_details?.inclusiveDivfactor
        ) {
          divisionFactorforcurrentgrp =
            currentptax?.extra_details?.inclusiveDivfactor;
        } else {
          inclusiveTaxrates += currentptax.TaxValue * 0.01;
        }
      }
    });
    if (divisionFactorforcurrentgrp > 0) {
      // recalculate the subtotal
      taxapplicableAmount /= divisionFactorforcurrentgrp;
    } else if (inclusiveTaxrates > 0) {
      taxapplicableAmount /= 1 + inclusiveTaxrates;
    }
  }
}

function calculateTaxForItem(item) {
  if (Number(item.item_tax_method)) {
    // if tax is inclusive
    taxTotal = 0;
    taxTotal = Number(
      (
        taxTotal +
        (item.recalculatedAmount / (100 + item.item_tax_per)) *
          item.item_tax_per
      ).toFixed(ROUNDOFF_UPTO),
    );
    const singleQtyTax = Number((taxTotal / item.quantity).toFixed(3));
    Object.assign(item, {
      item_tax_value: singleQtyTax,
      total: item.recalculatedAmount,
    });
    return taxTotal;
  }
  taxTotal = 0;
  let taxPerct;
  if (item.item_is_devidable) {
    taxPerct = Number(
      ((item.item_tax_per / 2) * item.recalculatedAmount) / 100,
    );
    taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
    taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
  } else {
    taxTotal = Number(
      taxTotal + (item.recalculatedAmount * item.item_tax_per) / 100,
    );
    taxTotal = roundAmountUptoDecimals(taxTotal, window.ROUNDOFF_UPTO);
  }
  const singleQtyTax = Number((taxTotal / item.quantity).toFixed(3));
  Object.assign(item, {
    item_tax_value: singleQtyTax,
    total: item.recalculatedAmount,
  });
  return taxTotal;
}

function calculateMultiTaxForItemLevel(item) {
  const extra_details = item.extra_details || {};
  const taxedProductgrps = {};
  if (
    item.productGrptaxes &&
    item.product_group_id &&
    !taxedProductgrps[item.product_group_id]
  ) {
    taxedProductgrps[item.product_group_id] = sortBy(
      item.productGrptaxes,
      'sort',
    );
  }
  if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
    const taxes = [];
    let inclusiveTaxrates = 0;
    let divisionFactorforcurrentgrp = 0;
    let taxapplicableAmount = item.recalculatedAmount;
    let applyTaxon;
    Object.values(taxedProductgrps)[0]?.forEach((currentptax) => {
      if (currentptax.tax_method === 1) {
        if (
          currentptax.cal_method === 2 &&
          currentptax?.extra_details?.inclusiveDivfactor
        ) {
          divisionFactorforcurrentgrp =
            currentptax?.extra_details?.inclusiveDivfactor;
        } else {
          inclusiveTaxrates += currentptax.tax_perct * 0.01;
        }
      }
    });
    if (divisionFactorforcurrentgrp > 0) {
      // recalculate the subtotal
      taxapplicableAmount /= divisionFactorforcurrentgrp;
    } else if (inclusiveTaxrates > 0) {
      taxapplicableAmount /= 1 + inclusiveTaxrates;
    }
    const previousTaxtotal = [];
    const previousTaxesmap = {};
    let totalExclusiveTax = 0;
    Object.values(taxedProductgrps)[0]?.forEach((currentTax) => {
      if (currentTax && !currentTax.applied) {
        const isInclusive = currentTax.tax_method === 1;

        applyTaxon = taxapplicableAmount;
        if (
          currentTax.cal_method === TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
        ) {
          // Add the previous tax totals as well
          applyTaxon =
            taxapplicableAmount + previousTaxtotal.reduce((a, b) => a + b, 0);
        } else if (currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX) {
          // Add the previous tax totals as well
          applyTaxon = previousTaxtotal.reduce((a, b) => a + b, 0);
        }

        // check the tax is on tax
        if (
          currentTax?.extra_details?.isTaxOnTax &&
          currentTax?.extra_details?.applicableOnIds &&
          currentTax?.extra_details?.applicableOnIds.length &&
          currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
        ) {
          let previoustotalforcurrent = 0;
          currentTax?.extra_details?.applicableOnIds.forEach((grpid) => {
            previoustotalforcurrent += previousTaxesmap[grpid] || 0;
          });

          if (previoustotalforcurrent > 0) {
            applyTaxon = previoustotalforcurrent;
          } else {
            // If the taxes total is 0 then do not apply
            return;
          }
        }

        const currentTaxtotal = Number(
          ((applyTaxon * currentTax.tax_perct) / 100).toFixed(ROUNDOFF_UPTO),
        );

        previousTaxtotal.push(currentTaxtotal);

        Object.assign(previousTaxesmap, {
          [currentTax.tax_id]: currentTaxtotal,
        });

        const taxDetails = {
          taxAmount: roundAmountUptoDecimals(currentTaxtotal, ROUNDOFF_UPTO),
          tax_name: currentTax.tax_name,
          tax_perct: currentTax.tax_perct,
          tax_method: currentTax.tax_method,
        };
        taxes.push(taxDetails);
        if (!isInclusive) {
          totalExclusiveTax += roundAmountUptoDecimals(
            currentTaxtotal,
            ROUNDOFF_UPTO,
          );
        }
      }
    });

    Object.assign(extra_details, {
      tax: taxes,
      total_without_tax: Number(Number(applyTaxon).toFixed(ROUNDOFF_UPTO)),
      totalExclusiveTax: Number(totalExclusiveTax.toFixed(ROUNDOFF_UPTO)),
    });
    Object.assign(item, { extra_details });
  }
}

function calculateDiscountForItem(item) {
  let discount = item.discount_rate;
  if (item.discount_type == 1) {
    discount = Number((item.sale_price * item.discount_rate) / 100).toFixed(
      ROUNDOFF_UPTO,
    );
  }
  if (discount <= item.sale_price) {
    const discounted_price = item.sale_price - discount;
    item.pricebeforeDiscount = Number(
      item.sale_price.toFixed(window.ROUNDOFF_UPTO),
    );
    item.discounted_price = Number(
      discounted_price.toFixed(window.ROUNDOFF_UPTO),
    );
    item.sale_price = Number(discounted_price.toFixed(window.ROUNDOFF_UPTO));
    item.price = Number(discounted_price.toFixed(window.ROUNDOFF_UPTO));
    item.item_price = Number(discounted_price.toFixed(window.ROUNDOFF_UPTO));
    if (item.item_price) {
      item.item_price = Number(discounted_price.toFixed(window.ROUNDOFF_UPTO));
    }
  } else {
    item.pricebeforeDiscount = item.sale_price;
  }
  item.amount = Number(item.sale_price) * item.quantity;
}

function calculateTaxForOptions(option, baseItem) {
  if (Number(baseItem.tax_method)) {
    taxTotal = 0;
    let taxPerct;
    if (baseItem.is_devidable) {
      taxPerct = Number(
        (
          (option.price / (100 + baseItem.tax_per / 2)) *
          (baseItem.tax_per / 2)
        ).toFixed(ROUNDOFF_UPTO),
      );
      taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
    } else {
      taxTotal = Number(
        (
          taxTotal +
          (option.price / (100 + baseItem.item_tax_per)) * baseItem.item_tax_per
        ).toFixed(ROUNDOFF_UPTO),
      );
    }
    option.option_tax = taxTotal;
    //  return taxTotal;
  } else {
    taxTotal = 0;
    let taxPerct;
    if (baseItem.is_devidable) {
      // taxPerct = Number((((baseItem.tax_per / 2) / 100) * option.price).toFixed(ROUNDOFF_UPTO));
      // taxPerct = Number((baseItem.tax_per / 2 / 100) * option.price);
      taxPerct = Number(((baseItem.tax_per / 2) * option.price) / 100);

      taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
      taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
    } else {
      taxTotal = Number(
        (taxTotal + (option.price * baseItem.tax_per) / 100).toFixed(
          ROUNDOFF_UPTO,
        ),
      );
    }
    // return taxTotal;
    option.option_tax = taxTotal;
    option.option_level_subtotal = option.price + taxTotal;
  }
}

function roundAmountUptoDecimals(numb, roundUpto) {
  roundUpto = Number(roundUpto);
  numb = Number(numb);
  const value = Intl.NumberFormat('en-US', {
    minimumFractionDigits: roundUpto,
    maximumFractionDigits: roundUpto,
    useGrouping: false,
  }).format(numb);
  return Number(value);
}
// function roundAmountUptoDecimals(numb, roundUpto) {
//   roundUpto = Number(roundUpto);
//   numb = Number(numb);
//   const decimals = Number(String(1).padEnd(roundUpto + 1 || 2, '0'));
//   return Math.round((numb + Number.EPSILON) * decimals) / decimals;
// }
module.exports = {
  sectionWiseOrderCalculation,
  orderCalculations,
  precalculateDetailsCheck,
  sendDiscountupdate,
  resetCurrentdiscount,
  calculateDiscountForItem,
  calculateTaxForOptions,
  calculateTaxForItem,
  roundAmountUptoDecimals,
  calculateItemTax,
  roundToStep,
};
