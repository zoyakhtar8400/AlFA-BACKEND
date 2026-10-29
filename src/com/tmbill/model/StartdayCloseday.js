/* eslint-disable camelcase */
const { Op } = require('sequelize');
const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const StartcloseDay = sequelize.define(
    util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tmpos_id: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      start_day_date: {
        type: type.TIME,
        allowNull: true,
      },
      day_start_by_user: {
        type: type.STRING,
        allowNull: true,
      },
      day_close_date: {
        type: type.TIME,
        allowNull: true,
      },
      day_close_by_user: {
        type: type.STRING,
        allowNull: true,
      },
      opening_balance: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      prev_closing_balance: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total_expense: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total_sales: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      current_closing_balance: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      created_date: {
        type: type.DATE,
        allowNull: true,
        defaultValue: type.NOW,
      },
      day_start_petty_cash_amt: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      day_close_petty_cash_amt: {
        type: type.STRING,
        allowNull: true,
      },
      invoice_range: {
        type: type.STRING,
        allowNull: true,
      },
      start_day_comment: {
        type: type.STRING,
        allowNull: true,
      },
      close_day_comment: {
        type: type.STRING,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
      sync_flag: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      cash_diff: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      close_day_amount: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      raw_cash_in_hand: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      start_date: {
        type: type.TIME,
        allowNull: true,
      },
      close_date: {
        type: type.TIME,
        allowNull: true,
      },
      revenue_id: {
        type: type.STRING,
        allowNull: true,
      },
      drawer_id: {
        type: type.STRING,
        allowNull: true,
      },
      day_start_currency_denomination: {
        type: type.JSON,
        allowNull: true,
      },
      day_close_currency_denomination: {
        type: type.JSON,
        allowNull: true,
      },
      day_close_transactions: {
        type: type.JSON,
        allowNull: true,
      },
      unique_id: {
        type: type.STRING,
        allowNull: true,
      },
      business_date: {
        type: type.STRING(30),
        allowNull: true,
      },
      audit_status: {
        type: type.STRING(50),
        defaultValue: 'Not Started',
      },
      audit_report: {
        type: type.JSON,
        allowNull: true,
      },
      opened_at: {
        type: type.DATE,
        allowNull: true,
      },
      closed_at: {
        type: type.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
    },
  );

  StartcloseDay.addStartday = async function (params) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // Set time to 00:00:00
      const start_day = todayStart.getTime(); // Get timestamp
      global.start_day_date = Date.now();
      params.start_date = start_day;

      if (params.id) {
        let id = params.id;
        delete params.id;
        await StartcloseDay.update(params, {
          where: {
            id,
          },
        });
      } else {
        await StartcloseDay.create(params);
      }

      return { status: 200, message: 'success' };
    } catch (error) {
      return { status: 400, message: 'error' };
    }
  };
  StartcloseDay.checkforStartday = async function (params) {
    let response = {};
    try {
      let result = await StartcloseDay.findAll({
        limit: 1,
        raw: true,
        where: {
          store_id: global.storeDetails.store_id,
        },
        order: [['id', 'DESC']],
      });
      if (result && result.length > 0) {
        result = result[0];
        if (
          result.start_day_date == undefined ||
          result.start_day_date == null
        ) {
          response.askforStartday = true;
        }
        response.prev_closing_balance = result.prev_closing_balance;
        response.raw_cash_in_hand = result.raw_cash_in_hand;
        response.start_day_date = result.start_day_date;
        response.id = result.id;
        global.start_day_date = result.start_day_date;
      } else {
        response.askforStartday = true;
      }
      if (response.askforStartday) {
        // previouse shift data by started or ended by any user
        const prevDayData = await StartcloseDay.findAll({
          limit: 1,
          raw: true,
          attributes: [
            'day_close_by_user',
            'day_close_date',
            'current_closing_balance',
          ],
          where: {
            store_id: global.storeDetails.store_id,
            tmpos_id: global.storeDetails.tmpos_id,
            start_day_date: {
              [type.Op.ne]: null,
            },
            day_close_date: {
              [type.Op.ne]: null,
            },
          },
          order: [['id', 'DESC']],
        });
        response.previousDayData = prevDayData;
      }
      return response;
    } catch (error) {
      response.askforStartday = false;
      return response;
    }
  };
  StartcloseDay.setSyncflag = async function (idList) {
    try {
      if (idList && idList.length > 0) {
        for (const day_end of idList) {
          if (day_end.status == 'success') {
            await StartcloseDay.update(
              {
                sync_flag: 1,
                unique_id: day_end.id,
              },
              {
                where: {
                  start_day_date: day_end.start_day_date,
                  store_id: day_end.store_id,
                },
              },
            );
          }
        }
      }
    } catch (error) {}
  };

  StartcloseDay.isdayStarted = async function () {
    let response = { isdayStarted: false };
    try {
      let result = await StartcloseDay.findAll({
        limit: 1,
        raw: true,
        where: {
          store_id: global.storeDetails.store_id,
          day_close_date: null,
        },
        order: [['id', 'DESC']],
      });
      if (result && result.length > 0) {
        result = result[0];
        response.isdayStarted = true;
        response.id = result.id;
        response.start_day_date = result.start_day_date;
        response.opening_balance = result.opening_balance;
      }
    } catch (error) {}
    return response;
  };

  StartcloseDay.updateCloseday = async function (params) {
    const reply = {};
    try {
      const closedayInfo = params.closedayInfo;
      const nextDayinfo = params.nextDayinfo;

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
      const close_day = todayEnd.getTime();
      closedayInfo.close_date = close_day;
      await StartcloseDay.update(closedayInfo, {
        where: { id: params.id },
      });

      let nextdayData = await StartcloseDay.create(nextDayinfo);
      if (nextdayData) {
        nextdayData = nextdayData.get({ plain: true });
        reply.nextdayId = nextdayData.id;
      }
    } catch (error) {
      console.log(error);
    }
    return reply;
  };
  return StartcloseDay;
}

module.exports = {
  getModel,
};
