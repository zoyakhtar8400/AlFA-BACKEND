const express = require('express');
const router = express.Router();
const { ResponseMessage } = require('../error/ResponseMessage');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all expense routes
router.use(auth);

// GET all expenses for the current store
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { Op } = require('sequelize');
    let store_id = req.query.store_id || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';
    const where = {};
    if (store_id && store_id !== 'All') {
      try {
        const storeMatch = await global.serverdbConnection.Store.findOne({
          where: {
            [Op.or]: [
              { store_id: store_id },
              { id: isNaN(Number(store_id)) ? -1 : Number(store_id) },
              { store_name: store_id },
              { name: store_id }
            ]
          },
          raw: true
        });
        if (storeMatch) {
          store_id = storeMatch.store_id || `STORE_${storeMatch.id}`;
        }
      } catch (e) { }

      const cleanNum = String(store_id).replace(/\D/g, '') || '1';
      const storeVariants = [store_id, cleanNum, `STORE_${cleanNum}`, `store_${cleanNum}`].filter(Boolean);
      if (store_id === 'STORE_1' || cleanNum === '1' || String(store_id).toLowerCase().includes('main')) {
        where[Op.or] = [
          ...storeVariants.map(v => ({ store_id: v })),
          { store_id: null },
          { store_id: '' }
        ];
      } else {
        where[Op.or] = storeVariants.map(v => ({ store_id: v }));
      }
    }

    const expenses = await global.serverdbConnection.Expenses.findAll({
      where,
      order: [['expense_date', 'DESC'], ['id', 'DESC']],
      raw: true
    });

    const mapped = (expenses || []).map(exp => ({
      ...exp,
      expense_id: exp.expense_id || exp.id
    }));

    response.body = mapped;
    response.data = mapped;
    res.json(response);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    response.setStatus(500);
    response.setMessage('Failed to fetch expenses: ' + error.message);
    res.status(500).json(response);
  }
});

// POST create a new expense
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { Op } = require('sequelize');
    let store_id = req.body.store_id || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]) || 'STORE_1';
    if (store_id && store_id !== 'All') {
      try {
        const storeMatch = await global.serverdbConnection.Store.findOne({
          where: {
            [Op.or]: [
              { store_id: store_id },
              { id: isNaN(Number(store_id)) ? -1 : Number(store_id) },
              { store_name: store_id },
              { name: store_id }
            ]
          },
          raw: true
        });
        if (storeMatch) {
          store_id = storeMatch.store_id || `STORE_${storeMatch.id}`;
        }
      } catch (e) { }
    }

    const {
      expense_id,
      expenseNo,
      expense_no,
      expense_date,
      date,
      expenseDate,
      field1,
      userName,
      user_name,
      employee,
      amount,
      payment_mode,
      payType,
      paymentMode,
      paidFrom,
      description,
      remark,
      remarks,
      expenseCharge,
      expenseReason
    } = req.body;

    const rawExpId = expense_id || expenseNo || expense_no;
    let numericExpenseId = rawExpId ? parseInt(String(rawExpId).replace(/\D/g, ''), 10) : null;
    
    if (!numericExpenseId || isNaN(numericExpenseId)) {
      const maxExp = await global.serverdbConnection.Expenses.max('expense_id', { where: { store_id } });
      numericExpenseId = (maxExp ? Number(maxExp) : 0) + 1;
    }

    const resolvedDate = expense_date || date || expenseDate || new Date().toISOString().split('T')[0];
    const resolvedUser = field1 || userName || user_name || employee || req.user?.name || 'Staff';
    const resolvedPayMode = payment_mode || payType || paymentMode || paidFrom || 'Cash';
    const resolvedDesc = description || remark || remarks || expenseCharge || expenseReason || '';
    const resolvedAmount = Number(amount || 0);
    const currentTime = new Date().toTimeString().split(' ')[0];

    const newExpense = await global.serverdbConnection.Expenses.create({
      store_id,
      expense_id: numericExpenseId,
      field2: String(numericExpenseId),
      expense_date: resolvedDate,
      expense_time: currentTime,
      field1: resolvedUser,
      amount: resolvedAmount,
      payment_mode: resolvedPayMode,
      description: resolvedDesc,
      category_id: 1,
      sub_category_id: 1,
      is_chargable: 0,
      sync_flag: 0
    });

    const mapped = {
      ...newExpense.toJSON(),
      expense_id: numericExpenseId
    };

    response.body = mapped;
    response.data = mapped;
    response.setMessage('Expense entry created successfully in PostgreSQL');
    res.json(response);
  } catch (error) {
    console.error('Error creating expense:', error);
    response.setStatus(500);
    response.setMessage('Failed to create expense: ' + error.message);
    res.status(500).json(response);
  }
});

// PUT update an existing expense
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const expenseId = req.params.id;
    const { expense_id, expense_date, field1, amount, payment_mode, description } = req.body;
    
    const expense = await global.serverdbConnection.Expenses.findByPk(expenseId);
    if (!expense) {
      response.setStatus(404);
      response.setMessage('Expense not found');
      return res.status(404).json(response);
    }

    const numericExpenseId = expense_id ? parseInt(String(expense_id).replace(/\D/g, ''), 10) : undefined;
    await expense.update({
      ...(numericExpenseId ? { expense_id: numericExpenseId } : {}),
      field2: expense_id || expense.field2,
      expense_date: expense_date || expense.expense_date,
      field1: field1 || expense.field1,
      amount: amount !== undefined ? Number(amount) : expense.amount,
      payment_mode: payment_mode || expense.payment_mode,
      description: description !== undefined ? description : expense.description,
      sync_flag: 0
    });

    response.body = expense;
    response.setMessage('Expense entry updated successfully');
    res.json(response);
  } catch (error) {
    console.error('Error updating expense:', error);
    response.setStatus(500);
    response.setMessage('Failed to update expense: ' + error.message);
    res.status(500).json(response);
  }
});

// DELETE an expense
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const expenseId = req.params.id;
    
    const expense = await global.serverdbConnection.Expenses.findByPk(expenseId);
    if (!expense) {
      response.setStatus(404);
      response.setMessage('Expense not found');
      return res.status(404).json(response);
    }

    // Check permissions
    const store_id = req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]);
    if (store_id && String(expense.store_id) !== String(store_id) && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPERADMIN') {
      response.setStatus(403);
      response.setMessage('Unauthorized to delete this expense');
      return res.status(403).json(response);
    }

    await expense.destroy();

    response.setMessage('Expense entry deleted successfully');
    res.json(response);
  } catch (error) {
    console.error('Error deleting expense:', error);
    response.setStatus(500);
    response.setMessage('Failed to delete expense: ' + error.message);
    res.status(500).json(response);
  }
});

module.exports = router;
