const util = require('../util/DBUtil');

async function customerLevelfields(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_CUSTOMER,
    'loyalty_points',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_CUSTOMER,
    'loyalty_tier',
    type.STRING(20),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_CUSTOMER,
    'field1',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_CUSTOMER,
    'field2',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
}

async function couponHistoryfields(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_COUPON_DISCOUNT_HISTORY,
    'is_loyalty_coupon',
    type.BOOLEAN,
    {
      defaultValue: 0,
    },
  );
}

async function startdayandshiftChanges(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
    'raw_cash_in_hand',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_USERSHIFT,
    'raw_cash_in_hand',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
}

async function addStorelevelfields(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'field7',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'field8',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'loyalty_enabled',
    type.BOOLEAN,
    {
      defaultValue: 0,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'reward_otp_verification',
    type.BOOLEAN,
    {
      defaultValue: 0,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'loyalty_points_expire_At',
    type.STRING(30),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'custom_qr_codes',
    type.JSON,
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'logout_after_close_pos_app',
    type.BOOLEAN,
    {
      defaultValue: 0,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'activation_expires_at',
    type.STRING(30),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'currency_name',
    type.STRING(30),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_STORE,
    'sub_currency_name',
    type.STRING(30),
    {
      defaultValue: null,
    },
  );
}

async function addOrderlevelfields(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'field1',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'field2',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'field3',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'field4',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
}

async function addKotlevelfields(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'field1', type.STRING(100), {
    defaultValue: null,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'field2', type.STRING(100), {
    defaultValue: null,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'field3', type.STRING(100), {
    defaultValue: null,
  });
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'field4', type.STRING(100), {
    defaultValue: null,
  });
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOT,
    'table_name',
    type.STRING(50),
    {
      defaultValue: null,
    },
  );
}

async function addKotitemlevelfields(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'category_name',
    type.STRING(100),
    {
      defaultValue: null,
    },
  );
}
async function addnewSettings(query) {
  let settingsList1 = [{ id: 100, name: 'new_setting_6', value: '0' }];
  let settingsList2 = [{ id: 101, name: 'new_setting_7', value: '0' }];
  let settingsList3 = [{ id: 102, name: 'new_setting_8', value: '0' }];
  let settingsList4 = [{ id: 103, name: 'new_setting_9', value: '0' }];
  let settingsList5 = [{ id: 104, name: 'new_setting_10', value: '1' }];
  query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
  query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
  query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
  query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
  query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
}

async function addUserlevelfields(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_USER,
    'terminal_access_levels',
    type.JSON,
    {
      defaultValue: null,
    },
  );
}

function createIndexes(queryInterface) {
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_CATEGORY, ['store_id'], {
    name: 'category_storeid_index',
  });
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_CATEGORY,
    ['category_refid'],
    {
      name: 'category_refid_index',
      unique: false,
    },
  );

  queryInterface.addIndex(util.DBDetails.Tables.MPOS_CHARGES, ['store_id'], {
    name: 'charges_storeid_index',
  });
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_CHARGES,
    ['charge_applicable_on'],
    {
      name: 'charge_applicable_on_index',
      unique: false,
    },
  );

  queryInterface.addIndex(util.DBDetails.Tables.MPOS_CUSTOMER, ['store_id'], {
    name: 'customer_storeid_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_CUSTOMER, ['phone'], {
    name: 'custphone_index',
    unique: false,
  });

  // Delivery boy indexes
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_DELIVERYBOY,
    ['store_id'],
    {
      name: 'dboy_storeid_index',
    },
  );

  queryInterface.addIndex(util.DBDetails.Tables.MPOS_DEPARTMENT, ['store_id'], {
    name: 'dept_storeid_index',
  });

  queryInterface.addIndex(util.DBDetails.Tables.MPOS_DISCOUNT, ['store_id'], {
    name: 'discount_storeid_index',
  });

  queryInterface.addIndex(util.DBDetails.Tables.MPOS_EXPENSE, ['store_id'], {
    name: 'expense_storeid_index',
  });

  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_EXPENSE_CATEGORY,
    ['store_id'],
    {
      name: 'expensecat_storeid_index',
    },
  );

  // Expenses sub cat
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_EXPENSE_SUBCATEGORY,
    ['store_id'],
    {
      name: 'expensesubcat_storeid_index',
    },
  );

  // Item
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ITEM, ['store_id'], {
    name: 'item_storeid_index',
  });
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ITEM,
    ['option_group_ref_id'],
    {
      name: 'optiongrps_index',
    },
  );
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ITEM,
    ['category_ref_ids'],
    {
      name: 'catref_index',
    },
  );

  // KOT
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_KOT, ['store_id'], {
    name: 'kot_storeid_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_KOT, ['bill_number'], {
    name: 'bill_number_index',
  });

  // KOT Item
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_KOT_ITEM, ['kot_id'], {
    name: 'kot_id_index',
  });

  // KOT item Charges
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
    ['store_id'],
    {
      name: 'kotitemchargesstore_id_index',
    },
  );

  // Order
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['store_id'], {
    name: 'orderstore_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['user_id'], {
    name: 'user_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['order_state'], {
    name: 'order_state_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['phone'], {
    name: 'orderphone_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['created_time'], {
    name: 'created_time_index',
  });

  // Order Charges
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ORDER_CHARGES,
    ['order_id'],
    {
      name: 'ordercharges_id_index',
    },
  );

  // Order Child
  // queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER_CHILD, ['orderMasterId'], {
  //     name: 'childorder_id_index'
  // });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER_CHILD, ['bill_id'], {
    name: 'bill_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER_CHILD, ['item_id'], {
    name: 'item_id_index',
  });
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    ['product_group_id'],
    {
      name: 'product_group_id_index',
    },
  );
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    ['kitchen_dept'],
    {
      name: 'kitchen_dept_index',
    },
  );

  // Order pay
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ORDER_PAYEMENT,
    ['order_id'],
    {
      name: 'paymentorder_id_index',
    },
  );

  // Order child charges
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
    ['order_id'],
    {
      name: 'ocorder_id_index',
    },
  );
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
    ['order_item_id'],
    {
      name: 'order_item_id_index',
    },
  );

  // Options
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_OPTIONS, ['store_id'], {
    name: 'optionstore_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_OPTIONS, ['ref_id'], {
    name: 'ref_idindex',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_OPTIONS, ['item_ref_id'], {
    name: 'item_ref_id_index',
  });
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_OPTIONS,
    ['opt_grp_ref_ids'],
    {
      name: 'opt_grp_ref_ids_index',
    },
  );
  // Options Grps
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_OPTION_GROUPS,
    ['store_id'],
    {
      name: 'opgstore_id_index',
    },
  );
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_OPTION_GROUPS,
    ['ref_id'],
    {
      name: 'ref_id_index',
    },
  );

  // Settings
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_SETTINGS, ['store_id'], {
    name: 'settingstore_id_index',
  });

  // Store
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_STORE, ['store_id'], {
    name: 'storeid_index',
  });

  // Store mapper
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_STOREMAPPER,
    ['tmpos_store_id'],
    {
      name: 'tmpos_store_id_index',
    },
  );
  queryInterface.addIndex(
    util.DBDetails.Tables.MPOS_STOREMAPPER,
    ['tmchannel_store_id'],
    {
      name: 'tmchannel_store_id_index',
    },
  );

  // Store table
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_TABLE, ['store_id'], {
    name: 'tablestore_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_TABLE, ['department'], {
    name: 'department_index',
  });

  // Store User
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_USER, ['store_id'], {
    name: 'userstore_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_USER, ['username'], {
    name: 'username_index',
  });

  // Wallet
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_WALLET, ['store_id'], {
    name: 'walletstore_id_index',
  });
  queryInterface.addIndex(util.DBDetails.Tables.MPOS_WALLET, ['cust_phone'], {
    name: 'cust_phone_index',
  });
}

async function addTablelevelfields(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_TABLE,
    'is_old_table',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
}

const up = async function (query, type) {
  customerLevelfields(query, type);
  addStorelevelfields(query, type);
  couponHistoryfields(query, type);
  addOrderlevelfields(query, type);
  addKotlevelfields(query, type);
  addnewSettings(query, type);
  startdayandshiftChanges(query, type);
  addUserlevelfields(query, type);
  createIndexes(query);
  addKotitemlevelfields(query, type);
  addTablelevelfields(query, type);
};
const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
