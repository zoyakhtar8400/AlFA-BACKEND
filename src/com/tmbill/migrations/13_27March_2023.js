const util = require('../util/DBUtil');

function addOrderTipTable(query, type) {
  query.createTable(
    util.DBDetails.Tables.MPOS_ORDER_TIP,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
      },
      amount: {
        type: type.DECIMAL(10, 2),
      },
      waiter: {
        type: type.STRING,
        allowNull: true,
      },
      waiter_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      store_id: {
        type: type.STRING,
      },
      sync_status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER_TIP,
    },
  );
}

function addOrderNumberInTempNumber(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
    'order_number',
    type.INTEGER,
    {
      defaultValue: 1,
    },
  );
}

function addSettings(query) {
  let settingsList1 = [{ id: 141, name: 'new_setting_47', value: '0' }];
  let settingsList2 = [{ id: 142, name: 'new_setting_48', value: 'Order' }];
  let settingsList3 = [{ id: 143, name: 'new_setting_49', value: '0' }];
  let settingsList4 = [{ id: 144, name: 'new_setting_50', value: '0' }];
  let settingsList5 = [{ id: 145, name: 'new_setting_51', value: '0' }];
  let settingsList6 = [{ id: 146, name: 'new_setting_52', value: '0' }];
  let settingsList7 = [{ id: 147, name: 'new_setting_53', value: '0' }];
  let settingsList8 = [{ id: 148, name: 'new_setting_54', value: '0' }];
  let settingsList9 = [{ id: 149, name: 'new_setting_55', value: '0' }];
  let settingsList10 = [{ id: 150, name: 'new_setting_56', value: '0' }];

  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList7);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList8);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList9);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList10);
  } catch (err) {}
}

async function addTempnumbers(query) {
  let tempnumbers = [
    {
      bill_number: 1,
      kot_number: 1,
      takeawaybill_number: 1,
      takeawaykot_number: 1,
      secondary_bill_number: 1,
      next_sales_report_id: 1,
      barSection_bill_number: 1,
      barSection_kot_number: 1,
      mall_report_id: 1,
      order_number: 1,
      id: 1,
    },
  ];

  try {
    let result = await query.bulkInsert(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      tempnumbers,
    );
  } catch (error) {
    console.log(error);
  }
}

const up = function (query, type) {
  addOrderTipTable(query, type);
  addOrderNumberInTempNumber(query, type);
  addSettings(query);
  addTempnumbers(query);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
