const util = require('../util/DBUtil');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

async function addShortcut(query, type) {
  let shortcut1 = [
    {
      id: 41,
      name: 'Open online order window',
      value: 'ctrl+o',
      default: 'ctrl+o',
      window: 'order',
    },
  ];
  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut1);
  } catch (err) {}
}

/**
 * Add's shortcuts
 * @param {Query Interface} query
 */
async function addShortcuts(query, type) {
  let isDarwin = global.currentPlatform === 'darwin';
  let shortcuts = [
    {
      id: 1,
      name: 'Save (Bill/KOT)',
      value: isDarwin ? 'command+s' : 'ctrl+s',
      default: isDarwin ? 'command+s' : 'ctrl+s',
      window: 'order',
    },
    {
      id: 2,
      name: 'Settle Bill',
      value: isDarwin ? 'command+z' : 'ctrl+z',
      default: isDarwin ? 'command+z' : 'ctrl+z',
      window: 'order',
    },
    {
      id: 3,
      name: 'Save and Print (Bill/KOT)',
      value: isDarwin ? 'command+p' : 'ctrl+p',
      default: isDarwin ? 'command+p' : 'ctrl+p',
      window: 'order',
    },
    {
      id: 4,
      name: 'Search item by name',
      value: isDarwin ? 'command+f' : 'ctrl+f',
      default: isDarwin ? 'command+f' : 'ctrl+f',
      window: 'order',
    },
    {
      id: 5,
      name: 'Search item by code',
      value: isDarwin ? 'command+g' : 'ctrl+g',
      default: isDarwin ? 'command+g' : 'ctrl+g',
      window: 'order',
    },
    {
      id: 6,
      name: 'Focus KOT Note',
      value: isDarwin ? 'command+n' : 'ctrl+k',
      default: isDarwin ? 'command+n' : 'ctrl+k',
      window: 'order',
    },
    {
      id: 7,
      name: 'Open payment window',
      value: isDarwin ? 'option+p' : 'alt+p',
      default: isDarwin ? 'option+p' : 'alt+p',
      window: 'order',
    },
    {
      id: 8,
      name: 'Open charges window',
      value: isDarwin ? 'option+c' : 'alt+c',
      default: isDarwin ? 'option+c' : 'alt+c',
      window: 'order',
    },
    {
      id: 9,
      name: 'Open discount window',
      value: isDarwin ? 'option+d' : 'alt+d',
      default: isDarwin ? 'option+d' : 'alt+d',
      window: 'order',
    },
    {
      id: 10,
      name: 'Open bill status window',
      value: isDarwin ? 'option+m' : 'alt+m',
      default: isDarwin ? 'option+m' : 'alt+m',
      window: 'order',
    },
    {
      id: 11,
      name: 'Cancel bill',
      value: 'ctrl+del',
      default: 'ctrl+del',
      window: 'order',
    },
    {
      id: 12,
      name: 'Free bill',
      value: 'ctrl+f',
      default: 'ctrl+f',
      window: 'order',
    },
    {
      id: 13,
      name: 'Search table',
      value: isDarwin ? 'command+t' : 'alt+t',
      default: 'alt+t',
      window: 'order',
    },
    {
      id: 14,
      name: 'Add new customer',
      value: 'ctrl+c',
      default: 'ctrl+c',
      window: 'order',
    },
    {
      id: 15,
      name: 'Change Table',
      value: 'ctrl+t',
      default: 'ctrl+t',
      window: 'order',
    },
    { id: 16, name: 'Reload App', value: 'f5', default: 'f5', window: 'order' },
    {
      id: 17,
      name: 'Open order window',
      value: 'ctrl+2',
      default: 'ctrl+2',
      window: 'global',
    },
    {
      id: 18,
      name: 'Open receipt window',
      value: 'ctrl+3',
      default: 'ctrl+3',
      window: 'global',
    },
    // {
    //   id: 19,
    //   name: 'Open online orders window (TMChannel)',
    //   value: 'ctrl+4',
    //   default: 'ctrl+4',
    //   window: 'global',
    // },
    {
      id: 19,
      name: 'Logout',
      value: 'ctrl+5',
      default: 'ctrl+5',
      window: 'global',
    },
    {
      id: 20,
      name: 'Open settings',
      value: 'ctrl+6',
      default: 'ctrl+6',
      window: 'global',
    },
    {
      id: 21,
      name: 'Open old KOT',
      value: isDarwin ? 'option+o' : 'alt+o',
      default: isDarwin ? 'option+o' : 'alt+o',
      window: 'order',
    },
    {
      id: 22,
      name: 'Draft Print',
      value: 'ctrl+d',
      default: 'ctrl+d',
      window: 'order',
    },
    {
      id: 23,
      name: 'View customer history',
      value: isDarwin ? 'option+h' : 'alt+h',
      default: isDarwin ? 'option+h' : 'alt+h',
      window: 'order',
    },
    {
      id: 24,
      name: 'Open bill preview',
      value: isDarwin ? 'option+v' : 'alt+v',
      default: isDarwin ? 'option+v' : 'alt+v',
      window: 'order',
    },
    {
      id: 25,
      name: 'Load Menu',
      value: isDarwin ? 'option+l' : 'alt+l',
      default: isDarwin ? 'option+l' : 'alt+l',
      window: 'order',
    },
    {
      id: 26,
      name: 'Toggle section tabs',
      value: 'ctrl+/',
      default: 'ctrl+/',
      window: 'order',
    },
    {
      id: 27,
      name: 'Switch Store',
      value: isDarwin ? 'option+s' : 'alt+s',
      default: isDarwin ? 'option+s' : 'alt+s',
      window: 'global',
    },
    {
      id: 28,
      name: 'Edit Bill',
      value: isDarwin ? 'option+e' : 'alt+e',
      default: isDarwin ? 'option+e' : 'alt+e',
      window: 'receipt',
    },
    {
      id: 29,
      name: 'Open Reports window',
      value: 'ctrl+7',
      default: 'ctrl+7',
      window: 'global',
    },
    {
      id: 30,
      name: 'Open Masters window',
      value: 'ctrl+8',
      default: 'ctrl+8',
      window: 'global',
    },
    // {
    //   id: 31,
    //   name: 'Open Fast settle',
    //   value: '+',
    //   default: '+',
    //   window: 'global',
    // },
    {
      id: 32,
      name: 'Switch table/item view',
      value: isDarwin ? 'escape' : 'escape',
      default: isDarwin ? 'escape' : 'escape',
      window: 'global',
    },
    {
      id: 33,
      name: 'Open Pre-Order Form',
      value: isDarwin ? 'command+1' : 'ctrl+1',
      value: isDarwin ? 'command+1' : 'ctrl+1',
      window: 'order',
    },
    {
      id: 34,
      name: 'Open Loyalty Window',
      value: 'ctrl+l',
      default: 'ctrl+l',
      window: 'order',
    },
    {
      id: 35,
      name: 'Send Payment Link',
      value: 'shift+p',
      default: 'shift+p',
      window: 'order',
    },
    {
      id: 36,
      name: 'Open Waiter Window',
      value: 'ctrl+w',
      default: 'ctrl+w',
      window: 'order',
    },
    {
      id: 37,
      name: 'Open Split Bill Window',
      value: 'ctrl+b',
      default: 'ctrl+b',
      window: 'order',
    },
    {
      id: 38,
      name: 'Open Coupon discount Window',
      value: 'shift+c',
      default: 'shift+c',
      window: 'order',
    },
    {
      id: 39,
      name: 'New Order In TA/HD',
      value: 'ctrl+n',
      default: 'ctrl+n',
      window: 'order',
    },
    {
      id: 40,
      name: 'Open online order window',
      value: 'ctrl+o',
      default: 'ctrl+o',
      window: 'order',
    },
  ];

  try {
    // query.destroy(util.DBDetails.Tables.MPOS_SHORTCUTS)
    // util.DBDetails.Tables.MPOS_SHORTCUTS.destroy({where:{}})
    await query.bulkDelete(
      util.DBDetails.Tables.MPOS_SHORTCUTS,
      { id: { [Op.gte]: 0 } },
      {},
    );
    let result = query.bulkInsert(
      util.DBDetails.Tables.MPOS_SHORTCUTS,
      shortcuts,
    );
  } catch (error) {
    console.log(error);
  }
}

async function addAppSouceColumn(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'app_source', type.STRING, {
    allowNull: true,
  });
}

function addSettings(query) {
  let settingsList1 = [{ id: 151, name: 'new_setting_57', value: '0' }];
  let settingsList2 = [{ id: 152, name: 'new_setting_58', value: 'Order' }];
  let settingsList3 = [{ id: 153, name: 'new_setting_59', value: '0' }];
  let settingsList4 = [{ id: 154, name: 'new_setting_60', value: '0' }];
  let settingsList5 = [{ id: 155, name: 'new_setting_61', value: '0' }];
  let settingsList6 = [{ id: 156, name: 'new_setting_62', value: '0' }];
  let settingsList7 = [{ id: 157, name: 'new_setting_63', value: '0' }];
  let settingsList8 = [{ id: 158, name: 'new_setting_64', value: '0' }];
  let settingsList9 = [{ id: 159, name: 'new_setting_65', value: '0' }];
  let settingsList10 = [{ id: 160, name: 'new_setting_66', value: '0' }];

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
const up = function (query, type) {
  addShortcuts(query, type);
  addAppSouceColumn(query, type);
  addSettings(query);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
