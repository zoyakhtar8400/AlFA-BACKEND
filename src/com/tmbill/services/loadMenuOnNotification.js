/* eslint-disable camelcase */
const { Category, Item } = require('../js/database');
const { getHeadersformpos } = require('./MiscServices');
const { MENU_LOADED_RELOAD_APP } = require('../util/IPC_Messages');
const { apiCall } = require('./APIService');

let isLoadMenuInProgess = false;
/*
 * load menu request from server
 * load only only menu related details
 */
async function startloadCatalogRequestFromServer(params) {
  try {
    if (isLoadMenuInProgess) {
      return;
    }
    isLoadMenuInProgess = true;
    const response = await apiCall.post(
      params.loadmenuLink,
      {
        store_id: params.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
      },
      {
        headers: getHeadersformpos(),
      },
    );
    const result = response.data;
    if (result && result.status) {
      if (result.status == 200 && result.data) {
        await deletestoreDataForMenuOnly(params.connection, params.store_id);
        await addToDatabaseForMenuOnly(
          result.data,
          params.connection,
          params.store_id,
        );
        global.mainWindow.webContents.send(MENU_LOADED_RELOAD_APP, {});
        isLoadMenuInProgess = false;
        // params.event.reply(params.message, 'success');
      } else if (result.status === 401) {
        reloginfromremote();
      } else if (result.status === '301') {
        // params.event.reply(result.msg, 'error');
      }
    }
  } catch (error) {
    isLoadMenuInProgess = false;
    console.log(error);
    if ([401].includes(error?.statusCode)) {
      reloginfromremote();
    }
  } finally {
    isLoadMenuInProgess = false;
  }
}

/**
 * Deletes the current store data, menu related details only
 * @param {DB Connection} connection
 * @param {Store ID} store_id
 */
async function deletestoreDataForMenuOnly(connection, store_id) {
  try {
    await connection.Item.destroy({
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await connection.Category.destroy({
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }

  await connection.Options.destroy({
    where: {
      // NEW STOREWISE CHANGE 17 JAN 2020
      store_id,
    },
  });
  try {
    await connection.OptionGroup.destroy({
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await connection.ProductGroup.destroy({
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await connection.MultipricingSettings.destroy({
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }

  console.log('DB Cleared...');
  return 'success';
}

/**
 *
 * @param {Data to be added} data only menu data
 * @param {*} connection
 * @param {*} store_id
 */
async function addToDatabaseForMenuOnly(data, connection, store_id) {
  console.log('Adding to DB');
  if (data.categories) {
    try {
      await Category.bulkCreate(data.categories);
    } catch (err) {
      console.error(err);
    }
  }

  if (data.hasOwnProperty('items')) {
    try {
      await Item.bulkCreate(data.items);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Option Groups
   */
  if (data.option_group) {
    try {
      await connection.OptionGroup.bulkCreate(data.option_group);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Options
   */
  if (data.options) {
    try {
      await connection.Options.bulkCreate(data.options);
    } catch (err) {
      console.error(err);
    }
  }

  if (
    data.product_groups &&
    Array.isArray(data.product_groups) &&
    data.product_groups.length > 0
  ) {
    for (const group of data.product_groups) {
      group.store_id = store_id;
      group.product_group_id = group.id;

      delete group.id;
      try {
        await connection.ProductGroup.create(group);
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (
    data.multipricing_settings &&
    Array.isArray(data.multipricing_settings) &&
    data.multipricing_settings.length > 0
  ) {
    for (const setting of data.multipricing_settings) {
      try {
        await connection.MultipricingSettings.create(setting);
      } catch (error) {
        console.log(error);
      }
    }
  }
  updateHash(connection, store_id);
}

async function updateHash(connection, store_id) {
  // Update the sync-hash in database
  try {
    const updateData = { sync_hash: global.uniqid() };
    await connection.Store.update(updateData, {
      where: { store_id },
    });
    global.storeDetails.sync_hash = updateData.sync_hash;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  startloadCatalogRequestFromServer,
};
