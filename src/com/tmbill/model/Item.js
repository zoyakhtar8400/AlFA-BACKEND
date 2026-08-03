const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Item = sequelize.define(
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
      alternative_title: {
        type: type.STRING,
      },
      short_code: {
        type: type.STRING,
        allowNull: true,
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
        type: type.INTEGER,
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
      preparation_time: {
        type: type.STRING,
        allowNull: true,
      },
      discounted_price: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discount_type: {
        type: type.INTEGER,
        defaultValue: 2,
      },
      discount_rate: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      modified_discount: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      hsn_code: {
        type: type.STRING,
        allowNull: true,
        defaultValue: null,
      },
      is_open_item: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      discounted_items: {
        type: type.JSON,
        allowNull: true,
      },
      sale_price_1: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_2: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_3: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_4: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_5: {
        type: type.DECIMAL(10, 2),
      },
      has_modifiers: {
        type: type.INTEGER,
        allowNull: true,
      },
      is_combo: {
        type: type.INTEGER,
        allowNull: true,
      },
      excludePlaforms: {
        type: type.STRING,
        allowNull: true,
      },
      master_image: {
        type: type.STRING,
        allowNull: true,
      },
      open_price: {
        type: type.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ITEM,
    },
  );
  Item.getDeaditems = async function (store_id, user_id) {
    let deadItemlist = [];
    let query =
      'SELECT item_id,title,alternative_title,sale_price as price, ' +
      ' 1 as qty,sale_price as finalamount ' +
      'FROM mpos_item ' +
      'WHERE item_refid NOT IN(' +
      'SELECT  DISTINCT(item_id) ' +
      'FROM   mpos_order_child ' +
      'LEFT JOIN ' +
      'mpos_order ' +
      'ON ' +
      'mpos_order.id = mpos_order_child.bill_id ' +
      'WHERE ' +
      'mpos_order.store_id=:store_id ) ' +
      // +'AND ' +
      // 'mpos_order.user_id=:user_id) ';
      'AND ' +
      'mpos_item.store_id=:item_store_id ';
    try {
      deadItemlist = await sequelize.query(query, {
        replacements: {
          store_id: store_id,
          // user_id: user_id,
          item_store_id: store_id,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
      deadItemlist = [];
    }
    return deadItemlist;
  };
  return Item;
}

module.exports = {
  getModel,
};
