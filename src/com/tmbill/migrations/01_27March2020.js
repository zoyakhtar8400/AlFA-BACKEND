const util = require('../util/DBUtil');

/**
 * Add's new settings to the database.
 * @param {Query interface} query
 */
async function addnewSettings(query) {
  try {
    let settingsList = [
      { id: 29, name: 'bill-roundoff', value: '0' },
      { id: 30, name: 'show_orderid_on_kot', value: '0' },
      { id: 31, name: 'show-customeronbill-default', value: '0' },
      { id: 32, name: 'show-customeronkot', value: '0' },
    ];
    await query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Add'c customer changes
 * @param {Query Interface} queryInterface
 * @param {*} type
 */
async function customerChanges(queryInterface, type) {
  try {
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_CUSTOMER,
      'dob',
      type.DATEONLY,
      {
        allowNull: true,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_CUSTOMER,
      'anniversary',
      type.DATEONLY,
      {
        allowNull: true,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_CUSTOMER,
      'sync_flag',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
  } catch (err) {}
}

/**
 * Add's quantity changes
 * @param {Query Interface} queryInterface
 * @param {*} type
 */
async function quantityChanges(queryInterface, type) {
  try {
    await queryInterface.changeColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'quantity',
      type.DECIMAL(10, 2),
      {
        defaultValue: 1,
      },
    );
    await queryInterface.changeColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHILD,
      'quantity',
      type.DECIMAL(10, 2),
      {
        defaultValue: 1,
      },
    );
  } catch (err) {}
}

/**
 * Add's preparation time to
 * @param {Query Interface} queryInterface
 * @param {*} type
 */
async function addPreparationtimechanges(queryInterface, type) {
  queryInterface.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'preparation_time',
    type.STRING,
    {
      allowNull: true,
    },
  );
  try {
    await queryInterface.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, [
      { id: 33, name: 'show-itempreptime', value: '1' },
      { id: 34, name: 'show-newoldkottitle', value: '0' },
      { id: 35, name: 'start-billing-by-section', value: '0' },
      { id: 36, name: 'draft-billprint-status', value: '1' },
      { id: 37, name: 'send-servernotification-to', value: '0' },
      { id: 38, name: 'sortitem-by', value: '3' },
      { id: 39, name: 'default-sendebill-status', value: '0' },
      { id: 40, name: 'confirm-beforeorderstatechange-receipt', value: '0' },
      { id: 41, name: 'confirm-beforeorderstatechange-order', value: '0' },
      { id: 42, name: 'show-billamount-inwords', value: '1' },
      { id: 43, name: 'allow-apply-discount-afterprint', value: '1' },
      { id: 44, name: 'allow-apply-charges-afterprint', value: '1' },
      { id: 45, name: 'show-duepayment-onbill', value: '0' },
      { id: 46, name: 'default-sendcustomerdetail-todboy-check', value: '0' },
      { id: 47, name: 'kot-format-settings', value: '' },
      { id: 48, name: 'bill-format-settings', value: '' },
      { id: 49, name: 'kot-print-view', value: '1' },
      { id: 50, name: 'disable-savekot-button', value: '1' },
      { id: 51, name: 'disable-savebill-button', value: '1' },
      {
        id: 52,
        name: 'covers-required-for-pos',
        value:
          '{"dinein":false,"takeaway":false,"delivery":false,"quick":false}',
      },
      { id: 53, name: 'covers-required-for-kds', value: '0' },
      { id: 54, name: 'displaytime-on-tables', value: '0' },
      { id: 55, name: 'group-kitchenwise-printes', value: '0' },
      { id: 56, name: 'show-orderid-onbill', value: '1' },
      { id: 57, name: 'show-billno-onbill', value: '1' },
      { id: 58, name: 'show-billhistory-onreport', value: '1' },
      { id: 59, name: 'show-payments-onreport', value: '1' },
      { id: 60, name: 'show-summarystat-onreport', value: '1' },
      { id: 61, name: 'enable-tablewise-printing', value: '0' },
      { id: 62, name: 'show-itemnote-on-bill', value: '0' },
      { id: 63, name: 'show-covers-on-kotprint', value: '0' },
      { id: 64, name: 'allow-discountapply-before-save', value: '0' },
      { id: 65, name: 'hide-cleardata-on-logout', value: '0' },
    ]);
  } catch (error) {
    console.log(error);
  }
}

async function couponDiscountchanges(queryInterface, type) {
  try {
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'couponDisount',
      type.DECIMAL(10, 2),
      {
        allowNull: true,
        defaultValue: 0,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'couponDisounttype',
      type.INTEGER,
      {
        allowNull: true,
        defaultValue: 0,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'coupon',
      type.STRING,
      {
        allowNull: true,
      },
    );

    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'couponDisount',
      type.DECIMAL(10, 2),
      {
        allowNull: true,
        defaultValue: 0,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'couponDisounttype',
      type.INTEGER,
      {
        allowNull: true,
        defaultValue: 0,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'coupon',
      type.STRING,
      {
        allowNull: true,
      },
    );

    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'couponDisounttotal',
      type.DECIMAL(10, 2),
      {
        allowNull: true,
        defaultValue: 0,
      },
    );
  } catch (err) {}
}

async function addSectionwisebillingchanges(queryInterface, type) {
  try {
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'issectionwisebilling',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    await queryInterface.createTable(
      util.DBDetails.Tables.MPOS_SECTIONWISE_DISCOUNT_HISTORY,
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
        product_group_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        discounted_amt: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        discount_type: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        discount_rate: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        coupon_code_name: {
          type: type.STRING,
          allowNull: true,
        },
        coupon_code_type: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        coupon_code_rate: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        coupon_code_amt: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_SECTIONWISE_DISCOUNT_HISTORY,
      },
    );
  } catch (err) {}
}

/**
 * Add's customizable table
 * @param {Query Interface} query
 * @param {*} type
 */
async function addCustomizeddiscounttable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: type.STRING,
          allowNull: true,
        },
        amount: {
          type: type.DECIMAL(10, 2),
        },
        type: {
          //1 Fixed 0 Percent
          type: type.INTEGER,
          defaultValue: 1,
        },
        order_type: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        applicable_on_amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        max_applicable_discount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        amount_lower_limit: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        amount_upper_limit: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        from_date_time: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        to_date_time: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        discount_day: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        is_active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        discount_after_amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        is_default: {
          //1 Fixed 0 Percent
          type: type.BOOLEAN,
          defaultValue: 1,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT,
      },
    );
  } catch (err) {}
}

/**
 * Add's product group table
 * @param {Query Interface} query
 * @param {*} type
 */
async function addProducgrouptable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_PRODUCTGROUP,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        product_group_id: {
          type: type.INTEGER,
        },
        store_id: {
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
        tableName: util.DBDetails.Tables.MPOS_PRODUCTGROUP,
      },
    );
  } catch (err) {}
}

/**
 * Creates new coupon history table
 * @param {Query interface} query
 * @param {Sequelize object} type
 */
async function addCouponhistorytable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_COUPON_DISCOUNT_HISTORY,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        logedin_user: {
          type: type.STRING,
          allowNull: true,
        },
        coupon_code: {
          type: type.STRING,
          allowNull: true,
        },
        customer_name: {
          type: type.STRING,
          allowNull: true,
        },
        customer_phone: {
          type: type.STRING,
          allowNull: true,
        },
        coupon_code_amt: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        used_date: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        order_id: {
          type: type.STRING,
          allowNull: true,
        },
        sync_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_COUPON_DISCOUNT_HISTORY,
      },
    );
  } catch (error) {}
}

/**
 * Creates a start day-close day table.
 * @param {Query interface} query
 * @param {*} type
 */
async function addStartclosedaytable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        start_day_date: {
          type: type.TIME,
          allowNull: true,
        },
        day_start_by_user: {
          type: type.STRING,
          allowNull: true,
        },
        day_close_date: {
          type: type.TIME,
          allowNull: true,
        },
        day_close_by_user: {
          type: type.STRING,
          allowNull: true,
        },
        opening_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        prev_closing_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        total_expense: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        total_sales: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        current_closing_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        created_date: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        day_start_petty_cash_amt: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        day_close_petty_cash_amt: {
          type: type.STRING,
          allowNull: true,
        },
        invoice_range: {
          type: type.STRING,
          allowNull: true,
        },
        start_day_comment: {
          type: type.STRING,
          allowNull: true,
        },
        close_day_comment: {
          type: type.STRING,
          allowNull: true,
        },
        extra_details: {
          type: type.JSON,
          allowNull: true,
        },
        sync_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      },
    );
  } catch (error) {}
}

/**
 * Creates user shift table
 * @param {Query Interface} query
 * @param {*} type
 */
async function addUsershifttable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_USERSHIFT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        shift_start_date: {
          type: type.TIME,
          allowNull: true,
        },
        shift_start_by_user: {
          type: type.STRING,
          allowNull: true,
        },
        shift_end_date: {
          type: type.TIME,
          allowNull: true,
        },
        shift_end_by_user: {
          type: type.STRING,
          allowNull: true,
        },
        opening_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        prev_closing_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        total_expense: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        total_sales: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        current_closing_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        created_date: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        day_start_petty_cash_amt: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        day_close_petty_cash_amt: {
          type: type.STRING,
          allowNull: true,
        },
        invoice_range: {
          type: type.STRING,
          allowNull: true,
        },
        shift_start_comment: {
          type: type.STRING,
          allowNull: true,
        },
        shift_end_comment: {
          type: type.STRING,
          allowNull: true,
        },
        extra_details: {
          type: type.JSON,
          allowNull: true,
        },
        sync_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_USERSHIFT,
      },
    );
  } catch (error) {}
}

/**
 * Creates the table for Wallet,Wallettrans.,Duepayments
 * @param {Query Interface} query
 * @param {Sequelize} type
 */
async function customerWalletchanges(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_WALLET,
      {
        wallet_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        cust_phone: {
          type: type.STRING,
          allowNull: true,
        },
        wallet_name: {
          type: type.STRING,
          allowNull: false,
        },
        available_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        is_active: {
          type: type.INTEGER,
          defaultValue: 1,
        },
        created_on: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        created_by: {
          type: type.STRING,
          allowNull: true,
        },
        modified_on: {
          type: type.DATE,
          allowNull: true,
          defaultValue: type.NOW,
        },
        sync_flag: {
          type: type.INTEGER,
          defaultValue: 1,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_WALLET,
      },
    );

    query.createTable(
      util.DBDetails.Tables.MPOS_WALLET_TRANSACTIONS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        wallet_id: {
          type: type.STRING,
          allowNull: true,
        },
        order_id: {
          type: type.STRING,
          allowNull: true,
        },
        credit_debit_type: {
          type: type.BOOLEAN,
          defaultValue: 1,
        },
        amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        created_time: {
          type: type.DATE,
          defaultValue: type.NOW,
        },
        user_id: {
          type: type.STRING,
          allowNull: false,
        },
        available_balance: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        transaction_id: {
          type: type.STRING,
          allowNull: false,
        },
        sync_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_WALLET_TRANSACTIONS,
      },
    );
    query.createTable(
      util.DBDetails.Tables.MPOS_DUEPAYMENTS,
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
        order_id: {
          type: type.STRING,
          allowNull: true,
        },
        cust_mobile: {
          type: type.STRING,
          allowNull: true,
        },
        amount_to_pay: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        received_amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        due_amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        waived_off: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        payment_info: {
          type: type.STRING,
          allowNull: true,
        },
        billing_user_id: {
          type: type.STRING,
          allowNull: true,
        },
        status: {
          type: type.BOOLEAN,
          defaultValue: 1,
        },
        created: {
          type: type.DATE,
          defaultValue: type.NOW,
        },
        transaction_id: {
          type: type.STRING,
          allowNull: false,
        },
        sync_flag: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_DUEPAYMENTS,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'due_payment',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'hasDuepayment',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'order_kotflag',
      type.BOOLEAN,
      {
        defaultValue: 1,
      },
    );
  } catch (error) {}
}

async function addItemlevelchargeschanges(queryInterface, type) {
  try {
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'applicable_on_items',
      type.STRING,
      {
        allowNull: true,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'calculate_tax_for_item_charges',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'charge_applicable_on',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );

    queryInterface.createTable(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
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
        itemtitle: {
          type: type.STRING,
        },
        charge_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        title: {
          type: type.STRING,
        },
        per_or_fixed: {
          type: type.INTEGER, //1-percentage 0-fix
          defaultValue: 0,
        },
        is_default: {
          type: type.INTEGER, //1-default 0-not default
          defaultValue: 0,
        },
        billing_flag: {
          //0=All ,1=Quick Bill, 2=Dine In, 3= TA
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
        applicable_on_items: {
          type: type.STRING,
          allowNull: true,
        },
        calculate_tax_for_item_charges: {
          //1= calculate tax for charge  0=do not calculate tax for charge
          type: type.BOOLEAN,
          defaultValue: 0,
        },
        charge_applicable_on: {
          //0=order level   1=item level    2=on both
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      },
    );

    queryInterface.createTable(
      util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
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
        order_item_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        charge_title: {
          type: type.STRING,
        },
        charge_amount: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        per_fixed: {
          type: type.INTEGER, //1-percentage 0-fix
          defaultValue: 0,
        },
        calculated_charge: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        calculated_tax: {
          type: type.DECIMAL(10, 2),
          defaultValue: 0,
        },
        calculate_tax_for_item_charges: {
          //1= calculate tax for charge  0=do not calculate tax for charge
          type: type.BOOLEAN,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
      },
    );
  } catch (err) {}
}

async function addKDSchanges(queryInterface, type) {
  try {
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'orderstatus',
      type.STRING,
      {
        defaultValue: 'Placed',
        allowNull: true,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'previousstatus',
      type.STRING,
      {
        allowNull: true,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'statusChangedby',
      type.STRING,
      {
        allowNull: true,
      },
    );
    queryInterface.addColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'comment',
      type.STRING,
      {
        allowNull: true,
      },
    );
    console.log('column created');
  } catch (err) {
    console.log(err);
  }
}
const up = async function (query, type) {
  await addnewSettings(query);
  await customerChanges(query, type);
  await addCustomizeddiscounttable(query, type);
  await quantityChanges(query, type);
  await addCouponhistorytable(query, type);
  await couponDiscountchanges(query, type);
  await addStartclosedaytable(query, type);
  await addUsershifttable(query, type);
  await addPreparationtimechanges(query, type);
  await addProducgrouptable(query, type);
  await addSectionwisebillingchanges(query, type);
  await customerWalletchanges(query, type);
  await addItemlevelchargeschanges(query, type);
  await addKDSchanges(query, type);
};
const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
