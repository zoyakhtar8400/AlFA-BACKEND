const util = require('../util/DBUtil');
/**
 * Add's new settings to the database.
 * @param {Query interface} query
 */
async function addnewSettings(query) {
  try {
    let settingsList = [
      { id: 66, name: 'round-off-upto', value: '2' },
      { id: 67, name: 'show-item-image', value: '1' },
      { id: 68, name: 'default-payment-mode', value: 'Cash' },
      {
        id: 69,
        name: 'allow-editcustomer',
        value:
          '{"dinein":false,"takeaway":false,"delivery":true,"quick":false}',
      },
      { id: 70, name: 'default-printoldkot', value: '1' },
      { id: 71, name: 'default-printcanceloldkot', value: '1' },
      { id: 72, name: 'show-customergst-on-bill', value: '0' },
      { id: 73, name: 'next-reset-date', value: '{}' },
      {
        id: 74,
        name: 'custom-billno-title',
        value:
          '{"dinein":"Bill No","takeaway":"Bill No","delivery":"Bill No","quick":"Bill No"}',
      },
      { id: 75, name: 'ask-paymode-onsavebill', value: '' },
      { id: 76, name: 'show-fastsettleButton', value: '1' },
      { id: 77, name: 'show-customerpaidamt-onbill', value: '0' },
      {
        id: 78,
        name: 'tablestaustag-on-kot',
        value:
          '{"showNewordertag":false,"newOrdertaglabel":"New Order","showrunningOrdertag":false,"runningOrdertaglabel":"Running Order"}',
      },
      { id: 79, name: 'askfor-waiter', value: '0' },
      { id: 80, name: 'showwaiter-onkot', value: '0' },
      { id: 81, name: 'showwaiter-onbill', value: '0' },
    ];
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
  } catch (error) {
    console.log(error);
  }
}

/**
 * add order table changes
 * @param {Query Interface} query
 */
async function orderTablechanges(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'cust_paid_amount',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
}

async function itemlevelDiscountchanges(queryInterface, type) {
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'discounted_price',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'discount_type',
    type.INTEGER,
    {
      defaultValue: 2,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'discount_rate',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'modified_discount',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );

  //KOT Item
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'discounted_price',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'discount_type',
    type.INTEGER,
    {
      defaultValue: 2,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'discount_rate',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'pricebeforeDiscount',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'modified_discount',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'discount',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  //Order Item
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'discounted_price',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'discount_type',
    type.INTEGER,
    {
      defaultValue: 2,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'discount_rate',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'pricebeforeDiscount',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'modified_discount',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
}

async function addWaiterchanges(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'waiter', type.STRING, {
    defaultValue: null,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'waiter_id', type.INTEGER, {
    defaultValue: 0,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'waiter', type.STRING, {
    defaultValue: null,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'waiter_id', type.INTEGER, {
    defaultValue: 0,
  });

  query.createTable(
    util.DBDetails.Tables.MPOS_WAITER,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: type.STRING,
        allowNull: true,
      },
      phone: {
        type: type.STRING,
        allowNull: true,
      },
      username: {
        type: type.STRING,
        allowNull: false,
        unique: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_WAITER,
    },
  );
}

/**
 * Add rider body temperature changes
 * @param {*} query
 * @param {*} type
 */
async function addRbtchanges(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'rbt_temprature',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
}

async function addComplimentaryitemchanges(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'is_complimentary',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
}

async function addDeliverychargeschanges(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_CHARGES,
    'delivery_free_afteramount',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_CHARGES,
    'delivery_applicable_platform',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
}

const up = async function (query, type) {
  addnewSettings(query);
  orderTablechanges(query, type);
  itemlevelDiscountchanges(query, type);
  addWaiterchanges(query, type);
  addRbtchanges(query, type);
  addComplimentaryitemchanges(query, type);
  addDeliverychargeschanges(query, type);
};
const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
