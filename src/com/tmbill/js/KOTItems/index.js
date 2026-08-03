const checkIfItemExistInKot = (clickeditemDetails, items) => {
  if (!clickeditemDetails) {
    return;
  }
  let itemExists;
  if (!items) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.pleaseSelectTheTable'),
    );
    return;
  }
  for (const currentItem of items) {
    let comparewith = clickeditemDetails.title;
    if (clickeditemDetails.isitemwithOption) {
      comparewith = clickeditemDetails.titlewithOption;
    }
    if (clickeditemDetails.is_open_item && clickeditemDetails.newopenitemName) {
      comparewith = clickeditemDetails.newopenitemName;
    }

    let pricetoComparewith = clickeditemDetails.sale_price;
    if (clickeditemDetails.isitemwithOption) {
      pricetoComparewith = clickeditemDetails.pricebeforeDiscount;
    }
    if (clickeditemDetails.isDiscounteditem) {
      pricetoComparewith = clickeditemDetails.isDiscounteditem.newPrice;
    }
    if (
      currentItem.title === comparewith &&
      pricetoComparewith === currentItem.item_price &&
      currentItem.short_code == clickeditemDetails.short_code
    ) {
      // if (currentItem.title === comparewith) {
      //   if (clickeditemDetails.isDiscounteditem) {
      //     // currentItem.quantity = currentItem.quantity + (clickeditemDetails.isDiscounteditem.get_qty || 1);
      //     currentItem.quantity = clickeditemDetails.isDiscounteditem.get_qty || 1;
      //   }

      itemExists = currentItem;
      //   currentItem.amount = Number(
      //     (currentItem.price * currentItem.quantity).toFixed(ROUNDOFF_UPTO),
      //   );
    }
  }

  return itemExists;
};

module.exports = {
  checkIfItemExistInKot,
};
