/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const { get, sumBy, differenceWith, map, forEach } = require('lodash');
const { db } = require('../database/UmzufConfig');
const { ONLINE_PAYMENT_METHODS } = require('../util/DBUtil');
const { ONLINEORDER_IPC } = require('../util/IPC_Messages');
const { apiCall } = require('../services/APIService');
const { DELIVERY_TYPES } = require('../util/Constants');

const stringConstructor = 'test'.constructor;

async function prepareordertoPull(orderDetails) {
  try {
    if (orderDetails.json_data === stringConstructor) {
      // eslint-disable-next-line no-param-reassign
      orderDetails.json_data = JSON.parse(orderDetails.json_data);
    }
  } catch (error) {
    console.error(error);
  }

  let order_id = get(orderDetails, 'json_data.order.details.merchant_ref_id');
  let addnewCustomer = false;
  let channel;
  let order_total = 0;
  let cust_name;
  let phone;
  let address_line1;
  let address_line2;
  // let city;
  // let sub_locality;
  // const table_id = undefined;
  let email;
  let is_guest_mode;
  const persons = 1;
  let discount = 0;
  let delivery_type;
  let instructions;
  let order_level_total_charges = 0;
  let order_level_total_taxes = 0;
  const order_state = String(orderDetails.order_state).toLowerCase();
  let order_subtotal = 0;
  let payment = 'Cash';
  const payment_id = 0;
  const deliveryboy_id = 0;
  let total_external_discount = 0;
  let created_time;
  let merchant_ref_id = 0;
  const delivery_boy_phone = orderDetails.deliveryperson_phone;
  const delivery_boy_name = orderDetails.deliveryperson_name;
  const items = [];
  const paymentDetails = [];
  const charges = [];
  const createTablefororder = false;
  let my_order_date;
  // const customer = {};
  let quantity = 0;
  // const onlineordersextraInfo = {};

  if (orderDetails.json_data.customer) {
    const { customer } = orderDetails.json_data;
    if (customer.phone) {
      const savedCustomer = await db.Customer.findOne({
        where: {
          phone: customer.phone,
        },
      });
      if (savedCustomer) {
        addnewCustomer = true;
      }
    }

    cust_name = customer.name;
    phone = customer.phone;
    email = customer.email;
    if (customer.address) {
      is_guest_mode = customer.address.is_guest_mode;
      address_line1 = customer.address.line_1;
      address_line2 = customer.address.line_2;
      // city = customer.address.city;
      // sub_locality = customer.address.sub_locality;
    }
  }

  if (orderDetails.json_data.order) {
    if (orderDetails.json_data.order.details) {
      const { details } = orderDetails.json_data.order;
      channel = details.channel;
      if (details.discount) {
        discount = details.discount;
      }
      if (details.total_external_discount) {
        total_external_discount = details.total_external_discount;
      }
      if (discount > 0) {
        discount -= total_external_discount;
      }

      order_id = details.merchant_ref_id;
      order_level_total_charges = details.total_charges;
      order_level_total_taxes = details.total_taxes;
      order_subtotal = details.order_subtotal;
      order_total = details.order_total;
      instructions = details.instructions;
      created_time = details.created;
      if (created_time) {
        // eslint-disable-next-line no-unused-vars
        my_order_date = global.moment(created_time).format('YYYY-MM-DD');
      }
      if (details.charges && details.charges.length > 0) {
        details.charges.forEach((element) => {
          charges.push({
            order_id,
            title: element.title,
            value: element.value,
            amount: element.amount,
          });
        });
      }

      if (details.ext_platforms && details.ext_platforms.length > 0) {
        // const platforms = details.ext_platforms[0];
        delivery_type = details.ext_platforms[0].delivery_type;
      }
    }
    const rawItems = orderDetails.json_data.order.items;

    if (rawItems && rawItems.length > 0) {
      rawItems.forEach((item) => {
        const itemtoAdd = {
          title: item.title,
          item_id: item.merchant_id,
          quantity: item.quantity,
          amount: item.total,
          price: item.price,
          orderMasterId: order_id,
          total: item.total,
          total_with_tax: item.total_with_tax,
          product_group_id: item.product_group_id,
          product_group_name: item.product_group_name,
          discount: item.discount,
        };
        quantity += item.quantity;
        // Check if item has options
        let options_to_add = '';
        if (item.options_to_add && item.options_to_add.length) {
          const optionsPrice = item.options_to_add.reduce(
            (a, b) => a + (b.price || 0),
            0,
          );
          itemtoAdd.price += optionsPrice;
          itemtoAdd.addons = item.options_to_add;
          options_to_add = item.options_to_add
            .map((elem) => elem.title)
            .join(',');
        }

        if (options_to_add) {
          options_to_add = `(${options_to_add})`;
        }
        itemtoAdd.baseTitle = item.title;
        itemtoAdd.title = item.title + options_to_add;

        if (item.total_with_tax === 0) {
          itemtoAdd.price = 0;
          itemtoAdd.amount = 0;
        }

        if (item.taxes && Array.isArray(item.taxes) && item.taxes.length) {
          const tax_value = sumBy(item.taxes, 'value');
          const pickFirst = item.taxes[0];
          Object.assign(itemtoAdd, {
            tax_value,
            tax_name: item.taxes.length > 1 ? 'GST' : pickFirst.title,
            tax_per: pickFirst.rate,
            item_tax_method: 1, // add as tax inclusive,
            is_devidable: item.taxes.length > 1 ? 1 : 0,
          });
        }

        if (itemtoAdd.discount) {
          Object.assign(itemtoAdd, {
            pricebeforeDiscount: itemtoAdd.price,
            discount_rate: itemtoAdd.discount,
            discounted_price: itemtoAdd.total_with_tax - itemtoAdd.discount,
          });
        }
        items.push(itemtoAdd);
      });
    }

    // Check the payment info
    if (
      orderDetails.json_data.order.payment &&
      orderDetails.json_data.order.payment.length > 0
    ) {
      const rawPayments = orderDetails.json_data.order.payment;
      let externalDiscAdded = false;

      rawPayments.forEach((payObject) => {
        // Check if the payment mode is in the online
        // payment list if yes then change the
        // payment name to online
        if (ONLINE_PAYMENT_METHODS.includes(payObject.option)) {
          payObject.option = 'Online Paid';
        }

        // CHekc if the delivery is by restaurant and payment
        // is in cash then change the mode to online COD
        if (
          delivery_type &&
          String(payObject.option).toLowerCase() === 'cash' &&
          (delivery_type === DELIVERY_TYPES.PICKUP ||
            delivery_type === DELIVERY_TYPES.SELF)
        ) {
          payObject.option = 'Online COD';
        }
        const rawPay = {
          order_id,
          amount: payObject.amount,
          payment_option: payObject.option,
        };
        if (!externalDiscAdded) {
          rawPay.amount += total_external_discount;
          externalDiscAdded = true;
        }
        paymentDetails.push(rawPay);
        payment = payObject.option;
      });

      if (rawPayments.length > 1) {
        payment = 'Split';
      }
    }

    if (orderDetails.json_data.order.store) {
      merchant_ref_id = orderDetails.json_data.order.store.merchant_ref_id;
    }
  }
  // Receivable amount to the user
  order_total += total_external_discount;

  const table_name = `${channel}:${order_id}`;
  const billDetails = {
    table_name,
    order_id,
    order_total,
    cust_name,
    phone,
    line_1: address_line1,
    line_2: address_line2,
    email,
    is_guest_mode,
    persons,
    discount,
    delivery_type,
    instructions,
    order_level_total_charges,
    order_level_total_taxes,
    order_state,
    order_subtotal,
    payment,
    payment_id,
    deliveryboy_id,
    user_id: global.storeDetails.username,
    total_external_discount,
    created_time,
    delivery_boy_phone,
    delivery_boy_name,
    quantity,
    createdBy: global.storeDetails.username,
    cust_paid_amount: order_total,
  };

  const billData = {
    paymentDetails,
    billDetails,
    items,
    charges,
    merchant_ref_id,
    channel,
    addnewCustomer,
    defaultDepartmentid: global.defaultDepartmentid,
    createTablefororder,
    silentPull: true,
  };
  // console.log(billData);
  console.log(`Message="Pulling cancelled online order" OrderID=${order_id}"`);
  global.mainWindow.webContents.send(
    ONLINEORDER_IPC.SEND_MAIN_TO_RENDERER_TO_MAIN,
    billData,
  );
  // ipcRenderer.send(SAVE_ONLINEBILL, JSON.stringify(billData));
}

async function fetchcancelledorders({ store_id, order_id }) {
  try {
    const result = await apiCall.post(global.Config.links.getchannelOrders, {
      store_id,
      order_id,
    });
    if (result && result.data) {
      const { data } = result.data;
      if (data && data.length) {
        console.log(`Pulling cancelled orders:${order_id}`);
        forEach(data, async (orderDetails) => {
          await prepareordertoPull(orderDetails);
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function checkifordersPulled(params) {
  try {
    // check if the orders are pulled or not
    let existingOrderids = await db.Bill.findAll({
      raw: true,
      attributes: ['order_id'],
      where: {
        order_id: {
          [db.Sequelize.Op.in]: params.order_ids,
        },
        order_state: {
          [db.Sequelize.Op.in]: ['Cancelled', 'deleted', 'cancelled'],
        },
      },
    });
    existingOrderids = existingOrderids
      ? map(existingOrderids, 'order_id')
      : [];
    const orderidstoPull = differenceWith(params.order_ids, existingOrderids);
    if (orderidstoPull && orderidstoPull.length) {
      fetchcancelledorders({
        order_id: orderidstoPull,
        store_id: params.store_id,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

async function updateorPullorder(params) {
  const { order_id, new_status, store_id } = params;
  const response = { status: 400 };

  if (['cancelled', 'cancel'].includes(String(new_status).toLowerCase())) {
    await db.Bill.findOne({
      where: {
        order_id,
      },
    });
    console.log(
      `Message="Pull cancelled online order.." OrderID=${order_id} StoreID=${store_id}"`,
    );
    try {
      const result = await apiCall.post(
        global.Config.links.getsingleChannelorder,
        {
          order_id,
          store_id,
        },
      );
      if (result && result.data) {
        const { data, status } = result.data;
        if ([200, '200'].includes(status) && data) {
          prepareordertoPull(data);
        }
      }
    } catch (error) {
      console.error(
        `Message="Error Fetching cancelled order.." OrderID=${order_id} StoreID=${store_id}"`,
      );
    }
  }
  return response;
}

global.betteripcMain.answerRenderer(
  ONLINEORDER_IPC.PULL_CANCELLED_ORDER,
  async (params) => {
    if (params.constructor === stringConstructor) {
      // eslint-disable-next-line no-param-reassign
      params = JSON.parse(params);
    }
    const result = await updateorPullorder(params);
    return result;
  },
);

global.betteripcMain.answerRenderer(
  ONLINEORDER_IPC.CHECK_CANCELLED_ORDERS,
  async (params) => {
    if (params.constructor === stringConstructor) {
      // eslint-disable-next-line no-param-reassign
      params = JSON.parse(params);
    }
    const result = await checkifordersPulled(params);
    return result;
  },
);

global.betteripcMain.answerRenderer(
  'auto-pull-online-order',
  async (orderDetails) => {
    await prepareordertoPull(orderDetails);
  },
);

module.exports = {};
