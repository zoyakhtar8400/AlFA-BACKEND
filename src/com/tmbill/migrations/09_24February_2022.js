const util = require('../util/DBUtil');

function nextSaleReportId(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      'next_sales_report_id',
      type.INTEGER,
      {
        allowNull: true,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      'secondary_bill_number',
      type.INTEGER,
      {
        allowNull: false,
        defaultValue: 1,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      'barSection_bill_number',
      type.INTEGER,
      {
        allowNull: false,
        defaultValue: 1,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      'barSection_kot_number',
      type.INTEGER,
      {
        allowNull: false,
        defaultValue: 1,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'point_of_contact',
      type.JSON,
      {
        allowNull: true,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'bar_bill_prefix',
      type.JSON,
      {
        allowNull: true,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      'mall_report_id',
      type.INTEGER,
      {
        allowNull: false,
        default: 1,
      },
    );
  } catch (err) {}
}

async function addSettings(query) {
  let settingsList1 = [{ id: 110, name: 'new_setting_16', value: '0' }];
  let settingsList2 = [{ id: 111, name: 'new_setting_17', value: '0' }];
  let settingsList3 = [{ id: 112, name: 'new_setting_18', value: '0' }];
  let settingsList4 = [{ id: 113, name: 'new_setting_19', value: '0' }];
  let settingsList5 = [{ id: 114, name: 'new_setting_20', value: '0' }];
  let settingsList6 = [{ id: 115, name: 'new_setting_21', value: '0' }];
  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);
  } catch (err) {}
}

function addStoreLevelValues(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'brand_name',
      type.STRING,
      {
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'secondary_bill_prefix',
      type.STRING,
      {
        allowNull: true,
      },
    );
  } catch (err) {}
}

function addSectionInDept(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_DEPARTMENT,
      'section',
      type.INTEGER,
      {
        allowNull: true,
        defaultValue: 1,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_DEPARTMENT,
      'product_groups',
      type.STRING,
      {
        allowNull: true,
      },
    );
  } catch (err) {}
}

function addRemotKotIdColumn(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'remote_order_id',
      type.STRING,
      {
        allowNull: true,
        // defaultValue: 1
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'bill_prefix_for',
      type.INTEGER,
      {
        // allowNull: false,
        defaultValue: 1,
      },
    );
  } catch (err) {}
}

function duePaymentsindexes(query, type) {
  query.addIndex(
    util.DBDetails.Tables.MPOS_DUEPAYMENTS,
    ['order_id', 'transaction_id'],
    {
      name: 'transaction_index',
    },
  );
}
const up = async function (query, type) {
  addSettings(query, type);
  nextSaleReportId(query, type);
  addStoreLevelValues(query, type);
  addSectionInDept(query, type);
  addRemotKotIdColumn(query, type);
  duePaymentsindexes(query, type);
};
const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
