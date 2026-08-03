const { getHeadersformpos } = require('../services/MiscServices');
const { sendLivesyncrequest } = require('../services/SyncService');
const { apiCall } = require('../services/APIService');
const { Bill, Sequelize, PlatformMapping } = require('../js/database');

async function paymentDiffcallAPI() {
  try {
    if (!global.storeDetails) {
      setTimeout(paymentDiffcallAPI, 3000);
      return;
    }
    const startDate = global
      .moment()
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    const endDate = global.moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    if (startDate && endDate) {
      const result = await apiCall.post(
        global.Config.links.orderpaymentDifference,
        {
          store_id: global.storeDetails.store_id,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: getHeadersformpos(),
        },
      );

      if (result?.data?.status === 200 && result?.data?.data?.length) {
        let whereData = [];
        whereData = [...result.data.data];
        if (
          result.data.zeroBillNumberData &&
          result.data.zeroBillNumberData.length
        ) {
          whereData = [...result.data.zeroBillNumberData];
        }
        const response = await Bill.update(
          {
            sync_status: 0,
          },
          {
            where: {
              order_id: {
                [Sequelize.Op.in]: whereData,
              },
            },
          },
        );

        if (response) {
          sendLivesyncrequest(true);
        }
      }
    }
  } catch (error) {
    console.log('Message=Payment diff API call error', error);
  }
}

// check order total payment total difference
async function checkOrderPaymentTotalDiff() {
  await paymentDiffcallAPI();
  setInterval(async () => {
    await paymentDiffcallAPI();
  }, 10800000); // 10800000, 3 hour
}

async function getPlatformCatalogueitems() {
  const platformCatalogueitems = [];
  const platformCatalogueCategories = [];
  const platformMappingDetails = await PlatformMapping.findAll({
    raw: true,
    where: {
      store_id: global.storeDetails.store_id,
    },
  });

  if (platformMappingDetails && platformMappingDetails.length) {
    platformMappingDetails.forEach(async (platform) => {
      const axiosResponse = await apiCall.post(
        global.Config.links.getPlatformCatalogue,
        {
          store_id: global.storeDetails.store_id,
          platform_store_id: platform.platform_store_id,
          platform: platform.platform,
        },
        {
          headers: getHeadersformpos(),
        },
      );

      const response = axiosResponse.data;
      if (response && response?.result?.items) {
        platformCatalogueitems.push(...response.result.items);
      }
      if (response && response?.result?.category) {
        platformCatalogueCategories.push(...response.result.category);
      }
      if (response && response.result) {
        global.mainWindow.webContents.send('get-platform-menu', {
          platformCatalogueitems,
          platformCatalogueCategories,
        });
      }
    });
  }

  return {
    platformItems: platformCatalogueitems,
    platformCategories: platformCatalogueCategories,
  };
}

async function reduceBackendStock(itemsData) {
  try {
    const payload = {
      tmpos_id: global.storeDetails.tmpos_id,
      store_id: global.storeDetails.store_id,
      menu_id: global.menu_id,
      items: itemsData,
    };
    const response = await apiCall.post(
      global.Config.links.updateStock,
      payload,
      {
        headers: getHeadersformpos(),
      },
    );

    console.log('response::', response);
  } catch (error) {
    console.log(`Message="Error while updating stock" Error=`, error?.message);
  }
}
module.exports = {
  checkOrderPaymentTotalDiff,
  paymentDiffcallAPI,
  getPlatformCatalogueitems,
  reduceBackendStock,
};
