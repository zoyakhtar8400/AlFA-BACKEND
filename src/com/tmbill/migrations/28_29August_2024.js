const util = require('../util/DBUtil');

async function addItemPricesTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_ITEM_PRICES,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        item_id: {
          type: type.INTEGER,
        },
        short_code: {
          type: type.STRING,
          allowNull: true,
        },
        title: {
          type: type.STRING,
        },
        tmpos_id: {
          type: type.STRING,
        },
        store_id: {
          type: type.STRING,
        },
        menu_id: {
          type: type.INTEGER,
        },
        price: {
          type: type.DECIMAL(10, 2),
        },
        ref: {
          type: type.INTEGER,
        },
        type: {
          type: type.INTEGER,
        },
        extra_details: {
          type: type.JSON,
          allowNull: true,
        },
        active: {
          type: type.INTEGER,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ITEM_PRICES,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function updateSyncFlaginWalletTable(query, type) {
  await query.removeColumn(util.DBDetails.Tables.MPOS_WALLET, 'sync_flag');
  query.addColumn(util.DBDetails.Tables.MPOS_WALLET, 'sync_flag', {
    type: type.INTEGER,
    defaultValue: 1,
  });
}

async function addExtraDetailsFieldinTable(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_TABLE, 'extra_details', {
    type: type.JSON,
    allowNull: true,
  });
}

async function changeDefaultFlagInKotTable(query, type) {
  await query.removeColumn(util.DBDetails.Tables.MPOS_KOT, 'billing_type');
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'billing_type', {
    type: type.INTEGER,
    defaultValue: 1,
  });
}

async function addActiveFlagInKitchenDeptTable(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_KITCHEN_DEPARTMENT, 'isactive', {
    type: type.INTEGER,
    defaultValue: 1,
  });
}

const up = (query, type) => {
  addItemPricesTable(query, type);
  updateSyncFlaginWalletTable(query, type);
  addExtraDetailsFieldinTable(query, type);
  changeDefaultFlagInKotTable(query, type);
  addActiveFlagInKitchenDeptTable(query, type);
};
const down = () => {};

module.exports = {
  up,
  down,
};
