const { sleep } = require('../../src/com/tmbill/main_controllers/Utils');

async function mockSyncrequest(data) {
  try {
    const orderssyncList = data.list;
    const kot_list = data.kot_list;
    const storeId = data.store_id;
    const billidstoSync = [];
    const kotToSync = [];

    if (orderssyncList && orderssyncList.length) {
      for (let index = 0; index < orderssyncList.length; index++) {
        billidstoSync.push(orderssyncList[index].order_id);
        await sleep(500);
      }
    }

    if (kot_list && kot_list.length) {
      for (let index = 0; index < kot_list.length; index++) {
        const kot = kot_list[index];
        kotToSync.push(kot.kot_uniqueid);
        await sleep(100);
      }
    }

    return {
      status: 200,
      ids: [],
      billidstoSync: billidstoSync,
      errors: 0,
      kotError: 0,
      kotSyncList: kotToSync,
      message: 'Order sync successfully',
    };
  } catch (error) {
    console.error(error);
    return {};
  }
}

module.exports = {
  mockSyncrequest,
};
