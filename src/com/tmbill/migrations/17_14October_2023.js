const util = require('../util/DBUtil');

async function createItemDiscountTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_ITEM_DISCOUNT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        discount_name: {
          type: type.STRING,
        },
        discount_type: {
          type: type.STRING,
        },
        rate: {
          type: type.DECIMAL(10, 2),
        },
        active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        status_flag: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        is_modifiable: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        product_groups: {
          type: type.STRING,
          allowNull: true,
        },
        applicable_on_item: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ITEM_DISCOUNT,
      },
    );
  } catch (err) {}
}

function addChildOptionsRefId(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_OPTIONS,
      'child_optgrp_refids',
      type.STRING,
      {
        allowNull: true,
      },
    );
  } catch (err) {}
}

function addSettings(query) {
  let settingsList = [
    { id: 161, name: 'new_setting_67', value: '0' },
    { id: 162, name: 'new_setting_68', value: '0' },
    { id: 163, name: 'new_setting_69', value: '0' },
    { id: 164, name: 'new_setting_70', value: '0' },
    { id: 165, name: 'new_setting_71', value: '0' },
    { id: 166, name: 'new_setting_72', value: '0' },
    { id: 167, name: 'new_setting_73', value: '0' },
    { id: 168, name: 'new_setting_74', value: '0' },
    { id: 169, name: 'new_setting_75', value: '0' },
    { id: 170, name: 'new_setting_76', value: '0' },
    { id: 171, name: 'new_setting_77', value: '0' },
    { id: 172, name: 'new_setting_78', value: '0' },
    { id: 173, name: 'new_setting_79', value: '0' },
    { id: 174, name: 'new_setting_80', value: '0' },
    { id: 175, name: 'new_setting_81', value: '0' },
    { id: 176, name: 'new_setting_82', value: '0' },
    { id: 177, name: 'new_setting_83', value: '0' },
    { id: 178, name: 'new_setting_84', value: '0' },
    { id: 179, name: 'new_setting_85', value: '0' },
    { id: 180, name: 'new_setting_86', value: '0' },
  ];
  // let settingsList2 = [{ id: 142, name: 'new_setting_48', value: 'Order' }];
  // let settingsList3 = [{ id: 143, name: 'new_setting_49', value: '0' }];
  // let settingsList4 = [{ id: 144, name: 'new_setting_50', value: '0' }];
  // let settingsList5 = [{ id: 145, name: 'new_setting_51', value: '0' }];
  // let settingsList6 = [{ id: 146, name: 'new_setting_52', value: '0' }];
  // let settingsList7 = [{ id: 147, name: 'new_setting_53', value: '0' }];
  // let settingsList8 = [{ id: 148, name: 'new_setting_54', value: '0' }];
  // let settingsList9 = [{ id: 149, name: 'new_setting_55', value: '0' }];
  // let settingsList10 = [{ id: 150, name: 'new_setting_56', value: '0' }];

  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList7);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList8);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList9);
    // query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList10);
  } catch (err) {}
}

async function addCategoryTimings(query, type) {
  // terminal_access_levels
  query.addColumn(util.DBDetails.Tables.MPOS_CATEGORY, 'timings', type.JSON, {
    defaultValue: null,
  });
}

function addExtrdetailsFieldInDiscount(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_DISCOUNT,
    'extra_details',
    type.JSON,
    {
      allowNull: true,
    },
  );
}
const up = function (query, type) {
  createItemDiscountTable(query, type);
  addChildOptionsRefId(query, type);
  addSettings(query, type);
  addCategoryTimings(query, type);
  addExtrdetailsFieldInDiscount(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
