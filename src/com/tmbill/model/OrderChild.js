/* eslint-disable camelcase */
const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const OrderChild = sequelize.define(
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
        defaultValue: 0,
      },
      image_url: {
        type: type.STRING,
        allowNull: true,
      },
      price: {
        type: type.DECIMAL(10, 2),
      },
      quantity: {
        type: type.DECIMAL(10, 2),
        defaultValue: 1,
      },
      title: {
        type: type.STRING,
        allowNull: true,
      },
      alternative_title: {
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
        defaultValue: '',
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
      modified_discount: {
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
      short_code: {
        type: type.STRING,
        allowNull: true,
        defaultValue: null,
      },
      category_name: {
        type: type.STRING,
        allowNull: true,
        defaultValue: null,
      },
      is_open_item: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      has_options: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      discount_name: {
        type: type.STRING,
        allowNull: true,
        defaultValue: null,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      alternative_category_name: {
        type: type.STRING,
        allowNull: true,
      },
      unique_id: {
        type: type.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER_CHILD,
      // hierarchy: true
    },
    {
      instanceMethods: {},
    },
  );

  OrderChild.getSolditems = async function (
    fromDate,
    toDate,
    store_id,
    user_id,
  ) {
    let solditemsList = [];
    let query;
    if (user_id) {
      query =
        'SELECT mpos_order_child.*,SUM(mpos_order_child.quantity) as qty,  ' +
        ' SUM(mpos_order_child.quantity * mpos_order_child.price) as total,' +
        ' FROM mpos_order_child' +
        ' LEFT JOIN' +
        ' mpos_order' +
        ' ON mpos_order_child.orderMasterId=mpos_order.order_id' +
        ' WHERE' +
        ' mpos_order.my_order_date BETWEEN' +
        ' :fromDate AND  :toDate ' +
        ' AND store_id=:store_id' +
        ' AND order_state in (\'fulfilled\') ' +
        ` ${user_id ? `${' AND mpos_order.user_id=:user_id '}` : ''} ` +
        ' GROUP BY title ';
      try {
        solditemsList = await sequelize.query(query, {
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

        solditemsList = [];
      }
    } else {
      query =
        'SELECT mpos_order_child.*,SUM(mpos_order_child.quantity) as qty,  ' +
        ' SUM(mpos_order_child.quantity * mpos_order_child.price) as total,' +
        ' FROM mpos_order_child' +
        ' LEFT JOIN' +
        ' mpos_order' +
        ' ON mpos_order_child.orderMasterId=mpos_order.order_id' +
        ' WHERE' +
        ' mpos_order.my_order_date BETWEEN' +
        ' :fromDate AND  :toDate ' +
        ' AND store_id=:store_id' +
        ' AND order_state in (\'fulfilled\') ' +
        ' GROUP BY title ';
      try {
        solditemsList = await sequelize.query(query, {
          replacements: {
            fromDate: fromDate,
            toDate: toDate,
            store_id: store_id,
          },
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        console.log(error);

        solditemsList = [];
      }
    }
    return solditemsList;
  };

  OrderChild.gettopSolditems = async function ({
    fromDate,
    toDate,
    store_id,
    user_id,
    limit,
    filterbyAmount,
    groupByBaseItem,
  }) {
    let solditemsList = [];
    let grouByStatement = ' GROUP BY title,finalPrice  ';
    if (groupByBaseItem) {
      grouByStatement = ' GROUP BY mpos_order_child.item_id  ';
      // grouByStatement += ' ,item_id  ';
    }
    let query =
      `SELECT mpos_order_child.*,  SUM(mpos_order_child.quantity) as qty,  ` +
      ` ${groupByBaseItem ? 'AVG(CASE mpos_order_child.total = 0 WHEN TRUE THEN 0   ELSE mpos_order_child.price END)' : '(CASE mpos_order_child.total = 0 WHEN TRUE THEN 0   ELSE mpos_order_child.price END)'} as finalPrice, ` +
      ` (SUM(mpos_order_child.quantity)*AVG(price)) as finalamount, ` +
      ` (CASE mpos_order_child.tax_method=1 WHEN TRUE THEN SUM(mpos_order_child.total_with_tax - (mpos_order_child.tax_value * mpos_order_child.quantity)) ELSE (SUM(mpos_order_child.quantity) * mpos_order_child.price) END) as total_withouttax, ` +
      ` SUM(mpos_order_child.total_with_tax) as total_with_tax ` +
      ' FROM mpos_order_child' +
      ' LEFT JOIN' +
      ' mpos_order' +
      ' ON mpos_order_child.orderMasterId=mpos_order.order_id' +
      ' WHERE' +
      ' mpos_order.created_time BETWEEN' +
      ' :fromDate AND  :toDate ' +
      ' AND store_id=:store_id' +
      ' AND order_state in (\'fulfilled\') ' +
      ` ${user_id ? `${' AND mpos_order.user_id=:user_id '}` : ''} ` +
      `${grouByStatement}` +
      ' ORDER BY qty DESC limit :limit  ';

    if (filterbyAmount === 'true') {
      query =
        'SELECT mpos_order_child.*, ' +
        ' SUM(mpos_order_child.quantity) as qty, ' +
        ' CASE WHEN mpos_order_child.tax_method = 1 ' +
        '      THEN SUM(mpos_order_child.total_with_tax - (mpos_order_child.tax_value * mpos_order_child.quantity)) ' +
        '      ELSE (SUM(mpos_order_child.quantity) * mpos_order_child.price) ' +
        ' END as total_withouttax, ' +
        ` CASE WHEN mpos_order_child.total = 0 THEN 0 ELSE mpos_order_child.price END as finalPrice, ` +
        ` (SUM(mpos_order_child.quantity) * price) as finalamount ` +
        ' FROM mpos_order_child ' +
        ' LEFT JOIN mpos_order ' +
        ' ON mpos_order_child.orderMasterId = mpos_order.order_id ' +
        ' WHERE ' +
        ' mpos_order.created_time BETWEEN :fromDate AND :toDate ' +
        ' AND store_id = :store_id ' +
        ' AND order_state IN (\'fulfilled\') ' +
        (user_id ? ' AND mpos_order.user_id = :user_id ' : '') +
        `${grouByStatement} ` +
        ' ORDER BY finalamount DESC ' +
        ' LIMIT :limit';
    }

    if (limit) {
      try {
        limit = Number(limit);
        if (isNaN(limit)) limit = 5;
      } catch (error) {
        limit = 5;
      }
    }
    try {
      solditemsList = await sequelize.query(query, {
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          store_id: store_id,
          user_id: user_id,
          limit: limit,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
      solditemsList = [];
    }
    return solditemsList;
  };

  OrderChild.getCategorywisereport = async function (
    fromDate,
    toDate,
    store_id,
    user_id = '',
  ) {
    let dataList = [];
    // let query =
    //   'SELECT ' +
    //   // + ' mpos_order_child.title,'
    //   // + ' count(mpos_order_child.title) as count,'
    //   ` printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order_child.quantity)) as count,` +
    //   ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.total_with_tax - mpos_order_child.discount ))  as priceTotal,` +
    //   ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity)* mpos_order_child.price)  as newtotal,` +
    //   // + ' sum(mpos_order_child.price * mpos_order_child.quantity)  as total,'
    //   // + ' sum(total_with_tax)  as total,'
    //   ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity * mpos_order_child.price)) as total,` +
    //   ' mpos_item.category_ref_ids,' +
    //   ' mpos_categories.category_name, mpos_categories.alternative_title ' +
    //   ' FROM mpos_order_child' +
    //   ' INNER JOIN' +
    //   ' mpos_order ' +
    //   ' ON ' +
    //   ' mpos_order_child.orderMasterId=mpos_order.order_id' +
    //   ' INNER JOIN' +
    //   ' mpos_item' +
    //   ' ON' +
    //   ' mpos_order_child.item_id=mpos_item.item_refid AND ' +
    //   ' mpos_item.store_id=:store_id' +
    //   ' INNER JOIN' +
    //   ' mpos_categories ' +
    //   ' ON' +
    //   ' (mpos_item.category_ref_ids=mpos_categories.category_refid AND mpos_item.store_id=mpos_categories.store_id)' +
    //   ' WHERE' +
    //   ' mpos_order.created_time BETWEEN' +
    //   ' :fromDate AND  :toDate ' +
    //   ' AND mpos_order.store_id=:store_id' +
    //   ` ${user_id ? `${' AND mpos_order.user_id=:user_id '}` : ''} ` +
    //   ' AND (mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free") ' +
    //   // ' AND mpos_order.order_state != "pending" ' +
    //   // +' AND mpos_order.createdBy=:user_id ' +
    //   ' GROUP BY mpos_item.category_ref_ids,mpos_categories.category_name';

    const startDateOnly = String(fromDate).slice(0, 10);
    const endDateOnly = String(toDate).slice(0, 10);

    let query = `SELECT
  mi.category_ref_ids AS category_ref_ids,
  mc.category_name,
  mc.alternative_title,

  SUM(CAST(COALESCE(moc.quantity, 0) AS numeric)) AS count,
  SUM(CAST(COALESCE(moc.total_with_tax, 0) - COALESCE(moc.discount, 0) AS numeric)) AS priceTotal,
  SUM(CAST(COALESCE(moc.quantity, 0) * COALESCE(moc.price, 0) AS numeric)) AS total,
  SUM(CAST(COALESCE(moc.quantity, 0) AS numeric)) * AVG(CAST(COALESCE(moc.price, 0) AS numeric)) AS newtotal

FROM
(
  SELECT order_id
  FROM mpos_order
  WHERE (my_order_date BETWEEN :startDateOnly AND :endDateOnly OR my_order_date IS NULL)
    AND order_state IN ('fulfilled', 'free', 'completed')
) AS fo   -- filtered_orders

INNER JOIN mpos_order_child AS moc
  ON CAST(moc."orderMasterId" AS text) = CAST(fo.order_id AS text)

LEFT JOIN mpos_item AS mi
  ON CAST(mi.item_refid AS text) = CAST(moc.item_id AS text)

LEFT JOIN mpos_categories AS mc
  ON CAST(mc.category_refid AS text) = CAST(mi.category_ref_ids AS text)

GROUP BY
  mi.category_ref_ids,
  mc.category_name,
  mc.alternative_title

ORDER BY total DESC;
`;
    try {
      dataList = await sequelize.query(query, {
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          startDateOnly: startDateOnly,
          endDateOnly: endDateOnly,
          store_id: String(store_id),
          user_id: user_id,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
      dataList = [];
    }
    return dataList;
  };

  OrderChild.getCategorywisereportForCloseDay = async function (
    fromDate,
    toDate,
    store_id,
    user_id,
  ) {
    let dataList = [];
    if (user_id) {
      const query =
        'SELECT ' +
        // + ' mpos_order_child.title,'
        // + ' count(mpos_order_child.title) as count,'
        ` printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order_child.quantity)) as count,` +
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(total_with_tax - mpos_order_child.discount ))  as priceTotal,` +
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity)*price)  as newtotal,` +
        // + ' sum(mpos_order_child.price * mpos_order_child.quantity)  as total,'
        // + ' sum(total_with_tax)  as total,'
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity * price)) as total,` +
        ' mpos_item.category_ref_ids,' +
        ' mpos_categories.category_name, mpos_categories.alternative_title ' +
        ' FROM mpos_order_child' +
        ' INNER JOIN' +
        ' mpos_order ' +
        ' ON ' +
        ' mpos_order_child.orderMasterId=mpos_order.order_id' +
        ' INNER JOIN' +
        ' mpos_item' +
        ' ON' +
        ' mpos_order_child.item_id=mpos_item.item_refid AND' +
        ' mpos_item.store_id=:store_id' +
        ' INNER JOIN' +
        ' mpos_categories ' +
        ' ON' +
        ' (mpos_item.category_ref_ids=mpos_categories.category_refid AND mpos_item.store_id=mpos_categories.store_id)' +
        ' WHERE' +
        ' mpos_order.actual_created_time BETWEEN' +
        ' :fromDate AND  :toDate ' +
        ' AND mpos_order.store_id=:store_id' +
        ' AND mpos_order.user_id=:user_id ' +
        ' AND (mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free") ' +
        ' GROUP BY mpos_item.category_ref_ids,mpos_categories.category_name';
      try {
        dataList = await sequelize.query(query, {
          replacements: {
            fromDate,
            toDate,
            store_id,
            user_id,
          },
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        console.log(error);
        dataList = [];
      }
    } else {
      const query =
        'SELECT ' +
        // + ' mpos_order_child.title,'
        // + ' count(mpos_order_child.title) as count,'
        ` printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order_child.quantity)) as count,` +
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(total_with_tax - mpos_order_child.discount ))  as priceTotal,` +
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity)*price)  as newtotal,` +
        // + ' sum(mpos_order_child.price * mpos_order_child.quantity)  as total,'
        // + ' sum(total_with_tax)  as total,'
        ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity * price)) as total,` +
        ' mpos_item.category_ref_ids,' +
        ' mpos_categories.category_name,  mpos_categories.alternative_title  ' +
        ' FROM mpos_order_child' +
        ' INNER JOIN' +
        ' mpos_order ' +
        ' ON ' +
        ' mpos_order_child.orderMasterId=mpos_order.order_id' +
        ' INNER JOIN' +
        ' mpos_item' +
        ' ON' +
        ' mpos_order_child.item_id=mpos_item.item_refid AND' +
        ' mpos_item.store_id=:store_id' +
        ' INNER JOIN' +
        ' mpos_categories ' +
        ' ON' +
        ' (mpos_item.category_ref_ids=mpos_categories.category_refid AND mpos_item.store_id=mpos_categories.store_id)' +
        ' WHERE' +
        ' mpos_order.actual_created_time BETWEEN' +
        ' :fromDate AND  :toDate ' +
        ' AND mpos_order.store_id=:store_id' +
        // + ' AND mpos_order.user_id=:user_id '
        ' AND (mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free") ' +
        ' GROUP BY mpos_item.category_ref_ids,mpos_categories.category_name';
      try {
        dataList = await sequelize.query(query, {
          replacements: {
            fromDate,
            toDate,
            store_id,
            // user_id: user_id
          },
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        console.log(error);
        dataList = [];
      }
    }
    return dataList;
  };

  OrderChild.getCategorywiseitemsreport = async function (
    fromDate,
    toDate,
    store_id,
    user_id,
    category_refid,
    groupByBaseItem,
  ) {
    let dataList = [];
    let groupByStatement =
      ' GROUP BY mpos_order_child.item_id, mpos_order_child.title;';
    if (groupByBaseItem) {
      groupByStatement = ' GROUP BY mpos_order_child.item_id;';
    }
    let query =
      'SELECT ' +
      ' mpos_order_child.title, mpos_order_child.alternative_title,mpos_order_child.extra_details, ' +
      ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity)) as count,` +
      // sum(mpos_order_child.quantity)
      ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity * price)) as total,` +
      ' (CASE mpos_order_child.tax_method=1 WHEN TRUE THEN SUM(((mpos_order_child.total_with_tax *  mpos_order_child.quantity) - (mpos_order_child.tax_value * mpos_order_child.quantity))) ELSE (SUM(mpos_order_child.quantity) * mpos_order_child.price) END) as total_withouttax, ' +
      ` printf("%.${global.ROUNDOFF_UPTO}f",SUM(total_with_tax)) as total_with_tax, ` +
      ' mpos_item.category_ref_ids ' +
      ' FROM mpos_order_child' +
      ' INNER JOIN' +
      ' mpos_order ' +
      ' ON' +
      ' mpos_order_child.orderMasterId=mpos_order.order_id' +
      ' INNER JOIN' +
      ' mpos_item' +
      ' ON' +
      ' mpos_order_child.item_id=mpos_item.item_refid AND ' +
      ' mpos_item.store_id=:store_id' +
      ' WHERE' +
      ' mpos_order.created_time BETWEEN' +
      ' :fromDate AND  :toDate ' +
      ' AND mpos_item.category_ref_ids=:category_refid' +
      ' AND mpos_order.store_id=:store_id' +
      ' AND (mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free") ' +
      // + ' AND mpos_order.user_id=:user_id '
      ` ${user_id ? `${' AND mpos_order.user_id=:user_id '}` : ''} ` +
      groupByStatement;
    try {
      dataList = await sequelize.query(query, {
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          store_id: store_id,
          category_refid: category_refid,
          user_id: user_id,
        },
        type: sequelize.QueryTypes.SELECT,
      });
      // console.log('data list::', dataList);
    } catch (error) {
      console.log(error);
      dataList = [];
    }
    return dataList;
  };

  OrderChild.getCategorywiseitemsreportForCloseDay = async function (
    fromDate,
    toDate,
    store_id,
    user_id,
    category_refid,
  ) {
    let dataList = [];
    let query =
      'SELECT ' +
      ' mpos_order_child.title, mpos_order_child.alternative_title,' +
      ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity)) as count,` +
      // sum(mpos_order_child.quantity)
      ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity * price)) as total,` +
      ' (CASE mpos_order_child.tax_method=1 WHEN TRUE THEN ((mpos_order_child.total_with_tax * mpos_order_child.quantity) - (mpos_order_child.tax_value * mpos_order_child.quantity)) ELSE (SUM(mpos_order_child.quantity) * mpos_order_child.price) END) as total_withouttax, ' +
      ` printf("%.${global.ROUNDOFF_UPTO}f",SUM(total_with_tax)) as total_with_tax, ` +
      ' mpos_item.category_ref_ids ' +
      ' FROM mpos_order_child' +
      ' INNER JOIN' +
      ' mpos_order ' +
      ' ON' +
      ' mpos_order_child.orderMasterId=mpos_order.order_id' +
      ' INNER JOIN' +
      ' mpos_item' +
      ' ON' +
      ' mpos_order_child.item_id=mpos_item.item_refid AND' +
      ' mpos_item.store_id=:store_id' +
      ' WHERE' +
      ' mpos_order.actual_created_time BETWEEN' +
      ' :fromDate AND  :toDate ' +
      ' AND mpos_item.category_ref_ids=:category_refid' +
      ' AND mpos_order.store_id=:store_id' +
      ' AND mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free" ' +
      // + ' AND mpos_order.user_id=:user_id '
      ' GROUP BY mpos_order_child.item_id;';
    try {
      dataList = await sequelize.query(query, {
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          store_id: store_id,
          category_refid: category_refid,
          // user_id: user_id
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
      dataList = [];
    }
    return dataList;
  };

  OrderChild.getkdwisereport = async function (
    fromDate,
    toDate,
    store_id,
    user_id,
  ) {
    let dataList = [];
    let query =
      'SELECT' +
      // + ' COUNT(mpos_order_child.title) as count,'
      ` printf("%.${global.ROUNDOFF_UPTO}f", SUM(mpos_order_child.quantity)) as count,` +
      ' SUM(total_with_tax - mpos_order_child.discount) as oldtotal,' +
      // + ' sum(mpos_order_child.price * mpos_order_child.quantity)  as total,'
      // ` printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order_child.price * mpos_order_child.quantity))  as total,` +
      ` printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order_child.total))  as total,` +
      // + ' sum(total_with_tax) as total,'
      ' mpos_kitchen_department.kitchen_dept_name' +
      ' FROM mpos_order_child' +
      ' INNER JOIN mpos_order ON mpos_order_child.orderMasterId = mpos_order.order_id' +
      //   ' INNER JOIN mpos_item ON mpos_order_child.item_id = mpos_item.item_refid' +
      ' INNER JOIN mpos_kitchen_department ON mpos_order_child.kitchen_dept = mpos_kitchen_department.id' +
      ' WHERE' +
      // ' mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free" ' +
      ' mpos_order.created_time BETWEEN' +
      ' :fromDate AND  :toDate ' +
      ' AND mpos_order.store_id =:store_id ' +
      // ' AND (mpos_order.order_state = "fulfilled" OR mpos_order.order_state = "free") ' +
      ' AND mpos_order.order_state = "fulfilled" ' +
      ` ${user_id ? `${' AND mpos_order.user_id=:user_id '}` : ''} ` +
      // + ' AND mpos_order.user_id =:user_id '
      ' GROUP BY' +
      ' mpos_order_child.kitchen_dept ';
    try {
      dataList = await sequelize.query(query, {
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
      dataList = [];
    }
    return dataList;
  };

  return OrderChild;
}

module.exports = {
  getModel,
};
