const {
  Modifiers,
  ModifierGroups,
  ModifierGroupMapping,
  ModifierVarient,
  ModifierGroupItemsMapping,
} = require('../js/database');
const { apiCall } = require('./APIService');
const { getHeadersformpos } = require('./MiscServices');

async function deleteModifiersData(storeID) {
  try {
    await Modifiers.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ModifierGroups.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ModifierGroupMapping.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ModifierGroupItemsMapping.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ModifierVarient.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function addModifiersDataToDatabase(data) {
  console.log('modifiers data adding to db');
  if (data.modifiers) {
    try {
      await Modifiers.bulkCreate(data.modifiers);
    } catch (err) {
      console.error(err);
    }
  }

  if (data.modifierGroups) {
    try {
      await ModifierGroups.bulkCreate(data.modifierGroups);
    } catch (err) {
      console.error(err);
    }
  }

  if (data.modifierGroupMapping) {
    try {
      await ModifierGroupMapping.bulkCreate(data.modifierGroupMapping);
    } catch (err) {
      console.error(err);
    }
  }

  if (data.modifierItemMapping) {
    try {
      await ModifierGroupItemsMapping.bulkCreate(data.modifierItemMapping);
    } catch (err) {
      console.error(err);
    }
  }

  if (data.modifierVariants) {
    try {
      await ModifierVarient.bulkCreate(data.modifierVariants);
    } catch (err) {
      console.error(err);
    }
  }
}

/**
 * Starts the sync process and does the post proceess after
 * data is fetched successfully
 * @param {Parameters} params
 */
async function startloadModifiersData(params) {
  try {
    const { data: result } = await apiCall.post(
      global.Config.links.loadModifiersData,
      {
        store_id: global.storeDetails.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
        menu_id: global.menu_id,
      },
      { headers: getHeadersformpos() },
    );
    if (result && result.status) {
      if (result.status === 200 && result.data) {
        await deleteModifiersData(global.storeDetails.store_id);
        await addModifiersDataToDatabase(
          result.data,
          global.storeDetails.tmpos_id,
        );
        return;
      }
      if (result.status === '303') {
        global.isLoadMenuInProgress = false;
        global.reloginfromremote();
        return;
      }
      if (result.status === '301') {
        // params.event.reply(result.msg, 'error');
        global.isLoadMenuInProgress = false;
        return;
      }
    }
    params.event.reply(params.message, 'error');
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.status)) {
      global.reloginfromremote();
    }
  }
}

module.exports = {
  startloadModifiersData,
};
