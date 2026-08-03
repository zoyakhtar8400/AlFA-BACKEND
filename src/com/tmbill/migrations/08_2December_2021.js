const { PRINTER_ACTION_TYPES } = require('../util/Constants');
const util = require('../util/DBUtil');

async function addOrderchildchargeslevelfields(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      'is_tax_applicable',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      'tax_amount',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      'is_tax_included',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      'tax_title',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      'tax_divided',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
      'is_tax_applicable',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
      'tax_amount',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
      'is_tax_included',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
      'tax_title',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
      'tax_divided',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'tax_title',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'tax_divided',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      'tax_title',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      'tax_divided',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      'tax_amount',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'tax_title',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'tax_divided',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
  } catch (err) {}
}

async function addnewSettings(query) {
  let settingsList1 = [{ id: 105, name: 'new_setting_11', value: '0' }];
  let settingsList2 = [{ id: 106, name: 'new_setting_12', value: '0' }];
  let settingsList3 = [{ id: 107, name: 'new_setting_13', value: '0' }];
  let settingsList4 = [{ id: 108, name: 'new_setting_14', value: '0' }];
  let settingsList5 = [{ id: 109, name: 'new_setting_15', value: '0' }];
  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
  } catch (err) {}
}

async function addStorelevelfields(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'field9',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'field10',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'field11',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'field12',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'custom_quickbill_ordertypes',
      type.STRING(300),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'enabled_passcode_protection',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
  } catch (err) {}
}

async function addUserlevelfields(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_USER,
      'userCategory',
      type.STRING(10),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_USER,
      'passcode_access_levels',
      type.JSON,
      {
        defaultValue: null,
      },
    );
  } catch (err) {}
}

async function passcodeActivitytable(query, type) {
  try {
    query.createTable(
      util.DBDetails.Tables.MPOS_USER_PASSCODE_ACTIVITY,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        activity: {
          type: type.STRING,
          allowNull: true,
        },
        requested_permission: {
          type: type.STRING,
          allowNull: true,
        },
        created_at: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        activity_id: {
          type: type.STRING(20),
          allowNull: true,
        },
        activity_event_id: {
          type: type.STRING(20),
          allowNull: true,
        },
        billing_user: {
          type: type.STRING,
          allowNull: true,
        },
        passcode_user: {
          type: type.STRING,
          allowNull: true,
        },
        order_id: {
          type: type.STRING(90),
          allowNull: true,
        },
        bill_number: {
          type: type.STRING(25),
          allowNull: true,
        },
        kot_number: {
          type: type.STRING(25),
          allowNull: true,
        },
        store_id: {
          type: type.STRING(50),
          allowNull: true,
        },
        tmpos_id: {
          type: type.STRING(50),
          allowNull: true,
        },
        extra_details: {
          type: type.JSON,
          allowNull: true,
        },
        permission_given: {
          type: type.BOOLEAN,
          defaultValue: true,
        },
        sync_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_USER_PASSCODE_ACTIVITY,
      },
    );
    await query.addIndex(
      util.DBDetails.Tables.MPOS_USER_PASSCODE_ACTIVITY,
      ['store_id'],
      {
        name: 'storeid_index',
      },
    );
  } catch (err) {}
}

/**
 * Adds default printers
 * @param {*} query
 */
async function addOnlineorderbillprinter(query) {
  try {
    let printers = [
      {
        title: 'Online Bill Printer',
        printer_type: 0,
        action_type: PRINTER_ACTION_TYPES.ONLINE_BILL,
      },
    ];
    query.bulkInsert(util.DBDetails.Tables.MPOS_PRINTER, printers);
  } catch (err) {}
}

async function addShorcutSettings(query) {
  let shortcut1 = [
    {
      id: 35,
      name: 'Open Loyalty Window',
      value: 'ctrl+l',
      default: 'ctrl+l',
      window: 'order',
    },
  ];
  let shortcut2 = [
    {
      id: 36,
      name: 'Send Payment Link',
      value: 'shift+p',
      default: 'shift+p',
      window: 'order',
    },
  ];
  let shortcut3 = [
    {
      id: 37,
      name: 'Open Waiter Window',
      value: 'ctrl+w',
      default: 'ctrl+w',
      window: 'order',
    },
  ];
  let shortcut4 = [
    {
      id: 38,
      name: 'Open Split Bill Window',
      value: 'ctrl+b',
      default: 'ctrl+b',
      window: 'order',
    },
  ];
  let shortcut5 = [
    {
      id: 39,
      name: 'Open Coupon discount Window',
      value: 'ctrl+c',
      default: 'ctrl+c',
      window: 'order',
    },
  ];
  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut5);
  } catch (err) {}
}

async function addExpenseslevelfields(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_EXPENSE,
      'payment_mode',
      type.STRING(40),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_EXPENSE,
      'field1',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_EXPENSE,
      'field2',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_EXPENSE,
      'field3',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_EXPENSE,
      'field4',
      type.STRING(100),
      {
        defaultValue: null,
      },
    );
  } catch (err) {}
}

async function addKotlevelfields(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'kot_uniqueid',
      type.STRING(40),
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'discount_title',
      type.STRING(80),
      {
        defaultValue: null,
      },
    );
  } catch (err) {}
}

async function addLivetrackingchanges(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'live_tracking_enabled',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
  } catch (err) {}
}

async function addOrderlevelfields(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'discount_title',
      type.STRING(80),
      {
        defaultValue: null,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

function addCashDiffInCloseDay(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      'cash_diff',
      type.INTEGER,
      {
        defaultValue: 0,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      'close_day_amount',
      type.INTEGER,
      {
        defaultValue: 0,
        allowNull: true,
      },
    );
  } catch (error) {}
}

const up = async function (query, type) {
  // addSettings(query);
  addnewSettings(query);
  addOrderchildchargeslevelfields(query, type);
  addStorelevelfields(query, type);
  addUserlevelfields(query, type);
  passcodeActivitytable(query, type);
  addOnlineorderbillprinter(query, type);
  // addShorcutSettings(query, type);
  addExpenseslevelfields(query, type);
  addKotlevelfields(query, type);
  addLivetrackingchanges(query, type);
  addOrderlevelfields(query, type);
  addCashDiffInCloseDay(query, type);
  // nextSaleReportId(query, type);
  // addquickCustomeOrderId(query, type);
};
const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
