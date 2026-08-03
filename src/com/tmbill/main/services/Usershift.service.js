/* eslint-disable camelcase */
const { Op } = require('sequelize');
const { UserShift, StartcloseDay, Bill } = require('../../js/database');
const { syncStartenddaydata } = require('../../services/SyncService');

async function requestCheckUsershiftStarted(data) {
  try {
    if (data) {
      const response = await UserShift.checkIfshiftstarted(data);
      return response;
    }
    console.warn(
      `Message="Invalid check user shift started data" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While checking user shift started" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestStartDay(data) {
  try {
    if (data) {
      // if order is placed after previous close day and befor starting new day then set start_day_date before this order time
      if (data.previous_close_day_date) {
        try {
          const orders = await Bill.findAll({
            raw: true,
            attributes: ['created_time'],
            where: {
              created_time: {
                [Op.gt]: data.previous_close_day_date, // Use Op.gt for greater than comparison
              },
            },
          });
          if (orders && orders.length) {
            const { created_time } = orders[0];
            const oneMinuteLess = created_time - 60 * 1000;
            if (oneMinuteLess) {
              Object.assign(data, {
                start_day_date: oneMinuteLess,
              });
            }
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        const startendRecord = await StartcloseDay.findAll({});
        if (startendRecord && startendRecord.length === 0) {
          const orders = await Bill.findAll({
            raw: true,
            attributes: ['created_time'],
          });
          if (orders && orders.length) {
            const { created_time } = orders[0];
            const oneMinuteLess = created_time - 60 * 1000;
            if (oneMinuteLess) {
              Object.assign(data, {
                start_day_date: oneMinuteLess,
              });
            }
          }
        }
      }
      const response = await StartcloseDay.addStartday(data);

      const lastRecord = await UserShift.findOne({
        order: [['id', 'DESC']],
      });
      // if order is placed after previous close day and befor starting new day then set start_day_date before this order time
      if (lastRecord && lastRecord.shift_end_date) {
        try {
          const orders = await Bill.findAll({
            raw: true,
            attributes: ['created_time'],
            where: {
              created_time: {
                [Op.gt]: lastRecord.shift_end_date, // Use Op.gt for greater than comparison
              },
            },
          });
          if (orders && orders.length) {
            const { created_time } = orders[0];
            const oneMinuteLess = created_time - 60 * 1000;
            if (oneMinuteLess) {
              Object.assign(data, {
                shift_start_date: oneMinuteLess,
              });
            }
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        const startendRecord = await UserShift.findOne({});
        if (!startendRecord) {
          const orders = await Bill.findAll({
            raw: true,
            attributes: ['created_time'],
          });
          if (orders && orders.length) {
            const { created_time } = orders[0];
            const oneMinuteLess = created_time - 60 * 1000;
            if (oneMinuteLess) {
              Object.assign(data, {
                shift_start_date: oneMinuteLess,
              });
            }
          }
        }
      }
      await UserShift.addNewshift(data);
      syncStartenddaydata({
        store_id: global.storeDetails.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
      });
      return response;
    }
    console.warn(
      `Message="Invalid start day data" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While day start" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

async function requestCheckForStartDay(data) {
  try {
    // if (data) {
    const response = await StartcloseDay.checkforStartday();
    return response;
    // }
    // console.warn(
    //   `Message="Invalid check start day data" Payload="${JSON.stringify(data)}"`,
    // );
  } catch (error) {
    console.error(
      `Message="Error While checking day start" Payload="${JSON.stringify(data)}"`,
      error,
    );
  }
  return undefined;
}

module.exports = {
  requestCheckUsershiftStarted,
  requestStartDay,
  requestCheckForStartDay,
};
