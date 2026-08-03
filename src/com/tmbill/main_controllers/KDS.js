/* eslint-disable camelcase */
const connection = require('../js/database');
const { ONLINE_PLATFORMS } = require('../util/Constants');

async function updateCategoriesActiveStatus(categories, store_id) {
  if (categories) {
    const response = { status: 200 };
    categories.forEach(async (category) => {
      let result = await connection.Category.update(
        {
          is_active: category.is_active,
        },
        {
          where: {
            category_refid: category.category_refid,
            store_id,
          },
        },
      );
      if (result.length > 0) {
        result = result[0];
        if (result >= 1) {
          response.status = 200;
          response.message = 'Category Status updated.';
        } else {
          response.status = 400;
          response.message = 'Updated Failed';
        }
      } else {
        response.status = 400;
        response.message = 'Something went wrong';
      }
    });
    return response;
  }
  return undefined;
}

async function updateItemActiveStatus(items, store_id) {
  if (items) {
    const response = { status: 200 };
    for (const item of items) {
      let result = await connection.Item.update(
        {
          active: item.is_active,
        },
        {
          where: {
            item_refid: item.item_refid,
            store_id,
          },
        },
      );

      if (result.length > 0) {
        result = result[0];
        if (result >= 1) {
          response.status = 200;
          response.message = 'Item status updated.';
        } else {
          response.status = 400;
          response.message = 'Updated Failed';
        }
      } else {
        response.status = 400;
        response.message = 'Something went wrong';
      }
    }
    return response;
  }
}

async function getKDSMenu(store_id) {
  const response = { status: 200 };
  try {
    const categories = await connection.Category.findAll({
      where: {
        store_id,
      },
    });

    const items = await connection.Item.findAll({
      where: {
        store_id,
      },
    });

    const option_group = await connection.OptionGroup.findAll({
      where: {
        store_id,
      },
    });
    const options = await connection.Options.findAll({
      where: {
        store_id,
      },
    });

    Object.assign(response, {
      data: {
        categories,
        items,
        option_group,
        options,
      },
    });
  } catch (error) {
    console.error(error);
  }
  return response;
}

async function getServedKOTs(params) {
  try {
    // Get today's start time as a timestamp
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Set time to 00:00:00
    const fromDate = todayStart.getTime(); // Get timestamp

    // Get today's end time as a timestamp
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
    const toDate = todayEnd.getTime(); // Get timestamp

    // const fromDate = Math.floor(startTimestamp / 1000);
    // const toDate = Math.floor(endTimestamp / 1000);
    let kots = [];
    kots = await connection.KOT.findAll({
      include: [
        {
          model: connection.KOTItem,
          as: 'kotItems',
          include: {
            model: connection.KotItemOption,
            as: 'addons',
          },
        },
      ],
      where: {
        store_id: params.store_id,
        status: 5,
        in_time: {
          [connection.Sequelize.Op.between]: [fromDate, toDate],
        },
      },
    });
    const kotitemWhere = {};
    const { assignedKitchedeps } = params;
    if (assignedKitchedeps) {
      const depfilters = String(assignedKitchedeps).split(',');
      Object.assign(kotitemWhere, {
        kitchen_dept: {
          [connection.Sequelize.Op.in]: depfilters,
        },
      });
    }

    const filters = [8];
    filters.push(...ONLINE_PLATFORMS);

    const settledOrders = await connection.Bill.findAll({
      attributes: [
        'created_time',
        'order_id',
        'bill_number',
        'billing_type',
        ['order_kotflag', 'order_flag'],
        'user_id',
        'instructions',
        'extra_details',
        'delivery_type',
        'table_name',
        'table_id',
        ['cust_name', 'customer_name'],
        ['phone', 'customer_phone'],
        'app_source',
      ],
      where: {
        billing_type: {
          [connection.Sequelize.Op.in]: filters,
        },
        store_id: params.store_id,
        order_kotflag: 1,
        actual_created_time: {
          [connection.Sequelize.Op.between]: [fromDate, toDate],
        },
      },
      include: [
        {
          as: 'tmpos_order_child',
          model: connection.BillItem,
          // attributes: ['id', 'title', 'quantity'],
          attributes: [
            'id',
            'title',
            'quantity',
            ['item_note', 'note'],
            'category_name',
            'alternative_title',
          ],
          include: [
            {
              as: 'order_child_options',
              model: connection.BillItemOption,
            },
          ],
          where: kotitemWhere,
        },
        {
          model: connection.KOT,
          attributes: [
            ['note', 'instructions'],
            'persons',
            'kot_number',
            'kot_id',
            'is_pre_order',
            'billing_type',
            'bill_number',
            'order_id',
            'customer_name',
          ],
        },
      ],
    });
    if (settledOrders) {
      kots.push(...settledOrders);
    }
    return kots;
  } catch (error) {
    console.error('Error while fetching served kots', error);
  }
  return undefined;
}

module.exports = {
  updateItemActiveStatus,
  updateCategoriesActiveStatus,
  getKDSMenu,
  getServedKOTs,
};
