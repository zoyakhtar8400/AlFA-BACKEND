/* eslint-disable camelcase */
const express = require('express');
const { safeParseformain } = require('../main_controllers/Utils');
const {
  getKotitemnotes,
  addItemnote,
  deleteItemnote,
} = require('../main_controllers/Order');
const { HttpStatusCode } = require('axios');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();

async function getCategories(params = {}) {
  const catwhereData = { is_active: 1 };
  if (params.store_id) {
    catwhereData[global.serverdbConnection.Sequelize.Op.or] = [
      { store_id: params.store_id },
      { store_id: 'STORE_1' },
      { store_id: null }
    ];
  }
  const rawcatstoInclude = params.includeCategories;
  if (rawcatstoInclude) {
    const catstoInclude = String(rawcatstoInclude).split(',');
    if (
      catstoInclude &&
      Array.isArray(catstoInclude) &&
      catstoInclude.length > 0
    ) {
      catwhereData.category_refid = {
        [global.serverdbConnection.Sequelize.Op.in]: catstoInclude,
      };
    }
  }

  const categories = await global.serverdbConnection.Category.findAll({
    where: catwhereData,
  });
  return categories;
}

async function getTables(params = {}) {
  const storeWhere = params.store_id ? { store_id: params.store_id } : {};
  const departmentWheredata = params.store_id ? { store_id: params.store_id } : {};
  const rawdepstoinclude = params.includeDepartments;
  if (rawdepstoinclude) {
    const depstoinclude = String(rawdepstoinclude).split(',');
    if (depstoinclude && depstoinclude.length > 0) {
      departmentWheredata.id = {
        [global.serverdbConnection.Sequelize.Op.in]: depstoinclude,
      };
    }
  }

  const tables = await global.serverdbConnection.Table.findAll({
    include: [
      {
        model: global.serverdbConnection.Department,
        attributes: ['department_name'],
        where: departmentWheredata,
        required: false,
      },
    ],
    where: storeWhere,
  });
  return tables;
}
/**
 * Returns the catalogue like MPOS.
 * @param {Params} params
 */
async function getCatalogues(params) {
  try {
    const catstoInclude = params.includeCategories;
    const catwhereData = { store_id: params.store_id, is_active: 1 };
    let customer;
    if (
      catstoInclude &&
      Array.isArray(catstoInclude) &&
      catstoInclude.length > 0
    ) {
      catwhereData.category_refid = {
        [global.serverdbConnection.Sequelize.Op.in]: catstoInclude,
      };
    }

    const categories = await getCategories(params);
    const itemWhere = { active: 1 };
    if (params.store_id) {
      itemWhere[global.serverdbConnection.Sequelize.Op.or] = [
        { store_id: params.store_id },
        { store_id: 'STORE_1' },
        { store_id: null }
      ];
    }

    const items = await global.serverdbConnection.Item.findAll({
      include: [
        {
          model: global.serverdbConnection.Category,
          attributes: ['category_name'],
          required: false,
        },
        {
          model: global.serverdbConnection.ProductGroup,
          attributes: ['product_group_name'],
          required: false,
        },
      ],
      where: itemWhere,
    });

    const storeWhere = params.store_id ? {
      [global.serverdbConnection.Sequelize.Op.or]: [
        { store_id: params.store_id },
        { store_id: 'STORE_1' },
        { store_id: null }
      ]
    } : {};

    const option_group = await global.serverdbConnection.OptionGroup.findAll({
      where: storeWhere,
    });
    const options = await global.serverdbConnection.Options.findAll({
      where: storeWhere,
    });
    const discount = await global.serverdbConnection.Discount.findAll({
      where: storeWhere,
    });

    if (!params.donotaddcustomers) {
      customer = await global.serverdbConnection.Customer.findAll({
        where: storeWhere,
      });
    }

    const table_dept = await global.serverdbConnection.Department.findAll({
      where: storeWhere,
    });

    const tables = await getTables(params);

    const payment_mode = await global.serverdbConnection.Payment.findAll({
      where: storeWhere,
    });

    const charges = await global.serverdbConnection.Charges.findAll({
      where: storeWhere,
    });

    const delivery_boys = await global.serverdbConnection.DeliveryBoy.findAll({
      where: storeWhere,
    });

    let kitchenStoreWhere = {};
    if (params.store_id) {
      let numStoreId = null;
      if (typeof params.store_id === 'string' && params.store_id.startsWith('STORE_')) {
        numStoreId = parseInt(params.store_id.replace('STORE_', ''), 10);
      } else if (!isNaN(Number(params.store_id))) {
        numStoreId = Number(params.store_id);
      }
      kitchenStoreWhere = {
        [global.serverdbConnection.Sequelize.Op.or]: [
          ...(numStoreId !== null ? [{ store_id: numStoreId }] : []),
          { store_id: 1 },
          { store_id: null }
        ]
      };
    }

    const kitchen_dept =
      await global.serverdbConnection.KitchenDepartment.findAll({
        where: kitchenStoreWhere,
      });

    const expense_categories =
      await global.serverdbConnection.ExpensesCategory.findAll({
        where: storeWhere,
      });
    const waiters = await global.serverdbConnection.Waiter.findAll({
      raw: true,
      where: storeWhere,
      attributes: ['id', 'name', 'phone', 'username'],
    });

    const multipricing_settings =
      await global.serverdbConnection.MultipricingSettings.findAll({
        where: storeWhere,
      });
    const modifiers = await global.serverdbConnection.Modifiers.findAll({
      where: storeWhere,
    });

    const modifiers_group_mapping =
      await global.serverdbConnection.ModifierGroupMapping.findAll({
        where: storeWhere,
      });

    const modifier_groups =
      await global.serverdbConnection.ModifierGroups.findAll({
        where: storeWhere,
      });

    const modifier_variant =
      await global.serverdbConnection.ModifierVarient.findAll({
        where: storeWhere,
      });

    const modifier_group_items_mapping =
      await global.serverdbConnection.ModifierGroupItemsMapping.findAll({
        where: storeWhere,
      });

    const taxes = await global.serverdbConnection.Tax.findAll({
      raw: true,
      where: storeWhere,
    });
    const catalouge = {
      categories,
      items,
      option_group,
      options,
      discount,
      customer,
      table_dept,
      tables,
      payment_mode,
      charges,
      delivery_boys,
      kitchen_dept,
      expense_categories,
      waiters,
      multipricing_settings,
      modifiers,
      modifiers_group_mapping,
      modifier_groups,
      modifier_variant,
      modifier_group_items_mapping,
      // itemPrices,
      taxes,
    };
    return catalouge;
  } catch (error) {
    console.log(error);

    return {};
  }
}

async function getItemPricesForCsk(params) {
  try {
    const itemPrices = [];
    const dineinPrices = await global.serverdbConnection.ItemPrices.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
        type: 1,
      },
    });

    const takeawayPrices = await global.serverdbConnection.ItemPrices.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
        type: 2,
        ref: 2,
      },
    });

    itemPrices.push(...dineinPrices, ...takeawayPrices);
    return itemPrices;
  } catch (error) {
    console.error('Error whilet fetching item prices for csk', error);
  }
  return undefined;
}

async function getItemMultiPricesForCsk(params) {
  try {
    const itemPrices = await global.serverdbConnection.ItemPrices.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
      },
    });

    return itemPrices;
  } catch (error) {
    console.error('Error whilet fetching item prices for csk', error);
  }
  return undefined;
}

async function getCustomersForCsk(params) {
  try {
    // const customers = await global.serverdbConnection.Customer.findAll({
    //   where: {
    //     store_id: params.store_id,
    //   },
    // });

    const customers = await global.serverdbConnection.Customer.findAll({
      where: {
        store_id: params.store_id,
        ...(params.phone && {
          phone: params.phone,
        }),
        ...(params.search && {
          [global.serverdbConnection.Sequelize.Op.or]: [
            {
              name: {
                [global.serverdbConnection.Sequelize.Op.like]:
                  `%${params.search}%`,
              },
            }, // contains match
            {
              phone: {
                [global.serverdbConnection.Sequelize.Op.like]:
                  `${params.search}%`,
              },
            }, // starts with match
          ],
        }),
      },
      ...(params.limit && {
        limit: Number(params.limit),
      }),
    });

    return customers;
  } catch (error) {
    console.error('Error whilet fetching customers for csk', error);
  }
  return undefined;
}

router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  const data = await getCatalogues(req.query || {});
  response.data = data;
  response.setStatus(200);
  res.json(response);
});

router.get('/getItemPrices', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    const data = await getItemPricesForCsk(req.query);
    response.data = data;
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.get('/getMultiPrice', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    const data = await getItemMultiPricesForCsk(req.query);
    response.data = data;
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.get('/getCustomers', async (req, res) => {
  const response = new ResponseMessage(200, '');
  if (req.query.store_id) {
    const data = await getCustomersForCsk(req.query);
    response.data = data;
    response.setStatus(200);
  } else {
    response.setStatus(400);
    response.setMessage('Please provide store id.');
  }
  res.json(response);
});

router.post('/getItemNote', async (req, res) => {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    if (req.body) {
      const content = safeParseformain(req.body);
      content.store_id = global.storeDetails.store_id;
      const result = await getKotitemnotes(content);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
        ...result,
      });
    }
  } catch (error) {
    console.error(
      `Message="Error While fetching Item Note" Payload="${JSON.stringify(req.body)}"`,
      error,
    );
  }
  res.json(response);
});

router.post('/addItemNote', async (req, res) => {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    const data = safeParseformain(req.body);
    if (data) {
      await addItemnote(data);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
    }
    console.warn(
      `Message="Invalid Add Item Note Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Adding Item Note" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  res.json(response);
});

router.post('/DeleteItemNote', async (req, res) => {
  const response = { status: HttpStatusCode.BadRequest };
  try {
    if (req.body) {
      await deleteItemnote(req.body);
      Object.assign(response, {
        status: HttpStatusCode.Ok,
      });
      return response;
    }
    console.warn(
      `Message="Invalid Delete Item Note Payload" Payload="${JSON.stringify(req.body)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Deleting Item Note" Payload="${JSON.stringify(req.body)}"`,
      error,
    );
  }
  res.json(response);
});

module.exports = router;
