const expenseService = require("../services/expenseService");

// ═══════════════════════════════════════════════
//  CREATE EXPENSE
// ═══════════════════════════════════════════════
exports.createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      recordedBy: req.user.id,
    };

    const expense = await expenseService.createExpense(expenseData);

    res.status(201).json({
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  GET ALL EXPENSES
// ═══════════════════════════════════════════════
exports.getAllExpenses = async (req, res) => {
  try {
    const result = await expenseService.getAllExpenses(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  GET EXPENSE BY ID
// ═══════════════════════════════════════════════
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expense",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  UPDATE EXPENSE
// ═══════════════════════════════════════════════
exports.updateExpense = async (req, res) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  DELETE EXPENSE
// ═══════════════════════════════════════════════
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await expenseService.deleteExpense(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  GET EXPENSE ANALYTICS
// ═══════════════════════════════════════════════
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;
    const analytics = await expenseService.getExpenseAnalytics(
      parseInt(timeRange),
    );

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get expense analytics",
      error: error.message,
    });
  }
};
