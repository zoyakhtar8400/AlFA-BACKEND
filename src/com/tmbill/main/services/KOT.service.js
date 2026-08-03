/* eslint-disable no-console */
const { ResponseMessage } = require('../../error/ResponseMessage');
const { KOT } = require('../../js/database');
const {
  changeOrderTypeAfterSaveKot,
} = require('../../main_controllers/ChangeOrderType');
const { fetchKOTItemsRequest } = require('../../main_controllers/KOT/index');
const {
  getOldKOTdetails,
  updateOldkot,
  setinactiveForoldkot,
} = require('../../main_controllers/OldKOT');
const {
  saveKOT,
  changeTableforkot,
  transferKOTItem,
  getKotNumberForTransferItem,
  checkIsKotActiveForTable,
  checkIsDineinKotActive,
} = require('../../main_controllers/Order');
const {
  updatekotItems,
} = require('../../main_controllers/Utils/itemLevelDiscount');
const { sleep } = require('../../util/MiscUtil');

async function requestSavekot(data) {
  const response = new ResponseMessage(200, '');
  try {
    if (data) {
      if (global.isSaveKOtInProgress) {
        await sleep(300);
      }
      const responseData = await saveKOT(data);
      global.isSaveKOtInProgress = false;
      return responseData;
    }
    console.warn(
      `Message="Invalid Save KOT Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Saving KOT"`, error);
    response.setStatus(400);
    response.setMessage('');
  }
  return response;
}

async function requestGetoldkotdetails(data) {
  try {
    if (data && data.table_id) {
      const response = await getOldKOTdetails(data);
      return response;
    }
    console.warn(
      `Message="Invalid Get Old Details Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Get Old Details"`, error);
  }
  return undefined;
}

async function requestChangekottable(data) {
  try {
    if (data) {
      const status = await changeTableforkot(data);
      return status;
    }
    console.warn(
      `Message="Invalid Change KOT Table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Change KOT Table"`, error);
  }
  return undefined;
}

async function requestupdateOldkotitem(data) {
  try {
    if (data) {
      const result = await updateOldkot(data);
      return result;
    }
    console.warn(
      `Message="Invalid Update KOT Item Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Update KOT Item"`, error);
  }
  return undefined;
}

async function requestSetinactiveKOT(data) {
  try {
    if (data) {
      const result = await setinactiveForoldkot(data);
      return {
        table_id: data.table_id,
        deleteTable: data.deleteTable,
        tableName: data.tableName,
        ...result,
      };
    }
    console.warn(
      `Message="Invalid Set Inactive KOT Status Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Setting Inactive KOT Status"`, error);
  }
  return undefined;
}

async function requestTransferKOT(data) {
  try {
    if (data) {
      const response = await transferKOTItem(data);
      return response;
    }
    console.warn(
      `Message="Invalid Transfer KOT Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Transferring KOT Payload Status"`,
      error,
    );
  }
  return undefined;
}

async function requestGetTransferKOTno(data) {
  try {
    if (data) {
      const response = await getKotNumberForTransferItem(data);
      return response;
    }
    console.warn(
      `Message="Invalid Get Transfer KOT Number Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Getting Transfer KOT Number Payload"`,
      error,
    );
  }
  return undefined;
}

async function requestGetkotstatusfortable(data) {
  try {
    if (data && data.table_id) {
      const kotResult = await KOT.findAll({
        attributes: ['status', 'kot_id'],
        where: {
          table_id: data.table_id,
          is_active: 1,
        },
        raw: true,
      });
      const kotStatus = kotResult.map((kot) => kot.status);
      return kotStatus;
    }
    console.warn(
      `Message="Invalid Get KOT Status for table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Getting KOT Status for table Payload"`);
    console.error(error);
  }
  return undefined;
}

async function requestisKotactivefortable(data) {
  try {
    if (data) {
      const result = await checkIsKotActiveForTable(data);
      return result;
    }
    console.warn(
      `Message="Invalid Get KOT Status for table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Getting KOT Status for table Payload"`);
    console.error(error);
  }
  return undefined;
}

async function requestisDineinKotactive() {
  try {
    const result = await checkIsDineinKotActive();
    return result;
  } catch (error) {
    console.error(`Message="Error While Getting KOT Status for table Payload"`);
    console.error(error);
  }
  return undefined;
}

async function requestItemDiscountAppliedUpdateKotItems(data) {
  try {
    if (data) {
      try {
        // data = JSON.parse(data);
        const response = await updatekotItems(data);
        return response;
      } catch (error) {
        console.log(error);
      }
    }
    console.warn(
      `Message="Invalid item level discount applied update items Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While updating kot items after item level discount applied Payload"`,
    );
    console.error(error);
  }
  return undefined;
}

async function requestChangeOrderTypeAfterSaveKot(data) {
  try {
    if (data) {
      try {
        // data = JSON.parse(data);
        const response = await changeOrderTypeAfterSaveKot(data);
        return response;
      } catch (error) {
        console.log(error);
      }
    }
    console.warn(
      `Message="Invalid change order type Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While change order type Payload"`);
    console.error(error);
  }
  return undefined;
}

async function requestGetKOTItems(data) {
  try {
    if (data) {
      try {
        // data = JSON.parse(data);
        const response = await fetchKOTItemsRequest(data);
        return response;
      } catch (error) {
        console.log(error);
      }
    }
    console.warn(
      `Message="Invalid get order items Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While fetching order items Payload"`);
    console.error(error);
  }
  return undefined;
}

module.exports = {
  requestGetkotstatusfortable,
  requestSavekot,
  requestGetoldkotdetails,
  requestChangekottable,
  requestupdateOldkotitem,
  requestSetinactiveKOT,
  requestTransferKOT,
  requestGetTransferKOTno,
  requestisKotactivefortable,
  requestItemDiscountAppliedUpdateKotItems,
  requestisDineinKotactive,
  requestChangeOrderTypeAfterSaveKot,
  requestGetKOTItems,
};
