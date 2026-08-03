/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const {
  makeItemsUpdateItemDiscountAppliedRequest,
} = require('../../renderer/helper/Kot.helper');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../../util/Constants');
const {
  calculateDiscountForItem,
  precalculateDetailsCheck,
} = require('../calculations');

async function applyItemLevelDiscount(
  discountData,
  currenttableButton,
  forQuickbill,
) {
  // apply discount to items
  let items = [];
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
      case TAKEAWAY_TAB_ID:
      case DELIVERY_TAB_ID:
        if (currenttableButton === undefined) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:orderController.pleaseSelectTheTable'),
          );
          return;
        }
        items = currenttableButton.data.details.items;
        if (
          currenttableButton.data.details.itemsForItemDiscount &&
          currenttableButton.data.details.itemsForItemDiscount.length
        ) {
          items = currenttableButton.data.details.itemsForItemDiscount;
        }
        // if (
        //   currenttableButton.data.details.printBillItems &&
        //   currenttableButton.data.details.printBillItems.length
        // ) {
        //   items = currenttableButton.data.details.printBillItems;
        // }
        break;
      // case TAKEAWAY_TAB_ID:
      //   // items = temptakeawayorderList;
      //   items = currenttableButton.data.details.items;

      //   break;
      case QUICK_TAB_ID:
        // currentTableinstace = quickbilltableButton;
        items = currenttableButton.data.details.items;
        break;
      default:
        break;
    }
  }

  // if (!forQuickbill) {
  let applicable_on_items;
  if (discountData.applicable_on_item) {
    applicable_on_items = discountData.applicable_on_item.split(',');
  }
  // first reset discount
  items.forEach((item) => {
    item.discount_rate = 0;
    item.discount_type = 0;
    item.sale_price = item.pricebeforeDiscount;
    calculateDiscountForItem(item);
    precalculateDetailsCheck(currenttableButton);
  });
  currenttableButton.data.details.items = items;
  // recalculate
  precalculateDetailsCheck(currenttableButton);

  items.forEach((item) => {
    if (
      applicable_on_items &&
      (applicable_on_items.includes(String(item.item_id)) ||
        applicable_on_items.includes(String(item.item_refid)))
    ) {
      item.discount_rate = discountData.rate;
      item.discount_type = Number(discountData.discount_type);
      item.sale_price = item.item_price;
      calculateDiscountForItem(item);
      precalculateDetailsCheck(currenttableButton);
    }
  });
  currenttableButton.data.details.items = items;
  // recalculate
  precalculateDetailsCheck(currenttableButton);

  if (!forQuickbill) {
    // if bill is saved then update order data
    const billupdateData = {
      order_level_total_charges:
        currenttableButton.data.details.order_level_total_charges,
      order_total: currenttableButton.data.details.order_total,
      order_subtotal: currenttableButton.data.details.order_subtotal,
      order_id: currenttableButton.data.details.bill_number,
      charges_level_total_tax:
        currenttableButton.data.details.charges_level_total_tax,
      order_level_total_taxes: currenttableButton.data.details.taxtoApply,
      cust_paid_amount: currenttableButton.data.details.order_total,
      extra_details: currenttableButton.data.details.extra_details,
      due_payment: 0,
    };
    const paymentDetails = {
      order_id: currenttableButton.data.details.bill_number,
      payment_option: window.defaultPaymentoption,
      amount: currenttableButton.data.details.order_total,
    };

    Object.assign(billupdateData, {
      payment: paymentDetails.payment_option,
    });

    console.log('items::', items);
    // update kot items
    const result = await makeItemsUpdateItemDiscountAppliedRequest({
      items,
      billupdateData,
      order_id: currenttableButton.data.details.bill_number,
      tempCharges: currenttableButton.data.details.charges,
      paymentDetails,
    });

    if (result === 'success') {
      return items;
    }
  } else {
    return currenttableButton.data.details.items;
  }
}

module.exports = {
  applyItemLevelDiscount,
};
