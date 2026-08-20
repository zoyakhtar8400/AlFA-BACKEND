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
    const store_id = req.query.store_id || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]);
    if (!store_id) {
      response.setStatus(400);
      response.setMessage('Store ID is required');
      return res.status(400).json(response);
    }

    const expenses = await global.serverdbConnection.Expenses.findAll({
      where: { store_id },
      order: [['expense_date', 'DESC'], ['id', 'DESC']],
      raw: true
    });

    response.body = expenses;
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
    const store_id = req.body.store_id || req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]);
    if (!store_id) {
      response.setStatus(400);
      response.setMessage('Store ID is required');
      return res.status(400).json(response);
    }

    const { expense_id, expense_date, field1, amount, payment_mode, description } = req.body;

    const newExpense = await global.serverdbConnection.Expenses.create({
      store_id,
      expense_id,
      expense_date,
      field1, // username
      amount,
      payment_mode,
      description,
      sync_flag: 0
    });

    response.body = newExpense;
    response.setMessage('Expense entry created successfully');
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

    // Check permissions (make sure it belongs to allowed store)
    const store_id = req.user?.store_id || (req.user?.assigned_outlets && req.user.assigned_outlets[0]);
    if (store_id && String(expense.store_id) !== String(store_id) && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPERADMIN') {
      response.setStatus(403);
      response.setMessage('Unauthorized to edit this expense');
      return res.status(403).json(response);
    }

    await expense.update({
      expense_id,
      expense_date,
      field1,
      amount,
      payment_mode,
      description,
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
