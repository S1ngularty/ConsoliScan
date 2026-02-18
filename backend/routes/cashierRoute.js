/**
 * cashierRoute.js
 *
 * Routes for cashier-specific operations
 * All routes require authentication (cashier role)
 */

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const cashierController = require("../controllers/cashierController");

/* ═══════════════════════════════════════════════════════════════════════════
   CASHIER DASHBOARD ROUTES
   ═══════════════════════════════════════════════════════════════════════════ */

// Get dashboard statistics
router
  .route("/cashier/dashboard")
  .get(authMiddleware.verifyToken, cashierController.getDashboardStats);

// Get recent transactions
router
  .route("/cashier/recent-transactions")
  .get(authMiddleware.verifyToken, cashierController.getRecentTransactions);

// Get pending checkout queues
router
  .route("/cashier/pending-queues")
  .get(authMiddleware.verifyToken, cashierController.getPendingQueues);

// Get recent exchanges
router
  .route("/cashier/recent-exchanges")
  .get(authMiddleware.verifyToken, cashierController.getRecentExchanges);

// Get inventory with search, filters, and pagination
router
  .route("/cashier/inventory")
  .get(authMiddleware.verifyToken, cashierController.getInventory);

// Update product stock
router
  .route("/cashier/inventory/:productId/stock")
  .patch(authMiddleware.verifyToken, cashierController.updateStock);

// Get sales reports
router
  .route("/cashier/reports")
  .get(authMiddleware.verifyToken, cashierController.getSalesReports);

// Get transaction history
router
  .route("/cashier/transactions")
  .get(authMiddleware.verifyToken, cashierController.getTransactionHistory);

// Get low stock alerts
router
  .route("/cashier/low-stock-alerts")
  .get(authMiddleware.verifyToken, cashierController.getLowStockAlerts);

module.exports = router;
