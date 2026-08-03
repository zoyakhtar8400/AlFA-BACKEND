const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Order = sequelize.define(
    util.DBDetails.Tables.MPOS_ORDER,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      order_id: {
        type: type.STRING,
        allowNull: true,
        unique: true,
      },
      store_id: {
        type: type.STRING,
      },
      table_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      table_name: {
        type: type.STRING,
        allowNull: true,
      },
      user_id: {
        type: type.STRING,
        allowNull: true,
      },
      cust_name: {
        type: type.STRING,
        allowNull: true,
      },
      phone: {
        type: type.STRING,
        allowNull: true,
      },
      email: {
        type: type.STRING,
        allowNull: true,
      },
      is_guest_mode: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      line_1: {
        type: type.STRING,
        allowNull: true,
      },
      line_2: {
        type: type.STRING,
        allowNull: true,
      },
      discount: {
        type: type.STRING,
        allowNull: true,
      },
      charges: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 0,
      },
      delivery_type: {
        type: type.STRING,
        allowNull: true,
        defaultValue: '0',
      },
      instructions: {
        type: type.STRING,
        allowNull: true,
      },
      quantity: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      order_level_total_charges: {
        type: type.DECIMAL(10, 2),
      },
      order_level_total_taxes: {
        type: type.DECIMAL(10, 2),
      },
      order_state: {
        type: type.STRING,
        allowNull: true,
      },
      order_subtotal: {
        type: type.DECIMAL(10, 2),
      },
      order_total: {
        type: type.DECIMAL(10, 2),
      },
      my_order_date: {
        type: type.DATEONLY,
        allowNull: true,
        defaultValue: type.NOW,
      },
      created_time: {
        type: type.TIME,
        allowNull: true,
      },
      payment: {
        type: type.STRING,
        allowNull: true,
        // defaultValue: 'Cash',
      },
      items: {
        type: type.STRING,
        allowNull: true,
      },
      order_check_flag: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      billing_type: {
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
      payment_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      persons: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      bill_number: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      sync_status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      order_flag: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      deliveryboy_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      total_external_discount: {
        type: type.DECIMAL(10, 2),
      },
      delivery_boy_name: {
        type: type.STRING,
        allowNull: true,
      },
      delivery_boy_phone: {
        type: type.STRING,
        allowNull: true,
      },
      createdBy: {
        type: type.STRING,
        allowNull: true,
      },
      inventoryReduced: {
        // O : Not reduced 1:Reduced 2:Reversed inventory
        type: type.INTEGER,
        defaultValue: 0,
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
      couponDisounttotal: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      issectionwisebilling: {
        type: type.BOOLEAN,
        defaultValue: false,
      },
      due_payment: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      hasDuepayment: {
        type: type.BOOLEAN,
        defaultValue: false,
      },
      order_kotflag: {
        type: type.INTEGER,
        defaultValue: 1, // 1=Served 2=Placed 3=bumped 4=Preparing 5=Ready
      },
      cust_paid_amount: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      waiter: {
        type: type.STRING,
        allowNull: true,
      },
      waiter_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      rbt_temprature: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      charges_level_total_tax: {
        type: type.DECIMAL(10, 2),
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
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      item_level_total_charges: {
        type: type.DECIMAL(10, 2),
      },
      discount_title: {
        type: type.STRING(80),
        allowNull: true,
      },
      // used for reason
      field1: {
        type: type.STRING,
        allowNull: true,
      },
      // used for payment qr string
      field2: {
        type: type.STRING,
        allowNull: true,
      },
      field3: {
        type: type.STRING,
        allowNull: true,
      },
      field4: {
        type: type.STRING,
        allowNull: true,
      },
      bill_prefix_for: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      intime: {
        type: type.TIME,
        allowNull: true,
      },
      outtime: {
        type: type.TIME,
        allowNull: true,
      },
      isBillModified: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      actual_created_time: {
        // because of midnight sale, order time set of previous day so we added this time to get actual time
        type: type.TIME,
        allowNull: true,
      },
      order_note: {
        type: type.STRING,
        allowNull: true,
      },
      app_source: {
        type: type.STRING,
        allowNull: true,
      },
      menu_id: {
        type: type.INTEGER,
        allowNull: true,
      },
      machine_id: {
        type: type.STRING,
        allowNull: true,
      },
      revenue_id: {
        type: type.STRING,
        allowNull: true,
      },
      zatca_status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      // item_level_total_discount: {
      //   type: type.DECIMAL(10, 2),
      //   allowNull: false,
      //   defaultValue: 0.0,
      // },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_ORDER,
      // hierarchy: true
    },
  );

  Order.getOrderbybillingtype = async function (store_id, user_id) {
    let list = [];
    let query =
      ' SELECT SUM(order_total) as amount,billing_type,count(order_id) AS count FROM' +
      ' mpos_order ' +
      ' WHERE ' +
      ' mpos_order.store_id=:store_id ' +
      ' AND ' +
      ' mpos_order.user_id=:user_id' +
      ' GROUP BY billing_type';
    try {
      list = await sequelize.query(query, {
        replacements: {
          store_id: store_id,
          user_id: user_id,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
      list = [];
    }
    return list;
  };

  Order.getSalestotal = async function (params) {
    let total_sales = 0;
    try {
      let where = {
        store_id: params.store_id,
        created_time: {
          [type.Op.between]: [params.fromDate, params.toDate],
        },
      };
      if (params.username) {
        where.user_id = params.username;
      }

      total_sales = await Order.sum('order_total', { where });
      try {
        total_sales = Number(Number(total_sales).toFixed(2));
      } catch (error) {}
    } catch (error) {
      total_sales = 0;
      console.log(error);
    }
    return total_sales;
  };

  Order.getSalestotalForCloseDay = async function (params) {
    let total_sales = 0;
    try {
      let where = {
        store_id: params.store_id,
        actual_created_time: {
          [type.Op.between]: [params.fromDate, params.toDate],
        },
        order_state: 'fulfilled',
      };
      if (params.username) {
        where.user_id = params.username;
      }

      total_sales = await Order.sum('order_total', { where });
      try {
        total_sales = Number(Number(total_sales).toFixed(2));
      } catch (error) {}
    } catch (error) {
      total_sales = 0;
      console.log(error);
    }
    return total_sales;
  };

  Order.getduepayTotal = async function (params) {
    let total_duepay = 0;
    try {
      let where = {
        store_id: params.store_id,
        created_time: {
          [type.Op.between]: [params.fromDate, params.toDate],
        },
      };
      if (params.username) {
        where.user_id = params.username;
      }

      total_duepay = await Order.sum('due_payment', { where });
      try {
        total_duepay = Number(Number(total_duepay).toFixed(2));
      } catch (error) {}
    } catch (error) {
      total_duepay = 0;
      console.log(error);
    }
    return total_duepay;
  };

  Order.getduepayTotalForCloseDay = async function (params) {
    let total_duepay = 0;
    try {
      let where = {
        store_id: params.store_id,
        actual_created_time: {
          [type.Op.between]: [params.fromDate, params.toDate],
        },
      };
      if (params.username) {
        where.user_id = params.username;
      }

      total_duepay = await Order.sum('due_payment', { where });
      try {
        total_duepay = Number(Number(total_duepay).toFixed(2));
      } catch (error) {}
    } catch (error) {
      total_duepay = 0;
      console.log(error);
    }
    return total_duepay;
  };

  Order.getOrderdetailsbybillingtype = async function (whereData) {
    let details = undefined;
    try {
      details = await Order.findAll({
        raw: true,
        attributes: [
          [type.fn('sum', type.col('order_total')), 'amount'],
          [type.fn('count', type.col('id')), 'count'],
        ],
        where: whereData,
      });
      if (details && details.length > 0) {
        details = details[0];
        if (details.amount == null || details.amount == undefined) {
          details.amount = 0;
        }
      }
    } catch (error) {
      details = undefined;
      console.log(error);
    }
    return details;
  };

  Order.getBillrange = async function (params) {
    let range = {};
    try {
      let where = {
        store_id: params.store_id,
        created_time: {
          [type.Op.between]: [params.fromDate, params.toDate],
        },
      };
      if (params.username) {
        where.user_id = params.username;
      }
      range = await Order.findAll({
        raw: true,
        attributes: [
          [sequelize.fn('min', sequelize.col('id')), 'min_bill'],
          [sequelize.fn('max', sequelize.col('id')), 'max_bill'],
          [
            sequelize.fn('min', sequelize.col('bill_number')),
            'min_bill_number',
          ],
          [
            sequelize.fn('max', sequelize.col('bill_number')),
            'max_bill_number',
          ],
        ],
        where,
      });
      if (range && range.length > 0) {
        range = range[0];
      }
    } catch (error) {
      console.log(error);
    }
    return range;
  };

  Order.getBillrangeForCloseDay = async function (params) {
    let range = {};
    try {
      let where = {
        store_id: params.store_id,
        actual_created_time: {
          [type.Op.between]: [params.fromDate, params.toDate],
        },
      };
      // if (params.username) {
      //   where.user_id = params.username;
      // }
      range = await Order.findAll({
        raw: true,
        attributes: [
          [sequelize.fn('min', sequelize.col('id')), 'min_bill'],
          [sequelize.fn('max', sequelize.col('id')), 'max_bill'],
        ],
        where,
      });
      if (range && range.length > 0) {
        range = range[0];
      }
    } catch (error) {
      console.log(error);
    }
    return range;
  };

  Order.getDataforstartendDayreport = async function (
    params,
    offlinePlatforms,
    onlinePlatforms,
  ) {
    let orderDetails = undefined;

    try {
      let whereData = { store_id: params.store_id };
      if (params.fromDate && params.toDate) {
        whereData.actual_created_time = {
          [type.Op.between]: [params.fromDate, params.toDate],
        };
      }
      if (params.username) {
        whereData.user_id = params.username;
      }
      //Get overall info first
      let overallInfo = await Order.findAll({
        raw: true,
        attributes: [
          [type.fn('sum', type.col('order_total')), 'amount'],
          [type.fn('count', type.col('id')), 'count'],
        ],
        where: whereData,
      });
      if (overallInfo && overallInfo.length > 0) {
        overallInfo = overallInfo[0];
      }

      let ordertypewiseDetails = [];
      //Get order type wise and bill status wise details details for offline
      if (offlinePlatforms && Array.isArray(offlinePlatforms)) {
        for (const element of offlinePlatforms) {
          whereData.billing_type = element.id;
          let data = await Order.getOrderdetailsbybillingtype(whereData);
          if (data) {
            data.type = element.name;
            ordertypewiseDetails.push(data);
          }
        }
      }
      delete whereData.billing_type;

      //Online Platforms
      if (onlinePlatforms && Array.isArray(onlinePlatforms)) {
        whereData.billing_type = onlinePlatforms;
        let onlineOrdersoverall =
          await Order.getOrderdetailsbybillingtype(whereData);
        if (onlineOrdersoverall) {
          onlineOrdersoverall.type = 'Online';
          ordertypewiseDetails.push(onlineOrdersoverall);
        }
      }

      //Get overall info first
      let onlineoverallInfo = await Order.findAll({
        raw: true,
        attributes: [
          [type.fn('sum', type.col('order_total')), 'amount'],
          [type.fn('count', type.col('id')), 'count'],
        ],
        where: whereData,
      });
      let onlineordertypewiseDetails = [];
      if (onlinePlatforms && Array.isArray(onlinePlatforms)) {
        for (const element of onlinePlatforms) {
          whereData.billing_type = element.id;
          let data = await Order.getOrderdetailsbybillingtype(whereData);
          if (data) {
            data.type = element.name;
            onlineordertypewiseDetails.push(data);
          }
        }
      }

      orderDetails = {
        allorderDetails: {
          overallInfo,
          ordertypewiseDetails,
        },
        online_orderDetails: {
          overallInfo: onlineoverallInfo,
          ordertypewiseDetails: onlineordertypewiseDetails,
        },
      };
    } catch (error) {
      orderDetails = undefined;
    }
    return orderDetails;
  };

  Order.getOrderdetailsbystatus = async function (params) {
    let data = undefined;
    try {
    } catch (error) {
      data = undefined;
      return data;
    }
  };

  Order.getDashboarddetails = async function (params) {
    let dashboardDetails = {};
    try {
      let query =
        'SELECT' +
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :fromDate AND :toDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as todaysTotal,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :fromDate AND :toDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as paymentsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :fromDate AND :toDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as todaysOrders,' +
        // + ' (SELECT SUM(order_total- due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :weekStart AND :weekEnd AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as weeksTotal,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalSale,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as alltimeordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :monthStart AND :monthEnd AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as monthsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :monthStart AND :monthEnd AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as monthOrders,' +
        ' (SELECT SUM(order_level_total_taxes) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalTax,' +
        ' (SELECT SUM(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalDiscount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=0 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as quickbillTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=0 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as quickbillOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=1 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dineinTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=1 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dineinOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=2 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as takeawayTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=2 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as takeawayOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=3 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as homdedelTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=3 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as homdedelOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=4 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as zomatoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=4 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as zomatoOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=5 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as swiggyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=5 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as swiggyOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=6 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ubereatsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=6 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ubereatsOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=7 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dunzoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=7 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dunzoOrders,' +
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=104 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ondcTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=104 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ondcOrders,' +
        // 9 dineout
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=9 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dineoutTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=9 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dineoutOrders,' +
        // 10 google pay
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=10 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as googlepayTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=10 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as googlepayOrders,' +
        // 11 gupshup
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=11 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as gupshupTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=11 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as gupshupOrders,' +
        // 12 peppo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=12 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as peppoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=12 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as peppoOrders,' +
        // 13 amazon food
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=13 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as amazonfoodTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=13 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as amazonfoodOrders,' +
        // 14 dotpe
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=14 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dotpeTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=14 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dotpeOrders,' +
        // 15 eazydiner
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=15 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as eazydinerTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=15 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as eazydinerOrders,' +
        // 16 dukaan
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=16 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dukaanTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=16 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dukaanOrders,' +
        // 17 jungleworks
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=17 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jungleworksTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=17 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jungleworksOrders,' +
        // 18 yumzy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=18 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yumzyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=18 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yumzyOrders,' +
        // 19 magicpin
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=19 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as magicpinTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=19 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as magicpinOrders,' +
        // 20 thrive
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=20 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as thriveTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=20 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as thriveOrders,' +
        // 21 talabat
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=21 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as talabatTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=21 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as talabatOrders,' +
        // 22 radyes
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=22 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as radyesTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=22 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as radyesOrders,' +
        // 23 mymenu
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=23 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mymenuTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=23 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mymenuOrders,' +
        // 24 deliverect
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=24 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverectTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=24 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverectOrders,' +
        // 25 foodpanda
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=25 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodpandaTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=25 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodpandaOrders,' +
        // 26 hungerstation
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=26 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as hungerstationTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=26 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as hungerstationOrders,' +
        // 27 jahez
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=27 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jahezTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=27 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jahezOrders,' +
        // 28 toyou
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=28 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as toyouTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=28 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as toyouOrders,' +
        // 29 chefz
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=29 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as chefzTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=29 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as chefzOrders,' +
        // 30 mrsool
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=30 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mrsoolTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=30 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mrsoolOrders,' +
        // 31 wassel
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=31 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wasselTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=31 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wasselOrders,' +
        // 32 walem
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=32 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as walemTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=32 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as walemOrders,' +
        // 33 careem
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=33 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as careemTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=33 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as careemOrders,' +
        // 34 TMT
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=34 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tmtTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=34 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tmtOrders,' +
        // 35 Mathaqi
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=35 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mathaqiTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=35 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mathaqiOrders,' +
        // 36 Ezhalha
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=36 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ezhalhaTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=36 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ezhalhaOrders,' +
        // 37 Lugmety
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=37 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as lugmetyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=37 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as lugmetyOrders,' +
        // 38 Foodboy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=38 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodboyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=38 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodboyOrders,' +
        // 39 Yummy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=39 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yummyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=39 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yummyOrders,' +
        // 40 Upsale
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=40 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as upsaleTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=40 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as upsaleOrders,' +
        // 41 Wizzy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=41 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wizzyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=41 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wizzyOrders,' +
        // 42 Snoonu
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=42 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as snoonuTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=42 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as snoonuOrders,' +
        // 43 raffeq
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=43 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as raffeqTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=43 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as raffeqOrders,' +
        // 44 Mrd
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=44 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mrdTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=44 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mrdOrders,' +
        // 45 Accounts
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=45 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as accountsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=45 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as accountsOrders,' +
        // 46 Whakaaro
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=46 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as whakaaroTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=46 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as whakaaroOrders,' +
        // 47 gatoes
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=17 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as gatoesTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=47 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as gatoesOrders,' +
        // 48 Wal Aan
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=48 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as walaanTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=48 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as walaanOrders,' +
        // 49 Delivery partner
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=49 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverypartnerTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=49 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverypartnerOrders,' +
        // 50 Mychharo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=50 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mychharoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=50 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mychharoOrders,' +
        // 51 quick bill
        // ' (SELECT SUM(order_total) ' +
        // ' FROM mpos_order ' +
        // ' WHERE billing_type=51 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as quickbillTotal,' +
        // ' (SELECT count(order_total) ' +
        // ' FROM mpos_order ' +
        // ' WHERE billing_type=51 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as quickbillOrders,' +
        // 52 local
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=52 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as localTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=52 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as localOrders,' +
        // 53 Travel
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=53 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as travelTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=53 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as travelOrders,' +
        // // 54 Delivery
        // ' WHERE billing_type=54 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as deliveryTotal,' +
        // ' (SELECT count(order_total) ' +
        // ' FROM mpos_order ' +
        // ' WHERE billing_type=54 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as deliveryOrders,' +
        // 55 Zomato
        // ' WHERE billing_type=1 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as dineinTotal,' +
        // ' (SELECT count(order_total) ' +
        // ' FROM mpos_order ' +
        // ' WHERE billing_type=1 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as dineinOrders,' +

        // 56 Zoeqi
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=56 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as zoeqiTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=56 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as zoeqiOrders,' +
        // 57 Uber eat
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=57 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ubereatTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=57 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ubereatOrders,' +
        // 58 Danzo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=58 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as danzoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=58 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as danzoOrders,' +
        // 59 digital orders
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=59 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digitalordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=59 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digitalordersOrders,' +
        // 60 Take-out
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=60 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as takeoutTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=60 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as takeoutOrders,' +
        // 61 Google pay
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=61 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as googlepayTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=61 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as googlepayOrders,' +
        // 62 Jabs HUb
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=62 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jabshubTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=62 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jabshubOrders,' +
        // 63 Bebo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=63 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as beboTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=63 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as beboOrders,' +
        // 64 Amazon Food
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=64 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as amazonfoodTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=64 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as amazonfoodOrders,' +
        // 65 dotpe
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=65 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dotpeTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=65 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dotpeOrders,' +
        // 66 easydiner
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=66 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as easydinerTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=66 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as easydinerOrders,' +
        // 67 Dukan
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=67 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dukanTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=67 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dukanOrders,' +
        // 68 Jungle works
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=68 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jungleworksTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=68 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as jungleworksOrders,' +
        // 69 Yumzy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=69 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yumzyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=69 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yumzyOrders,' +
        // 70 magic pin
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=70 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as magicpinTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=70 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as magicpinOrders,' +
        // 71 Thrive
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=71 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as thriveTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=71 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as thriveOrders,' +
        // 72 requests
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=72 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as requestsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=72 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as requestsOrders,' +
        // 73 radian
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=73 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as radianTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=73 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as radinaOrders,' +
        // 74 my list
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=74 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mylistTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=74 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mylistOrders,' +
        // 75 deliverytech
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=75 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverytechTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=75 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverytechOrders,' +
        // 76 Food panda
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=76 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodpandaTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=76 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodpandaOrders,' +
        // 77 hungerstation
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=77 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as hungerstationTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=77 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as hungerstationOrders,' +
        // 78 ready
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=78 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as readyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=78 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as readyOrders,' +
        // 79 tu yo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=79 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tuyoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=79 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tuyoOrders,' +
        // 80 chiefs
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=80 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as chiefsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=80 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as chiefsOrders,' +
        // 81 messengers
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=81 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as messengersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=81 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as messengersOrders,' +
        // 82 receipts
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=82 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as receiptsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=82 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as receiptsOrders,' +
        // 83 william
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=83 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as williamTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=83 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as williamOrders,' +
        // 84 generous
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=84 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as generousTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=84 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as generousOrders,' +
        // 85 TMT
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=85 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tmtTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=85 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tmtOrders,' +
        // 86 my taste
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=86 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mytasteTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=86 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mytasteOrders,' +
        // 87 make it easy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=87 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as makeiteasyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=87 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as makeiteasyOrders,' +
        // 88 my bite
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=88 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mybiteTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=88 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mybiteOrders,' +
        // 89 food boy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=89 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodboyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=89 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as foodboyOrders,' +
        // 90 yummy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=90 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yummyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=90 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as yummyOrders,' +
        // // 91 'اب سال'
        // ' WHERE billing_type=91 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as Total,' +
        // ' (SELECT count(order_total) ' +
        // ' FROM mpos_order ' +
        // ' WHERE billing_type=91 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as dineinOrders,' +
        // 92 Wizzy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=92 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wizzyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=92 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wizzyOrders,' +
        // 93 swallow
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=93 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as swallowTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=1 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as swallowOrders,' +
        // 94 companion
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=94 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as companionTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=94 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as companionOrders,' +
        // 95 Mr. d
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=95 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mrdTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=95 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as mrdOrders,' +
        // 96 accounts
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=96 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as accountsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=96 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as accountsOrders,' +
        // 97 wakroo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=97 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wakrooTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=97 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as wakrooOrders,' +
        // 98 gato
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=98 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as gatoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=98 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as gatoOrders,' +
        // 99 and now
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=99 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as andnowTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=99 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as andnowOrders,' +
        // 100 up
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=100 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as upTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=100 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as upOrders,' +
        // 101 salon
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=101 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as salonTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=101 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as salonOrders,' +
        // 102 vuba vuba
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=102 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as vubavubaTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=102 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as vubavubaOrders,' +
        // 103 Rush Food
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=103 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as rushfoodTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=103 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as rushfoodOrders,' +
        // // 104 ONDC
        // ' WHERE billing_type=104 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as dineinTotal,' +
        // ' (SELECT count(order_total) ' +
        // ' FROM mpos_order ' +
        // ' WHERE billing_type=104 AND ' +
        // ' order_state="fulfilled" AND ' +
        // ' store_id=:store_id) as dineinOrders,' +
        // 105 Ahlan
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=105 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ahlanTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=105 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ahlanOrders,' +
        // 106 Smiles
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=106 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as smilesTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=106 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as smilesOrders,' +
        // 107 Noon food
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=107 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as noonfoodTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=107 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as noonfoodOrders,' +
        // 108 Deliverro
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=108 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverroTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=108 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as deliverroOrders,' +
        // 109 Get cari
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=109 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as getCariTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=109 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as getCariOrders,' +
        // 110 IRCTC
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=110 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as irctcTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=110 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as irctcOrders,' +
        // 111 baladi express
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=111 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as baladiexpressTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=111 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as baladiexpressOrders,' +
        // 112 feedygo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=112 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as feedygoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=112 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as feedygoOrders,' +
        // 113 doordash
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=113 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as doordashTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=113 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as doordashOrders,' +
        // 114 skipthedishesh
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=114 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as skipthedisheshTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=114 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as skipthedisheshOrders,' +
        // 115 97 eats
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=115 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as nintyseveneatTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=115 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as nintyseveneatOrders,' +
        // 116 glovo
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=116 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as glovoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=116 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as glovoOrders,' +
        // 117 TM done
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=117 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tmdoneTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=117 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as tmdoneOrders,' +
        // 118 entertainer
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=118 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as entertainerTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=118 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as entertainerOrders,' +
        // 119 scootsy
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=119 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as scootsyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=119 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as scootsyOrders,' +
        // 120 chatfood
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=120 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as chatfoodTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=120 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as chatfoodOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' store_id=:store_id) as cancelledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' store_id=:store_id) as cancelledordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="fulfilled" AND ' +
        ' store_id=:store_id) as fulfilledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="fulfilled" AND ' +
        ' store_id=:store_id) as fulfilledordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="free" AND ' +
        ' store_id=:store_id) as freeordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="free" AND ' +
        ' store_id=:store_id) as freeordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="deleted" AND ' +
        ' store_id=:store_id) as deletedordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="deleted" AND ' +
        ' store_id=:store_id) as deletedordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' store_id=:store_id) as olcancelledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' store_id=:store_id) as olcancelledordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' store_id=:store_id) as digicancelledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' store_id=:store_id) as digicancelledordersCount,' +
        ' (SELECT SUM(order_level_total_taxes) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as oltotalTax,' +
        ' (SELECT SUM(order_level_total_taxes) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digitotalTax,' +
        ' (SELECT SUM(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as oltotalDiscount,' +
        ' (SELECT SUM(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digitotalDiscount,' +
        ' (SELECT count(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 0 AND 3 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as offlineSalescount,' +
        // + ' (SELECT sum(order_total - due_payment) '
        ' (SELECT sum(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 0 AND 3 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as offlineSales,' +
        ' (SELECT count(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as onlineSalescount,' +
        ' (SELECT sum(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' billing_type in (8,40) AND  ' +
        ' store_id=:store_id) as digiSales,' +
        ' (SELECT count(id) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type in (8,40)  AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digiSalescount,' +
        ' (SELECT sum(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as onlineSales,' +
        ' (SELECT SUM(due_payment) ' +
        ' FROM mpos_order ' +
        ' WHERE hasDuepayment=1 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as due_payment,' +
        ' (SELECT count(hasDuepayment) ' +
        ' FROM mpos_order ' +
        ' WHERE hasDuepayment=1 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as due_paymentCount,' +
        ' (SELECT sum(order_total)/sum(persons) ' +
        ' FROM mpos_order ' +
        ' WHERE  ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as avgsalesPerperson;';

      dashboardDetails = await sequelize.query(query, {
        replacements: {
          store_id: params.store_id,
          //  user_id: params.user_id,
          fromDate: params.fromDate,
          toDate: params.toDate,
          monthStart: params.monthStart,
          monthEnd: params.monthEnd,
          weekStart: params.weekStart,
          weekEnd: params.weekEnd,
        },
        type: sequelize.QueryTypes.SELECT,
      });
      if (
        dashboardDetails &&
        Array.isArray(dashboardDetails) &&
        dashboardDetails.length > 0
      ) {
        dashboardDetails = dashboardDetails[0];
      }
    } catch (error) {
      console.log(error);
    }
    return dashboardDetails;
  };
  Order.getOrderTypeWiseDashboarddetails = async function (params) {
    let ordertypewisedashboardDetails = {};
    try {
      let query =
        'SELECT billing_type, SUM(order_total) AS total_sale, COUNT(id) AS total_orders ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN :fromDate AND :toDate ' +
        ' AND order_state = "fulfilled" ' +
        ' AND store_id = :store_id ' +
        ' GROUP BY billing_type;';

      ordertypewisedashboardDetails = await sequelize.query(query, {
        replacements: {
          store_id: params.store_id,
          //  user_id: params.user_id,
          fromDate: params.fromDate,
          toDate: params.toDate,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
    }
    return ordertypewisedashboardDetails;
  };
  Order.getDashboarddetailsbydate = async function (params) {
    let dashboardDetails = {};
    try {
      let query =
        'SELECT' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as paymentsTotal,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalSale,' +
        ' (SELECT SUM(order_level_total_taxes) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalTax,' +
        ' (SELECT SUM(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalDiscount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=0 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as quickbillTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=0 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as quickbillOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=1 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dineinTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=1 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dineinOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=2 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as takeawayTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=2 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as takeawayOrders,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=3 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as homdedelTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=3 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as homdedelOrders,' +
        ' (SELECT SUM(order_total ) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=4 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as zomatoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=4 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as zomatoOrders,' +
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=5 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as swiggyTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=5 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as swiggyOrders,' +
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=6 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ubereatsTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=6 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ubereatsOrders,' +
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=7 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dunzoTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=7 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as dunzoOrders,' +
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=104 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ondcTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE billing_type=104 AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as ondcOrders,' +
        ' (SELECT SUM(order_total - due_payment) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as cancelledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as cancelledordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="fulfilled" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as fulfilledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="fulfilled" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as fulfilledordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="free" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as freeordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="free" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as freeordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="deleted" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as deletedordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="deleted" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as deletedordersCount,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as olcancelledordersTotal,' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT SUM(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as digicancelledordersTotal,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as olcancelledordersCount,' +
        ' (SELECT count(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE order_state="cancelled" AND ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as digicancelledordersCount,' +
        ' (SELECT SUM(order_level_total_taxes) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as oltotalTax,' +
        ' (SELECT SUM(order_level_total_taxes) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digitotalTax,' +
        ' (SELECT SUM(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as oltotalDiscount,' +
        ' (SELECT SUM(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        // + ' billing_type=8 AND  '
        ' billing_type=8 OR  ' +
        ' billing_type=40 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as digitotalDiscount,' +
        ' (SELECT count(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 0 AND 3 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as offlineSalescount,' +
        ' (SELECT sum(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 0 AND 3 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as offlineSales,' +
        ' (SELECT count(discount) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as onlineSalescount,' +
        ' (SELECT sum(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' billing_type BETWEEN 4 AND 248 AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as onlineSales,' +
        // + ' (SELECT sum(order_total - due_payment) '
        ' (SELECT sum(order_total) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' billing_type in (8,40) AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as digiSales,' +
        ' (SELECT count(id) ' +
        ' FROM mpos_order ' +
        ' WHERE ' +
        ' order_state="fulfilled" AND ' +
        ' billing_type in (8,40) AND  ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as digiSalescount,' +
        ' (SELECT SUM(due_payment) ' +
        ' FROM mpos_order ' +
        ' WHERE hasDuepayment=1 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as due_payment,' +
        ' (SELECT count(hasDuepayment) ' +
        ' FROM mpos_order ' +
        ' WHERE hasDuepayment=1 AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as due_paymentCount,' +
        ' (SELECT sum(order_total)/sum(persons) ' +
        ' FROM mpos_order ' +
        ' WHERE  ' +
        ' order_state="fulfilled" AND ' +
        ' created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as avgsalesPerperson;';

      dashboardDetails = await sequelize.query(query, {
        replacements: {
          store_id: params.store_id,
          //  user_id: params.user_id,
          fromDate: params.fromDate,
          endDate: params.toDate,
          dayStart: params.dayStart,
          dayEnd: params.dayEnd,
        },
        type: sequelize.QueryTypes.SELECT,
      });
      if (
        dashboardDetails &&
        Array.isArray(dashboardDetails) &&
        dashboardDetails.length > 0
      ) {
        dashboardDetails = dashboardDetails[0];
      }
    } catch (error) {
      console.log(error);
    }
    return dashboardDetails;
  };

  Order.getOrderbyOrderState = async function (params) {
    let orderDetails = {};
    try {
      let query =
        'SELECT' +
        // + ' (SELECT SUM(order_total - due_payment) '
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' actual_created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id) as totalFulfilledOrders,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' actual_created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="pending" AND ' +
        ' store_id=:store_id) as totalPendingOrders,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' actual_created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="cancelled" AND ' +
        ' store_id=:store_id) as totalCancelledOrders,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' actual_created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="food ready" AND ' +
        ' store_id=:store_id) as totalFoodReadyOrders,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' actual_created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' order_state="dispatched" AND ' +
        ' store_id=:store_id) as totalDispatchedOrders,' +
        ' (SELECT count(order_id) ' +
        ' FROM mpos_order WHERE ' +
        ' actual_created_time BETWEEN' +
        ' :fromDate AND :endDate AND ' +
        ' store_id=:store_id) as totalOrders;';
      // + ' (SELECT SUM(order_total - due_payment) '

      orderDetails = await sequelize.query(query, {
        replacements: {
          store_id: params.store_id,
          //  user_id: params.user_id,
          fromDate: params.fromDate,
          endDate: params.toDate,
        },
        type: sequelize.QueryTypes.SELECT,
      });
      if (
        orderDetails &&
        Array.isArray(orderDetails) &&
        orderDetails.length > 0
      ) {
        orderDetails = orderDetails[0];
      }
    } catch (error) {
      console.log(error);
    }
    return orderDetails;
  };

  Order.getOrderbyOrderStateAsPerUserName = async function (params) {
    console.log('get order by state::', params);
    let orderDetails = {};
    if (!params.fromDate || !params.toDate) {
      return orderDetails;
    }
    try {
      if (params.user_id) {
        let query =
          'SELECT' +
          // + ' (SELECT SUM(order_total - due_payment) '
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' user_id=:user_id AND ' +
          ' order_state="fulfilled" AND ' +
          ' store_id=:store_id) as totalFulfilledOrders,' +
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' user_id=:user_id AND ' +
          ' order_state="cancelled" AND ' +
          ' store_id=:store_id) as totalCancelledOrders,' +
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' user_id=:user_id AND ' +
          ' order_state="free" AND ' +
          ' store_id=:store_id) as totalFreeOrders,' +
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' user_id=:user_id AND ' +
          ' store_id=:store_id) as totalOrders;';

        orderDetails = await sequelize.query(query, {
          replacements: {
            store_id: params.store_id,
            user_id: params.user_id,
            fromDate: params.fromDate,
            endDate: params.toDate,
          },
          type: sequelize.QueryTypes.SELECT,
        });
        if (
          orderDetails &&
          Array.isArray(orderDetails) &&
          orderDetails.length > 0
        ) {
          orderDetails = orderDetails[0];
        }
      } else {
        let query =
          'SELECT' +
          // + ' (SELECT SUM(order_total - due_payment) '
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' order_state="fulfilled" AND ' +
          ' store_id=:store_id) as totalFulfilledOrders,' +
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' order_state="cancelled" AND ' +
          ' store_id=:store_id) as totalCancelledOrders,' +
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' order_state="free" AND ' +
          ' store_id=:store_id) as totalFreeOrders,' +
          ' (SELECT count(order_id) ' +
          ' FROM mpos_order WHERE ' +
          ' created_time BETWEEN' +
          ' :fromDate AND :endDate AND ' +
          ' store_id=:store_id) as totalOrders;';

        orderDetails = await sequelize.query(query, {
          replacements: {
            store_id: params.store_id,
            //  user_id: params.user_id,
            fromDate: params.fromDate,
            endDate: params.toDate,
          },
          type: sequelize.QueryTypes.SELECT,
        });
        if (
          orderDetails &&
          Array.isArray(orderDetails) &&
          orderDetails.length > 0
        ) {
          orderDetails = orderDetails[0];
        }
      }

      // + ' (SELECT SUM(order_total - due_payment) '
    } catch (error) {
      console.log(error);
    }
    return orderDetails;
  };

  Order.getsalesbyweekdays = async function (params) {
    let weekdays = undefined;
    try {
      let query =
        'SELECT sum(order_total) as amount,' +
        // 'SELECT sum(order_total- due_payment) as amount,'
        'CASE ' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="0" THEN "sunday"' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="1" THEN "monday"' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="2" THEN "tuesday"' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="3" THEN "wednesday"' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="4" THEN "thursday"' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="5" THEN "friday"' +
        ' WHEN strftime("%w",datetime(mpos_order.created_time/1000,"unixepoch", "localtime"))="6" THEN "saturday"' +
        ' END AS day ' +
        ' FROM mpos_order' +
        ' WHERE created_time BETWEEN' +
        ' :weekStart AND :weekEnd AND ' +
        ' order_state="fulfilled" AND ' +
        ' store_id=:store_id ' +
        ' GROUP BY day;';
      weekdays = await sequelize.query(query, {
        replacements: {
          store_id: params.store_id,
          weekStart: params.weekStart,
          weekEnd: params.weekEnd,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
    }
    return weekdays;
  };

  Order.getsaleschartdata = async function (params) {
    let data = [];
    try {
      let query = undefined;
      switch (params.getSalesby) {
        case 'month':
          query =
            'SELECT ' +
            ' strftime("%m", datetime(mpos_order.created_time/1000,"unixepoch", "localtime")) as valDay, ' +
            ' datetime(mpos_order.created_time/1000,"unixepoch", "localtime") as month,SUM(order_total) as amount ' +
            ' FROM mpos_order' +
            ' WHERE created_time BETWEEN' +
            ' :fromDate AND :toDate AND ' +
            ' order_state="fulfilled" AND ' +
            ' store_id=:store_id ' +
            ' GROUP BY valDay;';
          break;
        case 'year':
          query =
            'SELECT ' +
            ' strftime("%Y", datetime(mpos_order.created_time/1000,"unixepoch", "localtime")) as valDay, ' +
            ' datetime(mpos_order.created_time/1000,"unixepoch", "localtime") as year ,SUM(order_total) as amount ' +
            ' FROM mpos_order' +
            ' WHERE created_time BETWEEN' +
            ' :fromDate AND :toDate AND ' +
            ' order_state="fulfilled" AND ' +
            ' store_id=:store_id ' +
            ' GROUP BY valDay;';
          break;
        default:
          query =
            'SELECT ' +
            ' strftime("%d", datetime(mpos_order.created_time/1000,"unixepoch", "localtime")) as valDay, ' +
            ' datetime(mpos_order.created_time/1000,"unixepoch", "localtime") as day,SUM(order_total) as amount ' +
            ' FROM mpos_order' +
            ' WHERE created_time BETWEEN' +
            ' :fromDate AND :toDate AND ' +
            ' order_state="fulfilled" AND ' +
            ' store_id=:store_id ' +
            ' GROUP BY valDay;';
          break;
      }

      data = await sequelize.query(query, {
        replacements: {
          store_id: params.store_id,
          fromDate: params.fromDate,
          toDate: params.toDate,
        },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.log(error);
    }
    return data;
  };
  return Order;
}

module.exports = {
  getModel,
};
