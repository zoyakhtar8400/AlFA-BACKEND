const util = require('../util/DBUtil');
const { Sequelize } = require('sequelize');

function getModel(sequelize, type) {
  const Expense = sequelize.define(
    util.DBDetails.Tables.MPOS_EXPENSE,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      expense_id: {
        type: type.INTEGER,
      },
      category_id: {
        type: type.INTEGER,
      },
      sub_category_id: {
        type: type.INTEGER,
      },
      amount: {
        type: type.DECIMAL(10, 2),
      },
      expense_time: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      description: {
        type: type.STRING,
        allowNull: true,
      },
      is_chargable: {
        //1 Non chargable, 0 chargable
        type: type.INTEGER,
        defaultValue: 0,
      },
      category_name: {
        type: type.STRING,
        allowNull: true,
      },
      sub_category_name: {
        type: type.STRING,
        allowNull: true,
      },
      sync_flag: {
        //1 Synced
        type: type.INTEGER,
        defaultValue: 0,
      },
      expense_date: {
        type: type.DATEONLY,
        allowNull: true,
        defaultValue: type.NOW,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      payment_mode: {
        type: type.STRING,
        allowNull: true,
      },
      field1: {
        // used as username
        type: type.STRING,
        allowNull: true,
      },
      field2: {
        type: type.STRING,
        allowNull: true,
      },
      field3: {
        type: type.STRING,
        allowNull: true,
      },
      field4: {
        type: type.STRING,
        allowNull: true,
      },
      revenue_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_EXPENSE,
    },
  );

  Expense.getExpensestotal = async function (params) {
    let expensesTotal = 0;
    let expenseInCashOnly = 0;
    try {
      let whereData = {
        store_id: params.store_id,
      };
      if (params.fromDate && params.toDate) {
        whereData.expense_time = {
          [type.Op.between]: [params.fromDate, params.toDate],
        };
      }
      if (params.is_chargable) {
        whereData.is_chargable = params.is_chargable;
      }
      expensesTotal = await Expense.sum('amount', {
        where: whereData,
      });
      Object.assign(whereData, { payment_mode: 'Cash' });
      expenseInCashOnly = await Expense.sum('amount', {
        where: whereData,
      });
      delete whereData.payment_mode;
    } catch (error) {
      expensesTotal = 0;
      console.log(error);
    }
    return { expensesTotal, expenseInCashOnly };
  };

  Expense.getExpensestotalAsPerUser = async function (params) {
    let expensesTotal = 0;
    let expenseInCashOnly = 0;
    try {
      const whereData = {
        store_id: params.store_id,
      };
      if (params.user_id) {
        Object.assign(whereData, {
          field1: params.user_id,
        });
      }
      if (params.fromDate && params.toDate) {
        whereData.expense_time = {
          [type.Op.between]: [params.fromDate, params.toDate],
        };
      }
      if (params.is_chargable) {
        whereData.is_chargable = params.is_chargable;
      }
      expensesTotal = await Expense.sum('amount', {
        where: whereData,
      });
      Object.assign(whereData, { payment_mode: 'Cash' });
      expenseInCashOnly = await Expense.sum('amount', {
        where: whereData,
      });
      delete whereData.payment_mode;
    } catch (error) {
      expensesTotal = 0;
      console.log(error);
    }
    return { expensesTotal, expenseInCashOnly };
  };

  Expense.getExpensesPaymentData = async function (params) {
    let expensesPaymentData;
    try {
      const whereData = {
        store_id: params.store_id,
      };
      if (params.fromDate && params.toDate) {
        whereData.expense_time = {
          [type.Op.between]: [params.fromDate, params.toDate],
        };
      }
      expensesPaymentData = await Expense.findAll({
        raw: true,
        attributes: [
          'payment_mode',
          [Sequelize.fn('sum', Sequelize.col('amount')), 'amount'],
        ],
        where: whereData,
        group: ['payment_mode'],
      });
    } catch (error) {
      console.log(error);
    }
    return expensesPaymentData;
  };

  Expense.getDataforstartendDayreport = async function (params) {
    let data = {};
    try {
      params.is_chargable = 0;
      let chargable = await Expense.getExpensestotal(params);
      params.is_chargable = 1;
      let non_chargable = await Expense.getExpensestotal(params);
      delete params.is_chargable;
      let total = await Expense.getExpensestotal(params);
      let expensesPaymentData = await Expense.getExpensesPaymentData(params);
      data = {
        chargable,
        non_chargable,
        total,
        expensesPaymentData,
      };
    } catch (error) {
      console.log(error);
    }
    return data;
  };
  return Expense;
}

module.exports = {
  getModel,
};
