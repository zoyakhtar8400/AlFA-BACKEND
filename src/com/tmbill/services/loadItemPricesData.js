const { ItemPrices } = require('../js/database');
const { apiCall } = require('./APIService');
const { getHeadersformpos } = require('./MiscServices');

async function deleteItemPricesData(storeID) {
  try {
    await ItemPrices.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function addItemPricesDataToDatabase(data) {
  console.log('Item prices data adding to db');
  if (data) {
    try {
      await ItemPrices.bulkCreate(data);
    } catch (err) {
      console.error(err);
    }
  }
}

async function startloadItemPricesData(params) {
  try {
    const { data: result } = await apiCall.post(
      global.Config.links.loadItemPricesData,
      {
        store_id: global.storeDetails.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
        menu_id: global.menu_id,
      },
      { headers: getHeadersformpos() },
    );
    if (result && result.status) {
      if (result.status === 200 && result.data) {
        await deleteItemPricesData(global.storeDetails.store_id);
        await addItemPricesDataToDatabase(
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
  startloadItemPricesData,
};
