const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const UserShift = sequelize.define(
    util.DBDetails.Tables.MPOS_USERSHIFT,
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
      shift_start_date: {
        type: type.TIME,
        allowNull: true,
      },
      shift_start_by_user: {
        type: type.STRING,
        allowNull: true,
      },
      shift_end_date: {
        type: type.TIME,
        allowNull: true,
      },
      shift_end_by_user: {
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
        type: type.TIME,
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
      shift_start_comment: {
        type: type.STRING,
        allowNull: true,
      },
      shift_end_comment: {
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
      close_shift_amount: {
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
      shift_start_currency_denomination: {
        type: type.JSON,
        allowNull: true,
      },
      shift_end_currency_denomination: {
        type: type.JSON,
        allowNull: true,
      },
      shift_end_transactions: {
        type: type.JSON,
        allowNull: true,
      },
      unique_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_USERSHIFT,
    },
  );

  UserShift.isusershiftStarted = async function (params) {
    let response = { shiftStarted: false };
    try {
      let result = await UserShift.findAll({
        limit: 1,
        raw: true,
        where: {
          shift_start_by_user: params.shift_start_by_user,
          store_id: params.store_id,
          tmpos_id: params.tmpos_id,
          shift_end_date: null,
          shift_start_date: {
            [type.Op.ne]: null,
          },
        },
        order: [['id', 'DESC']],
      });
      if (result && result.length > 0) {
        result = result[0];
        response.shiftStarted = true;
        response.id = result.id;
        response.shift_start_date = result.shift_start_date;
        response.prev_closing_balance = result.prev_closing_balance;
        response.raw_cash_in_hand = result.raw_cash_in_hand;
        response.opening_balance = result.opening_balance;
        response.drawer_id = result.drawer_id;
      }
    } catch (error) {}
    return response;
  };

  UserShift.checkIfshiftstarted = async function (params) {
    let response = { shiftStarted: false };
    try {
      let result = await UserShift.findAll({
        limit: 1,
        raw: true,
        where: {
          store_id: params.store_id,
          shift_start_by_user: params.shift_start_by_user,
          tmpos_id: params.tmpos_id,
          shift_end_date: null,
          shift_start_date: {
            [type.Op.ne]: null,
          },
        },
        order: [['id', 'DESC']],
      });

      if (result && result.length > 0) {
        result = result[0];
        response.shiftStarted = true;
        let prev_closing_balance = result.prev_closing_balance;
        response.prev_closing_balance = prev_closing_balance;
        response.raw_cash_in_hand = result.raw_cash_in_hand;
        response.id = result.id;
        response.shift_start_date = result.shift_start_date;
        response.opening_balance = result.opening_balance;
        response.drawer_id = result.drawer_id;
      } else {
        let previousShift = await UserShift.findAll({
          limit: 1,
          raw: true,
          attributes: ['current_closing_balance', 'raw_cash_in_hand'],
          where: {
            store_id: params.store_id,
            shift_start_by_user: params.shift_start_by_user,
            tmpos_id: params.tmpos_id,
          },
          order: [['id', 'DESC']],
        });
        if (previousShift.length > 0) {
          previousShift = previousShift[0];
          response.prev_closing_balance = previousShift.current_closing_balance;
          response.raw_cash_in_hand = previousShift.raw_cash_in_hand;
        }

        // previouse shift data by started or ended by any user
        let prevShiftData = await UserShift.findAll({
          limit: 1,
          raw: true,
          attributes: [
            'shift_end_by_user',
            'shift_end_date',
            'current_closing_balance',
          ],
          where: {
            store_id: params.store_id,
            // shift_start_by_user: params.shift_start_by_user,
            tmpos_id: params.tmpos_id,
            shift_end_date: {
              [type.Op.ne]: null,
            },
            shift_start_date: {
              [type.Op.ne]: null,
            },
          },
          order: [['id', 'DESC']],
        });
        response.shiftStarted = false;
        response.previousShiftData = prevShiftData;
      }
      // console.log(response);
      return response;
    } catch (error) {
      console.log(error);
      response.shiftStarted = false;
      return response;
    }
  };
  UserShift.addNewshift = async function (params) {
    try {
      if (params.id) {
        let id = params.id;
        delete params.id;
        await UserShift.update(params, {
          where: {
            id,
          },
        });
      } else {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0); // Set time to 00:00:00
        const start_day = todayStart.getTime(); // Get timestamp
        params.start_date = start_day;
        await UserShift.create(params);
      }

      return { status: 200, message: 'success' };
    } catch (error) {
      return { status: 400, message: 'error' };
    }
  };
  UserShift.closeuserShift = async function (closeshiftInfo, id) {
    let response = {};
    try {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
      const close_day = todayEnd.getTime();
      closeshiftInfo.close_date = close_day;
      await UserShift.update(closeshiftInfo, {
        where: { id },
      });
      response = { status: 200, message: 'success' };
    } catch (error) {
      response = { status: 400, message: 'error' };
    }
    return response;
  };

  UserShift.setSyncflag = async function (idList) {
    try {
      if (idList && idList.length > 0) {
        for (const shift_end of idList) {
          if (shift_end.status == 'success') {
            await UserShift.update(
              {
                sync_flag: 1,
              },
              {
                where: {
                  shift_start_date: shift_end.shift_start_date,
                  store_id: shift_end.store_id,
                },
              },
            );
          }
        }
      }
    } catch (error) {}
  };

  return UserShift;
}

module.exports = {
  getModel,
};
