const { ipcMain } = require('electron');
const { MENU_MANAGEMENT_MESSAGES } = require('../../util/IPC_Messages');
const connection = require('../../js/database');
const { getitemcatstoInclude } = require('../../js/AccesslevelManager');
const { where } = require('sequelize');
// const { getitemcatstoInclude } = require('../../js/AccesslevelManager');
let stringConstructor = 'test'.constructor;

ipcMain.on(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, async (event, params) => {
  let response = {};
  try {
    if (connection) {
      // params = JSON.parse(params);
      // switch (params.menuOptionType) {
      // case 1:

      let itemsWherequery = { store_id: global.storeDetails.store_id };

      // const catwhereData = { store_id: global.storeDetails.store_id };
      // let catstoInclude = getitemcatstoInclude();
      // if (
      //   catstoInclude &&
      //   Array.isArray(catstoInclude) &&
      //   catstoInclude.length > 0
      // ) {
      //   itemsWherequery.category_ref_ids = {
      //     [connection.Sequelize.Op.in]: catstoInclude,
      //   };
      //   Object.assign(catwhereData, {
      //     category_refid: {
      //       [connection.Sequelize.Op.in]: catstoInclude,
      //     },
      //   });
      // }
      let categories = await connection.Category.findAll({
        raw: true,
        order: [['category_sort', 'ASC']],
        where: { store_id: global.storeDetails.store_id },
      });

      let activeCategories = await connection.Category.findAll({
        raw: true,
        include: {
          model: connection.Item,
          attributes: ['active', 'category_ref_ids', 'item_id'],
          where: {
            active: 1,
            store_id: global.storeDetails.store_id,
          },
          on: {
            category_refid: connection.sequelize.literal(
              'mpos_categories.category_refid = mpos_items.category_ref_ids',
            ),
          },
          required: false,
        },
        distinct: true,
        group: ['mpos_categories.category_refid'],
        having: connection.Sequelize.literal('mpos_items.active = 1'),
        order: [['category_sort', 'ASC']],
        where: { store_id: global.storeDetails.store_id },
      });
      response.categories = categories;

      function updateCategoriesIsActive(categories, activeCategories) {
        // Map active category_refid to quickly check presence
        const activeCategoryRefids = activeCategories.map(
          (category) => category.category_refid,
        );

        // Update is_active field for each category
        categories.forEach((category) => {
          // Check if category_refid exists in activeCategoryRefids
          if (activeCategoryRefids.includes(category.category_refid)) {
            category.is_active = 1; // Set is_active to 1
          } else {
            category.is_active = 0; // Set is_active to 0
          }
        });
      }

      updateCategoriesIsActive(categories, activeCategories);
      response.categories = categories;

      let items = await connection.Item.findAll({
        raw: true,
        where: itemsWherequery,
      });
      response.items = items;

      let menu_id = await connection.Item.findOne({
        raw: true,
        attributes: ['tmpos_menu_id'],
        where: {
          store_id: global.storeDetails.store_id,
        },
      });
      response.menu_id = menu_id;

      // }
    }
  } catch (error) {}
  event.reply(
    MENU_MANAGEMENT_MESSAGES.GET_MENUDATA_REPLY,
    JSON.stringify(response),
  );
});

//update item
async function updateItemDetails(item) {
  try {
    let result = await connection.Item.update(item, {
      where: {
        item_refid: item.item_refid,
        store_id: global.storeDetails.store_id,
      },
    });
    return result;
  } catch (error) {
    console.log(error);
  }
}

//update item
async function addNewItemLocally(item) {
  try {
    let result = await connection.Item.create(item);
    return result;
  } catch (error) {
    console.log(error);
  }
}

//add new category
async function addNewCategoryLocally(category) {
  try {
    let result = await connection.Category.create(category);
    if (result) {
      let currentAccesslevels;
      if (global && global.storeDetails && global.storeDetails.access_levels) {
        if (
          global.storeDetails.access_levels.constructor === stringConstructor
        ) {
          currentAccesslevels = JSON.parse(global.storeDetails.access_levels);
        } else {
          currentAccesslevels = global.storeDetails.access_levels;
        }
      }
      let categories = currentAccesslevels.order_window.item_categories;
      if (categories && categories.length) {
        let item_categories = categories + ',' + category.category_refid;
        //update category in access level
        let user = await connection.Store.findOne({
          raw: true,
          attributes: ['access_levels'],
          where: {
            store_id: global.storeDetails.store_id,
            username: global.storeDetails.username,
          },
        });

        let user_access_levels = JSON.parse(user.access_levels);
        if (
          user_access_levels.order_window.item_categories &&
          user_access_levels.order_window.item_categories.length
        ) {
          Object.assign(user_access_levels.order_window, { item_categories });
          let categoryUpdateResult = await connection.Store.update(
            { access_levels: user_access_levels },
            {
              where: {
                store_id: global.storeDetails.store_id,
                username: global.storeDetails.username,
              },
            },
          );

          Object.assign(global.storeDetails, {
            access_levels: user_access_levels,
          });
        }
      }
    }
    return result;
  } catch (error) {
    console.log(error);
  }
}

//add new category without access level
async function addNewCategoryLocallyWithoutAccessLevel(category) {
  try {
    let result = await connection.Category.create(category);
    return result;
  } catch (error) {
    console.log(error);
  }
}

//add new category
async function addNewKitchenDeptLocally(kitchenDept) {
  try {
    let result = await connection.KitchenDepartment.create(kitchenDept);
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function updateCategoryStatusLocally(params) {
  try {
    let result = await connection.Category.update(
      { is_active: params.is_active },
      {
        where: {
          category_refid: {
            [connection.Sequelize.Op.in]: params.category_id,
          },
          store_id: global.storeDetails.store_id,
        },
      },
    );
    await connection.Item.update(
      { active: params.is_active },
      {
        where: {
          category_ref_ids: {
            [connection.Sequelize.Op.in]: params.category_id,
          },
          store_id: global.storeDetails.store_id,
        },
      },
    );
    return result;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  updateItemDetails,
  addNewItemLocally,
  updateCategoryStatusLocally,
  addNewCategoryLocally,
  addNewKitchenDeptLocally,
  addNewCategoryLocallyWithoutAccessLevel,
};
