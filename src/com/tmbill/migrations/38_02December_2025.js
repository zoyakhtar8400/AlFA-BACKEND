const util = require('../util/DBUtil');

async function addOrderIndex(query) {
  try {
    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['id'], {
      name: 'id_index',
    });

    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['order_id'], {
      name: 'order_id_index',
    });

    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['created_time'], {
      name: 'created_time_index',
    });

    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['bill_number'], {
      name: 'bill_number_index',
    });

    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['actual_created_time'], {
      name: 'actual_created_time_index',
    });

    query.addIndex(util.DBDetails.Tables.MPOS_ORDER, ['phone'], {
      name: 'phone_index',
    });
  } catch (error) {
    console.log('add order index error', error);
  }
}

async function addValuesOnStoreLevel(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'day_start_time', {
    type: type.STRING,
    allowNull: true,
    defaultValue: null,
  });

  query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'day_close_time', {
    type: type.STRING,
    allowNull: true,
    defaultValue: null,
  });

  query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'pos_settings', {
    type: type.JSON,
    allowNull: true,
    defaultValue: null,
  });
}

// async function addItemDiscount(query, type) {
//   try {
//     await query.addColumn(
//       util.DBDetails.Tables.MPOS_ORDER,
//       'item_level_total_discount',
//       {
//         type: type.DECIMAL(10, 2),
//         allowNull: false,
//         defaultValue: 0.0,
//       },
//     );
//   } catch (error) {
//     console.error('error while adding item_level_total_discount', error);
//     throw error; // important for migrations
//   }
// }

function addIndexing(query, type) {
  query.addIndex('mpos_order', {
    name: 'idx_order_fast_filter',
    fields: ['store_id', 'created_time', 'order_state', 'user_id', 'order_id'],
  });

  // mpos_order_child (join performance)
  query.addIndex('mpos_order_child', {
    name: 'idx_child_fast_join',
    fields: ['orderMasterId', 'item_id'],
  });

  // mpos_item (join + grouping)
  query.addIndex('mpos_item', {
    name: 'idx_item_fast_join',
    fields: ['item_refid', 'store_id', 'category_ref_ids'],
  });

  // mpos_categories (final join)
  query.addIndex('mpos_categories', {
    name: 'idx_category_fast_join',
    fields: ['category_refid', 'store_id'],
  });
}

const up = (query, type) => {
  addOrderIndex(query);
  addValuesOnStoreLevel(query, type);
  // addItemDiscount(query, type);
};
const down = () => {};

module.exports = {
  up,
  down,
};
