const util = require('../util/DBUtil');

function addSettings(query) {
  const settingsList = [
    { id: 181, name: 'new_setting_87', value: '0' },
    { id: 182, name: 'new_setting_88', value: '0' },
    { id: 183, name: 'new_setting_89', value: '0' },
    { id: 184, name: 'new_setting_90', value: '0' },
    { id: 185, name: 'new_setting_91', value: '0' },
    { id: 186, name: 'new_setting_92', value: '0' },
    { id: 187, name: 'new_setting_93', value: '0' },
    { id: 188, name: 'new_setting_94', value: '0' },
    { id: 189, name: 'new_setting_95', value: '0' },
    { id: 190, name: 'new_setting_96', value: '0' },
    { id: 191, name: 'new_setting_97', value: '0' },
    { id: 192, name: 'new_setting_98', value: '0' },
    { id: 193, name: 'new_setting_99', value: '0' },
    { id: 194, name: 'new_setting_100', value: '0' },
    { id: 195, name: 'new_setting_101', value: '0' },
    { id: 196, name: 'new_setting_102', value: '0' },
    { id: 197, name: 'new_setting_103', value: '0' },
    { id: 198, name: 'new_setting_104', value: '0' },
    { id: 199, name: 'new_setting_105', value: '0' },
    { id: 200, name: 'new_setting_106', value: '0' },
  ];

  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
  } catch (err) {
    console.error(err);
  }
}

async function addAlternativeTitleInCategories(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_CATEGORY, 'alternative_title', {
    type: type.STRING,
    allowNull: true,
  });
}

async function addDefaultQuantitiesAndAlternativetitleInModifiers(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_MODIFIERS, 'defaultQty', {
    type: type.INTEGER,
    defaultValue: 1,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_MODIFIERS, 'alternative_title', {
    type: type.STRING,
    allowNull: true,
  });
}

async function addAlternativeTitleInKotAddon(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
    'alternative_title',
    {
      type: type.STRING,
      allowNull: true,
    },
  );
}

async function addDialCodeInCustomerTable(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'dial_code', {
    type: type.INTEGER,
    allowNull: true,
  });
}

async function addOrderNoteInOrderTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'order_note', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addPaymentmodeinduepaymentTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_DUEPAYMENTS, 'payment_mode', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_DUEPAYMENTS, 'created_time', {
      type: type.TIME,
      allowNull: true,
      defaultValue: type.NOW,
    });
  } catch (error) {
    console.log(error);
  }
}
const up = function (query, type) {
  addSettings(query, type);
  addAlternativeTitleInCategories(query, type);
  addDefaultQuantitiesAndAlternativetitleInModifiers(query, type);
  addAlternativeTitleInKotAddon(query, type);
  addDialCodeInCustomerTable(query, type);
  addOrderNoteInOrderTable(query, type);
  addPaymentmodeinduepaymentTable(query, type);
};
const down = function (query, type) {};
module.exports = {
  up,
  down,
};
