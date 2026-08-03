const util = require('../util/DBUtil');

async function addextraDetailsInKotandOrderItemTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_KOT_ITEM, 'extra_details', {
      allowNull: true,
      type: type.JSON,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER_CHILD, 'extra_details', {
      allowNull: true,
      type: type.JSON,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER_CHILD, 'discount_name', {
      type: type.STRING,
      allowNull: true,
      defaultValue: null,
    });
  } catch (error) {
    console.error(error);
  }
}

async function addOrderTypeFieldInDiscount(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_DISCOUNT, 'order_type', {
      allowNull: true,
      type: type.STRING,
      defaultValue: '0',
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM_DISCOUNT, 'order_type', {
      allowNull: true,
      type: type.STRING,
      defaultValue: '0',
    });
  } catch (error) {
    console.error(error);
  }
}

const up = function (query, type) {
  addextraDetailsInKotandOrderItemTable(query, type);
  addOrderTypeFieldInDiscount(query, type);
};
const down = function () {};

module.exports = {
  up,
  down,
};
