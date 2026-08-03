/* eslint-disable camelcase */
const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const KotItem = sequelize.define(
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
      },
      item_name: {
        type: type.STRING,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
      item_price: {
        type: type.DECIMAL(10, 2),
      },
      quantity: {
        type: type.DECIMAL(10, 2),
        defaultValue: 1,
      },
      amount: {
        type: type.DECIMAL(10, 2),
      },
      note: {
        type: type.STRING,
        allowNull: true,
      },
      status: {
        //1=placed , 2=deleted , 3=cancelled , 4= edited
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
      orderstatus: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 'Placed',
      },
      previousstatus: {
        type: type.STRING,
        allowNull: true,
      },
      statusChangedby: {
        type: type.STRING,
        allowNull: true,
      },
      comment: {
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
      pricebeforeDiscount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      modified_discount: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      is_complimentary: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      kitchen_dept: {
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
      discount_name: {
        type: type.STRING,
        allowNull: true,
        defaultValue: null,
      },
      category_name: {
        type: type.STRING,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      alternative_category_name: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_KOT_ITEM,
    },
  );

  KotItem.getKotitems = async function (table_id) {
    let query =
      'SELECT' +
      ' kotItems.item_name AS title,' +
      ' SUM(kotItems.quantity) as quantity,' +
      ' kotItems.item_price,' +
      ' SUM(kotItems.amount) AS amount,' +
      ' kotItems.item_id,' +
      ' kotItems.item_tax_per,' +
      ' kotItems.item_tax_value,' +
      ' kotItems.item_tax_method,' +
      ' kotItems.item_is_devidable,' +
      ' kotItems.item_tax_name,' +
      ' kotItems.short_code,' +
      ' kotItems.note' +
      ' FROM mpos_kot_item AS kotItems' +
      ' LEFT JOIN' +
      ' mpos_kot' +
      ' ON' +
      ' kotItems.kot_id = mpos_kot.kot_id' +
      ' WHERE' +
      ' mpos_kot.table_id = :table_id' +
      ' AND kotItems.status in (1, 4)' +
      ' AND mpos_kot.is_active=1' +
      ' GROUP BY ' +
      ' kotItems.item_name ' +
      ' ORDER BY' +
      ' kotItems.id';
    let items = [];
    try {
      items = await sequelize.query(query, {
        replacements: { table_id: table_id },
        model: this,
        mapToModel: true,
      });
    } catch (error) {
      console.log(error);
    }

    return items;
  };
  KotItem.getComplimentaryitems = async function (
    fromDate,
    toDate,
    store_id,
    user_id,
    groupByBaseItem,
  ) {
    let query =
      'SELECT mpos_kot.store_id as store_id, ' +
      ' mpos_kot.user_id as user_id, ' +
      ' mpos_kot.in_time as created_time,' +
      ' mpos_kot_item.quantity as qty,' +
      ' mpos_kot_item.item_price as price,SUM(mpos_kot_item.pricebeforeDiscount) as total,  ' +
      ' mpos_kot_item.item_name as title, ' +
      ' mpos_kot_item.alternative_title, ' +
      ' mpos_kot_item.extra_details, ' +
      ' mpos_kot_item.createdBy as createdBy,' +
      ' mpos_kot_item.pricebeforeDiscount as price,' +
      ' mpos_kot_item.reason as reason,' +
      ' mpos_kot.billing_type as billing_type,' +
      ' mpos_kot.table_name as table_name,' +
      ' (mpos_kot_item.quantity*mpos_kot_item.item_price) as finalamount  ' +
      ' FROM mpos_kot_item JOIN mpos_kot  ' +
      ' ON mpos_kot.kot_id=mpos_kot_item.kot_id' +
      ' WHERE mpos_kot_item.amount=0 AND ' +
      ' (mpos_kot_item.status = 1 OR mpos_kot_item.status = 5) AND ' +
      ' mpos_kot.in_time BETWEEN' +
      ' :fromDate AND  :toDate ' +
      ` ${user_id ? `${' AND mpos_kot_item.createdBy=:user_id '}` : ''} ` +
      ` AND mpos_kot.store_id=:store_id
    ${groupByBaseItem ? ' GROUP BY item_id ' : ''} `;
    // + ' AND mpos_kot.user_id=:user_id ';
    let complementaryItems = [];
    try {
      complementaryItems = await sequelize.query(query, {
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          store_id: store_id,
          user_id: user_id,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);

      complementaryItems = [];
    }
    return complementaryItems;
  };

  KotItem.getItemsbystatus = async function (
    status,
    fromDate,
    toDate,
    store_id,
    user_id,
    groupByBaseItem,
  ) {
    if (user_id) {
      let query =
        'SELECT mpos_kot.store_id as store_id, ' +
        ' mpos_kot.user_id as user_id, ' +
        ' mpos_kot_item.modifiedDate as created_time,' +
        // ' mpos_kot_item.quantity as qty,' +
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_kot_item.quantity)) as qty,` +
        ` printf("%.${global.ROUNDOFF_UPTO}f", AVG(mpos_kot_item.item_price)) as price, printf("%.${global.ROUNDOFF_UPTO}f",mpos_kot_item.amount) as total,  ` +
        ' mpos_kot_item.item_name as title, ' +
        ' mpos_kot_item.alternative_title, ' +
        ' mpos_kot_item.extra_details, ' +
        ' mpos_kot_item.reason as reason, ' +
        ' mpos_kot_item.createdBy as createdBy, ' +
        ' mpos_kot.billing_type as billing_type, ' +
        ' mpos_kot.table_name as table_name' +
        ' FROM mpos_kot_item JOIN mpos_kot  ' +
        ' ON mpos_kot.kot_id=mpos_kot_item.kot_id' +
        ' WHERE mpos_kot_item.status=:status AND ' +
        ' mpos_kot.in_time BETWEEN' +
        ' :fromDate AND  :toDate ' +
        ' AND mpos_kot.store_id=:store_id ' +
        `AND mpos_kot_item.createdBy=:user_id 
        ${groupByBaseItem ? ' GROUP BY item_id, reason, billing_type ' : 'GROUP BY title, billing_type'} `;

      // + ' AND mpos_kot.user_id=:user_id ';
      let complementaryItems = [];
      try {
        complementaryItems = await sequelize.query(query, {
          replacements: { fromDate, toDate, store_id, status, user_id },
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        console.log(error);

        complementaryItems = [];
      }
      return complementaryItems;
    } else {
      let query =
        'SELECT mpos_kot.store_id as store_id, ' +
        ' mpos_kot.user_id as user_id, ' +
        ' mpos_kot_item.modifiedDate as created_time,' +
        // ' mpos_kot_item.quantity as qty,' +
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_kot_item.quantity)) as qty,` +
        ` printf("%.${global.ROUNDOFF_UPTO}f", AVG(mpos_kot_item.item_price)) as price, printf("%.${global.ROUNDOFF_UPTO}f",mpos_kot_item.amount) as total,  ` +
        ' mpos_kot_item.item_name as title, ' +
        ' mpos_kot_item.alternative_title, ' +
        ' mpos_kot_item.extra_details, ' +
        ' mpos_kot_item.reason as reason, ' +
        ' mpos_kot_item.createdBy as createdBy, ' +
        ' mpos_kot.billing_type as billing_type, ' +
        ' mpos_kot.table_name as table_name' +
        ' FROM mpos_kot_item JOIN mpos_kot  ' +
        ' ON mpos_kot.kot_id=mpos_kot_item.kot_id' +
        ' WHERE mpos_kot_item.status=:status AND ' +
        ' mpos_kot.in_time BETWEEN' +
        ' :fromDate AND  :toDate ' +
        ` AND mpos_kot.store_id=:store_id 
        ${groupByBaseItem ? ' GROUP BY item_id, reason, billing_type ' : 'GROUP BY title, billing_type'} `;

      // + ' AND mpos_kot.user_id=:user_id ';
      let complementaryItems = [];
      try {
        complementaryItems = await sequelize.query(query, {
          replacements: { fromDate, toDate, store_id, status },
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        console.log(error);

        complementaryItems = [];
      }
      return complementaryItems;
    }
  };

  KotItem.getrunningKotitems = async function (params) {
    let items = [];
    try {
      // + ' AND mpos_kot_item.orderstatus = 1 AND'
      let query =
        'SELECT mpos_kot_item.id AS kot_item_id,' +
        ' mpos_kot_item.item_name AS title,' +
        ' mpos_kot_item.alternative_title,' +
        ' mpos_kot_item.amount,' +
        ' mpos_kot_item.item_price,' +
        ' mpos_kot_item.quantity,' +
        ' mpos_kot_item.item_id,' +
        ' mpos_kot_item.item_tax_per,' +
        ' mpos_kot_item.item_tax_value,' +
        ' mpos_kot_item.item_tax_method,' +
        ' mpos_kot_item.item_is_devidable,' +
        ' mpos_kot_item.orderstatus,' +
        ' mpos_kot_item.previousstatus,' +
        ' mpos_kot_item.comment,' +
        ' mpos_kot_item.kot_id,' +
        ' mpos_kot.table_id AS table_id,' +
        ' mpos_kot.kot_date AS kot_date,' +
        ' mpos_kot.in_time AS in_time,' +
        ' mpos_table.table_name AS table_name,' +
        ' mpos_table.order_type_flag AS order_type_flag' +
        ' FROM mpos_kot_item AS mpos_kot_item INNER JOIN' +
        ' mpos_kot AS mpos_kot ON' +
        ' mpos_kot_item.kot_id = mpos_kot.kot_id' +
        ' AND mpos_kot.is_active = 1 AND' +
        ' :filterBystatus ' +
        ' mpos_kot.store_id =:store_id' +
        ' INNER JOIN mpos_table' +
        ' ON mpos_kot.table_id = mpos_table.id' +
        ' GROUP BY kot_item_id  ' +
        ' ORDER BY in_time :getRecentfirst ;';

      if (params.orderstatus) {
        query = query.replace(
          ':filterBystatus',
          ` mpos_kot_item.orderstatus = "${params.orderstatus}" AND `,
        );
      } else {
        query = query.replace(':filterBystatus', ' ');
      }
      query = query.replace(
        ':getRecentfirst',
        params.getRecentfirst ? 'DESC' : '',
      );

      try {
        items = await sequelize.query(query, {
          replacements: { store_id: params.store_id },
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        console.log(error);

        items = [];
      }
    } catch (error) {
      console.log(error);
    }
    return items;
  };
  return KotItem;
}

module.exports = {
  getModel,
};
