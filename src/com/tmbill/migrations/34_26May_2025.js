const util = require('../util/DBUtil');

async function addRevenueId(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'revenue_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'revenue_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_EXPENSE, 'revenue_id', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addMasterImageUrl(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'master_image', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addColorInCategories(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_CATEGORY, 'color', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addOrderTypeWiseOrderNumberInTempNumber(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      'order_type_wise_order_number',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

function addSettings(query) {
  const settingsList = [
    { id: 231, name: 'new_setting_217', value: '0' },
    { id: 232, name: 'new_setting_218', value: '0' },
    { id: 233, name: 'new_setting_219', value: '0' },
    { id: 234, name: 'new_setting_220', value: '0' },
    { id: 235, name: 'new_setting_221', value: '0' },
    { id: 236, name: 'new_setting_222', value: '0' },
    { id: 237, name: 'new_setting_223', value: '0' },
    { id: 238, name: 'new_setting_224', value: '0' },
    { id: 239, name: 'new_setting_225', value: '0' },
    { id: 240, name: 'new_setting_226', value: '0' },
    { id: 241, name: 'new_setting_227', value: '0' },
    { id: 242, name: 'new_setting_228', value: '0' },
    { id: 243, name: 'new_setting_229', value: '0' },
    { id: 244, name: 'new_setting_300', value: '0' },
    { id: 245, name: 'new_setting_301', value: '0' },
    { id: 246, name: 'new_setting_302', value: '0' },
    { id: 247, name: 'new_setting_303', value: '0' },
    { id: 248, name: 'new_setting_304', value: '0' },
    { id: 249, name: 'new_setting_305', value: '0' },
    { id: 250, name: 'new_setting_306', value: '0' },
  ];

  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
  } catch (err) {
    console.error(err);
  }
}

const up = function (query, type) {
  addRevenueId(query, type);
  addMasterImageUrl(query, type);
  addColorInCategories(query, type);
  addSettings(query, type);
  addOrderTypeWiseOrderNumberInTempNumber(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
