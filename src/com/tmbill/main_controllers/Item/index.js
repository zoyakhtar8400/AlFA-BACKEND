/* eslint-disable camelcase */
const { groupBy } = require('lodash');
const { Tax, ItemPrices } = require('../../js/database');
const { safeParseformain } = require('../Utils');

async function getItemTaxes(store_id, items) {
  try {
    const outletTaxes = await Tax.findAll({
      raw: true,
      where: {
        store_id,
      },
    });

    outletTaxes.forEach((tax) => {
      Object.assign(tax, {
        extra_details: safeParseformain(tax.extra_details),
      });
    });

    const taxGroupMapping = groupBy(outletTaxes, 'product_group_id');
    // if (items && items.length) {
    //   items.forEach((item) => {
    //     if (item.product_group && taxGroupMapping[item.product_group]) {
    //       Object.assign(item, {
    //         taxes: taxGroupMapping[item.product_group],
    //       });
    //     }
    //   });
    // }
    return taxGroupMapping;
  } catch (error) {
    console.error(`Message="Error while fetching taxes"`, error);
  }
  return undefined;
}

async function getItemPrices(store_id) {
  try {
    const itemPrices = await ItemPrices.findAll({
      raw: true,
      where: {
        store_id,
        active: 1,
      },
    });
    const itemPricesGroupMapping = groupBy(itemPrices, 'item_id');
    return itemPricesGroupMapping;
  } catch (error) {
    console.log(`Message="Error while fetching item prices" Error=`, error);
  }
  return undefined;
}

module.exports = {
  getItemTaxes,
  getItemPrices,
};
