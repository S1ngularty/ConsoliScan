const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { roleAccess } = require("../middlewares/authMiddleware");

// All expense routes require admin access
router.use(verifyToken);
router.use(roleAccess("admin"));

// Expense CRUD
router.post("/", expenseController.createExpense);
router.get("/", expenseController.getAllExpenses);
router.get("/analytics", expenseController.getExpenseAnalytics);
router.get("/:id", expenseController.getExpenseById);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
