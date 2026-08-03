const { Op, where } = require('sequelize');
const { default: axios } = require('axios');
const connection = require('../../js/database');
const { getHeadersformpos } = require('../../services/MiscServices');
const { startGetDateJob } = require('../../util/Jobs');
const { apiCall } = require('../../services/APIService');

async function checkBillNumberResetIsValidOrNot(params) {
  try {
    if (params.bill_number === 1 || params.barSection_bill_number === 1) {
      // check bill number is present
      let normalOrder;
      let barSectionOrder;
      let onlineOrder;
      let order;
      let isOrderNumberResetted;
      if (
        Number(global.storeDetails.resetBillAfterDays) ||
        Number(global.storeDetails.resetBillAfterDays) == 30 ||
        Number(global.storeDetails.resetBillAfterDays) == 365
      ) {
        const checkBillsAfterDate = moment(
          global.storeDetails.reset_bill_time,
          'x',
        )
          .subtract(global.storeDetails.resetBillAfterDays, 'days')
          .format('x');

        const checkBillsBeforeDate = global.storeDetails.reset_bill_time;
        if (params.bill_number == 1) {
          normalOrder = await connection.Bill.findOne({
            raw: true,
            where: {
              bill_number: 1,
              bill_prefix_for: 1,
              [connection.Sequelize.Op.and]: [
                {
                  created_time: {
                    [Op.gt]: checkBillsAfterDate,
                  },
                },
                {
                  created_time: {
                    [Op.lt]: checkBillsBeforeDate,
                  },
                },
              ],
            },
          });
        }

        if (
          params.barSection_bill_number == 1 &&
          storeDetails.is_bar_section_billing
        ) {
          barSectionOrder = await connection.Bill.findOne({
            raw: true,
            where: {
              bill_number: 1,
              bill_prefix_for: 3,
              [connection.Sequelize.Op.and]: [
                {
                  created_time: {
                    [Op.gt]: checkBillsAfterDate,
                  },
                },
                {
                  created_time: {
                    [Op.lt]: checkBillsBeforeDate,
                  },
                },
              ],
            },
          });
        }

        if (params.secondary_bill_number == 1) {
          onlineOrder = await connection.Bill.findOne({
            raw: true,
            where: {
              bill_number: 1,
              bill_prefix_for: 2,
              [connection.Sequelize.Op.and]: [
                {
                  created_time: {
                    [Op.gt]: checkBillsAfterDate,
                  },
                },
                {
                  created_time: {
                    [Op.lt]: checkBillsBeforeDate,
                  },
                },
              ],
            },
          });
        }
        if (params.order_number == 1) {
          order = await connection.Bill.findOne({
            raw: true,
            attributes: ['extra_details'],
            order: [['id', 'DESC']],
            where: {
              [connection.Sequelize.Op.and]: [
                {
                  created_time: {
                    [Op.gt]: checkBillsAfterDate,
                  },
                },
                {
                  created_time: {
                    [Op.lt]: checkBillsBeforeDate,
                  },
                },
              ],
            },
            limit: 1,
          });
          if (order?.extra_details?.order_number == 1) {
            isOrderNumberResetted = true;
          }
        }

        let isOrderPresent = false;
        let isBarSectionOrderPresent = false;
        let isOnlineOrderPresent = false;
        if (normalOrder) isOrderPresent = true;
        if (barSectionOrder) isBarSectionOrderPresent = true;
        if (onlineOrder) isOnlineOrderPresent = true;

        if (isOrderPresent) {
          const latesBilllNumber = await connection.Bill.findOne({
            raw: true,
            attributes: ['bill_number'],
            order: [['id', 'DESC']],
            where: {
              store_id: global.storeDetails.store_id,
              bill_prefix_for: 1,
            },
            limit: 1,
          });
          if (latesBilllNumber && latesBilllNumber.bill_number) {
            await connection.Tempnumbers.update(
              {
                bill_number: latesBilllNumber.bill_number + 1,
              },
              {
                where: {
                  id: 1,
                },
              },
            );
            console.log(
              `Message="Bill number reset twice. Corrected it in tempnumbers"`,
            );
          }
        }
        if (isBarSectionOrderPresent) {
          const latesBarBilllNumber = await connection.Bill.findOne({
            raw: true,
            attributes: ['bill_number'],
            order: [['id', 'DESC']],
            where: {
              store_id: global.storeDetails.store_id,
              bill_prefix_for: 3,
            },
            limit: 1,
          });

          if (latesBarBilllNumber && latesBarBilllNumber.bill_number) {
            await connection.Tempnumbers.update(
              {
                barSection_bill_number: latesBarBilllNumber.bill_number + 1,
              },
              {
                where: {
                  id: 1,
                },
              },
            );
            console.log(
              `Message="Bar bill number reset twice. Corrected it in tempnumbers"`,
            );
          }
        }
        if (isOnlineOrderPresent) {
          const latesOnlineBilllNumber = await connection.Bill.findOne({
            raw: true,
            attributes: ['bill_number'],
            order: [['id', 'DESC']],
            where: {
              store_id: global.storeDetails.store_id,
              bill_prefix_for: 2,
            },
            limit: 1,
          });

          if (latesOnlineBilllNumber && latesOnlineBilllNumber.bill_number) {
            await connection.Tempnumbers.update(
              {
                secondary_bill_number: latesOnlineBilllNumber.bill_number + 1,
              },
              {
                where: {
                  id: 1,
                },
              },
            );
            console.log(
              `Message="Online bill number reset twice. Corrected it in tempnumbers"`,
            );
          }
        }

        if (isOrderNumberResetted) {
          const latestOrderNumber = await connection.Bill.findOne({
            raw: true,
            attributes: ['extra_details'],
            order: [['id', 'DESC']],
            where: {
              store_id: global.storeDetails.store_id,
            },
            limit: 1,
          });

          if (
            latestOrderNumber &&
            latestOrderNumber?.extra_details &&
            latestOrderNumber?.extra_details?.order_number
          ) {
            await connection.Tempnumbers.update(
              {
                order_number: latestOrderNumber.extra_details.order_number + 1,
              },
              {
                where: {
                  id: 1,
                },
              },
            );
            console.log(
              `Message="Order number reset twice. Corrected it in tempnumbers"`,
            );
          }
        }
      }
    }
  } catch (error) {
    console.log(`Message="Error while checking reset date" Error=${error}`);
  }
}

async function fetchDateFromBackend() {
  try {
    const result = await apiCall.post(
      Config.links.getDate,
      {
        store_id: global.storeDetails.store_id,
      },
      {
        headers: getHeadersformpos(),
      },
    );
    if (result?.data?.status === 200) {
      global.mainWindow.webContents.send('set-date', {
        data: result?.data?.data,
      });
      startGetDateJob();
      return result.data;
    }
  } catch (error) {
    console.log(
      `Message="Error while getting date from backend", error=${error}`,
    );
  }
  return {};
}

module.exports = {
  checkBillNumberResetIsValidOrNot,
  fetchDateFromBackend,
};
