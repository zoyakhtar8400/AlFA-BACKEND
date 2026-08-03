const { ItemNoteGroups } = require('../js/database');
const { apiCall } = require('./APIService');
const { getHeadersformpos } = require('./MiscServices');

async function deleteItemNoteGroupsData(storeID) {
  try {
    await ItemNoteGroups.destroy({
      where: {
        store_id: storeID,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function addItemNoteGroupsDataToDatabase(data) {
  console.log('Order Types adding to db');
  if (data) {
    try {
      await ItemNoteGroups.bulkCreate(data);
    } catch (err) {
      console.error(err);
    }
  }
}

async function startloadItemNotesData(params) {
  try {
    const { data: result } = await apiCall.post(
      global.Config.links.loadItemNotesData,
      {
        store_id: global.storeDetails.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
        menu_id: global.menu_id,
      },
      { headers: getHeadersformpos() },
    );
    if (result && result.status) {
      if (result.status === 200 && result.item_notes) {
        await deleteItemNoteGroupsData(global.storeDetails.store_id);
        await addItemNoteGroupsDataToDatabase(result.item_notes);
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
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.status)) {
      global.reloginfromremote();
    }
  }
}

module.exports = {
  startloadItemNotesData,
};
