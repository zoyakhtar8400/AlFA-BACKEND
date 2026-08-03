const { forEach, isEmpty } = require('lodash');
const { DIGITAL_BILLING_FLAG } = require('../../util/Constants');

function mapItemstocategory(details) {
  Object.assign(details, {
    groupBycategory: undefined,
  });
  if (window.itemCatmapping && !isEmpty(window.itemCatmapping)) {
    const groupBycategory = {};
    forEach(details, (item) => {
      let itemKeyname = Number(item.item_refid) || Number(item.item_id);
      if (details.billingType === DIGITAL_BILLING_FLAG && item.item_id) {
        itemKeyname = Number(item.item_id);
      }

      if (window.itemCatmapping[itemKeyname]) {
        const items = groupBycategory[window.itemCatmapping[itemKeyname]] || [];
        items.push(item);
        Object.assign(groupBycategory, {
          [window.itemCatmapping[itemKeyname]]: items,
        });
      } else {
        const items = groupBycategory.Default || [];
        items.push(item);
        Object.assign(groupBycategory, {
          Default: items,
        });
      }
    });

    // Object.assign(details, {
    //   groupBycategory,
    // });
    // details.groupBycategory = groupBycategory;
    return groupBycategory;
  }
}

module.exports = {
  mapItemstocategory,
};
