const util = require('../util/DBUtil');

function addPriceColumnsOnItems(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'sale_price_1',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'sale_price_2',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'sale_price_3',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'sale_price_4',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'sale_price_5',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
}

function addmultipricingTable(query, type) {
  query.createTable(
    util.DBDetails.Tables.MPOS_MULTIPRICING_SETTINGS,
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
      settings: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_MULTIPRICING_SETTINGS,
    },
  );
}

function addPlatformMappingTable(query, type) {
  query.createTable(
    util.DBDetails.Tables.MPOS_PLATFORM_MAPPING,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      platform_store_id: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      platform: {
        type: type.STRING,
        allowNull: true,
      },
      store_name: {
        type: type.STRING,
        allowNull: true,
      },
      platform_menu: {
        type: type.JSON,
        allowNull: true,
      },
      is_published: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_PLATFORM_MAPPING,
    },
  );
}

function addPriceColumnsOnOptions(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_OPTIONS,
    'sale_price_1',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_OPTIONS,
    'sale_price_2',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_OPTIONS,
    'sale_price_3',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_OPTIONS,
    'sale_price_4',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_OPTIONS,
    'sale_price_5',
    type.DECIMAL(10, 2),
    {
      defaultValue: 0,
    },
  );
}

async function addUserlevelCaptainAccesslevel(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_USER,
    'captain_access_levels',
    type.JSON,
    {
      defaultValue: null,
    },
  );
}

async function addShortcut(query, type) {
  let shortcut5 = [
    {
      id: 40,
      name: 'New Order type',
      value: 'ctrl+n',
      default: 'ctrl+n',
      window: 'order',
    },
  ];
  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcut5);
  } catch (err) {}
}

async function createOrderChildIndex(queryInterface) {
  try {
    queryInterface.removeIndex(
      util.DBDetails.Tables.MPOS_ORDER_CHILD,
      // ['title', 'short_code', 'price', 'orderMasterId'],
      // {
      //   name: 'order_child_unique_index',
      //   unique: true,
      // },
      'order_child_unique_index',
    );

    queryInterface.addIndex(
      util.DBDetails.Tables.MPOS_ORDER_CHILD,
      ['title', 'short_code', 'price', 'orderMasterId', 'quantity'],
      {
        name: 'order_child_unique_index',
        unique: true,
      },
    );
  } catch (error) {
    console.log('error while migrating', error);
  }

  // queryInterface.addConstraint(util.DBDetails.Tables.MPOS_ORDER_CHILD, {
  //     fields: ['orderMasterId', 'price', 'title', 'short_code'],
  //     type: 'unique',
  //     name: 'custom_unique_constraint_name'
  //   });
  // queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER_CHILD, ['price'], {
  //     name: 'item_price_index'
  // });
  // queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER_CHILD, ['title'], {
  //     name: 'item_title_index'
  // });
  // queryInterface.addIndex(util.DBDetails.Tables.MPOS_ORDER_CHILD, ['short_code'], {
  //     name: 'item_short_code_index'
  // });
}
const up = function (query, type) {
  addPriceColumnsOnItems(query, type);
  addmultipricingTable(query, type);
  addPriceColumnsOnOptions(query, type);
  addUserlevelCaptainAccesslevel(query, type);
  addPlatformMappingTable(query, type);
  // addShortcut(query, type);
  createOrderChildIndex(query);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
