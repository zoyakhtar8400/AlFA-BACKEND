const { PRINTER_ACTION_TYPES } = require('../util/Constants');
const util = require('../util/DBUtil');

/**
 * Adds default printers
 * @param {*} query
 */
async function addDefaultprinters(query) {
  let printers = [
    {
      id: 1,
      title: 'KOT',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.KOT,
    },
    {
      id: 2,
      title: 'Dine-In',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.DINE_IN,
    },
    {
      id: 3,
      title: 'PickUp',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.TAKEAWAY,
    },
    {
      id: 4,
      title: 'Delivery',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.HOME_DELIVERY,
    },
    {
      id: 5,
      title: 'Quick Bill',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.QUICK_BILL,
    },
    {
      id: 6,
      title: 'Label Printer',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.LABEL_PRINTER,
    },
    {
      id: 7,
      title: 'Report Printer',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.REPORT_PRINTER,
    },
    {
      id: 8,
      title: 'Online KOT',
      printer_type: 0,
      action_type: PRINTER_ACTION_TYPES.ONLINE_KOT,
    },
  ];
  try {
    await query.bulkInsert(util.DBDetails.Tables.MPOS_PRINTER, printers);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Adds default settings
 * @param {} query
 */
async function addDefaultSettings(query) {
  let settingsList = [
    { id: 1, name: 'app_theme', value: 'light' },
    { id: 2, name: 'show-bill-details-on-table', value: '1' },
    { id: 3, name: 'show-item-details', value: '1' },
    { id: 4, name: 'show-item-code-with-details', value: '0' },
    { id: 5, name: 'show-solditems-inreport', value: '1' },
    { id: 6, name: 'show-itemnote', value: '0' },
    { id: 7, name: 'tablename-as-customer-info-fortahd', value: '1' },
    { id: 8, name: 'quickbill-table-name', value: 'Quick Bill' },
    { id: 9, name: 'default-tab', value: 'dineintabdivId' },
    { id: 10, name: 'default-quickbill-printkot-status', value: '0' },
    { id: 11, name: 'default-quickbill-printbill-status', value: '0' },
    { id: 12, name: 'printkot-onorder-accept', value: '0' },
    { id: 13, name: 'printbill-onorder-accept', value: '0' },
    { id: 14, name: 'quick-kotprint-label', value: 'KOT' },
    { id: 15, name: 'quick-billprint-label', value: 'Bill' },
    { id: 16, name: 'disabled-tabs', value: 'none' },
    { id: 17, name: 'printlabel-with-kot', value: '0' },
    { id: 18, name: 'kitchen-depswise-kotprint', value: '0' },
    { id: 19, name: 'current-store', value: '0' },
    { id: 20, name: 'show-store-logo', value: '0' },
    { id: 21, name: 'show-storename-onkot', value: '0' },
    { id: 22, name: 'auto-sync', value: '1' },
    { id: 23, name: 'show-orderstate', value: '0' },
    { id: 24, name: 'pull-onlineorder-onaccept', value: '0' },
    { id: 25, name: 'table-container-height', value: '0' },
    { id: 26, name: 'show-default-payment', value: '1' },
    { id: 27, name: 'printer-58mm-config', value: '' },
    { id: 28, name: 'printer-80mm-config', value: '' },
  ];

  try {
    let result = await query.bulkInsert(
      util.DBDetails.Tables.MPOS_SETTINGS,
      settingsList,
    );
  } catch (error) {
    console.log(error);
  }
}

/**
 * Add's shortcuts
 * @param {Query Interface} query
 */
async function addShortcuts(query) {
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
      value: isDarwin ? 'command+d' : 'ctrl+d',
      default: isDarwin ? 'command+d' : 'ctrl+d',
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
      value: isDarwin ? 'command+q' : 'ctrl+q',
      default: isDarwin ? 'command+q' : 'ctrl+q',
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
      value: 'shift+del',
      default: 'shift+del',
      window: 'order',
    },
    {
      id: 12,
      name: 'Free bill',
      value: 'shift+f',
      default: 'shift+f',
      window: 'order',
    },
    {
      id: 13,
      name: 'Search table',
      value: isDarwin ? 'command+t' : 'ctrl+t',
      value: isDarwin ? 'command+t' : 'ctrl+t',
      window: 'order',
    },
    {
      id: 14,
      name: 'Add new customer',
      value: 'shift+c',
      default: 'shift+c',
      window: 'order',
    },
    {
      id: 15,
      name: 'Change Table',
      value: 'shift+t',
      default: 'shift+t',
      window: 'order',
    },
    { id: 16, name: 'Reload App', value: 'f5', default: 'f5', window: 'order' },
    {
      id: 17,
      name: 'Open order window',
      value: 'shift+2',
      default: 'shift+2',
      window: 'global',
    },
    {
      id: 18,
      name: 'Open receipt window',
      value: 'shift+3',
      default: 'shift+3',
      window: 'global',
    },
    // {
    //   id: 19,
    //   name: 'Open online orders window (TMChannel)',
    //   value: 'shift+4',
    //   default: 'shift+4',
    //   window: 'global',
    // },
    {
      id: 20,
      name: 'Logout',
      value: 'shift+5',
      default: 'shift+5',
      window: 'global',
    },
    {
      id: 21,
      name: 'Open settings',
      value: 'shift+6',
      default: 'shift+6',
      window: 'global',
    },
    {
      id: 22,
      name: 'Open old KOT',
      value: isDarwin ? 'option+o' : 'alt+o',
      default: isDarwin ? 'option+o' : 'alt+o',
      window: 'order',
    },
    {
      id: 23,
      name: 'Draft Print',
      value: 'shift+d',
      default: 'shift+d',
      window: 'order',
    },
    {
      id: 24,
      name: 'View customer history',
      value: isDarwin ? 'option+h' : 'alt+h',
      default: isDarwin ? 'option+h' : 'alt+h',
      window: 'order',
    },
    {
      id: 25,
      name: 'Open bill preview',
      value: isDarwin ? 'option+v' : 'alt+v',
      default: isDarwin ? 'option+v' : 'alt+v',
      window: 'order',
    },
    {
      id: 26,
      name: 'Load Menu From Backoffice',
      value: isDarwin ? 'option+l' : 'alt+l',
      default: isDarwin ? 'option+l' : 'alt+l',
      window: 'order',
    },
    {
      id: 27,
      name: 'Toggle section tabs',
      value: 'shift',
      default: 'shift',
      window: 'order',
    },
    {
      id: 28,
      name: 'Switch Store',
      value: isDarwin ? 'option+s' : 'alt+s',
      default: isDarwin ? 'option+s' : 'alt+s',
      window: 'global',
    },
    {
      id: 29,
      name: 'Edit Bill',
      value: isDarwin ? 'option+e' : 'alt+e',
      default: isDarwin ? 'option+e' : 'alt+e',
      window: 'receipt',
    },
    {
      id: 30,
      name: 'Open Reports window',
      value: 'shift+7',
      default: 'shift+7',
      window: 'global',
    },
    {
      id: 31,
      name: 'Open Masters window',
      value: 'shift+8',
      default: 'shift+8',
      window: 'global',
    },
    // {
    //   id: 32,
    //   name: 'Open Fast settle',
    //   value: '+',
    //   default: '+',
    //   window: 'global',
    // },
    {
      id: 33,
      name: 'Switch table/item view',
      value: isDarwin ? 'escape' : 'escape',
      default: isDarwin ? 'escape' : 'escape',
      window: 'global',
    },
  ];

  try {
    let result = await query.bulkInsert(
      util.DBDetails.Tables.MPOS_SHORTCUTS,
      shortcuts,
    );
  } catch (error) {
    console.log(error);
  }
}

/**
 * Add's KOT Item note table
 * @param {Query interface} query
 */
async function addItemnotestable(query, type) {
  await query.createTable(
    util.DBDetails.Tables.MPOS_ITEMNOTES,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_refid: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      note: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ITEMNOTES,
    },
  );
}

/**
 * Create database table of store mappings
 * @param {Query Interface} query
 * @param {Sequelize object} type
 */
async function addStoreMapper(query, type) {
  await query.createTable(
    util.DBDetails.Tables.MPOS_STOREMAPPER,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tmpos_store_id: {
        type: type.STRING,
        allowNull: true,
      },
      tmchannel_store_id: {
        type: type.STRING,
        allowNull: true,
      },
      tmpos_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_STOREMAPPER,
    },
  );
}

module.exports = {
  up: async function (query, type) {
    await query.createTable(
      util.DBDetails.Tables.MPOS_DEPARTMENT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        department_name: {
          type: type.STRING,
        },
        is_active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_DEPARTMENT,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_TABLE,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        table_name: {
          type: type.STRING,
          allowNull: false,
        },
        isactive: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        max_person: {
          type: type.STRING,
          defaultValue: '0',
        },
        department: {
          type: type.INTEGER,
          // references: {
          //     model: util.DBDetails.Tables.MPOS_DEPARTMENT,
          //     key: 'id'
          // }
        },
        table_color: {
          type: type.STRING,
          allowNull: true,
        },
        order_type_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        table_action_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        order_state: {
          type: type.STRING,
          allowNull: true,
        },
        parent: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_TABLE,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_CATEGORY,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        category_refid: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        category_name: {
          type: type.STRING,
        },
        description: {
          type: type.STRING,
          allowNull: true,
        },
        is_active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        img_url: {
          type: type.STRING,
          allowNull: true,
        },
        parent_ref_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_CATEGORY,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_ITEM,
      {
        item_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        item_refid: {
          type: type.INTEGER,
        },
        tmpos_menu_id: {
          type: type.STRING,
        },
        title: {
          type: type.STRING,
        },
        short_code: {
          type: type.STRING,
        },
        active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        description: {
          type: type.STRING,
          allowNull: true,
        },
        current_stock: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        recommended: {
          type: type.STRING,
          allowNull: true,
        },
        sale_price: {
          type: type.DECIMAL(10, 2),
        },
        option_group_ref_id: {
          type: type.STRING,
          allowNull: true,
        },
        tax_per: {
          type: type.DECIMAL(10, 2),
        },
        tax_value: {
          type: type.DECIMAL(10, 2),
        },
        tax_method: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        itemsub_total: {
          type: type.DECIMAL(10, 2),
        },
        category_ref_ids: {
          type: type.STRING,
          allowNull: true,
        },
        created_at: {
          type: type.DATE,
          allowNull: true,
        },
        modified_at: {
          type: type.DATE,
          allowNull: true,
        },
        is_devidable: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        img_url: {
          type: type.STRING,
          allowNull: true,
        },
        food_type: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        tax_name: {
          type: type.STRING,
        },
        kitchen_dept: {
          type: type.INTEGER,
        },
        product_group: {
          type: type.INTEGER,
        },
        tax_discount_method: {
          type: type.INTEGER,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ITEM,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_CHARGES,
      {
        charge_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: type.STRING,
        },
        per_or_fixed: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        is_default: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        billing_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        amount: {
          type: type.DECIMAL(10, 2),
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_CHARGES,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_CUSTOMER,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        is_guest_mode: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        address_line1: {
          type: type.STRING,
          allowNull: true,
        },
        address_line2: {
          type: type.STRING,
          allowNull: true,
        },
        sub_locality: {
          type: type.STRING,
          allowNull: true,
        },
        email: {
          type: type.STRING,
          allowNull: true,
        },
        name: {
          type: type.STRING,
          allowNull: true,
        },
        phone: {
          type: type.STRING,
          allowNull: true,
        },
        city: {
          type: type.STRING,
          allowNull: true,
        },
        business_name: {
          type: type.STRING,
          allowNull: true,
        },
        description: {
          type: type.STRING,
          allowNull: true,
        },
        fssai: {
          type: type.STRING,
          allowNull: true,
        },
        panno: {
          type: type.STRING,
          allowNull: true,
        },
        adhar: {
          type: type.STRING,
          allowNull: true,
        },
        gstno: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_CUSTOMER,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_OPTION_GROUPS,
      {
        ref_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: type.STRING,
        },
        description: {
          type: type.STRING,
          allowNull: true,
        },
        min_selectable: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        max_selectable: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        item_ref_ids: {
          type: type.STRING,
          allowNull: true,
        },
        is_addon: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_OPTION_GROUPS,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_OPTIONS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ref_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        title: {
          type: type.STRING,
        },
        description: {
          type: type.STRING,
          allowNull: true,
        },
        available: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        price: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        weight: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        opt_grp_ref_ids: {
          type: type.STRING,
          allowNull: true,
        },
        item_ref_id: {
          type: type.STRING,
          allowNull: true,
        },
        option_tax: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        option_level_subtotal: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        option_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_OPTIONS,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_PAYMENT_MODE,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        payment_mode_name: {
          type: type.STRING,
        },
        payment_mode_image: {
          type: type.STRING,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_PAYMENT_MODE,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_DISCOUNT,
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
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_DISCOUNT,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_KOT,
      {
        kot_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        in_time: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        out_time: {
          type: type.STRING,
          allowNull: true,
        },
        status: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        user_id: {
          type: type.STRING,
          allowNull: true,
        },
        table_id: {
          type: type.INTEGER,
          defaultValue: 0,
          // references: {
          //     model: util.DBDetails.Tables.MPOS_TABLE,
          //     key: 'id'
          // }
        },
        note: {
          type: type.STRING,
          allowNull: true,
        },
        amount: {
          type: type.DECIMAL(10, 2),
        },
        is_active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        kot_date: {
          type: type.STRING,
          allowNull: true,
          defaultValue: type.NOW,
        },
        createdBy: {
          type: type.STRING,
          allowNull: true,
        },
        createdDate: {
          type: type.STRING,
          allowNull: true,
          defaultValue: type.NOW,
        },
        modifiedBy: {
          type: type.STRING,
          allowNull: true,
        },
        is_transferred: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        billing_type: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        print_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        draftprint_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        discount_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        discount_type: {
          type: type.STRING,
        },
        discount_rate: {
          type: type.DECIMAL(10, 2),
        },
        payment_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        persons: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        customer_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        customer_name: {
          type: type.STRING,
          allowNull: true,
        },
        customer_mobile: {
          type: type.STRING,
          allowNull: true,
        },
        bill_number: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        sendEbillcheck: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        showCustomeronbill: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        sync_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        order_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        deliveryboy_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_KOT,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        table_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        title: {
          type: type.STRING,
        },
        is_active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        remark: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        status_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        order_billing_flag: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        is_default_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        per_or_fixed: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        charge_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_KOT_CHARGES,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        kot_id: {
          type: type.INTEGER,
          references: {
            model: util.DBDetails.Tables.MPOS_KOT,
            key: 'kot_id',
          },
        },
        item_id: {
          type: type.INTEGER,
          // references: {
          //     model: util.DBDetails.Tables.MPOS_ITEM,
          //     key: 'item_id',
          //     onDelete: 'cascade'
          // }
        },
        item_name: {
          type: type.STRING,
        },
        item_price: {
          type: type.DECIMAL(10, 2),
        },
        quantity: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        amount: {
          type: type.DECIMAL(10, 2),
        },
        note: {
          type: type.STRING,
          allowNull: true,
        },
        status: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        user_id: {
          type: type.STRING,
          allowNull: true,
        },
        start_time: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        out_time: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        is_transferred: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        reason: {
          type: type.STRING,
          allowNull: true,
        },
        createdBy: {
          type: type.STRING,
          allowNull: true,
        },
        modifiedBy: {
          type: type.STRING,
          allowNull: true,
        },
        modifiedDate: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        item_tax_name: {
          type: type.STRING,
          allowNull: true,
        },
        item_tax_per: {
          type: type.DECIMAL(10, 2),
        },
        item_tax_value: {
          type: type.DECIMAL(10, 2),
        },
        item_tax_method: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_is_devidable: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_total_tax_value: {
          type: type.DECIMAL(10, 2),
        },
        tax_discount_method: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        short_code: {
          type: type.STRING,
          allowNull: true,
        },
        has_options: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        product_group_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        product_group_name: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_KOT_ITEM,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        kot_items_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        option_group_name: {
          type: type.STRING,
          allowNull: true,
        },
        option_group_ref_id: {
          type: type.STRING,
          allowNull: true,
        },
        option_ref_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        option_name: {
          type: type.STRING,
          allowNull: true,
        },
        option_price: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        option_tax_amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        option_total: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        option_total_with_tax: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        option_qty: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        option_type: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_ref_id: {
          type: type.STRING,
          allowNull: true,
        },
        option_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_ORDER,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: type.STRING,
          allowNull: true,
          unique: true,
        },
        store_id: {
          type: type.STRING,
        },
        table_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        table_name: {
          type: type.STRING,
          allowNull: true,
        },
        user_id: {
          type: type.STRING,
          allowNull: true,
        },
        cust_name: {
          type: type.STRING,
          allowNull: true,
        },
        phone: {
          type: type.STRING,
          allowNull: true,
        },
        email: {
          type: type.STRING,
          allowNull: true,
        },
        is_guest_mode: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        line_1: {
          type: type.STRING,
          allowNull: true,
        },
        line_2: {
          type: type.STRING,
          allowNull: true,
        },
        discount: {
          type: type.STRING,
          allowNull: true,
        },
        charges: {
          type: type.STRING,
          allowNull: true,
        },
        delivery_type: {
          type: type.STRING,
          allowNull: true,
          defaultValue: '0',
        },
        instructions: {
          type: type.STRING,
          allowNull: true,
        },
        quantity: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        order_level_total_charges: {
          type: type.DECIMAL(10, 2),
        },
        order_level_total_taxes: {
          type: type.DECIMAL(10, 2),
        },
        order_state: {
          type: type.STRING,
          allowNull: true,
        },
        order_subtotal: {
          type: type.DECIMAL(10, 2),
        },
        order_total: {
          type: type.DECIMAL(10, 2),
        },
        my_order_date: {
          type: type.DATEONLY,
          allowNull: true,
          defaultValue: type.NOW,
        },
        created_time: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        payment: {
          type: type.STRING,
          allowNull: true,
          defaultValue: 'Cash',
        },
        items: {
          type: type.STRING,
          allowNull: true,
        },
        order_check_flag: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        billing_type: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        print_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        draftprint_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        payment_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        persons: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        bill_number: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        sync_status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        order_flag: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        deliveryboy_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        total_external_discount: {
          type: type.DECIMAL(10, 2),
        },
        delivery_boy_name: {
          type: type.STRING,
          allowNull: true,
        },
        delivery_boy_phone: {
          type: type.STRING,
          allowNull: true,
        },
        createdBy: {
          type: type.STRING,
          allowNull: true,
        },
        inventoryReduced: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDER,
        // hierarchy: true
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_ORDER_CHILD,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        bill_id: {
          type: type.INTEGER,
          references: {
            model: util.DBDetails.Tables.MPOS_ORDER,
            key: 'id',
          },
        },
        orderMasterId: {
          type: type.STRING,
          allowNull: true,
        },
        item_id: {
          type: type.STRING,
        },
        food_type: {
          type: type.STRING,
          allowNull: true,
        },
        discount: {
          type: type.DECIMAL(10, 2),
        },
        image_url: {
          type: type.STRING,
          allowNull: true,
        },
        price: {
          type: type.DECIMAL(10, 2),
        },
        quantity: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        title: {
          type: type.STRING,
          allowNull: true,
        },
        total: {
          type: type.DECIMAL(10, 2),
        },
        total_with_tax: {
          type: type.DECIMAL(10, 2),
        },
        tax_name: {
          type: type.STRING,
          allowNull: true,
        },
        tax_per: {
          type: type.DECIMAL(10, 2),
        },
        tax_value: {
          type: type.DECIMAL(10, 2),
        },
        tax_method: {
          type: type.STRING,
          allowNull: true,
        },
        is_devidable: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_note: {
          type: type.STRING,
          allowNull: true,
        },
        tax_discount_method: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        product_group_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        product_group_name: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDER_CHILD,
        // hierarchy: true
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_ORDER_PAYEMENT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: type.STRING,
        },
        payment_option: {
          type: type.STRING,
        },
        amount: {
          type: type.DECIMAL(10, 2),
        },
        status_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDER_PAYEMENT,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: type.STRING,
        },
        title: {
          type: type.STRING,
        },
        value: {
          type: type.DECIMAL(10, 2),
        },
        remark: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        status_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        order_billing_flag: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        is_default_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        per_or_fixed: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        charge_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_ORDERCHILD_OPTION_ADDONS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: type.STRING,
          allowNull: true,
        },
        item_ref_id: {
          type: type.STRING,
          allowNull: true,
        },
        order_item_id: {
          type: type.STRING,
          allowNull: true,
        },
        option_group_ref_id: {
          type: type.STRING,
          allowNull: true,
        },
        option_ref_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        option_group_name: {
          type: type.STRING,
          allowNull: true,
        },
        title: {
          //here name should be small full half
          type: type.STRING,
          allowNull: true,
        },
        qty: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        price: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        total: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        total_with_tax: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        tax_per: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        tax_value: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        tax_method: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        is_devidable: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_note: {
          type: type.STRING,
          allowNull: true,
        },
        tax_discount_method: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        type: {
          //addon or option
          type: type.INTEGER,
          defaultValue: 0,
        },
        option_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDERCHILD_OPTION_ADDONS,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_PRINTER,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        device_name: {
          type: type.STRING,
          allowNull: true,
        },
        device_address: {
          type: type.STRING,
          allowNull: true,
        },
        title: {
          type: type.STRING,
          allowNull: true,
        },
        activate: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        created_date: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        printer_size: {
          type: type.INTEGER,
          defaultValue: 2,
        },
        printer_port_number: {
          type: type.STRING,
          allowNull: true,
        },
        printer_type: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        action_type: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        no_of_prints: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        more_info: {
          type: type.JSON,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_PRINTER,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_SETTINGS,
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
        value: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_SETTINGS,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_STORE,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_name: {
          type: type.STRING,
          allowNull: true,
        },
        store_phone: {
          type: type.STRING,
          allowNull: true,
        },
        user_phone: {
          type: type.STRING,
          allowNull: true,
        },
        disable_ordering: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        username: {
          type: type.STRING,
          allowNull: true,
        },
        person_name: {
          type: type.STRING,
          allowNull: true,
        },
        user_email: {
          type: type.STRING,
          allowNull: true,
        },
        user_city: {
          type: type.STRING,
          allowNull: true,
        },
        user_line_1: {
          type: type.STRING,
          allowNull: true,
        },
        user_line_2: {
          type: type.STRING,
          allowNull: true,
        },
        user_sub_locality: {
          type: type.STRING,
          allowNull: true,
        },
        user_designation: {
          type: type.STRING,
          allowNull: true,
        },
        user_shift_time: {
          type: type.STRING,
          allowNull: true,
        },
        country: {
          type: type.STRING,
          allowNull: true,
        },
        currency: {
          type: type.STRING,
          allowNull: true,
        },
        store_email: {
          type: type.STRING,
          allowNull: true,
        },
        website: {
          type: type.STRING,
          allowNull: true,
        },
        note: {
          type: type.STRING,
          allowNull: true,
        },
        footer_note: {
          type: type.STRING,
          allowNull: true,
        },
        upi_id: {
          type: type.STRING,
          allowNull: true,
        },
        field1: {
          type: type.STRING,
          allowNull: true,
        },
        field2: {
          type: type.STRING,
          allowNull: true,
        },
        field3: {
          type: type.STRING,
          allowNull: true,
        },
        field4: {
          type: type.STRING,
          allowNull: true,
        },
        currency_code: {
          type: type.STRING,
          allowNull: true,
        },
        show_upi: {
          type: type.STRING,
          allowNull: true,
        },
        settings: {
          type: type.JSON,
          allowNull: true,
        },
        password: {
          type: type.STRING,
          allowNull: true,
        },
        resetBillAfterDays: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        warehouse_id: {
          type: type.STRING,
          allowNull: true,
        },
        reduce_inventory: {
          type: type.STRING,
          allowNull: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        sync_hash: {
          type: type.STRING,
          allowNull: true,
        },
        token: {
          type: type.STRING,
          allowNull: true,
        },
        access_levels: {
          type: type.JSON,
          allowNull: true,
        },
        reset_bill_time: {
          type: type.STRING,
          allowNull: true,
        },
        reset_kot_indays: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        reset_kot_time: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_STORE,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        bill_number: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        kot_number: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        takeawaybill_number: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        takeawaykot_number: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_DELIVERYBOY,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: type.STRING,
          allowNull: true,
        },
        phone: {
          type: type.STRING,
          allowNull: true,
        },
        name: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_DELIVERYBOY,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_SHORTCUTS,
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
        value: {
          type: type.STRING,
          allowNull: true,
        },
        default: {
          type: type.STRING,
          allowNull: true,
        },
        window: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_SHORTCUTS,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_KITCHEN_DEPARTMENT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        store_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        kitchen_dept_name: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_KITCHEN_DEPARTMENT,
      },
    );

    //Add Expenses
    await query.createTable(
      util.DBDetails.Tables.MPOS_EXPENSE_CATEGORY,
      {
        category_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ref_id: {
          type: type.INTEGER,
        },
        category_name: {
          type: type.STRING,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_EXPENSE_CATEGORY,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_EXPENSE_SUBCATEGORY,
      {
        sub_category_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ref_id: {
          type: type.INTEGER,
        },
        category_id: {
          type: type.INTEGER,
        },
        sub_category_name: {
          type: type.STRING,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_EXPENSE_SUBCATEGORY,
      },
    );
    await query.createTable(
      util.DBDetails.Tables.MPOS_EXPENSE,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        expense_id: {
          type: type.INTEGER,
        },
        category_id: {
          type: type.INTEGER,
        },
        sub_category_id: {
          type: type.INTEGER,
        },
        amount: {
          type: type.DECIMAL(10, 2),
        },
        expense_time: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        description: {
          type: type.STRING,
          allowNull: true,
        },
        is_chargable: {
          //1 Non chargable 0 not
          type: type.INTEGER,
          defaultValue: 0,
        },
        category_name: {
          type: type.STRING,
          allowNull: true,
        },
        sub_category_name: {
          type: type.STRING,
          allowNull: true,
        },
        is_chargable: {
          //1 Non chargable 0 not
          type: type.INTEGER,
          defaultValue: 0,
        },
        sync_flag: {
          //1 Synced
          type: type.INTEGER,
          defaultValue: 0,
        },
        expense_date: {
          type: type.DATEONLY,
          allowNull: true,
          defaultValue: type.NOW,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_EXPENSE,
      },
    );

    await query.createTable(
      util.DBDetails.Tables.MPOS_USER,
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
        password: {
          type: type.STRING,
          allowNull: false,
        },
        type: {
          type: type.STRING,
          allowNull: true,
        },
        status: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        IPAddress: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        is_captain_app: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        is_kds_app: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        is_self_order: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        is_old_kot_enabled: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        // 1=enabled & delete kot & cancelled kot access
        // 2= enabled & delete kot access
        // 3= enabled & cancelled kot access
        // 4= old kot button disabled
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_USER,
      },
    );

    await addItemnotestable(query, type);
    await addStoreMapper(query, type);
    await addDefaultprinters(query);
    await addDefaultSettings(query);

    return true;
  },
  down: function (query, DataTypes) {},
};
