const { ipcMain } = require('electron');
const EXPENSES_IPC = require('../util/IPC_Messages').EXPENSES_IPC;
let connection = require('../js/database');
const { sendLivesyncrequest } = require('../services/SyncService');

ipcMain.on(EXPENSES_IPC.UPDATE_EXPENSE, async (event, params) => {
  let response = await updateExpense(JSON.parse(params));
  if (response)
    event.reply(EXPENSES_IPC.UPDATE_EXPENSE_REPLY, JSON.stringify(response));
});

ipcMain.on(EXPENSES_IPC.DELETE_EXPENSE, async (event, params) => {
  let response = await deleteExpense(JSON.parse(params));
  if (response)
    event.reply(EXPENSES_IPC.UPDATE_EXPENSE_REPLY, JSON.stringify(response));
});

ipcMain.on(EXPENSES_IPC.ADD_EXPENSE, async (event, params) => {
  let response = await addExpense(JSON.parse(params));
  if (response)
    event.reply(EXPENSES_IPC.ADD_EXPENSE_REPLY, JSON.stringify(response));
});

ipcMain.on(EXPENSES_IPC.GET_EXPENSES, async (event, content) => {
  try {
    if (content) {
      content = JSON.parse(content);
      let params = { store_id: global.storeDetails.store_id };
      if (content.fromDate && content.toDate) {
        params.expense_time = {
          [connection.Sequelize.Op.between]: [content.fromDate, content.toDate],
        };
      }

      if (content.is_chargable != undefined) {
        params.is_chargable = content.is_chargable;
      }
      let expensesList = await getExpenses(params);
      if (expensesList) {
        event.reply(
          EXPENSES_IPC.GET_EXPENSES_REPLY,
          JSON.stringify({
            expensesList,
            type: content.type,
          }),
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(EXPENSES_IPC.GET_GRAPHDATA, async (event, params) => {
  try {
    if (params) {
      params = JSON.parse(params);
    }
    let response = await getexpensesGraphdata(params);
    if (response)
      event.reply(EXPENSES_IPC.GET_GRAPHDATA_REPLY, JSON.stringify(response));
  } catch (error) {
    console.log(error);
  }
});

//returns payment list for expenses
ipcMain.on(EXPENSES_IPC.GET_PAYMENT_MODES, async (event, content) => {
  try {
    let payments = await connection.Payment.findAll({
      raw: true,
      where: {
        //NEW STOREWISE CHANGE 17 JAN 2020
        store_id: global.storeDetails.store_id,
      },
    });
    event.reply(EXPENSES_IPC.GET_PAYMENT_MODES_REPLY, JSON.stringify(payments));
  } catch (error) {}
});

/**
 * Returns the graph data
 * @param {Parameter to filter the graph data} content
 */
async function getexpensesGraphdata(content) {
  try {
    let response = {};
    let params = { store_id: global.storeDetails.store_id };
    if (content) {
      if (content.fromDate && content.toDate) {
        params.expense_time = {
          [connection.Sequelize.Op.between]: [content.fromDate, content.toDate],
        };
      }
      let expensesList = await getExpenses(params);
      response.expensesList = expensesList;
    }
    return response;
  } catch (error) {
    console.log(error);
  }
}
/**
 * add new expense
 * @param {Expense data} params
 */
async function addExpense(params) {
  try {
    let result = await connection.Expenses.create(params);
    sendLivesyncrequest();
    return result;
  } catch (error) {
    console.log(error);
  }
}
/**
 * Deletes the expense which is not synced
 * @param {Expense info} params
 */
async function deleteExpense(params) {
  if (params) {
    try {
      await connection.Expenses.destroy({
        where: {
          expense_id: params.expense_id,
          sync_flag: 0,
        },
      });
      sendLivesyncrequest();
      return 'success';
    } catch (error) {
      console.log(error);

      return 'error';
    }
  }
  return 'error';
}

/**
 * Updates the expense which is not synced
 * @param {Expense info} params
 */
async function updateExpense(params) {
  if (params) {
    try {
      await connection.Expenses.update(params.updateData, {
        where: {
          expense_id: params.expense_id,
          // sync_flag: 0
        },
      });
      sendLivesyncrequest();
      return 'success';
    } catch (error) {
      console.log(error);

      return 'error';
    }
  }
  return 'error';
}

ipcMain.on(EXPENSES_IPC.ADDORUPDATE_CATEGORY, async (event, params) => {
  try {
    params = JSON.parse(params);
    let flag = params.flag; // 0 for add 1 for update,
    delete params.flag;

    if (flag == 0) {
      response = await addCategory(params);
    } else {
      response = await connection.ExpensesCategory.update(params, {
        where: { ref_id: params.ref_id },
      });
    }
    event.reply(EXPENSES_IPC.ADDORUPDATE_CATEGORY_REPLY, undefined);
  } catch (error) {}
});

ipcMain.on(EXPENSES_IPC.ADDORUPDATE_SUBCATEGORY, async (event, params) => {
  try {
    params = JSON.parse(params);
    let flag = params.flag; // 0 for add 1 for update,
    delete params.flag;

    if (flag == 0) {
      response = await addSubCategory(params);
    } else {
      response = await connection.ExpensesSubcategory.update(params, {
        where: { ref_id: params.ref_id },
      });
    }
    event.reply(EXPENSES_IPC.ADDORUPDATE_SUBCATEGORY_REPLY, undefined);
  } catch (error) {}
});
ipcMain.on(EXPENSES_IPC.GET_EXPENSEDATA, async (event, params) => {
  try {
    let expenseCategories = await connection.ExpensesCategory.findAll({
      raw: true,
      where: { store_id: global.storeDetails.store_id },
    });
    let expenseSubcategories = await connection.ExpensesSubcategory.findAll({
      raw: true,
      where: { store_id: global.storeDetails.store_id },
      include: [
        {
          model: connection.ExpensesCategory,
          attributes: ['category_name'],
        },
      ],
    });
    let response = {
      expenseCategories,
      expenseSubcategories,
    };
    event.reply(EXPENSES_IPC.GET_EXPENSEDATA_REPLY, JSON.stringify(response));
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on(EXPENSES_IPC.GET_OVERVIEWDATA, async (event, params) => {
  if (params) {
    try {
      params = JSON.parse(params);
      let response = await getOverviewwindowData(params);
      if (response)
        event.reply(
          EXPENSES_IPC.GET_OVERVIEWDATA_REPLY,
          JSON.stringify(response),
        );
    } catch (error) {
      console.log(error);
    }
  }
});

/**
 * Returns the overview window data.
 * @param {Parameters} params
 */
async function getOverviewwindowData(params) {
  try {
    let todaysExpenseslist = await getExpenses({
      store_id: global.storeDetails.store_id,
      expense_time: {
        [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
      },
    });

    let todaysExpenseamount = await connection.Expenses.sum('amount', {
      where: {
        store_id: global.storeDetails.store_id,
        expense_time: {
          [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
        },
      },
    });

    let currentmonthsExpenses = await connection.Expenses.sum('amount', {
      where: {
        store_id: global.storeDetails.store_id,
        expense_time: {
          [connection.Sequelize.Op.between]: [
            params.monthStart,
            params.monthEnd,
          ],
        },
      },
    });
    let totalExpenseamount = await connection.Expenses.sum('amount', {
      where: {
        store_id: global.storeDetails.store_id,
      },
    });

    let response = {
      todaysExpenseslist,
      totalExpenseamount,
      todaysExpenseamount,
      currentmonthsExpenses,
    };
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function getExpenses(params) {
  // console.log(params);
  let expenses = [];
  try {
    expenses = await connection.Expenses.findAll({
      raw: true,
      where: params,
    });
  } catch (error) {
    console.log(error);
  }
  return expenses;
}

async function addCategory(params) {
  try {
    let result = await connection.ExpensesCategory.create(params);
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function addSubCategory(params) {
  try {
    let result = await connection.ExpensesSubcategory.create(params);
    return result;
  } catch (error) {
    console.log(error);
  }
}
