const util = require('../util/DBUtil');

async function updateDefaultPaymentModeInOrderTable(query, type) {
  await query.removeColumn(util.DBDetails.Tables.MPOS_ORDER, 'payment');
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'payment', {
    type: type.STRING,
    allowNull: true,
    defaultValue: null,
  });
}

async function addUniqueIdOnOrderLevel(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER_CHILD, 'unique_id', {
    type: type.STRING,
    allowNull: true,
    defaultValue: null,
  });
}
function addSettings(query) {
  const settingsList = [
    { id: 251, name: 'new_setting_218', value: '0' },
    { id: 252, name: 'new_setting_219', value: '0' },
    { id: 253, name: 'new_setting_220', value: '0' },
    { id: 254, name: 'new_setting_221', value: '0' },
    { id: 255, name: 'new_setting_222', value: '0' },
    { id: 256, name: 'new_setting_223', value: '0' },
    { id: 257, name: 'new_setting_224', value: '0' },
    { id: 258, name: 'new_setting_225', value: '0' },
    { id: 259, name: 'new_setting_226', value: '0' },
    { id: 260, name: 'new_setting_227', value: '0' },
    { id: 261, name: 'new_setting_228', value: '0' },
    { id: 262, name: 'new_setting_229', value: '0' },
    { id: 263, name: 'new_setting_230', value: '0' },
    { id: 264, name: 'new_setting_231', value: '0' },
    { id: 265, name: 'new_setting_232', value: '0' },
    { id: 266, name: 'new_setting_233', value: '0' },
    { id: 267, name: 'new_setting_234', value: '0' },
    { id: 268, name: 'new_setting_234', value: '0' },
    { id: 269, name: 'new_setting_235', value: '0' },
    { id: 270, name: 'new_setting_236', value: '0' },
  ];

  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
  } catch (err) {
    console.error(err);
  }
}

// async function addOrderIndex(query) {
//   try {
//     query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['id'], {
//       name: 'id_index',
//     });

//     query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['order_id'], {
//       name: 'order_id_index',
//     });

//     query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['created_time'], {
//       name: 'created_time_index',
//     });

//     query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['bill_number'], {
//       name: 'bill_number_index',
//     });

//     query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['actual_created_time'], {
//       name: 'actual_created_time_index',
//     });

//     query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['phone'], {
//       name: 'phone_index',
//     });
//   } catch (error) {
//     console.log('add order index error', error);
//   }
// }

const up = (query, type) => {
  updateDefaultPaymentModeInOrderTable(query, type);
  addUniqueIdOnOrderLevel(query, type);
  addSettings(query);
  // addOrderIndex(query);
};
const down = () => {};

module.exports = {
  up,
  down,
};
