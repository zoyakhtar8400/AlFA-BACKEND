/* eslint-disable no-await-in-loop */
const { ItemNoteGroups, OrderTypes } = require('../js/database');
const { apiCall } = require('./APIService');

async function deleteOrderTypesData(storeID) {
  try {
    await OrderTypes.destroy({
      where: {},
      // optional: truncate: true
    });
  } catch (err) {
    console.error(err);
  }
}

async function addItemNoteGroupsDataToDatabase(data) {
  if (data) {
    try {
      await OrderTypes.bulkCreate(data);
    } catch (err) {
      console.error(err);
    }
  }
}

async function updateAlternativeTitle(data) {
  if (data) {
    try {
      if (data && data.length) {
        for (let i = 0; i < data.length; i++) {
          const orderType = data[i];
          await OrderTypes.update(
            {
              alternative_title: orderType.alternative_title,
            },
            {
              where: {
                id: orderType.id,
              },
            },
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}

async function startloadMiscDetailsData() {
  try {
    const response = await apiCall.get(
      'https://cdn.tmbill.com/ordertypes/en.json',
    );
    const data = response.data;
    if (data && data.length) {
      const result = data.map((item) => ({
        order_type: item.title,
        id: item.value,
        store_id: global.storeDetails.store_id,
      }));

      if (result && result.length) {
        await deleteOrderTypesData(global.storeDetails.store_id);
        await addItemNoteGroupsDataToDatabase(result);

        if (global.selectedLanguage !== 'en') {
          const alternativeResult = await apiCall.get(
            `https://cdn.tmbill.com/ordertypes/${global.selectedLanguage}.json`,
          );
          const alternativedata = alternativeResult.data;
          if (alternativedata && alternativedata.length) {
            const formattedData = alternativedata.map((item) => ({
              alternative_title: item.title,
              id: item.value,
            }));

            await updateAlternativeTitle(formattedData);
          }
        }
        return;
      }
    }
  } catch (error) {
    console.error('Error fetching from CDN:', error.message);
  }
}

module.exports = {
  startloadMiscDetailsData,
};
