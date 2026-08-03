const util = require('../util/DBUtil');

async function addtaxonchargeChanges(query, type) {
  try {
    // Additional charges table changes
    query.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'is_tax_applicable',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'tax_amount',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_CHARGES,
      'is_tax_included',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );

    // KOT level charges changes
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'applicable_on_items',
      type.STRING,
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'calculate_tax_for_item_charges',
      type.BOOLEAN,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'charge_applicable_on',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'delivery_free_afteramount',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'delivery_applicable_platform',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'is_tax_applicable',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'tax_amount',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      'is_tax_included',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );

    // Order level charges changes
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      'calculated_tax',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHARGES,
      'is_tax_included',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );

    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'charges_level_total_tax',
      type.DECIMAL(10, 2),
      {
        defaultValue: 0,
      },
    );
  } catch (error) {}
}

async function addStorelevelchanges(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'show_poweredby',
      type.INTEGER,
      {
        defaultValue: 1,
      },
    );
  } catch (error) {}
}

async function addKitchendeptokotitem(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'kitchen_dept',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
  } catch (error) {}
}

async function addAlternativenametostore(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_STORE,
      'alternative_outlet_name',
      type.STRING,
      {
        defaultValue: null,
      },
    );
  } catch (error) {}
}

async function addTerminalappuser(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_USER,
      'is_terminal_app',
      type.INTEGER,
      {
        defaultValue: 1,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_USER,
      'assignedKitchedeps',
      type.STRING,
      {
        defaultValue: null,
        allowNull: true,
      },
    );
  } catch (error) {}
}

async function addKitchendeptoorderchild(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHILD,
      'kitchen_dept',
      type.INTEGER,
      {
        defaultValue: 0,
      },
    );
  } catch (error) {}
}

async function addnewSettings(query) {
  try {
    const settingsList1 = [{ id: 82, name: 'show-date-on-bill', value: '1' }];
    const settingsList2 = [{ id: 83, name: 'mask-order-id', value: '0' }];
    const settingsList3 = [
      { id: 84, name: 'show-kotnos-on-table', value: '0' },
    ];
    const settingsList4 = [
      { id: 85, name: 'show-username-onbill', value: '1' },
    ];
    const settingsList5 = [
      { id: 86, name: 'use-seperate-table-item-view', value: '1' },
    ];
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
  } catch (error) {
    console.log(error);
  }
}

async function addSectionwisediscountchanges(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_DISCOUNT,
      'product_groups',
      type.STRING,
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT,
      'product_groups',
      type.STRING,
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT,
      'discounted_product_groups',
      type.STRING,
      {
        defaultValue: null,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'discounted_product_groups',
      type.STRING,
      {
        defaultValue: null,
      },
    );
  } catch (error) {
    console.error(error);
  }
}
// hsn_code
const up = async function (query, type) {
  addtaxonchargeChanges(query, type);
  addStorelevelchanges(query, type);
  addKitchendeptokotitem(query, type);
  addAlternativenametostore(query, type);
  addTerminalappuser(query, type);
  addnewSettings(query);
  addKitchendeptoorderchild(query, type);
  addSectionwisediscountchanges(query, type);
  //  orderPaymentcompositekey(query, type);
};
const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
