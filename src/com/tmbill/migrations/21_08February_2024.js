const util = require('../util/DBUtil');

function addKotIndex(query) {
  try {
    query.addIndex(util.DBDetails.Tables.MPOS_KOT, ['kot_id'], {
      name: 'kot_id_index',
    });
    query.addIndex(util.DBDetails.Tables.MPOS_KOT, ['table_id', 'is_active'], {
      name: 'is_active_index',
    });

    query.addIndex(util.DBDetails.Tables.MPOS_KOT, ['table_id', 'is_active'], {
      name: 'is_active_index',
    });
  } catch (error) {}
}

async function addOrderIndex(query) {
  try {
    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['order_id'], {
      name: 'order_id_index',
    });
  } catch (error) {
    console.log('add order index error', error);
  }
}

async function addKOTChargesIndex(query) {
  try {
    query.addIndex(
      util.DBDetails.Tables.MPOS_KOT_CHARGES,
      ['table_id', 'is_active'],
      {
        name: 'table_active_index',
      },
    );
  } catch (error) {
    console.log('add order index error', error);
  }
}

async function addKOTOptionAddonIndex(query) {
  try {
    query.addIndex(
      util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
      ['kot_items_id'],
      {
        name: 'kot_items_id_index',
      },
    );
  } catch (error) {
    console.log('add order index error', error);
  }
}

async function addKOTItemChargesIndex(query) {
  try {
    query.addIndex(
      util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
      ['itemtitle', 'table_id'],
      {
        name: 'kot_item_charges_index',
      },
    );
  } catch (error) {
    console.log('add order index error', error);
  }
}

async function addKOTItemNoteIndex(query) {
  try {
    query.addIndex(util.DBDetails.Tables.MPOS_ITEMNOTES, ['item_refid'], {
      name: 'item_refid_index',
    });
  } catch (error) {
    console.log('add order index error', error);
  }
}

const up = async function (query, type) {
  addKotIndex(query, type);
  addOrderIndex(query);
  addKOTChargesIndex(query);
  addKOTOptionAddonIndex(query);
  addKOTItemChargesIndex(query);
  addKOTItemNoteIndex(query);
};

const down = async function (query, type) {};

module.exports = {
  up,
  down,
};
