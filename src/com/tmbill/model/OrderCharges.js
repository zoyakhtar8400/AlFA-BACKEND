const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const OrderCharges = sequelize.define(
    util.DBDetails.Tables.MPOS_ORDER_CHARGES,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
      },
      title: {
        type: type.STRING,
      },
      value: {
        type: type.DECIMAL(10, 2),
      },
      remark: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      status_flag: {
        //0 active 1 Deleted
        type: type.INTEGER,
        defaultValue: 0,
      },
      order_billing_flag: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      is_default_flag: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      per_or_fixed: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      charge_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      calculated_tax: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      is_tax_included: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      tax_title: {
        type: type.STRING,
        allowNull: true,
      },
      tax_divided: {
        type: type.BOOLEAN,
        defaultValue: false,
      },
      tax_amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER_CHARGES,
    },
    {},
  );
  OrderCharges.getTodaysCharges = async function () {
    let charges = await sequelize
      .query(
        'SELECT mpos_order_charges.* FROM mpos_order_charges' +
          ' left join mpos_order  on mpos_order_charges.order_id=mpos_order.order_id' +
          ' where mpos_order.my_order_date=date()',
        {
          model: this,
          mapToModel: true,
        },
      )
      .then((projects) => {});

    return charges;
  };

  //     SELECT *
  // from (SELECT * from mpos_order_charges ORDER BY id DESC )
  // GROUP BY order_id,title,status_flag
  // ORDER BY id DESC;

  OrderCharges.getappliedchargesHistory = async function (params) {
    const query =
      'SELECT mpos_order_charges.*,mpos_order.order_total FROM mpos_order_charges' +
      ' left join mpos_order  on mpos_order_charges.order_id=mpos_order.order_id' +
      ' where ' +
      ' created_time BETWEEN' +
      ' :fromDate AND :toDate AND ' +
      ' status_flag=0 AND ' +
      ' mpos_order.store_id=:store_id ';
    let charges = await sequelize.query(query, {
      replacements: {
        store_id: params.store_id,
        //  user_id: params.user_id,
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    return charges;
  };

  OrderCharges.getappliedchargesHistorynew = async function (params) {
    const query =
      ' SELECT *  ' +
      ' FROM   (SELECT c.*,mpos_order.order_total ' +
      ' FROM   mpos_order_charges as c  ' +
      ' JOIN mpos_order ' +
      ' ON c.order_id = mpos_order.order_id ' +
      ' WHERE  created_time BETWEEN :fromDate AND :toDate ' +
      ' AND mpos_order.store_id = :store_id ' +
      ' ORDER  BY c.id DESC) ' +
      ' GROUP  BY order_id,title ';
    // + " ORDER  BY id DESC; "
    let charges = await sequelize.query(query, {
      replacements: {
        store_id: params.store_id,
        //  user_id: params.user_id,
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    if (charges) {
      charges.map((charge) => {
        charge.order_total = charge.order_total.toFixed(global.ROUNDOFF_UPTO);
        charge.value = charge.value.toFixed(global.ROUNDOFF_UPTO);
      });
    }
    return charges;
  };

  return OrderCharges;
}

module.exports = {
  getModel,
};
