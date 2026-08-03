const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Kot = sequelize.define(
    util.DBDetails.Tables.MPOS_KOT,
    {
      kot_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      in_time: {
        type: type.STRING,
        allowNull: true,
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
        type: type.DATE,
        allowNull: true,
        defaultValue: type.NOW,
      },
      createdBy: {
        type: type.STRING,
        allowNull: true,
      },
      createdDate: {
        type: type.DATE,
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
        //1=dine in 2=TA 3=HD
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
      couponDisount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      couponDisounttype: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      coupon: {
        type: type.STRING,
        allowNull: true,
      },
      waiter: {
        type: type.STRING,
        allowNull: true,
      },
      waiter_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      discounted_product_groups: {
        type: type.STRING,
        allowNull: true,
      },
      is_pre_order: {
        // 1 Is pre-order
        type: type.INTEGER,
        defaultValue: 0,
      },
      custom_bill_number: {
        type: type.STRING,
        allowNull: true,
      },
      kot_number: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      field1: {
        // tell's if default charges are removed or not 1=removed 0= not removed
        type: type.STRING(100),
        allowNull: true,
      },
      field2: {
        // used for order level note
        type: type.STRING(100),
        allowNull: true,
      },
      field3: {
        type: type.STRING(100),
        allowNull: true,
      },
      field4: {
        type: type.STRING(100),
        allowNull: true,
      },
      table_name: {
        type: type.STRING,
        allowNull: true,
      },
      kot_uniqueid: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 0,
      },
      discount_title: {
        type: type.STRING(80),
        allowNull: true,
      },
      remote_order_id: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 0,
      },
      is_modified: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      actual_in_time: {
        type: type.TIME,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      revenue_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_KOT,
    },
  );

  Kot.getBusytables = async function () {
    let query =
      'SELECT table_id,SUM(amount) AS amount,order_id' +
      ' ,mpos_kot.actual_in_time,GROUP_CONCAT(kot_number) as kot_nos FROM mpos_kot' +
      ' WHERE is_active=1 ' +
      ' GROUP BY table_id';
    let busyTables = [];
    try {
      busyTables = await sequelize.query(query, {
        raw: true,
        model: this,
        mapToModel: true,
      });
    } catch (error) {
      busyTables = [];
    }

    return busyTables;
  };
  Kot.getBusytableswithdetails = async function (params) {
    // let groupBykot = true;
    let query =
      'SELECT table_id,mpos_table.table_name,kot_id,kot_number,order_type_flag,  ' +
      ' actual_in_time,status,createdBy,mpos_kot.user_id, mpos_kot.extra_details, ' +
      ' note,amount,persons,customer_name,mpos_kot.is_pre_order FROM mpos_kot JOIN' +
      ' mpos_table ' +
      ' ON mpos_kot.table_id=mpos_table.id ' +
      ' WHERE is_active=1 ' +
      ' AND mpos_kot.store_id=:store_id ' +
      ' AND mpos_kot.status in (:status) ' +
      ' GROUP BY kot_id ';

    let itemStatus = params.status;
    if (itemStatus) {
      try {
        itemStatus = String(itemStatus).split(',');
      } catch (error) {
        itemStatus = [1, 2, 3, 4, 5, 6, 7];
      }
    } else {
      itemStatus = [1, 2, 3, 4, 5, 6, 7];
    }

    let busyTables = [];
    try {
      busyTables = await sequelize.query(query, {
        model: this,
        mapToModel: true,
        raw: true,
        replacements: {
          store_id: params.store_id,
          status: itemStatus,
        },
      });
    } catch (error) {
      console.log(error);

      busyTables = [];
    }

    return busyTables;
  };
  Kot.getTakeawayBusytables = async function (params) {
    // let query =
    //   `SELECT mpos_order.order_total, mpos_order.delivery_boy_name, mpos_table.table_color, mpos_table.department, mpos_customer.address_line1 as customer_address, mpos_table.order_type_flag, mpos_table.table_action_flag, mpos_table.parent , mpos_kot.table_id,mpos_table.table_name,SUM(mpos_kot.amount) AS amount, mpos_kot.order_id as bill_number, mpos_kot.createdBy as user_id, mpos_kot.is_pre_order, mpos_kot.billing_type as billingType` +
    //   ' ,mpos_kot.actual_in_time as created_time,GROUP_CONCAT(kot_number) as kot_nos, mpos_kot.customer_name, mpos_kot.extra_details, mpos_kot.customer_mobile FROM mpos_kot' +
    //   ' JOIN mpos_table ON mpos_kot.table_id=mpos_table.id' +
    //   ' LEFT JOIN mpos_order on mpos_kot.bill_number=mpos_order.order_id' +
    //   ' LEFT JOIN mpos_customer on mpos_kot.customer_mobile=mpos_customer.phone' +
    //   ' WHERE is_active=1 ' +
    //   ' AND mpos_kot.store_id=:store_id ' +
    //   ' AND mpos_kot.billing_type IN (2, 3) ' +
    //   ' GROUP BY mpos_kot.table_id';

    const query = `
SELECT 
    agg.order_total,
    agg.delivery_boy_name,
    t.table_color,
    t.department,
    c.address_line1 AS customer_address,
    t.order_type_flag,
    t.table_action_flag,
    t.parent,
    agg.table_id,
    t.table_name,
    agg.amount,
    agg.bill_number,
    agg.user_id,
    agg.is_pre_order,
    agg.billingType,
    agg.created_time,
    agg.kot_nos,
    agg.customer_name,
    agg.extra_details,
    agg.customer_mobile
FROM (
    SELECT 
        k.table_id,
        k.order_id AS bill_number,
        k.createdBy AS user_id,
        k.is_pre_order,
        k.billing_type AS billingType,
        k.actual_in_time AS created_time,
        GROUP_CONCAT(k.kot_number) AS kot_nos,
        SUM(k.amount) AS amount,
        k.customer_name,
        k.extra_details,
        k.customer_mobile,
        o.order_total,
        o.delivery_boy_name
    FROM mpos_kot k
    LEFT JOIN mpos_order o 
        ON k.bill_number = o.order_id
    WHERE 
        k.is_active = 1
        AND k.store_id = :store_id
        AND k.billing_type IN (2, 3)
    GROUP BY 
        k.order_id, 
        k.table_id
) AS agg
JOIN mpos_table t 
    ON agg.table_id = t.id
LEFT JOIN (
    SELECT 
        phone, 
        MIN(address_line1) AS address_line1
    FROM mpos_customer
    GROUP BY phone
) c 
    ON agg.customer_mobile = c.phone;
`;

    let busyTables = [];
    try {
      busyTables = await sequelize.query(query, {
        raw: true,
        model: this,
        mapToModel: true,
        replacements: { store_id: params.store_id },
      });
    } catch (error) {
      console.log('get busy table error::', error);
      busyTables = [];
    }
    return busyTables;
  };
  return Kot;
}

module.exports = {
  getModel,
};
